// ==================== AIRBEATS CLIENT STATS CONNECTOR ====================
// Zero database URLs, keys, or complex stats logic are exposed to the client.
// All requests are proxied securely through the Python Flask backend.

(function() {
    'use strict';

    const DICEBEAR_STYLES = [
        "adventurer", "avataaars", "big-ears", "bottts", "fun-emoji", 
        "lorelei", "micah", "miniavs", "open-peeps", "personas", "pixel-art", "shapes"
    ];

    // ==================== STORAGE HELPERS ====================
    function getUserId() {
        return localStorage.getItem('airbeats_user_id') || '';
    }
    function getUserName() {
        return localStorage.getItem('airbeats_user_name') || '';
    }
    function getUserAvatar() {
        return localStorage.getItem('airbeats_user_avatar') || '';
    }

    // ==================== WELCOME ONBOARDING MODAL ====================
    function showWelcomeModal() {
        if (document.getElementById('welcomeModal')) return;

        const modal = document.createElement('div');
        modal.id = 'welcomeModal';
        modal.className = 'stats-modal-overlay';
        modal.innerHTML = `
            <div class="stats-modal welcome-modal">
                <div class="welcome-icon">🎵</div>
                <h2>Welcome to AirBeats</h2>
                <p>Enter your nickname to join the global stats leaderboard and sync with the Android app!</p>
                <input type="text" id="welcomeNameInput" class="stats-input" placeholder="Your music nickname..." maxlength="25">
                <div class="welcome-avatar-section">
                    <p style="margin:10px 0 8px; color:var(--text-secondary); font-size:13px;">Choose avatar style</p>
                    <div class="avatar-preview-row">
                        <img id="welcomeAvatarPreview" class="avatar-large" src="https://api.dicebear.com/7.x/shapes/png?seed=initial&size=200" alt="avatar">
                        <button class="stats-btn-secondary" onclick="window._statsRandomAvatar()">🎲 Randomize</button>
                    </div>
                </div>
                <button class="stats-btn-primary" onclick="window._statsSubmitWelcome(this)">Register Profile</button>
            </div>
        `;
        document.body.appendChild(modal);

        let currentStyle = 'shapes';
        let currentSeed = Math.random().toString(36).substr(2, 9);
        
        const updatePreview = () => {
            document.getElementById('welcomeAvatarPreview').src = `https://api.dicebear.com/7.x/${currentStyle}/png?seed=${currentSeed}&size=200`;
        };
        updatePreview();

        window._statsRandomAvatar = function() {
            currentStyle = DICEBEAR_STYLES[Math.floor(Math.random() * DICEBEAR_STYLES.length)];
            currentSeed = Math.random().toString(36).substr(2, 9);
            updatePreview();
        };

        window._statsSubmitWelcome = async function(btn) {
            const nameInput = document.getElementById('welcomeNameInput');
            const name = nameInput.value.trim();
            if (!name) {
                nameInput.style.borderColor = 'var(--danger)';
                nameInput.placeholder = 'Nickname is required!';
                return;
            }

            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.style.cursor = 'not-allowed';

            try {
                const res = await fetch('/api/stats/onboard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, style: currentStyle, seed: currentSeed })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('airbeats_user_id', data.userId);
                    localStorage.setItem('airbeats_user_name', data.name);
                    localStorage.setItem('airbeats_user_avatar', data.profileUrl);
                    
                    modal.classList.add('fade-out');
                    setTimeout(() => {
                        modal.remove();
                        updateProfileIcon();
                    }, 300);
                } else {
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                    alert(data.error || "Failed to register profile.");
                }
            } catch(e) {
                console.error("Onboarding failed:", e);
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                alert("Failed to connect to stats database.");
            }
        };
    }

    // ==================== TRACKING LISTEN TIME ====================
    let lastTimeUpdate = 0;
    let accumulatedMs = 0;

    function startListenTracking() {
        const findAudio = () => {
            const audio = document.querySelector('audio');
            if (!audio) {
                setTimeout(findAudio, 2000);
                return;
            }

            audio.addEventListener('timeupdate', () => {
                const now = Date.now();
                if (lastTimeUpdate > 0 && !audio.paused) {
                    const delta = now - lastTimeUpdate;
                    if (delta > 0 && delta < 5000) {
                        accumulatedMs += delta;
                        // Send delta to backend every 30 seconds
                        if (accumulatedMs >= 30000) {
                            reportListenTime(accumulatedMs);
                            accumulatedMs = 0;
                        }
                    }
                }
                lastTimeUpdate = now;
            });

            audio.addEventListener('pause', () => {
                if (accumulatedMs > 0) {
                    reportListenTime(accumulatedMs);
                    accumulatedMs = 0;
                }
                lastTimeUpdate = 0;
            });

            audio.addEventListener('ended', () => {
                if (accumulatedMs > 0) {
                    reportListenTime(accumulatedMs);
                    accumulatedMs = 0;
                }
                lastTimeUpdate = 0;
            });
        };
        findAudio();
    }

    async function reportListenTime(ms) {
        const userId = getUserId();
        const name = getUserName();
        if (!userId || !name) return;

        try {
            const res = await fetch('/api/stats/listen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    name: name,
                    profileUrl: getUserAvatar(),
                    deltaMs: ms
                })
            });
            const data = await res.json();
            if (data.success && data.rankUp) {
                showRankUpPopup(data.newRank);
            }
        } catch(e) {
            console.error("Stats upload error:", e);
        }
    }

    function showRankUpPopup(rank) {
        if (document.getElementById('rankUpPopup') || !rank) return;
        const gradient = rank.colors.join(', ');
        
        const popup = document.createElement('div');
        popup.id = 'rankUpPopup';
        popup.className = 'stats-modal-overlay';
        popup.innerHTML = `
            <div class="stats-modal rankup-modal">
                <div class="rankup-glow" style="background: radial-gradient(circle, ${rank.colors[0]}44, transparent 70%);"></div>
                <div class="rankup-label">NEW TIER UNLOCKED!</div>
                <div class="rankup-badge-wrap">
                    <div class="rankup-badge-ring" style="border-image: linear-gradient(135deg, ${gradient}) 1;"></div>
                    <span class="rank-badge" style="width:80px; height:80px; border-radius:50%; display:inline-block; background:linear-gradient(135deg, ${gradient}); border:2px solid rgba(0,0,0,0.4); box-shadow:0 0 16px ${rank.colors[0]}88;"></span>
                </div>
                <div class="rankup-name">${rank.name}</div>
                <div class="rankup-threshold">Tier reached at ${rank.thresholdHours} hours listened</div>
                <button class="stats-btn-primary" onclick="document.getElementById('rankUpPopup').classList.add('fade-out'); setTimeout(() => document.getElementById('rankUpPopup')?.remove(), 300);">AWESOME!</button>
            </div>
        `;
        document.body.appendChild(popup);
    }

    // ==================== NAV PROFILE ICON ====================
    function updateProfileIcon() {
        const avatar = getUserAvatar();
        const name = getUserName();
        const profileArea = document.querySelector('.user-profile');
        if (!profileArea) return;

        let avatarEl = document.getElementById('statsProfileAvatar');
        if (!avatarEl && name) {
            const existingText = profileArea.querySelector('span, div');
            avatarEl = document.createElement('img');
            avatarEl.id = 'statsProfileAvatar';
            avatarEl.className = 'nav-profile-avatar';
            avatarEl.src = avatar || `https://api.dicebear.com/7.x/shapes/png?seed=${name}`;
            avatarEl.alt = name;
            avatarEl.title = name;
            avatarEl.style.cssText = 'width:32px; height:32px; border-radius:50%; cursor:pointer; object-fit:cover; border:2px solid var(--accent);';
            avatarEl.onclick = () => { window.location.hash = '#settings/profile'; };
            
            const lastEl = profileArea.lastElementChild;
            if (lastEl && lastEl.textContent.trim().length <= 3 && !lastEl.classList.contains('fa-cog') && !lastEl.classList.contains('fa-bell')) {
                lastEl.replaceWith(avatarEl);
            } else {
                profileArea.appendChild(avatarEl);
            }
        } else if (avatarEl && avatar) {
            avatarEl.src = avatar;
        }
    }

    // ==================== INTERACTION METHODS ====================
    window.editProfileName = async function() {
        const newName = prompt('Enter your new nickname:', getUserName());
        if (newName && newName.trim()) {
            const sanitized = newName.trim();
            try {
                const res = await fetch('/api/stats/update_profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: getUserId(), name: sanitized, profileUrl: getUserAvatar() })
                });
                if (res.ok) {
                    localStorage.setItem('airbeats_user_name', sanitized);
                    const nameEl = document.getElementById('profileDisplayName');
                    if (nameEl) nameEl.textContent = sanitized;
                    updateProfileIcon();
                }
            } catch(e) {
                console.error("Update profile name error:", e);
            }
        }
    };

    window.showAvatarPicker = function() {
        if (document.getElementById('avatarPickerModal')) return;
        let selectedStyle = 'shapes';

        const modal = document.createElement('div');
        modal.id = 'avatarPickerModal';
        modal.className = 'stats-modal-overlay';

        const renderGrid = (style) => {
            const seeds = ['Amaya', 'Destiny', 'Sarah', 'Alexander', 'Luna', 'Oliver', 'Emma', 'Noah', 'Zara', 'Max', 'Aria', 'Leo'];
            return seeds.map(s => {
                const url = `https://api.dicebear.com/7.x/${style}/png?seed=${s}&size=200`;
                return `<img class="avatar-grid-item" src="${url}" onclick="window._selectAvatar('${url}')" alt="${s}">`;
            }).join('');
        };

        const renderStyles = () => {
            return DICEBEAR_STYLES.map(s =>
                `<button class="style-chip ${s === selectedStyle ? 'active' : ''}" onclick="window._changeAvatarStyle('${s}')">${s}</button>`
            ).join('');
        };

        modal.innerHTML = `
            <div class="stats-modal avatar-picker-modal">
                <div class="modal-header">
                    <h3>Choose Avatar</h3>
                    <button class="modal-close-btn" onclick="document.getElementById('avatarPickerModal').remove()"><i class="fas fa-times"></i></button>
                </div>
                <div class="avatar-styles-row" id="avatarStylesRow">${renderStyles()}</div>
                <div class="avatar-grid" id="avatarGrid">${renderGrid(selectedStyle)}</div>
            </div>
        `;
        document.body.appendChild(modal);

        window._changeAvatarStyle = function(style) {
            selectedStyle = style;
            document.getElementById('avatarGrid').innerHTML = renderGrid(style);
            document.getElementById('avatarStylesRow').innerHTML = renderStyles();
        };

        window._selectAvatar = async function(url) {
            try {
                const res = await fetch('/api/stats/update_profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: getUserId(), name: getUserName(), profileUrl: url })
                });
                if (res.ok) {
                    localStorage.setItem('airbeats_user_avatar', url);
                    const imgEl = document.getElementById('profileAvatarImg');
                    const placeholderEl = document.getElementById('profileAvatarPlaceholder');
                    if (imgEl) {
                        imgEl.src = url;
                        imgEl.style.display = 'block';
                    }
                    if (placeholderEl) {
                        placeholderEl.style.display = 'none';
                    }
                    updateProfileIcon();
                    document.getElementById('avatarPickerModal').remove();
                }
            } catch(e) {
                console.error("Select avatar error:", e);
            }
        };
    };

    // ==================== RENDERING BACKEND RENDERED HTML ====================
    window.renderStatsProfile = async function() {
        const routerView = document.getElementById('router-view');
        if (!routerView) return;

        try {
            const res = await fetch(`/api/stats/profile_html?userId=${getUserId()}&name=${encodeURIComponent(getUserName())}&avatar=${encodeURIComponent(getUserAvatar())}&_t=${Date.now()}`);
            const html = await res.text();
            routerView.innerHTML = html;
        } catch(e) {
            routerView.innerHTML = `<div class="stats-error"><p>Failed to load profile stats. <button onclick="window.renderStatsProfile()">Retry</button></p></div>`;
        }
    };

    window.renderGlobalStats = async function() {
        const routerView = document.getElementById('router-view');
        if (!routerView) return;

        try {
            const res = await fetch(`/api/stats/leaderboard_html?userId=${getUserId()}&_t=${Date.now()}`);
            const html = await res.text();
            routerView.innerHTML = html;
        } catch(e) {
            routerView.innerHTML = `<div class="stats-error"><p>Failed to load global leaderboard. <button onclick="window.renderGlobalStats()">Retry</button></p></div>`;
        }
    };

    // ==================== INITIALIZATION ====================
    function init() {
        if (!getUserName()) {
            setTimeout(showWelcomeModal, 1500);
        } else {
            updateProfileIcon();
        }

        startListenTracking();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
    window.restoreBackup = async function(input) {
        if (!input.files || input.files.length === 0) return;
        
        const file = input.files[0];
        if (!file.name.endsWith('.backup') && !file.name.endsWith('.zip')) {
            alert('Please select a valid AirBeats backup file (.backup)');
            return;
        }

        if (!confirm('This will overwrite your current web account and history with the backup from the Android app. Are you sure you want to proceed?')) {
            input.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const btn = input.previousElementSibling;
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restoring...';
            btn.disabled = true;

            const res = await fetch('/api/stats/restore_backup', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                // 1. Restore UUID
                localStorage.setItem('airbeats_user_id', data.userId);
                
                // 2. Restore History
                if (data.history && Array.isArray(data.history)) {
                    localStorage.setItem('recentlyPlayed', JSON.stringify(data.history));
                }
                
                alert('Backup restored successfully! Your account and listening history are now synced.');
                window.location.reload();
            } else {
                throw new Error(data.error || 'Unknown error during restore');
            }
        } catch (e) {
            console.error("Backup restore failed:", e);
            alert("Failed to restore backup: " + e.message);
            input.value = '';
            const btn = input.previousElementSibling;
            btn.innerHTML = '<i class="fas fa-upload"></i> Restore Backup (.backup)';
            btn.disabled = false;
        }
    };
