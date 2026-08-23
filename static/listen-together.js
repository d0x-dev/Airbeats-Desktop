const API_BASE = "https://listentogether.airbeats.app";

window.ListenTogether = {
    session: null,
    participantId: null,
    code: null,
    isHost: false,
    interval: null,
    lastPushedVersion: 0,
    serverStateVersion: 0,
    ignoreNextSeek: false,

    async createSession(name) {
        try {
            const track = window.getCurrentTrack();
            if (!track) throw new Error("Play a song first to create a session.");
            
            const res = await fetch(`${API_BASE}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name || "Web User",
                    state: this._buildStatePayload(track)
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            this._handleJoin(data);
            return data;
        } catch (e) {
            console.error(e);
            alert(e.message);
            throw e;
        }
    },

    async joinSession(code, name) {
        if (!code) return;
        try {
            const res = await fetch(`${API_BASE}/sessions/${code.toUpperCase()}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name || "Web User" })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            this._handleJoin(data);
            return data;
        } catch (e) {
            console.error(e);
            alert(e.message);
            throw e;
        }
    },

    async leaveSession() {
        if (!this.code || !this.participantId) return;
        try {
            await fetch(`${API_BASE}/sessions/${this.code}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantId: this.participantId })
            });
        } catch (e) { console.error(e); }
        this._cleanup();
    },

    _handleJoin(data) {
        this.session = data;
        this.code = data.code;
        this.participantId = data.participantId;
        this.serverStateVersion = data.stateVersion;
        const me = data.participantList.find(p => p.id === this.participantId);
        this.isHost = me ? me.isHost : false;

        localStorage.setItem('lt_session_code', this.code);
        localStorage.setItem('lt_session_pid', this.participantId);
        localStorage.setItem('lt_session_host', this.isHost ? 'true' : 'false');

        this._startPolling();
        window.showToast(`Joined Listen Together: ${this.code}`);
        document.getElementById('lt-modal-overlay').style.display = 'none';
        this._updateUI();
        
        if (data.state && !this.isHost) {
            this._syncFromRemote(data.state);
        }
    },

    _cleanup() {
        this.session = null;
        this.code = null;
        this.participantId = null;
        this.isHost = false;
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
        localStorage.removeItem('lt_session_code');
        localStorage.removeItem('lt_session_pid');
        localStorage.removeItem('lt_session_host');
        this._updateUI();
        window.showToast("Left Listen Together session");
    },

    _startPolling() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(async () => {
            if (!this.code) return;
            try {
                const res = await fetch(`${API_BASE}/sessions/${this.code}/read`);
                const data = await res.json();
                if (data.error) {
                    this._cleanup();
                    window.showToast("Session ended");
                    return;
                }
                this.session = data;
                this._updateUI();

                if (data.stateVersion > this.lastPushedVersion && data.stateVersion > this.serverStateVersion) {
                    this.serverStateVersion = data.stateVersion;
                    if (data.controllerId !== this.participantId) {
                        this._syncFromRemote(data.state);
                    }
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 2000);
    },

    _buildStatePayload(track) {
        if (!track) return null;
        const player = document.getElementById('audioElement');
        let artistNames = [];
        if (Array.isArray(track.artists)) {
            artistNames = track.artists.map(a => typeof a === 'object' ? a.name : a);
        } else if (track.artists && track.artists.primary) {
            artistNames = track.artists.primary.map(a => a.name);
        } else if (track.artist) {
            artistNames = [track.artist];
        }

        return {
            songId: track.id,
            title: track.name || track.title || 'Unknown',
            artists: artistNames,
            thumbnailUrl: window.getHighestQualityImage ? window.getHighestQualityImage(track.image) : track.image,
            positionMs: Math.floor((player ? player.currentTime : 0) * 1000),
            isPlaying: player ? !player.paused : false
        };
    },

    async pushState() {
        if (!this.code || !this.participantId) return;
        const track = window.getCurrentTrack();
        const state = this._buildStatePayload(track);
        if (!state) return;

        try {
            const res = await fetch(`${API_BASE}/sessions/${this.code}/state`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId: this.participantId,
                    state: state
                })
            });
            const data = await res.json();
            if (data && !data.error) {
                this.lastPushedVersion = data.stateVersion;
                this.serverStateVersion = data.stateVersion;
                this.session = data;
                this._updateUI();
            }
        } catch (e) {
            console.error("Failed to push state", e);
        }
    },

    _syncFromRemote(state) {
        if (!state) return;
        const track = window.getCurrentTrack();
        
        if (!track || track.id !== state.songId) {
            console.log("ListenTogether: Loading remote song", state.title);
            const fakeTrack = {
                id: state.songId,
                title: state.title,
                name: state.title,
                artist: state.artists && state.artists.length > 0 ? state.artists[0] : 'Unknown',
                artists: state.artists ? state.artists.map(a => ({name: a})) : [],
                image: state.thumbnailUrl,
                downloadUrl: [{ quality: '320kbps', url: `/api/play_stream?id=${state.songId}` }]
            };
            window.allTracks[fakeTrack.id] = fakeTrack;
            window.currentTrackIndex = 0;
            window.currentRenderedTracks = [fakeTrack];
            
            this.ignoreNextSeek = true;
            if (typeof playSingleTrack !== 'undefined') playSingleTrack(fakeTrack.id);
        }

        const player = document.getElementById('audioElement');
        if (player) {
            const timeDiff = Math.abs(player.currentTime - (state.positionMs / 1000));
            if (timeDiff > 3) {
                this.ignoreNextSeek = true;
                player.currentTime = state.positionMs / 1000;
            }

            if (state.isPlaying && player.paused) {
                this.ignoreNextSeek = true;
                player.play().catch(e => console.error("LT Autoplay blocked", e));
            } else if (!state.isPlaying && !player.paused) {
                this.ignoreNextSeek = true;
                player.pause();
            }
        }
    },

    _updateUI() {
        const indicator = document.getElementById('lt-mini-indicator');
        if (indicator) indicator.style.display = 'none';
    },
};

window.openListenTogetherModal = function() {
    let overlay = document.getElementById('lt-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lt-modal-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0'; overlay.style.left = '0';
        overlay.style.width = '100vw'; overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.7)';
        overlay.style.backdropFilter = 'blur(5px)';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        
        const modal = document.createElement('div');
        modal.style.background = 'var(--panel-bg)';
        modal.style.padding = '30px';
        modal.style.borderRadius = '16px';
        modal.style.width = '400px';
        modal.style.maxWidth = '90%';
        modal.style.position = 'relative';
        modal.id = 'lt-modal-content';
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.onclick = (e) => { if (e.target === overlay) overlay.style.display = 'none'; }
    }

    const modal = document.getElementById('lt-modal-content');
    
    if (window.ListenTogether.session) {
        modal.innerHTML = `
            <div style="position: absolute; top: 15px; right: 15px; cursor: pointer; color: var(--text-secondary);" onclick="document.getElementById('lt-modal-overlay').style.display='none'"><i class="fas fa-times"></i></div>
            <h2 style="margin-top:0; color: #1DB954;"><i class="fas fa-users"></i> Listen Together</h2>
            <p>You are in a session!</p>
            <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
                <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 5px;">SESSION CODE</div>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; user-select: text;">${window.ListenTogether.code}</div>
            </div>
            <p style="text-align:center; color: var(--text-secondary);">Participants: ${window.ListenTogether.session.participantList ? window.ListenTogether.session.participantList.length : 1}</p>
            <button class="btn-primary" style="width: 100%; background: #ef4444; margin-top: 10px;" onclick="window.ListenTogether.leaveSession(); document.getElementById('lt-modal-overlay').style.display='none';">Leave Session</button>
        `;
    } else {
        modal.innerHTML = `
            <div style="position: absolute; top: 15px; right: 15px; cursor: pointer; color: var(--text-secondary);" onclick="document.getElementById('lt-modal-overlay').style.display='none'"><i class="fas fa-times"></i></div>
            <h2 style="margin-top:0;"><i class="fas fa-users"></i> Listen Together</h2>
            <p style="color: var(--text-secondary); font-size: 14px;">Listen to music in sync with your friends.</p>
            
            <div style="margin-top: 20px;">
                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px; display: block;">YOUR NAME</label>
                <input type="text" id="lt-name" placeholder="E.g. Web User" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: white; border-radius: 8px; margin-bottom: 15px; user-select: text; -webkit-user-select: text; pointer-events: auto; -webkit-app-region: no-drag;">
                
                <button class="btn-primary" style="width: 100%; margin-bottom: 20px;" onclick="const n = document.getElementById('lt-name').value; window.ListenTogether.createSession(n);">Create New Session</button>
                
                <div style="display: flex; align-items: center; margin: 15px 0;">
                    <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
                    <div style="padding: 0 10px; color: var(--text-secondary); font-size: 12px;">OR</div>
                    <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
                </div>
                
                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px; display: block;">JOIN CODE</label>
                <input type="text" id="lt-code" placeholder="6-letter code" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: white; border-radius: 8px; margin-bottom: 15px; text-transform: uppercase; user-select: text; -webkit-user-select: text; pointer-events: auto; -webkit-app-region: no-drag;">
                <button class="btn-primary" style="width: 100%; background: var(--secondary-color);" onclick="const n = document.getElementById('lt-name').value; const c = document.getElementById('lt-code').value; window.ListenTogether.joinSession(c, n);">Join Session</button>
            </div>
        `;
    }
    overlay.style.display = 'flex';
};

window.addEventListener('load', () => {
    setTimeout(() => {
        const code = localStorage.getItem('lt_session_code');
        const pid = localStorage.getItem('lt_session_pid');
        if (code && pid) {
            window.ListenTogether.code = code;
            window.ListenTogether.participantId = pid;
            window.ListenTogether.isHost = localStorage.getItem('lt_session_host') === 'true';
            window.ListenTogether._startPolling();
        }
    }, 1000);

    const player = document.getElementById('audioElement');
    if (player) {
        player.addEventListener('play', () => {
            if (window.ListenTogether && window.ListenTogether.session && !window.ListenTogether.ignoreNextSeek) {
                window.ListenTogether.pushState();
            }
            if (window.ListenTogether) window.ListenTogether.ignoreNextSeek = false;
        });
        player.addEventListener('pause', () => {
            if (window.ListenTogether && window.ListenTogether.session && !window.ListenTogether.ignoreNextSeek) {
                window.ListenTogether.pushState();
            }
            if (window.ListenTogether) window.ListenTogether.ignoreNextSeek = false;
        });
        player.addEventListener('seeked', () => {
            if (window.ListenTogether && window.ListenTogether.session && !window.ListenTogether.ignoreNextSeek) {
                window.ListenTogether.pushState();
            }
            if (window.ListenTogether) window.ListenTogether.ignoreNextSeek = false;
        });
    }
});
