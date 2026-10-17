// AirBeats desktop — appearance engine (accent color, color effects)
// Loaded as a classic script after script.js (desktop-native implementation).

window.AIR_ACCENT_EFFECTS = {
    none: { name: 'None', desc: 'Default balanced tonal appearance' },
    fidelity: { name: 'Fidelity', desc: 'Faithfully mirrors the exact accent color' },
    vibrant: { name: 'Vibrant', desc: 'High energy & maximum chromatic saturation' },
    expressive: { name: 'Expressive', desc: 'Artistic with playful secondary hues' },
    fruit_salad: { name: 'Fruit Salad', desc: 'Playful complementary fruit palette' },
    rainbow: { name: 'Rainbow', desc: 'Spirited spectrum dynamic tones' },
    content: { name: 'Content', desc: 'Content-focused balanced aesthetic' },
    monochrome: { name: 'Monochrome', desc: 'Sleek modern greyscale tonal styling' },
    neutral: { name: 'Neutral', desc: 'Quiet, calm, and understated chromatic tones' },
};

let _airRainbowTimer = null;

window.applyAccentEffect = function (effectKey, baseColor) {
    effectKey = (effectKey || localStorage.getItem('accent_effect') || 'none').toLowerCase();
    baseColor = baseColor || localStorage.getItem('accent_color') || '#c6e355';
    const root = document.documentElement;
    if (_airRainbowTimer) { clearInterval(_airRainbowTimer); _airRainbowTimer = null; }
    document.body.classList.remove('ace-none', 'ace-fidelity', 'ace-vibrant', 'ace-expressive', 'ace-fruit_salad', 'ace-rainbow', 'ace-content', 'ace-monochrome', 'ace-neutral', 'ace-gradient');
    document.body.classList.add('ace-' + effectKey);

    let primary = baseColor;
    let secondary = null;
    switch (effectKey) {
        case 'vibrant':
            primary = airAdjustColor(baseColor, { sat: 35, light: 4 });
            secondary = airAdjustColor(baseColor, { hue: 24, sat: 25 });
            break;
        case 'expressive':
            secondary = airAdjustColor(baseColor, { hue: 130, sat: 12 });
            break;
        case 'fruit_salad':
            primary = '#ff5252';
            secondary = '#ffd740';
            root.style.setProperty('--accent-3', '#69f0ae');
            break;
        case 'content':
            primary = airAdjustColor(baseColor, { sat: -18, light: 6 });
            secondary = airAdjustColor(baseColor, { hue: 18, sat: -10, light: 4 });
            break;
        case 'monochrome':
            primary = airAdjustColor(baseColor, { sat: -100 });
            secondary = airAdjustColor(baseColor, { sat: -100, light: -18 });
            break;
        case 'neutral':
            primary = airAdjustColor(baseColor, { sat: -45, light: 2 });
            secondary = airAdjustColor(baseColor, { hue: 12, sat: -40 });
            break;
        case 'rainbow': {
            primary = airAdjustColor(baseColor, { sat: 25 });
            const baseHsl = airRgbToHsl(airHexToRgb(primary) || { r: 198, g: 227, b: 85 });
            let hue = 0;
            _airRainbowTimer = setInterval(() => {
                hue = (hue + 6) % 360;
                const shifted = airHslToHex({ h: baseHsl.h + hue, s: baseHsl.s, l: baseHsl.l });
                root.style.setProperty('--accent', shifted);
                root.style.setProperty('--primary-color', shifted);
                root.style.setProperty('--accent-2', airHslToHex({ h: baseHsl.h + hue + 60, s: baseHsl.s, l: baseHsl.l }));
            }, 900);
            break;
        }
        default:
            primary = baseColor;
    }
    if (secondary) {
        root.style.setProperty('--accent-2', secondary);
    } else if (effectKey !== 'rainbow') {
        root.style.removeProperty('--accent-2');
        root.style.removeProperty('--accent-3');
    }
    if (['vibrant', 'expressive', 'fruit_salad', 'rainbow'].indexOf(effectKey) !== -1) {
        document.body.classList.add('ace-gradient');
    }
    root.style.setProperty('--accent', primary);
    root.style.setProperty('--primary-color', primary);
};

window.setAccentEffect = function (key) {
    localStorage.setItem('accent_effect', key);
    window.applyAccentEffect(key, localStorage.getItem('accent_color') || '#c6e355');
    document.querySelectorAll('.air-effect-chip').forEach((el) => el.classList.toggle('active', el.getAttribute('data-effect') === key));
    const note = document.getElementById('airEffectNote');
    if (note) note.textContent = (window.AIR_ACCENT_EFFECTS[key] || {}).desc || '';
    airToast('Color effect: ' + ((window.AIR_ACCENT_EFFECTS[key] || {}).name || key));
};

window.AIR_DBG_MODES = ['off', 'gradient', 'blur', 'fluid'];

window.setDynamicBackground = function (mode) {
    mode = window.AIR_DBG_MODES.indexOf(mode) !== -1 ? mode : 'off';
    localStorage.setItem('dynamic_background', mode);
    document.body.classList.remove('dbg-off', 'dbg-gradient', 'dbg-blur', 'dbg-fluid');
    document.body.classList.add('dbg-' + mode);
    window.airUpdateBgArt();
    document.querySelectorAll('.air-dbg-chip').forEach((el) => el.classList.toggle('active', el.getAttribute('data-mode') === mode));
};

window.airUpdateBgArt = function () {
    let art = '';
    try {
        const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
        if (track) art = track.image || track.thumbnail || '';
    } catch (e) { }
    if (!art) {
        const img = document.getElementById('playerImage');
        if (img && img.src && img.src.indexOf('data:image') !== 0) art = img.src;
    }
    if (art) {
        if (typeof getHighestQualityImage === 'function' && art.indexOf('http') === 0) art = getHighestQualityImage(art);
        document.documentElement.style.setProperty('--bg-art', 'url("' + art + '")');
    }
};

// Keep the backdrop in sync with whatever the player is showing.
(function airWatchPlayerArt() {
    const start = () => {
        const img = document.getElementById('playerImage');
        if (!img) { setTimeout(start, 1200); return; }
        const sync = () => {
            if (img.src && img.src.indexOf('data:image') !== 0) {
                document.documentElement.style.setProperty('--bg-art', 'url("' + img.src + '")');
            }
        };
        sync();
        new MutationObserver(sync).observe(img, { attributes: true, attributeFilter: ['src'] });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();

window.AIR_FONTS = {
    inter: { name: 'Inter', stack: "'Inter', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif" },
    system: { name: 'System Default', stack: '' },
    sans_serif: { name: 'Sans-Serif', stack: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif' },
    serif: { name: 'Serif', stack: 'Georgia, "Times New Roman", "Noto Serif", "DejaVu Serif", serif' },
    monospace: { name: 'Monospace', stack: '"JetBrains Mono", "Fira Code", "Cascadia Code", "DejaVu Sans Mono", Menlo, Consolas, monospace' },
    rounded: { name: 'Rounded', stack: '"Nunito", "Quicksand", "Comfortaa", ui-rounded, "Varela Round", system-ui, sans-serif' },
    condensed: { name: 'Condensed', stack: '"Roboto Condensed", "Arial Narrow", "Liberation Sans Narrow", "Ubuntu Condensed", sans-serif' },
};

window.setAppFont = function (key) {
    if (!window.AIR_FONTS[key]) key = 'inter';
    localStorage.setItem('app_font', key);
    document.body.setAttribute('data-font', key);
    const stack = window.AIR_FONTS[key].stack;
    if (stack) document.documentElement.style.setProperty('--app-font', stack);
    else document.documentElement.style.removeProperty('--app-font');
    document.querySelectorAll('.air-font-chip').forEach((el) => el.classList.toggle('active', el.getAttribute('data-font') === key));
};

window.setGridSize = function (size) {
    size = size === 'small' ? 'small' : 'big';
    localStorage.setItem('grid_size', size);
    document.body.classList.toggle('grid-small', size === 'small');
    document.querySelectorAll('.air-grid-chip').forEach((el) => el.classList.toggle('active', el.getAttribute('data-size') === size));
};

window.AIR_ISLAND_DEFAULTS = { size: 'medium', position: 'center', bg: 'black' };

window.islandGetOptions = function () {
    try {
        return Object.assign({}, window.AIR_ISLAND_DEFAULTS, JSON.parse(localStorage.getItem('island_opts') || '{}'));
    } catch (e) {
        return Object.assign({}, window.AIR_ISLAND_DEFAULTS);
    }
};

window.islandSetOption = function (kind, value) {
    const opts = window.islandGetOptions();
    opts[kind] = value;
    opts.accent = localStorage.getItem('accent_color') || '#c6e355';
    localStorage.setItem('island_opts', JSON.stringify(opts));
    window.islandApplyOptions(opts);
    window.islandSyncChips();
    airToast('Dynamic Island updated');
};

window.islandApplyOptions = function (opts) {
    opts = opts || window.islandGetOptions();
    if (window.islandAPI && window.islandAPI.setOptions) {
        try { window.islandAPI.setOptions(opts); } catch (e) { }
    }
    const note = document.getElementById('airIslandNote');
    if (note) {
        note.textContent = window.islandAPI
            ? 'Options applied to the Dynamic Island window.'
            : 'The overlay window is available in the desktop app — options are saved and will apply there.';
    }
};

window.islandSyncChips = function () {
    const opts = window.islandGetOptions();
    document.querySelectorAll('.air-island-size').forEach((el) => el.classList.toggle('active', el.getAttribute('data-size') === opts.size));
    document.querySelectorAll('.air-island-pos').forEach((el) => el.classList.toggle('active', el.getAttribute('data-pos') === opts.position));
    document.querySelectorAll('.air-island-bg').forEach((el) => el.classList.toggle('active', el.getAttribute('data-bg') === opts.bg));
};

window.airAppearanceInit = function () {
    const accent = localStorage.getItem('accent_color') || '#c6e355';
    document.querySelectorAll('.air-swatch').forEach((el) => el.classList.toggle('active', el.getAttribute('data-color') === accent));
    const picker = document.getElementById('airCustomAccent');
    if (picker) picker.value = accent;

    const effect = localStorage.getItem('accent_effect') || 'none';
    document.querySelectorAll('.air-effect-chip').forEach((el) => el.classList.toggle('active', el.getAttribute('data-effect') === effect));
    const effectNote = document.getElementById('airEffectNote');
    if (effectNote) effectNote.textContent = (window.AIR_ACCENT_EFFECTS[effect] || {}).desc || '';

    const dbg = localStorage.getItem('dynamic_background') || 'off';
    document.querySelectorAll('.air-dbg-chip').forEach((el) => el.classList.toggle('active', el.getAttribute('data-mode') === dbg));

    const font = localStorage.getItem('app_font') || 'inter';
    document.querySelectorAll('.air-font-chip').forEach((el) => el.classList.toggle('active', el.getAttribute('data-font') === font));

    document.querySelectorAll('.air-lang-chip').forEach((el) => el.classList.toggle('active', el.getAttribute('data-lang') === window.AIR_LANG));

    const grid = localStorage.getItem('grid_size') || 'big';
    document.querySelectorAll('.air-grid-chip').forEach((el) => el.classList.toggle('active', el.getAttribute('data-size') === grid));

    window.islandSyncChips();
    window.islandApplyOptions();
};

document.addEventListener('DOMContentLoaded', () => {
    window.applyAccentEffect(localStorage.getItem('accent_effect') || 'none', localStorage.getItem('accent_color') || '#c6e355');
    window.setDynamicBackground(localStorage.getItem('dynamic_background') || 'off');
    window.setAppFont(localStorage.getItem('app_font') || 'inter');
    window.setGridSize(localStorage.getItem('grid_size') || 'big');
});

