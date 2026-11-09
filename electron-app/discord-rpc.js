
const GATEWAY = 'wss://gateway.discord.gg/?v=10&encoding=json';
const APPLICATION_ID = (process.env.DISCORD_APPLICATION_ID || '').trim();
const SEND_GAP_MS = 700;
const API = 'https://discord.com/api/v9';
const STATUSES = ['online', 'idle', 'dnd', 'invisible'];
const normStatus = (s) => (STATUSES.indexOf(String(s)) >= 0 ? String(s) : 'online');

class DiscordRpc {
  constructor(applicationId, status) {
    this.applicationId = (applicationId || APPLICATION_ID || '').trim();
    this.status = normStatus(status);
    this.ws = null;
    this.token = null;
    this.seq = null;
    this.sessionId = null;
    this.resumeUrl = null;
    this.hbTimer = null;
    this.connected = false;
    this._imgCache = this._loadImageCache();
    this._imgFail = {};
    this._imgInflight = {};
    this._uploadChain = Promise.resolve();
    this._lastSendAt = 0;
    this._pending = null;
    this._sending = false;
    this._dirty = false;
    this.log = (...a) => console.log('[discord-rpc]', ...a);
  }

  _loadImageCache() {
    try {
      const p = require('path').join(require('electron').app.getPath('userData'), 'image-assets.json');
      const o = JSON.parse(require('fs').readFileSync(p, 'utf8'));
      return o && typeof o === 'object' ? o : {};
    } catch (e) { return {}; }
  }
  _saveImageCache() {
    try {
      const fs = require('fs');
      const p = require('path').join(require('electron').app.getPath('userData'), 'image-assets.json');
      const keys = Object.keys(this._imgCache);
      while (keys.length > 400) this._imgCache[keys.shift()];
      fs.writeFileSync(p, JSON.stringify(this._imgCache), 'utf8');
    } catch (e) { }
  }

  async getUserInfo(token) {
    const get = (h) => fetch(API + '/users/@me', { headers: { Authorization: h } });
    let r = await get(token);
    if (r.status === 401) r = await get('Bearer ' + token);
    if (!r.ok) throw new Error('discord /users/@me -> ' + r.status);
    const j = await r.json();
    return { username: j.username, name: j.global_name || j.username, avatar: j.avatar };
  }

  _cachedImage(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('mp:')) return url;
    if (!/^https?:\/\//.test(url)) return null;
    return this._imgCache[url] || null;
  }

  async resolveImage(url) {
    const hit = this._cachedImage(url);
    if (hit) return hit;
    if (!url || typeof url !== 'string' || !/^https?:\/\//.test(url)) return null;
    if (!this.token) return null;
    if (this._imgFail[url] && Date.now() < this._imgFail[url]) return null;
    if (this._imgInflight[url]) return this._imgInflight[url];

    const run = async () => {
      try {
        const r = await fetch(API + '/applications/' + this.applicationId + '/external-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: this.token, 'User-Agent': 'Mozilla/5.0' },
          body: JSON.stringify({ urls: [url] }),
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) {
          const ra = parseInt(r.headers.get('retry-after') || '', 10);
          const wait = r.status === 429 ? (ra > 0 ? ra : 15) : 10;
          this._imgFail[url] = Date.now() + wait * 1000;
          this.log('external-assets HTTP ' + r.status + ' -> cooldown ' + wait + 's');
          return null;
        }
        const j = await r.json();
        const p = j && j[0] && j[0].external_asset_path;
        if (!p) { this.log('external-assets empty response'); return null; }
        const asset = 'mp:' + p;
        this._imgCache[url] = asset;
        delete this._imgFail[url];
        this._saveImageCache();
        this.log('asset ok: ' + url.slice(0, 60) + ' -> ' + asset.slice(0, 30) + '...');
        return asset;
      } catch (e) {
        this._imgFail[url] = Date.now() + 10000;
        this.log('external-assets failed: ' + e.message);
        return null;
      }
    };

    const next = this._uploadChain.then(run, run);
    this._uploadChain = next.then(() => {}, () => {});
    this._imgInflight[url] = next;
    next.then(() => { delete this._imgInflight[url]; }, () => { delete this._imgInflight[url]; });
    return next;
  }

  connect(token) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN
                    || this.ws.readyState === WebSocket.CONNECTING)
        && this.token === token) return;
    this.disconnect();
    this.token = token;
    this._open();
  }

  _open() {
    const url = this.resumeUrl || GATEWAY;
    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      this.log('ws construct failed:', e.message);
      return;
    }

    this.ws.onopen = () => this.log('gateway open');
    this.ws.onerror = (e) => this.log('gateway error:', (e && e.message) || 'unknown');

    this.ws.onmessage = (ev) => {
      let p;
      try { p = JSON.parse(ev.data); } catch (e) { return; }
      if (p.s != null) this.seq = p.s;
      if (p.op === 10) this._hello(p.d);
      else if (p.op === 1) this._heartbeat();
      else if (p.op === 11) { }
      else if (p.op === 7) this._reconnect();
      else if (p.op === 9) this._identify();
      else if (p.op === 0 && p.t === 'PRESENCE_UPDATE') {
        this.log('PRESENCE_UPDATE echo: ' + JSON.stringify(p.d).slice(0, 300));
      } else if (p.op === 0 && p.t === 'READY') {
        this.sessionId = p.d.session_id;
        this.resumeUrl = p.d.resume_gateway_url + '/?v=10&encoding=json';
        this.connected = true;
        this.log('ready as session', this.sessionId);
      }
    };

    this.ws.onclose = (ev) => {
      this.connected = false;
      this._stopHeartbeat();
      this.log('gateway closed', ev.code, ev.reason || '');
      if (ev.code === 4000) setTimeout(() => this._open(), 200);
      else { this.resumeUrl = null; this.sessionId = null; }
    };
  }

  _hello(d) {
    this._startHeartbeat(d.heartbeat_interval);
    if (this.seq && this.sessionId) this._resume();
    else this._identify();
  }

  _identify() {
    this._send(2, {
      token: this.token,
      properties: {
        os: process.platform,
        browser: 'airbeats',
        device: 'airbeats',
      },
      compress: false,
    });
  }

  _resume() {
    this._send(6, { token: this.token, session_id: this.sessionId, seq: this.seq });
  }

  _reconnect() {
    try { this.ws.close(4000, 'reconnect'); } catch (e) { }
  }

  _startHeartbeat(interval) {
    this._stopHeartbeat();
    this.hbTimer = setInterval(() => this._heartbeat(), interval);
  }

  _stopHeartbeat() {
    if (this.hbTimer) { clearInterval(this.hbTimer); this.hbTimer = null; }
  }

  _heartbeat() {
    this._send(1, this.seq || null);
  }

  _send(op, d) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ op, d }));
      return true;
    }
    return false;
  }

  async _waitConnected(ms = 8000) {
    const t0 = Date.now();
    while (!this.connected && Date.now() - t0 < ms) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return this.connected;
  }

  async setActivity(a) {
    this._lastActivity = a && (a.details || a.state) ? a : null;
    this._pending = a;
    if (this._sending) { this._dirty = true; return true; }
    this._sending = true;
    let ok = false;
    try {
      do {
        this._dirty = false;
        const wait = SEND_GAP_MS - (Date.now() - this._lastSendAt);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        ok = await this._sendActivity(this._pending);
        this._lastSendAt = Date.now();
        if (this._dirty) await new Promise((r) => setTimeout(r, 150));
      } while (this._dirty);
    } finally {
      this._sending = false;
    }
    return ok;
  }

  async fetchStatus() {
    if (!this.token) return null;
    try {
      const r = await fetch(API + '/users/@me/settings', {
        headers: { Authorization: this.token, 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) return null;
      const j = await r.json();
      return STATUSES.indexOf(j && j.status) >= 0 ? j.status : null;
    } catch (e) { return null; }
  }

  async pushStatus() {
    if (!this.token) return false;
    try {
      const r = await fetch(API + '/users/@me/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: this.token, 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({ status: this.status }),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) this.log('status PATCH HTTP ' + r.status);
      return r.ok;
    } catch (e) {
      this.log('status PATCH failed: ' + e.message);
      return false;
    }
  }

  async setStatus(s) {
    this.status = normStatus(s);
    const ok = await this.pushStatus();
    if (this.connected) {
      if (this._lastActivity) this.setActivity(this._lastActivity);
      else this.clearActivity();
    }
    return { status: this.status, ok };
  }

  async _sendActivity(a) {
    if (!this.token) return false;
    if (!this.ws || (this.ws.readyState !== WebSocket.OPEN
                     && this.ws.readyState !== WebSocket.CONNECTING)) {
      this.connected = false;
      this._open();
    }
    const ok = await this._waitConnected();
    if (!ok) { this.log('not connected, skipping activity'); return false; }

    if (!a || (!a.details && !a.state)) {
      this.log('SEND clear presence');
      return this.clearActivity();
    }

    let largeImage = this._cachedImage(a.largeImage);
    let smallImage = this._cachedImage(a.smallImage);
    const needWarm = [];
    if (a.largeImage && /^https?:/.test(String(a.largeImage)) && !largeImage) needWarm.push(a.largeImage);
    if (a.smallImage && /^https?:/.test(String(a.smallImage)) && !smallImage) needWarm.push(a.smallImage);
    if (needWarm.length) {
      Promise.all(needWarm.map((u) => this.resolveImage(u)))
        .then((res) => {
          const got = res.filter(Boolean).length;
          if (got && this._pending === a && this.connected) {
            this.log('asset warm done -> re-send with images');
            this.setActivity(a);
          } else if (got) {
            this.log('asset warm done, newer payload already pending');
          }
        })
        .catch(() => {});
    }

    const buttons = (Array.isArray(a.buttons) ? a.buttons : [])
      .filter((b) => b && b.label && /^https?:\/\//.test(String(b.url)))
      .slice(0, 2);

    const activity = {
      name: 'AirBeats',
      type: 2,
      ...(this.applicationId ? { application_id: this.applicationId } : {}),
      ...(a.statusDisplayType ? { status_display_type: a.statusDisplayType } : {}),
      ...(a.detailsUrl ? { details_url: String(a.detailsUrl) } : {}),
      state: a.state || null,
      details: a.details || null,
      timestamps: (a.startTimestamp || a.endTimestamp)
        ? {
            start: a.startTimestamp ? Math.floor(a.startTimestamp) : undefined,
            end: a.endTimestamp ? Math.floor(a.endTimestamp) : undefined,
          }
        : undefined,
      assets: (largeImage || smallImage)
        ? {
            large_image: largeImage || undefined,
            small_image: smallImage || undefined,
            large_text: a.largeText || undefined,
            small_text: a.smallText || undefined,
          }
        : undefined,
      ...(buttons.length
        ? {
            buttons: buttons.map((b) => String(b.label).slice(0, 32)),
            metadata: { button_urls: buttons.map((b) => String(b.url)) },
          }
        : {}),
    };

    const payload = {
      since: null,
      activities: [activity],
      status: this.status,
      afk: false,
    };
    this.log('SEND presence: ' + JSON.stringify(payload).slice(0, 1500));
    return this._send(3, payload);
  }

  async clearActivity() {
    if (!this.token) return false;
    if (!this.connected) return false;
    this.log('SEND clear presence (activities: [])');
    return this._send(3, { since: null, activities: [], status: this.status, afk: false });
  }

  disconnect() {
    this._stopHeartbeat();
    this.connected = false;
    this.resumeUrl = null;
    this.sessionId = null;
    if (this.ws) {
      try { this.ws.close(1000, 'client disconnect'); } catch (e) { }
      this.ws = null;
    }
  }
}

module.exports = { DiscordRpc };
