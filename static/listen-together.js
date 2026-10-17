// ==========================================
// LISTEN TOGETHER (Matching AirBeats Android App)
// Domain: https://listentogether.airbeats.org
// ==========================================

let API_BASE = "https://listentogether.airbeats.org";

// Async remote config fetch to match Android RemoteConfigManager
(async function initRemoteConfig() {
    try {
        const res = await fetch("https://airbeats-54c06-default-rtdb.firebaseio.com/app_config.json");
        if (res.ok) {
            const cfg = await res.json();
            if (cfg && cfg.listen_together_url) {
                API_BASE = cfg.listen_together_url.replace(/\/+$/, '');
            }
        }
    } catch (e) {
        console.warn("ListenTogether: RemoteConfig fetch skipped, using default", e);
    }
})();

window.ListenTogether = {
    session: null,
    participantId: null,
    code: null,
    isHost: false,
    interval: null,
    lastAppliedVersion: 0,
    lastControllerPublishAt: 0,
    suppressLocalPublishUntil: 0,
    ignoreNextSeek: false,

    getDisplayName() {
        return localStorage.getItem('airbeats_lt_display_name') || 'AirBeats Listener';
    },

    setDisplayName(name) {
        if (name && name.trim()) {
            localStorage.setItem('airbeats_lt_display_name', name.trim());
        }
    },

    async createSession(customName) {
        try {
            const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
            if (!track) {
                if (window.showToast) window.showToast("Play a song first to start a session");
                else alert("Play a song first to start a session");
                return null;
            }

            const name = (customName && customName.trim()) || this.getDisplayName();
            this.setDisplayName(name);

            const payload = {
                name: name,
                state: this._buildStatePayload(track)
            };

            const res = await fetch(`${API_BASE}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || "Failed to create session");
            }

            this._handleJoin(data, true, name);
            return data;
        } catch (e) {
            console.error("ListenTogether createSession error:", e);
            if (window.showToast) window.showToast(e.message || "Could not create session");
            else alert(e.message);
            throw e;
        }
    },

    async joinSession(rawCode, customName) {
        const code = (rawCode || '').trim().toUpperCase();
        if (!code) {
            if (window.showToast) window.showToast("Please enter a 6-letter session code");
            return null;
        }

        try {
            const name = (customName && customName.trim()) || this.getDisplayName();
            this.setDisplayName(name);

            const res = await fetch(`${API_BASE}/sessions/${code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || "Failed to join session");
            }

            this._handleJoin(data, false, name);
            return data;
        } catch (e) {
            console.error("ListenTogether joinSession error:", e);
            if (window.showToast) window.showToast(e.message || "Session not found");
            else alert(e.message);
            throw e;
        }
    },

    async leaveSession() {
        if (!this.code || !this.participantId) {
            this._cleanup();
            return;
        }

        try {
            await fetch(`${API_BASE}/sessions/${this.code}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantId: this.participantId })
            });
        } catch (e) {
            console.warn("ListenTogether leaveSession error:", e);
        }

        this._cleanup();
        if (window.showToast) window.showToast("Left Listen Together session");
    },

    _handleJoin(data, isHost, displayName) {
        this.session = data;
        this.code = data.code;
        this.participantId = data.participantId;
        this.lastAppliedVersion = data.stateVersion || 0;

        const me = data.participantList ? data.participantList.find(p => p.id === this.participantId) : null;
        this.isHost = isHost || (me ? me.isHost : false);

        localStorage.setItem('lt_session_code', this.code);
        localStorage.setItem('lt_session_pid', this.participantId);
        localStorage.setItem('lt_session_host', this.isHost ? 'true' : 'false');
        if (displayName) this.setDisplayName(displayName);

        this._startPolling();
        this._updateUI();

        if (window.showToast) {
            window.showToast(this.isHost ? `Hosting session: ${this.code}` : `Joined session: ${this.code}`);
        }

        // If joining an existing session with playback state, sync immediately
        if (data.state && !this.isHost) {
            this._applyRemoteState(data);
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
    },

    _startPolling() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(async () => {
            if (!this.code) return;
            try {
                // Matches Android ListenTogetherClient.getSession(code): GET /sessions/{code}
                const res = await fetch(`${API_BASE}/sessions/${this.code}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        this._cleanup();
                        if (window.showToast) window.showToast("Session ended by host");
                    }
                    return;
                }

                const data = await res.json();
                if (data.error) {
                    this._cleanup();
                    if (window.showToast) window.showToast("Session ended");
                    return;
                }

                // Keep client participantId intact
                const updatedSession = Object.assign({}, data, { participantId: this.participantId });
                this.session = updatedSession;
                this._updateUI();

                const now = Date.now();
                const isController = updatedSession.controllerId === this.participantId;

                // If remote stateVersion incremented, apply immediately
                if (updatedSession.stateVersion > this.lastAppliedVersion) {
                    this._applyRemoteState(updatedSession);
                    return;
                }

                // If controller, auto-publish periodically (every ~800ms) matching Android CONTROLLER_PUBLISH_MS
                if (isController && now - this.lastControllerPublishAt >= 800) {
                    this.pushState();
                    return;
                }

                // If local user altered track or seeked significantly past USER_SEEK_TOLERANCE_MS (1700ms)
                if (now > this.suppressLocalPublishUntil && this._localUserChangedPlayback(updatedSession)) {
                    this.pushState();
                } else if (!isController) {
                    // Soft correct drift if position deviates by more than 1300ms
                    this._softCorrectPosition(updatedSession);
                }
            } catch (e) {
                console.warn("ListenTogether polling error:", e);
            }
        }, 1500);
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

        const durationMs = (player && player.duration && !isNaN(player.duration))
            ? Math.floor(player.duration * 1000)
            : (track.duration ? Number(track.duration) * 1000 : 0);

        return {
            songId: String(track.id),
            title: track.name || track.title || 'Unknown Song',
            artists: artistNames,
            thumbnailUrl: window.getHighestQualityImage ? window.getHighestQualityImage(track.image) : (track.image || ''),
            positionMs: player ? Math.floor(player.currentTime * 1000) : 0,
            isPlaying: player ? !player.paused : false,
            durationMs: durationMs,
            updatedAt: Date.now()
        };
    },

    async pushState() {
        if (!this.code || !this.participantId) return;
        const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
        const state = this._buildStatePayload(track);
        if (!state) return;

        try {
            // Matches Android ListenTogetherClient.updateState(code, pid, state): POST /sessions/{code}/state
            const res = await fetch(`${API_BASE}/sessions/${this.code}/state`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId: this.participantId,
                    state: state
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data && !data.error) {
                    this.lastAppliedVersion = data.stateVersion;
                    this.lastControllerPublishAt = Date.now();
                    this.session = Object.assign({}, data, { participantId: this.participantId });
                    this._updateUI();
                }
            }
        } catch (e) {
            console.warn("ListenTogether pushState error:", e);
        }
    },

    expectedPosition(session) {
        if (!session || !session.state) return 0;
        const state = session.state;
        const serverNow = session.serverNow || Date.now();
        const serverAge = Math.max(0, serverNow - (state.updatedAt || serverNow));
        return state.isPlaying ? (state.positionMs + serverAge) : state.positionMs;
    },

    _localUserChangedPlayback(session) {
        const state = session.state;
        if (!state) return false;
        const player = document.getElementById('audioElement');
        if (!player) return false;

        const currentTrack = window.getCurrentTrack ? window.getCurrentTrack() : null;
        if (currentTrack && String(currentTrack.id) !== String(state.songId)) return true;
        if ((!player.paused) !== state.isPlaying) return true;

        const currentMs = player.currentTime * 1000;
        const expected = this.expectedPosition(session);
        return Math.abs(currentMs - expected) > 1700; // USER_SEEK_TOLERANCE_MS (1700ms)
    },

    _applyRemoteState(session) {
        const remoteState = session.state;
        if (!remoteState) return;

        // Suppress local publish bounce for 900ms (matching Android APPLY_GRACE_MS)
        this.suppressLocalPublishUntil = Date.now() + 900;
        this.lastAppliedVersion = session.stateVersion;

        const player = document.getElementById('audioElement');
        const currentTrack = window.getCurrentTrack ? window.getCurrentTrack() : null;

        // 1. If song changed, load new song
        if (!currentTrack || String(currentTrack.id) !== String(remoteState.songId)) {
            console.log("ListenTogether: Syncing track to", remoteState.title, remoteState.songId);
            const fakeTrack = {
                id: remoteState.songId,
                title: remoteState.title,
                name: remoteState.title,
                artist: (remoteState.artists && remoteState.artists.length > 0) ? remoteState.artists.join(', ') : 'Unknown',
                artists: (remoteState.artists || []).map(a => ({ name: a })),
                image: remoteState.thumbnailUrl || '',
                downloadUrl: [{ quality: '320kbps', url: `/api/play_stream?id=${remoteState.songId}` }]
            };

            if (!window.allTracks) window.allTracks = {};
            window.allTracks[fakeTrack.id] = fakeTrack;
            window.currentQueue = [fakeTrack];
            window.currentIndex = 0;

            this.ignoreNextSeek = true;
            if (typeof playSingleTrack !== 'undefined') {
                playSingleTrack(fakeTrack.id);
            } else if (typeof loadCurrentTrack !== 'undefined') {
                loadCurrentTrack();
            }
        }

        // 2. Sync playback position & play/pause state
        if (player) {
            const targetMs = this.expectedPosition(session);
            const currentMs = player.currentTime * 1000;

            // SEEK_TOLERANCE_MS = 650ms
            if (Math.abs(currentMs - targetMs) > 650) {
                this.ignoreNextSeek = true;
                player.currentTime = Math.max(0, targetMs / 1000);
            }

            if (remoteState.isPlaying && player.paused) {
                this.ignoreNextSeek = true;
                player.play().catch(e => console.warn("LT autoplay blocked", e));
            } else if (!remoteState.isPlaying && !player.paused) {
                this.ignoreNextSeek = true;
                player.pause();
            }
        }

        this._updateUI();
    },

    _softCorrectPosition(session) {
        const player = document.getElementById('audioElement');
        if (!player) return;

        const targetMs = this.expectedPosition(session);
        const currentMs = player.currentTime * 1000;
        // Soft correct drift if over 1300ms (SEEK_TOLERANCE_MS * 2)
        if (Math.abs(currentMs - targetMs) > 1300) {
            this.suppressLocalPublishUntil = Date.now() + 900;
            this.ignoreNextSeek = true;
            player.currentTime = Math.max(0, targetMs / 1000);
        }
    },

    _updateUI() {
        // Modal re-render if visible
        const overlay = document.getElementById('lt-modal-overlay');
        if (overlay && overlay.style.display === 'flex') {
            window.renderListenTogetherModalContent();
        }
    }
};

// ==========================================
// LISTEN TOGETHER MODAL UI (Matching Android)
// ==========================================

window.openListenTogetherModal = function() {
    let overlay = document.getElementById('lt-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lt-modal-overlay';
        overlay.className = 'lt-modal-overlay';
        overlay.innerHTML = `
            <div class="lt-modal-card" id="lt-modal-content" onclick="event.stopPropagation()">
                <!-- Dynamic Content -->
            </div>
        `;
        overlay.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
        document.body.appendChild(overlay);
    }

    window.renderListenTogetherModalContent();
    overlay.style.display = 'flex';
};

window.renderListenTogetherModalContent = function() {
    const modal = document.getElementById('lt-modal-content');
    if (!modal) return;

    const lt = window.ListenTogether;
    const session = lt.session;
    const isHost = lt.isHost;
    const defaultName = lt.getDisplayName();

    if (session && lt.code) {
        // Active Session View (matching Android CurrentSessionCard & ParticipantsSection)
        const participants = session.participantList || [];
        const state = session.state;
        const currentTrack = window.getCurrentTrack ? window.getCurrentTrack() : null;

        const songTitle = (state && state.title) || (currentTrack && (currentTrack.name || currentTrack.title)) || "Playing track";
        const songArtist = (state && state.artists && state.artists.length > 0)
            ? state.artists.join(', ')
            : (currentTrack && (currentTrack.artist || 'AirBeats'));
        const songImg = (state && state.thumbnailUrl) || (currentTrack && (window.getHighestQualityImage ? window.getHighestQualityImage(currentTrack.image) : currentTrack.image)) || '';

        const joinUrl = session.joinUrl || `https://listentogether.airbeats.org/join/${session.code}`;

        const participantsHtml = participants.map(p => {
            const initial = (p.name || 'U').charAt(0).toUpperCase();
            const hostBadge = p.isHost ? `<span class="lt-host-pill">HOST</span>` : '';
            return `
                <div class="lt-participant-item">
                    <div class="lt-avatar-initial">${initial}</div>
                    <div style="flex: 1; font-weight: 600; color: #fff; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${p.name}
                    </div>
                    ${hostBadge}
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <!-- Close Button -->
            <button style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 16px; padding: 4px;" onclick="document.getElementById('lt-modal-overlay').style.display='none'">
                <i class="fas fa-times"></i>
            </button>

            <!-- Active Header -->
            <div class="lt-session-header">
                <div class="lt-live-indicator">
                    <span class="lt-pulse-dot"></span>
                    <span>${isHost ? 'HOSTING SESSION' : 'JOINED SESSION'}</span>
                </div>
                <div class="lt-badge-chip">
                    <i class="fas fa-globe" style="font-size: 10px;"></i> Online
                </div>
            </div>

            <!-- Big Code Banner -->
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); padding: 18px; border-radius: 18px; text-align: center; margin: 14px 0 16px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); letter-spacing: 1px; margin-bottom: 4px;">SESSION CODE</div>
                <div style="font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #fff; user-select: all; font-family: monospace;">${session.code}</div>
            </div>

            <!-- Playing Song Card -->
            <div class="lt-track-banner">
                ${songImg ? `<img src="${songImg}" class="lt-track-img" alt="Artwork" />` : `<div class="lt-track-img" style="background: rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center;"><i class="fas fa-music"></i></div>`}
                <div class="lt-track-info">
                    <div class="lt-track-title">${songTitle}</div>
                    <div class="lt-track-artist">${songArtist}</div>
                </div>
            </div>

            <!-- Actions Row -->
            <div style="display: flex; gap: 10px; margin-bottom: 18px;">
                <button class="btn" style="flex: 1; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.08); color: #fff; font-size: 13px; font-weight: 700; border: 1px solid rgba(255,255,255,0.12); cursor: pointer;" onclick="navigator.clipboard.writeText('${session.code}').then(() => window.showToast('Session code copied!'))">
                    <i class="fas fa-copy"></i> Copy Code
                </button>
                <button class="btn" style="flex: 1; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.08); color: #fff; font-size: 13px; font-weight: 700; border: 1px solid rgba(255,255,255,0.12); cursor: pointer;" onclick="navigator.clipboard.writeText('${joinUrl}').then(() => window.showToast('Invite link copied!'))">
                    <i class="fas fa-share-alt"></i> Share Link
                </button>
            </div>

            <!-- Participants Card -->
            <div class="lt-glass-card" style="margin-bottom: 16px;">
                <div style="font-size: 12px; font-weight: 800; color: var(--accent-text); margin-bottom: 10px; letter-spacing: 0.5px;">
                    SESSION USERS (${participants.length})
                </div>
                <div style="max-height: 150px; overflow-y: auto;">
                    ${participantsHtml}
                </div>
            </div>

            <!-- Leave Session Button -->
            <button class="btn" style="width: 100%; height: 46px; border-radius: 14px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; font-weight: 800; font-size: 14px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.25)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.15)'" onclick="window.ListenTogether.leaveSession()">
                <i class="fas fa-sign-out-alt"></i> Leave Session
            </button>
        `;
    } else {
        // Inactive View (Create / Join Screen matching Android)
        modal.innerHTML = `
            <!-- Close Button -->
            <button style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 16px; padding: 4px;" onclick="document.getElementById('lt-modal-overlay').style.display='none'">
                <i class="fas fa-times"></i>
            </button>

            <!-- Title & Description -->
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(29, 185, 84, 0.15); display: flex; align-items: center; justify-content: center; color: var(--accent-text); font-size: 16px;">
                    <i class="fas fa-users"></i>
                </div>
                <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #fff;">Listen Together</h2>
            </div>
            <p style="color: var(--text-secondary); font-size: 13px; margin: 0 0 18px 0; line-height: 1.5;">
                Sync music playback across devices in real time with Android and Desktop friends.
            </p>

            <!-- Display Name Input -->
            <div style="margin-bottom: 16px;">
                <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.5px; display: block; margin-bottom: 6px;">YOUR DISPLAY NAME</label>
                <input type="text" id="lt-display-name-input" value="${defaultName}" placeholder="e.g. Dark" style="width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #fff; font-size: 14px; outline: none; box-sizing: border-box;" onchange="window.ListenTogether.setDisplayName(this.value)">
            </div>

            <!-- Create Session Card -->
            <div class="lt-glass-card">
                <div style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px;">Host a Session</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">Start a room with your currently playing track and invite friends.</div>
                <button class="btn" style="width: 100%; height: 44px; border-radius: 12px; background: var(--accent); color: #000; font-weight: 800; font-size: 14px; border: none; cursor: pointer; transition: transform 0.15s;" onclick="const name = document.getElementById('lt-display-name-input').value; window.ListenTogether.createSession(name)">
                    <i class="fas fa-plus"></i> Create New Session
                </button>
            </div>

            <!-- Divider -->
            <div style="display: flex; align-items: center; margin: 14px 0;">
                <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
                <div style="padding: 0 12px; color: var(--text-secondary); font-size: 11px; font-weight: 700;">OR JOIN ROOM</div>
                <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
            </div>

            <!-- Join Session Card -->
            <div class="lt-glass-card">
                <div style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 8px;">Enter 6-Letter Code</div>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="lt-join-code-input" placeholder="e.g. C6QL5X" maxlength="6" style="flex: 1; padding: 12px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #fff; font-size: 16px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; outline: none; box-sizing: border-box;" oninput="this.value = this.value.toUpperCase()">
                    <button class="btn" style="padding: 0 20px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-weight: 800; font-size: 14px; cursor: pointer;" onclick="const name = document.getElementById('lt-display-name-input').value; const code = document.getElementById('lt-join-code-input').value; window.ListenTogether.joinSession(code, name)">
                        Join
                    </button>
                </div>
            </div>
        `;
    }
};

// ==========================================
// AUTO-INITIALIZATION & AUDIO HOOKS
// ==========================================

function initListenTogetherListeners() {
    const player = document.getElementById('audioElement');
    if (player) {
        player.addEventListener('play', () => {
            if (window.ListenTogether && window.ListenTogether.code && !window.ListenTogether.ignoreNextSeek) {
                window.ListenTogether.pushState();
            }
            if (window.ListenTogether) window.ListenTogether.ignoreNextSeek = false;
        });

        player.addEventListener('pause', () => {
            if (window.ListenTogether && window.ListenTogether.code && !window.ListenTogether.ignoreNextSeek) {
                window.ListenTogether.pushState();
            }
            if (window.ListenTogether) window.ListenTogether.ignoreNextSeek = false;
        });

        player.addEventListener('seeked', () => {
            if (window.ListenTogether && window.ListenTogether.code && !window.ListenTogether.ignoreNextSeek) {
                window.ListenTogether.pushState();
            }
            if (window.ListenTogether) window.ListenTogether.ignoreNextSeek = false;
        });
    }

    // Auto-reconnect saved session if available
    const savedCode = localStorage.getItem('lt_session_code');
    const savedPid = localStorage.getItem('lt_session_pid');
    const savedHost = localStorage.getItem('lt_session_host') === 'true';

    if (savedCode && savedPid) {
        window.ListenTogether.code = savedCode;
        window.ListenTogether.participantId = savedPid;
        window.ListenTogether.isHost = savedHost;
        window.ListenTogether._startPolling();
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initListenTogetherListeners();
} else {
    window.addEventListener('DOMContentLoaded', initListenTogetherListeners);
}
