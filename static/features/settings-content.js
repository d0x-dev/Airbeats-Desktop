// AirBeats desktop — content settings page
// Loaded as a classic script after script.js (desktop-native implementation).

window.AIR_LYRICS_PROVIDER_LIST = [
    ['lrclib', 'LRC Lib'],
    ['kugou', 'KuGou'],
    ['simpmusic', 'SimpMusic'],
    ['unison', 'Unison'],
    ['youly', 'YouLyPlus'],
    ['megalobiz', 'Megalobiz'],
    ['paxsenix', 'Paxsenix'],
    ['portato', 'Portato'],
    ['betterlyrics', 'Better Lyrics'],
    ['youtube_subtitles', 'YouTube Subtitles'],
    ['youtube_music', 'YouTube Music'],
];

window.airSetContentSetting = function (key, value) {
    const updates = {};
    updates[key] = value;
    return window.airSaveSettings(updates).then(() => {
        if (key === 'saavn_enabled') window.airApplyServerSettings();
        if (key === 'proxy_type' || key === 'proxy_enabled') window.airRefreshProxyUi && window.airRefreshProxyUi();
        if (key === 'content_language' || key === 'content_country') {
            // Pages rendered in the old language are cached — clear them so the
            // new language shows everywhere (and refresh home as well).
            window.pageCache = {};
            if (typeof window.airRefreshHomeFeed === 'function' && (window.location.hash === '#home' || window.location.hash === '')) {
                window.airRefreshHomeFeed();
            }
        }
    });
};

window.airSetLyricsProviderEnabled = function (key, enabled) {
    const current = (window.airSetting('lyrics_disabled', []) || []).slice();
    const idx = current.indexOf(key);
    if (enabled && idx !== -1) current.splice(idx, 1);
    if (!enabled && idx === -1) current.push(key);
    return window.airSaveSettings({ lyrics_disabled: current });
};

window.airPickProxyType = function (type) {
    document.querySelectorAll('.air-proxy-type').forEach((el) => {
        el.classList.toggle('active', el.getAttribute('data-type') === type);
    });
    return window.airSetContentSetting('proxy_type', type);
};

window.airSaveProxyUrl = function () {
    const input = document.getElementById('airProxyUrl');
    if (!input) return;
    return window.airSetContentSetting('proxy_url', input.value.trim());
};

async function renderSettingsContent() {
    await window.airLoadSettings(true);
    const s = window.AIR_SETTINGS || {};
    const langList = window.AIR_LANGUAGES || [];
    const countryList = window.AIR_COUNTRIES || [];
    const disabled = s.lyrics_disabled || [];
    const langOptions = ['<option value="">Default</option>'].concat(langList.map((l) =>
        `<option value="${airEsc(l.code)}" ${l.code === (s.content_language || '') ? 'selected' : ''}>${airEsc(l.name)} (${airEsc(l.code)})</option>`)).join('');
    const countryOptions = ['<option value="">Default</option>'].concat(countryList.map((c) =>
        `<option value="${airEsc(c.code)}" ${c.code === (s.content_country || '') ? 'selected' : ''}>${airEsc(c.name)}</option>`)).join('');
    const lyricsOptions = ['<option value="">Auto (recommended order)</option>'].concat(window.AIR_LYRICS_PROVIDER_LIST.map(([key, name]) =>
        `<option value="${key}" ${key === (s.lyrics_preferred || '') ? 'selected' : ''}>${name}</option>`)).join('');
    const providerRows = window.AIR_LYRICS_PROVIDER_LIST.map(([key, name]) => `
        <div class="air-setting-row">
            <div class="air-setting-row-main">
                <div class="air-setting-title">${name}</div>
                <div class="air-setting-desc">${key === 'youtube_music' ? 'Official YouTube Music lyrics' : key === 'youtube_subtitles' ? 'Lyrics from YouTube video subtitles' : 'Community synchronized lyrics source'}</div>
            </div>
            <label class="air-switch"><input type="checkbox" ${disabled.indexOf(key) === -1 ? 'checked' : ''}
                onchange="window.airSetLyricsProviderEnabled('${key}', this.checked)"><span></span></label>
        </div>`).join('');

    routerView.innerHTML = `
    <div class="air-settings-page">
        <div class="air-settings-head">
            <button class="icon-btn" onclick="window.location.hash = '#settings'"><i class="fas fa-arrow-left"></i></button>
            <h2>${window.t('content')}</h2>
        </div>

        <section class="air-card">
            <div class="air-card-title"><i class="fas fa-sliders-h"></i> ${window.t('general')}</div>
            <div class="air-setting-row">
                <div class="air-setting-row-main">
                    <div class="air-setting-title">JioSaavn Integration</div>
                    <div class="air-setting-desc">Browse and stream JioSaavn songs inside the app</div>
                </div>
                <label class="air-switch"><input type="checkbox" ${s.saavn_enabled !== false ? 'checked' : ''}
                    onchange="window.airSetContentSetting('saavn_enabled', this.checked)"><span></span></label>
            </div>
            <div class="air-setting-row">
                <div class="air-setting-row-main">
                    <div class="air-setting-title">Default content language</div>
                    <div class="air-setting-desc">Songs and results are fetched in this language</div>
                </div>
                <select class="air-select" onchange="window.airSetContentSetting('content_language', this.value)">${langOptions}</select>
            </div>
            <div class="air-setting-row">
                <div class="air-setting-row-main">
                    <div class="air-setting-title">Default country</div>
                    <div class="air-setting-desc">Charts and home shelf region</div>
                </div>
                <select class="air-select" onchange="window.airSetContentSetting('content_country', this.value)">${countryOptions}</select>
            </div>
            <div class="air-setting-row">
                <div class="air-setting-row-main">
                    <div class="air-setting-title">Hide explicit content</div>
                    <div class="air-setting-desc">Hide songs marked explicit in all listings</div>
                </div>
                <label class="air-switch"><input type="checkbox" ${s.hide_explicit ? 'checked' : ''}
                    onchange="window.airSetContentSetting('hide_explicit', this.checked)"><span></span></label>
            </div>
        </section>

        <section class="air-card">
            <div class="air-card-title"><i class="fas fa-shield-alt"></i> ${window.t('proxy')}</div>
            <div class="air-setting-row">
                <div class="air-setting-row-main">
                    <div class="air-setting-title">Enable proxy</div>
                    <div class="air-setting-desc">Route YouTube, JioSaavn and lyrics traffic through a proxy</div>
                </div>
                <label class="air-switch"><input type="checkbox" ${s.proxy_enabled ? 'checked' : ''}
                    onchange="window.airSetContentSetting('proxy_enabled', this.checked)"><span></span></label>
            </div>
            <div class="air-setting-row">
                <div class="air-setting-row-main">
                    <div class="air-setting-title">Proxy type</div>
                    <div class="air-setting-desc">HTTP or SOCKS5</div>
                </div>
                <div class="air-chip-group">
                    <button class="air-chip air-proxy-type ${(s.proxy_type || 'HTTP') === 'HTTP' ? 'active' : ''}" data-type="HTTP" onclick="window.airPickProxyType('HTTP')">HTTP</button>
                    <button class="air-chip air-proxy-type ${(s.proxy_type || 'HTTP') === 'SOCKS' ? 'active' : ''}" data-type="SOCKS" onclick="window.airPickProxyType('SOCKS')">SOCKS5</button>
                </div>
            </div>
            <div class="air-setting-row">
                <div class="air-setting-row-main">
                    <div class="air-setting-title">Proxy URL</div>
                    <div class="air-setting-desc">Example: http://127.0.0.1:8080 or socks5://127.0.0.1:1080</div>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input id="airProxyUrl" class="air-input" value="${airEsc(s.proxy_url || '')}" placeholder="http://host:port" spellcheck="false">
                    <button class="btn-primary" style="padding:8px 16px;" onclick="window.airSaveProxyUrl()">${window.t('save')}</button>
                </div>
            </div>
        </section>

        <section class="air-card">
            <div class="air-card-title"><i class="fas fa-microphone-alt"></i> ${window.t('lyrics')}</div>
            <div class="air-setting-row">
                <div class="air-setting-row-main">
                    <div class="air-setting-title">Prefer provider</div>
                    <div class="air-setting-desc">This source is tried first, others follow as fallback</div>
                </div>
                <select class="air-select" onchange="window.airSetContentSetting('lyrics_preferred', this.value)">${lyricsOptions}</select>
            </div>
            ${providerRows}
        </section>
        <div style="height: 60px;"></div>
    </div>`;
}

