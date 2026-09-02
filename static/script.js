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
        
        // Force the island to show up immediately if there is a track playing
        if (enabled) {
            setTimeout(() => {
                if (typeof currentTrack !== 'undefined' && currentTrack) {
                    const isFav = favoriteSongs.some(s => s.id === currentTrack.id);
                    window.electronAPI.updateDynamicIsland({
                        type: 'track',
                        title: currentTrack.name,
                        artist: currentTrack.artist,
                        image: currentTrack.image,
                        isFav: isFav,
                        isRepeat: window.isRepeat || false
                    });
                    
                    if (document.body.classList.contains('is-playing')) {
                        window.electronAPI.updateDynamicIsland({ type: 'state', state: 'play' });
                    }
                } else {
                    // Send a dummy track to force it to show up so user knows it works
                    window.electronAPI.updateDynamicIsland({
                        type: 'track',
                        title: 'Airbeats Desktop',
                        artist: 'Ready to play',
                        image: '',
                        isFav: false,
                        isRepeat: false
                    });
                }
            }, 500);
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
    event.stopPropagation();
    const btn = event.currentTarget;
    let track = window.allTracks[trackId];
    if (!track) {
        if (window.currentRenderedTracks) track = window.currentRenderedTracks.find(s => s.id === trackId);
        if (!track && window.currentQueue) track = window.currentQueue.find(s => s.id === trackId);
        if (!track && window.favoriteSongs) track = window.favoriteSongs.find(s => s.id === trackId);
        if (!track) {
            let history = JSON.parse(localStorage.getItem('playHistory') || '[]');
            track = history.find(s => s.id === trackId);
        }
    }
    if (!track) return;
    
    if (!Array.isArray(favoriteSongs)) favoriteSongs = [];
    const idx = favoriteSongs.findIndex(s => s.id === trackId);
    let isFav = false;
    
    if (idx > -1) {
        favoriteSongs.splice(idx, 1);
        btn.className = 'far fa-heart';
        btn.style.color = 'var(--text-secondary)';
    } else {
        favoriteSongs.push(track);
        btn.className = 'fas fa-heart';
        btn.style.color = 'var(--accent)';
        isFav = true;
    }
    saveFavorites();
    
    // Sync Now Playing button if applicable
    const rpLikeBtn = document.getElementById('likeBtn') || document.querySelector('.np-title-row .fa-heart');
    if (rpLikeBtn && currentQueue[currentIndex]?.id === trackId) {
        rpLikeBtn.className = isFav ? 'fas fa-heart' : 'far fa-heart';
        rpLikeBtn.style.color = isFav ? 'var(--accent)' : '';
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

const getHighestQualityImage = (images) => {
    let url = 'https://via.placeholder.com/150';
    if (!images) return url;
    if (typeof images === 'string') url = images;
    else if (Array.isArray(images) && images.length > 0) url = images[images.length - 1].url || images[images.length - 1].link || url;
    else if (images.url) url = images.url;
    else if (images.link) url = images.link;
    
    if (url.includes('googleusercontent.com') && url.includes('=w')) {
        url = url.replace(/=w\d+-h\d+.*/, '=w1080-h1080-l90-rj');
    }
    return url;
};

// ==========================================
    
// ==========================================
// ROUTER
// ==========================================
const routerView = document.getElementById('router-view');
const globalLoading = document.getElementById('globalLoading');
const searchInput = document.getElementById('globalSearch');

window.pageCache = {};

const router = async (forceRefresh = false) => {
    if (typeof forceRefresh !== 'boolean') forceRefresh = false;
    const hash = window.location.hash || '#home';
    const [route, id] = hash.substring(1).split('/');
    const cacheKey = route + (id ? '/' + id : '');
    
    // Toggle sidebar state for settings
    if (window.updateSidebarState) {
        window.updateSidebarState(route === 'settings');
    }

    // Update active nav
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => el.classList.remove('active'));
    let navId = `nav-${route}`;
    if (route === 'settings') navId = `nav-settings-${id}`;
        if (document.getElementById(navId)) {
        document.getElementById(navId).classList.add('active');
    }
    let mobNavId = `mob-nav-${route}`;
    if (document.getElementById(mobNavId)) {
        document.getElementById(mobNavId).classList.add('active');
    }

    const scrollContainer = document.querySelector('.scroll-container');
    if (scrollContainer) scrollContainer.onscroll = null;

    const noCacheRoutes = ['playlists', 'userplaylist', 'favorites', 'history', 'cached'];
    if (!forceRefresh && window.pageCache[cacheKey] && !noCacheRoutes.includes(route)) {
        routerView.innerHTML = window.pageCache[cacheKey];
        globalLoading.style.display = 'none';
        return;
    }

    routerView.innerHTML = '';
    globalLoading.style.display = 'flex';

    const offlineAllowedRoutes = ['cached', 'favorites', 'history', 'playlists', 'userplaylist', 'settings'];
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
        else if (route === 'playlists') await renderUserPlaylists();
        else if (route === 'cached') await renderCachedSongs();
        else if (route === 'userplaylist') await renderSingleUserPlaylist(id);
        else if (route === 'settings' && id === 'appearance') await renderSettingsAppearance();
        else if (route === 'settings' && id === 'about') await renderSettingsAbout();
        else if (route === 'settings' && id === 'updates') await renderSettingsUpdates();
        else if (route === 'settings' && id === 'profile') await window.renderStatsProfile();
        else if (route === 'stats') await window.renderGlobalStats();
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
};

window.addEventListener('hashchange', router);
window.addEventListener('offline', router);
window.addEventListener('online', router);
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
    setTimeout(router, 100);

    
});

const searchSuggestions = document.getElementById('searchSuggestions');

function saveSearchHistory(query) {
    if (!query) return;
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history = history.filter(q => q.toLowerCase() !== query.toLowerCase());
    history.unshift(query);
    if (history.length > 10) history.pop();
    localStorage.setItem('searchHistory', JSON.stringify(history));
}

function renderSearchHistory() {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    if (history.length === 0) {
        searchSuggestions.style.display = 'none';
        return;
    }
    searchSuggestions.innerHTML = `<div style="padding: 8px 16px; font-size:12px; font-weight:bold; color:var(--text-secondary); text-transform:uppercase;">Recent Searches</div>` + history.map(q => `
        <div class="suggestion-item" onclick="executeSearch('${q.replace(/'/g, "\\'")}')">
            <i class="fas fa-history" style="color:var(--text-secondary); width: 40px; text-align:center;"></i>
            <div class="suggestion-info">
                <div class="suggestion-title">${q}</div>
            </div>
        </div>
    `).join('');
    searchSuggestions.style.display = 'flex';
}

window.executeSearch = function(query) {
    searchInput.value = query;
    searchSuggestions.style.display = 'none';
    saveSearchHistory(query);
    window.location.hash = `#search/${encodeURIComponent(query)}`;
};

let searchTimeout;
searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
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
                    <div class="suggestion-item" onclick="executeSearch('${name.replace(/'/g, "\\'")}')">
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

// ==========================================
// VIEWS
// ==========================================
async function renderHome() {
    document.getElementById('globalLoading').style.display = 'flex';
    routerView.innerHTML = '';

    // 1. Get cached state
    const history = JSON.parse(localStorage.getItem('playHistory') || '[]');
    const playedArtists = JSON.parse(localStorage.getItem('playedArtists') || '[]');
    const lastPlayedAlbumStr = localStorage.getItem('lastPlayedAlbum');
    let lastPlayedAlbum = null;
    try { if (lastPlayedAlbumStr) lastPlayedAlbum = JSON.parse(lastPlayedAlbumStr); } catch(e){}

    const isNewUser = history.length === 0;

    let mfySongs = [];
    let artistsForYou = [];
    
    // Start trending and popular artists fetches immediately
    const trendingPromise = fetch('/api/search/songs?query=latest&limit=15').then(r => r.json());
    const artistsPromise = fetch('/api/search/artists?query=trending&limit=6').then(r => r.json());

    let artistRecPromises = [];
    let songRecPromises = [];
    
    if (!isNewUser) {
        const artistIdsFromHistory = [...new Set(history.map(s => s.artists?.primary?.[0]?.id).filter(Boolean))].slice(0, 3);
        const topSongsFromHistory = history.slice(0, 3).map(s => s.id);
        
        artistRecPromises = artistIdsFromHistory.map(id => fetch(`/api/artists/${id}/songs?page=1`).then(r => r.json()).catch(() => ({})));
        songRecPromises = topSongsFromHistory.map(id => fetch(`/api/songs/related?id=${id}`).then(r => r.json()).catch(() => ({})));
    }

    try {
        const [trending, artistsRes, artistRes, songRes] = await Promise.all([
            trendingPromise,
            artistsPromise,
            Promise.all(artistRecPromises),
            Promise.all(songRecPromises)
        ]);

        if (!isNewUser) {
            artistRes.forEach(r => { if (r.data && r.data.songs) mfySongs.push(...r.data.songs); });
            songRes.forEach(r => { if (r.data) mfySongs.push(...r.data); });
            
            artistsForYou = [];
            
            const uniqueSongs = [];
            const ids = new Set();
            for (let s of mfySongs) {
                if (!ids.has(s.id)) {
                    ids.add(s.id);
                    uniqueSongs.push(s);
                }
            }
            
            for (let i = uniqueSongs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [uniqueSongs[i], uniqueSongs[j]] = [uniqueSongs[j], uniqueSongs[i]];
            }
            
            mfySongs = uniqueSongs.slice(0, 20);
        }

    let html = '';

    // Render Popular Artists
    let popularHtml = `
    <div class="section-header">
        <h2>Popular artists</h2>
    </div>
    <div class="grid-container" style="gap: 20px; justify-content: flex-start; margin-bottom: 50px;">
    `;
    if (artistsRes.data && artistsRes.data.results) {
        artistsRes.data.results.slice(0, 6).forEach(art => {
            const img = getHighestQualityImage(art.image);
            popularHtml += `
            <div class="artist-card" onclick="window.location.hash='#artist/${art.id}'">
                <div class="card-img-wrapper">
                    <img src="${img}">
                </div>
                <div class="card-title">${art.name || art.title}</div>
            </div>`;
        });
    }
    popularHtml += `</div>`;

    // Render Trending Songs
    let trendingHtml = `
    <div class="section-header">
        <h2>Trending songs</h2>
    </div>
    <div style="margin-bottom: 50px;">
        <table class="tracklist">
    `;
    if (trending.data && trending.data.results) {
        window.currentTrendingQueue = trending.data.results;
        trending.data.results.forEach((song, i) => {
            window.allTracks[song.id] = song;
            const img = getHighestQualityImage(song.image);
            trendingHtml += `
            <tr class="track-row" onclick="playSingleTrack('${song.id}')" style="cursor:pointer">
                <td class="track-num">
                    <span class="track-num-txt">${i+1}</span>
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
            </tr>`;
        });
    }
    trendingHtml += `</table></div>`;

    if (isNewUser) {
        // NEW USER VIEW
        html += popularHtml;
        html += trendingHtml;
    } else {
        // RETURNING USER VIEW
        
        // 1. Hero Banner
        if (lastPlayedAlbum && lastPlayedAlbum.image) { const bannerImg = getHighestQualityImage(lastPlayedAlbum.image);
            html += `
            <div class="banner-card" style="background: url('${lastPlayedAlbum.image}') no-repeat center center; background-size: cover; cursor: pointer; overflow: hidden; position: relative;" onclick="if('${lastPlayedAlbum.id}') window.location.hash='#album/${lastPlayedAlbum.id}'">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.65); z-index: 1;"></div>
                <div class="banner-content" style="position: relative; z-index: 2;">
                    <div class="banner-label">LAST PLAYED</div>
                    <div class="banner-title" style="text-shadow: 0 4px 10px rgba(0,0,0,0.5);">${lastPlayedAlbum.name}</div>
                    <div class="banner-desc" style="text-shadow: 0 2px 5px rgba(0,0,0,0.5);">By ${lastPlayedAlbum.artist}</div>
                </div>
                <img src="${lastPlayedAlbum.image}" class="banner-artist-img" style="z-index: 2; box-shadow: 0 10px 30px rgba(0,0,0,0.7); border-radius: 8px;">
            </div>`;
        }

        // 2. Made For You
        if (mfySongs.length > 0) {
            window.currentMfyQueue = mfySongs;
            let mfyHtml = `
            <div class="section-header">
                <h2>Made for you</h2>
            </div>
            <div class="grid-container" style="gap: 20px; justify-content: flex-start; margin-bottom: 50px;">
            `;
            mfySongs.forEach((song, i) => {
                window.allTracks[song.id] = song;
                const img = getHighestQualityImage(song.image);
                mfyHtml += `
                <div class="album-card" onclick="playSingleTrack('${song.id}')">
                    <div class="card-img-wrapper">
                        <img src="${img}">
                    </div>
                    <div class="card-title" style="margin-top: 4px;">${song.name}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${getClickableArtistsHtml(song)}</div>
                </div>`;
            });
            mfyHtml += `</div>`;
            html += mfyHtml;
        }

        if (artistsForYou.length > 0) {
            let afyHtml = `
            <div class="section-header">
                <h2>Artists for you</h2>
            </div>
            <div class="grid-container" style="gap: 20px; justify-content: flex-start; margin-bottom: 50px;">
            `;
            artistsForYou.forEach(art => {
                afyHtml += `
                <div class="card" onclick="window.location.hash='#artist/${art.id}'" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; width: 140px;">
                    <div class="card-img-wrapper artist-img" style="width: 140px; height: 140px; border-radius: 50%; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin-bottom: 12px;">
                        <img src="${getHighestQualityImage(art.image)}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="card-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary); text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${art.name}</div>
                    <div class="card-subtitle" style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; text-align: center; width: 100%;">Artist</div>
                </div>`;
            });
            afyHtml += `</div>`;
            html += afyHtml;
        }

        // 3. Popular Artists
        html += popularHtml;

        // 4. Trending Songs
        html += trendingHtml;

        // 5. Recently Played
        html += `
        <div class="section-header">
            <h2>Recently played</h2>
        </div>
        <div class="recent-list" style="margin-bottom: 50px;">
        `;
        history.slice(0, 10).forEach((song, i) => {
            const img = getHighestQualityImage(song.image);
            const artistName = song.artists?.primary?.[0]?.name || 'Unknown';
            html += `
            <div class="recent-row" onclick="playSingleTrack('${song.id}')">
                <img src="${img}" class="recent-img">
                <div class="recent-info">
                    <div class="recent-title">${song.name}</div>
                </div>
                <div class="recent-artist">${artistName}</div>
                <div class="recent-time">${formatTime(song.duration)}</div>
            </div>
            `;
        });
        html += `</div>`;
    }

    document.getElementById('globalLoading').style.display = 'none';
    routerView.innerHTML = html;
    
    } catch(e) { 
        document.getElementById('globalLoading').style.display = 'none';
        console.error('Home render error', e); 
        routerView.innerHTML = '<div style="color:red; padding: 20px;">Failed to load home.</div>';
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
    
    // Fetch 40 items per category for "full" search
    const [songsRes, albumsRes, artistsRes, playlistsRes] = await Promise.all([
        fetch(`/api/search/songs?query=${encodeURIComponent(query)}&limit=40`).then(r => r.json()).catch(()=>({})),
        fetch(`/api/search/albums?query=${encodeURIComponent(query)}&limit=20`).then(r => r.json()).catch(()=>({})),
        fetch(`/api/search/artists?query=${encodeURIComponent(query)}&limit=20`).then(r => r.json()).catch(()=>({})),
        fetch(`/api/search/playlists?query=${encodeURIComponent(query)}&limit=20`).then(r => r.json()).catch(()=>({}))
    ]);
    
    let html = `<div class="back-btn" onclick="history.back()" title="Go Back"><i class="fas fa-arrow-left"></i></div>
    <h2 class="section-title">Search Results for "${decodeURIComponent(query)}"</h2>`;

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
        let colorStyle = isSaved ? 'color: var(--accent);' : '';
        let artistName = album.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist';
        return `<button class="icon-btn" onclick="toggleSaveAlbum('${album.id}', this, '${album.name.replace(/'/g, "\'")}', '${getHighestQualityImage(album.image)}', '${artistName.replace(/'/g, "\'")}')">
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
    
    // UI Update
    const miniPlayerName = track.name.split(' ').slice(0, 2).join(' ');
    document.getElementById('playerTitle').innerHTML = miniPlayerName;
    const pArtist = document.getElementById('playerArtist');
    pArtist.innerHTML = getClickableArtistsHtml(track);
    pArtist.onclick = (e) => { 
        e.stopPropagation(); 
        if (track.artists && track.artists.primary && track.artists.primary[0]?.id) {
            window.location.hash = '#artist/' + track.artists.primary[0].id;
            if (window.closeLyrics) window.closeLyrics();
        }
    };
    const playerImg = document.getElementById('playerImage');
    playerImg.src = getHighestQualityImage(track.image);
    playerImg.classList.remove('skeleton');
    window.updateRightPanelPlaylistBtn(track.id);
    
    // Update Dynamic Island
    if (window.electronAPI && window.electronAPI.updateDynamicIsland) {
        const isFav = favoriteSongs.some(s => s.id === track.id);
        window.electronAPI.updateDynamicIsland({
            type: 'track',
            title: track.name,
            artist: track.artists?.primary?.[0]?.name || 'Unknown Artist',
            image: getHighestQualityImage(track.image),
            isFav: isFav,
            isRepeat: window.isRepeat || false
        });
    }

    // Right panel UI
    const rpTitle = document.getElementById('rightPanelTitle');
    const rpArtist = document.getElementById('rightPanelArtist');
    const rpImage = document.getElementById('rightPanelImage');
    const likeBtn = document.getElementById('likeBtn') || document.querySelector('.np-title-row .fa-heart');
    
    if (rpTitle) rpTitle.innerHTML = track.name;
    if (rpArtist) rpArtist.innerHTML = track.artists?.primary?.[0]?.name || 'Unknown';
    if (rpImage) {
        rpImage.src = getHighestQualityImage(track.image);
        rpImage.classList.remove('skeleton');
    }
    
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
    }
    
    if (!streamUrl) {
        alert('DEBUG: streamUrl is empty! \n\ntrack.downloadUrl: ' + JSON.stringify(track.downloadUrl));
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

    // Save to playedArtists
    if (track.artists && track.artists.primary && track.artists.primary.length > 0) {
        let playedArtists = JSON.parse(localStorage.getItem('playedArtists') || '[]');
        const pArtist = track.artists.primary[0];
        playedArtists = playedArtists.filter(a => a.id !== pArtist.id);
        playedArtists.unshift(pArtist);
        if (playedArtists.length > 10) playedArtists.pop();
        localStorage.setItem('playedArtists', JSON.stringify(playedArtists));
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
}

audio.addEventListener('play', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    document.body.classList.add('is-playing');
    if (window.electronAPI && window.electronAPI.updateDynamicIsland) {
        window.electronAPI.updateDynamicIsland({ type: 'state', state: 'play' });
    }
});

audio.addEventListener('pause', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    document.body.classList.remove('is-playing');
    if (window.electronAPI && window.electronAPI.updateDynamicIsland) {
        window.electronAPI.updateDynamicIsland({ type: 'state', state: 'pause' });
    }
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

    if (!window.currentTrackScrobbled && audio.duration > 0) {
        // Scrobble if played for more than 30 seconds or 50% of the track
        if (audio.currentTime > 30 || audio.currentTime > (audio.duration * 0.5)) {
            window.currentTrackScrobbled = true;
            if (window.scrobbleCurrentTrack) window.scrobbleCurrentTrack();
        }
    }
});

audio.addEventListener('ended', () => {
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
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
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
            <div class="hero-meta">${favoriteSongs.length} songs</div>
            <div class="action-buttons">
                <button class="btn-primary" onclick="playList(window.currentRenderedTracks)">PLAY</button>
            </div>
        </div>
    </div>
    <table class="tracklist">`;
    
    window.currentRenderedTracks = favoriteSongs;

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
               style="color:${color}; cursor:pointer;" 
               onclick="window.toggleSongInPlaylists(event, '${songId}', this)" 
               title="${title}"></i>`;
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
    const playlists = getPlaylists();
    
    body.innerHTML = '';
    
    if (playlists.length === 0) {
        body.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">No playlists found.</p>';
    } else {
        playlists.forEach(pl => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            item.onclick = () => window.addToPlaylist(pl.id);
            item.innerHTML = `
                <div class="playlist-icon">
                    <i class="fas fa-music"></i>
                </div>
                <div class="playlist-info">
                    <h4>${pl.name}</h4>
                    <p>${pl.songs.length} ${pl.songs.length === 1 ? 'song' : 'songs'}</p>
                </div>
            `;
            body.appendChild(item);
        });
    }
    
    modal.classList.add('active');
};

window.closePlaylistModal = function() {
    document.getElementById('playlistModal').classList.remove('active');
};

window.createAndAddToPlaylist = function() {
    const input = document.getElementById('newPlaylistInput');
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
        // Just refresh the modal if we are just creating
        window.openPlaylistModal(null);
    }
};

window.addToPlaylist = function(playlistId) {
    if (!currentTrackToAddToPlaylist) return;
    
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (pl) {
        if (!pl.songs.includes(currentTrackToAddToPlaylist)) {
            pl.songs.push(currentTrackToAddToPlaylist);
            
            let track = window.allTracks[currentTrackToAddToPlaylist];
            if (!track && window.currentRenderedTracks) track = window.currentRenderedTracks.find(t=>t.id===currentTrackToAddToPlaylist);
            if (track && track.image) {
                pl.images = pl.images || [];
                if (!pl.images.includes(track.image)) pl.images.push(track.image);
            }
            
            savePlaylists(playlists);
            showToast('Added to playlist!');
        } else {
            showToast('Already in this playlist.');
        }
    }
    window.closePlaylistModal();
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
    
    // Refresh screen
    renderUserPlaylists();
};

async function renderUserPlaylists() {
    
    routerView.innerHTML = `<div class="loader"></div>`;
    
    const playlists = getPlaylists();
    
    let html = `
        <div class="header-section" style="margin-bottom: 20px;">
            <h1 style="font-size: 2.5rem; font-weight: 700; margin: 0 0 10px 0; color: var(--text-primary);">Your Playlists</h1>
            <p style="color: var(--text-secondary); margin: 0;">${playlists.length} playlists</p>
        </div>
        
        <div class="create-playlist-section" style="border: none; padding-top: 0; margin-bottom: 30px; max-width: 400px;">
            <input type="text" id="screenPlaylistInput" class="create-playlist-input" placeholder="New Playlist Name" onkeypress="if(event.key === 'Enter') window.createPlaylistFromScreen()">
            <button class="create-playlist-btn" onclick="window.createPlaylistFromScreen()">Create</button>
        </div>
    `;
    
    if (playlists.length === 0) {
        html += `<div style="text-align: center; padding: 50px; color: var(--text-secondary);">You haven't created any playlists yet. Use the Create button above to start!</div>`;
    } else {
        html += `<div class="grid-container">`;
        playlists.forEach(pl => {
            
            let thumbsHtml = '';
            if (pl.image) {
                thumbsHtml = `<img src="${getHighestQualityImage(pl.image)}" style="width:100%; height:100%; object-fit:cover; border-radius: 8px;">`;
            } else if (pl.songs.length > 0) {
                let thumbs = pl.images ? [...pl.images].slice(0, 3) : [];
                if (thumbs.length < 3) {
                    for (let i=0; i<pl.songs.length && thumbs.length<3; i++) {
                        const sid = pl.songs[i];
                    let track = window.allTracks[sid];
                    if (!track && window.currentRenderedTracks) track = window.currentRenderedTracks.find(t=>t.id===sid);
                    if (!track && window.favoriteSongs) track = window.favoriteSongs.find(t=>t.id===sid);
                    if (!track) {
                        let history = JSON.parse(localStorage.getItem('playHistory') || '[]');
                        track = history.find(t=>t.id===sid);
                    }
                    if (track && track.image && !thumbs.includes(track.image)) {
                        thumbs.push(track.image);
                    }
                }
                }
                
                if (thumbs.length > 0) {
                    let revThumbs = [...thumbs].reverse();
                    thumbsHtml = revThumbs.map(img => `<img src="${getHighestQualityImage(img)}" class="stacked-thumb">`).join('');
                }
            }
            
            if (!thumbsHtml) {
                thumbsHtml = `<div style="width:100%; height:100%; background: var(--primary-color); display:flex; align-items:center; justify-content:center; border-radius: 8px;"><i class="fas fa-music" style="font-size:3rem; color:#000;"></i></div>`;
            }

            html += `
                <div class="card playlist-card" onclick="window.location.hash='#userplaylist/${pl.id}'" style="cursor: pointer;">
                    <div class="card-img-wrapper" style="background: transparent;">
                        ${thumbsHtml}
                    </div>
                    <div class="card-info">
                        <div class="card-title" title="${pl.name.replace(/"/g, '&quot;')}">${pl.name}</div>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${pl.songs.length} songs</p>
                    </div>
                </div>
            `;

        });
        html += `</div>`;
    }
    
    routerView.innerHTML = html;
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
                            <button class="icon-btn" onclick="if(confirm('Are you sure you want to delete this playlist?')) { const p = getPlaylists().filter(x=>x.id!=='${pl.id}'); savePlaylists(p); window.location.hash='#playlists'; }"><i class="fas fa-trash"></i></button>
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

async function renderSettingsAppearance() {
    routerView.innerHTML = `
    <div class="hero-header" style="background: none; border-bottom: 1px solid var(--border-color); margin-bottom: 20px; padding: 20px;">
        <div class="hero-info">
            <div class="hero-title">Appearance</div>
            <div class="hero-meta">Customize your Airbeats experience</div>
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
              <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Enable or disable the interactive mini-player overlay at the top of your screen.</p>
              
              <div style="display: flex; gap: 20px;">
                  <button id="btn-island-on" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;" onclick="setDynamicIsland(true)">
                      <i class="fas fa-layer-group"></i> Enabled
                  </button>
                  <button id="btn-island-off" class="btn" style="background: var(--app-bg); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;" onclick="setDynamicIsland(false)">
                      <i class="fas fa-eye-slash"></i> Disabled
                  </button>
              </div>
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
              <h3 style="margin-top: 0; font-size: 20px;">Accent Color</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Customize the accent color used for active elements and buttons.</p>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #ff0055; cursor: pointer; border: 2px solid white;" onclick="setAccentColor('#ff0055')" title="Rose"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #1db954; cursor: pointer;" onclick="setAccentColor('#1db954')" title="Spotify Green"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #1d4ed8; cursor: pointer;" onclick="setAccentColor('#1d4ed8')" title="Blue"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #8b5cf6; cursor: pointer;" onclick="setAccentColor('#8b5cf6')" title="Purple"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #f59e0b; cursor: pointer;" onclick="setAccentColor('#f59e0b')" title="Amber"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #ec4899; cursor: pointer;" onclick="setAccentColor('#ec4899')" title="Pink"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #06b6d4; cursor: pointer;" onclick="setAccentColor('#06b6d4')" title="Cyan"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #84cc16; cursor: pointer;" onclick="setAccentColor('#84cc16')" title="Lime"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #ef4444; cursor: pointer;" onclick="setAccentColor('#ef4444')" title="Red"></div>
            </div>
        </div>

        <div style="background: var(--search-bg); padding: 24px; border-radius: 12px;">
            <h3 style="margin-top: 0; font-size: 20px;">Panel Color</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Customize the background color of the sidebar and the mini player.</p>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #4c4a4a; cursor: pointer; border: 2px solid white;" onclick="setPanelColor('#4c4a4a')" title="Default Grey"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #1f2937; cursor: pointer; border: 2px solid white;" onclick="setPanelColor('#1f2937')" title="Slate"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #0f172a; cursor: pointer; border: 2px solid white;" onclick="setPanelColor('#0f172a')" title="Midnight Blue"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #4c0519; cursor: pointer; border: 2px solid white;" onclick="setPanelColor('#4c0519')" title="Deep Red"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #064e3b; cursor: pointer; border: 2px solid white;" onclick="setPanelColor('#064e3b')" title="Forest Green"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #3b0764; cursor: pointer; border: 2px solid white;" onclick="setPanelColor('#3b0764')" title="Deep Purple"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #134e4a; cursor: pointer; border: 2px solid white;" onclick="setPanelColor('#134e4a')" title="Teal"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #3f2e27; cursor: pointer; border: 2px solid white;" onclick="setPanelColor('#3f2e27')" title="Espresso"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #27272a; cursor: pointer; border: 2px solid white;" onclick="setPanelColor('#27272a')" title="Charcoal"></div>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #171717; cursor: pointer; border: 2px solid white;" onclick="setPanelColor('#171717')" title="Pitch Black"></div>
            </div>
        </div>
    </div>
    `;

    setTimeout(() => {
        window.setTheme(localStorage.getItem('theme') || 'light');
        window.setWaveformAnimation(localStorage.getItem('wave_anim') === 'true');
        window.setDynamicIsland(localStorage.getItem('dynamic_island_enabled') === 'true');
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
            <span style="color: var(--text-primary);">Air</span><span style="color: var(--accent);">Beats</span>
        </h1>

        <!-- Version Badges -->
        <div style="display: flex; gap: 8px; margin-bottom: 20px; align-items: center;">
            <span style="border: 1.5px solid var(--accent); color: var(--accent); border-radius: 50px; padding: 4px 16px; font-size: 13px; font-weight: bold; text-transform: uppercase;">5.7.0</span>
        </div>

        <!-- Developer Text -->
        <div style="font-family: monospace; font-size: 16px; font-weight: bold; color: var(--text-secondary); margin-bottom: 24px;">
            Dev By DarkXVenom <i class="fas fa-crown" style="color: gold; margin-left: 5px;"></i>
        </div>

        <!-- Social Icons Row -->
        <div style="background: var(--search-bg); border-radius: 28px; display: flex; justify-content: space-evenly; align-items: center; padding: 12px 24px; width: 90%; max-width: 400px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 40px;">
            <a href="https://www.facebook.com/venom.digital.creator" target="_blank" style="color: var(--accent); font-size: 20px; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fab fa-facebook"></i></a>
            <a href="https://www.instagram.com/Dark__336/" target="_blank" style="color: var(--accent); font-size: 20px; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fab fa-instagram"></i></a>
            <a href="https://github.com/d0x-dev" target="_blank" style="color: var(--accent); font-size: 20px; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fab fa-github"></i></a>
            <a href="https://g.dev/Darkboy336" target="_blank" style="color: var(--accent); font-size: 20px; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fab fa-google"></i></a>
            <a href="https://AirBeats.stormx.pw/" target="_blank" style="color: var(--accent); font-size: 20px; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fas fa-globe"></i></a>
        </div>

        <!-- Contributors Title -->
        <div style="width: 100%; padding: 0 30px; display: flex; align-items: center; margin-bottom: 20px; box-sizing: border-box;">
            <i class="fas fa-users" style="color: var(--accent); font-size: 24px; margin-right: 12px;"></i>
            <h2 style="font-size: 22px; font-weight: bold; color: var(--text-primary); margin: 0; margin-right: 12px;">Contributors</h2>
            <span style="font-size: 13px; color: var(--accent); font-weight: 500;">1 Contributor</span>
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
                        <span style="width: 32px; height: 32px; border-radius: 50%; background: rgba(128,128,128,0.1); border: 1px solid rgba(128,128,128,0.2); display: flex; align-items: center; justify-content: center; color: var(--accent);"><i class="fab fa-github"></i></span>
                        <span style="width: 32px; height: 32px; border-radius: 50%; background: rgba(128,128,128,0.1); border: 1px solid rgba(128,128,128,0.2); display: flex; align-items: center; justify-content: center; color: var(--accent);"><i class="fab fa-telegram-plane"></i></span>
                        <span style="width: 32px; height: 32px; border-radius: 50%; background: rgba(128,128,128,0.1); border: 1px solid rgba(128,128,128,0.2); display: flex; align-items: center; justify-content: center; color: var(--accent);"><i class="fab fa-instagram"></i></span>
                        <span style="width: 32px; height: 32px; border-radius: 50%; background: rgba(128,128,128,0.1); border: 1px solid rgba(128,128,128,0.2); display: flex; align-items: center; justify-content: center; color: var(--accent);"><i class="fas fa-globe"></i></span>
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
        let tracks = window.currentMfyQueue;
        if (!tracks || tracks.length === 0) {
            alert('Play some songs first to build your Made for You mix!');
            return;
        }
        
        // Let Python do the shuffling
        const res = await fetch('/api/shuffle', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({tracks: tracks})
        });
        const data = await res.json();
        
        if (data.success && data.shuffled) {
            playList(data.shuffled);
            if (window.innerWidth <= 768 && document.getElementById('sidebar')) {
                document.getElementById('sidebar').classList.remove('active');
            }
        } else {
            throw new Error('Python shuffle failed');
        }
    } catch(e) {
        console.error('Shuffle Play error:', e);
        alert('Failed to load shuffle playlist.');
    }
};
window.downloadCurrentSong = async function() {
    const track = window.getCurrentTrack();
    if (!track || !track.id) return;
    
    try {
        const btn = document.getElementById('downloadBtn');
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const downloadUrl = `/api/stream?id=${track.id}`;
        const filename = `${track.title} - ${track.subtitle || 'Airbeats'}.m4a`;
        
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
                <i class="fas fa-list-music" style="font-size: 24px; width: 40px; color: var(--accent);"></i>
                <span style="font-size: 18px; font-weight: 500;">Playlists</span>
                <i class="fas fa-chevron-right" style="margin-left: auto; color: var(--text-secondary);"></i>
            </a>
            <a href="#artists" style="display: flex; align-items: center; padding: 20px; background: var(--search-bg); border-radius: 12px; text-decoration: none; color: var(--text-primary);">
                <i class="fas fa-user-music" style="font-size: 24px; width: 40px; color: var(--accent);"></i>
                <span style="font-size: 18px; font-weight: 500;">Artists</span>
                <i class="fas fa-chevron-right" style="margin-left: auto; color: var(--text-secondary);"></i>
            </a>
            <a href="#albums" style="display: flex; align-items: center; padding: 20px; background: var(--search-bg); border-radius: 12px; text-decoration: none; color: var(--text-primary);">
                <i class="fas fa-compact-disc" style="font-size: 24px; width: 40px; color: var(--accent);"></i>
                <span style="font-size: 18px; font-weight: 500;">Albums</span>
                <i class="fas fa-chevron-right" style="margin-left: auto; color: var(--text-secondary);"></i>
            </a>
            <a href="#history" style="display: flex; align-items: center; padding: 20px; background: var(--search-bg); border-radius: 12px; text-decoration: none; color: var(--text-primary);">
                <i class="fas fa-history" style="font-size: 24px; width: 40px; color: var(--accent);"></i>
                <span style="font-size: 18px; font-weight: 500;">Recently Played</span>
                <i class="fas fa-chevron-right" style="margin-left: auto; color: var(--text-secondary);"></i>
            </a>
            <a href="#favorites" style="display: flex; align-items: center; padding: 20px; background: var(--search-bg); border-radius: 12px; text-decoration: none; color: var(--text-primary);">
                <i class="fas fa-heart" style="font-size: 24px; width: 40px; color: var(--accent);"></i>
                <span style="font-size: 18px; font-weight: 500;">Favorite Songs</span>
                <i class="fas fa-chevron-right" style="margin-left: auto; color: var(--text-secondary);"></i>
            </a>
        </div>
    `;
}

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
            ptrIndicator.style.transform = 	ranslateY( + Math.min(diff - 60, 0) + px);
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
        
        let playlists = getPlaylists();
        let isSaved = playlists.some(p => p.id === playlist.id);
        let iconClass = isSaved ? 'fas fa-check' : 'fas fa-plus';
        let colorStyle = isSaved ? 'color: var(--accent);' : '';
        
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
                    <button class="icon-btn" onclick="window.toggleSaveYouTubePlaylist('${playlist.id}', this, '${playlist.name.replace(/'/g, "\\\\'")}', '${getHighestQualityImage(playlist.image)}')">
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
            if (audio.duration) {
                audio.currentTime = action.pct * audio.duration;
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
        <div style="font-size: 64px; margin-bottom: 20px; color: var(--accent);">
            <i class="fas fa-sync-alt"></i>
        </div>
        <h1 style="font-size: 32px; font-weight: 700; color: var(--text-primary); margin: 0 0 10px 0;">Updates</h1>
        <div style="font-size: 16px; color: var(--text-secondary); margin-bottom: 30px;">
            Current Version: <span style="color: var(--accent); font-weight: 600;">v${currentVersion}</span>
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
                    <td style="width: 80px; text-align: center;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 15px;" onclick="event.stopPropagation()">
                            <i class="${favoriteSongs.some(s => s.id === song.id) ? 'fas' : 'far'} fa-heart" 
                               onclick="window.toggleLike('${song.id}', this)" style="${favoriteSongs.some(s => s.id === song.id) ? 'color: var(--accent);' : ''}"></i>
                            <i class="fas fa-plus" onclick="window.openPlaylistModal('${song.id}')"></i>
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

document.addEventListener('contextmenu', function(e) {
    const target = e.target.closest('.track-row, .card, .album-card, .recent-row, .np-info, .artist-card, .clickable-artist, .cm-queue-item');
    if (!target) {
        ctxMenu.style.display = 'none';
        return;
    }
    
    let type = null;
    let objId = null;
    let objTitle = null;
    let objIndex = null;

    const onclickStr = target.getAttribute('onclick');
    if (target.classList.contains('cm-queue-item')) {
        type = 'queue';
        objId = target.getAttribute('data-id');
        objIndex = parseInt(target.getAttribute('data-index'), 10);
    } else if (onclickStr && onclickStr.includes('playSingleTrack')) {
        const match = onclickStr.match(/'([^']+)'/);
        if (match) {
            type = 'song';
            objId = match[1];
        }
    } else if (target.classList.contains('np-info')) {
        const tr = window.getCurrentTrack();
        if (tr) {
            type = 'song';
            objId = tr.id;
        }
    } else if (onclickStr && onclickStr.includes('#artist/')) {
        const match = onclickStr.match(/#artist\/([^']+)'/);
        if (match) {
            type = 'artist';
            objId = match[1];
            objTitle = target.innerText || target.textContent || 'Artist';
        }
    }

    if (!objId || !type) {
        ctxMenu.style.display = 'none';
        return;
    }
    
    if (type === 'song' || type === 'queue') {
        const song = window.allTracks[objId];
        if (!song) {
            ctxMenu.style.display = 'none';
            return;
        }
        objTitle = song.title || song.name;
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
        }
    });

    if (isSong) {
        const playlists = typeof getPlaylists === 'function' ? getPlaylists() : [];
        const isAdded = playlists.some(pl => pl.songs.includes(objId));
        const plItem = document.getElementById('cm-add-playlist');
        plItem.innerHTML = isAdded ? '<i class="fas fa-folder-minus"></i> Remove from playlist' : '<i class="fas fa-folder-plus"></i> Add to playlist';
    } else if (type === 'artist') {
        const subbed = JSON.parse(localStorage.getItem('subscribedArtists') || '[]');
        const isSubbed = subbed.some(a => a.id === objId);
        const subItem = document.getElementById('cm-subscribe');
        subItem.innerHTML = isSubbed ? '<i class="fas fa-user-minus"></i> Unsubscribe' : '<i class="fas fa-user-plus"></i> Subscribe';
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
    const link = "https://play.airbeats.app/" + typeStr + "?id=" + ctxActiveData.id;
    navigator.clipboard.writeText(link).then(() => {
        if(window.showToast) window.showToast("Link copied to clipboard");
    });
});

document.getElementById('cm-share').addEventListener('click', () => {
    ctxMenu.style.display = 'none';
    if (!ctxActiveData) return;
    const typeStr = ctxActiveData.type === 'queue' ? 'song' : ctxActiveData.type;
    const link = "https://play.airbeats.app/" + typeStr + "?id=" + ctxActiveData.id;
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



