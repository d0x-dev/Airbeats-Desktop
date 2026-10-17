window.addEventListener('error', function(e) { if (e.target.tagName === 'IMG') { if (e.target.getAttribute('data-fallback-applied')) return; e.target.setAttribute('data-fallback-applied', 'true'); e.target.src = 'https://via.placeholder.com/150x150/1c1a1a/c6e355?text=Music'; } }, true);


window.getClickableArtistsHtml = function(song) {
    if (!song) return 'Unknown Artist';
    if (song.artists && song.artists.primary && song.artists.primary.length > 0) {
        return song.artists.primary.map(a => {
            if (a.id) return `<span class="clickable-artist" onclick="event.stopPropagation(); window.location.hash='#artist/${a.id}'; if(window.closeLyrics) window.closeLyrics();">${a.name}</span>`;
            return a.name;
        }).join(', ');
    }
    return song.subtitle || song.primary_artists || 'Unknown Artist';
};

window.setTheme = function(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
    // Update appearance buttons if we are on the settings page
    const darkBtn = document.getElementById('btn-dark-mode');
    const lightBtn = document.getElementById('btn-light-mode');
    if (darkBtn && lightBtn) {
        if (theme === 'dark') {
            darkBtn.style.border = '2px solid var(--accent)';
            lightBtn.style.border = '2px solid transparent';
        } else {
            lightBtn.style.border = '2px solid var(--accent)';
            darkBtn.style.border = '2px solid transparent';
        }
    }
};

window.setTheme(localStorage.getItem('theme') || 'light');

// Escape a value so it is safe inside a single-quoted JS string that sits in a
// double-quoted HTML attribute (inline onclick / onload / onerror handlers).
window.airJsAttrEsc = function (v) {
    return String(v == null ? '' : v)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/[\r\n]+/g, ' ');
};

// Every page/tab change starts from the top of the scroll container.
window.airScrollTop = function () {
    document.querySelectorAll('.scroll-container').forEach((el) => {
        try { el.scrollTop = 0; } catch (e) { }
    });
    // .app-window focus/scrollIntoView can silently scroll the container and
    // clip the top bar. Reset scroll on every navigation.
    document.querySelectorAll('.app-window').forEach((el) => {
        try { el.scrollTop = 0; } catch (e) { }
    });
};

// Official current brand marks (Discord 2021, YouTube play button) as inline SVGs —
// Font Awesome still ships the old glyphs. fill: currentColor, so callers can tint
// via the `color` argument or inherited color.
window.airBrandIcon = function (name, size, color, extraStyle) {
    size = size || 16;
    const style = 'display:inline-block;vertical-align:-0.15em;' +
        (color ? 'color:' + color + ';' : '') + (extraStyle || '');
    if (name === 'discord') {
        return '<svg viewBox="0 0 127.14 96.36" width="' + size + '" height="' + size +
            '" style="' + style + '" aria-hidden="true"><path fill="currentColor" d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21h0A105.73 105.73 0 0 0 32.71 96.36 77.7 77.7 0 0 0 39.6 85.25a68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1A105.25 105.25 0 0 0 126.6 80.22h0C129.24 52.84 122.09 29.11 107.7 8.07ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z"/></svg>';
    }
    if (name === 'youtube') {
        return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
            '" style="' + style + '" aria-hidden="true"><path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';
    }
    return '';
};

window.setWaveformAnimation = function(enabled) {
    if (enabled) {
        document.body.classList.add('animated-waveform');
        localStorage.setItem('wave_anim', 'true');
    } else {
        document.body.classList.remove('animated-waveform');
        localStorage.setItem('wave_anim', 'false');
    }
    // Update appearance buttons if we are on the settings page
    const animOnBtn = document.getElementById('btn-anim-on');
    const animOffBtn = document.getElementById('btn-anim-off');
    if (animOnBtn && animOffBtn) {
        if (enabled) {
            animOnBtn.style.border = '2px solid var(--accent)';
            animOffBtn.style.border = '2px solid transparent';
        } else {
            animOffBtn.style.border = '2px solid var(--accent)';
            animOnBtn.style.border = '2px solid transparent';
        }
    }
};

window.setWaveformAnimation(localStorage.getItem('wave_anim') === 'true');

window.setDynamicIsland = function(enabled) {
    localStorage.setItem('dynamic_island_enabled', enabled ? 'true' : 'false');
    if (window.electronAPI && window.electronAPI.toggleDynamicIsland) {
        window.electronAPI.toggleDynamicIsland(enabled);
        
        // push the current track; the island window is created async, so retry
        // a few times in case the first push arrives before it exists
        if (enabled) {
            const pushCurrentTrack = (attempt = 0) => {
                if (typeof currentTrack !== 'undefined' && currentTrack) {
                    const isFav = favoriteSongs.some(s => s.id === currentTrack.id);
                    window.electronAPI.updateDynamicIsland({
                        type: 'track',
                        title: currentTrack.name || currentTrack.title || 'Unknown Track',
                        // read the same way the rest of the app does
                        artist: currentTrack.artists?.primary?.[0]?.name
                            || currentTrack.artist
                            || currentTrack.artists?.[0]?.name
                            || 'Unknown Artist',
                        image: getHighestQualityImage(
                            currentTrack.image || currentTrack.thumbnail
                        ),
                        isFav: isFav,
                        isRepeat: window.isRepeat || false
                    });

                    if (document.body.classList.contains('is-playing')) {
                        window.electronAPI.updateDynamicIsland({ type: 'state', state: 'play' });
                    }
                } else if (attempt === 0) {
                    // nothing loaded yet -- leave the island hidden rather than
                    // showing a fake "Airbeats Desktop" track. dynamic-island.html
                    // starts as .island hidden, so it stays out of the way until
                    // a real song arrives.
                    window.electronAPI.updateDynamicIsland({ type: 'state', state: 'pause' });
                }

                if (attempt < 4) setTimeout(() => pushCurrentTrack(attempt + 1), 250);
            };
            pushCurrentTrack(0);
        }
    }
    
    // Update appearance buttons if we are on the settings page
    const islandOnBtn = document.getElementById('btn-island-on');
    const islandOffBtn = document.getElementById('btn-island-off');
    if (islandOnBtn && islandOffBtn) {
        if (enabled) {
            islandOnBtn.style.border = '2px solid var(--accent)';
            islandOffBtn.style.border = '2px solid transparent';
        } else {
            islandOnBtn.style.border = '2px solid transparent';
            islandOffBtn.style.border = '2px solid var(--accent)';
        }
    }
}

// Default to true if not set
if (localStorage.getItem('dynamic_island_enabled') === null) {
    localStorage.setItem('dynamic_island_enabled', 'true');
}
window.setDynamicIsland(localStorage.getItem('dynamic_island_enabled') === 'true');

window.showToast = function(message) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        Object.assign(toastContainer.style, {
            position: 'fixed',
            bottom: '100px', // Above the floating player
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            zIndex: '10000',
            pointerEvents: 'none'
        });
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.innerHTML = `<i class="fas fa-info-circle" style="margin-right: 8px;"></i> ${message}`;
    Object.assign(toast.style, {
        background: 'var(--accent)',
        color: '#000000',
        padding: '12px 24px',
        borderRadius: '30px',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
        opacity: '0',
        transform: 'translateY(20px)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });
    
    toastContainer.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
    });
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            toast.remove();
            if (toastContainer.childNodes.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    }, 2500);
};

// ==========================================
// STATE & UTILS
// ==========================================

window.allTracks = window.allTracks || {};

window.toggleHeart = (event, trackId) => {
    if (event) {
        event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
    }
    const btn = event ? event.currentTarget : null;
    
    if (!Array.isArray(favoriteSongs)) favoriteSongs = [];
    let idx = favoriteSongs.findIndex(s => s && s.id === trackId);
    if (idx === -1) idx = favoriteSongs.findIndex(s => s && s.saavnId === trackId);
    let isFav = false;
    let removedEntry = null;
    
    if (idx > -1) {
        removedEntry = favoriteSongs[idx];
        favoriteSongs.splice(idx, 1);
        isFav = false;
        if (window.showToast) window.showToast('Removed from favorites');
    } else {
        let track = window.allTracks ? window.allTracks[trackId] : null;
        if (!track && window.currentRenderedTracks) track = window.currentRenderedTracks.find(s => s && s.id === trackId);
        if (!track && window.currentQueue) track = window.currentQueue.find(s => s && s.id === trackId);
        if (!track && window.currentQuickPicksQueue) track = window.currentQuickPicksQueue.find(s => s && s.id === trackId);
        if (!track) {
            let history = JSON.parse(localStorage.getItem('playHistory') || '[]');
            track = history.find(s => s && s.id === trackId);
        }
        if (!track) {
            const cardEl = document.querySelector(`[data-song-id="${trackId}"]`);
            const title = cardEl ? (cardEl.querySelector('.ff-title, .track-title, .qp-hero-title')?.innerText || 'Song') : 'Song';
            const artist = cardEl ? (cardEl.querySelector('.ff-artist, .track-artist, .qp-hero-artist')?.innerText || 'Artist') : 'Artist';
            track = { id: trackId, name: title, title: title, subtitle: artist };
        }
        favoriteSongs.push(track);
        isFav = true;
        if (window.showToast) window.showToast('Added to favorites');
    }
    saveFavorites();
    window.favoriteSongs = favoriteSongs;
    if (window.ytMirrorLike) window.ytMirrorLike((removedEntry && removedEntry.id) || trackId, isFav);
    
    // Safely update the clicked element without creating duplicate icons or wiping wrapper classes
    if (btn) {
        const heartIcon = (btn.tagName && btn.tagName.toLowerCase() === 'i') 
            ? btn 
            : (btn.querySelector ? (btn.querySelector('.fa-heart, i') || btn) : btn);
        if (heartIcon) {
            if (isFav) {
                heartIcon.classList.remove('far');
                heartIcon.classList.add('fas');
                heartIcon.style.color = 'var(--accent)';
            } else {
                heartIcon.classList.remove('fas');
                heartIcon.classList.add('far');
                heartIcon.style.color = 'var(--text-secondary)';
            }
        }
    }
    
    // Sync ALL matching heart icons for this track across the DOM
    document.querySelectorAll(`[data-song-id="${trackId}"] .fa-heart, [onclick*="'${trackId}'"]`).forEach(el => {
        const icon = (el.tagName && el.tagName.toLowerCase() === 'i' && el.classList.contains('fa-heart')) 
            ? el 
            : (el.querySelector ? el.querySelector('.fa-heart') : null);
        if (icon) {
            if (isFav) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = 'var(--accent)';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                icon.style.color = 'var(--text-secondary)';
            }
        }
    });
    
    // Sync Now Playing panel like button if applicable
    const curTrack = window.getCurrentTrack ? window.getCurrentTrack() : null;
    if (curTrack && curTrack.id === trackId) {
        const rpLikeBtn = document.getElementById('likeBtn') || document.querySelector('.np-title-row .fa-heart');
        if (rpLikeBtn) {
            rpLikeBtn.className = isFav ? 'fas fa-heart' : 'far fa-heart';
            rpLikeBtn.style.color = isFav ? 'var(--accent)' : 'var(--text-secondary)';
        }
    }

    if (window.electronAPI && window.electronAPI.updateDynamicIsland) {
        window.electronAPI.updateDynamicIsland({ type: 'like', active: isFav });
    }
    if (window.location.hash === '#favorites' && typeof renderFavorites === 'function') {
        renderFavorites();
    }
};

window.toggleLike = (trackId, btnElement) => {
    const fakeEvent = { stopPropagation: () => {}, preventDefault: () => {}, currentTarget: btnElement };
    window.toggleHeart(fakeEvent, trackId);
};

window.toggleFavoriteTrack = (trackId, btnElement) => {
    const fakeEvent = { stopPropagation: () => {}, preventDefault: () => {}, currentTarget: btnElement };
    window.toggleHeart(fakeEvent, trackId);
};

window.openAddToPlaylistModal = (trackId) => {
    if (typeof window.openPlaylistModal === 'function') {
        window.openPlaylistModal(trackId);
    }
};

let currentQueue = [];
let currentIndex = -1;
window.getCurrentTrack = () => currentQueue[currentIndex];
let favoriteSongs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');

// Scrub corrupted history on load
try {
    let _h = JSON.parse(localStorage.getItem('playHistory') || '[]');
    let _cleaned = _h.filter(t => t && t.id && t.artists?.primary?.[0]?.id);
    if (_h.length !== _cleaned.length) localStorage.setItem('playHistory', JSON.stringify(_cleaned));
} catch(e) {}

const saveFavorites = () => {
    localStorage.setItem('favoriteSongs', JSON.stringify(favoriteSongs));
};

const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

const DEFAULT_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%2318181b'/%3E%3Ccircle cx='75' cy='75' r='35' fill='%2327272a'/%3E%3Cpath d='M75 55c-11.05 0-20 8.95-20 20s8.95 20 20 20 20-8.95 20-20-8.95-20-20-20zm0 30c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10z' fill='%2352525b'/%3E%3C/svg%3E";

const getHighestQualityImage = (images) => {
    let url = DEFAULT_PLACEHOLDER;
    if (!images) return url;
    if (typeof images === 'string') url = images;
    else if (Array.isArray(images) && images.length > 0) {
        const last = images[images.length - 1];
        url = (last && (last.url || last.link)) || (typeof last === 'string' ? last : url);
    }
    else if (images.url) url = images.url;
    else if (images.link) url = images.link;
    
    if (typeof url !== 'string') return DEFAULT_PLACEHOLDER;
    if (url.includes('placeholder.com') || url.includes('ui-avatars.com') || url.includes('via.placeholder')) {
        url = DEFAULT_PLACEHOLDER;
    }
    
    if (url.includes('googleusercontent.com') && url.includes('=w')) {
        url = url.replace(/=w\d+-h\d+.*/, '=w1080-h1080-l90-rj');
    }
    if (url.includes('saavncdn.com')) {
        url = url.replace(/50x50|150x150/, '500x500');
    }
    if (url.includes('i.ytimg.com')) {
        url = url.replace(/\/default\.jpg|\/mqdefault\.jpg/, '/hqdefault.jpg');
    }
    return url;
};

window.__discordTrack = null;
window.__discordStart = null;
const RPC_PREF = 'discord_rpc_enabled';
window.discordRpcEnabled = localStorage.getItem(RPC_PREF) !== 'false';


window.discordSetRpcEnabled = function(on, silent) {
    window.discordRpcEnabled = !!on;
    try { localStorage.setItem(RPC_PREF, on ? 'true' : 'false'); } catch (e) {}
    const cb = document.getElementById('btn-discord-rpc');
    if (cb && cb.checked !== !!on) cb.checked = !!on;
    if (!on && window.discordAPI && window.discordAPI.setActivity) {
        window.discordAPI.setActivity({ details: '', state: '' });
    } else {
        window.syncDiscordActivity();
    }
    if (!silent && window.showToast) window.showToast('Discord Rich Presence ' + (on ? 'on' : 'off'));
};

window.discordToggleRpc = function(el) {
    window.discordSetRpcEnabled(!!el.checked, true);
};

const RPC_STATUS_PREF = 'discord_rpc_status';
window.__discordStatus = (function () {
    const s = localStorage.getItem(RPC_STATUS_PREF);
    return ['online', 'idle', 'dnd', 'invisible'].indexOf(s) >= 0 ? s : 'online';
})();

window.discordApplyStatusUi = function() {
    document.querySelectorAll('#discord-status-chips [data-status]').forEach((el) => {
        el.classList.toggle('is-on', el.dataset.status === window.__discordStatus);
    });
};

window.discordChooseStatus = function(s) {
    if (['online', 'idle', 'dnd', 'invisible'].indexOf(s) < 0) return;
    window.__discordStatus = s;
    try { localStorage.setItem(RPC_STATUS_PREF, s); } catch (e) {}
    window.discordApplyStatusUi();
    if (window.discordAPI && window.discordAPI.setStatus) {
        window.discordAPI.setStatus(s).then((r) => {
            if (r && r.ok === false && window.showToast) window.showToast('Discord status update failed');
        }).catch(() => {});
    }
};

const RPC_DETAILS_PREF = 'discord_use_details';
window.discordUseDetails = localStorage.getItem(RPC_DETAILS_PREF) === 'true';

window.discordToggleDetails = function(el) {
    window.discordUseDetails = !!el.checked;
    try { localStorage.setItem(RPC_DETAILS_PREF, el.checked ? 'true' : 'false'); } catch (e) {}
    window.syncDiscordActivity();
};

document.addEventListener('keydown', (e) => {
    if (!e.ctrlKey || !e.shiftKey || e.altKey || e.metaKey) return;
    if (e.key !== 'D' && e.key !== 'd') return;
    const el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    e.preventDefault();
    window.discordSetRpcEnabled(!window.discordRpcEnabled, false);
});

window.__discordSyncNow = function() {
    if (!window.discordRpcEnabled) return;
    if (!window.discordAPI || !window.discordAPI.setActivity) return;
    const t = window.__discordTrack;
    if (!t) {
        window.discordAPI.setActivity({ details: '', state: '' });
        return;
    }
    const playing = document.body.classList.contains('is-playing');
    if (playing && !window.__discordStart) window.__discordStart = Date.now();
    if (!playing) window.__discordStart = null;

    let start = null, end = null;
    if (playing) {
        const el = document.getElementById('audioElement');
        const dur = (el && isFinite(el.duration) && el.duration > 0)
            ? el.duration
            : (t.duration || 0);
        const pos = (el && isFinite(el.currentTime)) ? el.currentTime : 0;
        if (dur > 0) {
            start = Date.now() - pos * 1000;
            end = start + dur * 1000;
        } else {
            start = window.__discordStart;
        }
    }

    const rpcButtons = window.discordTrackButtons(t);
    window.discordAPI.setActivity({
        details: t.name || '',
        state: window.discordTrackArtists(t),
        largeImage: getHighestQualityImage(t.image),
        largeText: t.album?.name || t.name,
        smallImage: 'https://raw.githubusercontent.com/d0x-dev/Airbeats-Desktop/main/electron-app/icon.png',
        smallText: 'AirBeats',
        startTimestamp: start,
        endTimestamp: end,
        statusDisplayType: window.discordUseDetails ? 2 : 1,
        detailsUrl: window.discordSongUrl(t) || undefined,
        buttons: rpcButtons
    });
    if (window.dlog) {
        window.dlog('sync playing=' + playing + ' t=' + (t.name || '')
            + ' @' + ((new Error().stack || '').split('\n')[2] || '(?)'));
    }
};

window.discordTrackArtists = function (t) {
    const list = (t && t.artists && t.artists.primary) ? t.artists.primary : [];
    const names = list.map((a) => a && a.name).filter(Boolean);
    return names.length ? names.join(', ') : '';
};

window.discordSongUrl = function (t) {
    return t && t.id ? 'https://play.airbeats.org/song?id=' + encodeURIComponent(t.id) : '';
};

window.discordTrackButtons = function (t) {
    const songUrl = window.discordSongUrl(t);
    const list = [{ label: 'Visit AirBeats', url: 'https://airbeats.org' }];
    if (songUrl) list.unshift({ label: 'Listen on YouTube Music', url: songUrl });
    return list;
};

window.syncDiscordActivity = function() {
    clearTimeout(window.__discordSyncTimer);
    window.__discordSyncTimer = setTimeout(window.__discordSyncNow, 400);
};

window.discordUpdatePreview = function() {
    const box = document.getElementById('discord-preview');
    if (!box) return;
    const t = window.__discordTrack;
    if (!t) {
        box.style.display = 'none';
        return;
    }
    box.style.display = '';
    const art = document.getElementById('discord-preview-art');
    if (art) art.src = getHighestQualityImage(t.image) || '';
    const title = document.getElementById('discord-preview-title');
    if (title) title.textContent = t.name || '';
    const artist = document.getElementById('discord-preview-artist');
    if (artist) artist.textContent = window.discordTrackArtists(t);
    const el = document.getElementById('audioElement');
    const dur = (el && isFinite(el.duration) && el.duration > 0) ? el.duration : (t.duration || 0);
    const pos = (el && isFinite(el.currentTime)) ? el.currentTime : 0;
    const bar = document.getElementById('discord-preview-bar');
    if (bar) bar.style.width = dur > 0 ? Math.min(100, (pos / dur) * 100).toFixed(1) + '%' : '0%';
    const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    const elapsed = document.getElementById('discord-preview-elapsed');
    if (elapsed) elapsed.textContent = fmt(pos);
    const total = document.getElementById('discord-preview-total');
    if (total) total.textContent = fmt(dur);
    const wrap = document.getElementById('discord-preview-buttons');
    if (wrap) {
        wrap.innerHTML = window.discordTrackButtons(t)
            .map((b) => `<span style="flex: 1; text-align: center; padding: 8px 10px; border-radius: 8px; background: var(--app-bg); font-size: 13px;">${b.label}</span>`)
            .join('');
    }
};

setInterval(() => {
    if (document.getElementById('discord-preview')) window.discordUpdatePreview();
}, 1000);

window.ytAccount = null;
window.ytAccountCardMode = 'full';

window.ytAccountCardHtml = function() {
    const state = window.ytAccount;
    const compact = window.ytAccountCardMode === 'compact';
    const photo = state && state.photo
        ? `<img src="${state.photo}" referrerpolicy="no-referrer" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex: none;">`
        : `<span style="width: 48px; display: inline-flex; justify-content: center; flex: none;">${window.airBrandIcon('youtube', 30, '#FF0000')}</span>`;
    const name = state ? (state.name || 'YouTube Music') : 'Not signed in';
    const subtitle = state ? (state.handle || 'Signed in') : 'Sign in to sync your library';
    if (compact) {
        return `
            <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                <h3 style="margin-top: 0; font-size: 20px;"><i class="fas fa-user-circle" style="color: var(--accent-text);"></i> Account</h3>
                <div style="display: flex; align-items: center; gap: 14px;">
                    ${photo}
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 15px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</div>
                        <div style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${subtitle}</div>
                    </div>
                    <a href="#settings/account" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 10px 18px; border-radius: 8px; text-decoration: none; flex: none;">Manage</a>
                </div>
            </div>
        `;
    }
    return `
        <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; font-size: 20px;">${window.airBrandIcon('youtube', 18, '#FF0000')} YouTube Music Account</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Sign in with your Google account to load your playlists, liked songs and subscriptions inside AirBeats.</p>
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 18px;">
                ${photo}
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</div>
                    <div style="font-size: 13px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${subtitle}</div>
                </div>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <button class="btn" style="background: #FF0000; color: #fff; padding: 10px 18px; border-radius: 8px; cursor: pointer;" onclick="window.ytOpenLogin()"><i class="fab fa-google"></i> ${state ? 'Switch Account' : 'Sign in with Google'}</button>
                ${state ? `<button class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 10px 18px; border-radius: 8px; cursor: pointer;" onclick="window.ytLogout()"><i class="fas fa-right-from-bracket"></i> Sign out</button>` : ''}
            </div>
            <details style="margin-top: 16px;">
                <summary style="cursor: pointer; color: var(--text-secondary); font-size: 13px;">Login window not working? Paste cookies manually</summary>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 10px;">Open music.youtube.com in your browser and sign in. Then open DevTools &rarr; Network, click any request, and copy the <b>cookie</b> request header value here.</div>
                <textarea id="yt-cookie-input" rows="3" placeholder="SID=...; HSID=...; SAPISID=..." style="width: 100%; margin-top: 10px; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--text-secondary); background: var(--app-bg); color: var(--text-primary); font-size: 12px; resize: vertical;"></textarea>
                <button class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-top: 10px;" onclick="window.ytPasteLogin()">Save cookies</button>
            </details>
        </div>
    `;
};

window.ytRefreshAccount = async function() {
    try {
        const res = await fetch('/api/yt/status');
        const data = await res.json();
        const info = (data && data.data) || {};
        window.ytAccount = info.loggedIn ? info : null;
    } catch (e) {
        window.ytAccount = null;
    }
    const card = document.getElementById('yt-account-card');
    if (card) card.innerHTML = window.ytAccountCardHtml();
    if (window.ytAccount && window.ytSyncFavorites) window.ytSyncFavorites();
    return window.ytAccount;
};

window.ytOpenLogin = async function() {
    if (!window.ytmusicAPI || !window.ytmusicAPI.openLogin) {
        if (window.showToast) window.showToast('Login window unavailable');
        return;
    }
    if (window.showToast) window.showToast('Opening YouTube Music sign-in...');
    let result = null;
    try {
        result = await window.ytmusicAPI.openLogin();
    } catch (e) { }
    if (result && result.ok) {
        if (window.showToast) window.showToast('Signed in to YouTube Music');
    } else if (window.showToast) {
        window.showToast('Not signed in');
    }
    await window.ytRefreshAccount();
    if (window.location.hash.indexOf('likedsongs') >= 0 && window.renderLikedSongs) window.renderLikedSongs();
};

window.ytPasteLogin = async function() {
    const input = document.getElementById('yt-cookie-input');
    const value = input ? input.value : '';
    if (!value.trim()) {
        if (window.showToast) window.showToast('Paste cookies first');
        return;
    }
    if (window.showToast) window.showToast('Checking cookies...');
    try {
        const res = await fetch('/api/yt/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: value })
        });
        const data = await res.json();
        if (data && data.success) {
            if (input) input.value = '';
            if (window.showToast) window.showToast('Signed in to YouTube Music');
        } else if (window.showToast) {
            window.showToast('Login failed: ' + ((data && data.error) || 'unknown error'));
        }
    } catch (e) {
        if (window.showToast) window.showToast('Login failed');
    }
    await window.ytRefreshAccount();
};

window.ytLogout = async function() {
    try {
        await fetch('/api/yt/logout', { method: 'POST' });
    } catch (e) { }
    if (window.showToast) window.showToast('Signed out of YouTube Music');
    await window.ytRefreshAccount();
    if (window.location.hash.indexOf('likedsongs') >= 0 && window.renderLikedSongs) window.renderLikedSongs();
};

window.renderSettingsAccount = async function() {
    window.ytAccountCardMode = 'full';
    await window.ytRefreshAccount();
    await window.airLoadSettings(true);
    const useLogin = window.airSetting('use_login_for_browse', true) !== false;
    routerView.innerHTML = `
        <div class="settings-page" style="padding: 20px 30px; max-width: 860px; margin: 0 auto; color: var(--text-primary);">
            <div class="hero-header" style="background: none; border-bottom: 1px solid var(--border-color); margin-bottom: 20px; padding: 10px 0 20px 0;">
                <div class="hero-info">
                    <div class="hero-title" style="font-size: 32px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 12px;"><i class="fas fa-user-circle" style="color: var(--accent-text);"></i> ${window.t('account')}</div>
                    <div class="hero-meta" style="color: var(--text-secondary); font-size: 14px;">Manage your YouTube Music account, Discord presence and library sync</div>
                </div>
            </div>
            <div class="acc-tabs">
                <button id="accTab-google" class="acc-tab active" onclick="window.accSwitchTab('google')"><i class="fab fa-google"></i> Google</button>
                <button id="accTab-discord" class="acc-tab" onclick="window.accSwitchTab('discord')">${window.airBrandIcon('discord', 15)} Discord</button>
            </div>
            <div id="accPanel-google">
                <div id="yt-account-card">${window.ytAccountCardHtml()}</div>
                <div class="air-card" style="margin-bottom: 24px;">
                    <div class="air-card-title"><i class="fas fa-crown"></i> Browsing &amp; Sync</div>
                    <div class="air-setting-row">
                        <div class="air-setting-row-main">
                            <div class="air-setting-title">Use login for browsing premium content</div>
                            <div class="air-setting-desc">Signed in, the app browses publicly by default. Enable this to browse with your Google account so premium-only songs, albums and shelf rows appear too.</div>
                        </div>
                        <label class="air-switch"><input type="checkbox" id="airUseLoginSwitch" ${useLogin ? 'checked' : ''} onchange="window.setUseLoginForBrowse(this.checked)"><span></span></label>
                    </div>
                    <div class="air-setting-row">
                        <div class="air-setting-row-main">
                            <div class="air-setting-title">${window.t('advancedLogin')}</div>
                            <div class="air-setting-desc">View the stored YouTube Music auth token. It stays masked until you reveal it; copy it when you need to move the login to another device.</div>
                        </div>
                        <button class="air-chip" onclick="window.airToggleTokenZone()"><i class="fas fa-key"></i> ${window.t('showToken')}</button>
                    </div>
                    <div id="air-token-zone" style="display:none; margin-top: 12px;"></div>
                </div>
                <div class="air-card" style="margin-bottom: 24px;">
                    <div class="air-card-title"><i class="fas fa-list-music" style="color:#FF0000;"></i> Library Sync</div>
                    <p style="color: var(--text-secondary); margin: 0 0 16px 0; font-size: 14px;">Everything stays global: songs you play are saved to your YouTube Music history, likes sync to your YouTube Music account, and your playlists, liked songs and subscriptions appear on the Playlists page. Signed out, everything is saved locally in the app.</p>
                    <a href="#playlists" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 10px 18px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;"><i class="fas fa-arrow-right"></i> Open Playlists &amp; Library</a>
                </div>
            </div>
            <div id="accPanel-discord" style="display:none;">
                ${window.discordCardHtml()}
            </div>
            <div style="height: 40px;"></div>
        </div>
    `;
    setTimeout(() => { window.discordCardInit(); }, 60);
};

window.discordLogin = function() {
    if (!window.discordAPI) return;
    window.discordSetStatus('Opening Discord login…');
    window.discordAPI.login();
};

window.discordLogout = async function() {
    if (!window.discordAPI) return;
    await window.discordAPI.logout();
    window.discordSetStatus('Logged out.');
};

window.discordPasteToken = async function() {
    const input = document.getElementById('discord-token-input');
    if (!input || !window.discordAPI) return;
    const t = input.value.trim();
    if (!t) return;
    window.discordSetStatus('Checking token…');
    try {
        await window.discordAPI.setToken(t);
        input.value = '';
    } catch (e) {
        window.discordSetStatus('Failed: ' + e.message, true);
    }
};

window.discordDebugDump = function() {
    if (!window.discordAPI || !window.discordAPI.dump) return;
    window.discordSetStatus('Dumping login page storage...');
    window.discordAPI.dump();
};

window.addEventListener('error', (e) => {
    try { window.dlog('JS ERROR: ' + e.message + ' @ ' + e.filename + ':' + e.lineno); } catch (x) {}
});
window.addEventListener('unhandledrejection', (e) => {
    try { window.dlog('UNHANDLED: ' + (e.reason && e.reason.message || e.reason)); } catch (x) {}
});

window.dlog = function(m) {
    if (window.discordAPI && window.discordAPI.rlog) window.discordAPI.rlog(m);
};

window.discordSetStatus = function(text, isError) {
    const box = document.getElementById('discord-status-box');
    if (!box) return;
    box.textContent = text || '';
    box.style.color = isError ? '#ff6b6b' : 'var(--text-secondary)';
};

window.discordRefreshState = async function() {
    window.dlog('refreshState: user=' + (window.__discordUser ? 'YES' : 'null')
        + ' cache=' + (localStorage.getItem('discord_user') ? 'YES' : 'none'));
    if (!window.__discordUser) {
        try {
            const raw = localStorage.getItem('discord_user');
            if (raw) window.__discordUser = JSON.parse(raw);
        } catch (e) {}
        if (window.__discordUser) window.discordRenderState(true, window.__discordUser);
    }
    if (!window.discordAPI || !window.discordAPI.getState) return;
    try {
        const st = await window.discordAPI.getState();
        window.dlog('getState -> ' + JSON.stringify(st));
        if (st && st.status) {
            window.__discordStatus = st.status;
            try { localStorage.setItem(RPC_STATUS_PREF, st.status); } catch (e) {}
            window.discordApplyStatusUi();
        }
        if (st && st.ok) {
            window.__discordUser = st.user;
            try { localStorage.setItem('discord_user', JSON.stringify(st.user)); } catch (e) {}
            window.discordRenderState(true, st.user);
        } else {
            window.dlog('getState NOT ok -> forcing logged-out UI');
            window.__discordUser = null;
            try { localStorage.removeItem('discord_user'); } catch (e) {}
            window.discordRenderState(false);
        }
    } catch (e) {
    }
};

window.__discordUiState = { loggedIn: false, user: null };

window.discordApplyUiState = function() {
    const st = window.__discordUiState;
    if (!st) return;
    document.querySelectorAll('#btn-discord-login').forEach((b) => {
        b.style.display = st.loggedIn ? 'none' : '';
    });
    document.querySelectorAll('#btn-discord-logout').forEach((b) => {
        b.style.display = st.loggedIn ? '' : 'none';
    });
    const box = document.getElementById('btn-discord-rpc');
    if (box) box.checked = window.discordRpcEnabled;
    const det = document.getElementById('btn-discord-details');
    if (det) det.checked = window.discordUseDetails;
    if (st.loggedIn && st.user) {
        const el = document.getElementById('discord-status-box');
        if (el) el.textContent = 'Connected as ' + (st.user.name || st.user.username)
            + ' (@"' + st.user.username + '")';
    }
    window.discordApplyStatusUi();
};

window.discordRenderState = function(loggedIn, user) {
    window.__discordUiState = { loggedIn: !!loggedIn, user: user || null };
    const _caller = (new Error().stack || '').split('\n').slice(2, 4).join(' <- ').replace(/\s+/g, ' ');
    const _b = document.querySelector('#btn-discord-login');
    window.dlog('renderState loggedIn=' + loggedIn
        + ' loginBtns=' + document.querySelectorAll('#btn-discord-login').length
        + ' logoutBtns=' + document.querySelectorAll('#btn-discord-logout').length
        + ' loginDisplay=' + (_b ? getComputedStyle(_b).display : 'NO-ELEM')
        + ' from ' + _caller);
    document.querySelectorAll('#btn-discord-login').forEach((b) => {
        b.style.display = loggedIn ? 'none' : '';
    });
    document.querySelectorAll('#btn-discord-logout').forEach((b) => {
        b.style.display = loggedIn ? '' : 'none';
    });
    window.discordSetStatus(loggedIn && user
        ? 'Connected as ' + (user.name || user.username) + ' (@"' + user.username + '")'
        : '');
    window.discordApplyUiState();
};

(function () {
    let t = null;
    const kick = () => {
        clearTimeout(t);
        t = setTimeout(() => {
            if (document.getElementById('btn-discord-login')
                || document.getElementById('btn-discord-rpc')) {
                window.discordApplyUiState();
            }
        }, 20);
    };
    const start = () => {
        if (!document.body) return;
        new MutationObserver(kick).observe(document.body, { childList: true, subtree: true });
    };
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
})();

if (window.discordAPI && window.discordAPI.onStatus) {
    window.discordAPI.onStatus((data) => {
        if (!data) return;
        if (data.ok) {
            window.__discordUser = data.user || null;
            try {
                if (data.user) localStorage.setItem('discord_user', JSON.stringify(data.user));
                else localStorage.removeItem('discord_user');
            } catch (e) {}
            window.discordRenderState(true, data.user);
            window.syncDiscordActivity();
        } else if (data.loggedOut) {
            window.__discordUser = null;
            try { localStorage.removeItem('discord_user'); } catch (e) {}
            window.discordRenderState(false);
        } else {
            window.discordSetStatus(data.error || 'Login failed.', true);
        }
    });
}

// ==========================================
    
// ==========================================
// ROUTER
// ==========================================
const routerView = document.getElementById('router-view');
const globalLoading = document.getElementById('globalLoading');
const searchInput = document.getElementById('globalSearch');

window.pageCache = {};

// Immediately set route-home class if starting on home screen
(function() {
    const initHash = window.location.hash || '#home';
    if (!initHash || initHash === '#home' || initHash.startsWith('#home/')) {
        document.body.classList.add('route-home');
    }
})();

const router = async (forceRefresh = false) => {
    if (typeof forceRefresh !== 'boolean') forceRefresh = false;
    const hash = window.location.hash || '#home';
    const [route, id] = hash.substring(1).split('/');
    const cacheKey = route + (id ? '/' + id : '');

    if (window.airScrollTop) window.airScrollTop();

    // Set route-home on body to style home components
    const isHome = (route === 'home');
    document.body.classList.toggle('route-home', isHome);
    const npToggle = document.getElementById('topNowPlayingToggle');
    if (npToggle) {
        npToggle.style.display = document.body.classList.contains('has-active-track') ? 'inline-block' : 'none';
    }
    
    // Toggle sidebar state for settings
    const isSettingsLike = route === 'settings' || route === 'developer-news' || route === 'developer_news' || route === 'news';
    if (window.updateSidebarState) {
        window.updateSidebarState(isSettingsLike);
    }

    // Update active nav
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => el.classList.remove('active'));
    let navId = `nav-${route}`;
    if (route === 'settings') navId = `nav-settings-${id || 'backup'}`;
    if (route === 'developer-news' || route === 'developer_news' || route === 'news') navId = 'nav-settings-developer-news';
        if (document.getElementById(navId)) {
        document.getElementById(navId).classList.add('active');
    }
    let mobNavId = `mob-nav-${route}`;
    if (document.getElementById(mobNavId)) {
        document.getElementById(mobNavId).classList.add('active');
    }

    const scrollContainer = document.querySelector('.scroll-container');
    if (scrollContainer) scrollContainer.onscroll = null;

    const noCacheRoutes = ['settings', 'playlists', 'likedsongs', 'userplaylist', 'favorites', 'history', 'cached', 'stats', 'developer-news', 'developer_news', 'news'];
    if (!forceRefresh && window.pageCache[cacheKey] && !noCacheRoutes.includes(route)) {
        routerView.innerHTML = window.pageCache[cacheKey];
        globalLoading.style.display = 'none';
        return;
    }

    routerView.innerHTML = '';
    globalLoading.style.display = 'flex';

    const offlineAllowedRoutes = ['cached', 'favorites', 'history', 'playlists', 'userplaylist', 'settings', 'stats', 'developer-news', 'developer_news', 'news'];
    if (!navigator.onLine && !offlineAllowedRoutes.includes(route)) {
        globalLoading.style.display = 'none';
        routerView.innerHTML = `<div style='display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; text-align: center; color: var(--text-secondary);'>
            <i class='fas fa-wifi' style='font-size: 64px; margin-bottom: 20px; opacity: 0.5;'></i>
            <h2 style='color: var(--text-primary); margin-bottom: 10px;'>No Internet Connection</h2>
            <p>Please check your network settings and try again.</p>
            <button class='btn-primary' onclick='router()' style='margin-top: 20px;'>Retry</button>
        </div>`;
        return;
    }

    try {
        if (route === 'home') await renderHome();
        else if (route === 'explore') await renderExplore();
        else if (route === 'mood') await renderMoodCategory(id);
        else if (route === 'stats') await renderStats();
        else if (route === 'search') await renderSearch(decodeURIComponent(id || ''));
        else if (route === 'artist') await renderArtist(id);
        else if (route === 'album') await renderAlbum(id);
        else if (route === 'playlist') await renderPlaylist(id);
        else if (route === 'favorites') await renderFavorites();
        else if (route === 'history') await renderHistory();
        else if (route === 'artists') await renderSubscribedArtists();
        else if (route === 'albums') await renderSavedAlbums();
        else if (route === 'new-releases') await renderNewReleases();
        else if (route === 'library') await renderMobileLibrary();
        else if (route === 'likedsongs') await renderLikedSongs();
        else if (route === 'playlists') await renderUserPlaylists();
        else if (route === 'cached') await renderCachedSongs();
        else if (route === 'userplaylist') await renderSingleUserPlaylist(id);
        else if (route === 'settings' && id === 'appearance') await renderSettingsAppearance();
        else if (route === 'settings' && id === 'aod') await renderSettingsAOD();
        else if (route === 'settings' && (id === 'developer-news' || id === 'developer_news' || id === 'news')) await renderDeveloperNews();
        else if (route === 'settings' && id === 'about') await renderSettingsAbout();
        else if (route === 'settings' && id === 'updates') await renderSettingsUpdates();
        else if (route === 'settings' && id === 'account') await renderSettingsAccount();
        else if (route === 'settings' && id === 'content') await renderSettingsContent();
        else if (route === 'settings' && id === 'logs') await renderSettingsLogs();
        else if (route === 'settings' && (id === 'backup' || !id)) await renderSettingsBackup();
        else if (route === 'developer-news' || route === 'developer_news' || route === 'news') await renderDeveloperNews();
        else routerView.innerHTML = `<h2>Page Not Found</h2>`;
    } catch (e) {
        console.error('Route error', e);
        if (e.message && e.message.includes('Failed to fetch')) {
            routerView.innerHTML = `<div style='display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; text-align: center; color: var(--text-secondary);'>
                <i class='fas fa-wifi' style='font-size: 64px; margin-bottom: 20px; opacity: 0.5;'></i>
                <h2 style='color: var(--text-primary); margin-bottom: 10px;'>Network Error</h2>
                <p>Failed to communicate with the server. Please check your internet connection.</p>
                <button class='btn-primary' onclick='router()' style='margin-top: 20px;'>Retry</button>
            </div>`;
        } else {
            routerView.innerHTML = `<h2 style="color:var(--danger); padding:20px;">Error loading page<br><pre style="font-size:12px; color:var(--text); white-space: pre-wrap; word-wrap: break-word;">${e.stack || e}</pre></h2>`;
        }
    }

    if (routerView.innerHTML && !routerView.innerHTML.includes('Error loading page') && !routerView.innerHTML.includes('Network Error') && !routerView.innerHTML.includes('No Internet Connection')) {
        if (!noCacheRoutes.includes(route)) {
            window.pageCache[cacheKey] = routerView.innerHTML;
        }
    }

    globalLoading.style.display = 'none';

    // Pages always start from the top (scroll position never carries over).
    if (window.requestAnimationFrame) requestAnimationFrame(() => window.airScrollTop()); else window.airScrollTop();
};

// Serialize route renders — a slow render must never overwrite a newer page.
let __airRouterBusy = Promise.resolve();
function airQueuedRouter(forceRefresh) {
    const run = () => router(forceRefresh === true);
    const next = __airRouterBusy.then(run, run);
    __airRouterBusy = next.catch(() => { });
    return next;
}
window.router = airQueuedRouter;
window.addEventListener('hashchange', airQueuedRouter);
window.addEventListener('offline', airQueuedRouter);
window.addEventListener('online', airQueuedRouter);
document.addEventListener('DOMContentLoaded', () => {
    
    const savedPanel = localStorage.getItem('panel_color');
    if (savedPanel) {
        document.documentElement.style.setProperty('--sidebar-bg', savedPanel);
        document.documentElement.style.setProperty('--player-bg', savedPanel);
    }

    const savedAccent = localStorage.getItem('accent_color');
    if (savedAccent) {
        document.documentElement.style.setProperty('--accent', savedAccent);
        document.documentElement.style.setProperty('--primary-color', savedAccent);
    }

    const globalSpinnerEl = document.querySelector('#globalLoading .lottie-spinner');
    if (globalSpinnerEl && typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: globalSpinnerEl,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/static/loader.json'
        });
    }

    // Delay router slightly to allow browser to fetch loader.json and fire load event
    setTimeout(airQueuedRouter, 100);

    // Initialize News From Developers
    if (window.DeveloperNewsManager) {
        window.DeveloperNewsManager.init();
    }
});

const searchSuggestions = document.getElementById('searchSuggestions');

let airSugIndex = -1;
function airSugItems() {
    return searchSuggestions ? [...searchSuggestions.querySelectorAll('.suggestion-item')] : [];
}
function airSugHighlight(idx) {
    const items = airSugItems();
    if (!items.length) { airSugIndex = -1; return; }
    if (idx < 0) idx = items.length - 1;
    if (idx >= items.length) idx = 0;
    airSugIndex = idx;
    items.forEach((el, i) => el.classList.toggle('active', i === idx));
    const el = items[idx];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
}

function saveSearchHistory(query) {
    if (!query) return;
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history = history.filter(q => q.toLowerCase() !== query.toLowerCase());
    history.unshift(query);
    if (history.length > 10) history.pop();
    localStorage.setItem('searchHistory', JSON.stringify(history));
}

window.airRemoveSearchHistory = function (index) {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history.splice(index, 1);
    localStorage.setItem('searchHistory', JSON.stringify(history));
    renderSearchHistory();
};

window.airClearSearchHistory = function () {
    localStorage.setItem('searchHistory', '[]');
    searchSuggestions.style.display = 'none';
};

function renderSearchHistory() {
    airSugIndex = -1;
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    if (history.length === 0) {
        searchSuggestions.style.display = 'none';
        return;
    }
    const esc = window.airEsc || ((s) => s);
    searchSuggestions.innerHTML = `
        <div class="suggestion-head">
            <span>Recent Searches</span>
            <button class="suggestion-clear" onclick="event.stopPropagation(); window.airClearSearchHistory()">Clear all</button>
        </div>` + history.map((q, i) => `
        <div class="suggestion-item" onclick="executeSearch('${window.airJsAttrEsc(q)}')">
            <i class="fas fa-history" style="color:var(--text-secondary); width: 40px; text-align:center;"></i>
            <div class="suggestion-info">
                <div class="suggestion-title">${esc(q)}</div>
            </div>
            <button class="suggestion-del" title="Remove from history" onclick="event.stopPropagation(); window.airRemoveSearchHistory(${i})"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
    searchSuggestions.style.display = 'flex';
}

window.updateSearchClearBtn = function() {
    const box = document.querySelector('.search-box');
    if (box && searchInput) box.classList.toggle('has-text', searchInput.value.length > 0);
};

window.clearGlobalSearch = function() {
    if (!searchInput) return;
    searchInput.value = '';
    if (searchSuggestions) {
        searchSuggestions.style.display = 'none';
        searchSuggestions.innerHTML = '';
    }
    window.updateSearchClearBtn();
    searchInput.focus();
};

window.executeSearch = function(query) {
    searchInput.value = query;
    searchSuggestions.style.display = 'none';
    window.updateSearchClearBtn();
    saveSearchHistory(query);
    window.location.hash = `#search/${encodeURIComponent(query)}`;
};

let searchTimeout;
searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    window.updateSearchClearBtn();
    airSugIndex = -1;
    clearTimeout(searchTimeout);
    
    if (!val) {
        renderSearchHistory();
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`/api/search/suggestions?query=${encodeURIComponent(val)}`);
            const data = await res.json();
            if (data.success && data.data && data.data.length > 0) {
                const uniqueNames = data.data.slice(0, 5);
                searchSuggestions.innerHTML = uniqueNames.map(name => `
                    <div class="suggestion-item" onclick="executeSearch('${window.airJsAttrEsc(name)}')">
                        <i class="fas fa-search" style="color:var(--text-secondary); width: 40px; text-align:center;"></i>
                        <div class="suggestion-info">
                            <div class="suggestion-title">${name}</div>
                        </div>
                    </div>
                `).join('');
                searchSuggestions.style.display = 'flex';
            } else {
                searchSuggestions.style.display = 'none';
            }
        } catch (err) {
            console.error(err);
        }
    }, 300);
});

searchInput.addEventListener('focus', () => {
    if (!searchInput.value.trim()) {
        renderSearchHistory();
    } else if (searchSuggestions.innerHTML.trim() !== '') {
        searchSuggestions.style.display = 'flex';
    }
});

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
        searchSuggestions.style.display = 'none';
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim() !== '') {
        executeSearch(searchInput.value.trim());
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (searchSuggestions.style.display !== 'none') airSugHighlight(airSugIndex + 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (searchSuggestions.style.display !== 'none') airSugHighlight(airSugIndex - 1);
    } else if (e.key === 'Enter') {
        const items = airSugItems();
        if (searchSuggestions.style.display !== 'none' && airSugIndex >= 0 && items[airSugIndex]) {
            e.preventDefault();
            items[airSugIndex].click();
        }
    } else if (e.key === 'Escape') {
        searchSuggestions.style.display = 'none';
        airSugIndex = -1;
    }
});

// ==========================================
// VIEWS
// ==========================================
window.scrollShelf = function(id, dir) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollBy({ left: dir * 520, behavior: 'smooth' });
    }
};

window.playQuickPickTrack = function(songId) {
    if (window.currentQuickPicksQueue && window.currentQuickPicksQueue.length > 0) {
        const idx = window.currentQuickPicksQueue.findIndex(s => s.id === songId);
        if (idx !== -1) {
            playList(window.currentQuickPicksQueue, idx);
            return;
        }
    }
    playSingleTrack(songId);
};

window.playShelfItem = function(id, type) {
    if (type === 'song') {
        playSingleTrack(id);
    } else if (type === 'album') {
        window.location.hash = `#album/${id}`;
    } else if (type === 'artist') {
        window.location.hash = `#artist/${id}`;
    } else if (type === 'playlist') {
        window.location.hash = `#playlist/${id}`;
    } else {
        playSingleTrack(id);
    }
};

function safeEscape(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function renderHome() {
    document.getElementById('globalLoading').style.display = 'flex';
    routerView.innerHTML = '';

    // 1. Get cached local state
    const history = JSON.parse(localStorage.getItem('playHistory') || '[]');
    const favs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
    const playedArtists = JSON.parse(localStorage.getItem('playedArtists') || '[]');
    const lastPlayedAlbumStr = localStorage.getItem('lastPlayedAlbum');
    let lastPlayedAlbum = null;
    try { if (lastPlayedAlbumStr) lastPlayedAlbum = JSON.parse(lastPlayedAlbumStr); } catch(e){}

    const currentTrack = (typeof window.getCurrentTrack === 'function') ? window.getCurrentTrack() : null;
    const currentPlayingId = currentTrack ? currentTrack.id : null;
    const isPlayingNow = document.body.classList.contains('is-playing');

    // 2. Determine top artist for "Similar To"
    let topArtist = null;
    if (playedArtists.length > 0) {
        topArtist = playedArtists[0];
    } else if (history.length > 0) {
        const hSong = history.find(s => s.artists?.primary?.[0]?.name);
        if (hSong) {
            const a = hSong.artists.primary[0];
            topArtist = { id: a.id || '', name: a.name || '' };
        }
    }

    try {
        // Parallel fetch for home feed and similar recommendations
        const homePromise = fetch('/api/home').then(r => r.json()).catch(() => ({ success: false }));
        let similarPromise = Promise.resolve({ success: false, data: [] });
        const forceSim = window.__airForceSimilar ? '&refresh=1' : '';
        window.__airForceSimilar = false;
        if (topArtist && (topArtist.id || topArtist.name)) {
            const url = topArtist.id 
                ? `/api/similar_to?artist_id=${topArtist.id}${forceSim}`
                : `/api/similar_to?artist_name=${encodeURIComponent(topArtist.name)}${forceSim}`;
            similarPromise = fetch(url).then(r => r.json()).catch(() => ({ success: false, data: [] }));
        }

        const [homeRes, similarRes] = await Promise.all([homePromise, similarPromise]);
        const homeData = (homeRes && homeRes.success && homeRes.data) ? homeRes.data : {};
        const similarTracks = (similarRes && similarRes.success && Array.isArray(similarRes.data)) ? similarRes.data : [];

        // If no topArtist existed yet, pick the first popular artist
        if (!topArtist && homeData.popular_artists && homeData.popular_artists.length > 0) {
            topArtist = homeData.popular_artists[0];
        }

        let html = `<div class="home-container">
        <div class="home-refresh-row">
            <button class="home-refresh-btn" onclick="window.airRefreshHomeFeed(this)" title="Refresh feed">
                <i class="fas fa-sync-alt"></i> Refresh
            </button>
        </div>`;

        // ==========================================
        // 1. TOP QUICK ACTION CHIPS ROW (Android Airbeats style)
        // ==========================================
        html += `
        <div class="home-chips-bar">
            <a href="#history" class="home-chip"><i class="fas fa-history"></i> Recently Played</a>
            <a href="#favorites" class="home-chip"><i class="fas fa-heart"></i> Favorite Songs</a>
            <a href="#playlists" class="home-chip"><i class="fas fa-list"></i> Playlists</a>
            <a href="#cached" class="home-chip"><i class="fas fa-download"></i> Cached Songs</a>
            <a href="#new-releases" class="home-chip"><i class="fas fa-compact-disc"></i> New Releases</a>
            <a href="javascript:void(0)" onclick="window.playMadeForYouShuffle()" class="home-chip"><i class="fas fa-shuffle"></i> Shuffle Play</a>
        </div>
        `;

        // ==========================================
        // 2. QUICK PICKS (Hero Carousel Showcase)
        // ==========================================
        // Build Quick Picks: User's top frequent / liked songs, augmented by remote quick picks
        let combinedQuickPicks = [];
        const seenIds = new Set();

        // Add favorites first
        favs.slice(0, 10).forEach(s => {
            if (!seenIds.has(s.id)) {
                seenIds.add(s.id);
                combinedQuickPicks.push(s);
            }
        });
        // Add recent history
        history.slice(0, 10).forEach(s => {
            if (!seenIds.has(s.id)) {
                seenIds.add(s.id);
                combinedQuickPicks.push(s);
            }
        });
        // Supplement from remote quick_picks
        if (homeData.quick_picks && Array.isArray(homeData.quick_picks)) {
            homeData.quick_picks.forEach(s => {
                if (!seenIds.has(s.id)) {
                    seenIds.add(s.id);
                    combinedQuickPicks.push(s);
                }
            });
        }

        combinedQuickPicks = combinedQuickPicks.slice(0, 20);
        window.currentQuickPicksQueue = combinedQuickPicks;
        combinedQuickPicks.forEach(s => { window.allTracks[s.id] = s; });

        if (combinedQuickPicks.length > 0) {
            html += `
            <div class="home-shelf">
                <div class="home-shelf-header">
                    <div class="shelf-header-left">
                        <div class="shelf-badge-row">
                            <span class="shelf-label-badge"><i class="fas fa-bolt" style="margin-right: 4px;"></i> Start Radio</span>
                        </div>
                        <h2 class="home-shelf-title">Quick Picks</h2>
                        <p class="home-shelf-subtitle">Curated tracks and instant radio based on your listening flow</p>
                    </div>
                    <div class="shelf-actions">
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-quick-picks', -1)" title="Scroll Left"><i class="fas fa-chevron-left"></i></button>
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-quick-picks', 1)" title="Scroll Right"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="shelf-scroll-row" id="shelf-quick-picks">
            `;

            combinedQuickPicks.forEach((song, idx) => {
                const img = getHighestQualityImage(song.image);
                const isThisPlaying = (song.id === currentPlayingId && isPlayingNow);
                const artistStr = song.subtitle || song.artists?.primary?.map(a => a.name).join(', ') || 'Artist';
                const isFav = favs.some(f => f.id === song.id);

                html += `
                <div class="qp-hero-card" data-song-id="${song.id}" onclick="window.playQuickPickTrack('${song.id}')">
                    <img src="${img}" class="qp-hero-artwork" loading="lazy">
                    <div class="qp-hero-gradient"></div>
                    ${isThisPlaying ? `<div class="qp-playing-badge" title="Now Playing"><i class="fas fa-volume-up"></i></div>` : ''}
                    <div class="qp-hero-actions" onclick="event.stopPropagation()">
                        <button class="qp-action-btn" onclick="window.toggleHeart(event, '${song.id}')" title="${isFav ? 'Unlike' : 'Like'}">
                            <i class="${isFav ? 'fas' : 'far'} fa-heart" style="color:${isFav ? 'var(--accent)' : 'inherit'};"></i>
                        </button>
                        <button class="qp-action-btn" onclick="window.openPlaylistModal('${song.id}')" title="Add to Playlist">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="qp-action-btn" onclick="window.openSongContextMenu(event, '${song.id}')" title="More Options">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                    <div class="qp-hero-content">
                        <div class="qp-hero-title">${safeEscape(song.name || song.title)}</div>
                        <div class="qp-hero-artist">${safeEscape(artistStr)}</div>
                    </div>
                    <div class="qp-hero-play-btn"><i class="fas fa-play"></i></div>
                </div>
                `;
            });

            html += `</div></div>`;
            // Warm the first 3 quick-pick streams so playback starts instantly.
            window.airPrefetchIds(combinedQuickPicks.map((s) => s.id));
        }

        // ==========================================
        // 3. KEEP LISTENING
        // ==========================================
        // Sourced from playHistory, lastPlayedAlbum, and starter recommendations
        let keepListeningItems = [];
        const keepIds = new Set();

        if (history.length > 0) {
            history.slice(0, 12).forEach(s => {
                if (!keepIds.has(s.id)) {
                    keepIds.add(s.id);
                    keepListeningItems.push({
                        id: s.id,
                        title: s.name || s.title,
                        subtitle: s.subtitle || s.artists?.primary?.map(a => a.name).join(', ') || 'Track',
                        image: s.image,
                        type: 'song',
                        raw: s
                    });
                }
            });
        } else if (homeData.quick_picks && homeData.quick_picks.length > 0) {
            homeData.quick_picks.slice(0, 10).forEach(s => {
                if (!keepIds.has(s.id)) {
                    keepIds.add(s.id);
                    keepListeningItems.push({
                        id: s.id,
                        title: s.name || s.title,
                        subtitle: s.subtitle || 'Track',
                        image: s.image,
                        type: 'song',
                        raw: s
                    });
                }
            });
        }

        if (keepListeningItems.length > 0) {
            html += `
            <div class="home-shelf">
                <div class="home-shelf-header">
                    <div class="shelf-header-left">
                        <div class="shelf-badge-row">
                            <span class="shelf-label-badge"><i class="fas fa-clock-rotate-left" style="margin-right: 4px;"></i> Jump Back In</span>
                        </div>
                        <h2 class="home-shelf-title">Keep Listening</h2>
                        <p class="home-shelf-subtitle">Pick up right where you left off</p>
                    </div>
                    <div class="shelf-actions">
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-keep-listening', -1)"><i class="fas fa-chevron-left"></i></button>
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-keep-listening', 1)"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="shelf-scroll-row" id="shelf-keep-listening">
            `;

            keepListeningItems.forEach(item => {
                const img = getHighestQualityImage(item.image);
                if (item.raw) window.allTracks[item.id] = item.raw;
                html += `
                <div class="music-shelf-card" onclick="window.playShelfItem('${item.id}', '${item.type}')">
                    <div class="msc-cover-wrap">
                        <img src="${img}" class="msc-cover" loading="lazy">
                        <div class="msc-play-overlay">
                            <div class="msc-play-icon"><i class="fas fa-play"></i></div>
                        </div>
                    </div>
                    <div class="msc-title">${safeEscape(item.title)}</div>
                    <div class="msc-subtitle">${safeEscape(item.subtitle)}</div>
                </div>
                `;
            });

            html += `</div></div>`;
        }

        // ==========================================
        // 4. FRESH FINDS
        // ==========================================
        const freshFindsList = (homeData.fresh_finds && homeData.fresh_finds.length > 0) 
            ? homeData.fresh_finds 
            : (homeData.quick_picks ? homeData.quick_picks.slice(5, 17) : []);

        if (freshFindsList.length > 0) {
            freshFindsList.forEach(s => { window.allTracks[s.id] = s; });
            html += `
            <div class="home-shelf">
                <div class="home-shelf-header">
                    <div class="shelf-header-left">
                        <div class="shelf-badge-row">
                            <span class="shelf-label-badge"><i class="fas fa-wand-magic-sparkles" style="margin-right: 4px;"></i> Discovery</span>
                        </div>
                        <h2 class="home-shelf-title">Fresh Finds</h2>
                        <p class="home-shelf-subtitle">Fresh new discoveries, trending indie hits, and rising stars</p>
                    </div>
                    <div class="shelf-actions">
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-fresh-finds', -1)"><i class="fas fa-chevron-left"></i></button>
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-fresh-finds', 1)"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="shelf-scroll-row" id="shelf-fresh-finds">
            `;

            freshFindsList.forEach(song => {
                const img = getHighestQualityImage(song.image);
                const artistStr = song.subtitle || song.artists?.primary?.map(a => a.name).join(', ') || 'Artist';
                html += `
                <div class="music-shelf-card" data-song-id="${song.id}" onclick="playSingleTrack('${song.id}')">
                    <div class="msc-cover-wrap">
                        <img src="${img}" class="msc-cover" loading="lazy">
                        <div class="msc-play-overlay">
                            <div class="msc-play-icon"><i class="fas fa-play"></i></div>
                        </div>
                    </div>
                    <div class="msc-title">${safeEscape(song.name || song.title)}</div>
                    <div class="msc-subtitle">${safeEscape(artistStr)}</div>
                </div>
                `;
            });

            html += `</div></div>`;
        }

        // ==========================================
        // 5. ARTISTS FOR YOU (Circular Avatar Shelf)
        // ==========================================
        let artistsForYouList = [];
        const artistIds = new Set();
        let playedArtistsUpdated = false;

        // Enhance playedArtists with artworks from play history or favorites if image is missing
        playedArtists.forEach(art => {
            const hasValidImg = art.image && 
                ((typeof art.image === 'string' && !art.image.includes('placeholder') && !art.image.startsWith('data:')) || 
                 (Array.isArray(art.image) && art.image.length > 0 && art.image[0].url && !art.image[0].url.includes('placeholder')));
            
            if (!hasValidImg) {
                const match = history.find(s => 
                    (s.artists?.primary?.some(a => (a.id && a.id === art.id) || (a.name && art.name && a.name.toLowerCase() === art.name.toLowerCase()))) ||
                    (s.subtitle && art.name && s.subtitle.toLowerCase().includes(art.name.toLowerCase()))
                ) || favs.find(s => 
                    (s.artists?.primary?.some(a => (a.id && a.id === art.id) || (a.name && art.name && a.name.toLowerCase() === art.name.toLowerCase()))) ||
                    (s.subtitle && art.name && s.subtitle.toLowerCase().includes(art.name.toLowerCase()))
                );
                if (match && match.image) {
                    art.image = match.image;
                    playedArtistsUpdated = true;
                }
            }

            const key = (art.id || art.name || '').toLowerCase();
            if (key && !artistIds.has(key)) {
                artistIds.add(key);
                artistsForYouList.push(art);
            }
        });

        if (playedArtistsUpdated) {
            try { localStorage.setItem('playedArtists', JSON.stringify(playedArtists)); } catch(e){}
        }

        if (homeData.popular_artists && Array.isArray(homeData.popular_artists)) {
            homeData.popular_artists.forEach(art => {
                const key = (art.id || art.name || '').toLowerCase();
                if (key && !artistIds.has(key)) {
                    artistIds.add(key);
                    artistsForYouList.push(art);
                }
            });
        }

        artistsForYouList = artistsForYouList.slice(0, 18);

        if (artistsForYouList.length > 0) {
            html += `
            <div class="home-shelf">
                <div class="home-shelf-header">
                    <div class="shelf-header-left">
                        <div class="shelf-badge-row">
                            <span class="shelf-label-badge"><i class="fas fa-users" style="margin-right: 4px;"></i> For You</span>
                        </div>
                        <h2 class="home-shelf-title">Artists For You</h2>
                        <p class="home-shelf-subtitle">Creators and voices tuned to your personal taste</p>
                    </div>
                    <div class="shelf-actions">
                        <a href="#artists" class="shelf-see-all">See All</a>
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-artists-for-you', -1)"><i class="fas fa-chevron-left"></i></button>
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-artists-for-you', 1)"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="shelf-scroll-row" id="shelf-artists-for-you">
            `;

            artistsForYouList.forEach(art => {
                let img = getHighestQualityImage(art.image);
                const artName = art.name || art.title || 'Artist';
                const artId = art.id || '';
                const initial = (artName || 'A').charAt(0).toUpperCase();

                // If image is placeholder or missing, try one more time to match history
                const isRealImg = img && !img.includes('placeholder') && !img.startsWith('data:');
                if (!isRealImg) {
                    const match = history.find(s => 
                        (s.artists?.primary?.some(a => (a.id && a.id === artId) || (a.name && a.name.toLowerCase() === artName.toLowerCase()))) ||
                        (s.subtitle && s.subtitle.toLowerCase().includes(artName.toLowerCase()))
                    );
                    if (match && match.image) {
                        img = getHighestQualityImage(match.image);
                    }
                }

                const hasImgNow = img && !img.includes('placeholder') && !img.startsWith('data:');

                html += `
                <div class="artist-shelf-card" onclick="window.location.hash='#artist/${artId}'">
                    <div class="asc-avatar-wrap">
                        ${hasImgNow 
                            ? `<img src="${img}" class="asc-avatar" loading="lazy" onerror="window.handleArtistImgError(this, '${safeEscape(artId)}', '${safeEscape(artName)}')">`
                            : `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="asc-avatar" style="display:none;" onload="window.handleArtistImgError(this, '${safeEscape(artId)}', '${safeEscape(artName)}')" onerror="window.handleArtistImgError(this, '${safeEscape(artId)}', '${safeEscape(artName)}')"><div class="asc-avatar-initial">${initial}</div>`
                        }
                    </div>
                    <div class="asc-name">${safeEscape(artName)}</div>
                    <div class="asc-pill">Artist</div>
                </div>
                `;
                
                // If it doesn't have an image, proactively fetch its avatar
                if (!hasImgNow) {
                    setTimeout(() => {
                        window.proactiveFetchArtistImage(artId, artName);
                    }, 50);
                }
            });

            html += `</div></div>`;
        }

        // ==========================================
        // 6. SIMILAR TO <ARTIST NAME>
        // ==========================================
        if (topArtist && topArtist.name) {
            let simList = similarTracks;
            // Fallback if empty: use songs from homeData
            if (simList.length === 0 && homeData.quick_picks) {
                simList = homeData.quick_picks.slice(0, 10);
            }

            if (simList.length > 0) {
                simList.forEach(s => { window.allTracks[s.id] = s; });
                const topArtistImg = getHighestQualityImage(topArtist.image);

                html += `
                <div class="home-shelf">
                    <div class="home-shelf-header">
                        <div class="shelf-header-left">
                            <div class="shelf-badge-row">
                                <span class="shelf-label-badge"><i class="fas fa-wave-square" style="margin-right: 4px;"></i> Similar To</span>
                            </div>
                            <h2 class="home-shelf-title">
                                ${topArtist.image ? `<img src="${topArtistImg}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; margin-right:4px;">` : ''}
                                Similar to ${safeEscape(topArtist.name)}
                            </h2>
                            <p class="home-shelf-subtitle">Recommended music matching the sound of ${safeEscape(topArtist.name)}</p>
                        </div>
                        <div class="shelf-actions">
                            <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-similar-to', -1)"><i class="fas fa-chevron-left"></i></button>
                            <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-similar-to', 1)"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                    <div class="shelf-scroll-row" id="shelf-similar-to">
                `;

                simList.forEach(song => {
                    const img = getHighestQualityImage(song.image);
                    const artistStr = song.subtitle || song.artists?.primary?.map(a => a.name).join(', ') || 'Artist';
                    html += `
                    <div class="music-shelf-card" onclick="playSingleTrack('${song.id}')">
                        <div class="msc-cover-wrap">
                            <img src="${img}" class="msc-cover" loading="lazy">
                            <div class="msc-play-overlay">
                                <div class="msc-play-icon"><i class="fas fa-play"></i></div>
                            </div>
                        </div>
                        <div class="msc-title">${safeEscape(song.name || song.title)}</div>
                        <div class="msc-subtitle">${safeEscape(artistStr)}</div>
                    </div>
                    `;
                });

                html += `</div></div>`;
            }
        }

        // ==========================================
        // 7. DANCING ON YOUR OWN (Mood & Vibe Shelf)
        // ==========================================
        let danceItems = homeData.dancing_on_your_own;
        if (!danceItems || danceItems.length === 0) {
            // Check in sections for dance/energy
            const dSec = (homeData.sections || []).find(s => s.title.toLowerCase().includes('dance') || s.title.toLowerCase().includes('party'));
            if (dSec) danceItems = dSec.items;
        }

        if (danceItems && danceItems.length > 0) {
            html += `
            <div class="home-shelf">
                <div class="home-shelf-header">
                    <div class="shelf-header-left">
                        <div class="shelf-badge-row">
                            <span class="shelf-label-badge"><i class="fas fa-headphones" style="margin-right: 4px;"></i> Mood & Vibe</span>
                        </div>
                        <h2 class="home-shelf-title">Dancing on your own</h2>
                        <p class="home-shelf-subtitle">High-energy bops & dance hits when you just want to let loose</p>
                    </div>
                    <div class="shelf-actions">
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-dancing-own', -1)"><i class="fas fa-chevron-left"></i></button>
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-dancing-own', 1)"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="shelf-scroll-row" id="shelf-dancing-own">
            `;

            danceItems.forEach(item => {
                const img = getHighestQualityImage(item.image);
                html += `
                <div class="music-shelf-card" onclick="window.playShelfItem('${item.id}', '${item.type}')">
                    <div class="msc-cover-wrap">
                        <img src="${img}" class="msc-cover" loading="lazy">
                        <div class="msc-play-overlay">
                            <div class="msc-play-icon"><i class="fas fa-play"></i></div>
                        </div>
                    </div>
                    <div class="msc-title">${safeEscape(item.title || item.name)}</div>
                    <div class="msc-subtitle">${safeEscape(item.subtitle || 'Playlist')}</div>
                </div>
                `;
            });

            html += `</div></div>`;
        }

        // ==========================================
        // 8. NEW RELEASES
        // ==========================================
        if (homeData.new_releases && homeData.new_releases.length > 0) {
            html += `
            <div class="home-shelf">
                <div class="home-shelf-header">
                    <div class="shelf-header-left">
                        <div class="shelf-badge-row">
                            <span class="shelf-label-badge"><i class="fas fa-fire" style="margin-right: 4px;"></i> Latest Drops</span>
                        </div>
                        <h2 class="home-shelf-title">New Releases</h2>
                        <p class="home-shelf-subtitle">Brand new albums and fresh singles</p>
                    </div>
                    <div class="shelf-actions">
                        <a href="#new-releases" class="shelf-see-all">See All</a>
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-new-releases', -1)"><i class="fas fa-chevron-left"></i></button>
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-new-releases', 1)"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="shelf-scroll-row" id="shelf-new-releases">
            `;

            homeData.new_releases.slice(0, 15).forEach(album => {
                const img = getHighestQualityImage(album.image);
                html += `
                <div class="music-shelf-card" onclick="window.location.hash='#album/${album.id}'">
                    <div class="msc-cover-wrap">
                        <img src="${img}" class="msc-cover" loading="lazy">
                        <div class="msc-play-overlay">
                            <div class="msc-play-icon"><i class="fas fa-compact-disc"></i></div>
                        </div>
                    </div>
                    <div class="msc-title">${safeEscape(album.name || album.title)}</div>
                    <div class="msc-subtitle">${safeEscape(album.subtitle || 'Album')}</div>
                </div>
                `;
            });

            html += `</div></div>`;
        }

        // ==========================================
        // 9. FORGOTTEN FAVORITES (Multi-row Grid)
        // ==========================================
        // Liked songs that haven't been played in the last 10 plays of history
        const recentHistoryIds = new Set(history.slice(0, 10).map(s => s.id));
        let forgottenFavs = favs.filter(s => !recentHistoryIds.has(s.id));
        
        // If not enough forgotten favorites, include all favorites or chart hits
        if (forgottenFavs.length < 4 && favs.length > 0) {
            forgottenFavs = favs;
        } else if (forgottenFavs.length === 0 && homeData.quick_picks) {
            forgottenFavs = homeData.quick_picks.slice(10, 18);
        }

        if (forgottenFavs.length > 0) {
            forgottenFavs.forEach(s => { window.allTracks[s.id] = s; });

            html += `
            <div class="home-shelf">
                <div class="home-shelf-header">
                    <div class="shelf-header-left">
                        <div class="shelf-badge-row">
                            <span class="shelf-label-badge"><i class="fas fa-heart-broken" style="margin-right: 4px;"></i> Rediscover</span>
                        </div>
                        <h2 class="home-shelf-title">Forgotten Favorites</h2>
                        <p class="home-shelf-subtitle">Tracks you loved that deserve another spin</p>
                    </div>
                    <div class="shelf-actions">
                        <a href="#favorites" class="shelf-see-all">Favorites</a>
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-forgotten-favs', -1)"><i class="fas fa-chevron-left"></i></button>
                        <button class="shelf-nav-btn" onclick="window.scrollShelf('shelf-forgotten-favs', 1)"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="forgotten-fav-grid" id="shelf-forgotten-favs">
            `;

            forgottenFavs.forEach(song => {
                const img = getHighestQualityImage(song.image);
                const artistStr = song.subtitle || song.artists?.primary?.map(a => a.name).join(', ') || 'Artist';
                const isFav = favs.some(f => f.id === song.id);

                html += `
                <div class="ff-card-item" data-song-id="${song.id}" onclick="playSingleTrack('${song.id}')">
                    <div class="ff-thumb-wrap">
                        <img src="${img}" class="ff-thumb" loading="lazy">
                        <div class="ff-play-icon"><i class="fas fa-play"></i></div>
                    </div>
                    <div class="ff-info">
                        <div class="ff-title">${safeEscape(song.name || song.title)}</div>
                        <div class="ff-artist">${safeEscape(artistStr)}</div>
                    </div>
                    <div class="ff-duration">${formatTime(song.duration)}</div>
                    <div class="ff-actions" onclick="event.stopPropagation()">
                        <button class="ff-action-btn ff-like-btn" onclick="window.toggleHeart(event, '${song.id}')" title="${isFav ? 'Unlike' : 'Like'}">
                            <i class="${isFav ? 'fas' : 'far'} fa-heart" style="color: ${isFav ? 'var(--accent)' : 'var(--text-secondary)'};"></i>
                        </button>
                        <button class="ff-action-btn ff-plus-btn" onclick="window.openPlaylistModal('${song.id}')" title="Add to Playlist">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="ff-action-btn ff-more-btn" onclick="window.openSongContextMenu(event, '${song.id}')" title="More Options">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                `;
            });

            html += `</div></div>`;
        }

        // ==========================================
        // 10. DYNAMIC BROWSE SECTIONS FROM YOUTUBE MUSIC
        // ==========================================
        if (homeData.sections && Array.isArray(homeData.sections)) {
            const skipWords = ['quick', 'dancing', 'fresh', 'new release'];
            homeData.sections.forEach((sec, sIdx) => {
                const secTitleLower = (sec.title || '').toLowerCase();
                if (skipWords.some(w => secTitleLower.includes(w))) return;
                if (!sec.items || sec.items.length === 0) return;

                const shelfDomId = `shelf-dyn-${sIdx}`;
                html += `
                <div class="home-shelf">
                    <div class="home-shelf-header">
                        <div class="shelf-header-left">
                            <h2 class="home-shelf-title">${safeEscape(sec.title)}</h2>
                        </div>
                        <div class="shelf-actions">
                            <button class="shelf-nav-btn" onclick="window.scrollShelf('${shelfDomId}', -1)"><i class="fas fa-chevron-left"></i></button>
                            <button class="shelf-nav-btn" onclick="window.scrollShelf('${shelfDomId}', 1)"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                    <div class="shelf-scroll-row" id="${shelfDomId}">
                `;

                sec.items.forEach(item => {
                    const img = getHighestQualityImage(item.image);
                    if (item.type === 'song') window.allTracks[item.id] = item;
                    html += `
                    <div class="music-shelf-card" onclick="window.playShelfItem('${item.id}', '${item.type}')">
                        <div class="msc-cover-wrap">
                            <img src="${img}" class="msc-cover" loading="lazy">
                            <div class="msc-play-overlay">
                                <div class="msc-play-icon"><i class="fas fa-play"></i></div>
                            </div>
                        </div>
                        <div class="msc-title">${safeEscape(item.title || item.name)}</div>
                        <div class="msc-subtitle">${safeEscape(item.subtitle || '')}</div>
                    </div>
                    `;
                });

                html += `</div></div>`;
            });
        }

        html += `</div>`; // End home-container

        document.getElementById('globalLoading').style.display = 'none';
        routerView.innerHTML = html;

    } catch (e) {
        document.getElementById('globalLoading').style.display = 'none';
        console.error('Home render error', e);
        routerView.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--accent-text); margin-bottom: 20px;"></i>
            <h2 style="color: var(--text-primary); margin-bottom: 10px;">Failed to load Home screen</h2>
            <p>Please check your connection or restart the server.</p>
            <button class="btn-primary" onclick="renderHome()" style="margin: 20px auto 0 auto;">Retry</button>
        </div>`;
    }
}

let isFetchingBrowse = false;
let browsePage = 1;

async function loadMoreBrowse() {
    isFetchingBrowse = true;
    const loading = document.getElementById('browseLoading');
    if (loading) loading.style.display = 'block';
    
    try {
        const queryList = ['latest', 'popular', 'trending', 'hits', 'party'];
        const q = queryList[(browsePage - 1) % queryList.length];
        const res = await fetch(`/api/search/songs?query=${q}&page=${browsePage}&limit=40`);
        const json = await res.json();
        
        const table = document.getElementById('browseTable');
        if (json.data && json.data.results && table) {
            let html = '';
            json.data.results.forEach((song, i) => {
                const img = getHighestQualityImage(song.image);
                const idx = (browsePage - 1) * 40 + i + 1;
                html += `
                <tr class="track-row" onclick="playSingleTrack('${song.id}')" style="cursor:pointer">
                    <td class="track-num">
                        <span class="track-num-txt">${idx}</span>
                        <i class="fas fa-play track-play-icon"></i>
                    </td>
                    <td>
                        <div class="track-info-cell">
                            <img src="${img}" class="track-thumb">
                            <div>
                                <div class="track-title">${song.name}</div>
                                <div class="track-artist">${getClickableArtistsHtml(song)}</div>
                            </div>
                        </div>
                    </td>
                    <td style="color:var(--text-secondary)">${formatTime(song.duration)}</td>
                <td style="width: 80px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px;" onclick="event.stopPropagation()">
                        <i class="${favoriteSongs.some(s => s.id === song.id) ? 'fas' : 'far'} fa-heart" 
                           style="color:${favoriteSongs.some(s => s.id === song.id) ? 'var(--accent)' : 'var(--text-secondary)'}; cursor:pointer; font-size: 16px; padding: 12px; border-radius: 50%;" 
                           onclick="window.toggleHeart(event, '${song.id}')" title="Like"></i>
                        ${window.getPlaylistIconHtml(song.id)}
                    </div>
                </td>
                    
                </tr>
                `;
            });
            table.insertAdjacentHTML('beforeend', html);
        }
    } catch (e) {
        console.error(e);
    }
    
    if (loading) loading.style.display = 'none';
    isFetchingBrowse = false;
}

window.searchSource = 'ytm';
window.searchSourceChipHtml = function() {
    const chip = (id, label, iconHtml) => `<button class="yt-chip${window.searchSource === id ? ' is-on' : ''}" onclick="window.setSearchSource('${id}')">${iconHtml} ${label}</button>`;
    return chip('ytm', 'YouTube Music', window.airBrandIcon('youtube', 13)) + chip('saavn', 'JioSaavn', '<i class="fas fa-music"></i>');
};

window.setSearchSource = function(source) {
    if (window.searchSource === source) return;
    window.searchSource = source;
    if (window.__lastSearchQuery && typeof renderSearch === 'function') renderSearch(window.__lastSearchQuery);
};

window.renderSaavnSearch = async function(query) {
    globalLoading.style.display = 'flex';
    const res = await fetch(`/api/saavn/search?query=${encodeURIComponent(query)}&limit=40`).then(r => r.json()).catch(() => ({}));
    globalLoading.style.display = 'none';
    const songs = (res && res.data) || [];
    let html = `<div class="back-btn" onclick="history.back()" title="Go Back"><i class="fas fa-arrow-left"></i></div>
    <h2 class="section-title">JioSaavn Results for "${decodeURIComponent(query)}"</h2>
    <div style="display: flex; gap: 8px; margin: 0 0 18px 0;">${window.searchSourceChipHtml()}</div>`;
    if (songs.length) {
        html += `<table class="tracklist" style="margin-bottom:40px;">`;
        songs.forEach((song, i) => {
            window.allTracks[song.id] = song;
            const isFav = favoriteSongs.some(s => s.id === song.id);
            const artists = ((song.artists && song.artists.primary) || []).map(a => a.name).filter(Boolean).join(', ');
            html += `
            <tr class="track-row">
                <td class="track-num">
                    <span class="track-num-txt">${i+1}</span>
                    <i class="fas fa-play track-play-icon" onclick="playSingleTrack('${song.id}')"></i>
                </td>
                <td>
                    <div class="track-info-cell">
                        <img src="${getHighestQualityImage(song.image)}" class="track-thumb">
                        <div>
                            <div class="track-title">${song.name || song.title}</div>
                            <div class="track-artist">${artists}</div>
                        </div>
                    </div>
                </td>
                <td class="track-duration">${formatTime(song.duration)}</td>
                <td style="width: 80px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px;" onclick="event.stopPropagation()">
                        <i class="${isFav ? 'fas' : 'far'} fa-heart" 
                           style="color:${isFav ? 'var(--accent)' : 'var(--text-secondary)'}; cursor:pointer; font-size: 16px; padding: 12px; border-radius: 50%;" 
                           onclick="window.toggleHeart(event, '${song.id}')" title="Like"></i>
                        ${window.getPlaylistIconHtml(song.id)}
                    </div>
                </td>
            </tr>`;
        });
        html += `</table>`;
    } else {
        html += `<h3 style="color: var(--text-secondary);">No results found</h3>`;
    }
    routerView.innerHTML = html;
};

async function renderSearch(query) {
    const scrollContainer = document.querySelector('.scroll-container');
    scrollContainer.onscroll = null;

    if (!query) {
        browsePage = 1;
        routerView.innerHTML = `
            <h2 class="section-title">Browse Popular Songs</h2>
            <div id="browseList">
                <table class="tracklist" id="browseTable"></table>
            </div>
            <div id="browseLoading" style="text-align:center; padding: 20px; display:none;">
                <div id="browseLottieSpinner" style="width: 60px; height: 60px; margin: 0 auto;"></div>
            </div>
        `;
        if (typeof lottie !== 'undefined') {
            lottie.loadAnimation({
                container: document.getElementById('browseLottieSpinner'),
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: '/static/loader.json'
            });
        }
        
        await loadMoreBrowse();
        
        scrollContainer.onscroll = async () => {
            if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 150) {
                if (!isFetchingBrowse) {
                    browsePage++;
                    await loadMoreBrowse();
                }
            }
        };
        return;
    }

    window.__lastSearchQuery = query;
    if (window.searchSource === 'saavn') return window.renderSaavnSearch(query);
    
    // Fetch 40 items per category for "full" search
    const [songsRes, albumsRes, artistsRes, playlistsRes] = await Promise.all([
        fetch(`/api/search/songs?query=${encodeURIComponent(query)}&limit=40`).then(r => r.json()).catch(()=>({})),
        fetch(`/api/search/albums?query=${encodeURIComponent(query)}&limit=20`).then(r => r.json()).catch(()=>({})),
        fetch(`/api/search/artists?query=${encodeURIComponent(query)}&limit=20`).then(r => r.json()).catch(()=>({})),
        fetch(`/api/search/playlists?query=${encodeURIComponent(query)}&limit=20`).then(r => r.json()).catch(()=>({}))
    ]);
    
    let html = `<div class="back-btn" onclick="history.back()" title="Go Back"><i class="fas fa-arrow-left"></i></div>
    <h2 class="section-title">Search Results for "${decodeURIComponent(query)}"</h2>
    <div style="display: flex; gap: 8px; margin: 0 0 18px 0;">${window.searchSourceChipHtml ? window.searchSourceChipHtml() : ''}</div>`;

    const songs = songsRes.data;
    if (songs && songs.results && songs.results.length > 0) {
        html += `<h3>Songs</h3><table class="tracklist" style="margin-bottom:40px;">`;
        songs.results.forEach((song, i) => {
            html += `
            ${(window.allTracks[song.id] = song) ? '' : ''}<tr class="track-row">
                <td class="track-num">
                    <span class="track-num-txt">${i+1}</span>
                    <i class="fas fa-play track-play-icon" onclick="playSingleTrack('${song.id}')"></i>
                </td>
                <td>
                    <div class="track-info-cell">
                        <img src="${getHighestQualityImage(song.image)}" class="track-thumb">
                        <div>
                            <div class="track-title">${song.name || song.title}</div>
                            <div class="track-artist">${getClickableArtistsHtml(song)}</div>
                        </div>
                    </div>
                </td>
                <td class="track-duration">${formatTime(song.duration)}</td>
                <td style="width: 80px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px;" onclick="event.stopPropagation()">
                        <i class="${favoriteSongs.some(s => s.id === song.id) ? 'fas' : 'far'} fa-heart" 
                           style="color:${favoriteSongs.some(s => s.id === song.id) ? 'var(--accent)' : 'var(--text-secondary)'}; cursor:pointer; font-size: 16px; padding: 12px; border-radius: 50%;" 
                           onclick="window.toggleHeart(event, '${song.id}')" title="Like"></i>
                        ${window.getPlaylistIconHtml(song.id)}
                    </div>
                </td>
            </tr>`;
        });
        html += `</table>`;
        // Warm the first 3 result streams for instant playback on click.
        window.airPrefetchIds(songs.results.map((s) => s.id));
    }

    const artists = artistsRes.data;
    if (artists && artists.results && artists.results.length > 0) {
        html += `<h3>Artists</h3><div style="display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 40px;">`;
        artists.results.forEach(art => {
            html += `
            <div class="artist-card" onclick="window.location.hash='#artist/${art.id}'">
                <div class="card-img-wrapper artist-img">
                    <img src="${getHighestQualityImage(art.image)}">
                </div>
                <div class="card-title" style="text-align:center">${art.name || art.title}</div>
            </div>`;
        });
        html += `</div>`;
    }
    
    const playlists = playlistsRes && playlistsRes.data ? playlistsRes.data : playlistsRes;
    if (playlists && playlists.results && playlists.results.length > 0) {
        html += `<h3>Playlists</h3><div style="display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 40px;">`;
        playlists.results.forEach(playlist => {
            html += `
            <div class="album-card" onclick="window.location.hash='#playlist/${playlist.id}'">
                <div class="card-img-wrapper">
                    <img src="${getHighestQualityImage(playlist.image)}">
                </div>
                <div class="card-title">${playlist.title || playlist.name}</div>
                <div class="card-subtitle" style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${playlist.subtitle || 'Playlist'}</div>
            </div>`;
        });
        html += `</div>`;
    }

    const albums = albumsRes && albumsRes.data ? albumsRes.data : albumsRes;
    if (albums && albums.results && albums.results.length > 0) {
        html += `<h3>Albums</h3><div style="display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 40px;">`;
        albums.results.forEach(alb => {
            html += `
            <div class="album-card" onclick="window.location.hash='#album/${alb.id}'">
                <div class="card-img-wrapper">
                    <img src="${getHighestQualityImage(alb.image)}">
                </div>
                <div class="card-title">${alb.name || alb.title}</div>
            </div>`;
        });
        html += `</div>`;
    }

    if (html === `<h2 class="section-title">Search Results for "${decodeURIComponent(query)}"</h2>`) {
        html += `<h2>No results found</h2>`;
    }

    routerView.innerHTML = html;
}

async function renderArtist(id) {
    id = id.replace(/ /g, '-');
    const res = await fetch(`/api/artists?id=${id}`);
    const data = await res.json();
    const artist = data.data;

    const subs = JSON.parse(localStorage.getItem('subscribed_artists') || '{}');
    const isSub = !!subs[id] || localStorage.getItem(`sub_${id}`) === 'true';
    const subText = isSub ? 'Subscribed' : 'Subscribe';
    const subClass = isSub ? 'subscribed' : '';
    const fakeSubs = formatNumber(artist.followerCount || 1000);

    let html = `
    <div class="back-btn" onclick="history.back()" title="Go Back"><i class="fas fa-arrow-left"></i></div>
    <div class="hero-header hero-profile-mobile" style="align-items: flex-start;">
        <div class="hero-info" style="justify-content: center; align-items: flex-start;">
            <div class="hero-title">${artist.name}&nbsp;<svg class="verified-badge" viewBox="0 0 24 24" width="28" height="28" style="vertical-align: middle; transform: translateY(-4px);">
                    <path class="verified-star" d="M22.5 12.5c0-1.58-.87-2.92-2.14-3.59v-.5c0-1.64-1.3-2.97-2.9-2.97h-.5c-.67-1.27-2.01-2.14-3.59-2.14-1.58 0-2.92.87-3.59 2.14h-.5c-1.6 0-2.9 1.33-2.9 2.97v.5c-1.27.67-2.14 2.01-2.14 3.59 0 1.58.87 2.92 2.14 3.59v.5c0 1.64 1.3 2.97 2.9 2.97h.5c.67 1.27 2.01 2.14 3.59 2.14 1.58 0 2.92-.87 3.59-2.14h.5c1.6 0 2.9-1.33 2.9-2.97v-.5c1.27-.67 2.14-2.01 2.14-3.59z" fill="#1da1f2"></path>
                    <path class="verified-tick-draw" d="M7.5 12.5L10.5 15.5L17 9" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </div>
            <div class="hero-meta" style="font-size: 16px; margin-bottom: 20px;">${fakeSubs} monthly audience</div>
            ${artist.description ? `
            <div class="artist-bio-container" style="margin-bottom: 30px; max-width: 700px;">
                <div id="artist-bio-text" style="font-size: 14px; line-height: 1.6; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; transition: all 0.3s ease;">
                    ${artist.description.replace(/\n/g, '<br>')}
                </div>
                <button id="artist-bio-toggle" style="background: none; border: 1px solid var(--text-primary); color: var(--text-primary); font-weight: bold; font-size: 12px; margin-top: 8px; padding: 2px 6px; cursor: pointer; text-transform: uppercase; border-radius: 4px;" onclick="
                    const text = document.getElementById('artist-bio-text');
                    const btn = document.getElementById('artist-bio-toggle');
                    if (text.style.webkitLineClamp === '4') {
                        text.style.webkitLineClamp = 'unset';
                        btn.innerText = 'LESS';
                    } else {
                        text.style.webkitLineClamp = '4';
                        btn.innerText = 'MORE';
                    }
                ">MORE</button>
            </div>
            ` : '<div style="margin-bottom: 30px;"></div>'}
            <div class="action-buttons">
                <button class="btn-primary" onclick="playArtistTop('${id}')"><i class="fas fa-play" style="margin-right:8px;"></i> PLAY ALL</button>
                <button class="btn-secondary ${subClass}" onclick="toggleSubscribe('${id}', this, '${artist.name.replace(/'/g, "\'")}', '${getHighestQualityImage(artist.image)}'); event.stopPropagation();">${subText}</button>
            </div>
        </div>
        <img src="${getHighestQualityImage(artist.image)}" class="hero-img artist" style="width: 250px; height: 250px; border-radius: 50%; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
    </div>
    
    <div class="artist-tabs" style="display:flex; gap:20px; border-bottom:1px solid #333; margin-bottom:20px; padding:10px 0;">
        <div class="artist-tab active" onclick="switchArtistTab('songs')" id="tab-songs" style="cursor:pointer; font-weight:bold; color:var(--accent);">Top Songs</div>
        <div class="artist-tab" onclick="switchArtistTab('albums')" id="tab-albums" style="cursor:pointer; color:var(--text-secondary);">Albums</div>
        <div class="artist-tab" onclick="switchArtistTab('singles')" id="tab-singles" style="cursor:pointer; color:var(--text-secondary);">Singles</div>
    </div>
    
    <div id="artist-content-songs" class="artist-content-section" style="display:block;">
        <table class="tracklist">`;
    
    if (artist.topSongs && artist.topSongs.length > 0) {
        artist.topSongs.forEach((song, i) => {
            const img = getHighestQualityImage(song.image);
            html += `
            ${(window.allTracks[song.id] = song) ? '' : ''}<tr class="track-row">
                <td class="track-num">
                    <span class="track-num-txt">${i+1}</span>
                    <i class="fas fa-play track-play-icon" onclick="playSingleTrack('${song.id}')"></i>
                </td>
                <td>
                    <div class="track-info-cell">
                        <img src="${img}" class="track-thumb">
                        <div>
                            <div class="track-title">${song.name}</div>
                            <div class="track-artist">${formatNumber(song.playCount || 0)} plays</div>
                        </div>
                    </div>
                </td>
                <td class="track-duration">${formatTime(song.duration)}</td>
                <td style="width: 80px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px;" onclick="event.stopPropagation()">
                        <i class="${favoriteSongs.some(s => s.id === song.id) ? 'fas' : 'far'} fa-heart" 
                           style="color:${favoriteSongs.some(s => s.id === song.id) ? 'var(--accent)' : 'var(--text-secondary)'}; cursor:pointer; font-size: 16px; padding: 12px; border-radius: 50%;" 
                           onclick="window.toggleHeart(event, '${song.id}')" title="Like"></i>
                        ${window.getPlaylistIconHtml(song.id)}
                    </div>
                </td>
            </tr>`;
        });
    } else {
        html += `<tr><td colspan="4" style="text-align:center; padding: 20px; color:var(--text-secondary);">No songs found</td></tr>`;
    }
    html += `</table></div>`;

    html += `<div id="artist-content-albums" class="artist-content-section" style="display:none;">
        <div style="display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 40px;">`;
    if (artist.albums && artist.albums.length > 0) {
        artist.albums.forEach(alb => {
            html += `
            <div class="card" onclick="window.location.hash='#album/${alb.id}'" style="cursor: pointer; width: 140px;">
                <div class="card-img-wrapper" style="width: 140px; height: 140px; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin-bottom: 12px;">
                    <img src="${getHighestQualityImage(alb.image)}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="card-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center;">${alb.name}</div>
                <div class="card-subtitle" style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center;">Album</div>
            </div>`;
        });
    } else {
        html += `<div style="text-align:center; padding: 20px; width:100%; color:var(--text-secondary);">No albums found</div>`;
    }
    html += `</div></div>`;

    html += `<div id="artist-content-singles" class="artist-content-section" style="display:none;">
        <div style="display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 40px;">`;
    if (artist.singles && artist.singles.length > 0) {
        artist.singles.forEach(alb => {
            html += `
            <div class="card" onclick="window.location.hash='#album/${alb.id}'" style="cursor: pointer; width: 140px;">
                <div class="card-img-wrapper" style="width: 140px; height: 140px; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin-bottom: 12px;">
                    <img src="${getHighestQualityImage(alb.image)}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="card-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center;">${alb.name}</div>
                <div class="card-subtitle" style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center;">Single</div>
            </div>`;
        });
    } else {
        html += `<div style="text-align:center; padding: 20px; width:100%; color:var(--text-secondary);">No singles found</div>`;
    }
    html += `</div></div>`;
    
    routerView.innerHTML = html;
}

window.switchArtistTab = function(tabName) {
    ['songs', 'albums', 'singles'].forEach(t => {
        const tab = document.getElementById('tab-' + t);
        const content = document.getElementById('artist-content-' + t);
        if (tab) {
            tab.style.fontWeight = 'normal';
            tab.style.color = 'var(--text-secondary)';
        }
        if (content) content.style.display = 'none';
    });
    
    const activeTab = document.getElementById('tab-' + tabName);
    const activeContent = document.getElementById('artist-content-' + tabName);
    if (activeTab) {
        activeTab.style.fontWeight = 'bold';
        activeTab.style.color = 'var(--accent)';
    }
    if (activeContent) {
        activeContent.style.display = 'block';
    }
};

async function renderAlbum(id) {
    id = id.replace(/ /g, '-');
    const res = await fetch(`/api/albums?id=${id}`);
    const data = await res.json();
    const album = data.data;

    let html = `
    <div class="back-btn" onclick="history.back()" title="Go Back"><i class="fas fa-arrow-left"></i></div>
    <div class="hero-header">
        <img src="${getHighestQualityImage(album.image)}" class="hero-img">
        <div class="hero-info">
            <div class="hero-type">ALBUM</div>
            <div class="hero-title">${album.name}</div>
            <div class="hero-meta">${album.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist'} &bull; ${album.year || ''} &bull; ${album.songCount || 0} songs</div>
            <div class="action-buttons">
                <button class="btn-primary" onclick="playList(window.currentRenderedTracks)">PLAY</button>
                ${(() => {
        let savedAlbums = JSON.parse(localStorage.getItem('saved_albums') || '{}');
        let isSaved = !!savedAlbums[album.id];
        let iconClass = isSaved ? 'fas fa-check' : 'fas fa-plus';
        let colorStyle = isSaved ? 'color: var(--accent-text);' : '';
        let artistName = album.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist';
        return `<button class="icon-btn icon-btn-surface" onclick="toggleSaveAlbum('${album.id}', this, '${album.name.replace(/'/g, "\'")}', '${getHighestQualityImage(album.image)}', '${artistName.replace(/'/g, "\'")}')">
            <i class="${iconClass}" style="${colorStyle}"></i>
        </button>`;
        })()}
            </div>
        </div>
    </div>
    <table class="tracklist">`;
    
    window.currentRenderedTracks = album.songs; 

    if(album.songs) {
        album.songs.forEach((song, i) => {
            html += `
            ${(window.allTracks[song.id] = song) ? '' : ''}<tr class="track-row">
                <td class="track-num">
                    <span class="track-num-txt">${i+1}</span>
                    <i class="fas fa-play track-play-icon" onclick="playList(window.currentRenderedTracks, ${i})"></i>
                </td>
                <td>
                    <div class="track-info-cell">
                        <img src="${getHighestQualityImage(song.image)}" class="track-thumb">
                        <div>
                            <div class="track-title">${song.name}</div>
                            <div class="track-artist">${getClickableArtistsHtml(song)}</div>
                        </div>
                    </div>
                </td>
                <td class="track-duration">${formatTime(song.duration)}</td>
                <td style="width: 80px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px;" onclick="event.stopPropagation()">
                        <i class="${favoriteSongs.some(s => s.id === song.id) ? 'fas' : 'far'} fa-heart" 
                           style="color:${favoriteSongs.some(s => s.id === song.id) ? 'var(--accent)' : 'var(--text-secondary)'}; cursor:pointer; font-size: 16px; padding: 12px; border-radius: 50%;" 
                           onclick="window.toggleHeart(event, '${song.id}')" title="Like"></i>
                        ${window.getPlaylistIconHtml(song.id)}
                    </div>
                </td>
            </tr>`;
        });
    }
    
    html += `</table>`;
    routerView.innerHTML = html;
}

// ==========================================
// PLAYER LOGIC
// ==========================================
const audio = document.getElementById('audioElement');
audio.onerror = (e) => {
    if (window.ytHandleStreamError && window.ytHandleStreamError()) return;
    if (audio.error && audio.error.code >= 3 && window.showToast) {
        window.showToast('Could not play this song');
        return;
    }
    alert('Audio Error: ' + (audio.error ? audio.error.code + ' ' + audio.error.message : 'Unknown error'));
};
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.getElementById('waveformActive');
const waveformGray = document.getElementById('waveformGray');
const progressContainer = document.getElementById('progressBarContainer');

// Generate waveform UI
if (waveformGray && progressBar) {
    let html = '';
    const pattern = [50, 70, 50, 95, 65, 50, 85, 45, 55, 70, 50, 80, 60, 50, 75, 95, 85, 80, 55, 75, 85, 80, 50, 90, 80, 50, 95, 85, 50, 80, 65, 50, 85, 95, 55, 65, 45, 55, 75, 50, 85, 70, 55, 45, 75, 65, 45, 55, 90, 55, 50, 85, 95, 70, 55, 50, 90, 65, 50, 75, 85, 55, 50, 90, 95, 65, 45, 55, 80, 60, 45, 65, 90, 75, 50, 85, 95, 60, 50, 70, 80, 55, 45, 90, 95, 65, 50, 60, 75, 55, 45, 85, 70, 50, 60, 80, 95, 60, 50, 90];
    for(let i=0; i<100; i++) {
        let h = pattern[i % pattern.length];
        html += `<div class="wave-bar" style="height: ${h}%"></div>`;
    }
    waveformGray.innerHTML = html;
    progressBar.innerHTML = html;
}

async function playSingleTrack(id) {
    let song = window.allTracks ? window.allTracks[id] : null;
    if (!song && window.currentRenderedTracks) song = window.currentRenderedTracks.find(t=>t.id===id);
    if (!song && window.favoriteSongs) song = window.favoriteSongs.find(t=>t.id===id);
    if (!song) {
        let history = JSON.parse(localStorage.getItem('playHistory') || '[]');
        song = history.find(t=>t.id===id);
    }
    
    if (!song) {
        const res = await fetch(`/api/songs?ids=${id}`);
        const data = await res.json();
        if (data.data && data.data.length > 0) song = data.data[0];
    }

    if (song) {
        currentQueue = [song];
        currentIndex = 0;
        loadCurrentTrack();
        updateQueueUI();
        
        // Fetch OpenTune style related songs (YouTube Music Radio / Up Next)
        try {
            const res = await fetch(`/api/songs/related?id=${song.id}`);
            const data = await res.json();
            
            if (data.success && data.data && data.data.length > 0) {
                const moreSongs = data.data;
                const uniqueMoreSongs = [];
                const ids = new Set([song.id]);
                
                for (let s of moreSongs) {
                    if (!ids.has(s.id)) {
                        ids.add(s.id);
                        uniqueMoreSongs.push(s);
                    }
                }
                
                if (uniqueMoreSongs.length > 0) {
                    currentQueue = [song, ...uniqueMoreSongs];
                    updateQueueUI();
                }
            }
        } catch (e) {
            console.error('Failed to load related songs queue', e);
        }
    }
}

async function playArtistTop(id) {
    const res = await fetch(`/api/artists?id=${id}`);
    const data = await res.json();
    if (data.data && data.data.topSongs) {
        currentQueue = data.data.topSongs;
        currentIndex = 0;
        loadCurrentTrack();
        updateQueueUI();
    }
}

function playList(tracks, startIndex = 0) {
    if (!tracks || tracks.length === 0) return;
    currentQueue = tracks;
    currentIndex = startIndex;
    loadCurrentTrack();
    updateQueueUI();
}

window.isGeneratingQueue = false;
window.generateSmartQueue = async function() {
    if (window.isGeneratingQueue || currentQueue.length >= 100) return;
    window.isGeneratingQueue = true;
    
    try {
        let history = JSON.parse(localStorage.getItem('playHistory') || '[]');
        let favs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
        let allTracks = [...history, ...favs, ...currentQueue]; // include current queue as context
        
        let artistCounts = {};
        allTracks.forEach(t => {
            if (t.artists) {
                t.artists.forEach(a => {
                    if (a.name) {
                        artistCounts[a.name] = (artistCounts[a.name] || 0) + 1;
                    }
                });
            }
        });
        
        let sortedArtists = Object.keys(artistCounts).sort((a, b) => artistCounts[b] - artistCounts[a]);
        if (sortedArtists.length === 0) sortedArtists = ["The Weeknd", "Taylor Swift", "Drake", "Ed Sheeran", "Ariana Grande"];
        
        while (currentQueue.length < 100) {
            let topN = sortedArtists.slice(0, 15);
            let randArtist = topN[Math.floor(Math.random() * topN.length)];
            
            let res = await fetch('/api/search/songs?query=' + encodeURIComponent(randArtist));
            let data = await res.json();
            if (data.data && data.data.length > 0) {
                let added = false;
                let fetchedSongs = data.data.sort(() => 0.5 - Math.random());
                fetchedSongs.forEach(song => {
                    if (currentQueue.length < 100 && !currentQueue.find(q => q.id === song.id)) {
                        currentQueue.push(song);
                        if (window.isShuffle && window.originalQueue) window.originalQueue.push(song);
                        added = true;
                    }
                });
                if (added) updateQueueUI();
                if (!added) break;
            } else {
                break;
            }
            await new Promise(r => setTimeout(r, 600)); 
        }
    } catch(e) {
        console.error("Smart Queue Error:", e);
    }
    
    window.isGeneratingQueue = false;
};

async function loadCurrentTrack() {
    if (currentIndex < 0 || currentIndex >= currentQueue.length) return;
    if (currentQueue.length < 100) setTimeout(() => window.generateSmartQueue(), 1000);
    let track = currentQueue[currentIndex];
    if (!track) return;
    if (window.ytTrackEnded) window.ytTrackEnded();
    
    // Normalize metadata
    if (!track.name && track.title) track.name = track.title;
    if (!track.title && track.name) track.title = track.name;
    if (!track.artists && track.subtitle) {
        track.artists = { primary: [{ id: '', name: track.subtitle }] };
    }
    const trackNameStr = (track.name || track.title || 'Unknown Song').toString();
    window.allTracks[track.id] = track;

    // YT integration: start the recording timer and prefetch immediately (no scrobble-threshold wait)
    if (window.ytTrackStarted) window.ytTrackStarted(track);
    if (window.ytPrefetchAhead) window.ytPrefetchAhead(2);
    
    // UI Update
    const miniPlayerName = trackNameStr.split(' ').slice(0, 3).join(' ');
    const playerTitleEl = document.getElementById('playerTitle');
    if (playerTitleEl) playerTitleEl.innerHTML = safeEscape(miniPlayerName);
    
    const pArtist = document.getElementById('playerArtist');
    if (pArtist) {
        pArtist.innerHTML = getClickableArtistsHtml(track);
        pArtist.onclick = (e) => { 
            e.stopPropagation(); 
            if (track.artists && track.artists.primary && track.artists.primary[0]?.id) {
                window.location.hash = '#artist/' + track.artists.primary[0].id;
                if (window.closeLyrics) window.closeLyrics();
            }
        };
    }
    const playerImg = document.getElementById('playerImage');
    if (playerImg) {
        playerImg.src = getHighestQualityImage(track.image);
        playerImg.classList.remove('skeleton');
    }
    window.updateRightPanelPlaylistBtn(track.id);
    
    // Update Dynamic Island
    if (window.electronAPI && window.electronAPI.updateDynamicIsland) {
        const isFav = favoriteSongs.some(s => s.id === track.id);
        window.electronAPI.updateDynamicIsland({
            type: 'track',
            title: trackNameStr,
            artist: track.artists?.primary?.[0]?.name || track.subtitle || 'Unknown Artist',
            image: getHighestQualityImage(track.image),
            isFav: isFav,
            isRepeat: window.isRepeat || false
        });
    }

    if (window.updateAodTrackInfo) window.updateAodTrackInfo();
    if (window.updateSheetTrackInfo) window.updateSheetTrackInfo();

    window.__discordTrack = track;
    window.__discordStart = Date.now();
    window.syncDiscordActivity();

    // Right panel UI
    const rpTitle = document.getElementById('rightPanelTitle');
    const rpArtist = document.getElementById('rightPanelArtist');
    const rpImage = document.getElementById('rightPanelImage');
    const likeBtn = document.getElementById('likeBtn') || document.querySelector('.np-title-row .fa-heart');
    
    if (rpTitle) rpTitle.innerHTML = safeEscape(trackNameStr);
    if (rpArtist) rpArtist.innerHTML = safeEscape(track.subtitle || track.artists?.primary?.[0]?.name || 'Unknown');
    if (rpImage) {
        rpImage.src = getHighestQualityImage(track.image);
        rpImage.classList.remove('skeleton');
    }
    
    // Reveal right-panel queue menu when playing tracks
    document.body.classList.add('has-active-track');
    document.body.classList.remove('right-panel-collapsed');
    const toggleBtnEl = document.getElementById('topNowPlayingToggle');
    if (toggleBtnEl) toggleBtnEl.style.display = 'inline-block';
    
    if (likeBtn) {
        const isFav = favoriteSongs.some(s => s.id === track.id);
        likeBtn.className = isFav ? 'fas fa-heart' : 'far fa-heart';
        likeBtn.style.color = isFav ? 'var(--accent)' : '';
        
        likeBtn.onclick = () => {
            const idx = favoriteSongs.findIndex(s => s.id === track.id);
            let isNowFav = false;
            if (idx > -1) {
                favoriteSongs.splice(idx, 1);
                likeBtn.className = 'far fa-heart';
                likeBtn.style.color = '';
            } else {
                favoriteSongs.push(track);
                likeBtn.className = 'fas fa-heart';
                likeBtn.style.color = 'var(--accent)';
                isNowFav = true;
            }
            saveFavorites();
            if (window.location.hash === '#favorites') renderFavorites();
            if (window.electronAPI && window.electronAPI.updateDynamicIsland) {
                window.electronAPI.updateDynamicIsland({ type: 'like', active: isNowFav });
            }
        };
    }

    // Fetch missing downloadUrl dynamically
    if (!track.downloadUrl || track.downloadUrl.length === 0 || !Array.isArray(track.downloadUrl)) {
        try {
            const res = await fetch(`/api/songs?ids=${track.id}`);
            const data = await res.json();
            if (data.data && data.data.length > 0) {
                track = data.data[0];
                currentQueue[currentIndex] = track; // Update the queue
            }
        } catch(e) {
            console.error('Failed to fetch missing song data', e);
        }
    }

    window.currentTrackScrobbled = false;
    
    // Get 320kbps URL
    let streamUrl = '';
    if (window.cachedSongsList && window.cachedSongsList.includes(track.id)) {
        streamUrl = `/api/cache/stream?id=${track.id}`;
    } else {
        if (track.downloadUrl && track.downloadUrl.length > 0) {
            const best = track.downloadUrl.find(u => u.quality === '320kbps') || track.downloadUrl[track.downloadUrl.length - 1];
            streamUrl = best.url;
        }
        if (!streamUrl && track.id) {
            streamUrl = `/api/play_stream?id=${track.id}`;
        }
    }
    
    if (streamUrl) {
        audio.src = streamUrl;
        audio.play().catch(e => console.log('Play intercepted'));
        
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.name || track.title || 'Unknown Song',
                artist: track.artists?.primary?.[0]?.name || 'Unknown Artist',
                album: track.album?.name || 'Unknown Album',
                artwork: [
                    { src: getHighestQualityImage(track.image), sizes: '500x500', type: 'image/jpeg' }
                ]
            });
        }
    }
    updateQueueUI();
    
    if (window.onSongChangeForLyrics && track) {
        window.onSongChangeForLyrics(track);
    }
}

window.scrobbleCurrentTrack = function() {
    let track = window.getCurrentTrack();
    if (!track) return;

    // Save to playedArtists with thumbnail
    if (track.artists && track.artists.primary && track.artists.primary.length > 0) {
        let playedArtists = JSON.parse(localStorage.getItem('playedArtists') || '[]');
        const primaryA = track.artists.primary[0];
        const pArtist = {
            id: primaryA.id || '',
            name: primaryA.name || '',
            image: track.image || ''
        };
        playedArtists = playedArtists.filter(a => (a.id && a.id !== pArtist.id) && (a.name && a.name.toLowerCase() !== pArtist.name.toLowerCase()));
        playedArtists.unshift(pArtist);
        if (playedArtists.length > 20) playedArtists.pop();
        localStorage.setItem('playedArtists', JSON.stringify(playedArtists));
        
        // Fetch official artist avatar in background
        if (pArtist.id && pArtist.id.startsWith('UC')) {
            window.proactiveFetchArtistImage(pArtist.id, pArtist.name);
        }
    }

    // Save to lastPlayedAlbum
    if (track.album && track.album.id) {
        let lastPlayedAlbum = JSON.parse(localStorage.getItem('lastPlayedAlbum') || '[]');
        lastPlayedAlbum = lastPlayedAlbum.filter(a => a.id !== track.album.id);
        lastPlayedAlbum.unshift(track.album);
        if (lastPlayedAlbum.length > 10) lastPlayedAlbum.pop();
        localStorage.setItem('lastPlayedAlbum', JSON.stringify(lastPlayedAlbum));
    }

    // Save to history
    let history = JSON.parse(localStorage.getItem('playHistory') || '[]');
    history = history.filter(h => h.id !== track.id);
    history.unshift(track);
    if (history.length > 30) history.pop();
    localStorage.setItem('playHistory', JSON.stringify(history));

    // Record Granular Listening Event for Stats Engine
    if (window.StatsEngine && window.StatsEngine.recordListenEvent) {
        const listenedMs = (audio && audio.currentTime > 0) ? Math.round(audio.currentTime * 1000) : (track.duration ? track.duration * 1000 : 180000);
        window.StatsEngine.recordListenEvent(track, listenedMs);
    }
}

audio.addEventListener('play', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    document.body.classList.add('is-playing');
    if (window.electronAPI && window.electronAPI.updateDynamicIsland) {
        window.electronAPI.updateDynamicIsland({ type: 'state', state: 'play' });
    }
    window.syncDiscordActivity();
    if (window.updateAodPlaybackState) window.updateAodPlaybackState();
});

audio.addEventListener('pause', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    document.body.classList.remove('is-playing');
    if (window.electronAPI && window.electronAPI.updateDynamicIsland) {
        window.electronAPI.updateDynamicIsland({ type: 'state', state: 'pause' });
    }
    window.syncDiscordActivity();
    if (window.updateAodPlaybackState) window.updateAodPlaybackState();
});

audio.addEventListener('seeked', () => {
    window.syncDiscordActivity();
});

playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
});

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        loadCurrentTrack();
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentIndex < currentQueue.length - 1) {
        currentIndex++;
        loadCurrentTrack();
    }
});

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => document.getElementById('prevBtn').click());
    navigator.mediaSession.setActionHandler('nexttrack', () => document.getElementById('nextBtn').click());
}


window.isShuffle = false;
window.isRepeat = false;

window.toggleMute = function() {
    audio.muted = !audio.muted;
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        muteBtn.innerHTML = audio.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        muteBtn.style.color = audio.muted ? 'var(--accent)' : '';
    }
    if (window.updateSheetVolumeUI) window.updateSheetVolumeUI();
};

window.toggleShuffle = function() {
    window.isShuffle = !window.isShuffle;
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.style.color = window.isShuffle ? 'var(--accent)' : '';
    }
};

window.toggleRepeat = function() {
    window.isRepeat = !window.isRepeat;
    const repeatBtn = document.getElementById('repeatBtn');
    if (repeatBtn) {
        repeatBtn.style.color = window.isRepeat ? 'var(--accent)' : '';
    }
    if (window.electronAPI && window.electronAPI.updateDynamicIsland) {
        window.electronAPI.updateDynamicIsland({ type: 'repeat', active: window.isRepeat });
    }
};

audio.addEventListener('loadedmetadata', () => {
    let track = window.getCurrentTrack();
    if (track && (!track.duration || track.duration === 0) && audio.duration && !isNaN(audio.duration)) {
        track.duration = Math.floor(audio.duration);
        let history = JSON.parse(localStorage.getItem('playHistory') || '[]');
        let histIndex = history.findIndex(h => h.id === track.id);
        if (histIndex !== -1) {
            history[histIndex].duration = track.duration;
            localStorage.setItem('playHistory', JSON.stringify(history));
        }
    }
    window.syncDiscordActivity();
});

audio.addEventListener('timeupdate', () => {
    const current = document.getElementById('currentTime');
    if (current) current.textContent = formatTime(audio.currentTime);
    
    const total = document.getElementById('totalTime');
    if (total) total.textContent = formatTime(audio.duration);
    
    if (progressBar) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = percent + '%';
    }

    if (window.electronAPI && window.electronAPI.updateDynamicIsland) {
        window.electronAPI.updateDynamicIsland({ type: 'time', currentTime: audio.currentTime, duration: audio.duration });
    }

    if (window.StatsEngine && window.StatsEngine.trackPlaytime) {
        window.StatsEngine.trackPlaytime(audio.currentTime);
    }

    if (window.updateAodProgress) {
        window.updateAodProgress();
    }

    if (!window.currentTrackScrobbled && audio.duration > 0) {
        // Scrobble if played for more than 30 seconds or 50% of the track
        if (audio.currentTime > 30 || audio.currentTime > (audio.duration * 0.5)) {
            window.currentTrackScrobbled = true;
            if (window.scrobbleCurrentTrack) window.scrobbleCurrentTrack();
        }
    }
});

audio.addEventListener('ended', () => {
    // Record track completion in StatsEngine
    const finishedTrack = window.getCurrentTrack ? window.getCurrentTrack() : null;
    if (window.ytTrackEnded) window.ytTrackEnded();
    if (finishedTrack && window.StatsEngine && window.StatsEngine.recordListenEvent) {
        const fullMs = (audio.duration && audio.duration > 0) ? Math.round(audio.duration * 1000) : 180000;
        window.StatsEngine.recordListenEvent(finishedTrack, fullMs, true);
    }

    // Cache the song if not already cached
    const currentSong = window.getCurrentTrack ? window.getCurrentTrack() : null;
    if (currentSong && window.cachedSongsList && !window.cachedSongsList.includes(currentSong.id)) {
        const payload = {
            id: currentSong.id,
            metadata: currentSong,
            lyrics: window.currentLyricsData || null
        };
        fetch('/api/cache/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        }).then(res => res.json()).then(data => {
            if (data.success) {
                window.cachedSongsList.push(currentSong.id);
            }
        }).catch(e => console.error('Cache add error', e));
    }

    if (window.isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log(e));
    } else if (window.isShuffle && currentQueue.length > 0) {
        let randIdx = Math.floor(Math.random() * currentQueue.length);
        currentIndex = randIdx;
        loadCurrentTrack();
    } else {
        document.getElementById('nextBtn').click();
    }
});

progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    if (!rect.width || !isFinite(audio.duration) || audio.duration <= 0) return;
    const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const target = percent * audio.duration;
    if (isFinite(target)) audio.currentTime = target;
});

// Queue UI
const queueBtn = document.getElementById('queueBtn');
if (queueBtn) {
    queueBtn.addEventListener('click', () => {
        document.getElementById('queuePanel').classList.toggle('open');
    });
}

function updateQueueUI() {
    const queueList = document.getElementById('queueList');
    queueList.innerHTML = '';
    currentQueue.forEach((track, i) => {
        if (track && track.id) window.allTracks[track.id] = track;
        const div = document.createElement('div');
        div.className = `queue-item cm-queue-item ${i === currentIndex ? 'playing' : ''}`;
        div.setAttribute('data-id', track.id);
        div.setAttribute('data-index', i);
        div.innerHTML = `
            <img src="${getHighestQualityImage(track.image)}">
            <div style="flex:1; overflow:hidden">
                <div style="font-size:14px; white-space:nowrap; text-overflow:ellipsis; overflow:hidden">${track.name || track.title}</div>
                <div style="font-size:12px; color:var(--text-secondary)">${track.artists?.primary?.[0]?.name || ''}</div>
            </div>
        `;
        div.onclick = () => { currentIndex = i; loadCurrentTrack(); };
        queueList.appendChild(div);
    });
    
    // Auto-scroll logic
    setTimeout(() => {
        const activeItem = queueList.querySelector('.playing');
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

// Global UI interaction


// ===
window.toggleSaveAlbum = (id, btn, name, image, artistName) => {
    let saved = JSON.parse(localStorage.getItem('saved_albums') || '{}');
    let isSaved = !!saved[id];
    let icon = btn.querySelector('i');
    
    if (isSaved) {
        delete saved[id];
        icon.className = 'fas fa-plus';
        icon.style.color = '';
    } else {
        saved[id] = { name, image, artistName };
        icon.className = 'fas fa-check';
        icon.style.color = 'var(--accent)';
    }
    localStorage.setItem('saved_albums', JSON.stringify(saved));
};

window.toggleSubscribe = (id, btn, name = 'Unknown', image = '') => {
    let subs = JSON.parse(localStorage.getItem('subscribed_artists') || '{}');
    const isSub = !!subs[id] || localStorage.getItem(`sub_${id}`) === 'true';
    
    if (isSub) {
        delete subs[id];
        localStorage.removeItem(`sub_${id}`);
        btn.classList.remove('subscribed');
        btn.textContent = 'Subscribe';
    } else {
        subs[id] = { name, image };
        btn.classList.add('subscribed');
        btn.textContent = 'Subscribed';
    }
    localStorage.setItem('subscribed_artists', JSON.stringify(subs));
};




async function renderFavorites() {
    let html = `
    <div class="hero-header">
        <div class="hero-info">
            <div class="hero-type">PLAYLIST</div>
            <div class="hero-title">Favorite Songs</div>
            <div class="hero-meta">${favoriteSongs.length} songs${(window.ytLoggedIn && window.ytLoggedIn()) ? ' &middot; Synced with YouTube Music' : ''}</div>
            <div class="action-buttons">
                <button class="btn-primary" onclick="playList(window.currentRenderedTracks)">PLAY</button>
            </div>
        </div>
    </div>
    <table class="tracklist favorites-list">`;
    
    window.currentRenderedTracks = favoriteSongs;
    if (window.ytLoggedIn && window.ytLoggedIn() && window.ytSyncFavorites) window.ytSyncFavorites();

    if(favoriteSongs && favoriteSongs.length > 0) {
        favoriteSongs.forEach((song, i) => {
            html += `
            ${(window.allTracks[song.id] = song) ? '' : ''}<tr class="track-row">
                <td class="track-num">
                    <span class="track-num-txt">${i+1}</span>
                    <i class="fas fa-play track-play-icon" onclick="playList(window.currentRenderedTracks, ${i})"></i>
                </td>
                <td>
                    <div class="track-info-cell">
                        <img src="${getHighestQualityImage(song.image)}" class="track-thumb">
                        <div>
                            <div class="track-title">${song.name}</div>
                            <div class="track-artist">${getClickableArtistsHtml(song)}</div>
                        </div>
                    </div>
                </td>
                <td class="track-duration">${formatTime(song.duration)}</td>
                <td style="width: 80px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px;" onclick="event.stopPropagation()">
                        <i class="${favoriteSongs.some(s => s.id === song.id) ? 'fas' : 'far'} fa-heart" 
                           style="color:${favoriteSongs.some(s => s.id === song.id) ? 'var(--accent)' : 'var(--text-secondary)'}; cursor:pointer; font-size: 16px; padding: 12px; border-radius: 50%;" 
                           onclick="window.toggleHeart(event, '${song.id}')" title="Like"></i>
                        ${window.getPlaylistIconHtml(song.id)}
                    </div>
                </td>
            </tr>`;
        });
    } else {
        html += `<tr><td colspan="3" style="text-align:center; padding: 40px; color:var(--text-gray);">No favorite songs yet. Click the heart icon on any song to add it here!</td></tr>`;
    }
    
    html += `</table>`;
    routerView.innerHTML = html;
}




async function renderHistory() {
    const history = JSON.parse(localStorage.getItem('playHistory') || '[]');
    let html = `
    <div class="hero-header">
        <div class="hero-info">
            <div class="hero-type">PLAYLIST</div>
            <div class="hero-title">Recently Played</div>
            <div class="hero-meta">${history.length} songs</div>
            <div class="action-buttons">
                ${history.length > 0 ? '<button class="btn-primary" onclick="playList(window.currentRenderedTracks)">PLAY</button>' : ''}
            </div>
        </div>
    </div>
    <table class="tracklist">`;
    
    window.currentRenderedTracks = history;

    if(history && history.length > 0) {
        history.forEach((song, i) => {
            html += `
            ${(window.allTracks[song.id] = song) ? '' : ''}<tr class="track-row">
                <td class="track-num">
                    <span class="track-num-txt">${i+1}</span>
                    <i class="fas fa-play track-play-icon" onclick="playList(window.currentRenderedTracks, ${i})"></i>
                </td>
                <td>
                    <div class="track-info-cell">
                        <img src="${getHighestQualityImage(song.image)}" class="track-thumb">
                        <div>
                            <div class="track-title">${song.name}</div>
                            <div class="track-artist">${getClickableArtistsHtml(song)}</div>
                        </div>
                    </div>
                </td>
                <td class="track-duration">${formatTime(song.duration)}</td>
                <td style="width: 80px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px;" onclick="event.stopPropagation()">
                        <i class="${favoriteSongs.some(s => s.id === song.id) ? 'fas' : 'far'} fa-heart" 
                           style="color:${favoriteSongs.some(s => s.id === song.id) ? 'var(--accent)' : 'var(--text-secondary)'}; cursor:pointer; font-size: 16px; padding: 12px; border-radius: 50%;" 
                           onclick="window.toggleHeart(event, '${song.id}')" title="Like"></i>
                        ${window.getPlaylistIconHtml(song.id)}
                    </div>
                </td>
            </tr>`;
        });
    } else {
        html += `<tr><td colspan="4" style="text-align:center; padding: 40px; color:var(--text-gray);">No recently played songs yet. Start listening to music!</td></tr>`;
    }
    
    html += `</table>`;
    routerView.innerHTML = html;
}


async function renderSubscribedArtists() {
    let subs = JSON.parse(localStorage.getItem('subscribed_artists') || '{}');
    const artistKeys = Object.keys(subs);
    
    let html = `
    <div class="hero-header">
        <div class="hero-info">
            <div class="hero-title">Subscribed Artists</div>
            <div class="hero-meta">${artistKeys.length} artists</div>
        </div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 40px;">`;
    
    if (artistKeys.length > 0) {
        artistKeys.forEach(id => {
            const artist = subs[id];
            html += `
            <div class="artist-card" onclick="window.location.hash='#artist/${id}'" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; width: 140px;">
                <div class="card-img-wrapper" style="width: 140px; height: 140px; border-radius: 50%; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin-bottom: 12px;">
                    <img src="${artist.image || 'https://via.placeholder.com/150'}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="card-title" style="text-align: center; font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${artist.name}</div>
                <div class="card-subtitle" style="text-align: center; font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Artist</div>
            </div>
                `;
        });
    } else {
        html += `<div style="text-align:center; padding: 40px; color:var(--text-gray); grid-column: 1 / -1;">You haven't subscribed to any artists yet.</div>`;
    }
    
    html += `</div>`;
    routerView.innerHTML = html;
}



window.removeSavedAlbum = function(id) {
    if(confirm('Remove this album from saved albums?')) {
        let saved = JSON.parse(localStorage.getItem('saved_albums') || '{}');
        delete saved[id];
        localStorage.setItem('saved_albums', JSON.stringify(saved));
        renderSavedAlbums();
    }
};

async function renderSavedAlbums() {
    let saved = JSON.parse(localStorage.getItem('saved_albums') || '{}');
    const albumKeys = Object.keys(saved);
    
    let html = `
    <div class="hero-header">
        <div class="hero-info">
            <div class="hero-title">Saved Albums</div>
            <div class="hero-meta">${albumKeys.length} albums</div>
        </div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 40px;">`;
    
    if (albumKeys.length > 0) {
        albumKeys.forEach(id => {
            const album = saved[id];
            html += `
            <div class="album-card" onclick="window.location.hash='#album/${id}'" style="cursor: pointer; width: 140px;">
                <div class="card-img-wrapper" style="width: 140px; height: 140px; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin-bottom: 12px;">
                    <img src="${album.image || 'https://via.placeholder.com/150'}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="card-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${album.name}</div>
                <div class="card-subtitle" style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${album.artistName || 'Album'}</div>
            </div>`;
        });
    } else {
        html += `<div style="text-align:center; padding: 40px; color:var(--text-gray); grid-column: 1 / -1;">You haven't saved any albums yet.</div>`;
    }
    
    html += `</div>`;
    routerView.innerHTML = html;
}


// ==========================================

// ==========================================
// PLAYLIST ICON HELPERS
// ==========================================

window.getPlaylistIconHtml = function(songId) {
    const playlists = getPlaylists();
    const isAdded = playlists.some(pl => pl.songs.includes(songId));
    const iconClass = isAdded ? 'fas fa-folder-minus' : 'fas fa-folder-plus';
    const color = isAdded ? 'var(--accent)' : 'var(--text-secondary)';
    const title = isAdded ? 'Remove from Playlists' : 'Add to Playlist';
    
    return `<i class="${iconClass} playlist-icon-global" 
               style="color:${color}; cursor:pointer; font-size:15px;" 
               onclick="window.toggleSongInPlaylists(event, '${songId}', this)" 
               title="${title}"></i>
            <i class="fas fa-ellipsis-v" 
               style="color:var(--text-secondary); cursor:pointer; font-size:14px; padding: 4px;" 
               onclick="window.openSongContextMenu(event, '${songId}')" 
               title="More Options"></i>`;
};

window.toggleSongInPlaylists = function(event, songId, btnElement) {
    event.stopPropagation();
    const playlists = getPlaylists();
    const addedTo = playlists.filter(pl => pl.songs.includes(songId));
    
    if (addedTo.length > 0) {
        // Remove from all playlists it is currently in
        addedTo.forEach(pl => {
            pl.songs = pl.songs.filter(id => id !== songId);
        });
        savePlaylists(playlists);
        if(btnElement) {
            btnElement.className = 'fas fa-folder-plus playlist-icon-global';
            btnElement.style.color = 'var(--text-secondary)';
            btnElement.title = 'Add to Playlist';
        }
    } else {
        // Open modal to choose
        window.openPlaylistModal(songId);
    }
};

window.updateRightPanelPlaylistBtn = function(songId) {
    const btn = document.getElementById('playlistBtn');
    if(!btn) return;
    const playlists = getPlaylists();
    const isAdded = playlists.some(pl => pl.songs.includes(songId));
    if (isAdded) {
        btn.className = 'fas fa-folder-minus';
        btn.style.color = 'var(--accent)';
        btn.title = 'Remove from Playlists';
    } else {
        btn.className = 'fas fa-folder-plus';
        btn.style.color = 'var(--text-secondary)';
        btn.title = 'Add to Playlist';
    }
    btn.onclick = (e) => window.toggleSongInPlaylists(e, songId, btn);
};

// USER PLAYLISTS LOGIC
// ==========================================

function getPlaylists() {
    try {
        return JSON.parse(localStorage.getItem('user_playlists')) || [];
    } catch(e) { return []; }
}

function savePlaylists(playlists) {
    localStorage.setItem('user_playlists', JSON.stringify(playlists));
}

let currentTrackToAddToPlaylist = null;

window.openPlaylistModal = function(trackId) {
    currentTrackToAddToPlaylist = trackId;
    const modal = document.getElementById('playlistModal');
    const body = document.getElementById('playlistModalBody');
    if (!modal || !body) return;
    const playlists = getPlaylists();
    
    body.innerHTML = '';
    
    if (playlists.length === 0) {
        body.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding: 24px 0;">No playlists created yet. Type a name below to create one!</p>';
    } else {
        playlists.forEach(pl => {
            const isAlreadyIn = Array.isArray(trackId) 
                ? trackId.every(id => pl.songs.includes(id))
                : (pl.songs && pl.songs.includes(trackId));
            const item = document.createElement('div');
            item.className = 'playlist-item';
            item.onclick = () => window.addToPlaylist(pl.id);
            item.innerHTML = `
                <div class="playlist-icon">
                    <i class="fas fa-music"></i>
                </div>
                <div class="playlist-info">
                    <h4>${safeEscape(pl.name)}</h4>
                    <p>${pl.songs.length} ${pl.songs.length === 1 ? 'song' : 'songs'}${isAlreadyIn ? ' • <span style="color:var(--accent);">Added</span>' : ''}</p>
                </div>
                <div style="margin-left: auto;">
                    <i class="fas ${isAlreadyIn ? 'fa-check' : 'fa-plus'}" style="color: ${isAlreadyIn ? 'var(--accent)' : 'var(--text-secondary)'}; font-size: 14px;"></i>
                </div>
            `;
            body.appendChild(item);
        });
    }
    
    modal.classList.add('active');
};

window.closePlaylistModal = function() {
    const modal = document.getElementById('playlistModal');
    if (modal) modal.classList.remove('active');
};

window.createAndAddToPlaylist = function() {
    const input = document.getElementById('newPlaylistInput');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;
    
    const playlists = getPlaylists();
    const newPlaylist = {
        id: 'pl_' + Date.now(),
        name: name,
        songs: []
    };
    playlists.push(newPlaylist);
    savePlaylists(playlists);
    
    input.value = '';
    
    if (currentTrackToAddToPlaylist) {
        window.addToPlaylist(newPlaylist.id);
    } else {
        window.openPlaylistModal(null);
    }
};

window.addToPlaylist = function(playlistId) {
    if (!currentTrackToAddToPlaylist) return;
    
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (pl) {
        if (Array.isArray(currentTrackToAddToPlaylist)) {
            currentTrackToAddToPlaylist.forEach(id => {
                if (!pl.songs.includes(id)) pl.songs.push(id);
            });
            savePlaylists(playlists);
            if (window.showToast) window.showToast(`Added songs to "${pl.name}"`);
        } else {
            if (!pl.songs.includes(currentTrackToAddToPlaylist)) {
                pl.songs.push(currentTrackToAddToPlaylist);
                
                let track = window.allTracks ? window.allTracks[currentTrackToAddToPlaylist] : null;
                if (!track && window.currentRenderedTracks) track = window.currentRenderedTracks.find(t=>t.id===currentTrackToAddToPlaylist);
                if (!track && window.currentQueue) track = window.currentQueue.find(t=>t.id===currentTrackToAddToPlaylist);
                if (track && track.image) {
                    pl.images = pl.images || [];
                    const img = getHighestQualityImage(track.image);
                    if (!pl.images.includes(img)) pl.images.push(img);
                }
                
                savePlaylists(playlists);
                if (window.showToast) window.showToast(`Added to "${pl.name}"`);
            } else {
                pl.songs = pl.songs.filter(id => id !== currentTrackToAddToPlaylist);
                savePlaylists(playlists);
                if (window.showToast) window.showToast(`Removed from "${pl.name}"`);
            }
        }
    }
    window.closePlaylistModal();
    if (window.location.hash.startsWith('#playlist/')) {
        const curPlId = window.location.hash.split('/')[1];
        if (curPlId === playlistId && typeof renderSingleUserPlaylist === 'function') {
            renderSingleUserPlaylist(curPlId);
        }
    }
};

window.openPlaylistModalForAlbum = async function(albumId) {
    try {
        const res = await fetch(`/api/albums?id=${albumId}`);
        const data = await res.json();
        if (data.success && data.data && data.data.songs) {
            currentTrackToAddToPlaylist = data.data.songs.map(s => s.id);
            window.openPlaylistModal('BATCH_ALBUM');
        }
    } catch (e) {
        console.error("Error fetching album for playlist:", e);
    }
};

const originalAddToPlaylist = window.addToPlaylist;
window.addToPlaylist = function(playlistId) {
    if (Array.isArray(currentTrackToAddToPlaylist)) {
        const playlists = getPlaylists();
        const pl = playlists.find(p => p.id === playlistId);
        if (pl) {
            let addedCount = 0;
            currentTrackToAddToPlaylist.forEach(songId => {
                if (!pl.songs.includes(songId)) {
                    pl.songs.push(songId);
                    
                    let track = window.allTracks[songId];
                    if (!track && window.currentRenderedTracks) track = window.currentRenderedTracks.find(t=>t.id===songId);
                    if (track && track.image) {
                        pl.images = pl.images || [];
                        if (!pl.images.includes(track.image)) pl.images.push(track.image);
                    }
                    
                    addedCount++;
                }
            });
            savePlaylists(playlists);
            showToast(`Added ${addedCount} songs to playlist!`);
        }
        window.closePlaylistModal();
    } else {
        originalAddToPlaylist(playlistId);
    }
};

window.createPlaylistFromScreen = function() {
    const input = document.getElementById('screenPlaylistInput');
    const name = input ? input.value.trim() : '';
    if (!name) return;

    const syncBox = document.getElementById('syncYtPlaylist');
    const wantSync = !!(syncBox && syncBox.checked) && window.ytLoggedIn && window.ytLoggedIn();

    if (wantSync) {
        const btn = document.getElementById('createPlaylistBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = 'Creating\u2026'; }
        fetch('/api/yt/create_playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: name }),
        }).then((r) => r.json()).then((res) => {
            if (res && res.success) {
                airToast('Playlist created on YouTube Music');
                window.__ytMirrorLast = 0;
                window.ytMirrorPlaylists(null, true).then(() => renderUserPlaylists());
            } else {
                airToast('YouTube create failed — saved locally');
                window.airCreateLocalPlaylist(name);
                renderUserPlaylists();
            }
        }).catch(() => {
            airToast('YouTube create failed — saved locally');
            window.airCreateLocalPlaylist(name);
            renderUserPlaylists();
        });
        return;
    }

    window.airCreateLocalPlaylist(name);
    renderUserPlaylists();
};

window.airCreateLocalPlaylist = function(name) {
    const playlists = getPlaylists();
    playlists.push({ id: 'pl_' + Date.now(), name: name, songs: [] });
    savePlaylists(playlists);
};

async function renderUserPlaylists() {
    routerView.innerHTML = window.airDotsHtml(window.t('playlists') + '\u2026');

    const loggedIn = !!(window.ytLoggedIn && window.ytLoggedIn());
    if (loggedIn && !window.ytAccount) await window.ytRefreshAccount();
    const loggedInNow = !!(window.ytLoggedIn && window.ytLoggedIn());

    let ytPlaylists = [];
    let ytFailed = false;
    if (loggedInNow) {
        try {
            const res = await fetch('/api/library/playlists').then((r) => r.json());
            ytPlaylists = (res && res.data) || [];
        } catch (e) { ytFailed = true; }
        if (!ytFailed && window.ytMirrorPlaylists) window.ytMirrorPlaylists(ytPlaylists, true);
    }

    const localPlaylists = getPlaylists();
    const localOnly = localPlaylists.filter((pl) => !pl.ytId);
    const cards = [];
    if (loggedInNow) {
        ytPlaylists.forEach((yt) => cards.push({ kind: 'yt', item: yt }));
        localOnly.forEach((pl) => cards.push({ kind: 'local', item: pl }));
    } else {
        localPlaylists.forEach((pl) => cards.push({ kind: 'local', item: pl }));
    }

    let html = `
        <div class="header-section" style="margin-bottom: 20px;">
            <h1 style="font-size: 2.5rem; font-weight: 700; margin: 0 0 10px 0; color: var(--text-primary);">Your Playlists</h1>
            <p style="color: var(--text-secondary); margin: 0;">${loggedInNow
                ? (ytPlaylists.length + ' on YouTube Music' + (localOnly.length ? ' &middot; ' + localOnly.length + ' local' : ''))
                : (localPlaylists.length + ' playlists &middot; saved on this device')}</p>
        </div>
        
        <div class="create-playlist-section" style="border: none; padding-top: 0; margin-bottom: 30px; max-width: 460px;">
            <input type="text" id="screenPlaylistInput" class="create-playlist-input" placeholder="New Playlist Name" onkeypress="if(event.key === 'Enter') window.createPlaylistFromScreen()">
            <button id="createPlaylistBtn" class="create-playlist-btn" onclick="window.createPlaylistFromScreen()">Create</button>
            ${loggedInNow ? `<label class="air-inline-check" title="Also create this playlist on YouTube Music"><input type="checkbox" id="syncYtPlaylist"> ${window.t('syncYoutube')}</label>` : ''}
        </div>
    `;
    
    if (cards.length === 0) {
        if (loggedInNow) {
            html += ytFailed
                ? `<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Could not load your YouTube Music playlists right now. Check your connection and try again.</div>`
                : `<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No playlists on your YouTube Music account yet. Create one above and tick "Sync with YouTube" to push it to your account.</div>`;
        } else {
            html += `<div style="text-align: center; padding: 30px 50px; color: var(--text-secondary);">You haven't created any playlists yet. Use the Create button above to start!</div>`;
            html += window.ytPremiumPromptHtml();
        }
    } else {
        html += `<div class="grid-container">`;
        cards.forEach((card) => {
            if (card.kind === 'yt') {
                const item = card.item || {};
                const label = String(item.name || item.title || 'Playlist').replace(/"/g, '&quot;');
                html += `
                <div class="card playlist-card" onclick="window.location.hash='#playlist/${item.id}'" style="cursor: pointer;">
                    <div class="card-img-wrapper">
                        <img src="${getHighestQualityImage(item.image) || 'https://via.placeholder.com/150'}" style="width:100%; height:100%; object-fit:cover; border-radius: 8px;">
                    </div>
                    <div class="card-info">
                        <div class="card-title" title="${label}">${label}</div>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${item.subtitle || 'YouTube Music'}</p>
                    </div>
                </div>`;
            } else {
                html += window.airLocalPlaylistCardHtml(card.item, !loggedInNow);
            }
        });
        html += `</div>`;
        if (!loggedInNow) html += window.ytPremiumPromptHtml(true);
    }
    
    html += `<div id="yt-library-sections"></div>`;
    routerView.innerHTML = html;
    if (window.ytRenderLibrarySections) window.ytRenderLibrarySections(true);
}

async function renderSingleUserPlaylist(id) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === id);
    if (!pl) {
        routerView.innerHTML = '<p>Playlist not found.</p>';
        return;
    }
    
    routerView.innerHTML = `<div class="loader"></div>`;
    
    if (pl.songs.length === 0) {
        
        let fallbackHeroImg = 'https://via.placeholder.com/250x250/25d366/000000?text=Playlist';
        routerView.innerHTML = `
            <div class="back-btn" onclick="window.location.hash='#playlists'" title="Go Back"><i class="fas fa-arrow-left"></i></div>
            <div class="hero-header">
                <img src="${fallbackHeroImg}" class="hero-img" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div class="hero-info">
                    <div class="hero-type">PLAYLIST</div>
                    <div class="hero-title">${pl.name}</div>
                    <div class="hero-meta">0 songs &bull; Created by You</div>
                </div>
            </div>
            <div style="text-align: center; padding: 50px; color: var(--text-secondary);">This playlist is empty. Add songs from search or charts!</div>
        `;

        return;
    }
    
    try {
        const songIds = pl.songs.join(',');
        const res = await fetch(`/api/songs?ids=${songIds}`);
        const data = await res.json();
        
        if (data.success && data.data) {
            
            let thumbs = [];
            data.data.forEach(song => {
                if (song.image && !thumbs.includes(song.image) && thumbs.length < 3) {
                    thumbs.push(song.image);
                }
            });
            let heroImgHtml = '';
            if (thumbs.length > 0) {
                let revThumbs = [...thumbs].reverse();
                heroImgHtml = '<div style="position:relative; width: 250px; height: 250px; flex-shrink: 0;">' + 
                    revThumbs.map((img, idx) => {
                        return `<img src="${getHighestQualityImage(img)}" class="stacked-thumb">`;
                    }).join('') + '</div>';
            } else {
                heroImgHtml = `<img src="https://via.placeholder.com/250x250/25d366/000000?text=Playlist" class="hero-img" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">`;
            }

            let html = `
                <div class="back-btn" onclick="window.location.hash='#playlists'" title="Go Back"><i class="fas fa-arrow-left"></i></div>
                <div class="hero-header" style="align-items: flex-end;">
                    ${heroImgHtml}
                    <div class="hero-info" style="z-index: 10;">
                        <div class="hero-type">PLAYLIST</div>
                        <div class="hero-title">${pl.name}</div>
                        <div class="hero-meta">${data.data.length} songs &bull; Created by You</div>
                        <div class="action-buttons" style="margin-top:20px;">
                            <button class="btn-primary" onclick="playList(${JSON.stringify(data.data).replace(/"/g, '&quot;')})">PLAY ALL</button>
                            <button class="icon-btn icon-btn-surface" onclick="if(confirm('Are you sure you want to delete this playlist?')) { const p = getPlaylists().filter(x=>x.id!=='${pl.id}'); savePlaylists(p); window.location.hash='#playlists'; }"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
                <table class="tracklist">`;

            
            
            window.currentRenderedTracks = data.data;
            data.data.forEach((song, i) => {
                html += `
                ${(window.allTracks[song.id] = song) ? '' : ''}<tr class="track-row">
                    <td style="width: 50px; text-align: center; color: var(--text-secondary);">
                        ${i + 1}
                        <i class="fas fa-play track-play-icon" onclick="playList(window.currentRenderedTracks, ${i})"></i>
                    </td>
                    <td>
                        <div class="track-info-cell">
                            <img src="${getHighestQualityImage(song.image)}" class="track-thumb">
                            <div>
                                <div class="track-title">${song.name || song.title}</div>
                                <div class="track-artist">${getClickableArtistsHtml(song)}</div>
                            </div>
                        </div>
                    </td>
                    <td class="track-duration">${formatTime(song.duration)}</td>
                    <td style="width: 80px; text-align: center;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 15px;" onclick="event.stopPropagation()">
                            <i class="${favoriteSongs.some(s => s.id === song.id) ? 'fas' : 'far'} fa-heart" 
                               style="color:${favoriteSongs.some(s => s.id === song.id) ? 'var(--accent)' : 'var(--text-secondary)'}; cursor:pointer; font-size: 16px; padding: 12px; border-radius: 50%;" 
                               onclick="window.toggleHeart(event, '${song.id}')" title="Like"></i>
                            ${window.getPlaylistIconHtml(song.id)}
                        </div>
                    </td>
                </tr>`;
            });

            
            html += `</table>`;
            routerView.innerHTML = html;
        } else {
            throw new Error('Failed to load songs');
        }
    } catch (e) {
        routerView.innerHTML = '<p>Error loading playlist songs.</p>';
    }
}


// ==========================================
// SETTINGS LOGIC
// ==========================================

window.updateSidebarState = function(isSettings) {
    const mainNav = document.getElementById('sidebar-main-menu');
    const settingsNav = document.getElementById('sidebar-settings-menu');
    const searchBox = document.querySelector('.search-box');
    const topLinks = document.querySelector('.top-links');
    const userProfile = document.querySelector('.user-profile');
    
    if (isSettings) {
        if(mainNav) mainNav.style.display = 'none';
        if(settingsNav) settingsNav.style.display = 'block';
        if(searchBox) searchBox.style.visibility = 'hidden';
        if(topLinks) topLinks.style.visibility = 'hidden';
    } else {
        if(mainNav) mainNav.style.display = 'block';
        if(settingsNav) settingsNav.style.display = 'none';
        if(searchBox) searchBox.style.visibility = 'visible';
        if(topLinks) topLinks.style.visibility = 'visible';
    }
}

async function renderSettingsBackup() {
    window.ytAccountCardMode = 'compact';
    routerView.innerHTML = `
        <div class="settings-page" style="padding: 20px 30px; max-width: 800px; margin: 0 auto; color: var(--text-primary);">
            <div class="hero-header" style="background: none; border-bottom: 1px solid var(--border-color); margin-bottom: 30px; padding: 10px 0 20px 0;">
                <div class="hero-info">
                    <div class="hero-title" style="font-size: 32px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 12px;"><i class="fas fa-database" style="color: var(--accent-text);"></i> Backup & Restore</div>
                    <div class="hero-meta" style="color: var(--text-secondary); font-size: 14px;">Import your library from the AirBeats Android app (.backup) or export your desktop library</div>
                </div>
            </div>

            <!-- RESTORE ANDROID BACKUP CARD -->
            <div style="background: var(--search-bg); padding: 30px; border-radius: 16px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <div style="display: flex; align-items: flex-start; gap: 20px;">
                    <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(29, 185, 84, 0.12); color: #1ed760; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">
                        <i class="fas fa-file-import"></i>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">Restore Android App Backup</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
                            Upload your AirBeats Android app <code>.backup</code> file. Your playlists, favorited tracks, and listening history will be imported directly into this desktop app.
                        </p>
                        
                        <div id="backup-dropzone" style="border: 2px dashed rgba(255,255,255,0.18); border-radius: 12px; padding: 32px 20px; text-align: center; cursor: pointer; transition: all 0.25s ease;" onclick="document.getElementById('androidBackupInput').click()">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 40px; color: #1ed760; margin-bottom: 12px; display: block; opacity: 0.9;"></i>
                            <div style="font-weight: 600; font-size: 16px; margin-bottom: 6px; color: var(--text-primary);">Click or drag & drop your .backup file here</div>
                            <div style="color: var(--text-secondary); font-size: 13px;">Supports AirBeats .backup, .zip, and .json archives</div>
                        </div>
                        <input type="file" id="androidBackupInput" accept=".backup,.zip,.json" style="display: none;" onchange="window.handleBackupUpload(this)">

                        <div id="backup-status" style="margin-top: 18px; display: none; font-size: 14px; padding: 14px 18px; border-radius: 10px; font-weight: 500;"></div>
                    </div>
                </div>
            </div>

            <!-- EXPORT DESKTOP LIBRARY CARD -->
            <div style="background: var(--search-bg); padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <div style="display: flex; align-items: flex-start; gap: 20px;">
                    <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(59, 130, 246, 0.12); color: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">
                        <i class="fas fa-file-export"></i>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">Export Desktop Library</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
                            Save your desktop favorites, custom playlists, and recently played songs to a JSON backup file on your local machine.
                        </p>
                        <button class="btn" onclick="window.exportDesktopBackup()" style="background: var(--app-bg); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.12); padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 10px; font-size: 14px; transition: all 0.2s ease;">
                            <i class="fas fa-download"></i> Export Library (.json)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Dropzone drag-and-drop support
    const dropzone = document.getElementById('backup-dropzone');
    if (dropzone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.style.borderColor = '#1ed760';
                dropzone.style.background = 'rgba(29, 185, 84, 0.05)';
            }, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.style.borderColor = 'rgba(255,255,255,0.18)';
                dropzone.style.background = 'transparent';
            }, false);
        });
        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                const input = document.getElementById('androidBackupInput');
                input.files = files;
                window.handleBackupUpload(input);
            }
        });
    }

    // Highlight sidebar
    const items = document.querySelectorAll('#sidebar-settings-menu .nav-item');
    items.forEach(el => el.classList.remove('active'));
    const current = document.getElementById('nav-settings-backup');
    if (current) current.classList.add('active');
}

window.handleBackupUpload = async function(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const statusDiv = document.getElementById('backup-status');
    
    if (!file.name.endsWith('.backup') && !file.name.endsWith('.zip') && !file.name.endsWith('.json')) {
        if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.style.background = 'rgba(255, 68, 68, 0.12)';
            statusDiv.style.color = '#ff4444';
            statusDiv.innerHTML = '<i class="fas fa-times-circle"></i> Please select a valid AirBeats <code>.backup</code>, <code>.zip</code>, or <code>.json</code> file.';
        }
        return;
    }

    if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.style.background = 'rgba(59, 130, 246, 0.12)';
        statusDiv.style.color = '#3b82f6';
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restoring your library from backup...';
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/restore_backup', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            let restoredMsg = [];
            // 1. History
            if (data.history && Array.isArray(data.history) && data.history.length > 0) {
                localStorage.setItem('recentlyPlayed', JSON.stringify(data.history));
                restoredMsg.push(`${data.history.length} history tracks`);
            }
            // 2. Favorites
            if (data.favoriteSongs && Array.isArray(data.favoriteSongs) && data.favoriteSongs.length > 0) {
                localStorage.setItem('favoriteSongs', JSON.stringify(data.favoriteSongs));
                restoredMsg.push(`${data.favoriteSongs.length} favorite songs`);
            }
            // 3. Playlists
            if (data.playlists && Array.isArray(data.playlists) && data.playlists.length > 0) {
                localStorage.setItem('user_playlists', JSON.stringify(data.playlists));
                restoredMsg.push(`${data.playlists.length} playlists`);
            }
            // 4. Stats Events from Android Backup
            if (data.statsEvents && Array.isArray(data.statsEvents) && data.statsEvents.length > 0) {
                if (window.StatsEngine && window.StatsEngine.importEvents) {
                    window.StatsEngine.importEvents(data.statsEvents);
                }
                restoredMsg.push(`${data.statsEvents.length} listening events`);
            }

            const summary = restoredMsg.length > 0 ? restoredMsg.join(', ') : 'All library data';
            if (statusDiv) {
                statusDiv.style.background = 'rgba(29, 185, 84, 0.15)';
                statusDiv.style.color = '#1ed760';
                statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Successfully restored: <b>${summary}</b>! Reloading player...`;
            }
            setTimeout(() => {
                window.location.reload();
            }, 1800);
        } else {
            throw new Error(data.error || 'Failed to parse backup archive.');
        }
    } catch (e) {
        if (statusDiv) {
            statusDiv.style.background = 'rgba(255, 68, 68, 0.12)';
            statusDiv.style.color = '#ff4444';
            statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Restore failed: ${e.message}`;
        }
    }
};

window.exportDesktopBackup = function() {
    const backupData = {
        app: "Airbeats Desktop",
        version: "6.2.0",
        exportedAt: new Date().toISOString(),
        favoriteSongs: JSON.parse(localStorage.getItem('favoriteSongs') || '[]'),
        user_playlists: JSON.parse(localStorage.getItem('user_playlists') || '[]'),
        recentlyPlayed: JSON.parse(localStorage.getItem('recentlyPlayed') || '[]'),
        saved_albums: JSON.parse(localStorage.getItem('saved_albums') || '{}'),
        subscribedArtists: JSON.parse(localStorage.getItem('subscribedArtists') || '[]'),
        statsEvents: JSON.parse(localStorage.getItem('airbeats_stats_events') || '[]'),
        totalListenMs: parseInt(localStorage.getItem('airbeats_total_listen_ms') || '0', 10),
        userName: localStorage.getItem('airbeats_user_name') || 'Airbeats Listener',
        userAvatar: localStorage.getItem('airbeats_user_avatar') || '',
        displayedBadge: localStorage.getItem('airbeats_displayed_badge') || ''
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airbeats-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

async function renderSettingsAppearance() {
    routerView.innerHTML = `
    <div class="hero-header" style="background: none; border-bottom: 1px solid var(--border-color); margin-bottom: 20px; padding: 20px;">
        <div class="hero-info">
            <div class="hero-title" style="font-size: 32px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 12px;"><i class="fas fa-palette" style="color: var(--accent-text);"></i> Appearance</div>
            <div class="hero-meta" style="color: var(--text-secondary); font-size: 14px;">Customize your Airbeats experience</div>
        </div>
    </div>
    <div style="padding: 0 20px; padding-bottom: 100px;">
        <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; font-size: 20px;">Theme</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Choose your preferred color theme for the app.</p>
            
            <div style="display: flex; gap: 20px;">
                <button id="btn-dark-mode" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;" onclick="setTheme('dark')">
                    <i class="fas fa-moon"></i> Dark Mode
                </button>
                <button id="btn-light-mode" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;" onclick="setTheme('light')">
                    <i class="fas fa-sun"></i> Light Mode
                </button>
            </div>
          </div>
          
          <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; font-size: 20px;">Waveform Animation</h3>
              <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Enable or disable the animated bobbing effect for the audio waveform while a song is playing.</p>
              
              <div style="display: flex; gap: 20px;">
                  <button id="btn-anim-on" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;" onclick="setWaveformAnimation(true)">
                      <i class="fas fa-water"></i> Animated
                  </button>
                  <button id="btn-anim-off" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;" onclick="setWaveformAnimation(false)">
                      <i class="fas fa-minus"></i> Static
                  </button>
              </div>
          </div>
  
          <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; font-size: 20px;">Dynamic Island</h3>
              <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Enable or disable the interactive mini-player overlay at the top of your screen, and tune how it looks.</p>
              
              <div style="display: flex; gap: 20px;">
                  <button id="btn-island-on" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;" onclick="setDynamicIsland(true)">
                      <i class="fas fa-layer-group"></i> Enabled
                  </button>
                  <button id="btn-island-off" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;" onclick="setDynamicIsland(false)">
                      <i class="fas fa-eye-slash"></i> Disabled
                  </button>
              </div>

              <div class="air-opt-group" style="margin-top: 22px;">
                  <div class="air-opt-label">Island size</div>
                  <div class="air-chip-group">
                      <button class="air-chip air-island-size" data-size="small" onclick="window.islandSetOption('size','small')"><i class="fas fa-compress"></i> Small</button>
                      <button class="air-chip air-island-size" data-size="medium" onclick="window.islandSetOption('size','medium')">Default</button>
                      <button class="air-chip air-island-size" data-size="large" onclick="window.islandSetOption('size','large')"><i class="fas fa-expand"></i> Large</button>
                  </div>
              </div>

              <div class="air-opt-group">
                  <div class="air-opt-label">Position</div>
                  <div class="air-chip-group">
                      <button class="air-chip air-island-pos" data-pos="left" onclick="window.islandSetOption('position','left')">Top Left</button>
                      <button class="air-chip air-island-pos" data-pos="center" onclick="window.islandSetOption('position','center')">Top Center</button>
                      <button class="air-chip air-island-pos" data-pos="right" onclick="window.islandSetOption('position','right')">Top Right</button>
                  </div>
              </div>

              <div class="air-opt-group">
                  <div class="air-opt-label">Background</div>
                  <div class="air-chip-group">
                      <button class="air-chip air-island-bg" data-bg="black" onclick="window.islandSetOption('bg','black')">Black</button>
                      <button class="air-chip air-island-bg" data-bg="dark" onclick="window.islandSetOption('bg','dark')">Dark Grey</button>
                      <button class="air-chip air-island-bg" data-bg="accent" onclick="window.islandSetOption('bg','accent')">Accent</button>
                      <button class="air-chip air-island-bg" data-bg="glass" onclick="window.islandSetOption('bg','glass')">Glass</button>
                  </div>
              </div>
              <div id="airIslandNote" style="font-size: 12px; color: var(--text-secondary); margin-top: 12px;"></div>
          </div>

          <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; font-size: 20px;"><i class="fas fa-users" style="color: #1DB954;"></i> Listen Together</h3>
              <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Sync your playback across devices or listen with friends in real-time. This connects with the Android App users.</p>
              
              <div style="display: flex; gap: 20px;">
                  <button class="btn-primary" style="padding: 12px 24px; border-radius: 8px; cursor: pointer;" onclick="window.openListenTogetherModal()">
                      <i class="fas fa-users"></i> Open Session Manager
                  </button>
              </div>
          </div>

          <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; font-size: 20px;"><i class="fas fa-moon" style="color: var(--accent-text);"></i> Always On Display</h3>
              <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Transform your desktop into an ambient OLED music display with custom styles, artwork shapes, and clock.</p>
              
              <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                  <button class="btn-primary" style="padding: 12px 24px; border-radius: 8px; cursor: pointer;" onclick="window.activateAlwaysOnDisplay(true)">
                      <i class="fas fa-moon"></i> Launch AOD
                  </button>
                  <a href="#settings/aod" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
                      <i class="fas fa-sliders-h"></i> Customize Settings
                  </a>
              </div>
          </div>
  
          <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; font-size: 20px;">Accent Color</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Customize the accent color used for active elements, buttons and loading dots.</p>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap; user-select: none; -webkit-user-select: none;">
                <button type="button" class="color-swatch air-swatch" data-color="#ff0055" style="background: #ff0055;" onclick="setAccentColor('#ff0055')" title="Rose"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#1db954" style="background: #1db954;" onclick="setAccentColor('#1db954')" title="Green"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#1d4ed8" style="background: #1d4ed8;" onclick="setAccentColor('#1d4ed8')" title="Blue"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#8b5cf6" style="background: #8b5cf6;" onclick="setAccentColor('#8b5cf6')" title="Purple"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#f59e0b" style="background: #f59e0b;" onclick="setAccentColor('#f59e0b')" title="Amber"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#ec4899" style="background: #ec4899;" onclick="setAccentColor('#ec4899')" title="Pink"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#06b6d4" style="background: #06b6d4;" onclick="setAccentColor('#06b6d4')" title="Cyan"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#84cc16" style="background: #84cc16;" onclick="setAccentColor('#84cc16')" title="Lime"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#ef4444" style="background: #ef4444;" onclick="setAccentColor('#ef4444')" title="Red"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#c6e355" style="background: #c6e355;" onclick="setAccentColor('#c6e355')" title="Lime Yellow"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#ff4081" style="background: #ff4081;" onclick="setAccentColor('#ff4081')" title="Magenta"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#e040fb" style="background: #e040fb;" onclick="setAccentColor('#e040fb')" title="Violet"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#7c4dff" style="background: #7c4dff;" onclick="setAccentColor('#7c4dff')" title="Deep Purple"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#536dfe" style="background: #536dfe;" onclick="setAccentColor('#536dfe')" title="Indigo"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#448aff" style="background: #448aff;" onclick="setAccentColor('#448aff')" title="Azure"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#40c4ff" style="background: #40c4ff;" onclick="setAccentColor('#40c4ff')" title="Sky"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#18ffff" style="background: #18ffff;" onclick="setAccentColor('#18ffff')" title="Aqua"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#64ffda" style="background: #64ffda;" onclick="setAccentColor('#64ffda')" title="Teal"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#69f0ae" style="background: #69f0ae;" onclick="setAccentColor('#69f0ae')" title="Mint"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#b2ff59" style="background: #b2ff59;" onclick="setAccentColor('#b2ff59')" title="Light Green"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#ffd740" style="background: #ffd740;" onclick="setAccentColor('#ffd740')" title="Gold"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#ffab40" style="background: #ffab40;" onclick="setAccentColor('#ffab40')" title="Orange"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#ff6e40" style="background: #ff6e40;" onclick="setAccentColor('#ff6e40')" title="Deep Orange"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#8d6e63" style="background: #8d6e63;" onclick="setAccentColor('#8d6e63')" title="Brown"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#9e9e9e" style="background: #9e9e9e;" onclick="setAccentColor('#9e9e9e')" title="Grey"></button>
                <button type="button" class="color-swatch air-swatch" data-color="#607d8b" style="background: #607d8b;" onclick="setAccentColor('#607d8b')" title="Blue Grey"></button>
            </div>

            <div style="display: flex; align-items: center; gap: 12px; margin-top: 18px;">
                <input type="color" id="airCustomAccent" onchange="setAccentColor(this.value)" style="width: 46px; height: 46px; border: none; border-radius: 10px; background: transparent; cursor: pointer;" title="Pick a custom accent color">
                <div>
                    <div style="font-size: 14px;">Custom color</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">Pick any shade from the color wheel</div>
                </div>
            </div>
        </div>

        <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; font-size: 20px;">Color Effects</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Tonal treatment applied on top of your accent color across the app.</p>
            <div class="air-chip-group">
                <button class="air-chip air-effect-chip" data-effect="none" onclick="window.setAccentEffect('none')" title="Default balanced tonal appearance">None</button>
                <button class="air-chip air-effect-chip" data-effect="fidelity" onclick="window.setAccentEffect('fidelity')" title="Faithfully mirrors your exact accent color">Fidelity</button>
                <button class="air-chip air-effect-chip" data-effect="vibrant" onclick="window.setAccentEffect('vibrant')" title="High energy and maximum saturation">Vibrant</button>
                <button class="air-chip air-effect-chip" data-effect="expressive" onclick="window.setAccentEffect('expressive')" title="Artistic with playful secondary hues">Expressive</button>
                <button class="air-chip air-effect-chip" data-effect="fruit_salad" onclick="window.setAccentEffect('fruit_salad')" title="Playful complementary fruit palette">Fruit Salad</button>
                <button class="air-chip air-effect-chip" data-effect="rainbow" onclick="window.setAccentEffect('rainbow')" title="Slowly animated spectrum shift">Rainbow</button>
                <button class="air-chip air-effect-chip" data-effect="content" onclick="window.setAccentEffect('content')" title="Content-focused balanced aesthetic">Content</button>
                <button class="air-chip air-effect-chip" data-effect="monochrome" onclick="window.setAccentEffect('monochrome')" title="Sleek greyscale tonal styling">Monochrome</button>
                <button class="air-chip air-effect-chip" data-effect="neutral" onclick="window.setAccentEffect('neutral')" title="Quiet, calm and understated tones">Neutral</button>
            </div>
            <div id="airEffectNote" style="font-size: 12px; color: var(--text-secondary); margin-top: 12px;"></div>
        </div>

        <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; font-size: 20px;">Dynamic Background</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">An ambient backdrop behind the whole app that follows the song that is playing.</p>
            <div class="air-chip-group">
                <button class="air-chip air-dbg-chip" data-mode="off" onclick="window.setDynamicBackground('off')">Off</button>
                <button class="air-chip air-dbg-chip" data-mode="gradient" onclick="window.setDynamicBackground('gradient')">Gradient</button>
                <button class="air-chip air-dbg-chip" data-mode="blur" onclick="window.setDynamicBackground('blur')">Blur</button>
                <button class="air-chip air-dbg-chip" data-mode="fluid" onclick="window.setDynamicBackground('fluid')">Fluid</button>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 12px;">Album art drives the colors. Gradient is subtle, Blur is softer, Fluid slowly animates.</div>
        </div>

        <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; font-size: 20px;">Fonts</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Typeface used across the app interface. Inter is the app's built-in typeface; the other options use fonts already on your system — nothing is downloaded.</p>
            <div class="air-chip-group">
                <button class="air-chip air-font-chip" data-font="inter" onclick="window.setAppFont('inter')">Inter (Default)</button>
                <button class="air-chip air-font-chip" data-font="system" onclick="window.setAppFont('system')">System Default</button>
                <button class="air-chip air-font-chip" data-font="sans_serif" onclick="window.setAppFont('sans_serif')">Sans-Serif</button>
                <button class="air-chip air-font-chip" data-font="serif" onclick="window.setAppFont('serif')">Serif</button>
                <button class="air-chip air-font-chip" data-font="monospace" onclick="window.setAppFont('monospace')">Monospace</button>
                <button class="air-chip air-font-chip" data-font="rounded" onclick="window.setAppFont('rounded')">Rounded</button>
                <button class="air-chip air-font-chip" data-font="condensed" onclick="window.setAppFont('condensed')">Condensed</button>
            </div>
        </div>

        <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; font-size: 20px;">Language</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Language of the app interface. The language of songs and other content is set in Content Settings.</p>
            <div class="air-chip-group">
                <button class="air-chip air-lang-chip" data-lang="en" onclick="window.setUiLanguage('en')">English</button>
                <button class="air-chip air-lang-chip" data-lang="hi" onclick="window.setUiLanguage('hi')">हिन्दी</button>
                <button class="air-chip air-lang-chip" data-lang="mr" onclick="window.setUiLanguage('mr')">मराठी</button>
                <button class="air-chip air-lang-chip" data-lang="bn" onclick="window.setUiLanguage('bn')">বাংলা</button>
                <button class="air-chip air-lang-chip" data-lang="ta" onclick="window.setUiLanguage('ta')">தமிழ்</button>
                <button class="air-chip air-lang-chip" data-lang="te" onclick="window.setUiLanguage('te')">తెలుగు</button>
            </div>
        </div>

        <div style="background: var(--search-bg); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; font-size: 20px;">Grid Cell Size</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Controls how large cards appear in Home, Library and Playlists.</p>
            <div class="air-chip-group">
                <button class="air-chip air-grid-chip" data-size="big" onclick="window.setGridSize('big')">Big</button>
                <button class="air-chip air-grid-chip" data-size="small" onclick="window.setGridSize('small')">Small</button>
            </div>
        </div>

        <div style="background: var(--search-bg); padding: 24px; border-radius: 12px;">
            <h3 style="margin-top: 0; font-size: 20px;">Panel Color</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Customize the background color of the sidebar and the mini player.</p>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap; user-select: none; -webkit-user-select: none;">
                <button type="button" class="color-swatch" style="background: #4c4a4a;" onclick="setPanelColor('#4c4a4a')" title="Default Grey"></button>
                <button type="button" class="color-swatch" style="background: #1f2937;" onclick="setPanelColor('#1f2937')" title="Slate"></button>
                <button type="button" class="color-swatch" style="background: #0f172a;" onclick="setPanelColor('#0f172a')" title="Midnight Blue"></button>
                <button type="button" class="color-swatch" style="background: #4c0519;" onclick="setPanelColor('#4c0519')" title="Deep Red"></button>
                <button type="button" class="color-swatch" style="background: #064e3b;" onclick="setPanelColor('#064e3b')" title="Forest Green"></button>
                <button type="button" class="color-swatch" style="background: #3b0764;" onclick="setPanelColor('#3b0764')" title="Deep Purple"></button>
                <button type="button" class="color-swatch" style="background: #134e4a;" onclick="setPanelColor('#134e4a')" title="Teal"></button>
                <button type="button" class="color-swatch" style="background: #3f2e27;" onclick="setPanelColor('#3f2e27')" title="Espresso"></button>
                <button type="button" class="color-swatch" style="background: #27272a;" onclick="setPanelColor('#27272a')" title="Charcoal"></button>
                <button type="button" class="color-swatch" style="background: #171717;" onclick="setPanelColor('#171717')" title="Pitch Black"></button>
            </div>
        </div>
    </div>
    `;

    setTimeout(() => {
        window.setTheme(localStorage.getItem('theme') || 'light');
        window.setWaveformAnimation(localStorage.getItem('wave_anim') === 'true');
        window.setDynamicIsland(localStorage.getItem('dynamic_island_enabled') === 'true');
        window.airAppearanceInit();
        window.dlog('settings/appearance mounted');
        window.discordRenderState(!!window.__discordUser, window.__discordUser);
        window.discordRefreshState();
        const rpcBox = document.getElementById('btn-discord-rpc');
        if (rpcBox) rpcBox.checked = window.discordRpcEnabled;
        const detBox = document.getElementById('btn-discord-details');
        if (detBox) detBox.checked = window.discordUseDetails;
        window.discordUpdatePreview();
        window.ytRefreshAccount();
    }, 50);
}

window.setPanelColor = function(color) {
    document.documentElement.style.setProperty('--sidebar-bg', color);
    
    // For the player, we add a little transparency if possible, or just use the hex
    // A simple hack is to just use the color directly, as backdrop-filter will still apply if the browser supports it
    // Or convert hex to rgba. Let's just set the variable, CSS will use it directly.
    document.documentElement.style.setProperty('--player-bg', color);
    
    localStorage.setItem('panel_color', color);
}

window.setAccentColor = function(color) {
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('accent_color', color);
    if (window.applyAccentEffect) window.applyAccentEffect(localStorage.getItem('accent_effect') || 'none', color);
    document.querySelectorAll('.air-swatch').forEach((el) => el.classList.toggle('active', el.getAttribute('data-color') === color));
    const picker = document.getElementById('airCustomAccent');
    if (picker) picker.value = color;
}

async function renderSettingsAbout() {
    routerView.innerHTML = `
    <div style="padding: 0 0 100px 0; display: flex; flex-direction: column; align-items: center; max-width: 800px; margin: 0 auto; width: 100%; font-family: sans-serif;">
        
        <div style="height: 40px;"></div>

        <!-- Logo -->
        <style>
            @keyframes logoPulse {
                0% { transform: scale(1); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                50% { transform: scale(1.05); box-shadow: 0 15px 35px rgba(0,0,0,0.15); }
                100% { transform: scale(1); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
            }
        </style>
        <div style="width: 100px; height: 100px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; animation: logoPulse 2.5s infinite ease-in-out;">
            <i class="fas fa-headphones" style="font-size: 40px; color: #111111;"></i>
        </div>

        <!-- App Name -->
        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 0; letter-spacing: -0.5px;">
            <span style="color: var(--text-primary);">Air</span><span style="color: var(--accent-text);">Beats</span>
        </h1>

        <!-- Version Badges -->
        <div style="display: flex; gap: 8px; margin-bottom: 20px; align-items: center;">
            <span style="border: 1.5px solid var(--accent); color: var(--accent-text); border-radius: 50px; padding: 4px 16px; font-size: 13px; font-weight: bold; text-transform: uppercase;">6.4.0</span>
        </div>

        <!-- Developer Text -->
        <div style="font-family: monospace; font-size: 16px; font-weight: bold; color: var(--text-secondary); margin-bottom: 24px;">
            Dev By DarkXVenom <i class="fas fa-crown" style="color: gold; margin-left: 5px;"></i>
        </div>

        <!-- Social Icons Row -->
        <div style="background: var(--search-bg); border-radius: 28px; display: flex; justify-content: space-evenly; align-items: center; padding: 12px 24px; width: 90%; max-width: 400px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 40px;">
            <a href="https://www.facebook.com/venom.digital.creator" target="_blank" style="color: var(--accent-text); font-size: 20px; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fab fa-facebook"></i></a>
            <a href="https://www.instagram.com/Dark__336/" target="_blank" style="color: var(--accent-text); font-size: 20px; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fab fa-instagram"></i></a>
            <a href="https://github.com/d0x-dev" target="_blank" style="color: var(--accent-text); font-size: 20px; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fab fa-github"></i></a>
            <a href="https://g.dev/Darkboy336" target="_blank" style="color: var(--accent-text); font-size: 20px; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fab fa-google"></i></a>
            <a href="https://AirBeats.stormx.pw/" target="_blank" style="color: var(--accent-text); font-size: 20px; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fas fa-globe"></i></a>
        </div>

        <!-- Contributors Title -->
        <div style="width: 100%; padding: 0 30px; display: flex; align-items: center; margin-bottom: 20px; box-sizing: border-box;">
            <i class="fas fa-users" style="color: var(--accent-text); font-size: 24px; margin-right: 12px;"></i>
            <h2 style="font-size: 22px; font-weight: bold; color: var(--text-primary); margin: 0; margin-right: 12px;">Contributors</h2>
            <span style="font-size: 13px; color: var(--accent-text); font-weight: 500;">1 Contributor</span>
        </div>

        <!-- Contributor Card (Darkboy only) -->
        <div style="width: 100%; padding: 0 20px; display: flex; justify-content: flex-start; margin-bottom: 30px; box-sizing: border-box; max-width: 400px; align-self: flex-start; margin-left: auto; margin-right: auto;">
            <a href="https://darkboy.pro" target="_blank" style="text-decoration: none; display: block; width: 100%;">
                <div style="background: var(--search-bg); border-radius: 24px; padding: 24px 16px; height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; position: relative; box-shadow: 0 16px 30px rgba(0,0,0,0.2); transition: transform 0.2s; cursor: pointer;" onmouseover="this.style.transform='scale(0.98)'" onmouseout="this.style.transform='scale(1)'">
                    
                    <!-- Gradient border -->
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 24px; border: 1.5px solid transparent; background: linear-gradient(135deg, var(--accent), transparent) border-box; -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;"></div>

                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <!-- Avatar -->
                        <div style="width: 80px; height: 80px; border-radius: 50%; padding: 2px; background: linear-gradient(135deg, var(--accent), transparent); margin-bottom: 16px;">
                            <img src="https://avatars.githubusercontent.com/u/218248866" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                        </div>

                        <div style="font-size: 18px; font-weight: bold; color: var(--text-primary); margin-bottom: 6px;">Darkboy</div>
                        
                        <div style="background: var(--accent); opacity: 0.9; color: #000; font-size: 12px; font-weight: bold; padding: 6px 14px; border-radius: 50px;">
                            Lead Developer
                        </div>
                    </div>

                    <!-- Social Badges Bottom -->
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <span style="width: 32px; height: 32px; border-radius: 50%; background: rgba(128,128,128,0.1); border: 1px solid rgba(128,128,128,0.2); display: flex; align-items: center; justify-content: center; color: var(--accent-text);"><i class="fab fa-github"></i></span>
                        <span style="width: 32px; height: 32px; border-radius: 50%; background: rgba(128,128,128,0.1); border: 1px solid rgba(128,128,128,0.2); display: flex; align-items: center; justify-content: center; color: var(--accent-text);"><i class="fab fa-telegram-plane"></i></span>
                        <span style="width: 32px; height: 32px; border-radius: 50%; background: rgba(128,128,128,0.1); border: 1px solid rgba(128,128,128,0.2); display: flex; align-items: center; justify-content: center; color: var(--accent-text);"><i class="fab fa-instagram"></i></span>
                        <span style="width: 32px; height: 32px; border-radius: 50%; background: rgba(128,128,128,0.1); border: 1px solid rgba(128,128,128,0.2); display: flex; align-items: center; justify-content: center; color: var(--accent-text);"><i class="fas fa-globe"></i></span>
                    </div>
                </div>
            </a>
        </div>

        </div>
        </div>

    </div>
    `;
}

window.playMadeForYouShuffle = async function() {
    try {
        let tracks = window.currentMfyQueue || window.currentQuickPicksQueue;
        if (!tracks || tracks.length === 0) {
            const hist = JSON.parse(localStorage.getItem('playHistory') || '[]');
            const favs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
            const combined = [...favs, ...hist];
            const seen = new Set();
            tracks = combined.filter(s => {
                if (!s || !s.id || seen.has(s.id)) return false;
                seen.add(s.id);
                return true;
            });
        }
        if (!tracks || tracks.length === 0) {
            const res = await fetch('/api/search/songs?query=latest&limit=30').then(r => r.json()).catch(() => ({}));
            if (res.data && res.data.results) tracks = res.data.results;
        }
        if (!tracks || tracks.length === 0) {
            if (window.showToast) window.showToast('No tracks found to shuffle.');
            return;
        }
        
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        playList(shuffled);
        if (window.showToast) window.showToast('Playing shuffled mix');
        if (window.innerWidth <= 768 && document.getElementById('sidebar')) {
            document.getElementById('sidebar').classList.remove('active');
        }
    } catch(e) {
        console.error('Shuffle Play error:', e);
    }
};

window.downloadCurrentSong = async function() {
    const track = window.getCurrentTrack();
    if (!track || !track.id) return;
    
    try {
        const btn = document.getElementById('downloadBtn');
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const downloadUrl = `/api/stream?id=${track.id}`;
        const trackTitle = track.name || track.title || 'Track';
        const trackSubtitle = track.subtitle || track.artists?.primary?.map(a => a.name).join(', ') || 'Airbeats';
        const filename = `${trackTitle} - ${trackSubtitle}.m4a`;
        
        if (window.electronDL && window.electronDL.downloadFile) {
            window.electronDL.downloadFile(window.location.origin + downloadUrl, filename);
            setTimeout(() => {
                if (btn) btn.innerHTML = '<i class="fas fa-download"></i>';
                if(window.showToast) window.showToast("Download started...");
            }, 500);
            return;
        }

        const res = await fetch(downloadUrl);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${track.title} - ${track.subtitle || 'Airbeats'}.m4a`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        if (btn) btn.innerHTML = '<i class="fas fa-download"></i>';
    } catch (e) {
        console.error("Download failed", e);
        const btn = document.getElementById('downloadBtn');
        if (btn) btn.innerHTML = '<i class="fas fa-download"></i>';
        alert('Failed to download song. Ensure CORS is supported or try right-clicking to save.');
    }
};

// MOBILE SPECIFIC FUNCTIONS
async function renderMobileLibrary() {
    routerView.innerHTML = `
        <div class="section-title" style="font-size: 24px; margin-bottom: 30px;">Library</div>
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <a href="#playlists" style="display: flex; align-items: center; padding: 20px; background: var(--search-bg); border-radius: 12px; text-decoration: none; color: var(--text-primary);">
                <i class="fas fa-list-music" style="font-size: 24px; width: 40px; color: var(--accent-text);"></i>
                <span style="font-size: 18px; font-weight: 500;">Playlists</span>
                <i class="fas fa-chevron-right" style="margin-left: auto; color: var(--text-secondary);"></i>
            </a>
            <a href="#artists" style="display: flex; align-items: center; padding: 20px; background: var(--search-bg); border-radius: 12px; text-decoration: none; color: var(--text-primary);">
                <i class="fas fa-user-music" style="font-size: 24px; width: 40px; color: var(--accent-text);"></i>
                <span style="font-size: 18px; font-weight: 500;">Artists</span>
                <i class="fas fa-chevron-right" style="margin-left: auto; color: var(--text-secondary);"></i>
            </a>
            <a href="#albums" style="display: flex; align-items: center; padding: 20px; background: var(--search-bg); border-radius: 12px; text-decoration: none; color: var(--text-primary);">
                <i class="fas fa-compact-disc" style="font-size: 24px; width: 40px; color: var(--accent-text);"></i>
                <span style="font-size: 18px; font-weight: 500;">Albums</span>
                <i class="fas fa-chevron-right" style="margin-left: auto; color: var(--text-secondary);"></i>
            </a>
            <a href="#history" style="display: flex; align-items: center; padding: 20px; background: var(--search-bg); border-radius: 12px; text-decoration: none; color: var(--text-primary);">
                <i class="fas fa-history" style="font-size: 24px; width: 40px; color: var(--accent-text);"></i>
                <span style="font-size: 18px; font-weight: 500;">Recently Played</span>
                <i class="fas fa-chevron-right" style="margin-left: auto; color: var(--text-secondary);"></i>
            </a>
            <a href="#favorites" style="display: flex; align-items: center; padding: 20px; background: var(--search-bg); border-radius: 12px; text-decoration: none; color: var(--text-primary);">
                <i class="fas fa-heart" style="font-size: 24px; width: 40px; color: var(--accent-text);"></i>
                <span style="font-size: 18px; font-weight: 500;">Favorite Songs</span>
                <i class="fas fa-chevron-right" style="margin-left: auto; color: var(--text-secondary);"></i>
            </a>
        </div>
    `;
}

(function ytInjectNav() {
    const build = () => {
        if (!document.getElementById('yt-lib-style')) {
            const style = document.createElement('style');
            style.id = 'yt-lib-style';
            style.textContent = '.yt-chip{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:999px;border:1px solid var(--text-secondary);background:transparent;color:var(--text-primary);font-size:13px;cursor:pointer;transition:border-color .18s ease,background .18s ease,color .18s ease}.yt-chip:hover{border-color:var(--accent)}.yt-chip.is-on{background:var(--accent);border-color:var(--accent);color:#fff}';
            document.head.appendChild(style);
        }
        if (!document.getElementById('nav-settings-account')) {
            const backupNav = document.getElementById('nav-settings-backup');
            if (backupNav && backupNav.parentElement && backupNav.parentElement.parentElement) {
                const li = document.createElement('li');
                li.innerHTML = '<a href="#settings/account" class="nav-item" id="nav-settings-account"><i class="fas fa-user-circle"></i> <span>Account</span></a>';
                backupNav.parentElement.parentElement.insertBefore(li, backupNav.parentElement);
            }
        }
        const backupNavEl = document.getElementById('nav-settings-backup');
        const settingsList = backupNavEl && backupNavEl.parentElement && backupNavEl.parentElement.parentElement;
        if (settingsList && !document.getElementById('nav-settings-content')) {
            const li = document.createElement('li');
            li.innerHTML = '<a href="#settings/content" class="nav-item" id="nav-settings-content"><i class="fas fa-sliders-h"></i> <span data-i18n="content">Content Settings</span></a>';
            settingsList.insertBefore(li, backupNavEl.parentElement);
        }
        if (settingsList && !document.getElementById('nav-settings-logs')) {
            const li = document.createElement('li');
            li.innerHTML = '<a href="#settings/logs" class="nav-item" id="nav-settings-logs"><i class="fas fa-file-medical-alt"></i> <span data-i18n="logs">Logs</span><span id="navLogsCrashDot" class="air-nav-dot" style="display:none;"></span></a>';
            settingsList.insertBefore(li, backupNavEl.parentElement);
        }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
    else build();
    setTimeout(build, 1500);
    setTimeout(() => { if (window.ytRefreshAccount) window.ytRefreshAccount(); }, 900);
    setTimeout(() => { if (window.airRefreshCrashBadge) window.airRefreshCrashBadge(); }, 1300);
})();

window.__ytLikedTracks = [];

window.ytPlayLiked = function(index) {
    if (!window.__ytLikedTracks || !window.__ytLikedTracks.length) return;
    playList(window.__ytLikedTracks, index);
};

window.ytRenderCards = function(items, route, fallbackSubtitle, round) {
    if (!items.length) return `<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Nothing here yet</div>`;
    let html = '<div style="display: flex; flex-wrap: wrap; gap: 24px;">';
    items.forEach((item) => {
        const image = getHighestQualityImage(item.image);
        html += `
            <div class="artist-card" onclick="window.location.hash='#${route}/${item.id}'" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; width: 150px;">
                <div class="card-img-wrapper" style="width: 150px; height: 150px; border-radius: ${round ? '50%' : '12px'}; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin-bottom: 12px;">
                    <img loading="lazy" src="${image || 'https://via.placeholder.com/150'}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="card-title" style="text-align: center; font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${item.name || item.title || ''}</div>
                <div class="card-subtitle" style="text-align: center; font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${item.subtitle || fallbackSubtitle}</div>
            </div>
        `;
    });
    return html + '</div>';
};

window.ytRenderTracks = function(items) {
    window.__ytLikedTracks = items.slice();
    if (!items.length) return `<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No liked songs yet</div>`;
    let html = '<div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">';
    items.forEach((t, i) => {
        const image = getHighestQualityImage(t.image);
        const dur = t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}` : '';
        html += `
            <div style="display: flex; align-items: center; gap: 14px; padding: 8px 10px; border-radius: 10px; cursor: pointer;" onmouseover="this.style.background='var(--search-bg)'" onmouseout="this.style.background=''" onclick="window.ytPlayLiked(${i})">
                <img loading="lazy" src="${image || 'https://via.placeholder.com/150'}" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; flex: none;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 14px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.name || ''}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.subtitle || ''}</div>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); flex: none;">${dur}</div>
            </div>
        `;
    });
    return html + '</div>';
};

window.ytLoggedIn = function() {
    return !!(window.ytAccount && window.ytAccount.loggedIn);
};

window.ytMirrorLike = function(trackId, liked) {
    if (!window.ytLoggedIn() || !trackId) return;
    const track = (window.allTracks && window.allTracks[trackId]) || null;
    const isYtId = /^[A-Za-z0-9_-]{11}$/.test(trackId);
    if (isYtId && (!track || track.source !== 'saavn')) {
        fetch('/api/yt/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: trackId, liked: !!liked })
        }).then(r => r.json()).then(data => {
            if (data && data.success && liked) window.ytMarkFavoriteSynced(trackId);
        }).catch(() => {});
        return;
    }
    // JioSaavn track: when liked, find the YouTube Music match and like it there too
    if (!liked || !track) return;
    const name = track.name || track.title || '';
    if (!name) return;
    const artist = ((track.artists && track.artists.primary) || []).map(a => a.name).filter(Boolean).join(', ') || track.subtitle || '';
    fetch('/api/yt/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trackId, name: name, artist: artist, duration: track.duration || 0, source: 'saavn', liked: true })
    }).then(r => r.json()).then(data => {
        if (data && data.success && data.data && data.data.id) {
            window.ytAdoptLikedTrack(trackId, data.data);
        } else if (window.showToast) {
            window.showToast('No YouTube Music match found — kept as a local favorite');
        }
    }).catch(() => {});
};

window.ytMarkFavoriteSynced = function(trackId) {
    if (!Array.isArray(favoriteSongs)) favoriteSongs = [];
    const trackIds = new Set([trackId]);
    const entry = favoriteSongs.find(s => s && (s.id === trackId || (s.saavnId && s.saavnId === trackId)));
    if (entry) {
        entry.ytLike = true;
        entry.ytChecked = true;
        trackIds.add(entry.id);
    }
    saveFavorites();
    window.favoriteSongs = favoriteSongs;
};

window.ytAdoptLikedTrack = function(oldId, ytTrack) {
    if (!Array.isArray(favoriteSongs)) favoriteSongs = [];
    const merged = Object.assign({}, ytTrack, { ytLike: true, ytChecked: true, saavnId: oldId });
    const idx = favoriteSongs.findIndex(s => s && s.id === oldId);
    if (idx > -1) {
        favoriteSongs.splice(idx, 1, merged);
    } else if (!favoriteSongs.some(s => s && s.id === merged.id)) {
        favoriteSongs.push(merged);
    }
    window.allTracks[merged.id] = merged;
    saveFavorites();
    window.favoriteSongs = favoriteSongs;
    if (window.showToast) window.showToast('Added to YouTube Music liked songs');
    if (window.location.hash.indexOf('favorites') >= 0 && typeof renderFavorites === 'function') renderFavorites();
};

window.ytSyncFavorites = async function(force) {
    if (!window.ytLoggedIn()) return;
    if (window.__ytFavSyncRunning) return;
    if (!force && window.__ytFavSyncedAt && (Date.now() - window.__ytFavSyncedAt) < 60000) return;
    window.__ytFavSyncRunning = true;
    window.__ytFavSyncedAt = Date.now();
    try {
        const res = await fetch('/api/library/liked' + (force ? '?r=' + Date.now() : ''));
        const data = await res.json();
        const liked = (data && data.success && Array.isArray(data.data)) ? data.data : null;
        if (!liked) return;
        if (!Array.isArray(favoriteSongs)) favoriteSongs = [];
        const likedIds = new Set(liked.map(t => t && t.id).filter(Boolean));
        // 1. Mirror all YT Music likes into local favorites
        liked.forEach(t => {
            if (!t || !t.id) return;
            if (!window.allTracks[t.id]) window.allTracks[t.id] = t;
            if (!favoriteSongs.some(s => s && s.id === t.id)) {
                favoriteSongs.push(Object.assign({}, t, { ytLike: true, ytChecked: true }));
            } else {
                const entry = favoriteSongs.find(s => s && s.id === t.id);
                if (entry) { entry.ytLike = true; entry.ytChecked = true; }
            }
        });
        // 2. Drop locally-synced entries that are no longer liked on YT
        favoriteSongs = favoriteSongs.filter(s => {
            if (!s || !s.id) return false;
            if (s.ytLike && !likedIds.has(s.id)) return false;
            return true;
        });
        saveFavorites();
        window.favoriteSongs = favoriteSongs;
        // 3. Upload local-only likes to YT Music (single attempt, max 20)
        const pending = favoriteSongs.filter(s => s && s.id && !s.ytLike && !s.ytChecked).slice(0, 20);
        for (const s of pending) {
            s.ytChecked = true;
            try {
                const isYtId = /^[A-Za-z0-9_-]{11}$/.test(s.id);
                const name = s.name || s.title || '';
                if (isYtId && !name) {
                    const r = await fetch('/api/yt/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, liked: true }) });
                    const d = await r.json();
                    if (d && d.success) s.ytLike = true;
                    continue;
                }
                if (!name) continue;
                const artist = ((s.artists && s.artists.primary) || []).map(a => a.name).filter(Boolean).join(', ') || s.subtitle || '';
                const r = await fetch('/api/yt/like', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: s.id, name: name, artist: artist, duration: s.duration || 0, source: isYtId ? 'youtube' : 'saavn', liked: true })
                });
                const d = await r.json();
                if (d && d.success) {
                    s.ytLike = true;
                    if (d.data && d.data.id && !isYtId) { s.saavnId = s.id; s.id = d.data.id; }
                }
            } catch (e) {}
            saveFavorites();
        }
        window.favoriteSongs = favoriteSongs;
        if (window.location.hash.indexOf('favorites') >= 0 && typeof renderFavorites === 'function') renderFavorites();
    } catch (e) {
    } finally {
        window.__ytFavSyncRunning = false;
    }
};

window.airPrefetchIds = function (ids) {
    // Warm stream URLs in the background so the first click plays instantly.
    const clean = (ids || []).filter((id) => typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id));
    if (!clean.length) return;
    fetch('/api/prefetch?ids=' + clean.slice(0, 3).join(',')).catch(() => {});
};

window.ytPrefetchAhead = function(count) {
    if (!Array.isArray(currentQueue) || currentIndex < 0) return;
    const ids = [];
    for (let i = currentIndex + 1; i < currentQueue.length && ids.length < (count || 2); i++) {
        const t = currentQueue[i];
        if (t && t.id && /^[A-Za-z0-9_-]{11}$/.test(t.id) && t.source !== 'saavn') ids.push(t.id);
    }
    if (!ids.length) return;
    fetch('/api/prefetch?ids=' + ids.join(',')).catch(() => {});
};

window.ytTrackStarted = function(track) {
    clearTimeout(window.__ytPlayTimer);
    if (!track || !track.id || !window.ytLoggedIn()) return;
    const duration = track.duration || 0;
    // Scrobble threshold matching the Android app: 30s, or 70% for short tracks
    const thresholdMs = (duration > 0 && duration * 1000 < 30000) ? Math.round(duration * 700) : 30000;
    window.__ytPendingPlay = {
        id: track.id,
        name: track.name || track.title || '',
        artist: ((track.artists && track.artists.primary) || []).map(a => a.name).filter(Boolean).join(', ') || track.subtitle || '',
        duration: duration,
        source: track.source || 'youtube'
    };
    // For non-YT tracks (Saavn) resolve the YT match early so recording/liking stays fast
    if (track.id && !/^[A-Za-z0-9_-]{11}$/.test(track.id) && window.__ytPendingPlay.name) {
        fetch('/api/yt/resolve?name=' + encodeURIComponent(window.__ytPendingPlay.name) + '&artist=' + encodeURIComponent(window.__ytPendingPlay.artist) + '&duration=' + (duration || 0)).catch(() => {});
    }
    const fire = () => {
        const pending = window.__ytPendingPlay;
        const current = window.getCurrentTrack ? window.getCurrentTrack() : null;
        if (!pending || !current || current.id !== pending.id) return;
        if (!window.ytLoggedIn()) return;
        if (!audio || audio.paused) {
            // currently paused — retry when playback starts
            const onResume = () => {
                audio.removeEventListener('play', onResume);
                if (window.__ytPendingPlay === pending) fire();
            };
            audio.addEventListener('play', onResume);
            return;
        }
        window.__ytRecordedPlay = Object.assign({}, pending, { played: Math.round(audio.currentTime || 0) });
        fetch('/api/yt/played', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.__ytRecordedPlay)
        }).catch(() => {});
    };
    window.__ytPlayTimer = setTimeout(fire, thresholdMs);
};

window.ytTrackEnded = function() {
    clearTimeout(window.__ytPlayTimer);
    window.__ytPendingPlay = null;
    const recorded = window.__ytRecordedPlay;
    window.__ytRecordedPlay = null;
    if (!recorded || !window.ytLoggedIn()) return;
    fetch('/api/yt/played', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: recorded.id,
            name: recorded.name,
            artist: recorded.artist,
            source: recorded.source,
            played: Math.round((audio && audio.currentTime) || recorded.played || recorded.duration || 0),
            duration: recorded.duration || Math.round((audio && audio.duration) || 0),
            final: true
        })
    }).catch(() => {});
};

window.ytHandleStreamError = function() {
    const code = audio.error ? audio.error.code : 0;
    if (code < 3) return false;
    const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
    if (!track || !track.id) return false;
    const state = (window.__ytStreamRetry && window.__ytStreamRetry.id === track.id)
        ? window.__ytStreamRetry
        : { id: track.id, triedRetry: false, triedSaavn: false, triedYt: false };
    window.__ytStreamRetry = state;
    const name = track.name || track.title || '';
    const artist = ((track.artists && track.artists.primary) || []).map(a => a.name).filter(Boolean).join(' ');
    // 1. Retry the same stream (with a cache-buster)
    if (!state.triedRetry) {
        state.triedRetry = true;
        const urls = track.downloadUrl || [];
        const entry = urls.length ? urls[urls.length - 1] : null;
        if (entry && entry.url) {
            if (window.showToast) window.showToast('Retrying stream...');
            audio.src = entry.url + (entry.url.indexOf('?') >= 0 ? '&' : '?') + 'proxy=1&r=' + Date.now();
            audio.play().catch(() => {});
            return true;
        }
    }
    // 2. YouTube failed -> play the JioSaavn match
    if (!state.triedSaavn && track.source !== 'saavn' && name) {
        state.triedSaavn = true;
        if (window.showToast) window.showToast('YouTube failed, trying JioSaavn...');
        fetch('/api/saavn/resolve?name=' + encodeURIComponent(name) + '&artist=' + encodeURIComponent(artist) + '&duration=' + (track.duration || 0))
            .then(r => r.json())
            .then(data => {
                const match = data && data.data;
                if (!match || !match.downloadUrl || !match.downloadUrl.length) throw new Error('no match');
                track.downloadUrl = match.downloadUrl;
                track.saavnId = match.id;
                audio.src = match.downloadUrl[0].url;
                audio.play().catch(() => {});
            })
            .catch(() => {
                if (window.showToast) window.showToast('Could not play this song');
            });
        return true;
    }
    // 3. JioSaavn failed -> play the YouTube match
    if (!state.triedYt && track.source === 'saavn' && name && window.ytLoggedIn && window.ytLoggedIn()) {
        state.triedYt = true;
        if (window.showToast) window.showToast('JioSaavn failed, trying YouTube...');
        fetch('/api/yt/resolve?name=' + encodeURIComponent(name) + '&artist=' + encodeURIComponent(artist) + '&duration=' + (track.duration || 0))
            .then(r => r.json())
            .then(data => {
                const match = data && data.data;
                if (!match || !match.downloadUrl || !match.downloadUrl.length) throw new Error('no match');
                track.downloadUrl = match.downloadUrl;
                track.ytVideoId = match.id;
                audio.src = match.downloadUrl[0].url;
                audio.play().catch(() => {});
            })
            .catch(() => {
                if (window.showToast) window.showToast('Could not play this song');
            });
        return true;
    }
    if (window.showToast) window.showToast('Could not play this song');
    return true;
};

window.ytCardHtml = function(item, type) {
    const image = getHighestQualityImage(item.image);
    const route = type === 'album' ? 'album' : 'playlist';
    const label = item.name || item.title || '';
    return `
        <div class="card playlist-card" onclick="window.location.hash='#${route}/${item.id}'" style="cursor: pointer;">
            <div class="card-img-wrapper">
                <img src="${image || 'https://via.placeholder.com/150'}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
            </div>
            <div class="card-info">
                <div class="card-title" title="${label.replace(/"/g, '&quot;')}">${label}</div>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${item.subtitle || (type === 'album' ? 'Album' : 'Playlist')}</p>
            </div>
        </div>
    `;
};

window.ytRenderLibrarySections = async function(extrasOnly) {
    const container = document.getElementById('yt-library-sections');
    if (!container) return;
    if (!window.ytAccount) await window.ytRefreshAccount();
    if (!window.ytLoggedIn()) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = window.airDotsHtml('Loading YouTube Music library\u2026');
    try {
        const [plRes, likedRes, subRes, albRes] = await Promise.all([
            fetch('/api/library/playlists').then(r => r.json()).catch(() => ({})),
            fetch('/api/library/liked').then(r => r.json()).catch(() => ({})),
            fetch('/api/library/subscriptions').then(r => r.json()).catch(() => ({})),
            fetch('/api/library/albums').then(r => r.json()).catch(() => ({}))
        ]);
        const playlists = (plRes && plRes.data) || [];
        const liked = (likedRes && likedRes.data) || [];
        const subs = (subRes && subRes.data) || [];
        const albums = (albRes && albRes.data) || [];
        window.__ytLikedTracks = liked.slice();
        if (!extrasOnly && playlists.length && window.ytMirrorPlaylists) window.ytMirrorPlaylists(playlists, true);

        let html = '';
        if (!extrasOnly) {
            const likedImage = liked.length ? getHighestQualityImage(liked[0].image) : '';
            html += `
            <div class="header-section" style="margin: 40px 0 18px 0;">
                <h1 style="font-size: 2rem; font-weight: 700; margin: 0; color: var(--text-primary);">From YouTube Music</h1>
                <p style="color: var(--text-secondary); margin: 6px 0 0 0;">${window.ytAccount.name || ''}${window.ytAccount.handle ? ' &middot; ' + window.ytAccount.handle : ''}</p>
            </div>
        `;
            const likedCard = `
            <div class="card playlist-card" onclick="window.location.hash='#likedsongs'" style="cursor: pointer;">
                <div class="card-img-wrapper">
                    ${likedImage
                        ? `<img src="${likedImage}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                        : `<div style="width: 100%; height: 100%; border-radius: 8px; background: linear-gradient(135deg, #ff2d55, #7a1fff); display: flex; align-items: center; justify-content: center;"><i class="fas fa-heart" style="font-size: 3rem; color: #fff;"></i></div>`}
                </div>
                <div class="card-info">
                    <div class="card-title">Liked Songs</div>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${liked.length} songs</p>
                </div>
            </div>
        `;
            html += '<div class="grid-container">' + likedCard + playlists.map(pl => window.ytCardHtml(pl, 'playlist')).join('') + '</div>';
        }
        if (albums.length) {
            html += `<h3 style="margin: 30px 0 14px 0; color: var(--text-primary);">Your albums</h3><div class="grid-container">` + albums.map(al => window.ytCardHtml(al, 'album')).join('') + '</div>';
        }
        if (subs.length) {
            html += `<h3 style="margin: 30px 0 14px 0; color: var(--text-primary);">Subscribed artists</h3><div style="display: flex; flex-wrap: wrap; gap: 24px;">` + subs.map(ar => `
                <div class="artist-card" onclick="window.location.hash='#artist/${ar.id}'" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; width: 150px;">
                    <div class="card-img-wrapper" style="width: 150px; height: 150px; border-radius: 50%; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin-bottom: 12px;">
                        <img src="${getHighestQualityImage(ar.image) || 'https://via.placeholder.com/150'}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="card-title" style="text-align: center; font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${ar.name || ''}</div>
                </div>
            `).join('') + '</div>';
        }
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '';
    }
};

window.renderLikedSongs = async function() {
    routerView.innerHTML = window.airDotsHtml('Liked Songs\u2026');
    const res = await fetch('/api/library/liked').then(r => r.json()).catch(() => ({}));
    const items = (res && res.data) || [];
    if (!(res && res.success)) {
        const errText = String((res && res.error) || '');
        const needSignIn = /not logged in|sign in/i.test(errText);
        routerView.innerHTML = `
            <div class="hero-header">
                <div class="hero-info">
                    <div class="hero-title">Liked Songs</div>
                    <div class="hero-meta">YouTube Music</div>
                </div>
            </div>
            ${needSignIn ? window.ytPremiumPromptHtml() : ''}
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 20px 60px 20px; text-align: center;">
                <i class="fas fa-${needSignIn ? 'fa-right-to-bracket' : 'fa-triangle-exclamation'}" style="font-size: 42px; color: var(--accent-text); margin-bottom: 12px;"></i>
                <div style="font-size: 15px; color: var(--text-secondary); max-width: 560px;">${needSignIn ? 'Sign in with your Google account to see your liked songs.' : (window.airEsc ? window.airEsc(errText) : errText) || 'Could not load Liked Songs.'}</div>
                ${needSignIn ? '' : `<button class="btn-primary" style="margin-top: 18px; padding: 10px 22px; border-radius: 8px; cursor: pointer;" onclick="window.renderLikedSongs()"><i class="fas fa-rotate-right"></i> Try again</button>`}
            </div>
        `;
        return;
    }
    items.forEach(item => { window.allTracks[item.id] = item; });
    window.__ytLikedTracks = items.slice();
    // Warm the first 3 liked-song streams so playback from this page starts instantly.
    window.airPrefetchIds(items.slice(0, 3).map((t) => t.id));
    let html = `
        <div class="back-btn" onclick="history.back()" title="Go Back"><i class="fas fa-arrow-left"></i></div>
        <div class="header-section" style="margin-bottom: 20px;">
            <h1 style="font-size: 2.5rem; font-weight: 700; margin: 0 0 10px 0; color: var(--text-primary);">Liked Songs</h1>
            <p style="color: var(--text-secondary); margin: 0 0 14px 0;">${items.length} songs from YouTube Music</p>
            ${items.length ? `<button class="btn-primary" style="padding: 10px 22px; border-radius: 8px; cursor: pointer;" onclick="window.ytPlayLiked(0)"><i class="fas fa-play"></i> Play all</button>` : ''}
        </div>
    `;
    html += window.ytRenderTracks(items);
    routerView.innerHTML = html;
};

window.focusMobileSearch = function() {
    // Reveal top search bar briefly and focus it
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
        searchBox.style.setProperty('display', 'block', 'important');
        searchBox.style.position = 'absolute';
        searchBox.style.top = '10px';
        searchBox.style.left = '10px';
        searchBox.style.width = 'calc(100% - 20px)';
        searchBox.style.zIndex = '10002';
        
        const input = document.getElementById('globalSearch');
        if (input) {
            input.focus();
            
            // Hide it again when blurred
            input.addEventListener('blur', function hideSearch() {
                setTimeout(() => {
                    searchBox.style.removeProperty('display');
                    searchBox.style.position = '';
                    searchBox.style.top = '';
                    searchBox.style.left = '';
                    searchBox.style.width = '';
                    searchBox.style.zIndex = '';
                    input.removeEventListener('blur', hideSearch);
                }, 200);
            });
        }
    }
};






window.renderExplore = async function() {
    globalLoading.style.display = 'flex';
    routerView.innerHTML = '';

    const exploreGenres = [
        "Pop", "Rock", "Hip-Hop", "Lo-Fi", "Electronic", "Indie",
        "R&B", "Bollywood", "Jazz", "Metal", "Acoustic", "Chill",
        "Anime", "Classical", "Synthwave", "Party", "Workout", "Sleep"
    ];

    try {
        const res = await fetch('/api/explore');
        const data = await res.json();

        if (!data.success || !data.data) {
            throw new Error(data.error || 'Failed to load explore data');
        }

        const exp = data.data;
        const newReleases = exp.new_releases || [];
        const trending = exp.trending || [];
        const moodCats = exp.mood_categories || {};
        const moods = moodCats['Moods & moments'] || [];
        const genres = moodCats['Genres'] || [];
        const topArtists = exp.top_artists || [];
        const topCharts = exp.top_charts || [];

        // Save trending songs to window.allTracks for instant playback
        if (!window.allTracks) window.allTracks = {};
        trending.forEach(s => {
            if (s && s.id) window.allTracks[s.id] = s;
        });
        window.exploreTrendingSongs = trending;

        let html = `
        <div class="explore-container">
            <!-- Header -->
            <div class="explore-hero">
                <div>
                    <div class="explore-hero-title">
                        <i class="fas fa-compass"></i> Explore
                    </div>
                    <div class="explore-hero-subtitle">
                        Discover new releases, trending charts, moods, and genres
                    </div>
                </div>
            </div>

            <!-- Category Filter Chips (AirBeats Android Material 3 Style) -->
            <div class="explore-chips-bar">
                ${exploreGenres.map(g => `
                    <a href="#search/${encodeURIComponent(g)}" class="explore-chip">
                        <i class="fas fa-hashtag" style="font-size: 11px; opacity: 0.6;"></i> ${g}
                    </a>
                `).join('')}
            </div>

            <!-- Quick Radar Cards -->
            <div class="explore-radar-grid">
                <div class="explore-radar-card radar-releases" onclick="window.location.hash='#new-releases'">
                    <div class="radar-icon-box"><i class="fas fa-compact-disc"></i></div>
                    <div class="radar-title">New Releases</div>
                    <div class="radar-desc">Fresh drops & latest albums</div>
                </div>
                <div class="explore-radar-card radar-charts" onclick="document.getElementById('sec-trending')?.scrollIntoView({behavior: 'smooth'})">
                    <div class="radar-icon-box"><i class="fas fa-fire-flame-curved"></i></div>
                    <div class="radar-title">Top Charts</div>
                    <div class="radar-desc">Trending songs & viral hits</div>
                </div>
                <div class="explore-radar-card radar-moods" onclick="document.getElementById('sec-moods')?.scrollIntoView({behavior: 'smooth'})">
                    <div class="radar-icon-box"><i class="fas fa-headphones"></i></div>
                    <div class="radar-title">Moods & Moments</div>
                    <div class="radar-desc">Vibes for any moment</div>
                </div>
                <div class="explore-radar-card radar-artists" onclick="document.getElementById('sec-artists')?.scrollIntoView({behavior: 'smooth'})">
                    <div class="radar-icon-box"><i class="fas fa-users-viewfinder"></i></div>
                    <div class="radar-title">Global Artists</div>
                    <div class="radar-desc">Most streamed performers</div>
                </div>
            </div>
        `;

        // Section: Top Charts & Trending Hits
        if (trending.length > 0) {
            html += `
            <div class="explore-section" id="sec-trending">
                <div class="explore-section-header">
                    <div class="explore-section-title">
                        <i class="fas fa-chart-line"></i> Trending Hits
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <button class="btn-primary" style="padding: 6px 14px; font-size: 12px; border-radius: 20px;" onclick="playList(window.exploreTrendingSongs)">
                            <i class="fas fa-play" style="margin-right: 6px;"></i> Play All
                        </button>
                    </div>
                </div>
                <div class="trending-songs-grid">
                    ${trending.slice(0, 10).map((song, idx) => {
                        const rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : ''));
                        const img = (song.image && song.image.length > 0) ? song.image[song.image.length - 1].url : 'https://via.placeholder.com/150';
                        const artists = (song.artists && song.artists.primary) ? song.artists.primary.map(a => a.name).join(', ') : (song.subtitle || 'Unknown Artist');
                        const isFav = favoriteSongs.some(f => f.id === song.id);
                        return `
                        <div class="trending-song-row" data-song-id="${song.id}" onclick="playSingleTrack('${song.id}')">
                            <div class="trending-rank ${rankClass}">#${idx + 1}</div>
                            <div class="trending-thumb-wrapper">
                                <img src="${img}" alt="${song.name || song.title}" loading="lazy">
                                <div class="trending-play-overlay">
                                    <i class="fas fa-play"></i>
                                </div>
                            </div>
                            <div class="trending-song-info">
                                <div class="trending-song-title">${song.name || song.title}</div>
                                <div class="trending-song-artist">${artists}</div>
                            </div>
                            <div class="trending-song-actions" onclick="event.stopPropagation()">
                                <i class="${isFav ? 'fas' : 'far'} fa-heart" 
                                   style="cursor: pointer; font-size: 14px; color: ${isFav ? 'var(--accent)' : 'var(--text-secondary)'};" 
                                   onclick="window.toggleHeart(event, '${song.id}')"
                                   title="${isFav ? 'Unlike' : 'Like'}"></i>
                                <i class="fas fa-plus" 
                                   style="cursor: pointer; font-size: 13px; color: var(--text-secondary);" 
                                   onclick="window.openPlaylistModal('${song.id}')"
                                   title="Add to Playlist"></i>
                                <i class="fas fa-ellipsis-v" 
                                   style="cursor: pointer; font-size: 13px; color: var(--text-secondary);" 
                                   onclick="window.openSongContextMenu(event, '${song.id}')"
                                   title="More Options"></i>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            `;
        }

        // Section: New Releases Shelf
        if (newReleases.length > 0) {
            html += `
            <div class="explore-section" id="sec-releases">
                <div class="explore-section-header">
                    <div class="explore-section-title">
                        <i class="fas fa-compact-disc"></i> New Releases
                    </div>
                    <a href="#new-releases" class="explore-section-action">See All <i class="fas fa-chevron-right" style="font-size: 11px;"></i></a>
                </div>
                <div class="explore-shelf">
                    ${newReleases.slice(0, 12).map(album => {
                        const img = (album.image && album.image.length > 0) ? album.image[album.image.length - 1].url : 'https://via.placeholder.com/150';
                        const artists = (album.artists && album.artists.primary) ? album.artists.primary.map(a => a.name).join(', ') : 'Unknown Artist';
                        return `
                        <div class="album-card" onclick="window.location.hash='#album/${album.id}'" style="cursor: pointer; width: 150px; flex-shrink: 0;">
                            <div class="card-img-wrapper" style="width: 150px; height: 150px; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.12); margin-bottom: 10px; position: relative;">
                                <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                                <span style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px; text-transform: uppercase;">
                                    ${album.type || 'Album'}
                                </span>
                            </div>
                            <div class="card-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${album.name || album.title}</div>
                            <div class="card-subtitle" style="font-size: 12px; color: var(--text-secondary); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${artists}</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            `;
        }

        // Section: Moods & Moments (Curated from Android AirBeats)
        if (moods.length > 0) {
            const moodIcons = {
                'Chill': 'fa-mug-hot',
                'Commute': 'fa-car-side',
                'Energy Boost': 'fa-bolt',
                'Feel Good': 'fa-face-smile',
                'Focus': 'fa-brain',
                'Party': 'fa-champagne-glasses',
                'Romance': 'fa-heart',
                'Sad': 'fa-cloud-rain',
                'Sleep': 'fa-moon',
                'Workout': 'fa-dumbbell',
                '1980s': 'fa-radio',
                '1990s': 'fa-cassette-tape',
                '2000s': 'fa-compact-disc'
            };
            html += `
            <div class="explore-section" id="sec-moods">
                <div class="explore-section-header">
                    <div class="explore-section-title">
                        <i class="fas fa-masks-theater"></i> Moods & Moments
                    </div>
                </div>
                <div class="mood-cards-grid">
                    ${moods.map(m => {
                        const icon = moodIcons[m.title] || 'fa-music';
                        return `
                        <div class="mood-card" onclick="window.openMoodCategory('${encodeURIComponent(m.params)}', '${encodeURIComponent(m.title)}')">
                            <i class="fas ${icon}" style="font-size: 18px; color: var(--accent-text); margin-right: 12px; z-index: 1;"></i>
                            <div class="mood-card-title">${m.title}</div>
                            <i class="fas ${icon} mood-card-decor"></i>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            `;
        }

        // Section: Top Charts Playlists
        if (topCharts.length > 0) {
            html += `
            <div class="explore-section" id="sec-chart-playlists">
                <div class="explore-section-header">
                    <div class="explore-section-title">
                        <i class="fas fa-trophy"></i> Chart Playlists
                    </div>
                </div>
                <div class="explore-shelf">
                    ${topCharts.map(pl => `
                        <div class="album-card" onclick="window.location.hash='#playlist/${pl.id}'" style="cursor: pointer; width: 160px; flex-shrink: 0;">
                            <div class="card-img-wrapper" style="width: 160px; height: 160px; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.12); margin-bottom: 10px;">
                                <img src="${pl.image || 'https://via.placeholder.com/150'}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                            </div>
                            <div class="card-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${pl.title}</div>
                            <div class="card-subtitle" style="font-size: 12px; color: var(--text-secondary); margin-top: 3px;">Official YouTube Music Chart</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            `;
        }

        // Section: Browse by Genre
        if (genres.length > 0) {
            html += `
            <div class="explore-section" id="sec-genres">
                <div class="explore-section-header">
                    <div class="explore-section-title">
                        <i class="fas fa-shapes"></i> Browse by Genre
                    </div>
                </div>
                <div class="mood-cards-grid">
                    ${genres.map(g => `
                        <div class="mood-card" onclick="window.openMoodCategory('${encodeURIComponent(g.params)}', '${encodeURIComponent(g.title)}')">
                            <i class="fas fa-guitar" style="font-size: 18px; color: var(--accent-text); margin-right: 12px; z-index: 1;"></i>
                            <div class="mood-card-title">${g.title}</div>
                            <i class="fas fa-guitar mood-card-decor"></i>
                        </div>
                    `).join('')}
                </div>
            </div>
            `;
        }

        // Section: Top Global Artists
        if (topArtists.length > 0) {
            html += `
            <div class="explore-section" id="sec-artists">
                <div class="explore-section-header">
                    <div class="explore-section-title">
                        <i class="fas fa-microphone-lines"></i> Top Artists
                    </div>
                </div>
                <div class="explore-shelf">
                    ${topArtists.map(artist => {
                        const img = (artist.image && artist.image.length > 0) ? artist.image[artist.image.length - 1].url : 'https://via.placeholder.com/150';
                        return `
                        <div class="artist-card" onclick="window.location.hash='#artist/${artist.id}'" style="cursor: pointer; width: 130px; flex-shrink: 0; text-align: center;">
                            <div class="card-img-wrapper" style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; margin: 0 auto 10px auto; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
                                <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                            </div>
                            <div class="card-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${artist.name}</div>
                            <div class="card-subtitle" style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">${artist.subscribers ? artist.subscribers + ' subs' : 'Artist'}</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            `;
        }

        html += `</div>`; // Close explore-container
        routerView.innerHTML = html;
    } catch (e) {
        console.error('Explore error:', e);
        routerView.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; text-align: center; color: var(--text-secondary);">
            <i class="fas fa-compass" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i>
            <h2 style="color: var(--text-primary); margin-bottom: 10px;">Failed to load Explore</h2>
            <p>${e.message || 'An error occurred while fetching explore content.'}</p>
            <button class="btn-primary" onclick="renderExplore()" style="margin-top: 20px;">Retry</button>
        </div>`;
    } finally {
        globalLoading.style.display = 'none';
    }
};

window.openMoodCategory = function(encodedParams, encodedTitle) {
    const params = decodeURIComponent(encodedParams);
    const title = decodeURIComponent(encodedTitle);
    window.location.hash = `#mood/${encodeURIComponent(params)}?title=${encodeURIComponent(title)}`;
};

window.renderMoodCategory = async function(id) {
    globalLoading.style.display = 'flex';
    routerView.innerHTML = '';

    let params = id || '';
    let title = 'Curated Mood';
    if (params.includes('?')) {
        const parts = params.split('?');
        params = decodeURIComponent(parts[0]);
        const urlParams = new URLSearchParams(parts[1]);
        if (urlParams.get('title')) title = decodeURIComponent(urlParams.get('title'));
    } else {
        params = decodeURIComponent(params);
    }

    try {
        const res = await fetch(`/api/mood_playlists?params=${encodeURIComponent(params)}&title=${encodeURIComponent(title)}`);
        const data = await res.json();

        if (!data.success || !data.data) {
            throw new Error(data.error || 'Failed to fetch playlists');
        }

        const playlists = data.data;

        let html = `
        <div class="explore-container">
            <div class="back-btn" onclick="history.back()" title="Go Back"><i class="fas fa-arrow-left"></i></div>
            <div class="hero-header" style="margin-bottom: 30px;">
                <div class="hero-info">
                    <div class="hero-title">${title} Playlists</div>
                    <div class="hero-meta">Curated YouTube Music playlists & stations for ${title}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 20px; margin-bottom: 40px;">
                ${playlists.map(pl => {
                    const img = (pl.image && pl.image.length > 0) ? pl.image[pl.image.length - 1].url : 'https://via.placeholder.com/150';
                    return `
                    <div class="album-card" onclick="window.location.hash='#playlist/${pl.id}'" style="cursor: pointer; width: 100%;">
                        <div class="card-img-wrapper" style="width: 100%; aspect-ratio: 1/1; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.12); margin-bottom: 10px; position: relative;">
                            <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                            <div class="trending-play-overlay">
                                <i class="fas fa-play"></i>
                            </div>
                        </div>
                        <div class="card-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${pl.title || pl.name}</div>
                        <div class="card-subtitle" style="font-size: 12px; color: var(--text-secondary); margin-top: 3px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${pl.description || 'Curated Playlist'}</div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;
        routerView.innerHTML = html;
    } catch (e) {
        console.error('Mood category error:', e);
        routerView.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; text-align: center; color: var(--text-secondary);">
            <div class="back-btn" onclick="history.back()" title="Go Back" style="margin-bottom: 20px;"><i class="fas fa-arrow-left"></i></div>
            <h2 style="color: var(--text-primary); margin-bottom: 10px;">Failed to load ${title} playlists</h2>
            <p>${e.message || 'An error occurred.'}</p>
            <button class="btn-primary" onclick="renderMoodCategory('${id}')" style="margin-top: 20px;">Retry</button>
        </div>`;
    } finally {
        globalLoading.style.display = 'none';
    }
};

window.renderNewReleases = async function() {
    let html = `
    <div class="back-btn" onclick="history.back()" title="Go Back"><i class="fas fa-arrow-left"></i></div>
    <div class="hero-header">
        <div class="hero-info">
            <div class="hero-title">New Release Albums</div>
            <div class="hero-meta">Latest releases handpicked for you</div>
        </div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 40px;">`;
    
    try {
        const res = await fetch("/api/new_releases");
        const data = await res.json();
        
        if (data.success && data.data.length > 0) {
            data.data.forEach(album => {
                const img = (album.image && album.image.length > 0) ? album.image[album.image.length-1].url : "https://via.placeholder.com/150";
                const artists = (album.artists && album.artists.primary) ? album.artists.primary.map(a=>a.name).join(", ") : "Unknown Artist";
                const link = album.type === "single" ? `#album/${album.id}` : `#album/${album.id}`;
                html += `
                <div class="album-card" onclick="window.location.hash='${link}'" style="cursor: pointer; width: 140px;">
                    <div class="card-img-wrapper" style="width: 140px; height: 140px; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin-bottom: 12px;">
                        <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="card-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${album.name}</div>
                    <div class="card-subtitle" style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${artists}</div>
                </div>`;
            });
        } else {
            html += `<div style="text-align:center; padding: 40px; color:var(--text-gray); grid-column: 1 / -1;">No new releases found at the moment.</div>`;
        }
    } catch (e) {
        html += `<div style="text-align:center; padding: 40px; color:var(--text-gray); grid-column: 1 / -1;">Error loading new releases.</div>`;
    }
    
    html += `</div>`;
    routerView.innerHTML = html;
    globalLoading.style.display = "none";
};








// Pull-to-Refresh Logic
setTimeout(() => {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let ptrIndicator = document.getElementById('ptr-indicator');
    let scrollContainer = document.querySelector('.scroll-container');
    let isRefreshing = false;

    if (!scrollContainer || !ptrIndicator) return;

    const startDrag = (y) => {
        if (scrollContainer.scrollTop === 0 && !isRefreshing) {
            startY = y;
            isDragging = true;
        }
    };

    const moveDrag = (y) => {
        if (!isDragging) return;
        currentY = y;
        const diff = currentY - startY;
        if (diff > 0 && scrollContainer.scrollTop === 0) {
            ptrIndicator.style.transform = 'translateY(' + Math.min(diff - 60, 0) + 'px)';
            ptrIndicator.style.opacity = Math.min(diff / 60, 1);
            if (diff > 60) ptrIndicator.classList.add('ptr-refreshing');
            else ptrIndicator.classList.remove('ptr-refreshing');
        }
    };

    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        const diff = currentY - startY;
        if (diff > 60 && scrollContainer.scrollTop === 0) {
            isRefreshing = true;
            ptrIndicator.style.transform = 'translateY(0)';
            ptrIndicator.classList.add('ptr-refreshing');
            router(true).then(() => {
                isRefreshing = false;
                ptrIndicator.style.transform = 'translateY(-100%)';
                ptrIndicator.style.opacity = '0';
                setTimeout(() => ptrIndicator.classList.remove('ptr-refreshing'), 300);
            });
        } else {
            ptrIndicator.style.transform = 'translateY(-100%)';
            ptrIndicator.style.opacity = '0';
            ptrIndicator.classList.remove('ptr-refreshing');
        }
    };

    scrollContainer.addEventListener('touchstart', e => startDrag(e.touches[0].clientY), {passive: true});
    scrollContainer.addEventListener('touchmove', e => moveDrag(e.touches[0].clientY), {passive: true});
    scrollContainer.addEventListener('touchend', endDrag);

    scrollContainer.addEventListener('mousedown', e => startDrag(e.clientY));
    window.addEventListener('mousemove', e => moveDrag(e.clientY));
    window.addEventListener('mouseup', endDrag);
}, 1000);


window.toggleSaveYouTubePlaylist = function(id, btn, name, image) {
    let playlists = getPlaylists();
    let existingIndex = playlists.findIndex(p => p.id === id);
    let icon = btn.querySelector('i');
    
    if (existingIndex !== -1) {
        playlists.splice(existingIndex, 1);
        icon.className = 'fas fa-plus';
        icon.style.color = '';
    } else {
        const trackIds = window.currentRenderedTracks.map(t => t.id);
        const newPlaylist = {
            id: id,
            name: name,
            image: image,
            songs: trackIds
        };
        playlists.push(newPlaylist);
        icon.className = 'fas fa-check';
        icon.style.color = 'var(--accent)';
    }
    savePlaylists(playlists);
};

async function renderPlaylist(id) {
    id = id.replace(/ /g, '-');
    routerView.innerHTML = `<div class="loader"></div>`;
    try {
        const res = await fetch(`/api/playlists?id=${id}`);
        const data = await res.json();
        if (!data.success || !data.data) {
            routerView.innerHTML = `<div style="text-align: center; padding: 50px; color: var(--text-secondary);">Failed to load playlist.</div>`;
            return;
        }
        const playlist = data.data;
        window.currentRenderedTracks = playlist.songs;
        // Warm the first 3 playlist streams.
        window.airPrefetchIds((playlist.songs || []).slice(0, 3).map((s) => s.id));
        
        let playlists = getPlaylists();
        let isSaved = playlists.some(p => p.id === playlist.id);
        let iconClass = isSaved ? 'fas fa-check' : 'fas fa-plus';
        let colorStyle = isSaved ? 'color: var(--accent-text);' : '';
        
        let html = `
        <div class="back-btn" onclick="history.back()" title="Go Back"><i class="fas fa-arrow-left"></i></div>
        <div class="hero-header">
            <img src="${getHighestQualityImage(playlist.image)}" class="hero-img">
            <div class="hero-info">
                <div class="hero-type">PLAYLIST</div>
                <div class="hero-title" style="white-space: normal;">${playlist.name}</div>
                <div class="hero-meta">${playlist.author} &bull; ${playlist.songCount || 0} songs</div>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="playList(window.currentRenderedTracks)">PLAY</button>
                    <button class="icon-btn icon-btn-surface" onclick="window.toggleSaveYouTubePlaylist('${playlist.id}', this, '${playlist.name.replace(/'/g, "\\\\'")}', '${getHighestQualityImage(playlist.image)}')">
                        <i class="${iconClass}" style="${colorStyle}"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="tracklist-container">
            <table class="tracklist">
                <thead>
                    <tr>
                        <th style="width: 40px; text-align: center;">#</th>
                        <th>Title</th>
                        <th class="hide-mobile">Album</th>
                        <th style="width: 60px; text-align: right;"><i class="far fa-clock"></i></th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        playlist.songs.forEach((song, i) => {
            html += `
                <tr class="track-row" ondblclick="playList(window.currentRenderedTracks, ${i})">
                    <td style="text-align: center; position: relative;">
                        <span class="track-number">${i + 1}</span>
                        <i class="fas fa-play track-play-icon" onclick="playList(window.currentRenderedTracks, ${i})"></i>
                    </td>
                    <td>
                        <div class="track-info-cell">
                            <img src="${getHighestQualityImage(song.image)}" class="track-thumb">
                            <div>
                                <div class="track-title">${song.name}</div>
                                <div class="track-artist">${song.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="hide-mobile">${song.album?.name || ''}</td>
                    <td style="text-align: right;">
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 15px;">
                            <span class="track-duration">${formatTime(song.duration)}</span>
                            ${window.getPlaylistIconHtml(song.id)}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        </div>
        `;
        
        routerView.innerHTML = html;
        
    } catch (e) {
        console.error(e);
        routerView.innerHTML = `<div style="text-align: center; padding: 50px; color: var(--text-secondary);">Error loading playlist.</div>`;
    }
}

// Dynamic Island IPC Listener
if (window.electronAPI && window.electronAPI.onIslandAction) {
    window.electronAPI.onIslandAction((action) => {
        if (action === 'play-pause') {
            document.getElementById('playPauseBtn')?.click();
        } else if (action === 'next') {
            document.getElementById('nextBtn')?.click();
        } else if (action === 'prev') {
            document.getElementById('prevBtn')?.click();
        } else if (action === 'like') {
            const likeBtn = document.getElementById('likeBtn') || document.querySelector('.np-title-row .fa-heart');
            if (likeBtn) likeBtn.click();
        } else if (action === 'repeat') {
            const btn = document.getElementById('repeatBtn');
            if (btn) btn.click();
        } else if (typeof action === 'object' && action.type === 'seek') {
            if (audio.duration && isFinite(action.pct)) {
                const target = action.pct * audio.duration;
                if (isFinite(target)) audio.currentTime = target;
            }
        }
    });
}

// --- Update Checker ---
async function renderSettingsUpdates() {
    let currentVersion = 'Unknown';
    if (window.electronAPI && window.electronAPI.getAppVersion) {
        currentVersion = await window.electronAPI.getAppVersion();
    }
    routerView.innerHTML = `
    <div style="padding: 0 0 100px 0; display: flex; flex-direction: column; align-items: center; max-width: 800px; margin: 0 auto; width: 100%; font-family: sans-serif;">
        <div style="height: 40px;"></div>
        <div style="font-size: 64px; margin-bottom: 20px; color: var(--accent-text);">
            <i class="fas fa-sync-alt"></i>
        </div>
        <h1 style="font-size: 32px; font-weight: 700; color: var(--text-primary); margin: 0 0 10px 0;">Updates</h1>
        <div style="font-size: 16px; color: var(--text-secondary); margin-bottom: 30px;">
            Current Version: <span style="color: var(--accent-text); font-weight: 600;">v${currentVersion}</span>
        </div>
        
        <button id="btn-check-updates-screen" onclick="checkForUpdates(true, true)" style="background: var(--accent); color: #000; border: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-search"></i> Check for Updates
        </button>
        
        <div id="updates-status-msg" style="margin-top: 20px; font-size: 14px; color: var(--text-secondary); height: 20px;"></div>
    </div>`;
}

async function checkForUpdates(manual = false, isScreen = false) {
    if (!window.electronAPI || !window.electronAPI.getAppVersion) return;
    try {
        const currentVersion = await window.electronAPI.getAppVersion();
        const displayElem = document.getElementById('app-version-display');
        if (displayElem) displayElem.innerText = `Current Version: v${currentVersion}`;
        
        if (manual) {
            if (isScreen) {
                const btn = document.getElementById('btn-check-updates-screen');
                if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
                const msg = document.getElementById('updates-status-msg');
                if (msg) msg.innerText = '';
            } else {
                const btn = document.getElementById('btn-check-updates');
                if (btn) btn.innerText = 'Checking...';
            }
        }
        
        const response = await fetch('https://api.github.com/repos/d0x-dev/Airbeats-Desktop/releases/latest');
        if (!response.ok) throw new Error('Failed to fetch latest release');
        
        const data = await response.json();
        const latestTag = data.tag_name.replace('v', '');
        
        const cmp = latestTag.localeCompare(currentVersion, undefined, { numeric: true, sensitivity: 'base' });
        
        if (manual) {
            if (isScreen) {
                const btn = document.getElementById('btn-check-updates-screen');
                if (btn) btn.innerHTML = '<i class="fas fa-search"></i> Check for Updates';
            } else {
                const btn = document.getElementById('btn-check-updates');
                if (btn) btn.innerText = 'Check for Updates';
            }
        }
        
        if (cmp > 0) {
            const modal = document.getElementById('update-modal');
            const versionSpan = document.getElementById('update-version-name');
            const downloadBtn = document.getElementById('btn-update-download');
            const cancelBtn = document.getElementById('btn-update-cancel');
            
            if (modal && versionSpan && downloadBtn && cancelBtn) {
                versionSpan.innerText = data.tag_name;
                modal.style.display = 'flex';
                
                cancelBtn.onclick = () => {
                    modal.style.display = 'none';
                };
                
                downloadBtn.onclick = () => {
                      let targetAsset;
                      const ua = navigator.userAgent.toLowerCase();
                      if (ua.includes('win')) {
                          targetAsset = data.assets.find(a => a.name.toLowerCase().includes('setup.exe'));
                      } else if (ua.includes('mac')) {
                          targetAsset = data.assets.find(a => a.name.toLowerCase().endsWith('.dmg'));
                      } else if (ua.includes('linux')) {
                          targetAsset = data.assets.find(a => a.name.toLowerCase().endsWith('.appimage'));
                      }
                      
                      if (targetAsset) {
                          window.electronAPI.openExternal(targetAsset.browser_download_url);
                      } else {
                          window.electronAPI.openExternal(data.html_url);
                      }
                      modal.style.display = 'none';
                  };
            }
        } else {
            if (manual) {
                if (isScreen) {
                    const msg = document.getElementById('updates-status-msg');
                    if (msg) msg.innerHTML = `<span style="color: #2ecc71;"><i class="fas fa-check-circle"></i> You are on the latest version (v${currentVersion}).</span>`;
                } else {
                    alert(`You are on the latest version (v${currentVersion}).`);
                }
            }
        }
    } catch (e) {
        console.error('Update check failed:', e);
        if (manual) {
            if (isScreen) {
                const msg = document.getElementById('updates-status-msg');
                if (msg) msg.innerHTML = `<span style="color: var(--danger, #ff4444);"><i class="fas fa-exclamation-circle"></i> Failed to check for updates. Please check your connection.</span>`;
                const btn = document.getElementById('btn-check-updates-screen');
                if (btn) btn.innerHTML = '<i class="fas fa-search"></i> Check for Updates';
            } else {
                alert('Failed to check for updates. Please check your connection.');
                const btn = document.getElementById('btn-check-updates');
                if (btn) btn.innerText = 'Check for Updates';
            }
        }
    }
}

window.cachedSongsList = [];
window.fetchCachedSongsList = async function() {
    try {
        const res = await fetch('/api/cache/list');
        const data = await res.json();
        if (data && data.success) {
            window.cachedSongsList = data.data.map(s => s.id);
        }
    } catch (e) {
        console.error('Failed to fetch cache list', e);
    }
};

async function renderCachedSongs() {
    routerView.innerHTML = '<div class="loader"></div>';
    try {
        const res = await fetch('/api/cache/list');
        const data = await res.json();
        
        let html = `
            <div class="content-header" style="background: linear-gradient(to bottom, rgba(100,100,100,0.5), transparent); padding: 40px 30px;">
                <div class="header-content" style="display: flex; gap: 24px; align-items: flex-end;">
                    <div style="width: 180px; height: 180px; background: #333; display: flex; align-items: center; justify-content: center; font-size: 64px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
                        <i class="fas fa-download"></i>
                    </div>
                    <div>
                        <h5 style="margin: 0; font-weight: 500; font-size: 14px; text-transform: uppercase;">Playlist</h5>
                        <h1 style="margin: 8px 0; font-size: 64px; font-weight: 900; letter-spacing: -1px;">Cached Songs</h1>
                        <p style="margin: 0; opacity: 0.7;">Your downloaded music for offline listening.</p>
                    </div>
                </div>
            </div>
            
            <div style="padding: 24px 30px;">
                <button class="btn-primary" onclick="playAllCached()" style="width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                    <i class="fas fa-play" style="font-size: 20px; margin-left: 4px;"></i>
                </button>
        `;
        
        if (data.success && data.data && data.data.length > 0) {
            window.currentRenderedTracks = data.data;
            window.cachedSongsData = data.data; // Store for playAll
            html += `<table class="tracklist">`;
            data.data.forEach((song, i) => {
                html += `
                ${(window.allTracks[song.id] = song) ? '' : ''}<tr class="track-row">
                    <td class="track-num">
                        <span class="track-num-txt">${i+1}</span>
                        <i class="fas fa-play track-play-icon" onclick="playList(window.currentRenderedTracks, ${i})"></i>
                    </td>
                    <td>
                        <div class="track-info-cell">
                            <img src="${getHighestQualityImage(song.image)}" class="track-thumb">
                            <div>
                                <div class="track-title">${song.name}</div>
                                <div class="track-artist">${getClickableArtistsHtml(song)}</div>
                            </div>
                        </div>
                    </td>
                    <td class="track-duration">${formatTime(song.duration)}</td>
                    <td style="width: 100px; text-align: center;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;" onclick="event.stopPropagation()">
                            <i class="${favoriteSongs.some(s => s.id === song.id) ? 'fas' : 'far'} fa-heart" 
                               onclick="window.toggleHeart(event, '${song.id}')" style="cursor:pointer; font-size:15px; color:${favoriteSongs.some(s => s.id === song.id) ? 'var(--accent)' : 'var(--text-secondary)'};" title="Like"></i>
                            <i class="fas fa-plus" style="cursor:pointer; font-size:14px; color:var(--text-secondary);" onclick="window.openPlaylistModal('${song.id}')" title="Add to Playlist"></i>
                            <i class="fas fa-ellipsis-v" style="cursor:pointer; font-size:14px; color:var(--text-secondary);" onclick="window.openSongContextMenu(event, '${song.id}')" title="More Options"></i>
                        </div>
                    </td>
                </tr>`;
            });
            html += `</table>`;
        } else {
            html += `<div style="text-align:center; padding:50px; color:var(--text-secondary);">
                <i class="fas fa-box-open" style="font-size:48px; margin-bottom:16px; opacity:0.5;"></i>
                <h2>No Cached Songs</h2>
                <p>Songs you listen to will automatically be saved here for offline playback.</p>
            </div>`;
        }
        
        html += `</div>`;
        
        routerView.innerHTML = html;
    } catch(e) {
        routerView.innerHTML = `<h2>Error Loading Cached Songs</h2><p>${e.message}</p>`;
    }
}

window.playAllCached = function() {
    if (window.cachedSongsData && window.cachedSongsData.length > 0) {
        currentQueue = [...window.cachedSongsData];
        currentIndex = 0;
        loadCurrentTrack();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.fetchCachedSongsList();
    // Check automatically after a short delay so it doesn't block startup
    setTimeout(() => checkForUpdates(false), 3000);
    
    const checkBtn = document.getElementById('btn-check-updates');
    if (checkBtn) {
        checkBtn.addEventListener('click', () => checkForUpdates(true));
    }
    
    // Initial version display
    if (window.electronAPI && window.electronAPI.getAppVersion) {
        window.electronAPI.getAppVersion().then(v => {
            const displayElem = document.getElementById('app-version-display');
            if (displayElem) displayElem.innerText = `Current Version: v${v}`;
        });
    }
});



// ==========================================
// CONTEXT MENU LOGIC
// ==========================================
const contextMenuHtml = `
<div id="custom-context-menu" class="custom-context-menu" style="display: none;">
    <div class="context-menu-item cm-song-only" id="cm-add-playlist">
        <i class="fas fa-folder-plus"></i> Add to playlist
    </div>
    <div class="context-menu-item cm-song-only cm-not-queue" id="cm-play-next">
        <i class="fas fa-step-forward"></i> Play next
    </div>
    <div class="context-menu-item cm-song-only cm-not-queue" id="cm-add-queue">
        <i class="fas fa-list"></i> Add to queue
    </div>
    
    <div class="context-menu-item cm-queue-only" id="cm-remove-queue" style="display: none;">
        <i class="fas fa-trash-alt"></i> Remove from queue
    </div>
    <div class="context-menu-item cm-queue-only" id="cm-play-now" style="display: none;">
        <i class="fas fa-play"></i> Play now
    </div>

    <div class="context-menu-item cm-song-only" id="cm-download">
        <i class="fas fa-download"></i> Download
    </div>
    
    <div class="context-menu-item cm-artist-only" id="cm-subscribe" style="display: none;">
        <i class="fas fa-user-plus"></i> Subscribe
    </div>

    <div class="context-divider"></div>
    <div class="context-menu-item" id="cm-copy-link">
        <i class="fas fa-link"></i> Copy link
    </div>
    <div class="context-menu-item" id="cm-share">
        <i class="fas fa-share-alt"></i> Share
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', contextMenuHtml);

const ctxMenu = document.getElementById('custom-context-menu');
let ctxActiveData = null; // { type: 'song'|'artist'|'queue', id: ..., title: ..., index: ... }

window.openSongContextMenu = function(e, songId) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    let song = window.allTracks ? window.allTracks[songId] : null;
    if (!song && window.currentRenderedTracks) song = window.currentRenderedTracks.find(s => s && s.id === songId);
    if (!song && window.currentQueue) song = window.currentQueue.find(s => s && s.id === songId);
    if (!song && window.currentQuickPicksQueue) song = window.currentQuickPicksQueue.find(s => s && s.id === songId);
    if (!song && window.favoriteSongs) song = window.favoriteSongs.find(s => s && s.id === songId);
    if (!song) {
        let history = JSON.parse(localStorage.getItem('playHistory') || '[]');
        song = history.find(s => s && s.id === songId);
    }
    if (!song) {
        const cardEl = document.querySelector(`[data-song-id="${songId}"]`);
        const title = cardEl ? (cardEl.querySelector('.ff-title, .track-title, .qp-hero-title')?.innerText || 'Song') : 'Song';
        const artist = cardEl ? (cardEl.querySelector('.ff-artist, .track-artist, .qp-hero-artist')?.innerText || 'Artist') : 'Artist';
        song = { id: songId, name: title, title: title, subtitle: artist };
    }
    window.allTracks[songId] = song;
    
    ctxActiveData = { type: 'song', id: songId, title: song.name || song.title || 'Song', index: null };
    
    document.querySelectorAll('.cm-song-only').forEach(el => el.style.display = 'flex');
    document.querySelectorAll('.cm-artist-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.cm-queue-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.cm-not-queue').forEach(el => el.style.display = 'flex');

    const playlists = typeof getPlaylists === 'function' ? getPlaylists() : [];
    const isAdded = playlists.some(pl => pl.songs.includes(songId));
    const plItem = document.getElementById('cm-add-playlist');
    if (plItem) {
        plItem.innerHTML = isAdded ? '<i class="fas fa-folder-minus"></i> Remove from playlist' : '<i class="fas fa-folder-plus"></i> Add to playlist';
    }

    ctxMenu.style.display = 'flex';
    
    let x = e ? (e.pageX || e.clientX) : window.innerWidth / 2;
    let y = e ? (e.pageY || e.clientY) : window.innerHeight / 2;
    
    const menuWidth = ctxMenu.offsetWidth || 180;
    const menuHeight = ctxMenu.offsetHeight || 220;
    
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 14;
    if (y + menuHeight > window.innerHeight) y = Math.max(10, window.innerHeight - menuHeight - 14);
    if (x < 10) x = 10;
    if (y < 10) y = 10;
    
    ctxMenu.style.left = x + 'px';
    ctxMenu.style.top = y + 'px';
};

document.addEventListener('contextmenu', function(e) {
    const target = e.target.closest('.track-row, .card, .album-card, .recent-row, .np-info, .artist-card, .clickable-artist, .cm-queue-item, .ff-card-item, .music-shelf-card, .qp-hero-card, .trending-song-row, .stats-chart-row, .stats-item-card, .insight-mini-card');
    if (!target) {
        ctxMenu.style.display = 'none';
        return;
    }
    
    let type = null;
    let objId = null;
    let objTitle = null;
    let objIndex = null;

    if (target.getAttribute('data-song-id')) {
        type = 'song';
        objId = target.getAttribute('data-song-id');
    } else if (target.classList.contains('cm-queue-item')) {
        type = 'queue';
        objId = target.getAttribute('data-id');
        objIndex = parseInt(target.getAttribute('data-index'), 10);
    } else if (target.classList.contains('np-info')) {
        const tr = window.getCurrentTrack();
        if (tr) {
            type = 'song';
            objId = tr.id;
        }
    } else {
        const onclickStr = target.getAttribute('onclick') || '';
        if (onclickStr.includes('playSingleTrack') || onclickStr.includes('playQuickPickTrack') || onclickStr.includes('playShelfItem')) {
            const match = onclickStr.match(/'([^']+)'/);
            if (match) {
                type = 'song';
                objId = match[1];
            }
        } else if (onclickStr.includes('#artist/')) {
            const match = onclickStr.match(/#artist\/([^']+)'/);
            if (match) {
                type = 'artist';
                objId = match[1];
                objTitle = target.innerText || target.textContent || 'Artist';
            }
        }
    }

    if (!objId || !type) {
        ctxMenu.style.display = 'none';
        return;
    }
    
    if (type === 'song' || type === 'queue') {
        let song = window.allTracks ? window.allTracks[objId] : null;
        if (!song && window.currentRenderedTracks) song = window.currentRenderedTracks.find(s => s && s.id === objId);
        if (!song && window.currentQueue) song = window.currentQueue.find(s => s && s.id === objId);
        if (!song && window.favoriteSongs) song = window.favoriteSongs.find(s => s && s.id === objId);
        if (!song) {
            const hist = JSON.parse(localStorage.getItem('playHistory') || '[]');
            song = hist.find(s => s && s.id === objId);
        }
        if (!song) {
            objTitle = target.querySelector('.ff-title, .track-title, .msc-title, .qp-hero-title')?.innerText || 'Song';
            song = { id: objId, name: objTitle, title: objTitle };
        } else {
            objTitle = song.title || song.name || 'Song';
        }
        window.allTracks[objId] = song;
    }
    
    e.preventDefault();
    ctxActiveData = { type, id: objId, title: objTitle, index: objIndex };
    
    // Toggle visibility of options
    const isSong = type === 'song' || type === 'queue';
    document.querySelectorAll('.cm-song-only').forEach(el => el.style.display = isSong ? 'flex' : 'none');
    document.querySelectorAll('.cm-artist-only').forEach(el => el.style.display = type === 'artist' ? 'flex' : 'none');
    
    document.querySelectorAll('.cm-queue-only').forEach(el => el.style.display = type === 'queue' ? 'flex' : 'none');
    document.querySelectorAll('.cm-not-queue').forEach(el => {
        if (el.classList.contains('cm-song-only') && type === 'queue') {
            el.style.display = 'none';
        } else {
            el.style.display = 'flex';
        }
    });

    if (isSong) {
        const playlists = typeof getPlaylists === 'function' ? getPlaylists() : [];
        const isAdded = playlists.some(pl => pl.songs.includes(objId));
        const plItem = document.getElementById('cm-add-playlist');
        if (plItem) plItem.innerHTML = isAdded ? '<i class="fas fa-folder-minus"></i> Remove from playlist' : '<i class="fas fa-folder-plus"></i> Add to playlist';
    } else if (type === 'artist') {
        const subbed = JSON.parse(localStorage.getItem('subscribedArtists') || '[]');
        const isSubbed = subbed.some(a => a.id === objId);
        const subItem = document.getElementById('cm-subscribe');
        if (subItem) subItem.innerHTML = isSubbed ? '<i class="fas fa-user-minus"></i> Unsubscribe' : '<i class="fas fa-user-plus"></i> Subscribe';
    }

    ctxMenu.style.display = 'flex';
    
    let x = e.pageX;
    let y = e.pageY;
    if (x + ctxMenu.offsetWidth > window.innerWidth) x = window.innerWidth - ctxMenu.offsetWidth - 10;
    if (y + ctxMenu.offsetHeight > window.innerHeight) y = window.innerHeight - ctxMenu.offsetHeight - 10;
    
    ctxMenu.style.left = x + 'px';
    ctxMenu.style.top = y + 'px';
});

document.addEventListener('click', function(e) {
    if (!e.target.closest('#custom-context-menu')) {
        ctxMenu.style.display = 'none';
    }
});

document.getElementById('cm-add-playlist').addEventListener('click', (e) => {
    ctxMenu.style.display = 'none';
    if (ctxActiveData && (ctxActiveData.type === 'song' || ctxActiveData.type === 'queue')) window.toggleSongInPlaylists(e, ctxActiveData.id);
});

document.getElementById('cm-play-next').addEventListener('click', () => {
    ctxMenu.style.display = 'none';
    if (!ctxActiveData || ctxActiveData.type !== 'song') return;
    const song = window.allTracks[ctxActiveData.id];
    if (!song) return;
    if (window.currentQueue && window.currentQueue.length > 0) {
        window.currentQueue.splice(window.currentIndex + 1, 0, song);
        window.updateQueueUI();
        if(window.showToast) window.showToast("Added to play next");
    } else {
        window.playSingleTrack(song.id);
    }
});

document.getElementById('cm-add-queue').addEventListener('click', () => {
    ctxMenu.style.display = 'none';
    if (!ctxActiveData || ctxActiveData.type !== 'song') return;
    const song = window.allTracks[ctxActiveData.id];
    if (!song) return;
    if (window.currentQueue && window.currentQueue.length > 0) {
        window.currentQueue.push(song);
        window.updateQueueUI();
        if(window.showToast) window.showToast("Added to queue");
    } else {
        window.playSingleTrack(song.id);
    }
});

document.getElementById('cm-remove-queue').addEventListener('click', () => {
    ctxMenu.style.display = 'none';
    if (!ctxActiveData || ctxActiveData.type !== 'queue') return;
    
    const idx = ctxActiveData.index;
    if (idx !== null && window.currentQueue) {
        window.currentQueue.splice(idx, 1);
        if (window.currentIndex >= idx && window.currentIndex > 0) {
            window.currentIndex--;
        }
        window.updateQueueUI();
        if(window.showToast) window.showToast("Removed from queue");
    }
});

document.getElementById('cm-play-now').addEventListener('click', () => {
    ctxMenu.style.display = 'none';
    if (!ctxActiveData || ctxActiveData.type !== 'queue') return;
    
    const idx = ctxActiveData.index;
    if (idx !== null && window.currentQueue) {
        window.currentIndex = idx;
        window.loadCurrentTrack();
        window.updateQueueUI();
    }
});

document.getElementById('cm-download').addEventListener('click', async () => {
    ctxMenu.style.display = 'none';
    if (!ctxActiveData || (ctxActiveData.type !== 'song' && ctxActiveData.type !== 'queue')) return;
    
    if(window.showToast) window.showToast("Downloading " + ctxActiveData.title + "...");
    try {
        const downloadUrl = `/api/stream?id=${ctxActiveData.id}`;
        const filename = `${ctxActiveData.title} - Airbeats.m4a`;
        
        if (window.electronDL && window.electronDL.downloadFile) {
            window.electronDL.downloadFile(window.location.origin + downloadUrl, filename);
            return;
        }

        const res = await fetch(downloadUrl);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${ctxActiveData.title} - Airbeats.m4a`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Download failed", e);
        if(window.showToast) window.showToast("Download failed");
    }
});

document.getElementById('cm-subscribe').addEventListener('click', () => {
    ctxMenu.style.display = 'none';
    if (!ctxActiveData || ctxActiveData.type !== 'artist') return;
    
    let subbed = JSON.parse(localStorage.getItem('subscribedArtists') || '[]');
    const isSubbed = subbed.some(a => a.id === ctxActiveData.id);
    if (isSubbed) {
        subbed = subbed.filter(a => a.id !== ctxActiveData.id);
        if(window.showToast) window.showToast("Unsubscribed from " + ctxActiveData.title);
    } else {
        subbed.push({ id: ctxActiveData.id, name: ctxActiveData.title, image: '' });
        if(window.showToast) window.showToast("Subscribed to " + ctxActiveData.title);
    }
    localStorage.setItem('subscribedArtists', JSON.stringify(subbed));
    if (window.renderSubscribedArtists && location.hash.includes('artists')) window.renderSubscribedArtists();
});

document.getElementById('cm-copy-link').addEventListener('click', () => {
    ctxMenu.style.display = 'none';
    if (!ctxActiveData) return;
    const typeStr = ctxActiveData.type === 'queue' ? 'song' : ctxActiveData.type;
    const link = "https://play.airbeats.org/" + typeStr + "?id=" + ctxActiveData.id;
    navigator.clipboard.writeText(link).then(() => {
        if(window.showToast) window.showToast("Link copied to clipboard");
    });
});

document.getElementById('cm-share').addEventListener('click', () => {
    ctxMenu.style.display = 'none';
    if (!ctxActiveData) return;
    const typeStr = ctxActiveData.type === 'queue' ? 'song' : ctxActiveData.type;
    const link = "https://play.airbeats.org/" + typeStr + "?id=" + ctxActiveData.id;
    if (navigator.share) {
        navigator.share({
            title: ctxActiveData.title,
            text: 'Check out ' + ctxActiveData.title + ' on Airbeats!',
            url: link
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(link).then(() => {
            if(window.showToast) window.showToast("Link copied to clipboard");
        });
    }
});





/* ==========================================================================
   AIRBEATS STATS & INSIGHTS ENGINE (Desktop Edition - Modeled after Android)
   ========================================================================== */
window.StatsEngine = {
    RANKS: [
        { id: 'Echo', name: 'Echo', threshold: 1, desc: 'Whisper of sound', colors: ['#00F2FE', '#4FACFE'] },
        { id: 'Pulse', name: 'Pulse', threshold: 5, desc: 'Rhythmic heartbeat', colors: ['#00FF87', '#60EFFF'] },
        { id: 'Bronze', name: 'Bronze', threshold: 10, desc: 'Bronze listener', colors: ['#CA7345', '#EAA17C'] },
        { id: 'Silver', name: 'Silver', threshold: 20, desc: 'Silver connoisseur', colors: ['#BDC3C7', '#E5E9F0'] },
        { id: 'Gold', name: 'Gold', threshold: 35, desc: 'Golden audiophile', colors: ['#FFD700', '#FFA500'] },
        { id: 'Platinum', name: 'Platinum', threshold: 50, desc: 'Platinum enthusiast', colors: ['#E5E9F0', '#B0C4DE'] },
        { id: 'Diamond', name: 'Diamond', threshold: 75, desc: 'Diamond clarity', colors: ['#00F2FE', '#9B51E0'] },
        { id: 'Elite', name: 'Elite', threshold: 100, desc: 'Elite listener', colors: ['#8E2DE2', '#4A00E0'] },
        { id: 'Master', name: 'Master', threshold: 150, desc: 'Master curator', colors: ['#FF007F', '#FF5E62'] },
        { id: 'Legend', name: 'Legend', threshold: 250, desc: 'Legendary streamer', colors: ['#F12711', '#F5AF19'] },
        { id: 'Mythic', name: 'Mythic', threshold: 400, desc: 'Mythic resonance', colors: ['#0575E6', '#00F260'] },
        { id: 'Immortal', name: 'Immortal', threshold: 600, desc: 'Immortal sound', colors: ['#1F1C2C', '#928DAB'] },
        { id: 'Cosmic', name: 'Cosmic', threshold: 1000, desc: 'Cosmic voyager', colors: ['#1A1A2E', '#E94560'] },
        { id: 'Nova', name: 'Nova', threshold: 1500, desc: 'Supernova explosion', colors: ['#FF416C', '#FF4B2B'] },
        { id: 'Celestial', name: 'Celestial', threshold: 2500, desc: 'Celestial harmony', colors: ['#7F00FF', '#E100FF'] },
        { id: 'Godlike', name: 'Godlike', threshold: 4000, desc: 'Godlike frequency', colors: ['#FF007F', '#FFD700', '#00F2FE'] },
        { id: 'Universal', name: 'Universal', threshold: 6000, desc: 'Universal symphony', colors: ['#00C6FF', '#0072FF'] },
        { id: 'Eternal', name: 'Eternal', threshold: 10000, desc: 'Eternal perpetuity', colors: ['#8A2387', '#E94057', '#F27121'] }
    ],

    lastTrackedSec: 0,
    currentTrackId: null,

    // Vector Emblem Generators for all 18 ranks
    renderRankBadge: function(rankName, size = 32) {
        const rank = this.RANKS.find(r => r.name.toLowerCase() === (rankName || '').toLowerCase()) || this.RANKS[0];
        const colors = rank.colors;
        const gradId = `rank_grad_${rank.name}_${Math.random().toString(36).substr(2, 6)}`;
        
        let emblemPath = '';
        switch(rank.name) {
            case 'Echo':
                emblemPath = `<circle cx="50" cy="50" r="14" fill="url(#${gradId})"/><circle cx="50" cy="50" r="28" stroke="url(#${gradId})" stroke-width="4" fill="none" opacity="0.6"/>`;
                break;
            case 'Pulse':
                emblemPath = `<path d="M 12 50 L 32 50 L 44 20 L 56 80 L 68 50 L 88 50" fill="none" stroke="url(#${gradId})" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
                break;
            case 'Bronze':
                emblemPath = `<polygon points="50,15 82,38 70,78 30,78 18,38" fill="url(#${gradId})"/>`;
                break;
            case 'Silver':
                emblemPath = `<path d="M 22 22 L 78 22 L 78 58 Q 78 86 50 94 Q 22 86 22 58 Z" fill="url(#${gradId})"/>`;
                break;
            case 'Gold':
                emblemPath = `<polygon points="50,12 61,35 86,37 67,54 73,79 50,66 27,79 33,54 14,37 39,35" fill="url(#${gradId})"/>`;
                break;
            case 'Platinum':
                emblemPath = `<polygon points="50,14 84,32 84,68 50,86 16,68 16,32" fill="url(#${gradId})"/><polygon points="50,26 72,38 72,62 50,74 28,62 28,38" fill="#0d1117" opacity="0.4"/>`;
                break;
            case 'Diamond':
                emblemPath = `<polygon points="50,12 88,50 50,88 12,50" fill="url(#${gradId})"/><polygon points="50,24 76,50 50,76 24,50" fill="#ffffff" opacity="0.25"/>`;
                break;
            case 'Elite':
                emblemPath = `<path d="M 16 80 L 16 35 L 36 55 L 50 20 L 64 55 L 84 35 L 84 80 Z" fill="url(#${gradId})"/>`;
                break;
            case 'Master':
                emblemPath = `<circle cx="50" cy="50" r="32" stroke="url(#${gradId})" stroke-width="6" fill="none"/><circle cx="50" cy="50" r="16" fill="url(#${gradId})"/>`;
                break;
            case 'Legend':
                emblemPath = `<circle cx="50" cy="50" r="30" fill="url(#${gradId})"/><polygon points="50,26 56,42 72,42 59,52 64,68 50,58 36,68 41,52 28,42 44,42" fill="#ffffff"/>`;
                break;
            case 'Mythic':
                emblemPath = `<path d="M 30 50 C 30 32 46 32 50 50 C 54 68 70 68 70 50 C 70 32 54 32 50 50 C 46 68 30 68 30 50 Z" fill="none" stroke="url(#${gradId})" stroke-width="8" stroke-linecap="round"/>`;
                break;
            case 'Immortal':
                emblemPath = `<polygon points="50,15 85,50 50,85 15,50" fill="url(#${gradId})"/><line x1="50" y1="18" x2="50" y2="82" stroke="#ffffff" stroke-width="5" opacity="0.85"/>`;
                break;
            case 'Cosmic':
                emblemPath = `<circle cx="50" cy="50" r="18" fill="url(#${gradId})"/><ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="url(#${gradId})" stroke-width="5" transform="rotate(-30 50 50)"/>`;
                break;
            case 'Nova':
                emblemPath = `<circle cx="50" cy="50" r="12" fill="#ffffff"/><path d="M 50 12 L 50 88 M 12 50 L 88 50 M 23 23 L 77 77 M 23 77 L 77 23" stroke="url(#${gradId})" stroke-width="5" stroke-linecap="round"/>`;
                break;
            case 'Celestial':
                emblemPath = `<circle cx="50" cy="50" r="34" stroke="url(#${gradId})" stroke-width="5" fill="none"/><polygon points="50,22 72,50 50,78 28,50" fill="url(#${gradId})"/>`;
                break;
            case 'Godlike':
                emblemPath = `<circle cx="50" cy="50" r="34" stroke="url(#${gradId})" stroke-width="6" fill="none"/><polygon points="50,22 76,70 24,70" fill="url(#${gradId})"/>`;
                break;
            case 'Universal':
                emblemPath = `<circle cx="50" cy="50" r="35" stroke="url(#${gradId})" stroke-width="4" fill="none"/><ellipse cx="50" cy="50" rx="35" ry="16" fill="none" stroke="url(#${gradId})" stroke-width="3" transform="rotate(45 50 50)"/><ellipse cx="50" cy="50" rx="35" ry="16" fill="none" stroke="url(#${gradId})" stroke-width="3" transform="rotate(-45 50 50)"/>`;
                break;
            case 'Eternal':
                emblemPath = `<circle cx="50" cy="50" r="36" stroke="url(#${gradId})" stroke-width="6" fill="none"/><path d="M 32 50 C 32 36 46 36 50 50 C 54 64 68 64 68 50 C 68 36 54 36 50 50 C 46 64 32 64 32 50 Z" fill="none" stroke="#FFD700" stroke-width="6"/>`;
                break;
            default:
                emblemPath = `<circle cx="50" cy="50" r="22" fill="url(#${gradId})"/>`;
        }

        const colorStops = colors.map((c, i) => `<stop offset="${Math.round((i / (colors.length - 1 || 1)) * 100)}%" stop-color="${c}"/>`).join('');

        return `
            <svg width="${size}" height="${size}" viewBox="0 0 100 100" class="airbeats-rank-svg" style="vertical-align: middle; flex-shrink: 0;" title="${rank.name} Tier (${rank.threshold}h+)">
                <defs>
                    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                        ${colorStops}
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="46" fill="#0d1117" stroke="url(#${gradId})" stroke-width="4"/>
                ${emblemPath}
            </svg>
        `;
    },

    cleanStr: function(v) {
        if (!v) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'object') return v.title || v.name || v.text || '';
        return String(v);
    },

    escApos: function(v) {
        return window.airJsAttrEsc(this.cleanStr(v));
    },

    escQuot: function(v) {
        return this.cleanStr(v).replace(/"/g, '&quot;');
    },

    getSongPlaceholderSvg: function(title, artist) {
        const cleanT = this.cleanStr(title);
        const cleanA = this.cleanStr(artist);
        const str = cleanT + cleanA;
        const colors = [
            ['#1db954', '#121212'],
            ['#8b5cf6', '#3b82f6'],
            ['#ec4899', '#f43f5e'],
            ['#06b6d4', '#3b82f6'],
            ['#f59e0b', '#ef4444'],
            ['#10b981', '#059669'],
            ['#6366f1', '#a855f7']
        ];
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        const [c1, c2] = colors[Math.abs(hash) % colors.length];
        const gradId = `song_svg_${Math.abs(hash)}`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="120" height="120" rx="16" fill="url(#${gradId})"/><circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/><circle cx="60" cy="60" r="28" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/><circle cx="60" cy="60" r="14" fill="rgba(0,0,0,0.35)"/><path d="M54 44 v22 a7 7 0 1 1 -5 -2 a7 7 0 0 1 5 2 v-16 h18 v12 a7 7 0 1 1 -5 -2 a7 7 0 0 1 5 2 v-16 z" fill="#ffffff" opacity="0.95"/></svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    },

    getSongThumbnail: function(songId, image, title = '', artist = '') {
        const highRes = getHighestQualityImage(image);
        if (highRes && highRes !== DEFAULT_PLACEHOLDER && !highRes.includes('placeholder') && !highRes.includes('ui-avatars')) {
            return highRes;
        }
        const cleanId = songId ? String(songId).replace(/^seed_/, '').split('_')[0] : '';
        if (cleanId && /^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
            return `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;
        }
        return this.getSongPlaceholderSvg(title, artist);
    },

    pendingSongFetches: new Set(),

    fetchSongImageAsync: async function(title, artist, songId) {
        title = this.cleanStr(title);
        artist = this.cleanStr(artist);
        songId = this.cleanStr(songId);
        if (!title) return;
        const key = songId || `${title}_${artist}`;
        if (this.pendingSongFetches.has(key)) return;
        this.pendingSongFetches.add(key);

        try {
            let foundImg = '';
            // 1. Check window.allTracks
            if (window.allTracks && Array.isArray(window.allTracks)) {
                const match = window.allTracks.find(t => t && (t.id === songId || (t.title && this.cleanStr(t.title).toLowerCase() === title.toLowerCase())));
                if (match && match.image) foundImg = getHighestQualityImage(match.image);
            }
            // 2. Check playHistory
            if (!foundImg || foundImg.includes('placeholder') || foundImg.includes('ui-avatars')) {
                try {
                    const hist = JSON.parse(localStorage.getItem('playHistory') || '[]');
                    const match = hist.find(t => t && (t.id === songId || (t.title && this.cleanStr(t.title).toLowerCase() === title.toLowerCase())));
                    if (match && match.image) foundImg = getHighestQualityImage(match.image);
                } catch(e) {}
            }
            // 3. Search backend songs endpoint
            if (!foundImg || foundImg.includes('placeholder') || foundImg.includes('ui-avatars')) {
                const query = artist && artist !== 'Unknown Artist' ? `${title} ${artist}` : title;
                const r = await fetch(`/api/search/songs?query=${encodeURIComponent(query)}&limit=5`);
                const d = await r.json();
                const list = (d && d.data && (d.data.results || d.data)) || [];
                if (Array.isArray(list) && list.length > 0) {
                    const first = list[0];
                    if (first && first.image) {
                        foundImg = getHighestQualityImage(first.image);
                    }
                }
            }
            if (foundImg && !foundImg.includes('placeholder') && !foundImg.includes('ui-avatars')) {
                try {
                    let events = JSON.parse(localStorage.getItem('airbeats_stats_events') || '[]');
                    let updated = false;
                    events.forEach(e => {
                        if (e && (e.songId === songId || (e.title && this.cleanStr(e.title).toLowerCase() === title.toLowerCase()))) {
                            e.image = foundImg;
                            updated = true;
                        }
                    });
                    if (updated) localStorage.setItem('airbeats_stats_events', JSON.stringify(events));
                } catch(e) {}

                const escapedId = (songId || '').replace(/"/g, '\\"');
                const escapedTitle = (title || '').replace(/"/g, '\\"');
                document.querySelectorAll(`img[data-song-id="${escapedId}"], img[data-song-title="${escapedTitle}"]`).forEach(img => {
                    img.src = foundImg;
                });
            }
        } catch(err) {
            console.warn('[StatsEngine] Song image fetch notice:', title, err);
        } finally {
            this.pendingSongFetches.delete(key);
        }
    },

    getArtistImage: function(artistName, artistId, evArtistImage) {
        if (evArtistImage && typeof evArtistImage === 'string' && !evArtistImage.includes('ui-avatars.com') && !evArtistImage.includes('placeholder')) {
            this.setCachedArtistImage(artistName, artistId, evArtistImage);
            return evArtistImage;
        }
        let cache = {};
        try { cache = JSON.parse(localStorage.getItem('airbeats_artist_images') || '{}'); } catch(e) {}
        if (artistName && cache[artistName]) return cache[artistName];
        if (artistId && cache[artistId]) return cache[artistId];

        let subs = {};
        try { subs = JSON.parse(localStorage.getItem('subscribed_artists') || '{}'); } catch(e) {}
        if (artistId && subs[artistId] && subs[artistId].image) {
            const sImg = subs[artistId].image;
            if (sImg && !sImg.includes('ui-avatars') && !sImg.includes('placeholder')) return sImg;
        }
        const subMatch = Object.values(subs).find(s => s && s.name && s.name.toLowerCase() === (artistName || '').toLowerCase());
        if (subMatch && subMatch.image && !subMatch.image.includes('ui-avatars') && !subMatch.image.includes('placeholder')) {
            return subMatch.image;
        }

        return '';
    },

    setCachedArtistImage: function(artistName, artistId, imageUrl) {
        if (!imageUrl || imageUrl.includes('ui-avatars') || imageUrl.includes('placeholder')) return;
        try {
            let cache = JSON.parse(localStorage.getItem('airbeats_artist_images') || '{}');
            if (artistName) cache[artistName] = imageUrl;
            if (artistId) cache[artistId] = imageUrl;
            localStorage.setItem('airbeats_artist_images', JSON.stringify(cache));
        } catch(e) {}
    },

    getArtistPlaceholderSvg: function(name) {
        const cleanN = this.cleanStr ? this.cleanStr(name) : (name || '');
        const initial = (cleanN ? cleanN.trim().charAt(0) : 'A').toUpperCase();
        const colors = [
            ['#ec4899', '#8b5cf6'],
            ['#3b82f6', '#06b6d4'],
            ['#10b981', '#3b82f6'],
            ['#f59e0b', '#ef4444'],
            ['#8b5cf6', '#6366f1'],
            ['#00c6ff', '#0072ff']
        ];
        let hash = 0;
        for (let i = 0; i < (cleanN || '').length; i++) hash = cleanN.charCodeAt(i) + ((hash << 5) - hash);
        const [c1, c2] = colors[Math.abs(hash) % colors.length];
        const gradId = `art_svg_${Math.abs(hash)}`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#${gradId})"/><text x="50" y="58" font-size="42" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    },

    pendingArtistFetches: new Set(),

    fetchArtistImageAsync: async function(artistName, artistId) {
        artistName = this.cleanStr ? this.cleanStr(artistName) : (artistName || '');
        artistId = this.cleanStr ? this.cleanStr(artistId) : (artistId || '');
        if (!artistName || artistName === 'Unknown Artist') return;
        const key = artistId || artistName;
        if (this.pendingArtistFetches.has(key)) return;
        this.pendingArtistFetches.add(key);

        try {
            let fetchedUrl = '';
            if (artistId && (artistId.startsWith('UC') || artistId.startsWith('MPRE'))) {
                try {
                    const r = await fetch(`/api/artists?id=${encodeURIComponent(artistId)}`);
                    const d = await r.json();
                    if (d && d.success && d.data && d.data.image) {
                        fetchedUrl = getHighestQualityImage(d.data.image);
                    }
                } catch(e) {}
            }
            if (!fetchedUrl || fetchedUrl.includes('placeholder')) {
                const r = await fetch(`/api/search/artists?query=${encodeURIComponent(artistName)}`);
                const d = await r.json();
                const list = (d && d.data && (d.data.results || d.data)) || [];
                if (Array.isArray(list) && list.length > 0) {
                    const first = list[0];
                    if (first && first.image) {
                        fetchedUrl = getHighestQualityImage(first.image);
                    }
                }
            }
            if (fetchedUrl && !fetchedUrl.includes('placeholder') && !fetchedUrl.includes('ui-avatars')) {
                this.setCachedArtistImage(artistName, artistId, fetchedUrl);
                const escapedName = (artistName || '').replace(/"/g, '\\"');
                document.querySelectorAll(`img[data-artist-name="${escapedName}"]`).forEach(img => {
                    img.src = fetchedUrl;
                });
            }
        } catch(err) {
            console.warn('[StatsEngine] Artist image fetch notice:', artistName, err);
        } finally {
            this.pendingArtistFetches.delete(key);
        }
    },

    // Seed events from playHistory / favorites if empty, and sanitize existing events
    getEvents: function() {
        let events = [];
        try {
            events = JSON.parse(localStorage.getItem('airbeats_stats_events') || '[]');
        } catch(e) { events = []; }

        // Sanitize any existing events stored in user's browser localStorage
        let updatedCount = 0;
        if (Array.isArray(events) && events.length > 0) {
            events.forEach(ev => {
                if (!ev) return;
                if (ev.album && typeof ev.album === 'object') {
                    ev.album = ev.album.title || ev.album.name || ev.album.text || '';
                    updatedCount++;
                }
                if (ev.title && typeof ev.title === 'object') {
                    ev.title = ev.title.title || ev.title.name || ev.title.text || '';
                    updatedCount++;
                }
                if (ev.artist && typeof ev.artist === 'object') {
                    ev.artist = ev.artist.name || ev.artist.title || '';
                    updatedCount++;
                }
                const songId = ev.songId || (ev.id && ev.id.startsWith('seed_') ? ev.id.split('_')[1] : ev.id);
                const isBrokenYt = ev.image && ev.image.includes('ytimg.com') && (!songId || !/^[a-zA-Z0-9_-]{11}$/.test(songId));
                if (!ev.image || ev.image.includes('ui-avatars.com') || ev.image.includes('placeholder') || isBrokenYt) {
                    ev.image = this.getSongThumbnail(songId, ev.image, ev.title, ev.artist);
                    updatedCount++;
                }
                if (!ev.artistImage || ev.artistImage.includes('ui-avatars.com') || ev.artistImage.includes('placeholder')) {
                    const cachedArt = this.getArtistImage(ev.artist, ev.artistId, '');
                    if (cachedArt) {
                        ev.artistImage = cachedArt;
                        updatedCount++;
                    }
                }
            });
            if (updatedCount > 0) {
                try {
                    localStorage.setItem('airbeats_stats_events', JSON.stringify(events));
                } catch(e) {}
            }
        }

        if (!events || events.length === 0) {
            // Seed from playHistory
            const hist = JSON.parse(localStorage.getItem('playHistory') || '[]');
            const favs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
            const seedTracks = [...hist, ...favs];
            if (seedTracks.length > 0) {
                events = [];
                const now = Date.now();
                seedTracks.forEach((t, i) => {
                    if (!t || !t.id) return;
                    const dur = t.duration ? parseInt(t.duration, 10) : 210;
                    const playCount = Math.max(1, Math.floor(Math.random() * 5) + 1);
                    const rawSongImg = getHighestQualityImage(t.image);
                    const artName = (t.artists && t.artists.primary && t.artists.primary[0] && t.artists.primary[0].name) || t.artist || 'Unknown Artist';
                    const artId = (t.artists && t.artists.primary && t.artists.primary[0] && t.artists.primary[0].id) || t.artistIds || '';
                    const songImg = this.getSongThumbnail(t.id, rawSongImg, t.title || t.name, artName);
                    const artImg = (t.artists && t.artists.primary && t.artists.primary[0] && t.artists.primary[0].image) || this.getArtistImage(artName, artId, '');

                    const sTitle = this.cleanStr(t.title || t.name || 'Unknown Track');
                    const sArt = this.cleanStr(artName);
                    const sAlb = this.cleanStr((t.album && (t.album.title || t.album.name || t.album)) || '');
                    const sAlbId = this.cleanStr((t.album && t.album.id) || '');

                    for (let c = 0; c < playCount; c++) {
                        events.push({
                            id: `seed_${t.id}_${c}`,
                            songId: t.id,
                            title: sTitle,
                            artist: sArt,
                            artistId: artId,
                            artistImage: artImg || '',
                            album: sAlb,
                            albumId: sAlbId,
                            image: songImg,
                            duration: dur,
                            timeListenedMs: dur * 1000,
                            timestamp: new Date(now - (i * 3600000 * 6) - (c * 86400000)).toISOString()
                        });
                    }
                });
                try {
                    localStorage.setItem('airbeats_stats_events', JSON.stringify(events));
                    const totalMs = events.reduce((sum, e) => sum + (e.timeListenedMs || 0), 0);
                    localStorage.setItem('airbeats_total_listen_ms', totalMs.toString());
                } catch(e) {}
            }
        }
        return events || [];
    },

    // Record an individual play event
    recordListenEvent: function(track, listenedMs, isComplete = false) {
        if (!track || !track.id) return;
        const events = this.getEvents();
        const dur = track.duration ? parseInt(track.duration, 10) : 210;
        const validMs = Math.max(15000, parseInt(listenedMs, 10) || (dur * 1000));
        
        const rawSongImg = getHighestQualityImage(track.image);
        const artName = (track.artists && track.artists.primary && track.artists.primary[0] && track.artists.primary[0].name) || track.artist || 'Unknown Artist';
        const artId = (track.artists && track.artists.primary && track.artists.primary[0] && track.artists.primary[0].id) || track.artistIds || '';
        const songImg = this.getSongThumbnail(track.id, rawSongImg, track.title || track.name, artName);
        const artImg = (track.artists && track.artists.primary && track.artists.primary[0] && track.artists.primary[0].image) || this.getArtistImage(artName, artId, track.artistImage || '');

        const newEvent = {
            id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            songId: track.id,
            title: this.cleanStr(track.title || track.name || 'Unknown Track'),
            artist: this.cleanStr(artName),
            artistId: artId,
            artistImage: artImg || '',
            album: this.cleanStr((track.album && (track.album.title || track.album.name || track.album)) || ''),
            albumId: this.cleanStr((track.album && track.album.id) || ''),
            image: songImg,
            duration: dur,
            timeListenedMs: validMs,
            timestamp: new Date().toISOString()
        };

        events.unshift(newEvent);
        if (events.length > 5000) events.pop();
        
        try {
            localStorage.setItem('airbeats_stats_events', JSON.stringify(events));
            const currentTotal = parseInt(localStorage.getItem('airbeats_total_listen_ms') || '0', 10);
            localStorage.setItem('airbeats_total_listen_ms', (currentTotal + validMs).toString());
        } catch(e) {}
    },

    // Continuous playtime accumulation
    trackPlaytime: function(currentTime) {
        const curSec = Math.floor(currentTime);
        const curTrack = window.getCurrentTrack ? window.getCurrentTrack() : null;
        if (!curTrack) return;
        if (this.currentTrackId !== curTrack.id) {
            this.currentTrackId = curTrack.id;
            this.lastTrackedSec = curSec;
            return;
        }
        if (curSec > this.lastTrackedSec) {
            const diffSec = curSec - this.lastTrackedSec;
            if (diffSec > 0 && diffSec < 10) {
                const addMs = diffSec * 1000;
                const currentTotal = parseInt(localStorage.getItem('airbeats_total_listen_ms') || '0', 10);
                localStorage.setItem('airbeats_total_listen_ms', (currentTotal + addMs).toString());
            }
            this.lastTrackedSec = curSec;
        }
    },

    importEvents: function(importedEvents) {
        if (!Array.isArray(importedEvents) || importedEvents.length === 0) return;
        const currentEvents = this.getEvents();
        const existingIds = new Set(currentEvents.map(e => e.id || `${e.songId}_${e.timestamp}`));
        
        let addedCount = 0;
        importedEvents.forEach(ev => {
            if (!ev) return;
            ev.title = this.cleanStr(ev.title || 'Unknown Track');
            ev.artist = this.cleanStr(ev.artist || 'Unknown Artist');
            ev.album = this.cleanStr(ev.album || '');
            const songId = ev.songId || (ev.id && ev.id.startsWith('seed_') ? ev.id.split('_')[1] : ev.id);
            if (!ev.image || ev.image.includes('ui-avatars.com') || ev.image.includes('placeholder')) {
                ev.image = this.getSongThumbnail(songId, ev.image, ev.title, ev.artist);
            }
            if (ev.artistImage && !ev.artistImage.includes('ui-avatars.com')) {
                this.setCachedArtistImage(ev.artist, ev.artistId, ev.artistImage);
            }
            const key = ev.id || `${ev.songId}_${ev.timestamp}`;
            if (!existingIds.has(key)) {
                existingIds.add(key);
                currentEvents.push(ev);
                addedCount++;
            }
        });

        currentEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        try {
            localStorage.setItem('airbeats_stats_events', JSON.stringify(currentEvents.slice(0, 10000)));
            const newTotalMs = currentEvents.reduce((sum, e) => sum + (e.timeListenedMs || 0), 0);
            localStorage.setItem('airbeats_total_listen_ms', newTotalMs.toString());
        } catch(e) {}
    },

    getProfile: function() {
        return {
            name: localStorage.getItem('airbeats_user_name') || 'Airbeats Listener',
            avatar: localStorage.getItem('airbeats_user_avatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
            displayedBadge: localStorage.getItem('airbeats_displayed_badge') || null
        };
    },

    saveProfile: function(name, avatar, displayedBadge) {
        if (name) localStorage.setItem('airbeats_user_name', name.trim());
        if (avatar) localStorage.setItem('airbeats_user_avatar', avatar.trim());
        if (displayedBadge !== undefined) {
            if (displayedBadge) localStorage.setItem('airbeats_displayed_badge', displayedBadge);
            else localStorage.removeItem('airbeats_displayed_badge');
        }
    },

    getTotalHours: function() {
        const events = this.getEvents();
        const totalMs = parseInt(localStorage.getItem('airbeats_total_listen_ms') || '0', 10) || events.reduce((sum, e) => sum + (e.timeListenedMs || 0), 0);
        return totalMs / 3600000.0;
    },

    getCurrentRank: function(hours) {
        const h = hours !== undefined ? hours : this.getTotalHours();
        for (let i = this.RANKS.length - 1; i >= 0; i--) {
            if (h >= this.RANKS[i].threshold) {
                return this.RANKS[i];
            }
        }
        return this.RANKS[0];
    },

    getNextRank: function(currentRank) {
        const idx = this.RANKS.findIndex(r => r.name === currentRank.name);
        if (idx >= 0 && idx < this.RANKS.length - 1) {
            return this.RANKS[idx + 1];
        }
        return null;
    },

    // Filter events by period
    filterEvents: function(mode, indexChip, allEvents) {
        const events = allEvents || this.getEvents();
        const now = new Date();

        if (mode === 'continuous') {
            let cutoff = 0;
            switch(indexChip) {
                case 0: cutoff = 7 * 86400000; break;     // 1W
                case 1: cutoff = 30 * 86400000; break;    // 1M
                case 2: cutoff = 90 * 86400000; break;    // 3M
                case 3: cutoff = 180 * 86400000; break;   // 6M
                case 4: cutoff = 365 * 86400000; break;   // 1Y
                case 5: cutoff = 0; break;                // All Time
                default: cutoff = 0;
            }
            if (cutoff === 0) return events;
            const threshold = new Date(now.getTime() - cutoff);
            return events.filter(e => new Date(e.timestamp) >= threshold);
        } else if (mode === 'weeks') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() - (indexChip * 7));
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            return events.filter(e => {
                const d = new Date(e.timestamp);
                return d >= startOfWeek && d < endOfWeek;
            });
        } else if (mode === 'months') {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - indexChip, 1);
            const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);
            return events.filter(e => {
                const d = new Date(e.timestamp);
                return d >= startOfMonth && d < endOfMonth;
            });
        } else if (mode === 'years') {
            const targetYear = now.getFullYear() - indexChip;
            const startOfYear = new Date(targetYear, 0, 1);
            const endOfYear = new Date(targetYear + 1, 0, 1);
            return events.filter(e => {
                const d = new Date(e.timestamp);
                return d >= startOfYear && d < endOfYear;
            });
        }
        return events;
    },

    // Aggregate filtered events into high-level metrics
    aggregate: function(filteredEvents) {
        const events = filteredEvents || [];
        let totalMs = 0;
        const songMap = new Map();
        const artistMap = new Map();
        const albumMap = new Map();
        const hourDistribution = new Array(24).fill(0);

        events.forEach(ev => {
            const ms = ev.timeListenedMs || (ev.duration ? ev.duration * 1000 : 180000);
            totalMs += ms;

            const evDate = new Date(ev.timestamp);
            if (!isNaN(evDate)) {
                hourDistribution[evDate.getHours()]++;
            }

            // Songs
            const songId = ev.songId || ev.id;
            if (songId) {
                if (!songMap.has(songId)) {
                    const songImg = this.getSongThumbnail(songId, ev.image, ev.title, ev.artist);
                    songMap.set(songId, {
                        id: songId,
                        title: ev.title || 'Unknown Track',
                        artist: ev.artist || 'Unknown Artist',
                        artistId: ev.artistId || '',
                        album: ev.album || '',
                        image: songImg,
                        playCount: 0,
                        totalListenMs: 0
                    });
                }
                const s = songMap.get(songId);
                s.playCount++;
                s.totalListenMs += ms;
            }

            // Artists
            const artistName = ev.artist || 'Unknown Artist';
            if (artistName && artistName !== 'Unknown Artist') {
                if (!artistMap.has(artistName)) {
                    let artImg = this.getArtistImage(artistName, ev.artistId, ev.artistImage);
                    if (!artImg) {
                        artImg = this.getArtistPlaceholderSvg(artistName);
                        this.fetchArtistImageAsync(artistName, ev.artistId);
                    }
                    artistMap.set(artistName, {
                        id: ev.artistId || artistName,
                        name: artistName,
                        image: artImg,
                        playCount: 0,
                        totalListenMs: 0
                    });
                } else {
                    const a = artistMap.get(artistName);
                    if ((!a.image || a.image.startsWith('data:image/svg')) && ev.artistImage && !ev.artistImage.includes('ui-avatars')) {
                        a.image = ev.artistImage;
                        this.setCachedArtistImage(artistName, ev.artistId, ev.artistImage);
                    }
                }
                const a = artistMap.get(artistName);
                a.playCount++;
                a.totalListenMs += ms;
            }

            // Albums
            let albumName = '';
            if (typeof ev.album === 'string') albumName = ev.album;
            else if (ev.album && typeof ev.album === 'object') albumName = ev.album.title || ev.album.name || ev.album.text || '';
            albumName = String(albumName || '').trim();
            if (albumName && albumName !== '[object Object]') {
                if (!albumMap.has(albumName)) {
                    const albArtist = typeof ev.artist === 'string' ? ev.artist : (ev.artist && (ev.artist.name || ev.artist.title) ? (ev.artist.name || ev.artist.title) : '');
                    const albImg = (ev.image && !ev.image.includes('ui-avatars') && !ev.image.includes('placeholder')) ? getHighestQualityImage(ev.image) : this.getSongThumbnail(songId, ev.image, albumName, albArtist);
                    albumMap.set(albumName, {
                        id: ev.albumId || albumName,
                        title: albumName,
                        artist: albArtist,
                        image: albImg,
                        playCount: 0,
                        totalListenMs: 0
                    });
                }
                const alb = albumMap.get(albumName);
                alb.playCount++;
                alb.totalListenMs += ms;
            }
        });

        const topSongs = Array.from(songMap.values()).sort((a, b) => b.playCount - a.playCount || b.totalListenMs - a.totalListenMs);
        const topArtists = Array.from(artistMap.values()).sort((a, b) => b.playCount - a.playCount || b.totalListenMs - a.totalListenMs);
        const topAlbums = Array.from(albumMap.values()).sort((a, b) => b.playCount - a.playCount || b.totalListenMs - a.totalListenMs);

        // Calculate Listener Persona based on habits
        const nightPlays = hourDistribution.slice(21, 24).reduce((a, b) => a + b, 0) + hourDistribution.slice(0, 5).reduce((a, b) => a + b, 0);
        const totalHourPlays = hourDistribution.reduce((a, b) => a + b, 0) || 1;
        let persona = 'Melody Connoisseur';
        if (nightPlays / totalHourPlays > 0.4) persona = 'Night Owl Audiophile';
        else if (topSongs.length > 50) persona = 'Discovery Pioneer';
        else if (topArtists.length > 0 && topArtists[0].playCount > 20) persona = `${topArtists[0].name} Devotee`;
        else if (totalMs > 100 * 3600000) persona = 'Marathon Streamer';

        return {
            totalListenMs: totalMs,
            totalHours: (totalMs / 3600000.0),
            uniqueSongs: songMap.size,
            totalScrobbles: events.length,
            topSongs: topSongs,
            topArtists: topArtists,
            topAlbums: topAlbums,
            persona: persona,
            hourDistribution: hourDistribution
        };
    },

    formatTime: function(milliseconds) {
        const totalMinutes = Math.floor(milliseconds / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours === 0) return `${minutes}m`;
        return `${hours}h ${minutes}m`;
    }
};

/* ==========================================================================
   RENDER STATS SCREEN (#stats)
   ========================================================================== */
window.currentStatsMode = 'continuous';
window.currentStatsChipIndex = 5; // Default: All Time

async function renderStats() {
    const cleanStr = (v) => window.StatsEngine.cleanStr(v);
    const escApos = (v) => window.StatsEngine.escApos(v);
    const escQuot = (v) => window.StatsEngine.escQuot(v);

    const events = window.StatsEngine.getEvents();
    const profile = window.StatsEngine.getProfile();
    const totalAllTimeHours = window.StatsEngine.getTotalHours();
    const realRank = window.StatsEngine.getCurrentRank(totalAllTimeHours);
    const displayedRankObj = profile.displayedBadge 
        ? (window.StatsEngine.RANKS.find(r => r.name.toLowerCase() === profile.displayedBadge.toLowerCase()) || realRank)
        : realRank;
    const nextRank = window.StatsEngine.getNextRank(realRank);

    // Calculate next rank progress
    let progressPercent = 100;
    let hoursRemaining = 0;
    if (nextRank) {
        const curThreshold = realRank.threshold;
        const nextThreshold = nextRank.threshold;
        const progressInTier = Math.max(0, totalAllTimeHours - curThreshold);
        const tierSpan = nextThreshold - curThreshold;
        progressPercent = Math.min(100, Math.max(0, Math.round((progressInTier / tierSpan) * 100)));
        hoursRemaining = Math.max(0, (nextThreshold - totalAllTimeHours)).toFixed(1);
    }

    // Filter events for the current active period
    const filteredEvents = window.StatsEngine.filterEvents(window.currentStatsMode, window.currentStatsChipIndex, events);
    const agg = window.StatsEngine.aggregate(filteredEvents);

    // Dynamic Period Chips
    const continuousChips = [
        { label: '1 Week', val: 0 },
        { label: '1 Month', val: 1 },
        { label: '3 Months', val: 2 },
        { label: '6 Months', val: 3 },
        { label: '1 Year', val: 4 },
        { label: 'All Time', val: 5 }
    ];

    let dynamicChips = [];
    if (window.currentStatsMode === 'continuous') {
        dynamicChips = continuousChips;
    } else if (window.currentStatsMode === 'weeks') {
        dynamicChips = [
            { label: 'This Week', val: 0 },
            { label: 'Last Week', val: 1 },
            { label: '2 Weeks Ago', val: 2 },
            { label: '3 Weeks Ago', val: 3 }
        ];
    } else if (window.currentStatsMode === 'months') {
        const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const curM = new Date().getMonth();
        const curY = new Date().getFullYear();
        dynamicChips = [0, 1, 2, 3, 4, 5].map(idx => {
            const d = new Date(curY, curM - idx, 1);
            return { label: `${mNames[d.getMonth()]} ${d.getFullYear()}`, val: idx };
        });
    } else if (window.currentStatsMode === 'years') {
        const curY = new Date().getFullYear();
        dynamicChips = [0, 1, 2].map(idx => ({ label: `${curY - idx}`, val: idx }));
    }

    // Top 5 Songs for Bar Chart
    const top5 = agg.topSongs.slice(0, 5);
    const maxPlays = top5.length > 0 ? top5[0].playCount : 1;

    routerView.innerHTML = `
        <div class="stats-container">
            <!-- 1. PROFILE & QUICK ACTION HERO -->
            <div class="stats-profile-hero">
                <div class="stats-profile-left">
                    <div class="stats-avatar-wrap" onclick="window.openProfileCustomizerModal()" title="Change Avatar & Badge">
                        <img src="${profile.avatar}" class="stats-avatar-img" alt="${profile.name}">
                        <div class="stats-avatar-edit-badge"><i class="fas fa-camera"></i></div>
                    </div>
                    <div class="stats-user-meta">
                        <div class="stats-user-name-row">
                            <h1 class="stats-user-name">${profile.name}</h1>
                            <button class="stats-edit-name-btn" onclick="window.openProfileCustomizerModal()" title="Edit Name"><i class="fas fa-pen"></i></button>
                        </div>
                        <div class="stats-badge-tag" onclick="window.openProfileCustomizerModal()" title="Choose Displayed Badge">
                            ${window.StatsEngine.renderRankBadge(displayedRankObj.name, 20)}
                            <span>${displayedRankObj.name} Tier</span>
                            <i class="fas fa-chevron-right" style="font-size: 10px; opacity: 0.6;"></i>
                        </div>
                    </div>
                </div>

                <div class="stats-profile-actions">
                    <button class="stats-action-btn stats-action-btn-insight" onclick="window.openInsightModal()">
                        <i class="fas fa-sparkles"></i> AirBeats Insight
                    </button>
                    <button class="stats-action-btn" onclick="window.openProfileCustomizerModal()">
                        <i class="fas fa-user-gear"></i> Badges & Profile
                    </button>
                    <button class="stats-action-btn" onclick="window.shuffleMostPlayedStats()">
                        <i class="fas fa-random"></i> Shuffle Most Played
                    </button>
                </div>
            </div>

            <!-- 2. RANK STATUS & LEVEL PROGRESS BANNER -->
            <div class="stats-rank-banner">
                <div class="stats-rank-emblem-wrap">
                    ${window.StatsEngine.renderRankBadge(realRank.name, 68)}
                </div>
                <div class="stats-rank-info">
                    <div class="stats-rank-header">
                        <div class="stats-rank-title">
                            ${realRank.name.toUpperCase()} TIER
                            <span style="font-size: 12px; font-weight: 600; color: var(--accent-text); background: rgba(29, 185, 84, 0.12); padding: 3px 10px; border-radius: 50px;">
                                ${realRank.desc}
                            </span>
                        </div>
                        <div class="stats-rank-hours-label">
                            <b>${totalAllTimeHours.toFixed(1)}h</b> listened all-time
                        </div>
                    </div>
                    <div class="stats-progress-track">
                        <div class="stats-progress-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                    <div class="stats-rank-footer">
                        <span>Progress: <b>${progressPercent}%</b> towards ${nextRank ? nextRank.name : 'Max Tier'}</span>
                        <span>${nextRank ? `<b>${hoursRemaining}h</b> remaining until ${nextRank.name} (${nextRank.threshold}h)` : 'Maximum Tier Reached!'}</span>
                    </div>
                </div>
            </div>

            <!-- 3. PERIOD SELECTOR TABS -->
            <div class="stats-filter-section">
                <div class="stats-mode-tabs">
                    <button class="stats-mode-tab ${window.currentStatsMode === 'continuous' ? 'active' : ''}" onclick="window.switchStatsMode('continuous')">Continuous</button>
                    <button class="stats-mode-tab ${window.currentStatsMode === 'weeks' ? 'active' : ''}" onclick="window.switchStatsMode('weeks')">Weeks</button>
                    <button class="stats-mode-tab ${window.currentStatsMode === 'months' ? 'active' : ''}" onclick="window.switchStatsMode('months')">Months</button>
                    <button class="stats-mode-tab ${window.currentStatsMode === 'years' ? 'active' : ''}" onclick="window.switchStatsMode('years')">Years</button>
                </div>

                <div class="stats-chips-row">
                    ${dynamicChips.map(c => `
                        <button class="stats-chip ${window.currentStatsChipIndex === c.val ? 'active' : ''}" onclick="window.setStatsChipIndex(${c.val})">
                            ${c.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- 4. KEY SUMMARY METRICS (4 CARDS) -->
            <div class="stats-metrics-grid">
                <div class="stats-stat-card">
                    <div class="stats-stat-card-header">
                        <span class="stats-stat-label">Total Time</span>
                        <i class="fas fa-clock stats-stat-icon"></i>
                    </div>
                    <div class="stats-stat-val">${window.StatsEngine.formatTime(agg.totalListenMs)}</div>
                    <div class="stats-stat-sub">Across selected period</div>
                </div>

                <div class="stats-stat-card">
                    <div class="stats-stat-card-header">
                        <span class="stats-stat-label">Unique Songs</span>
                        <i class="fas fa-music stats-stat-icon"></i>
                    </div>
                    <div class="stats-stat-val">${agg.uniqueSongs}</div>
                    <div class="stats-stat-sub">Distinct tracks played</div>
                </div>

                <div class="stats-stat-card">
                    <div class="stats-stat-card-header">
                        <span class="stats-stat-label">Total Scrobbles</span>
                        <i class="fas fa-play-circle stats-stat-icon"></i>
                    </div>
                    <div class="stats-stat-val">${agg.totalScrobbles}</div>
                    <div class="stats-stat-sub">Completed listening events</div>
                </div>

                <div class="stats-stat-card">
                    <div class="stats-stat-card-header">
                        <span class="stats-stat-label">Top Artist</span>
                        <i class="fas fa-user-astronaut stats-stat-icon"></i>
                    </div>
                    <div class="stats-stat-val" style="font-size: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${agg.topArtists.length > 0 ? agg.topArtists[0].name : 'None yet'}
                    </div>
                    <div class="stats-stat-sub">${agg.topArtists.length > 0 ? `${agg.topArtists[0].playCount} plays (${window.StatsEngine.formatTime(agg.topArtists[0].totalListenMs)})` : 'Keep listening'}</div>
                </div>
            </div>

            <!-- 5. TOP 5 SONGS BAR CHART -->
            ${top5.length > 0 ? `
            <div class="stats-chart-card">
                <div class="stats-chart-title">
                    <span>Top 5 Songs</span>
                    <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Ranked by play count</span>
                </div>
                <div class="stats-chart-list">
                    ${top5.map((s, idx) => {
                        const fillPercent = Math.max(10, Math.round((s.playCount / maxPlays) * 100));
                        const sTitle = cleanStr(s.title);
                        const sArtist = cleanStr(s.artist);
                        const safeTitle = escApos(sTitle);
                        const safeArtist = escApos(sArtist);
                        return `
                        <div class="stats-chart-row" onclick="window.playSingleTrack('${s.id}')">
                            <span class="stats-chart-rank${idx < 3 ? ' rank-' + (idx + 1) : ''}">#${idx + 1}</span>
                            <div class="stats-chart-thumb-wrap">
                                <img src="${getHighestQualityImage(s.image)}" 
                                     data-song-id="${s.id}" 
                                     data-song-title="${escQuot(sTitle)}" 
                                     data-song-artist="${escQuot(sArtist)}" 
                                     onload="if(this.naturalWidth<=120&&this.naturalHeight<=90){this.src=window.StatsEngine.getSongPlaceholderSvg('${safeTitle}','${safeArtist}');window.StatsEngine.fetchSongImageAsync('${safeTitle}','${safeArtist}','${s.id}');}" 
                                     onerror="this.src=window.StatsEngine.getSongPlaceholderSvg('${safeTitle}','${safeArtist}');window.StatsEngine.fetchSongImageAsync('${safeTitle}','${safeArtist}','${s.id}');}" 
                                     class="stats-chart-thumb" 
                                     alt="${escQuot(sTitle)}">
                            </div>
                            <div class="stats-chart-info">
                                <div class="stats-chart-song-title" title="${escQuot(sTitle)}">${sTitle}</div>
                                <div class="stats-chart-song-artist" title="${escQuot(sArtist)}">${sArtist}</div>
                            </div>
                            <div class="stats-bar-track">
                                <div class="stats-bar-fill" style="width: ${fillPercent}%;"></div>
                            </div>
                            <span class="stats-chart-count-pill">${s.playCount} plays</span>
                            <button class="stats-chart-play-btn" onclick="event.stopPropagation(); window.playSingleTrack('${s.id}')" title="Play Now"><i class="fas fa-play"></i></button>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}

            <!-- 6. MOST PLAYED SONGS SHELF -->
            <div class="stats-shelf-section">
                <div class="stats-shelf-header">
                    <h3 class="stats-shelf-title">Most Played Songs (${agg.topSongs.length})</h3>
                    ${agg.topSongs.length > 0 ? `
                        <button class="stats-action-btn" style="padding: 7px 18px; font-size: 12px;" onclick="window.shuffleMostPlayedStats()">
                            <i class="fas fa-random"></i> Shuffle All
                        </button>
                    ` : ''}
                </div>
                ${agg.topSongs.length > 0 ? `
                    <div class="stats-shelf-grid">
                        ${agg.topSongs.slice(0, 12).map((s, idx) => {
                            const sTitle = cleanStr(s.title);
                            const sArtist = cleanStr(s.artist);
                            const safeTitle = escApos(sTitle);
                            const safeArtist = escApos(sArtist);
                            return `
                            <div class="stats-item-card" onclick="window.playSingleTrack('${s.id}')">
                                <div class="stats-item-thumb-wrap">
                                    <img src="${getHighestQualityImage(s.image)}" 
                                         data-song-id="${s.id}" 
                                         data-song-title="${escQuot(sTitle)}" 
                                         data-song-artist="${escQuot(sArtist)}" 
                                         onload="if(this.naturalWidth<=120&&this.naturalHeight<=90){this.src=window.StatsEngine.getSongPlaceholderSvg('${safeTitle}','${safeArtist}');window.StatsEngine.fetchSongImageAsync('${safeTitle}','${safeArtist}','${s.id}');}" 
                                         onerror="this.src=window.StatsEngine.getSongPlaceholderSvg('${safeTitle}','${safeArtist}');window.StatsEngine.fetchSongImageAsync('${safeTitle}','${safeArtist}','${s.id}');" 
                                         class="stats-item-thumb" 
                                         alt="${escQuot(sTitle)}">
                                    <div class="stats-item-play-overlay">
                                        <div class="stats-item-play-btn"><i class="fas fa-play"></i></div>
                                    </div>
                                </div>
                                <div class="stats-item-title" title="${escQuot(sTitle)}">${idx + 1}. ${sTitle}</div>
                                <div class="stats-item-sub" title="${escQuot(sArtist)}">${sArtist}</div>
                                <span class="stats-item-count-badge">${s.playCount} plays • ${window.StatsEngine.formatTime(s.totalListenMs)}</span>
                            </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div style="color: var(--text-secondary); padding: 30px 0; text-align: center;">No song records in this period. Start streaming tracks to see your stats!</div>
                `}
            </div>

            <!-- 7. MOST PLAYED ARTISTS SHELF -->
            <div class="stats-shelf-section">
                <div class="stats-shelf-header">
                    <h3 class="stats-shelf-title">Most Played Artists (${agg.topArtists.length})</h3>
                </div>
                ${agg.topArtists.length > 0 ? `
                    <div class="stats-shelf-grid">
                        ${agg.topArtists.slice(0, 12).map((a, idx) => {
                            const aName = cleanStr(a.name);
                            const safeName = escApos(aName);
                            return `
                            <div class="stats-item-card" onclick="location.hash='#artist/${a.id}'">
                                <div class="stats-item-thumb-wrap round">
                                    <img src="${getHighestQualityImage(a.image)}" 
                                         data-artist-name="${escQuot(aName)}" 
                                         data-artist-id="${a.id}" 
                                         onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src=window.StatsEngine.getArtistPlaceholderSvg('${safeName}');window.StatsEngine.fetchArtistImageAsync('${safeName}','${a.id}');}" 
                                         class="stats-item-thumb" 
                                         alt="${escQuot(aName)}">
                                </div>
                                <div class="stats-item-title" style="text-align: center;">${idx + 1}. ${aName}</div>
                                <div style="text-align: center;">
                                    <span class="stats-item-count-badge">${a.playCount} plays • ${window.StatsEngine.formatTime(a.totalListenMs)}</span>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div style="color: var(--text-secondary); padding: 20px 0; text-align: center;">No artist data in this period.</div>
                `}
            </div>

            <!-- 8. MOST PLAYED ALBUMS SHELF -->
            <div class="stats-shelf-section">
                <div class="stats-shelf-header">
                    <h3 class="stats-shelf-title">Most Played Albums (${agg.topAlbums.length})</h3>
                </div>
                ${agg.topAlbums.length > 0 ? `
                    <div class="stats-shelf-grid">
                        ${agg.topAlbums.slice(0, 12).map((alb, idx) => {
                            const albTitle = cleanStr(alb.title);
                            const albArtist = cleanStr(alb.artist);
                            const safeAlbTitle = escApos(albTitle);
                            const safeAlbArtist = escApos(albArtist);
                            return `
                            <div class="stats-item-card" onclick="location.hash='#album/${alb.id}'">
                                <div class="stats-item-thumb-wrap">
                                    <img src="${getHighestQualityImage(alb.image)}" 
                                         onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src=window.StatsEngine.getSongPlaceholderSvg('${safeAlbTitle}','${safeAlbArtist}');}" 
                                         class="stats-item-thumb" 
                                         alt="${escQuot(albTitle)}">
                                </div>
                                <div class="stats-item-title" title="${escQuot(albTitle)}">${idx + 1}. ${albTitle}</div>
                                <div class="stats-item-sub" title="${escQuot(albArtist)}">${albArtist}</div>
                                <span class="stats-item-count-badge">${alb.playCount} plays • ${window.StatsEngine.formatTime(alb.totalListenMs)}</span>
                            </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div style="color: var(--text-secondary); padding: 20px 0; text-align: center;">No album plays recorded in this period.</div>
                `}
            </div>
        </div>

        <div id="stats-toast" class="stats-toast"></div>
    `;

    globalLoading.style.display = 'none';

    // Auto-fetch authentic covers for any songs currently using placeholder or broken YouTube
    if (agg.topSongs && agg.topSongs.length > 0) {
        agg.topSongs.slice(0, 12).forEach(s => {
            const sTitle = cleanStr(s.title);
            const sArtist = cleanStr(s.artist);
            if (!s.image || s.image.startsWith('data:image/svg') || s.image.includes('placeholder') || (s.image.includes('ytimg.com') && !/^[a-zA-Z0-9_-]{11}$/.test(s.id))) {
                window.StatsEngine.fetchSongImageAsync(sTitle, sArtist, s.id);
            }
        });
    }

    // Auto-fetch authentic artist photos for any visible artists currently using placeholder
    if (agg.topArtists && agg.topArtists.length > 0) {
        agg.topArtists.slice(0, 12).forEach(a => {
            const aName = cleanStr(a.name);
            if (!a.image || a.image.startsWith('data:image/svg') || a.image.includes('placeholder')) {
                window.StatsEngine.fetchArtistImageAsync(aName, a.id);
            }
        });
    }
}

window.switchStatsMode = function(mode) {
    window.currentStatsMode = mode;
    window.currentStatsChipIndex = 0;
    renderStats();
    if (window.airScrollTop) window.airScrollTop();
};

window.setStatsChipIndex = function(idx) {
    window.currentStatsChipIndex = idx;
    renderStats();
    if (window.airScrollTop) window.airScrollTop();
};

window.shuffleMostPlayedStats = function() {
    const events = window.StatsEngine.getEvents();
    const agg = window.StatsEngine.aggregate(events);
    if (!agg.topSongs || agg.topSongs.length === 0) {
        window.showStatsToast("No played songs to shuffle!");
        return;
    }
    const shuffled = [...agg.topSongs].sort(() => Math.random() - 0.5);
    window.playList(shuffled, 0);
    window.showStatsToast(`Shuffling ${shuffled.length} top played songs!`);
};

/* ==========================================================================
   AIRBEATS INSIGHT MODAL ("Discover Your Musical Year / Journey")
   ========================================================================== */
window.openInsightModal = function() {
    const cleanStr = (v) => window.StatsEngine.cleanStr(v);
    const escApos = (v) => window.StatsEngine.escApos(v);
    const escQuot = (v) => window.StatsEngine.escQuot(v);

    const events = window.StatsEngine.getEvents();
    const agg = window.StatsEngine.aggregate(events);
    const profile = window.StatsEngine.getProfile();
    const currentYear = new Date().getFullYear();
    const topSong = agg.topSongs[0] || null;
    const topArtist = agg.topArtists[0] || null;
    const totalMins = Math.round(agg.totalListenMs / 60000);

    const topSongTitle = topSong ? cleanStr(topSong.title) : '';
    const topSongArtist = topSong ? cleanStr(topSong.artist) : '';
    const topArtistName = topArtist ? cleanStr(topArtist.name) : '';

    const overlay = document.createElement('div');
    overlay.className = 'insight-modal-overlay';
    overlay.id = 'airbeats-insight-modal';
    overlay.onclick = (e) => {
        if (e.target === overlay) window.closeInsightModal();
    };

    overlay.innerHTML = `
        <div class="insight-modal-card">
            <div class="insight-header">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-sparkles" style="font-size: 24px; color: var(--accent-text);"></i>
                    <div>
                        <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #fff;">AirBeats Insight</h2>
                        <div style="font-size: 13px; color: var(--text-secondary);">Your personalized musical journey</div>
                    </div>
                </div>
                <button onclick="window.closeInsightModal()" style="background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- HERO RECAP BANNER -->
            <div class="insight-hero-banner">
                <div class="insight-persona-pill">
                    <i class="fas fa-compact-disc"></i> ${agg.persona}
                </div>
                <h1 style="font-size: 32px; font-weight: 900; margin: 0 0 4px 0; letter-spacing: -0.5px;">Your Musical Year</h1>
                <div style="font-size: 46px; font-weight: 900; line-height: 1.1; margin-bottom: 8px;">${currentYear}</div>
                <div style="font-size: 14px; opacity: 0.9;">${profile.name}'s streaming universe powered by Airbeats</div>
            </div>

            <!-- KEY HIGHLIGHTS -->
            <div class="insight-highlights-grid">
                <div class="insight-mini-card" ${topSong ? `onclick="window.playSingleTrack('${topSong.id}')" style="cursor: pointer;"` : ''}>
                    <div class="insight-mini-thumb-wrap">
                        <img src="${topSong ? getHighestQualityImage(topSong.image) : window.StatsEngine.getSongPlaceholderSvg('', '')}" 
                             onload="if(this.naturalWidth<=120&&this.naturalHeight<=90){this.src=window.StatsEngine.getSongPlaceholderSvg('${escApos(topSongTitle)}','${escApos(topSongArtist)}');}" 
                             onerror="this.src=window.StatsEngine.getSongPlaceholderSvg('${escApos(topSongTitle)}','${escApos(topSongArtist)}');" 
                             class="insight-mini-thumb" 
                             alt="${escQuot(topSongTitle) || 'Top Track'}">
                    </div>
                    <div style="overflow: hidden;">
                        <div style="font-size: 11px; font-weight: 700; color: var(--accent-text); text-transform: uppercase;">Top Track</div>
                        <div style="font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${escQuot(topSongTitle) || 'None yet'}
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            ${topSong ? `${topSong.playCount} plays` : 'Keep streaming'}
                        </div>
                    </div>
                </div>

                <div class="insight-mini-card" ${topArtist ? `onclick="location.hash='#artist/${topArtist.id}'" style="cursor: pointer;"` : ''}>
                    <div class="insight-mini-thumb-wrap round">
                        <img src="${topArtist ? getHighestQualityImage(topArtist.image) : window.StatsEngine.getArtistPlaceholderSvg('Artist')}" 
                             data-artist-name="${escQuot(topArtistName)}" 
                             data-artist-id="${topArtist ? topArtist.id : ''}" 
                             onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src=window.StatsEngine.getArtistPlaceholderSvg('${escApos(topArtistName) || 'Artist'}');}" 
                             class="insight-mini-thumb round" 
                             alt="${escQuot(topArtistName) || 'Top Artist'}">
                    </div>
                    <div style="overflow: hidden;">
                        <div style="font-size: 11px; font-weight: 700; color: var(--accent-text); text-transform: uppercase;">Top Artist</div>
                        <div style="font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${escQuot(topArtistName) || 'None yet'}
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            ${topArtist ? `${topArtist.playCount} plays` : 'Keep streaming'}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4 FEATURE METRIC BOXES -->
            <div class="insight-feature-icons">
                <div class="insight-feature-box">
                    <span class="insight-feature-emoji">⏱️</span>
                    <div style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 2px;">${totalMins.toLocaleString()}</div>
                    <div class="insight-feature-label">Minutes<br>Listened</div>
                </div>
                <div class="insight-feature-box">
                    <span class="insight-feature-emoji">🎵</span>
                    <div style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 2px;">${agg.uniqueSongs}</div>
                    <div class="insight-feature-label">Tracks<br>Explored</div>
                </div>
                <div class="insight-feature-box">
                    <span class="insight-feature-emoji">🎤</span>
                    <div style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 2px;">${agg.topArtists.length}</div>
                    <div class="insight-feature-label">Artists<br>Discovered</div>
                </div>
                <div class="insight-feature-box">
                    <span class="insight-feature-emoji">🏆</span>
                    <div style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 2px;">${agg.totalScrobbles}</div>
                    <div class="insight-feature-label">Total<br>Scrobbles</div>
                </div>
            </div>

            <!-- ACTIONS -->
            <div class="insight-actions">
                <button class="stats-action-btn stats-action-btn-insight" style="flex: 1; justify-content: center;" onclick="window.copyInsightReport()">
                    <i class="fas fa-share-nodes"></i> Share & Copy Summary
                </button>
                <button class="stats-action-btn" style="flex: 1; justify-content: center;" onclick="window.shuffleMostPlayedStats(); window.closeInsightModal();">
                    <i class="fas fa-play"></i> Play Insight Queue
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    if (topArtist && (!topArtist.image || topArtist.image.startsWith('data:image/svg'))) {
        window.StatsEngine.fetchArtistImageAsync(topArtistName, topArtist.id);
    }
};

window.closeInsightModal = function() {
    const modal = document.getElementById('airbeats-insight-modal');
    if (modal) modal.remove();
};

window.copyInsightReport = function() {
    const cleanStr = (v) => window.StatsEngine.cleanStr(v);
    const events = window.StatsEngine.getEvents();
    const agg = window.StatsEngine.aggregate(events);
    const profile = window.StatsEngine.getProfile();
    const topSong = agg.topSongs[0] ? cleanStr(agg.topSongs[0].title) + ' by ' + cleanStr(agg.topSongs[0].artist) : 'N/A';
    const topArtist = agg.topArtists[0] ? cleanStr(agg.topArtists[0].name) : 'N/A';

    const text = `🎧 My AirBeats Insight Summary:
👤 Listener: ${profile.name}
✨ Persona: ${agg.persona}
⏱️ Listening Time: ${window.StatsEngine.formatTime(agg.totalListenMs)}
🎵 Top Song: ${topSong}
🎤 Top Artist: ${topArtist}
📊 Unique Songs: ${agg.uniqueSongs} | Total Scrobbles: ${agg.totalScrobbles}
Stream high-quality music on Airbeats!`;

    navigator.clipboard.writeText(text).then(() => {
        window.showStatsToast("Insight summary copied to clipboard!");
    }).catch(() => {
        window.showStatsToast("Report copied!");
    });
};

/* ==========================================================================
   PROFILE & RANK BADGE CUSTOMIZER MODAL
   ========================================================================== */
window.openProfileCustomizerModal = function() {
    const profile = window.StatsEngine.getProfile();
    const totalHours = window.StatsEngine.getTotalHours();
    const realRank = window.StatsEngine.getCurrentRank(totalHours);
    const selectedBadge = profile.displayedBadge || '';

    const avatarPresets = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face'
    ];

    const overlay = document.createElement('div');
    overlay.className = 'insight-modal-overlay';
    overlay.id = 'airbeats-profile-modal';
    overlay.onclick = (e) => {
        if (e.target === overlay) window.closeProfileModal();
    };

    overlay.innerHTML = `
        <div class="insight-modal-card" style="max-width: 580px;">
            <div class="insight-header">
                <div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #fff;">Profile & Badge Customizer</h2>
                    <div style="font-size: 13px; color: var(--text-secondary);">Personalize your display identity on Airbeats</div>
                </div>
                <button onclick="window.closeProfileModal()" style="background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- NAME INPUT -->
            <div style="margin-bottom: 22px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase;">
                    Display Name
                </label>
                <input type="text" id="custom-profile-name" value="${profile.name}" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #fff; font-size: 15px; font-weight: 600; outline: none;">
            </div>

            <!-- AVATAR SELECTION -->
            <div style="margin-bottom: 22px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 10px; text-transform: uppercase;">
                    Choose Avatar
                </label>
                <div style="display: flex; gap: 12px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 4px;">
                    ${avatarPresets.map(av => `
                        <img src="${av}" onclick="window.selectAvatarPreset('${av}')" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 2px solid ${profile.avatar === av ? 'var(--accent)' : 'transparent'}; transition: transform 0.2s;" class="preset-avatar-option" alt="Preset">
                    `).join('')}
                </div>
                <input type="text" id="custom-profile-avatar" value="${profile.avatar}" placeholder="Or paste custom image URL..." style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; color: var(--text-secondary); font-size: 13px; outline: none;">
            </div>

            <!-- BADGE SHOWCASE GRID -->
            <div style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                    <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">
                        Showcase Badge
                    </label>
                    <span style="font-size: 11px; color: var(--accent-text); cursor: pointer;" onclick="window.selectBadgeAuto()">
                        Auto (Highest Rank: ${realRank.name})
                    </span>
                </div>
                <div class="badge-selector-grid">
                    ${window.StatsEngine.RANKS.map(rank => {
                        const isUnlocked = totalHours >= rank.threshold;
                        const isSelected = selectedBadge ? selectedBadge.toLowerCase() === rank.name.toLowerCase() : (!selectedBadge && rank.name === realRank.name);
                        return `
                            <div class="badge-select-item ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}" onclick="${isUnlocked ? `window.selectBadgeChoice('${rank.name}')` : `window.showStatsToast('Requires ${rank.threshold} listening hours (current: ${totalHours.toFixed(1)}h)')`}">
                                ${!isUnlocked ? '<i class="fas fa-lock lock-icon"></i>' : ''}
                                ${window.StatsEngine.renderRankBadge(rank.name, 36)}
                                <div class="badge-name-lbl">${rank.name}</div>
                                <div class="badge-hrs-lbl">${rank.threshold}h</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- SAVE BUTTON -->
            <button class="stats-action-btn stats-action-btn-insight" style="width: 100%; justify-content: center; padding: 14px;" onclick="window.saveCustomizedProfile()">
                <i class="fas fa-check"></i> Save Changes
            </button>
        </div>
    `;

    document.body.appendChild(overlay);
};

window.closeProfileModal = function() {
    const modal = document.getElementById('airbeats-profile-modal');
    if (modal) modal.remove();
};

window.selectedCustomBadge = null;

window.selectAvatarPreset = function(url) {
    const inp = document.getElementById('custom-profile-avatar');
    if (inp) inp.value = url;
    document.querySelectorAll('.preset-avatar-option').forEach(img => {
        img.style.borderColor = (img.src === url) ? 'var(--accent)' : 'transparent';
    });
};

window.selectBadgeChoice = function(badgeName) {
    window.selectedCustomBadge = badgeName;
    document.querySelectorAll('.badge-select-item').forEach(el => el.classList.remove('selected'));
    const clicked = Array.from(document.querySelectorAll('.badge-select-item')).find(el => el.innerText.includes(badgeName));
    if (clicked) clicked.classList.add('selected');
};

window.selectBadgeAuto = function() {
    window.selectedCustomBadge = '';
    document.querySelectorAll('.badge-select-item').forEach(el => el.classList.remove('selected'));
    window.showStatsToast("Set to auto-show highest rank!");
};

window.saveCustomizedProfile = function() {
    const name = document.getElementById('custom-profile-name').value;
    const avatar = document.getElementById('custom-profile-avatar').value;
    window.StatsEngine.saveProfile(name, avatar, window.selectedCustomBadge);
    window.closeProfileModal();
    window.showStatsToast("Profile updated successfully!");
    renderStats();
};

window.showStatsToast = function(msg) {
    let toast = document.getElementById('stats-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'stats-toast';
        toast.className = 'stats-toast';
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
};



/* ==========================================================================
   DYNAMIC NOW PLAYING RIGHT-PANEL CONTROLLER
   ========================================================================== */
window.toggleRightPanel = function(show) {
    const hasTrack = document.body.classList.contains('has-active-track');
    if (show === undefined) {
        if (!hasTrack) return;
        document.body.classList.toggle('right-panel-collapsed');
    } else if (show) {
        document.body.classList.remove('right-panel-collapsed');
    } else {
        document.body.classList.add('right-panel-collapsed');
    }
};

if (window.audio) {
    audio.addEventListener('play', () => {
        document.body.classList.add('has-active-track');
        document.body.classList.remove('right-panel-collapsed');
        const toggleBtn = document.getElementById('topNowPlayingToggle');
        if (toggleBtn) toggleBtn.style.display = 'inline-block';
    });
}

// Hook into song playback to reveal right-panel automatically
(function() {
    const origPlaySingle = window.playSingleTrack;
    if (typeof origPlaySingle === 'function') {
        window.playSingleTrack = async function() {
            document.body.classList.add('has-active-track');
            document.body.classList.remove('right-panel-collapsed');
            const toggleBtn = document.getElementById('topNowPlayingToggle');
            if (toggleBtn) toggleBtn.style.display = 'inline-block';
            return origPlaySingle.apply(this, arguments);
        };
    }
    const origPlayList = window.playList;
    if (typeof origPlayList === 'function') {
        window.playList = function() {
            document.body.classList.add('has-active-track');
            document.body.classList.remove('right-panel-collapsed');
            const toggleBtn = document.getElementById('topNowPlayingToggle');
            if (toggleBtn) toggleBtn.style.display = 'inline-block';
            return origPlayList.apply(this, arguments);
        };
    }
})();

// Observe player title to detect active song
document.addEventListener('DOMContentLoaded', () => {
    const pTitle = document.getElementById('playerTitle');
    if (pTitle) {
        const obs = new MutationObserver(() => {
            const txt = (pTitle.innerText || '').trim();
            if (txt && txt.toLowerCase() !== 'no song') {
                document.body.classList.add('has-active-track');
                document.body.classList.remove('right-panel-collapsed');
                const toggleBtn = document.getElementById('topNowPlayingToggle');
                if (toggleBtn) toggleBtn.style.display = 'inline-block';
            }
        });
        obs.observe(pTitle, { childList: true, subtree: true, characterData: true });
    }
});

// ==========================================================================
// VOLUME ENGINE & PLAYER MORE BOTTOM SHEET
// ==========================================================================

// Initialize saved volume
(function() {
    try {
        const savedVol = localStorage.getItem('player_volume');
        if (savedVol !== null && !isNaN(parseFloat(savedVol))) {
            audio.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
        } else {
            audio.volume = 1.0;
        }
    } catch(e) {}
})();

window.openPlayerMoreMenu = function() {
    const overlay = document.getElementById('playerMoreSheetOverlay');
    const sheet = document.getElementById('playerMoreSheet');
    if (!overlay) return;

    if (sheet) {
        sheet.style.transform = '';
        sheet.style.transition = '';
    }
    window.updateSheetTrackInfo();
    window.updateSheetVolumeUI();

    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
        overlay.classList.add('open');
    });
};

window.closePlayerMoreMenu = function(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn') && !e.target.classList.contains('sheet-handle-bar') && !e.target.closest('.sheet-close-btn') && !e.target.closest('.sheet-handle-bar')) {
        return;
    }
    const overlay = document.getElementById('playerMoreSheetOverlay');
    const sheet = document.getElementById('playerMoreSheet');
    if (!overlay) return;

    overlay.classList.remove('open');
    if (sheet) {
        sheet.style.transform = '';
    }
    setTimeout(() => {
        if (!overlay.classList.contains('open')) {
            overlay.style.display = 'none';
        }
    }, 320);
};

// Drag & touch down gesture support for the bottom sheet
(function setupSheetDrag() {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const onStart = (clientY) => {
        const sheet = document.getElementById('playerMoreSheet');
        if (!sheet) return;
        startY = clientY;
        currentY = clientY;
        isDragging = true;
        sheet.style.transition = 'none';
    };

    const onMove = (clientY) => {
        if (!isDragging) return;
        const sheet = document.getElementById('playerMoreSheet');
        if (!sheet) return;
        const delta = clientY - startY;
        if (delta > 0) {
            sheet.style.transform = `translateY(${delta}px)`;
        }
    };

    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const sheet = document.getElementById('playerMoreSheet');
        if (!sheet) return;
        sheet.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        const delta = currentY - startY;
        if (delta > 90) {
            window.closePlayerMoreMenu();
        } else {
            sheet.style.transform = 'translateY(0)';
        }
    };

    const initListeners = () => {
        const handle = document.querySelector('.sheet-handle-bar');
        const header = document.querySelector('.sheet-header');

        [handle, header].forEach(el => {
            if (!el) return;
            el.addEventListener('mousedown', (e) => onStart(e.clientY));
            el.addEventListener('touchstart', (e) => onStart(e.touches[0].clientY), { passive: true });
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                currentY = e.clientY;
                onMove(e.clientY);
            }
        });
        window.addEventListener('touchmove', (e) => {
            if (isDragging) {
                currentY = e.touches[0].clientY;
                onMove(e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initListeners);
    } else {
        initListeners();
    }
})();

window.updateSheetTrackInfo = function() {
    const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
    const titleEl = document.getElementById('sheetTrackTitle');
    const artistEl = document.getElementById('sheetTrackArtist');
    const imgEl = document.getElementById('sheetTrackImage');

    const trackTitle = track ? (track.name || track.title || '') : '';
    const trackArtist = track ? (track.subtitle || track.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist') : '';

    if (track && trackTitle) {
        if (titleEl) titleEl.textContent = trackTitle;
        if (artistEl) artistEl.textContent = trackArtist;
        if (imgEl) {
            imgEl.src = getHighestQualityImage(track.image);
            imgEl.classList.remove('skeleton');
        }
    } else {
        if (titleEl) titleEl.textContent = 'No song playing';
        if (artistEl) artistEl.textContent = 'Select a song to start listening';
        if (imgEl) {
            imgEl.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            imgEl.classList.add('skeleton');
        }
    }
};

window.onSheetVolumeInput = function(val) {
    const num = parseInt(val, 10);
    const frac = Math.max(0, Math.min(1, num / 100));
    audio.volume = frac;
    if (frac > 0 && audio.muted) {
        audio.muted = false;
    }
    try {
        localStorage.setItem('player_volume', frac);
    } catch(e) {}
    window.updateSheetVolumeUI();
};

window.updateSheetVolumeUI = function() {
    const slider = document.getElementById('sheetVolumeSlider');
    const label = document.getElementById('sheetVolVal');
    const muteBtn = document.getElementById('sheetMuteBtn');
    const icon = document.getElementById('sheetVolIcon');

    const cur = Math.round((audio.volume || 0) * 100);
    const isMuted = audio.muted || cur === 0;

    let iconClass = 'fa-volume-up';
    if (isMuted) {
        iconClass = 'fa-volume-mute';
    } else if (cur < 50) {
        iconClass = 'fa-volume-down';
    }

    if (slider) {
        const sliderVal = isMuted ? 0 : cur;
        slider.value = sliderVal;
        slider.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${sliderVal}%, rgba(255,255,255,0.15) ${sliderVal}%, rgba(255,255,255,0.15) 100%)`;
    }
    if (label) {
        label.textContent = isMuted ? 'Muted' : `${cur}%`;
    }
    if (muteBtn) {
        muteBtn.innerHTML = `<i class="fas ${iconClass}"></i>`;
        muteBtn.style.color = isMuted ? 'var(--accent)' : '#ffffff';
    }
    if (icon) {
        icon.className = `fas ${iconClass}`;
    }
};

// Sheet actions
window.activateAlwaysOnDisplayFromSheet = function() {
    window.closePlayerMoreMenu();
    setTimeout(() => {
        window.activateAlwaysOnDisplay(true);
    }, 150);
};

window.downloadFromSheet = function() {
    window.closePlayerMoreMenu();
    window.downloadCurrentSong();
};

window.listenTogetherFromSheet = function() {
    window.closePlayerMoreMenu();
    window.openListenTogetherModal();
};

window.addToPlaylistFromSheet = function() {
    window.closePlayerMoreMenu();
    const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
    if (track) {
        window.openPlaylistModal(track.id);
    } else if (window.showToast) {
        window.showToast('No song is currently playing');
    }
};

window.lyricsFromSheet = function() {
    window.closePlayerMoreMenu();
    window.toggleLyrics();
};

window.openAodSettingsFromSheet = function() {
    window.closePlayerMoreMenu();
    window.location.hash = '#settings/aod';
};

// ==========================================================================
// ALWAYS ON DISPLAY (AOD) ENGINE
// ==========================================================================

window.aodClockInterval = null;
window.aodWakeLock = null;
window.aodIslandWasOn = false;

window.activateAlwaysOnDisplay = async function(requestFs = true) {
    const aod = document.getElementById('alwaysOnDisplayOverlay');
    if (!aod) return;

    aod.style.display = 'flex';
    document.body.classList.add('aod-active');

    // Dynamic Island is off during AOD — hidden at runtime only; the saved
    // preference (localStorage) is untouched and it restores on exit.
    window.aodIslandWasOn = localStorage.getItem('dynamic_island_enabled') === 'true';
    if (window.aodIslandWasOn && window.electronAPI && window.electronAPI.toggleDynamicIsland) {
        window.electronAPI.toggleDynamicIsland(false);
    }

    window.applyAodSettingsToView();
    window.updateAodTrackInfo();
    window.updateAodPlaybackState();
    window.updateAodProgress();
    window.startAodClock();

    const fsMode = localStorage.getItem('aod_fullscreen_mode') !== 'false';
    if (requestFs && fsMode) {
        try {
            if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    await document.documentElement.webkitRequestFullscreen();
                }
            }
        } catch(e) {
            console.log('Fullscreen request bypassed:', e);
        }
    }

    if ('wakeLock' in navigator) {
        try {
            window.aodWakeLock = await navigator.wakeLock.request('screen');
        } catch(e) {
            console.log('WakeLock not granted:', e);
        }
    }
};

window.exitAlwaysOnDisplay = async function() {
    const aod = document.getElementById('alwaysOnDisplayOverlay');
    if (aod) aod.style.display = 'none';
    document.body.classList.remove('aod-active');

    if (window.aodClockInterval) {
        clearInterval(window.aodClockInterval);
        window.aodClockInterval = null;
    }

    if (window.aodWakeLock) {
        try { await window.aodWakeLock.release(); } catch(e){}
        window.aodWakeLock = null;
    }

    if (document.fullscreenElement) {
        try {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        } catch(e) {}
    }

    // Bring the island back if it was on before AOD. setDynamicIsland(true)
    // pushes the current track itself (the island window is created async).
    if (window.aodIslandWasOn && window.electronAPI && window.electronAPI.toggleDynamicIsland) {
        window.setDynamicIsland(true);
    }
    window.aodIslandWasOn = false;
};

window.startAodClock = function() {
    if (window.aodClockInterval) clearInterval(window.aodClockInterval);
    const update = () => {
        const clockEl = document.getElementById('aodClock');
        if (!clockEl) return;
        const is24h = localStorage.getItem('aod_clock_24h') !== 'false';
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const minsStr = minutes < 10 ? '0' + minutes : minutes;

        if (is24h) {
            const hrsStr = hours < 10 ? '0' + hours : hours;
            clockEl.textContent = `${hrsStr}:${minsStr}`;
        } else {
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            clockEl.textContent = `${hours}:${minsStr} ${ampm}`;
        }
    };
    update();
    window.aodClockInterval = setInterval(update, 1000);
};

window.applyAodSettingsToView = function() {
    const content = document.getElementById('aodContentContainer');
    const art = document.getElementById('aodArtImage');
    const clock = document.getElementById('aodClock');
    const title = document.getElementById('aodTitle');
    const artist = document.getElementById('aodArtist');
    const progress = document.getElementById('aodProgressSection');
    const controls = document.getElementById('aodControlsRow');
    const timeRow = document.getElementById('aodTimeRow');
    const bgLayer = document.getElementById('aodBackgroundLayer');
    const spotlightLayer = document.getElementById('aodSpotlightLayer');

    const style = (localStorage.getItem('aod_style') || 'CLASSIC').toLowerCase();
    const shape = (localStorage.getItem('aod_art_shape') || 'ROUNDED').toLowerCase();
    const ctrlStyle = (localStorage.getItem('aod_control_style') || 'ROUNDED').toLowerCase();

    const showClock = localStorage.getItem('aod_show_clock') !== 'false';
    const showTitle = localStorage.getItem('aod_show_title') !== 'false';
    const showArtist = localStorage.getItem('aod_show_artist') !== 'false';
    const showProgress = localStorage.getItem('aod_show_progress') !== 'false';
    const showTime = localStorage.getItem('aod_show_time') !== 'false';
    const showControls = localStorage.getItem('aod_show_controls') !== 'false';
    const pulseAnim = localStorage.getItem('aod_spotlight_pulse') !== 'false';

    const artSize = parseFloat(localStorage.getItem('aod_art_size') || '0.65');
    const darkness = parseFloat(localStorage.getItem('aod_darkness') || '0.6');
    const spotlightIntensity = parseFloat(localStorage.getItem('aod_spotlight_intensity') || '0.75');

    // Style classes
    if (content) {
        content.className = `aod-content aod-style-${style}`;
    }
    if (controls) {
        controls.className = `aod-controls-row aod-ctrls-${ctrlStyle}`;
    }
    if (art) {
        art.className = `aod-art aod-shape-${shape}`;
        // Dynamic art sizing based on fraction (200px to 380px)
        const px = Math.round(180 + artSize * 220);
        art.style.width = style === 'minimal' ? '170px' : (style === 'large' ? '380px' : `${px}px`);
        art.style.height = style === 'minimal' ? '170px' : (style === 'large' ? '380px' : `${px}px`);
    }

    // Visibility toggles
    if (clock) clock.style.display = showClock ? 'block' : 'none';
    if (title) title.style.display = showTitle ? 'block' : 'none';
    if (artist) artist.style.display = showArtist ? 'block' : 'none';
    if (progress) progress.style.display = showProgress ? 'block' : 'none';
    if (timeRow) timeRow.style.display = showTime ? 'flex' : 'none';
    if (controls) controls.style.display = showControls ? 'flex' : 'none';

    // Ambient layers
    if (bgLayer) {
        bgLayer.style.opacity = style === 'background' ? Math.max(0.1, 1 - darkness).toString() : '0';
    }
    if (spotlightLayer) {
        spotlightLayer.style.opacity = style === 'spotlight' ? spotlightIntensity.toString() : '0';
        if (pulseAnim && style === 'spotlight') {
            spotlightLayer.classList.add('pulse-anim');
        } else {
            spotlightLayer.classList.remove('pulse-anim');
        }
    }
};

window.updateAodTrackInfo = function() {
    const aod = document.getElementById('alwaysOnDisplayOverlay');
    if (!aod || aod.style.display === 'none') return;

    const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
    const titleEl = document.getElementById('aodTitle');
    const artistEl = document.getElementById('aodArtist');
    const artEl = document.getElementById('aodArtImage');
    const bgLayer = document.getElementById('aodBackgroundLayer');
    const spotlightLayer = document.getElementById('aodSpotlightLayer');

    if (track && track.name) {
        const imgUrl = getHighestQualityImage(track.image);
        if (titleEl) titleEl.textContent = track.name;
        if (artistEl) artistEl.textContent = track.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist';
        if (artEl) artEl.src = imgUrl;
        if (bgLayer) bgLayer.style.backgroundImage = `url('${imgUrl}')`;
    } else {
        if (titleEl) titleEl.textContent = 'No Song Playing';
        if (artistEl) artistEl.textContent = 'AirBeats Ambient Display';
        if (artEl) artEl.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        if (bgLayer) bgLayer.style.backgroundImage = 'none';
    }
};

window.updateAodPlaybackState = function() {
    const icon = document.getElementById('aodPlayIcon');
    if (icon) {
        icon.className = audio.paused ? 'fas fa-play' : 'fas fa-pause';
    }
};

window.updateAodProgress = function() {
    const aod = document.getElementById('alwaysOnDisplayOverlay');
    if (!aod || aod.style.display === 'none') return;

    const curEl = document.getElementById('aodCurrentTime');
    const durEl = document.getElementById('aodDuration');
    const fill = document.getElementById('aodProgressFill');
    const thumb = document.getElementById('aodProgressThumb');

    if (curEl) curEl.textContent = formatTime(audio.currentTime);
    if (durEl) durEl.textContent = formatTime(audio.duration);

    if (fill && thumb) {
        const pct = audio.duration ? Math.min(100, Math.max(0, (audio.currentTime / audio.duration) * 100)) : 0;
        fill.style.width = pct + '%';
        thumb.style.left = pct + '%';
    }
};

window.onAodProgressClick = function(e) {
    const container = document.getElementById('aodProgressBarContainer');
    if (!container || !audio.duration) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, clickX / rect.width));
    if (rect.width && isFinite(audio.duration) && audio.duration > 0) {
        const target = frac * audio.duration;
        if (isFinite(target)) audio.currentTime = target;
    }
    window.updateAodProgress();
};

window.aodTogglePlay = function() {
    const btn = document.getElementById('playPauseBtn');
    if (btn) btn.click();
};

window.aodPrevTrack = function() {
    const btn = document.getElementById('prevBtn');
    if (btn) btn.click();
};

window.aodNextTrack = function() {
    const btn = document.getElementById('nextBtn');
    if (btn) btn.click();
};

// Keyboard listener for Escape key to exit AOD or close bottom sheet
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const aod = document.getElementById('alwaysOnDisplayOverlay');
        if (aod && aod.style.display !== 'none') {
            window.exitAlwaysOnDisplay();
        }
        const sheet = document.getElementById('playerMoreSheetOverlay');
        if (sheet && sheet.style.display !== 'none') {
            window.closePlayerMoreMenu();
        }
    }
});

// ==========================================================================
// ALWAYS ON DISPLAY SETTINGS PAGE (Faithful to Android AlwaysOnDisplaySettings.kt)
// ==========================================================================

async function renderSettingsAOD() {
    const curStyle = (localStorage.getItem('aod_style') || 'CLASSIC').toUpperCase();
    const curShape = (localStorage.getItem('aod_art_shape') || 'ROUNDED').toUpperCase();
    const curCtrl = (localStorage.getItem('aod_control_style') || 'ROUNDED').toUpperCase();

    const showClock = localStorage.getItem('aod_show_clock') !== 'false';
    const clock24h = localStorage.getItem('aod_clock_24h') !== 'false';
    const showTitle = localStorage.getItem('aod_show_title') !== 'false';
    const showArtist = localStorage.getItem('aod_show_artist') !== 'false';
    const showProgress = localStorage.getItem('aod_show_progress') !== 'false';
    const showTime = localStorage.getItem('aod_show_time') !== 'false';
    const showControls = localStorage.getItem('aod_show_controls') !== 'false';
    const fullscreenMode = localStorage.getItem('aod_fullscreen_mode') !== 'false';
    const pulseAnim = localStorage.getItem('aod_spotlight_pulse') !== 'false';

    const artSize = parseFloat(localStorage.getItem('aod_art_size') || '0.65');
    const darkness = parseFloat(localStorage.getItem('aod_darkness') || '0.6');
    const spotlightIntensity = parseFloat(localStorage.getItem('aod_spotlight_intensity') || '0.75');

    const styles = [
        { id: 'CLASSIC', name: 'Classic', icon: 'fa-compress-arrows-alt', desc: 'Centered artwork with time, progress bar, and controls' },
        { id: 'BACKGROUND', name: 'Background', icon: 'fa-image', desc: 'Blurred, dimmed artwork filling the entire background' },
        { id: 'MINIMAL', name: 'Minimal', icon: 'fa-circle-notch', desc: 'High-contrast typography with compact artwork disc' },
        { id: 'LARGE', name: 'Large', icon: 'fa-expand-arrows-alt', desc: 'Edge-to-edge large artwork with floating controls' },
        { id: 'SPOTLIGHT', name: 'Spotlight', icon: 'fa-sun', desc: 'Vibrant radiant color aura glowing behind the artwork' }
    ];

    const shapes = [
        { id: 'ROUNDED', name: 'Rounded', shapeClass: 'aod-shape-rounded' },
        { id: 'CIRCLE', name: 'Circle', shapeClass: 'aod-shape-circle' },
        { id: 'SQUIRCLE', name: 'Squircle', shapeClass: 'aod-shape-squircle' },
        { id: 'DIAMOND', name: 'Diamond', shapeClass: 'aod-shape-diamond' },
        { id: 'HEXAGON', name: 'Hexagon', shapeClass: 'aod-shape-hexagon' },
        { id: 'STAR', name: 'Star', shapeClass: 'aod-shape-star' },
        { id: 'ARCH', name: 'Arch', shapeClass: 'aod-shape-arch' },
        { id: 'PETAL', name: 'Petal', shapeClass: 'aod-shape-petal' }
    ];

    const controlStyles = [
        { id: 'ROUNDED', name: 'Rounded', desc: 'Circular pill frosted buttons' },
        { id: 'SQUARE', name: 'Square', desc: 'Rounded rectangle buttons' },
        { id: 'ACCENT', name: 'Accent', desc: 'Solid vibrant accent filled' },
        { id: 'MINIMAL_FLAT', name: 'Minimal Flat', desc: 'Clean borderless minimalist' }
    ];

    routerView.innerHTML = `
        <div class="settings-page" style="padding: 20px 30px; max-width: 860px; margin: 0 auto; color: var(--text-primary);">
            <div class="hero-header" style="background: none; border-bottom: 1px solid var(--border-color); margin-bottom: 30px; padding: 10px 0 20px 0;">
                <div class="hero-info">
                    <div class="hero-title" style="font-size: 32px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-moon" style="color: var(--accent-text);"></i> Always On Display
                    </div>
                    <div class="hero-meta" style="color: var(--text-secondary); font-size: 14px;">
                        Customize your ambient OLED screen layout, artwork shapes, digital clock, and controls
                    </div>
                </div>
            </div>

            <!-- QUICK LAUNCH ACTION BANNER -->
            <div style="background: linear-gradient(135deg, rgba(142, 68, 173, 0.25) 0%, var(--search-bg) 100%); padding: 24px; border-radius: 18px; margin-bottom: 28px; border: 1px solid rgba(142, 68, 173, 0.35); display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
                <div>
                    <h3 style="margin: 0 0 6px 0; font-size: 19px; font-weight: 700;">Live Ambient Screen</h3>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 13px;">Experience true pitch-black OLED standby mode on your desktop monitor.</p>
                </div>
                <button class="btn-primary" onclick="window.activateAlwaysOnDisplay(true)" style="padding: 12px 24px; border-radius: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14px;">
                    <i class="fas fa-play"></i> Launch Always On Display
                </button>
            </div>

            <!-- 1. DISPLAY STYLE SELECTION -->
            <div style="background: var(--search-bg); padding: 26px; border-radius: 18px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.06);">
                <h3 style="margin-top: 0; font-size: 19px; font-weight: 700;">Display Style</h3>
                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">Select the visual layout theme for the ambient player (matching the Android app).</p>
                <div class="aod-settings-grid">
                    ${styles.map(s => `
                        <div class="aod-setting-card ${curStyle === s.id ? 'active' : ''}" onclick="window.setAodStyle('${s.id}')">
                            <div class="aod-card-header">
                                <i class="fas ${s.icon} aod-card-icon"></i>
                                <i class="fas fa-check-circle aod-card-check"></i>
                            </div>
                            <div class="aod-card-title">${s.name}</div>
                            <div class="aod-card-desc">${s.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 2. ARTWORK SHAPE SELECTION -->
            <div style="background: var(--search-bg); padding: 26px; border-radius: 18px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.06);">
                <h3 style="margin-top: 0; font-size: 19px; font-weight: 700;">Artwork Shape</h3>
                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">Choose geometric clipping or rounding for the album art cover.</p>
                <div class="aod-shapes-grid">
                    ${shapes.map(shp => `
                        <div class="aod-shape-chip ${curShape === shp.id ? 'active' : ''}" onclick="window.setAodShape('${shp.id}')">
                            <div class="aod-shape-preview-box ${shp.shapeClass}"></div>
                            <div class="aod-shape-chip-name">${shp.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 3. CONTROL BUTTON STYLE -->
            <div style="background: var(--search-bg); padding: 26px; border-radius: 18px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.06);">
                <h3 style="margin-top: 0; font-size: 19px; font-weight: 700;">Playback Controls Style</h3>
                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">Change the styling of the previous, play/pause, and next buttons.</p>
                <div class="aod-settings-grid">
                    ${controlStyles.map(c => `
                        <div class="aod-setting-card ${curCtrl === c.id ? 'active' : ''}" onclick="window.setAodControlStyle('${c.id}')">
                            <div class="aod-card-header">
                                <i class="fas fa-play aod-card-icon"></i>
                                <i class="fas fa-check-circle aod-card-check"></i>
                            </div>
                            <div class="aod-card-title">${c.name}</div>
                            <div class="aod-card-desc">${c.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 4. VISIBILITY & CLOCK TOGGLES -->
            <div style="background: var(--search-bg); padding: 26px; border-radius: 18px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.06);">
                <h3 style="margin-top: 0; font-size: 19px; font-weight: 700;">Screen Elements & Visibility</h3>
                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">Toggle which components appear on the ambient display.</p>

                <div class="aod-switch-row">
                    <div>
                        <div class="aod-switch-label">Show Digital Clock</div>
                        <div class="aod-switch-sub">Display real-time clock at the top of the screen</div>
                    </div>
                    <label class="aod-switch">
                        <input type="checkbox" ${showClock ? 'checked' : ''} onchange="window.setAodPref('aod_show_clock', this.checked)">
                        <span class="aod-slider-toggle"></span>
                    </label>
                </div>

                <div class="aod-switch-row">
                    <div>
                        <div class="aod-switch-label">24-Hour Clock Format</div>
                        <div class="aod-switch-sub">Use 24-hour time (e.g. 19:45) instead of 12-hour AM/PM</div>
                    </div>
                    <label class="aod-switch">
                        <input type="checkbox" ${clock24h ? 'checked' : ''} onchange="window.setAodPref('aod_clock_24h', this.checked)">
                        <span class="aod-slider-toggle"></span>
                    </label>
                </div>

                <div class="aod-switch-row">
                    <div>
                        <div class="aod-switch-label">Show Song Title</div>
                        <div class="aod-switch-sub">Display the current song title below the artwork</div>
                    </div>
                    <label class="aod-switch">
                        <input type="checkbox" ${showTitle ? 'checked' : ''} onchange="window.setAodPref('aod_show_title', this.checked)">
                        <span class="aod-slider-toggle"></span>
                    </label>
                </div>

                <div class="aod-switch-row">
                    <div>
                        <div class="aod-switch-label">Show Artist Name</div>
                        <div class="aod-switch-sub">Display contributing artist names</div>
                    </div>
                    <label class="aod-switch">
                        <input type="checkbox" ${showArtist ? 'checked' : ''} onchange="window.setAodPref('aod_show_artist', this.checked)">
                        <span class="aod-slider-toggle"></span>
                    </label>
                </div>

                <div class="aod-switch-row">
                    <div>
                        <div class="aod-switch-label">Show Progress Bar & Scrubber</div>
                        <div class="aod-switch-sub">Interactive timeline progress with clickable seek</div>
                    </div>
                    <label class="aod-switch">
                        <input type="checkbox" ${showProgress ? 'checked' : ''} onchange="window.setAodPref('aod_show_progress', this.checked)">
                        <span class="aod-slider-toggle"></span>
                    </label>
                </div>

                <div class="aod-switch-row">
                    <div>
                        <div class="aod-switch-label">Show Time Labels</div>
                        <div class="aod-switch-sub">Display elapsed and remaining song duration timestamps</div>
                    </div>
                    <label class="aod-switch">
                        <input type="checkbox" ${showTime ? 'checked' : ''} onchange="window.setAodPref('aod_show_time', this.checked)">
                        <span class="aod-slider-toggle"></span>
                    </label>
                </div>

                <div class="aod-switch-row">
                    <div>
                        <div class="aod-switch-label">Show Playback Controls</div>
                        <div class="aod-switch-sub">Display previous, play/pause, and next buttons</div>
                    </div>
                    <label class="aod-switch">
                        <input type="checkbox" ${showControls ? 'checked' : ''} onchange="window.setAodPref('aod_show_controls', this.checked)">
                        <span class="aod-slider-toggle"></span>
                    </label>
                </div>

                <div class="aod-switch-row">
                    <div>
                        <div class="aod-switch-label">Fullscreen Mode</div>
                        <div class="aod-switch-sub">Automatically enter true browser fullscreen when activating AOD</div>
                    </div>
                    <label class="aod-switch">
                        <input type="checkbox" ${fullscreenMode ? 'checked' : ''} onchange="window.setAodPref('aod_fullscreen_mode', this.checked)">
                        <span class="aod-slider-toggle"></span>
                    </label>
                </div>

                <div class="aod-switch-row">
                    <div>
                        <div class="aod-switch-label">Spotlight Aura Pulse Animation</div>
                        <div class="aod-switch-sub">Gentle breathing pulse effect on the ambient spotlight</div>
                    </div>
                    <label class="aod-switch">
                        <input type="checkbox" ${pulseAnim ? 'checked' : ''} onchange="window.setAodPref('aod_spotlight_pulse', this.checked)">
                        <span class="aod-slider-toggle"></span>
                    </label>
                </div>
            </div>

            <!-- 5. SLIDERS: SIZING, DARKNESS, SPOTLIGHT -->
            <div style="background: var(--search-bg); padding: 26px; border-radius: 18px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.06);">
                <h3 style="margin-top: 0; font-size: 19px; font-weight: 700;">Dimensions & Intensity</h3>
                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">Fine-tune artwork dimensions and background glow parameters.</p>

                <!-- Art Size Slider -->
                <div style="margin-bottom: 22px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 14px; font-weight: 600;">Artwork Size</span>
                        <span id="aodArtSizeVal" style="color: var(--accent-text); font-weight: 700;">${Math.round(artSize * 100)}%</span>
                    </div>
                    <input type="range" min="35" max="85" value="${Math.round(artSize * 100)}" class="sheet-volume-slider" oninput="window.setAodSlider('aod_art_size', this.value / 100, 'aodArtSizeVal', '%')">
                </div>

                <!-- Darkness Dimming Slider -->
                <div style="margin-bottom: 22px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 14px; font-weight: 600;">Background Dimming (Darkness)</span>
                        <span id="aodDarknessVal" style="color: var(--accent-text); font-weight: 700;">${Math.round(darkness * 100)}%</span>
                    </div>
                    <input type="range" min="20" max="90" value="${Math.round(darkness * 100)}" class="sheet-volume-slider" oninput="window.setAodSlider('aod_darkness', this.value / 100, 'aodDarknessVal', '%')">
                </div>

                <!-- Spotlight Intensity Slider -->
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 14px; font-weight: 600;">Spotlight Glow Intensity</span>
                        <span id="aodSpotlightVal" style="color: var(--accent-text); font-weight: 700;">${Math.round(spotlightIntensity * 100)}%</span>
                    </div>
                    <input type="range" min="30" max="100" value="${Math.round(spotlightIntensity * 100)}" class="sheet-volume-slider" oninput="window.setAodSlider('aod_spotlight_intensity', this.value / 100, 'aodSpotlightVal', '%')">
                </div>
            </div>

            <!-- RESET TO DEFAULTS BUTTON -->
            <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
                <button class="btn" onclick="window.resetAodDefaults()" style="background: rgba(255,255,255,0.08); color: var(--text-secondary); padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; border: none;">
                    <i class="fas fa-undo"></i> Reset to Default Settings
                </button>
            </div>
        </div>
    `;

    // Highlight sidebar
    const items = document.querySelectorAll('#sidebar-settings-menu .nav-item');
    items.forEach(el => el.classList.remove('active'));
    const current = document.getElementById('nav-settings-aod');
    if (current) current.classList.add('active');
}

window.setAodStyle = function(id) {
    localStorage.setItem('aod_style', id);
    renderSettingsAOD();
};

window.setAodShape = function(id) {
    localStorage.setItem('aod_art_shape', id);
    renderSettingsAOD();
};

window.setAodControlStyle = function(id) {
    localStorage.setItem('aod_control_style', id);
    renderSettingsAOD();
};

window.setAodPref = function(key, val) {
    localStorage.setItem(key, val ? 'true' : 'false');
};

window.setAodSlider = function(key, val, labelId, suffix = '') {
    localStorage.setItem(key, val.toString());
    const label = document.getElementById(labelId);
    if (label) label.textContent = `${Math.round(val * 100)}${suffix}`;
};

window.resetAodDefaults = function() {
    localStorage.setItem('aod_style', 'CLASSIC');
    localStorage.setItem('aod_art_shape', 'ROUNDED');
    localStorage.setItem('aod_control_style', 'ROUNDED');
    localStorage.setItem('aod_show_clock', 'true');
    localStorage.setItem('aod_clock_24h', 'true');
    localStorage.setItem('aod_show_title', 'true');
    localStorage.setItem('aod_show_artist', 'true');
    localStorage.setItem('aod_show_progress', 'true');
    localStorage.setItem('aod_show_time', 'true');
    localStorage.setItem('aod_show_controls', 'true');
    localStorage.setItem('aod_fullscreen_mode', 'true');
    localStorage.setItem('aod_spotlight_pulse', 'true');
    localStorage.setItem('aod_art_size', '0.65');
    localStorage.setItem('aod_darkness', '0.6');
    localStorage.setItem('aod_spotlight_intensity', '0.75');
    renderSettingsAOD();
};


window.artistAvatarCache = {};

window.handleArtistImgError = function(imgEl, artistId, artistName) {
    if (!imgEl) return;
    imgEl.onerror = null;
    imgEl.onload = null;

    const wrap = imgEl.parentElement;
    const showInitial = () => {
        if (!wrap) return;
        const initial = (artistName || 'A').charAt(0).toUpperCase();
        imgEl.style.display = 'none';
        if (!wrap.querySelector('.asc-avatar-initial')) {
            const initDiv = document.createElement('div');
            initDiv.className = 'asc-avatar-initial';
            initDiv.innerText = initial;
            wrap.appendChild(initDiv);
        }
    };

    // Check memory cache
    const key = (artistId || artistName || '').toLowerCase();
    if (key && window.artistAvatarCache[key]) {
        imgEl.src = window.artistAvatarCache[key];
        imgEl.style.display = 'block';
        const initDiv = wrap.querySelector('.asc-avatar-initial');
        if (initDiv) initDiv.remove();
        return;
    }

    // Proactively fetch
    window.proactiveFetchArtistImage(artistId, artistName, imgEl);
};

window.proactiveFetchArtistImage = function(artistId, artistName, imgEl) {
    const key = (artistId || artistName || '').toLowerCase();
    if (!key) return;

    if (window.artistAvatarCache[key]) {
        if (imgEl) {
            imgEl.src = window.artistAvatarCache[key];
            imgEl.style.display = 'block';
            const initDiv = imgEl.parentElement ? imgEl.parentElement.querySelector('.asc-avatar-initial') : null;
            if (initDiv) initDiv.remove();
        }
        return;
    }

    const applyImg = (imgUrl) => {
        if (!imgUrl || imgUrl.includes('placeholder')) return;
        window.artistAvatarCache[key] = imgUrl;

        // Update any matching elements on screen
        document.querySelectorAll(`.artist-shelf-card`).forEach(card => {
            const onclickAttr = card.getAttribute('onclick') || '';
            const nameEl = card.querySelector('.asc-name');
            const matchName = nameEl && nameEl.innerText.trim().toLowerCase() === (artistName || '').toLowerCase();
            const matchId = artistId && onclickAttr.includes(artistId);

            if (matchId || matchName) {
                const wrap = card.querySelector('.asc-avatar-wrap');
                if (wrap) {
                    let img = wrap.querySelector('img');
                    if (!img) {
                        img = document.createElement('img');
                        img.className = 'asc-avatar';
                        wrap.appendChild(img);
                    }
                    img.src = imgUrl;
                    img.style.display = 'block';
                    const initDiv = wrap.querySelector('.asc-avatar-initial');
                    if (initDiv) initDiv.remove();
                }
            }
        });

        // Save into localStorage playedArtists
        try {
            let pa = JSON.parse(localStorage.getItem('playedArtists') || '[]');
            let changed = false;
            pa.forEach(a => {
                if ((artistId && a.id === artistId) || (artistName && a.name && a.name.toLowerCase() === artistName.toLowerCase())) {
                    a.image = imgUrl;
                    if (artistId && !a.id) a.id = artistId;
                    changed = true;
                }
            });
            if (changed) localStorage.setItem('playedArtists', JSON.stringify(pa));
        } catch(e){}
    };

    if (artistId && artistId.startsWith('UC')) {
        fetch(`/api/artists?id=${artistId}`)
            .then(r => r.json())
            .then(res => {
                if (res && res.success && res.data && res.data.image && res.data.image.length > 0) {
                    const u = getHighestQualityImage(res.data.image);
                    if (u && !u.includes('placeholder') && !u.startsWith('data:')) {
                        applyImg(u);
                        return;
                    }
                }
                if (artistName) window.searchArtistAvatar(artistName, applyImg);
            })
            .catch(() => {
                if (artistName) window.searchArtistAvatar(artistName, applyImg);
            });
    } else if (artistName) {
        window.searchArtistAvatar(artistName, applyImg);
    }
};

window.searchArtistAvatar = function(artistName, callback) {
    if (!artistName) return;
    fetch(`/api/search/artists?query=${encodeURIComponent(artistName)}`)
        .then(r => r.json())
        .then(res => {
            const list = res && res.data;
            if (Array.isArray(list) && list.length > 0) {
                const matched = list.find(a => a.name && a.name.toLowerCase() === artistName.toLowerCase()) || list[0];
                if (matched && matched.image) {
                    const u = getHighestQualityImage(matched.image);
                    if (u && !u.includes('placeholder') && !u.startsWith('data:')) {
                        callback(u);
                    }
                }
            }
        })
        .catch(() => {});
};

// ==========================================
// NEWS FROM DEVELOPERS (matching Android app)
// ==========================================

function parseDeveloperNewsMarkdown(rawMd) {
    if (!rawMd) return '';
    let escaped = rawMd
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Fenced code blocks
    escaped = escaped.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre class="dev-news-code-block"><code>${code.trim()}</code></pre>`;
    }).replace(/```([\s\S]*?)```/g, (match, code) => {
        return `<pre class="dev-news-code-block"><code>${code.trim()}</code></pre>`;
    });

    const lines = escaped.split('\n');
    const out = [];
    let inList = false;
    let listType = 'ul';

    function parseInline(text) {
        if (!text) return '';
        // 1. Markdown Links [text](url)
        let res = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 <i class="fas fa-external-link-alt" style="font-size:10px;"></i></a>');
        // 2. Standalone URLs
        res = res.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2 <i class="fas fa-external-link-alt" style="font-size:10px;"></i></a>');
        // 3. Bold, Italic, Inline Code
        res = res
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/__([^_]+)__/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/_([^_]+)_/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="dev-news-inline-code">$1</code>');
        return res;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('<pre class="dev-news-code-block">')) {
            if (inList) { out.push(`</${listType}>`); inList = false; }
            out.push(trimmed);
            continue;
        }

        // Horizontal Rule ---, ***
        if (/^[-*_]{3,}$/.test(trimmed)) {
            if (inList) { out.push(`</${listType}>`); inList = false; }
            out.push('<hr>');
            continue;
        }

        // Heading # Title
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            if (inList) { out.push(`</${listType}>`); inList = false; }
            const level = headingMatch[1].length;
            out.push(`<h${level}>${parseInline(headingMatch[2])}</h${level}>`);
            continue;
        }

        // Blockquote > Quote
        if (trimmed.startsWith('&gt;') || trimmed.startsWith('>')) {
            if (inList) { out.push(`</${listType}>`); inList = false; }
            const q = trimmed.replace(/^(&gt;|>)\s*/, '');
            out.push(`<blockquote>${parseInline(q)}</blockquote>`);
            continue;
        }

        // Bullet List - Item, * Item, • Item
        const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
        if (ulMatch) {
            if (!inList || listType !== 'ul') {
                if (inList) out.push(`</${listType}>`);
                out.push('<ul>');
                inList = true;
                listType = 'ul';
            }
            out.push(`<li>${parseInline(ulMatch[1])}</li>`);
            continue;
        }

        // Numbered List 1. Item
        const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
        if (olMatch) {
            if (!inList || listType !== 'ol') {
                if (inList) out.push(`</${listType}>`);
                out.push('<ol>');
                inList = true;
                listType = 'ol';
            }
            out.push(`<li>${parseInline(olMatch[1])}</li>`);
            continue;
        }

        if (inList) {
            out.push(`</${listType}>`);
            inList = false;
        }

        if (!trimmed) continue;
        out.push(`<p>${parseInline(trimmed)}</p>`);
    }

    if (inList) {
        out.push(`</${listType}>`);
    }

    return out.join('\n');
}

function extractDeveloperNewsTeaser(rawMarkdown) {
    if (!rawMarkdown) return '';
    return rawMarkdown
        .split('\n')
        .map(l => l.trim())
        .filter(l => !l.startsWith('#') && !l.startsWith('```') && !l.startsWith('---') && !l.startsWith('***'))
        .join(' ')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^(&gt;|>)\s*/g, '')
        .trim() || rawMarkdown;
}

function formatDeveloperNewsDate(timestamp) {
    if (!timestamp) return '';
    try {
        const date = new Date(Number(timestamp));
        if (isNaN(date.getTime())) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    } catch {
        return '';
    }
}

window.DeveloperNewsManager = {
    newsList: [],
    isSyncing: false,
    searchQuery: '',
    isSearchActive: false,
    activeDetailItem: null,

    init() {
        this.loadCachedNews();
        this.updateBadge();
        this.refresh();
    },

    loadCachedNews() {
        try {
            const cached = localStorage.getItem('airbeats_cached_developer_news');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.newsList = parsed;
                    this.updateBadge();
                }
            }
        } catch (e) {
            console.warn('DeveloperNewsManager: load cached error', e);
        }
    },

    async refresh() {
        if (this.isSyncing) return;
        this.isSyncing = true;
        this.updateSyncSpinners(true);

        try {
            const res = await fetch('/api/developer_news');
            if (res.ok) {
                const json = await res.json();
                const data = Array.isArray(json) ? json : (json.data || []);
                if (Array.isArray(data)) {
                    this.newsList = data;
                    localStorage.setItem('airbeats_cached_developer_news', JSON.stringify(data));
                    this.updateBadge();
                    this.checkStartupPopup(data);
                }
            }
        } catch (e) {
            console.warn('DeveloperNewsManager: refresh error', e);
        } finally {
            this.isSyncing = false;
            this.updateSyncSpinners(false);
            const hash = window.location.hash || '';
            if (hash.includes('developer-news') || hash.includes('developer_news') || hash === '#news') {
                if (!this.activeDetailItem) {
                    window.renderDeveloperNews();
                }
            }
        }
    },

    updateSyncSpinners(isSpinning) {
        const btn = document.getElementById('devNewsRefreshBtn');
        if (btn) {
            if (isSpinning) btn.classList.add('spinning');
            else btn.classList.remove('spinning');
        }
    },

    updateBadge() {
        const badge = document.getElementById('devNewsBadgeDot');
        if (!badge) return;
        const lastSeen = Number(localStorage.getItem('airbeats_last_seen_news_ts') || 0);
        const hasUnread = this.newsList.some(item => (Number(item.timestamp) || 0) > lastSeen);
        badge.style.display = hasUnread ? 'block' : 'none';
    },

    markAllAsRead() {
        const maxTs = this.newsList.reduce((max, item) => Math.max(max, Number(item.timestamp) || 0), 0);
        localStorage.setItem('airbeats_last_seen_news_ts', String(maxTs || Date.now()));
        this.updateBadge();
    },

    getDismissedPopupIds() {
        try {
            const raw = localStorage.getItem('airbeats_dismissed_news_popups');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    dismissPopup(newsId) {
        const dismissed = new Set(this.getDismissedPopupIds());
        if (newsId) dismissed.add(newsId);
        // Mark all current items as dismissed to guarantee no subsequent popups appear (matching Android app)
        this.newsList.forEach(item => {
            if (item.id) dismissed.add(item.id);
        });
        localStorage.setItem('airbeats_dismissed_news_popups', JSON.stringify(Array.from(dismissed)));

        const overlay = document.getElementById('devNewsPopupDialog');
        if (overlay) overlay.remove();
    },

    checkStartupPopup(items) {
        if (!items || items.length === 0) return;
        const dismissed = new Set(this.getDismissedPopupIds());
        const candidate = items.find(item => item.showPopup && item.id && !dismissed.has(item.id));
        if (candidate) {
            // Dismiss other current popups to prevent chaining
            items.forEach(item => {
                if (item.id !== candidate.id && item.id) dismissed.add(item.id);
            });
            localStorage.setItem('airbeats_dismissed_news_popups', JSON.stringify(Array.from(dismissed)));

            this.showPopupDialog(candidate);
        }
    },

    showPopupDialog(item) {
        const existing = document.getElementById('devNewsPopupDialog');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'devNewsPopupDialog';
        overlay.className = 'dev-news-popup-overlay';

        const tagText = item.tag || 'Announcement';
        const imgHtml = item.imageUrl ? `
            <div class="dev-news-popup-img-wrap">
                <img src="${item.imageUrl}" alt="${item.title}" class="dev-news-popup-img" />
                <div class="dev-news-popup-img-shadow"></div>
                <span class="dev-news-popup-tag">${tagText}</span>
            </div>
        ` : `
            <div style="padding-top: 24px; display: flex; flex-direction: column; align-items: center;">
                <div class="dev-news-pulse-badge">
                    <i class="fas fa-newspaper"></i>
                </div>
                <span class="dev-news-tag-pill" style="font-size: 11px; margin-top: 4px;">${tagText}</span>
            </div>
        `;

        const actionBtnHtml = item.actionUrl ? `
            <button class="dev-news-popup-btn-primary" onclick="window.open('${item.actionUrl}', '_blank'); window.DeveloperNewsManager.dismissPopup('${item.id}');">
                <i class="fas fa-external-link-alt"></i> ${item.actionText || 'Learn More'}
            </button>
        ` : '';

        overlay.innerHTML = `
            <div class="dev-news-popup-card" onclick="event.stopPropagation()">
                ${imgHtml}
                <div class="dev-news-popup-content">
                    <h3 class="dev-news-popup-title">${item.title}</h3>
                    <div class="dev-news-popup-message dev-news-markdown-content">
                        ${parseDeveloperNewsMarkdown(item.message)}
                    </div>
                    <div class="dev-news-popup-actions">
                        ${actionBtnHtml}
                        <div style="display: flex; gap: 10px; width: 100%;">
                            <button class="dev-news-popup-btn-secondary" style="flex: 1;" onclick="window.DeveloperNewsManager.dismissPopup('${item.id}');">
                                Dismiss
                            </button>
                            <button class="dev-news-popup-btn-secondary" style="flex: 1; background: var(--accent); color: #000; font-weight: 800; border: none;" onclick="window.DeveloperNewsManager.dismissPopup('${item.id}'); window.location.hash = '#settings/developer-news';">
                                All News
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.dismissPopup(item.id);
            }
        });

        document.body.appendChild(overlay);
    }
};

window.renderDeveloperNews = async function() {
    const container = document.getElementById('router-view');
    if (!container) return;

    const globalLoading = document.getElementById('globalLoading');
    if (globalLoading) globalLoading.style.display = 'none';

    window.DeveloperNewsManager.activeDetailItem = null;
    window.DeveloperNewsManager.markAllAsRead();

    const m = window.DeveloperNewsManager;
    let list = m.newsList;
    const query = m.searchQuery.trim().toLowerCase();

    if (query) {
        list = list.filter(item =>
            (item.title && item.title.toLowerCase().includes(query)) ||
            (item.message && item.message.toLowerCase().includes(query)) ||
            (item.author && item.author.toLowerCase().includes(query)) ||
            (item.tag && item.tag.toLowerCase().includes(query))
        );
    }

    const topBarHtml = `
        <div class="dev-news-topbar">
            <div class="dev-news-topbar-left">
                <button class="dev-news-back-btn" onclick="window.history.back()" title="Back">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="dev-news-title">News From Developers</div>
            </div>
            <div class="dev-news-topbar-actions">
                <button class="dev-news-icon-btn ${m.isSearchActive ? 'active' : ''}" onclick="window.toggleDevNewsSearch()" title="Search">
                    <i class="fas fa-search"></i>
                </button>
                <button class="dev-news-icon-btn ${m.isSyncing ? 'spinning' : ''}" id="devNewsRefreshBtn" onclick="window.refreshDevNews()" title="Refresh">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </div>
        ${m.isSearchActive ? `
            <div class="dev-news-search-bar">
                <i class="fas fa-search" style="color: var(--text-secondary); font-size: 14px;"></i>
                <input type="text" class="dev-news-search-input" id="devNewsSearchInput" placeholder="Search announcements..." value="${m.searchQuery}" oninput="window.onDevNewsSearchChange(this.value)">
                ${m.searchQuery ? `
                    <button style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px;" onclick="window.onDevNewsSearchChange('')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        ` : ''}
    `;

    const totalCount = m.newsList.length;
    const heroCardHtml = `
        <div class="dev-news-hero-card">
            <div class="dev-news-hero-icon-wrap">
                <i class="fas fa-newspaper" style="font-size: 24px; color: var(--accent-text);"></i>
            </div>
            <div>
                <div class="dev-news-hero-title">New Announcements</div>
                <div class="dev-news-hero-count">${totalCount === 1 ? '1 article' : totalCount + ' articles'}</div>
            </div>
        </div>
    `;

    let contentHtml = '';
    if (m.isSyncing && m.newsList.length === 0) {
        contentHtml = `
            <div style="text-align: center; padding: 70px 20px;">
                <div class="lottie-spinner" style="width: 50px; height: 50px; margin: 0 auto 16px;"></div>
                <div style="font-weight: 700; color: #fff; font-size: 16px;">Loading announcements...</div>
                <div style="color: var(--text-secondary); font-size: 13px; margin-top: 6px;">Connecting to Firebase Realtime Database</div>
            </div>
        `;
    } else if (list.length === 0) {
        const title = m.isSyncing ? 'Checking for News...' : (query ? 'No Announcements Match' : 'No News Yet');
        const desc = m.isSyncing
            ? 'Connecting to Firebase to fetch developer announcements.'
            : (query ? 'Try searching with different keywords.' : 'Stay tuned! Announcements and updates from the developers will appear here.');
        contentHtml = `
            <div style="text-align: center; padding: 70px 20px;">
                <div class="dev-news-hero-icon-wrap" style="width: 80px; height: 80px; margin: 0 auto 18px; background: rgba(29, 185, 84, 0.15);">
                    <i class="fas fa-newspaper" style="font-size: 34px; color: var(--accent-text);"></i>
                </div>
                <div style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px;">${title}</div>
                <div style="font-size: 14px; color: var(--text-secondary); max-width: 420px; margin: 0 auto; line-height: 1.5;">${desc}</div>
            </div>
        `;
    } else {
        const cardsHtml = list.map(item => {
            const authorName = item.author || item.tag || 'Developer';
            const dateStr = formatDeveloperNewsDate(item.timestamp);
            const pillText = `${authorName} · ${dateStr}`;
            const teaser = extractDeveloperNewsTeaser(item.message);
            const imgHtml = item.imageUrl ? `
                <div class="dev-news-card-img-wrap">
                    <img src="${item.imageUrl}" alt="${item.title}" class="dev-news-card-img" loading="lazy" />
                </div>
            ` : '';

            return `
                <div class="dev-news-card" onclick="window.openDeveloperNewsDetail('${item.id}')">
                    ${imgHtml}
                    <div class="dev-news-card-body">
                        <div class="dev-news-meta-row">
                            <span class="dev-news-pill">${pillText}</span>
                            ${item.tag ? `<span class="dev-news-tag-pill">${item.tag}</span>` : ''}
                        </div>
                        <div class="dev-news-card-title">${item.title}</div>
                        <div class="dev-news-card-teaser">${teaser}</div>
                        <div class="dev-news-card-footer">
                            <button class="dev-news-more-btn" onclick="event.stopPropagation(); window.openDeveloperNewsDetail('${item.id}')">more</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        contentHtml = `
            ${heroCardHtml}
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${cardsHtml}
            </div>
        `;
    }

    container.innerHTML = `
        <div class="dev-news-container">
            ${topBarHtml}
            ${contentHtml}
        </div>
    `;

    // Highlight active settings sidebar menu item
    const items = document.querySelectorAll('#sidebar-settings-menu .nav-item');
    items.forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById('nav-settings-developer-news');
    if (navItem) navItem.classList.add('active');

    if (m.isSearchActive) {
        const input = document.getElementById('devNewsSearchInput');
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }
};

window.openDeveloperNewsDetail = function(newsId) {
    const item = window.DeveloperNewsManager.newsList.find(x => x.id === newsId);
    if (!item) return;

    window.DeveloperNewsManager.activeDetailItem = item;

    const container = document.getElementById('router-view');
    if (!container) return;

    const authorName = item.author || item.tag || 'Developer';
    const dateStr = formatDeveloperNewsDate(item.timestamp);
    const pillText = `${authorName} · ${dateStr}`;
    const headerTitle = item.tag || 'Announcement';

    const externalBtn = item.actionUrl ? `
        <button class="dev-news-icon-btn" onclick="window.open('${item.actionUrl}', '_blank')" title="Open Link">
            <i class="fas fa-external-link-alt" style="color: var(--accent-text);"></i>
        </button>
    ` : '<div style="width: 36px;"></div>';

    const actionBottomBtn = item.actionUrl ? `
        <button class="dev-news-action-btn-large" onclick="window.open('${item.actionUrl}', '_blank')">
            <i class="fas fa-external-link-alt"></i> ${item.actionText || 'Open Link'}
        </button>
    ` : '';

    const heroImgHtml = item.imageUrl ? `
        <img src="${item.imageUrl}" alt="${item.title}" class="dev-news-detail-hero-img" />
    ` : '';

    container.innerHTML = `
        <div class="dev-news-container dev-news-detail-view">
            <!-- Detail Top Bar -->
            <div class="dev-news-topbar" style="margin-bottom: 24px;">
                <div class="dev-news-topbar-left">
                    <button class="dev-news-back-btn" onclick="window.renderDeveloperNews()" title="Back">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="dev-news-title" style="font-size: 18px;">${headerTitle}</div>
                </div>
                <div>
                    ${externalBtn}
                </div>
            </div>

            <!-- Detail Headline -->
            <h1 class="dev-news-detail-title">${item.title}</h1>
            <div class="dev-news-meta-row" style="margin-bottom: 22px;">
                <span class="dev-news-pill">${pillText}</span>
                ${item.tag ? `<span class="dev-news-tag-pill">${item.tag}</span>` : ''}
            </div>

            ${heroImgHtml}

            <div class="dev-news-markdown-content">
                ${parseDeveloperNewsMarkdown(item.message)}
            </div>

            ${actionBottomBtn}
        </div>
    `;

    const scrollContainer = document.querySelector('.scroll-container');
    if (scrollContainer) scrollContainer.scrollTop = 0;
};

window.toggleDevNewsSearch = function() {
    window.DeveloperNewsManager.isSearchActive = !window.DeveloperNewsManager.isSearchActive;
    if (!window.DeveloperNewsManager.isSearchActive) {
        window.DeveloperNewsManager.searchQuery = '';
    }
    window.renderDeveloperNews();
};

window.onDevNewsSearchChange = function(val) {
    window.DeveloperNewsManager.searchQuery = val;
    window.renderDeveloperNews();
};

window.refreshDevNews = function() {
    window.DeveloperNewsManager.refresh();
};

// Auto-run init if DOM is already ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.DeveloperNewsManager.init();
}
