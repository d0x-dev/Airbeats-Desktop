// AirBeats desktop — playlists mirroring & cards
// Loaded as a classic script after script.js (desktop-native implementation).

window.__ytMirrorLast = 0;

window.ytMirrorPlaylists = async function (ytPlaylists, force) {
    if (!window.ytLoggedIn || !window.ytLoggedIn()) return null;
    const now = Date.now();
    if (!force && now - window.__ytMirrorLast < 60000) return null;
    window.__ytMirrorLast = now;
    if (!Array.isArray(ytPlaylists)) {
        try {
            const res = await fetch('/api/library/playlists').then((r) => r.json());
            ytPlaylists = (res && res.data) || [];
        } catch (e) {
            return null;
        }
    }
    if (!Array.isArray(ytPlaylists) || !ytPlaylists.length) return null;
    const playlists = getPlaylists();
    let changed = false;
    ytPlaylists.forEach((yt) => {
        if (!yt || !yt.id) return;
        const existing = playlists.find((p) => p.ytId === yt.id);
        if (existing) {
            if (yt.image && existing.image !== yt.image) { existing.image = yt.image; changed = true; }
            if (yt.name && existing.name !== yt.name) { existing.name = yt.name; changed = true; }
            if (typeof yt.count === 'number' && existing.ytCount !== yt.count) { existing.ytCount = yt.count; changed = true; }
        } else {
            playlists.push({
                id: 'pl_yt_' + yt.id,
                ytId: yt.id,
                name: yt.name || 'YouTube Playlist',
                image: yt.image || '',
                songs: [],
                ytCount: typeof yt.count === 'number' ? yt.count : null,
                synced: true,
            });
            changed = true;
        }
    });
    if (changed) savePlaylists(playlists);
    return playlists;
};

window.airLocalPlaylistCardHtml = function (pl, forceLocal) {
    let thumbsHtml = '';
    if (pl.image) {
        thumbsHtml = `<img src="${getHighestQualityImage(pl.image)}" style="width:100%; height:100%; object-fit:cover; border-radius: 8px;">`;
    } else if (pl.songs && pl.songs.length > 0) {
        let thumbs = pl.images ? [...pl.images].slice(0, 3) : [];
        if (thumbs.length < 3) {
            for (let i = 0; i < pl.songs.length && thumbs.length < 3; i++) {
                const sid = pl.songs[i];
                let track = window.allTracks[sid];
                if (!track && window.currentRenderedTracks) track = window.currentRenderedTracks.find((t) => t.id === sid);
                if (!track && window.favoriteSongs) track = window.favoriteSongs.find((t) => t.id === sid);
                if (!track) {
                    let history = JSON.parse(localStorage.getItem('playHistory') || '[]');
                    track = history.find((t) => t.id === sid);
                }
                if (track && track.image && !thumbs.includes(track.image)) {
                    thumbs.push(track.image);
                }
            }
        }
        if (thumbs.length > 0) {
            let revThumbs = [...thumbs].reverse();
            thumbsHtml = revThumbs.map((img) => `<img src="${getHighestQualityImage(img)}" class="stacked-thumb">`).join('');
        }
    }
    if (!thumbsHtml) {
        thumbsHtml = `<div style="width:100%; height:100%; background: var(--primary-color); display:flex; align-items:center; justify-content:center; border-radius: 8px;"><i class="fas fa-music" style="font-size:3rem; color:#000;"></i></div>`;
    }
    const songCount = pl.ytCount != null ? pl.ytCount : ((pl.songs && pl.songs.length) || 0);
    const target = (pl.ytId && !forceLocal) ? ('#playlist/' + pl.ytId) : ('#userplaylist/' + pl.id);
    return `
        <div class="card playlist-card" onclick="window.location.hash='${target}'" style="cursor: pointer;">
            <div class="card-img-wrapper" style="background: transparent;">
                ${thumbsHtml}
            </div>
            <div class="card-info">
                <div class="card-title" title="${(pl.name || '').replace(/"/g, '&quot;')}">${pl.name || 'Playlist'}${pl.ytId ? ' ' + window.airBrandIcon('youtube', 12, '#FF0000') : ''}</div>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${songCount} songs</p>
            </div>
        </div>`;
};

