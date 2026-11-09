// AirBeats desktop — account page (Google + Discord tabs, token viewer, premium prompt)
// Loaded as a classic script after script.js (desktop-native implementation).

window.discordCardHtml = function () {
    return `
          <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; font-size: 20px;">${window.airBrandIcon('discord', 18, '#5865F2')} Discord Rich Presence</h3>
              <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">
                  Show what you're listening to on your Discord profile. You log in here, inside AirBeats — the Discord desktop app is not needed.
              </p>

              <div id="discord-status-box" style="margin-bottom: 16px; font-size: 14px; color: var(--text-secondary);"></div>

              <style>
                  .m3-switch{position:relative;display:inline-flex;align-items:center;width:52px;height:32px;flex:none;cursor:pointer}
                  .m3-switch input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
                  .m3-track{position:absolute;inset:0;border-radius:16px;background:#9e9e9e;transition:background .2s ease}
                  .m3-knob{position:absolute;top:8px;left:8px;width:16px;height:16px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .22s cubic-bezier(.2,0,0,1),top .22s cubic-bezier(.2,0,0,1),width .22s cubic-bezier(.2,0,0,1),height .22s cubic-bezier(.2,0,0,1),font-size .22s ease}
                  .m3-knob i{line-height:1}
                  .m3-knob svg{width:0;height:0;color:#5865F2;transition:width .2s ease,height .2s ease}
                  .m3-switch input:checked ~ .m3-track .m3-knob svg{width:13px;height:13px}
                  .m3-switch:hover .m3-track{background:#868686}
                  .m3-switch input:checked ~ .m3-track{background:var(--accent)}
                  .m3-switch input:checked:hover ~ .m3-track{filter:brightness(1.08)}
                  .m3-switch input:checked ~ .m3-track .m3-knob{top:4px;left:24px;width:24px;height:24px;font-size:13px}
                  .dc-chip{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:999px;border:1px solid var(--text-secondary);background:transparent;color:var(--text-primary);font-size:13px;cursor:pointer;transition:border-color .18s ease,background .18s ease,color .18s ease}
                  .dc-chip:hover{border-color:var(--accent)}
                  .dc-chip.is-on{background:var(--accent);border-color:var(--accent);color:#fff}
              </style>

              <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: center;">
                  <button id="btn-discord-login" class="btn" style="background: #5865F2; color: #fff; padding: 12px 24px; border-radius: 8px; cursor: pointer;" onclick="window.discordLogin()">
                      ${window.airBrandIcon('discord', 15)} Login with Discord
                  </button>
                  <button id="btn-discord-logout" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer; display: none;" onclick="window.discordLogout()">
                      <i class="fas fa-right-from-bracket"></i> Logout
                  </button>

                  <div style="display: inline-flex; align-items: center; gap: 10px; margin-left: auto; user-select: none;">
                      <span style="font-size: 14px; color: var(--text-secondary);">Rich Presence</span>
                      <span style="font-size: 11px; color: var(--text-secondary); opacity: .7;">Ctrl+Shift+D</span>
                      <label class="m3-switch" title="Discord Rich Presence on / off">
                          <input type="checkbox" id="btn-discord-rpc" onchange="window.discordToggleRpc(this)">
                          <span class="m3-track"><span class="m3-knob">${window.airBrandIcon('discord', 10)}</span></span>
                      </label>
                  </div>
              </div>

              <div style="display: flex; align-items: center; gap: 12px; margin-top: 18px; flex-wrap: wrap;">
                  <span style="font-size: 14px; color: var(--text-secondary);">Status</span>
                  <div id="discord-status-chips" style="display: inline-flex; gap: 8px; flex-wrap: wrap;">
                      <button class="dc-chip" data-status="online" onclick="window.discordChooseStatus('online')"><i class="fas fa-circle" style="color: #23a55a;"></i> Online</button>
                      <button class="dc-chip" data-status="idle" onclick="window.discordChooseStatus('idle')"><i class="fas fa-moon" style="color: #f0b232;"></i> Idle</button>
                      <button class="dc-chip" data-status="dnd" onclick="window.discordChooseStatus('dnd')"><i class="fas fa-minus-circle" style="color: #f23f43;"></i> DND</button>
                      <button class="dc-chip" data-status="invisible" onclick="window.discordChooseStatus('invisible')"><i class="fas fa-eye-slash" style="color: #80848e;"></i> Invisible</button>
                  </div>
              </div>

              <div style="display: flex; align-items: center; gap: 10px; margin-top: 16px; user-select: none;">
                  <div>
                      <div style="font-size: 14px;">Use details instead of state</div>
                      <div style="font-size: 12px; color: var(--text-secondary);">Show the song title instead of the artist name</div>
                  </div>
                  <label class="m3-switch" style="margin-left: auto;" title="Use details instead of state">
                      <input type="checkbox" id="btn-discord-details" onchange="window.discordToggleDetails(this)">
                      <span class="m3-track"><span class="m3-knob"></span></span>
                  </label>
              </div>

              <div id="discord-preview" style="display: none; margin-top: 18px;">
                  <div style="display: flex; gap: 12px; align-items: center; padding: 12px; border-radius: 12px; background: var(--app-bg);">
                      <img id="discord-preview-art" alt="" style="width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex: none;">
                      <div style="flex: 1; min-width: 0;">
                          <div id="discord-preview-title" style="font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
                          <div id="discord-preview-artist" style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
                          <div style="position: relative; height: 3px; margin-top: 9px; border-radius: 2px; background: rgba(128, 128, 128, 0.3);">
                              <div id="discord-preview-bar" style="position: absolute; top: 0; bottom: 0; left: 0; width: 0%; border-radius: 2px; background: var(--accent);"></div>
                          </div>
                          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                              <span id="discord-preview-elapsed">0:00</span>
                              <span id="discord-preview-total">0:00</span>
                          </div>
                      </div>
                  </div>
                  <div id="discord-preview-buttons" style="display: flex; gap: 8px; margin-top: 8px;"></div>
              </div>

              <details style="margin-top: 16px;">
                  <summary style="cursor: pointer; color: var(--text-secondary); font-size: 13px;">Login not working? Paste your token manually</summary>
                  <div style="display: flex; gap: 10px; margin-top: 12px;">
                      <input id="discord-token-input" type="password" placeholder="Discord token" style="flex: 1; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--text-secondary); background: var(--app-bg); color: var(--text-primary);">
                      <button class="btn" style="background: #5865F2; color: #fff; padding: 10px 18px; border-radius: 8px; cursor: pointer;" onclick="window.discordPasteToken()">Save</button>
                  </div>
                  <button class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 8px 14px; border-radius: 6px; cursor: pointer; margin-top: 10px; font-size: 12px;" onclick="window.discordDebugDump()">
                      <i class="fas fa-bug"></i> Debug: dump login page storage
                  </button>
              </details>
          </div>`;
};

window.discordCardInit = function () {
    window.discordRenderState(!!window.__discordUser, window.__discordUser);
    window.discordRefreshState();
    const rpcBox = document.getElementById('btn-discord-rpc');
    if (rpcBox) rpcBox.checked = window.discordRpcEnabled;
    const detBox = document.getElementById('btn-discord-details');
    if (detBox) detBox.checked = window.discordUseDetails;
    window.discordUpdatePreview();
};

window.accSwitchTab = function (tab) {
    const tabs = ['google', 'discord'];
    tabs.forEach((name) => {
        const panel = document.getElementById('accPanel-' + name);
        const btn = document.getElementById('accTab-' + name);
        if (panel) panel.style.display = name === tab ? '' : 'none';
        if (btn) btn.classList.toggle('active', name === tab);
    });
    if (window.airScrollTop) window.airScrollTop();
};

window.airCopyText = function (text, okMessage) {
    const done = () => airToast(okMessage || window.t('copied'));
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(String(text || '')).then(done).catch(() => window.airCopyLogsFallback(String(text || ''), done));
    } else {
        window.airCopyLogsFallback(String(text || ''), done);
    }
};

window.airToggleTokenZone = async function () {
    const zone = document.getElementById('air-token-zone');
    if (!zone) return;
    if (zone.style.display !== 'none') {
        zone.style.display = 'none';
        return;
    }
    zone.style.display = '';
    zone.innerHTML = window.airDotsHtml('Fetching token\u2026');
    try {
        const res = await fetch('/api/yt/token?reveal=1').then((r) => r.json());
        const data = (res && res.data) || {};
        if (!data.hasAuth) {
            zone.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px;">Not signed in — sign in with Google first.</div>';
            return;
        }
        zone.innerHTML = `
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                Token length: <b>${data.length}</b> chars &middot; authuser: <b>${airEsc(data.authuser)}</b> &middot; SAPISID: <b>${data.hasSapisid ? 'present' : 'missing'}</b> &middot; authorization header: <b>${airEsc(data.authorization)}</b>
            </div>
            <textarea id="airTokenFull" class="air-token-full" readonly spellcheck="false">${airEsc(String(data.cookie || ''))}</textarea>
            <div class="air-chip-group" style="margin-top: 10px;">
                <button class="air-chip" onclick="window.airCopyToken()"><i class="fas fa-copy"></i> ${window.t('copy')}</button>
                <button class="air-chip" onclick="window.airToggleTokenZone()"><i class="fas fa-eye-slash"></i> ${window.t('hideToken')}</button>
            </div>`;
    } catch (e) {
        zone.innerHTML = '<div style="color: var(--danger); font-size: 13px;">Failed to fetch token: ' + airEsc(e.message || e) + '</div>';
    }
};

// Kept for backwards compatibility — the token is now revealed in one click.
window.airRevealToken = function () { };

window.airCopyToken = function () {
    const full = document.getElementById('airTokenFull');
    const value = full ? full.value : '';
    if (!value) { airToast('Nothing to copy'); return; }
    window.airCopyText(value, 'Token copied');
};

window.airRefreshAccountSwitches = async function () {
    await window.airLoadSettings(true);
    const box = document.getElementById('airUseLoginSwitch');
    if (box) box.checked = window.airSetting('use_login_for_browse', true) !== false;
};

window.setUseLoginForBrowse = function (checked) {
    return window.airSaveSettings({ use_login_for_browse: !!checked });
};

window.ytPremiumPromptHtml = function (compact) {
    return `
    <div class="air-premium-prompt ${compact ? 'compact' : ''}">
        <div class="air-premium-icon"><i class="fab fa-google"></i></div>
        <div class="air-premium-body">
            <div class="air-premium-title">${window.t('premiumTitle')}</div>
            <div class="air-premium-desc">${window.t('premiumDesc')}</div>
        </div>
        <button class="btn-primary air-premium-btn" onclick="window.ytOpenLogin()"><i class="fab fa-google"></i> ${window.t('signIn')}</button>
    </div>`;
};

