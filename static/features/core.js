// AirBeats desktop — core helpers (i18n, colors, loading dots, settings bridge, client error reporting)
// Loaded as a classic script after script.js (desktop-native implementation).

window.AIR_LANG = localStorage.getItem('air_lang') || 'en';
window.AIR_I18N = {
    en: {
        home: 'Home', explore: 'Explore', newReleases: 'New Releases', shuffle: 'Shuffle Play',
        stats: 'Stats', favorites: 'Favorites', history: 'History', likedSongs: 'Liked Songs',
        playlists: 'Playlists', library: 'Library', artists: 'Artists', albums: 'Albums',
        settings: 'Settings', account: 'Account', content: 'Content Settings', logs: 'Logs',
        appearance: 'Appearance', aod: 'Always On Display', news: 'News from Developers',
        about: 'About', updates: 'Updates', backup: 'Backup & Restore',
        theme: 'Theme', darkMode: 'Dark Mode', lightMode: 'Light Mode',
        accentColor: 'Accent Color', colorEffects: 'Color Effects', dynamicBackground: 'Dynamic Background',
        fonts: 'Fonts', language: 'Language', gridSize: 'Grid Cell Size',
        dynamicIsland: 'Dynamic Island', enabled: 'Enabled', disabled: 'Disabled',
        save: 'Save', copy: 'Copy', copied: 'Copied to clipboard', clear: 'Clear',
        refresh: 'Refresh', download: 'Save / Share', signIn: 'Sign in with Google',
        signOut: 'Sign out', premiumTitle: 'Use login for browsing premium content',
        premiumDesc: 'Sign in with your Google account to unlock premium-only songs, albums and your full library.',
        advancedLogin: 'Advanced login — tap to show token', showToken: 'Show token',
        hideToken: 'Hide token', syncYoutube: 'Sync with YouTube', big: 'Big', small: 'Small',
        loading: 'Loading', general: 'General', proxy: 'Proxy', lyrics: 'Lyrics',
    },
    hi: {
        home: 'होम', explore: 'एक्सप्लोर', newReleases: 'नई रिलीज़', shuffle: 'शफल प्ले',
        stats: 'आँकड़े', favorites: 'पसंदीदा', history: 'इतिहास', likedSongs: 'पसंद किए गाने',
        playlists: 'प्लेलिस्ट', library: 'लाइब्रेरी', artists: 'कलाकार', albums: 'एल्बम',
        settings: 'सेटिंग्स', account: 'अकाउंट', content: 'कंटेंट सेटिंग्स', logs: 'लॉग्स',
        appearance: 'रूप-रंग', aod: 'ऑलवेज़ ऑन डिस्प्ले', news: 'डेवलपर्स की खबरें',
        about: 'जानकारी', updates: 'अपडेट', backup: 'बैकअप और रिस्टोर',
        theme: 'थीम', darkMode: 'डार्क मोड', lightMode: 'लाइट मोड',
        accentColor: 'एक्सेंट रंग', colorEffects: 'रंग प्रभाव', dynamicBackground: 'डायनामिक बैकग्राउंड',
        fonts: 'फ़ॉन्ट', language: 'भाषा', gridSize: 'ग्रिड सेल साइज़',
        dynamicIsland: 'डायनामिक आइलैंड', enabled: 'चालू', disabled: 'बंद',
        save: 'सेव', copy: 'कॉपी', copied: 'क्लिपबोर्ड पर कॉपी हो गया', clear: 'साफ़ करें',
        refresh: 'रीफ़्रेश', download: 'सेव / शेयर', signIn: 'Google से साइन इन करें',
        signOut: 'साइन आउट', premiumTitle: 'प्रीमियम कंटेंट ब्राउज़ करने के लिए लॉगिन करें',
        premiumDesc: 'प्रीमियम-ओनली गाने, एल्बम और पूरी लाइब्रेरी के लिए अपने Google अकाउंट से साइन इन करें।',
        advancedLogin: 'एडवांस लॉगिन — टोकन देखने के लिए टैप करें', showToken: 'टोकन दिखाएँ',
        hideToken: 'टोकन छिपाएँ', syncYoutube: 'YouTube से सिंक करें', big: 'बड़ा', small: 'छोटा',
        loading: 'लोड हो रहा है', general: 'जनरल', proxy: 'प्रॉक्सी', lyrics: 'लिरिक्स',
    },
    mr: {
        home: 'मुख्यपृष्ठ', explore: 'एक्सप्लोर', newReleases: 'नवीन रिलीज', shuffle: 'शफल प्ले',
        stats: 'आकडेवारी', favorites: 'आवडते', history: 'इतिहास', likedSongs: 'आवडली गाणी',
        playlists: 'प्लेलिस्ट', library: 'लायब्ररी', artists: 'कलाकार', albums: 'अल्बम',
        settings: 'सेटिंग्ज', account: 'खाते', content: 'कंटेंट सेटिंग्ज', logs: 'लॉग्स',
        appearance: 'देखावा', aod: 'ऑलवेज ऑन डिस्प्ले', news: 'डेव्हलपर्सच्या बातम्या',
        about: 'माहिती', updates: 'अपडेट', backup: 'बॅकअप आणि रिस्टोअर',
        theme: 'थीम', darkMode: 'डार्क मोड', lightMode: 'लाइट मोड',
        accentColor: 'अ‍ॅक्सेंट रंग', colorEffects: 'रंग प्रभाव', dynamicBackground: 'डायनामिक बॅकग्राउंड',
        fonts: 'फॉन्ट', language: 'भाषा', gridSize: 'ग्रिड सेल आकार',
        dynamicIsland: 'डायनामिक आयलंड', enabled: 'चालू', disabled: 'बंद',
        save: 'सेव्ह', copy: 'कॉपी', copied: 'क्लिपबोर्डवर कॉपी झाले', clear: 'साफ करा',
        refresh: 'रिफ्रेश', download: 'सेव्ह / शेअर', signIn: 'Google ने साइन इन करा',
        signOut: 'साइन आउट', premiumTitle: 'प्रीमियम कंटेंट ब्राउझ करण्यासाठी लॉगिन करा',
        premiumDesc: 'प्रीमियम-ओन्ली गाणी, अल्बम आणि संपूर्ण लायब्ररीसाठी तुमच्या Google खात्याने साइन इन करा.',
        advancedLogin: 'अ‍ॅडव्हान्स लॉगिन — टोकन पाहण्यासाठी टॅप करा', showToken: 'टोकन दाखवा',
        hideToken: 'टोकन लपवा', syncYoutube: 'YouTube सोबत सिंक करा', big: 'मोठा', small: 'लहान',
        loading: 'लोड होत आहे', general: 'जनरल', proxy: 'प्रॉक्सी', lyrics: 'लिरिक्स',
    },
    bn: {
        home: 'হোম', explore: 'এক্সপ্লোর', newReleases: 'নতুন রিলিজ', shuffle: 'শাফল প্লে',
        stats: 'পরিসংখ্যান', favorites: 'প্রিয়', history: 'ইতিহাস', likedSongs: 'পছন্দের গান',
        playlists: 'প্লেলিস্ট', library: 'লাইব্রেরি', artists: 'শিল্পী', albums: 'অ্যালবাম',
        settings: 'সেটিংস', account: 'অ্যাকাউন্ট', content: 'কন্টেন্ট সেটিংস', logs: 'লগ',
        appearance: 'চেহারা', aod: 'অলওয়েজ অন ডিসপ্লে', news: 'ডেভেলপারদের খবর',
        about: 'সম্পর্কে', updates: 'আপডেট', backup: 'ব্যাকআপ ও রিস্টোর',
        theme: 'থিম', darkMode: 'ডার্ক মোড', lightMode: 'লাইট মোড',
        accentColor: 'অ্যাকসেন্ট রং', colorEffects: 'রঙের ইফেক্ট', dynamicBackground: 'ডায়নামিক ব্যাকগ্রাউন্ড',
        fonts: 'ফন্ট', language: 'ভাষা', gridSize: 'গ্রিড সেল সাইজ',
        dynamicIsland: 'ডায়নামিক আইল্যান্ড', enabled: 'চালু', disabled: 'বন্ধ',
        save: 'সেভ', copy: 'কপি', copied: 'ক্লিপবোর্ডে কপি হয়েছে', clear: 'মুছুন',
        refresh: 'রিফ্রেশ', download: 'সেভ / শেয়ার', signIn: 'Google দিয়ে সাইন ইন করুন',
        signOut: 'সাইন আউট', premiumTitle: 'প্রিমিয়াম কন্টেন্ট ব্রাউজ করতে লগইন করুন',
        premiumDesc: 'প্রিমিয়াম-শুধু গান, অ্যালবাম এবং সম্পূর্ণ লাইব্রেরির জন্য আপনার Google অ্যাকাউন্টে সাইন ইন করুন।',
        advancedLogin: 'অ্যাডভান্সড লগইন — টোকেন দেখতে ট্যাপ করুন', showToken: 'টোকেন দেখান',
        hideToken: 'টোকেন লুকান', syncYoutube: 'YouTube-এর সাথে সিঙ্ক করুন', big: 'বড়', small: 'ছোট',
        loading: 'লোড হচ্ছে', general: 'জেনারেল', proxy: 'প্রক্সি', lyrics: 'লিরিক্স',
    },
    ta: {
        home: 'முகப்பு', explore: 'எக்ஸ்ப்ளோர்', newReleases: 'புதிய வெளியீடுகள்', shuffle: 'ஷஃபிள் ப்ளே',
        stats: 'புள்ளிவிவரம்', favorites: 'பிடித்தவை', history: 'வரலாறு', likedSongs: 'விருப்பப் பாடல்கள்',
        playlists: 'பிளேலிஸ்ட்', library: 'லைப்ரரி', artists: 'கலைஞர்கள்', albums: 'ஆல்பங்கள்',
        settings: 'அமைப்புகள்', account: 'கணக்கு', content: 'உள்ளடக்க அமைப்புகள்', logs: 'பதிவுகள்',
        appearance: 'தோற்றம்', aod: 'ஆல்வேஸ் ஆன் டிஸ்ப்ளே', news: 'டெவலப்பர் செய்திகள்',
        about: 'பற்றி', updates: 'புதுப்பிப்புகள்', backup: 'பேக்கப் & ரிஸ்டோர்',
        theme: 'தீம்', darkMode: 'டார்க் மோட்', lightMode: 'லைட் மோட்',
        accentColor: 'அக்சென்ட் நிறம்', colorEffects: 'நிற விளைவுகள்', dynamicBackground: 'டைனமிக் பின்னணி',
        fonts: 'எழுத்துரு', language: 'மொழி', gridSize: 'கிரிட் அளவு',
        dynamicIsland: 'டைனமிக் ஐல্যান্ড', enabled: 'இயக்கு', disabled: 'முடக்கு',
        save: 'சேமி', copy: 'நகலெடு', copied: 'கிளிப்போர்டுக்கு நகலெடுக்கப்பட்டது', clear: 'அழி',
        refresh: 'புதுப்பி', download: 'சேமி / பங்கிடு', signIn: 'Google மூலம் உள்நுழைக',
        signOut: 'வெளியேறு', premiumTitle: 'பிரீமியம் உள்ளடக்கத்தை பார்க்க உள்நுழைக',
        premiumDesc: 'பிரீமியம் பாடல்கள், ஆல்பங்கள் மற்றும் முழு லைப்ரரிக்கு உங்கள் Google கணக்கில் உள்நுழைக.',
        advancedLogin: 'அட்வான்ஸ்டு உள்நுழைவு — டோக்கன் பார்க்க தட்டவும்', showToken: 'டோக்கன் காட்டு',
        hideToken: 'டோக்கன் மறை', syncYoutube: 'YouTube உடன் ஒத்திசை', big: 'பெரிய', small: 'சிறிய',
        loading: 'ஏற்றுகிறது', general: 'பொது', proxy: 'ப்ராக்ஸி', lyrics: 'பாடல் வரிகள்',
    },
    te: {
        home: 'హోమ్', explore: 'ఎక్స్‌ప్లోర్', newReleases: 'కొత్త విడుదలలు', shuffle: 'షఫుల్ ప్లే',
        stats: 'గణాంకాలు', favorites: 'ఇష్టమైనవి', history: 'చరిత్ర', likedSongs: 'లైక్ చేసిన పాటలు',
        playlists: 'ప్లేలిస్టులు', library: 'లైబ్రరీ', artists: 'కళాకారులు', albums: 'ఆల్బమ్‌లు',
        settings: 'సెట్టింగ్‌లు', account: 'ఖాతా', content: 'కంటెంట్ సెట్టింగ్‌లు', logs: 'లాగ్‌లు',
        appearance: 'రూపం', aod: 'ఆల్‌వేస్ ఆన్ డిస్‌ప్లే', news: 'డెవలపర్ వార్తలు',
        about: 'గురించి', updates: 'అప్‌డేట్‌లు', backup: 'బ్యాకప్ & రిస్టోర్',
        theme: 'థీమ్', darkMode: 'డార్క్ మోడ్', lightMode: 'లైట్ మోడ్',
        accentColor: 'యాక్సెంట్ రంగు', colorEffects: 'రంగు ప్రభావాలు', dynamicBackground: 'డైనమిక్ బ్యాక్‌గ్రౌండ్',
        fonts: 'ఫాంట్లు', language: 'భాష', gridSize: 'గ్రిడ్ సైజు',
        dynamicIsland: 'డైనమిక్ ఐలాండ్', enabled: 'ఆన్', disabled: 'ఆఫ్',
        save: 'సేవ్', copy: 'కాపీ', copied: 'క్లిప్‌బోర్డ్‌కు కాపీ అయింది', clear: 'క్లియర్',
        refresh: 'రిఫ్రెష్', download: 'సేవ్ / షేర్', signIn: 'Google తో సైన్ ఇన్',
        signOut: 'సైన్ అవుట్', premiumTitle: 'ప్రీమియం కంటెంట్ చూడటానికి లాగిన్ అవ్వండి',
        premiumDesc: 'ప్రీమియం పాటలు, ఆల్బమ్‌లు మరియు పూర్తి లైబ్రరీ కోసం మీ Google ఖాతాతో సైన్ ఇన్ అవ్వండి.',
        advancedLogin: 'అడ్వాన్స్‌డ్ లాగిన్ — టోకెన్ చూడటానికి ట్యాప్ చేయండి', showToken: 'టోకెన్ చూపించు',
        hideToken: 'టోకెన్ దాచు', syncYoutube: 'YouTube తో సింక్ చేయి', big: 'పెద్ద', small: 'చిన్న',
        loading: 'లోడ్ అవుతోంది', general: 'జనరల్', proxy: 'ప్రాక్సీ', lyrics: 'లిరిక్స్',
    },
};

window.t = function (key, fallback) {
    const lang = window.AIR_LANG || 'en';
    const dict = window.AIR_I18N[lang] || {};
    return dict[key] || window.AIR_I18N.en[key] || fallback || key;
};

window.applyI18n = function (root) {
    try {
        (root || document).querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            const value = window.t(key, '');
            if (value) el.textContent = value;
        });
    } catch (e) { }
};

window.setUiLanguage = function (code) {
    window.AIR_LANG = code || 'en';
    localStorage.setItem('air_lang', window.AIR_LANG);
    document.documentElement.setAttribute('lang', window.AIR_LANG);
    window.applyI18n();
    if (window.showToast) window.showToast((window.AIR_I18N[window.AIR_LANG] || {}).language ? window.t('language') + ': ' + (window.AIR_I18N[window.AIR_LANG].language) : 'Language: English');
    if ((window.location.hash || '').indexOf('#settings') === 0 && window.router) window.router();
};

window.airRefreshHomeFeed = function (btn) {
    if (btn && btn.classList) {
        if (btn.classList.contains('spinning')) return; // already refreshing
        btn.classList.add('spinning');
    }
    window.__airForceSimilar = true; // renderHome then refreshes Similar-To too

    // Refresh Similar-To now (in parallel) so it is a cache hit at render
    // time and the total wait stays equal to the home feed alone.
    try {
        let ta = null;
        const played = JSON.parse(localStorage.getItem('playedArtists') || '[]');
        if (Array.isArray(played) && played.length > 0) {
            ta = played[0];
        } else {
            const history = JSON.parse(localStorage.getItem('playHistory') || '[]');
            const hSong = Array.isArray(history) ? history.find((s) => s.artists?.primary?.[0]?.name) : null;
            if (hSong) {
                const a = hSong.artists.primary[0];
                ta = { id: a.id || '', name: a.name || '' };
            }
        }
        if (ta && (ta.id || ta.name)) {
            const u = ta.id
                ? `/api/similar_to?artist_id=${ta.id}&refresh=1`
                : `/api/similar_to?artist_name=${encodeURIComponent(ta.name)}&refresh=1`;
            fetch(u).catch(() => {});
        }
    } catch (e) {}

    return fetch('/api/home?refresh=1')
        .then((r) => r.json())
        .then(() => {
            if (window.airToast) airToast('Feed refreshed');
            const h = location.hash || '#home';
            if (h === '' || h === '#' || h === '#home') {
                return window.router ? window.router(true) : null;
            }
            window.__airForceSimilar = false;
        })
        .catch(() => { window.__airForceSimilar = false; if (window.airToast) airToast('Refresh failed'); })
        .finally(() => { if (btn && btn.classList) btn.classList.remove('spinning'); });
};

function airHexToRgb(hex) {
    hex = String(hex || '').trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}
function airRgbToHex(rgb) {
    const to = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + to(rgb.r) + to(rgb.g) + to(rgb.b);
}
function airRgbToHsl(rgb) {
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}
function airHslToHex(hsl) {
    const h = ((hsl.h % 360) + 360) % 360 / 360, s = Math.max(0, Math.min(100, hsl.s)) / 100, l = Math.max(0, Math.min(100, hsl.l)) / 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return airRgbToHex({ r: r * 255, g: g * 255, b: b * 255 });
}
function airAdjustColor(hex, { hue = 0, sat = 0, light = 0 } = {}) {
    const rgb = airHexToRgb(hex);
    if (!rgb) return hex;
    const hsl = airRgbToHsl(rgb);
    hsl.h += hue;
    hsl.s = Math.max(0, Math.min(100, hsl.s + sat));
    hsl.l = Math.max(0, Math.min(100, hsl.l + light));
    return airHslToHex(hsl);
}

window.airDotsHtml = function (label) {
    return '<div class="air-dots-wrap"><div class="air-dots"><span></span><span></span><span></span></div>' +
        (label ? '<div class="air-dots-label">' + label + '</div>' : '') + '</div>';
};

function airToast(msg) {
    try { if (typeof showToast === 'function') { showToast(msg); return; } } catch (e) { }
    console.log('[toast]', msg);
}

function airEsc(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

window.AIR_SETTINGS = null;

window.airLoadSettings = function (force) {
    if (window.AIR_SETTINGS && !force) return Promise.resolve(window.AIR_SETTINGS);
    return fetch('/api/settings').then((r) => r.json()).then((res) => {
        if (res && res.success) window.AIR_SETTINGS = res.data || {};
        return window.AIR_SETTINGS || {};
    }).catch(() => window.AIR_SETTINGS || {});
};

window.airSetting = function (key, fallback) {
    if (window.AIR_SETTINGS && Object.prototype.hasOwnProperty.call(window.AIR_SETTINGS, key)) return window.AIR_SETTINGS[key];
    return fallback;
};

window.airApplyServerSettings = function () {
    const enabled = window.airSetting('saavn_enabled', true);
    document.body.classList.toggle('saavn-disabled', !enabled);
};

window.airSaveSettings = function (updates) {
    return fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates || {}),
    }).then((r) => r.json()).then((res) => {
        if (res && res.success) {
            window.AIR_SETTINGS = res.data || {};
            window.airApplyServerSettings();
            airToast('Saved');
        } else {
            airToast('Save failed');
        }
        return res;
    }).catch((e) => { airToast('Save failed'); throw e; });
};

function airPostClientLog(level, message, stack, context) {
    try {
        fetch('/api/logs/client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                level: level || 'error',
                message: String(message == null ? '' : message).slice(0, 4000),
                stack: String(stack == null ? '' : stack).slice(0, 8000),
                context: context || (window.location.hash || ''),
            }),
        }).then(() => {
            if (typeof window.airRefreshCrashBadge === 'function') window.airRefreshCrashBadge();
        }).catch(() => { });
    } catch (e) { }
}
window.airPostClientLog = airPostClientLog;

window.addEventListener('error', (e) => {
    if (!e || !e.message) return;
    airPostClientLog('error', 'UncaughtException: ' + e.message, e.error && e.error.stack, 'window.onerror @ ' + (window.location.hash || ''));
});
window.addEventListener('unhandledrejection', (e) => {
    const reason = e && e.reason;
    airPostClientLog('error', 'UnhandledRejection: ' + ((reason && (reason.message || reason)) || ''), reason && reason.stack, 'unhandledrejection @ ' + (window.location.hash || ''));
});

document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.setAttribute('lang', window.AIR_LANG || 'en');

    window.airLoadSettings().then(() => {
        window.airApplyServerSettings();
        window.applyI18n();
        window.airRefreshCrashBadge();
    });
});

