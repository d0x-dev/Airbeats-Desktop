/**
 * AirBeats Desktop - Synchronized Lyrics & AI Translation Engine
 * 1:1 Implementation of AirBeats Android App:
 * - 11 Lyrics Providers (LRC Lib, KuGou, SimpMusic, YouTube subtitles, Paxsenix, Unison, BetterLyrics, Portato, YouLyPlus, Megalobiz, YouTube Music)
 * - Lyrics 3-Dot Bottom Sheet Menu (Translate AI, Search, Refetch, Edit, Providers List)
 * - AI Lyrics Translation Engine supporting OpenRouter, Gemini, OpenAI, DeepL, Claude, Groq, etc.
 * - All 52 Target Languages with Hinglish (hi-Latn) pinned at top
 * - Pre-added Prompt Presets (Poetic, Hinglish, Literal, Romanized, Song Meaning)
 */

function decodeHtml(html) {
    if (!html) return "";
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

// 52 Languages matching Android AiTranslationLanguages linkedMapOf
const AI_TRANSLATION_LANGUAGES = [
    { code: "hi-Latn", name: "Hinglish (Hindi in English)", popular: true },
    { code: "en", name: "English (US)", popular: true },
    { code: "es", name: "Español (Spanish)", popular: true },
    { code: "hi", name: "हिन्दी (Hindi)", popular: true },
    { code: "en-GB", name: "English (UK)" },
    { code: "fr", name: "Français (French)" },
    { code: "de", name: "Deutsch (German)" },
    { code: "ja", name: "日本語 (Japanese)" },
    { code: "ko", name: "한국어 (Korean)" },
    { code: "zh", name: "中文 (Chinese)" },
    { code: "ar", name: "العربية (Arabic)" },
    { code: "ru", name: "Русский (Russian)" },
    { code: "pt", name: "Português (Portuguese)" },
    { code: "it", name: "Italiano (Italian)" },
    { code: "tr", name: "Türkçe (Turkish)" },
    { code: "ur", name: "اردو (Urdu)" },
    { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
    { code: "bn", name: "বাংলা (Bengali)" },
    { code: "mr", name: "मराठी (Marathi)" },
    { code: "gu", name: "ગુજરાતી (Gujarati)" },
    { code: "ta", name: "தமிழ் (Tamil)" },
    { code: "te", name: "తెలుగు (Telugu)" },
    { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
    { code: "ml", name: "മലയാളം (Malayalam)" },
    { code: "id", name: "Bahasa Indonesia" },
    { code: "ms", name: "Bahasa Malaysia" },
    { code: "vi", name: "Tiếng Việt" },
    { code: "th", name: "ไทย (Thai)" },
    { code: "pl", name: "Polski" },
    { code: "nl", name: "Nederlands" },
    { code: "sv", name: "Svenska" },
    { code: "no", name: "Norsk" },
    { code: "da", name: "Dansk" },
    { code: "fi", name: "Suomi" },
    { code: "el", name: "Ελληνικά (Greek)" },
    { code: "he", name: "עברית (Hebrew)" },
    { code: "fa", name: "فارسی (Persian)" },
    { code: "ro", name: "Română" },
    { code: "hu", name: "Magyar" },
    { code: "cs", name: "Čeština" },
    { code: "sk", name: "Slovenčina" },
    { code: "uk", name: "Українська" },
    { code: "bg", name: "Български" },
    { code: "hr", name: "Hrvatski" },
    { code: "sr", name: "Српски" },
    { code: "sl", name: "Slovenščina" },
    { code: "et", name: "Eesti" },
    { code: "lv", name: "Latviešu" },
    { code: "lt", name: "Lietuvių" },
    { code: "fil", name: "Filipino" },
    { code: "sw", name: "Kiswahili" },
    { code: "af", name: "Afrikaans" }
];

// Models by Provider matching Android AiSettings.kt
const AI_MODELS_BY_PROVIDER = {
    "OpenRouter": [
        "google/gemini-2.5-flash-lite",
        "google/gemini-2.5-flash",
        "deepseek/deepseek-chat",
        "openai/gpt-4o-mini",
        "x-ai/grok-4.1-fast",
        "meta-llama/llama-3.3-70b-instruct",
        "Custom"
    ],
    "Gemini": [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "Custom"
    ],
    "OpenAI": [
        "gpt-4o-mini",
        "gpt-4o",
        "gpt-4-turbo",
        "Custom"
    ],
    "DeepL": [
        "default"
    ],
    "Claude": [
        "claude-3-5-haiku-latest",
        "claude-3-5-sonnet-latest",
        "Custom"
    ],
    "Groq": [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "gemma2-9b-it",
        "Custom"
    ],
    "Perplexity": [
        "sonar",
        "sonar-pro",
        "sonar-reasoning",
        "Custom"
    ],
    "XAi": [
        "grok-2-latest",
        "grok-beta",
        "Custom"
    ],
    "Mistral": [
        "mistral-small-latest",
        "mistral-large-latest",
        "codestral-latest",
        "Custom"
    ],
    "Nvidia": [
        "meta/llama-3.1-70b-instruct",
        "meta/llama-3.1-8b-instruct",
        "mistralai/mistral-large-2-instruct",
        "Custom"
    ],
    "OrcaRouter": [
        "gpt-4o-mini",
        "claude-3-5-sonnet",
        "Custom"
    ],
    "Puter": [
        "gpt-4o-mini",
        "claude-3-5-sonnet",
        "deepseek-chat",
        "Custom"
    ],
    "Custom": [
        "Custom"
    ]
};

const AI_PROVIDER_URLS = {
    "OpenRouter": "https://openrouter.ai/api/v1/chat/completions",
    "Gemini": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    "OpenAI": "https://api.openai.com/v1/chat/completions",
    "DeepL": "https://api.deepl.com/v2/translate",
    "Claude": "https://api.anthropic.com/v1/messages",
    "Groq": "https://api.groq.com/openai/v1/chat/completions",
    "Perplexity": "https://api.perplexity.ai/chat/completions",
    "XAi": "https://api.x.ai/v1/chat/completions",
    "Mistral": "https://api.mistral.ai/v1/chat/completions",
    "Nvidia": "https://integrate.api.nvidia.com/v1/chat/completions",
    "OrcaRouter": "https://api.orcarouter.com/v1/chat/completions",
    "Puter": "https://api.puter.com/v1/chat/completions",
    "Custom": ""
};

const AI_KEY_PORTALS = {
    "OpenRouter": "https://openrouter.ai/keys",
    "Gemini": "https://aistudio.google.com/app/apikey",
    "OpenAI": "https://platform.openai.com/api-keys",
    "DeepL": "https://www.deepl.com/pro-api",
    "Claude": "https://console.anthropic.com/settings/keys",
    "Groq": "https://console.groq.com/keys",
    "Perplexity": "https://www.perplexity.ai/settings/api",
    "XAi": "https://console.x.ai/",
    "Mistral": "https://console.mistral.ai/api-keys/",
    "Nvidia": "https://build.nvidia.com/",
    "OrcaRouter": "https://orcarouter.com/",
    "Puter": "https://puter.com/"
};

// 11 Providers List
const ALL_PROVIDERS = [
    { key: "lrclib", name: "LRC Lib", icon: "fa-music", desc: "Community synchronized LRC database" },
    { key: "kugou", name: "KuGou", icon: "fa-headphones-alt", desc: "KuGou music synchronized lyrics" },
    { key: "simpmusic", name: "SimpMusic", icon: "fa-compact-disc", desc: "SimpMusic synchronized lyrics API" },
    { key: "unison", name: "Unison", icon: "fa-wave-square", desc: "Unison database search & video matcher" },
    { key: "youly", name: "YouLyPlus", icon: "fa-star", desc: "YouLyPlus TTML & LRC mirror network" },
    { key: "megalobiz", name: "Megalobiz", icon: "fa-globe", desc: "Megalobiz community LRC search" },
    { key: "paxsenix", name: "Paxsenix (Multi-Source)", icon: "fa-layer-group", desc: "Spotify, Musixmatch & Apple Music aggregator" },
    { key: "portato", name: "BetterLyrics (Portato)", icon: "fa-file-audio", desc: "Portato lyrics mirror" },
    { key: "betterlyrics", name: "BetterLyrics", icon: "fa-align-left", desc: "High-fidelity TTML syllable sync" },
    { key: "youtube_subtitles", name: "YouTube subtitles", icon: "fa-closed-captioning", desc: "Timed video subtitles and captions" },
    { key: "youtube_music", name: "YouTube Music", icon: "fa-play-circle", desc: "Official YouTube Music lyrics" }
];

// Global Lyrics State
let lyricsData = [];
let isLyricsOpen = false;
let lyricsAnimationFrame = null;
let lastAudioTimeMs = 0;
let lastTimeUpdateReal = 0;

// Positive = lyrics appear LATER than audio (delay), negative = earlier.
// Per-song value saved in localStorage; 0 default.
let lyricsOffsetMs = 0;

function airLyricsOffsetsStore() {
    try { return JSON.parse(localStorage.getItem('lyrics_sync_offsets') || '{}') || {}; }
    catch (e) { return {}; }
}

function airSaveLyricsOffset(songId, ms) {
    if (!songId) return;
    try {
        const store = airLyricsOffsetsStore();
        if (ms) store[songId] = ms; else delete store[songId];
        localStorage.setItem('lyrics_sync_offsets', JSON.stringify(store));
    } catch (e) { /* ignore */ }
}

function airUpdateLyricsOffsetLabel() {
    const el = document.getElementById('lyricsSyncOffsetLabel');
    if (!el) return;
    const ms = lyricsOffsetMs || 0;
    el.textContent = ms === 0 ? '0s' : (ms > 0 ? '+' : '') + (ms / 1000).toFixed(2) + 's';
    el.style.color = ms === 0 ? 'var(--text-secondary)' : 'var(--accent)';
}

function airCurrentLyricsSongId() {
    const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
    return track && (track.id || track.videoId) ? String(track.id || track.videoId) : '';
}

window.airLyricsOffsetStep = function (delta) {
    lyricsOffsetMs = Math.max(-5000, Math.min(5000, (lyricsOffsetMs || 0) + (delta || 0)));
    airSaveLyricsOffset(airCurrentLyricsSongId(), lyricsOffsetMs);
    airUpdateLyricsOffsetLabel();
};

window.airLyricsOffsetReset = function () {
    lyricsOffsetMs = 0;
    airSaveLyricsOffset(airCurrentLyricsSongId(), 0);
    airUpdateLyricsOffsetLabel();
};
let currentLyricsFetchId = 0;

window.currentLyricsMeta = {
    provider: "LRC Lib",
    providerKey: "lrclib",
    isSynced: true,
    raw: ""
};

window.currentTranslationMeta = {
    active: false,
    langCode: localStorage.getItem('lyrics_ai_target_lang') || "hi-Latn",
    langName: "Hinglish (Hindi in English)",
    translatedLines: [],
    replaceOriginal: localStorage.getItem('lyrics_replace_original') === 'true'
};

function getLangName(code) {
    const f = AI_TRANSLATION_LANGUAGES.find(l => l.code === code);
    return f ? f.name : code;
}

// ==============================================================================
// RENDER LYRICS
// ==============================================================================

function renderLyrics(parsedLines, loader) {
    if (loader) loader.remove();
    const lyricsContainer = document.getElementById('lyricsContent');
    lyricsContainer.style.display = 'block';
    lyricsContainer.innerHTML = '';
    lyricsData = parsedLines;

    const isTransActive = window.currentTranslationMeta && window.currentTranslationMeta.active;
    const replaceOrig = window.currentTranslationMeta && window.currentTranslationMeta.replaceOriginal;
    const transLines = isTransActive ? (window.currentTranslationMeta.translatedLines || []) : [];

    parsedLines.forEach((line, index) => {
        const lineDiv = document.createElement('div');
        lineDiv.id = 'lyric-line-' + index;
        lineDiv.className = 'lyric-line';
        lineDiv.style.marginBottom = '24px';
        lineDiv.style.fontSize = '24px';
        lineDiv.style.fontWeight = '700';
        lineDiv.style.color = 'rgba(255,255,255,0.3)';
        lineDiv.style.transition = 'all 0.3s ease';
        lineDiv.style.cursor = 'pointer';

        lineDiv.onclick = () => {
            const audio = document.getElementById('audioElement');
            if (audio && line.begin >= 0 && isFinite(line.begin)) {
                const target = (line.begin + (lyricsOffsetMs || 0)) / 1000;
                if (isFinite(target) && target >= 0) audio.currentTime = target;
            }
        };

        const transText = transLines[index] || line.translatedText || "";

        // If replaceOriginal is active and translated text exists, display translated words
        const displayText = (isTransActive && replaceOrig && transText) ? transText : line.rawText;
        const wordsToDisplay = (isTransActive && replaceOrig && transText) ?
            transText.split(' ').map((w, wi, arr) => {
                const total = arr.length || 1;
                const dur = Math.max(1000, line.end - line.begin);
                const step = dur / total;
                const b = line.begin + (wi * step);
                return { text: w, begin: b, end: b + step };
            }) : line.words;

        if (wordsToDisplay && wordsToDisplay.length > 0) {
            wordsToDisplay.forEach((word, wordIndex) => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'lyric-word';
                wordSpan.setAttribute('data-begin', word.begin);
                let endTime = word.end || (wordIndex < wordsToDisplay.length - 1 ? wordsToDisplay[wordIndex + 1].begin : line.end);
                wordSpan.setAttribute('data-end', endTime);
                wordSpan.textContent = word.text + (wordIndex < wordsToDisplay.length - 1 ? ' ' : '');
                wordSpan.style.display = 'inline-block';
                wordSpan.style.whiteSpace = 'pre';
                lineDiv.appendChild(wordSpan);
            });
        } else {
            const textSpan = document.createElement('span');
            textSpan.className = 'lyric-word';
            textSpan.setAttribute('data-begin', line.begin);
            textSpan.setAttribute('data-end', line.end);
            textSpan.textContent = displayText;
            textSpan.style.display = 'inline-block';
            lineDiv.appendChild(textSpan);
        }

        // If translation is active AND NOT replacing original, append translated line subtitle
        if (isTransActive && !replaceOrig && transText) {
            const subSpan = document.createElement('span');
            subSpan.className = 'lyrics-translated-subtitle';
            subSpan.textContent = transText;
            lineDiv.appendChild(subSpan);
        }

        lyricsContainer.appendChild(lineDiv);
    });

    updateLyricsSheetMeta();
}

function showLyricsError(msg, loader) {
    if (loader) loader.remove();
    const lyricsError = document.getElementById('lyricsError');
    lyricsError.style.display = 'flex';
    lyricsError.innerHTML = '<i class="fas fa-music" style="font-size: 48px; opacity: 0.5; margin-bottom: 16px;"></i><p style="text-align:center;">' + msg + '</p>';
    updateLyricsSheetMeta();
}

// ==============================================================================
// FETCH LYRICS WITH PROVIDER SUPPORT
// ==============================================================================

async function fetchLyricsData(song, forceRefresh = false, specificProvider = null) {
    if (!song) return;
    
    currentLyricsFetchId++;
    const fetchId = currentLyricsFetchId;
    
    const lyricsContainer = document.getElementById('lyricsContent');
    const lyricsError = document.getElementById('lyricsError');
    
    lyricsContainer.innerHTML = '';
    lyricsContainer.style.display = 'none';
    lyricsError.style.display = 'none';
    lyricsData = [];
    
    document.querySelectorAll('#lyricsLottieLoader').forEach(el => el.remove());
    
    const loader = document.createElement('div');
    loader.id = 'lyricsLottieLoader';
    loader.style.width = '100px';
    loader.style.height = '100px';
    loader.style.margin = 'auto';
    lyricsContainer.parentNode.insertBefore(loader, lyricsContainer);
    
    if (typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: loader,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/static/loader.json'
        });
    }
    
    const rawArtists = typeof song.primaryArtists === 'string' ? song.primaryArtists : (song.artists?.primary?.map(a => a.name).join(', ') || '');
    const artists = decodeHtml(rawArtists);
    
    let cleanName = decodeHtml(song.name || song.title || '');
    cleanName = cleanName.replace(/\(feat\..*?\)/i, '').trim();
    
    try {
        const url = new URL('/api/lyrics', window.location.origin);
        url.searchParams.append("s", cleanName);
        url.searchParams.append("a", artists);
        if (song.duration) url.searchParams.append("d", song.duration.toString());
        if (song.id) url.searchParams.append("vid", song.id);
        if (forceRefresh) url.searchParams.append("force", "1");
        if (specificProvider) url.searchParams.append("provider", specificProvider);
        
        const response = await fetch(url.toString(), { cache: 'no-store' });
        
        if (fetchId !== currentLyricsFetchId) {
            loader.remove();
            return;
        }
        
        if (!response.ok) {
            showLyricsError('No synchronized lyrics found.', loader);
            return;
        }
        
        const data = await response.json();
        
        if (fetchId !== currentLyricsFetchId) {
            loader.remove();
            return;
        }

        let parsedLines = [];
        if (Array.isArray(data)) {
            parsedLines = data;
            window.currentLyricsMeta = {
                provider: "LRC Lib",
                providerKey: "lrclib",
                isSynced: true,
                raw: ""
            };
        } else if (data && data.parsed) {
            parsedLines = data.parsed;
            window.currentLyricsMeta = {
                provider: data.provider || "LRC Lib",
                providerKey: data.provider_key || "lrclib",
                isSynced: data.is_synced !== false,
                raw: data.raw || ""
            };
        }
        
        if (parsedLines && parsedLines.length > 0) {
            // Load the per-song sync offset (if previously adjusted)
            const sid = song.id ? String(song.id) : '';
            lyricsOffsetMs = sid ? (airLyricsOffsetsStore()[sid] || 0) : 0;
            airUpdateLyricsOffsetLabel();
            // Check if there is cached translation for this song
            loadCachedTranslationIfAvailable(song.id);
            renderLyrics(parsedLines, loader);
        } else {
            showLyricsError('No synchronized lyrics found.', loader);
        }
    } catch(e) {
        if (fetchId === currentLyricsFetchId) {
            showLyricsError('An error occurred loading lyrics.', loader);
        } else {
            loader.remove();
        }
    }
}

// Load cached translation from localStorage
function loadCachedTranslationIfAvailable(songId) {
    if (!songId) return;
    try {
        const targetLang = localStorage.getItem('lyrics_ai_target_lang') || "hi-Latn";
        const cacheKey = `lyrics_trans_${songId}_${targetLang}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const transArr = JSON.parse(cached);
            if (Array.isArray(transArr) && transArr.length > 0) {
                window.currentTranslationMeta = {
                    active: true,
                    langCode: targetLang,
                    langName: getLangName(targetLang),
                    translatedLines: transArr,
                    replaceOriginal: localStorage.getItem('lyrics_replace_original') === 'true'
                };
                return;
            }
        }
    } catch(e) {}
    window.currentTranslationMeta.active = false;
}

// ==============================================================================
// SYNCHRONIZATION RUNNER
// ==============================================================================

// Re-sync the interpolated clock on stall/buffer/seek — otherwise the
// lyrics drift ahead of the audio while buffering.
function airHookLyricsClock() {
    const audio = document.getElementById('audioElement');
    if (!audio || audio.dataset.airClockHooked === '1') return false;
    audio.dataset.airClockHooked = '1';
    ['waiting', 'stalled', 'playing', 'seeked', 'canplay', 'ratechange'].forEach((ev) => audio.addEventListener(ev, () => {
        lastAudioTimeMs = Math.floor(audio.currentTime * 1000);
        lastTimeUpdateReal = performance.now();
    }));
    return true;
}
if (!airHookLyricsClock()) document.addEventListener('DOMContentLoaded', airHookLyricsClock);

function updateLyricsSync() {
    const audio = document.getElementById('audioElement');
    if (!audio || !isLyricsOpen || !lyricsData.length) {
        lyricsAnimationFrame = requestAnimationFrame(updateLyricsSync);
        return;
    }
    
    let audioTimeMs = Math.floor(audio.currentTime * 1000);
    if (!audio.paused && !audio.seeking && audio.duration) {
        if (audioTimeMs !== lastAudioTimeMs) {
            lastAudioTimeMs = audioTimeMs;
            lastTimeUpdateReal = performance.now();
        }
        // Cap the interpolation at 350ms — the lyric clock must not run away
        // from the audio during long stalls.
        const sinceTick = performance.now() - lastTimeUpdateReal;
        audioTimeMs = lastAudioTimeMs + Math.min(sinceTick, 350);
    } else {
        lastAudioTimeMs = audioTimeMs;
        lastTimeUpdateReal = performance.now();
    }
    const currentTimeMs = Math.floor(audioTimeMs) - (lyricsOffsetMs || 0);
    const lyricsContainer = document.getElementById('lyricsContent');
    
    // Update left panel slider & play/pause icon
    const lyricsWaveformActive = document.getElementById('lyricsWaveformActive');
    const playBtnIcon = document.getElementById('lyricsLeftPlayBtn');
    if (lyricsWaveformActive && audio.duration) {
        lyricsWaveformActive.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
    }
    if (playBtnIcon) {
        if (audio.paused) {
            playBtnIcon.innerHTML = '<i class="fas fa-play" style="margin-left: 4px;"></i>';
        } else {
            playBtnIcon.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }
    
    lyricsData.forEach((line, index) => {
        const lineDiv = document.getElementById('lyric-line-' + index);
        if (!lineDiv) return;
        
        const isCurrentLine = currentTimeMs >= line.begin && currentTimeMs <= line.end;
        const isPastLine = currentTimeMs > line.end;
        
        if (isCurrentLine) {
            lineDiv.style.color = 'rgba(255,255,255,1)';
            lineDiv.style.transform = 'scale(1.05)';
            
            const offsetTop = lineDiv.offsetTop;
            const containerHeight = lyricsContainer.clientHeight;
            const scrollPos = offsetTop - (containerHeight / 2) + 20;
            
            if (Math.abs(lyricsContainer.scrollTop - scrollPos) > 5) {
                lyricsContainer.scrollTo({ top: scrollPos, behavior: 'smooth' });
            }
        } else if (isPastLine) {
            lineDiv.style.color = 'rgba(255,255,255,0.5)';
            lineDiv.style.transform = 'scale(1)';
        } else {
            lineDiv.style.color = 'rgba(255,255,255,0.3)';
            lineDiv.style.transform = 'scale(1)';
        }
        
        if (isCurrentLine) {
            const wordSpans = lineDiv.getElementsByClassName('lyric-word');
            for (let i = 0; i < wordSpans.length; i++) {
                const wordSpan = wordSpans[i];
                const wordBegin = parseInt(wordSpan.getAttribute('data-begin'));
                const wordEnd = parseInt(wordSpan.getAttribute('data-end'));
                const wordDuration = Math.max(1, wordEnd - wordBegin);
                
                if (currentTimeMs >= wordEnd) {
                    wordSpan.style.background = 'none';
                    wordSpan.style.webkitTextFillColor = 'rgba(255,255,255,1)';
                    wordSpan.style.textShadow = 'none';
                    wordSpan.style.transform = 'translateY(0px) scale(1)';
                } else if (currentTimeMs >= wordBegin && currentTimeMs < wordEnd) {
                    let progress = (currentTimeMs - wordBegin) / wordDuration;
                    if (progress < 0) progress = 0;
                    if (progress > 1) progress = 1;
                    
                    const sinProgress = Math.sin(progress * Math.PI);
                    const wordScale = 1 + (0.015 * sinProgress);
                    const targetFloat = -4 * sinProgress;
                    
                    const glowProgress = Math.min(1, progress * 2);
                    const glowAlpha = glowProgress * 0.45;
                    const glowRadius = glowProgress * 12;
                    
                    const percent = Math.min(100, Math.max(0, progress * 100));
                    const blurStart = Math.max(0, percent - 5);
                    const blurEnd = Math.min(100, percent + 5);
                    wordSpan.style.background = `linear-gradient(to right, rgba(255,255,255,1) ${blurStart}%, rgba(255,255,255,0.4) ${blurEnd}%)`;
                    wordSpan.style.webkitBackgroundClip = 'text';
                    wordSpan.style.webkitTextFillColor = 'transparent';
                    
                    wordSpan.style.textShadow = `0 0 ${glowRadius}px rgba(255,255,255,${glowAlpha})`;
                    wordSpan.style.transform = `translateY(${targetFloat}px) scale(${wordScale})`;
                } else {
                    wordSpan.style.background = 'none';
                    wordSpan.style.webkitTextFillColor = 'rgba(255,255,255,0.4)';
                    wordSpan.style.textShadow = 'none';
                    wordSpan.style.transform = 'translateY(0px) scale(1)';
                }
            }
        } else {
            const wordSpans = lineDiv.getElementsByClassName('lyric-word');
            for (let i = 0; i < wordSpans.length; i++) {
                const wordSpan = wordSpans[i];
                wordSpan.style.background = 'none';
                wordSpan.style.webkitTextFillColor = isPastLine ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
                wordSpan.style.textShadow = 'none';
                wordSpan.style.transform = 'translateY(0px) scale(1)';
            }
        }
    });
    
    lyricsAnimationFrame = requestAnimationFrame(updateLyricsSync);
}

// Left panel cover and metadata
function updateLeftPanel(song) {
    if (!song) return;
    const titleText = decodeHtml(song.name || song.title || 'Unknown');
    if (titleText.length > 25) {
        document.getElementById('lyricsLeftTitle').innerHTML = `<marquee behavior="scroll" direction="left" scrollamount="4">${titleText}</marquee>`;
    } else {
        document.getElementById('lyricsLeftTitle').textContent = titleText;
    }
    
    document.getElementById('lyricsLeftArtist').innerHTML = window.getClickableArtistsHtml ? window.getClickableArtistsHtml(song) : (typeof song.primaryArtists === 'string' ? song.primaryArtists : (song.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist'));
    
    const imgArray = song.image || [];
    let imgUrl = (imgArray.find && imgArray.find(i=>i.quality==='500x500')?.url) || imgArray[imgArray.length-1]?.url || imgArray[0]?.url || '';
    if (imgUrl) {
        imgUrl = imgUrl.replace(/=w\d+-h\d+.*/, '=w1080-h1080-l90-rj');
    }
    document.getElementById('lyricsLeftCover').src = imgUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
}

// Waveform click to seek
const lyricsProgress = document.getElementById('lyricsProgressBarContainer');
if (lyricsProgress) {
    lyricsProgress.addEventListener('click', (e) => {
        const rect = lyricsProgress.getBoundingClientRect();
        let percent = rect.width ? (e.clientX - rect.left) / rect.width : 0;
        if (!isFinite(percent)) return;
        percent = Math.max(0, Math.min(1, percent));
        const audio = document.getElementById('audioElement');
        if (audio && audio.duration && isFinite(audio.duration)) {
            const target = percent * audio.duration;
            if (isFinite(target)) audio.currentTime = target;
        }
    });
}

function initLyricsWaveform() {
    const waveformGray = document.getElementById('lyricsWaveformGray');
    const progressBar = document.getElementById('lyricsProgressBarContainer');
    if (waveformGray && progressBar) {
        let html = '';
        const pattern = [50, 70, 50, 95, 65, 50, 85, 45, 55, 70, 50, 80, 60, 50, 75, 95, 85, 80, 55, 75, 85, 80, 50, 90, 80, 50, 95, 85, 50, 80, 65, 50, 85, 95, 55, 65, 45, 55, 75, 50, 85, 70, 55, 45, 75, 65, 45, 55, 90, 55, 50, 85, 95, 70, 55, 50, 90, 65, 50, 75, 85, 55, 50, 90, 95, 65, 45, 55, 80, 60, 45, 65, 90, 75, 50, 85, 95, 60, 50, 70, 80, 55, 45, 90, 95, 65, 50, 60, 75, 55, 45, 85, 70, 50, 60, 80, 95, 60, 50, 90];
        for (let i = 0; i < 100; i++) {
            let h = pattern[i % pattern.length];
            html += `<div class="wave-bar" style="height: ${h}%"></div>`;
        }
        waveformGray.innerHTML = html;
        document.getElementById('lyricsWaveformActive').innerHTML = html;
    }
}
initLyricsWaveform();

window.toggleLyrics = function() {
    const overlay = document.getElementById('lyricsOverlay');
    isLyricsOpen = !isLyricsOpen;
    
    const lyricsBtn = document.getElementById('lyricsBtn');
    if (lyricsBtn) {
        if (isLyricsOpen) lyricsBtn.classList.add('active-icon');
        else lyricsBtn.classList.remove('active-icon');
    }
    
    if (isLyricsOpen) {
        overlay.style.display = 'block';
        setTimeout(() => overlay.classList.add('open'), 10);
        
        const currentSong = window.getCurrentTrack ? window.getCurrentTrack() : null;
        if (currentSong) {
            updateLeftPanel(currentSong);
            const currentTitle = document.getElementById('lyricsTitle')?.getAttribute('data-song-id');
            if (currentTitle !== currentSong.id) {
                if (document.getElementById('lyricsTitle')) {
                    document.getElementById('lyricsTitle').setAttribute('data-song-id', currentSong.id);
                }
                fetchLyricsData(currentSong);
            }
        }
        
        updateLyricsSync();
    } else {
        isLyricsOpen = false;
        document.getElementById('lyricsOverlay').style.display = 'none';
        document.getElementById('lyricsOverlay').classList.remove('open');
        cancelAnimationFrame(lyricsAnimationFrame);
    }
};

window.forceRefreshLyrics = () => {
    const track = window.getCurrentTrack && window.getCurrentTrack();
    if (track) {
        document.getElementById('lyricsContent').style.display = 'none';
        document.getElementById('lyricsError').style.display = 'none';
        fetchLyricsData(track, true);
    }
};

window.onSongChangeForLyrics = function(newSong) {
    if (isLyricsOpen) {
        updateLeftPanel(newSong);
        if (document.getElementById('lyricsTitle')) {
            document.getElementById('lyricsTitle').setAttribute('data-song-id', newSong.id);
        }
        fetchLyricsData(newSong);
    }
};

window.closeLyrics = window.toggleLyrics;


// ==============================================================================
// LYRICS 3-DOT BOTTOM SHEET POPUP MANAGEMENT (Android LyricsMenu.kt)
// ==============================================================================

function updateLyricsSheetMeta() {
    const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
    if (!track) return;

    const sheetTitle = document.getElementById('lyricsSheetTitle');
    const sheetArtist = document.getElementById('lyricsSheetArtist');
    const sheetCover = document.getElementById('lyricsSheetCover');
    const sheetBadge = document.getElementById('lyricsSheetBadge');
    const currentTag = document.getElementById('lyricsCurrentProviderTag');
    const transBanner = document.getElementById('lyricsActiveTranslationBanner');
    const transLangText = document.getElementById('lyricsActiveTransLang');
    const translateBadge = document.getElementById('lyricsTranslateBadge');
    const translateSub = document.getElementById('lyricsTranslateSub');

    if (sheetTitle) sheetTitle.textContent = decodeHtml(track.name || track.title || 'AirBeats Track');
    if (sheetArtist) {
        sheetArtist.textContent = decodeHtml(
            typeof track.primaryArtists === 'string' ? track.primaryArtists : (track.artists?.primary?.map(a => a.name).join(', ') || 'Unknown')
        );
    }
    if (sheetCover) {
        const imgArray = track.image || [];
        let imgUrl = (imgArray.find && imgArray.find(i=>i.quality==='500x500')?.url) || imgArray[imgArray.length-1]?.url || imgArray[0]?.url || '';
        sheetCover.src = imgUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }

    const isTransActive = window.currentTranslationMeta && window.currentTranslationMeta.active;
    const isSynced = window.currentLyricsMeta && window.currentLyricsMeta.isSynced;

    if (sheetBadge) {
        if (isTransActive) {
            sheetBadge.textContent = "Translated";
            sheetBadge.className = "lyrics-status-badge translated";
        } else if (isSynced) {
            sheetBadge.textContent = "Synced";
            sheetBadge.className = "lyrics-status-badge synced";
        } else {
            sheetBadge.textContent = "Plain";
            sheetBadge.className = "lyrics-status-badge";
        }
    }

    if (currentTag) {
        currentTag.textContent = window.currentLyricsMeta.provider || "LRC Lib";
    }

    if (transBanner) {
        if (isTransActive) {
            transBanner.style.display = 'flex';
            if (transLangText) transLangText.textContent = window.currentTranslationMeta.langName;
            if (translateBadge) {
                translateBadge.textContent = "Active";
                translateBadge.className = "lyrics-card-badge active-badge";
            }
            if (translateSub) translateSub.textContent = "Retranslate";
        } else {
            transBanner.style.display = 'none';
            if (translateBadge) {
                translateBadge.textContent = "AI";
                translateBadge.className = "lyrics-card-badge";
            }
            if (translateSub) translateSub.textContent = "AI Translation";
        }
    }
}

function renderProvidersList() {
    const list = document.getElementById('lyricsProvidersList');
    if (!list) return;

    list.innerHTML = '';
    const activeKey = window.currentLyricsMeta.providerKey || "lrclib";

    ALL_PROVIDERS.forEach(prov => {
        const isActive = (prov.key === activeKey);
        const row = document.createElement('div');
        row.className = `lyrics-provider-row ${isActive ? 'active' : ''}`;
        row.onclick = () => window.fetchFromSpecificProvider(prov.key);

        row.innerHTML = `
            <div class="lyrics-provider-row-left">
                <div class="lyrics-provider-icon">
                    <i class="fas ${prov.icon}"></i>
                </div>
                <div class="lyrics-provider-info">
                    <div class="lyrics-provider-name">${prov.name}</div>
                    <div class="lyrics-provider-desc">${prov.desc}</div>
                </div>
            </div>
            ${isActive ? '<span class="lyrics-provider-pill">Active</span>' : '<i class="fas fa-chevron-right" style="color: rgba(255,255,255,0.2); font-size: 11px;"></i>'}
        `;
        list.appendChild(row);
    });
}

window.openLyricsMenu = function() {
    const overlay = document.getElementById('lyricsMenuSheetOverlay');
    const sheet = document.getElementById('lyricsMenuSheet');
    if (!overlay) return;

    updateLyricsSheetMeta();
    renderProvidersList();

    if (sheet) {
        sheet.style.transform = '';
        sheet.style.transition = '';
    }

    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
        overlay.classList.add('open');
    });
};

window.closeLyricsMenu = function(e) {
    if (e && e.target && e.target !== e.currentTarget &&
        !e.target.classList.contains('sheet-close-btn') &&
        !e.target.classList.contains('sheet-handle-bar') &&
        !e.target.closest('.sheet-close-btn') &&
        !e.target.closest('.sheet-handle-bar')) {
        return;
    }
    const overlay = document.getElementById('lyricsMenuSheetOverlay');
    if (!overlay) return;

    overlay.classList.remove('open');
    setTimeout(() => {
        if (!overlay.classList.contains('open')) {
            overlay.style.display = 'none';
        }
    }, 320);
};

window.refetchLyrics = function() {
    window.closeLyricsMenu();
    window.forceRefreshLyrics();
};

window.fetchFromSpecificProvider = function(provKey) {
    const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
    if (!track) return;
    window.closeLyricsMenu();
    fetchLyricsData(track, true, provKey);
};


// ==============================================================================
// SEARCH LYRICS MODAL
// ==============================================================================

window.openLyricsSearchModal = function() {
    window.closeLyricsMenu();
    const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
    const modal = document.getElementById('lyricsSearchModal');
    if (!modal) return;

    const titleInput = document.getElementById('lyricsSearchTitleInput');
    const artistInput = document.getElementById('lyricsSearchArtistInput');
    const resultsContainer = document.getElementById('lyricsSearchResultsContainer');

    if (track) {
        if (titleInput) titleInput.value = decodeHtml(track.name || track.title || '');
        if (artistInput) {
            artistInput.value = decodeHtml(
                typeof track.primaryArtists === 'string' ? track.primaryArtists : (track.artists?.primary?.map(a => a.name).join(', ') || '')
            );
        }
    }
    if (resultsContainer) resultsContainer.innerHTML = '';

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('open'));
};

window.closeLyricsSearchModal = function(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.closest('.sheet-close-btn') && !e.target.classList.contains('sheet-close-btn')) return;
    const modal = document.getElementById('lyricsSearchModal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.style.display = 'none', 250);
    }
};

window.searchLyricsOnlineWeb = function() {
    const title = document.getElementById('lyricsSearchTitleInput')?.value || '';
    const artist = document.getElementById('lyricsSearchArtistInput')?.value || '';
    const q = encodeURIComponent(`${artist} ${title} lyrics`.trim());
    window.open(`https://www.google.com/search?q=${q}`, '_blank');
};

window.executeLyricsSearch = async function() {
    const title = document.getElementById('lyricsSearchTitleInput')?.value || '';
    const artist = document.getElementById('lyricsSearchArtistInput')?.value || '';
    const resultsContainer = document.getElementById('lyricsSearchResultsContainer');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; padding: 24px;">
            <div class="lyrics-mini-spinner" style="width: 28px; height: 28px;"></div>
            <span style="margin-left: 10px; font-size: 13px; color: var(--text-secondary);">Searching 11 providers...</span>
        </div>
    `;

    try {
        const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
        const dur = (track && track.duration) ? track.duration : 0;
        const vid = (track && track.id) ? track.id : '';

        const url = new URL('/api/lyrics/search', window.location.origin);
        url.searchParams.append("s", title);
        url.searchParams.append("a", artist);
        if (dur) url.searchParams.append("d", dur.toString());
        if (vid) url.searchParams.append("vid", vid);

        const resp = await fetch(url.toString());
        const data = await resp.json();

        if (!data || !data.results || data.results.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; font-size: 13px; color: var(--text-secondary);">No lyrics found across providers.</div>';
            return;
        }

        resultsContainer.innerHTML = '';
        data.results.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'lyrics-search-item';
            row.innerHTML = `
                <div style="flex: 1; padding-right: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-size: 13px; font-weight: 700; color: #fff;">${item.provider}</span>
                        <span class="lyrics-status-badge ${item.is_synced ? 'synced' : ''}">${item.is_synced ? 'Synced' : 'Plain'}</span>
                    </div>
                    <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; white-space: pre-line; max-height: 52px; overflow: hidden;">${item.preview || 'Lyrics available'}</div>
                </div>
                <button class="modal-btn-primary" style="padding: 6px 12px; font-size: 11px;" onclick='window.applySearchedLyrics(${JSON.stringify(item).replace(/'/g, "&apos;")})'>
                    Apply
                </button>
            `;
            resultsContainer.appendChild(row);
        });
    } catch(e) {
        resultsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #ff6b6b; font-size: 13px;">Search failed: ${e.message}</div>`;
    }
};

window.applySearchedLyrics = function(item) {
    if (!item || !item.parsed) return;
    window.currentLyricsMeta = {
        provider: item.provider || "Custom",
        providerKey: item.provider_key || "custom",
        isSynced: item.is_synced !== false,
        raw: item.raw || ""
    };
    renderLyrics(item.parsed, null);
    window.closeLyricsSearchModal();
};


// ==============================================================================
// EDIT LYRICS MODAL
// ==============================================================================

window.openLyricsEditModal = function() {
    window.closeLyricsMenu();
    const modal = document.getElementById('lyricsEditModal');
    const textarea = document.getElementById('lyricsEditTextarea');
    if (!modal || !textarea) return;

    let textVal = window.currentLyricsMeta.raw || "";
    if (!textVal && lyricsData && lyricsData.length > 0) {
        textVal = lyricsData.map(l => {
            const m = Math.floor(l.begin / 60000);
            const s = Math.floor((l.begin % 60000) / 1000);
            const ms = Math.floor((l.begin % 1000) / 10);
            return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}] ${l.rawText}`;
        }).join('\n');
    }
    textarea.value = textVal;

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('open'));
};

window.closeLyricsEditModal = function(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.closest('.sheet-close-btn') && !e.target.classList.contains('sheet-close-btn')) return;
    const modal = document.getElementById('lyricsEditModal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.style.display = 'none', 250);
    }
};

window.saveEditedLyrics = function() {
    const textarea = document.getElementById('lyricsEditTextarea');
    if (!textarea) return;

    const raw = textarea.value.trim();
    if (!raw) return;

    // Parse lines locally
    const lines = raw.split('\n');
    const parsed = [];
    const timeRegex = /\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\]/;
    let isSynced = false;

    lines.forEach((l, idx) => {
        const match = timeRegex.exec(l);
        if (match) {
            isSynced = true;
            const min = parseInt(match[1]);
            const sec = parseFloat(match[2]);
            const b = Math.floor((min * 60 + sec) * 1000);
            const text = l.replace(timeRegex, '').trim();
            if (text) {
                parsed.push({ begin: b, end: b + 4000, rawText: text, words: text.split(' ').map(w => ({ text: w, begin: b, end: b + 4000 })) });
            }
        } else if (l.trim()) {
            const b = idx * 4000;
            parsed.push({ begin: b, end: b + 4000, rawText: l.trim(), words: l.trim().split(' ').map(w => ({ text: w, begin: b, end: b + 4000 })) });
        }
    });

    for (let i = 0; i < parsed.length - 1; i++) {
        parsed[i].end = parsed[i + 1].begin;
    }

    window.currentLyricsMeta = {
        provider: "Edited",
        providerKey: "edited",
        isSynced: isSynced,
        raw: raw
    };

    renderLyrics(parsed, null);
    window.closeLyricsEditModal();
};


// ==============================================================================
// AI TRANSLATION MODAL & ACTIONS
// ==============================================================================

window.openAiTranslateModal = function() {
    window.closeLyricsMenu();
    const modal = document.getElementById('lyricsAiTranslateModal');
    if (!modal) return;

    const langDisplay = document.getElementById('lyricsAiTargetLangDisplay');
    const curLangCode = localStorage.getItem('lyrics_ai_target_lang') || "hi-Latn";
    if (langDisplay) langDisplay.textContent = getLangName(curLangCode);

    const modeSelect = document.getElementById('lyricsAiModeSelect');
    if (modeSelect) modeSelect.value = localStorage.getItem('lyrics_ai_mode') || "Literal";

    const promptInput = document.getElementById('lyricsAiCustomPrompt');
    if (promptInput) promptInput.value = localStorage.getItem('lyrics_ai_custom_prompt') || "";

    const replaceToggle = document.getElementById('lyricsReplaceOriginalToggle');
    if (replaceToggle) replaceToggle.checked = (localStorage.getItem('lyrics_replace_original') === 'true');

    // Provider & model sync
    const provSelect = document.getElementById('lyricsAiProviderSelect');
    const savedProv = localStorage.getItem('lyrics_ai_provider') || "OpenRouter";
    if (provSelect) provSelect.value = savedProv;

    window.syncAiProviderModels(savedProv);

    const keyInput = document.getElementById('lyricsAiApiKeyInput');
    if (keyInput) keyInput.value = localStorage.getItem(`lyrics_ai_key_${savedProv}`) || localStorage.getItem('lyrics_ai_key_default') || "";

    const clearBtn = document.getElementById('lyricsAiClearBtn');
    if (clearBtn) {
        clearBtn.style.display = (window.currentTranslationMeta && window.currentTranslationMeta.active) ? 'inline-flex' : 'none';
    }

    const statusBox = document.getElementById('lyricsAiStatusContainer');
    if (statusBox) statusBox.style.display = 'none';

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('open'));
};

window.closeAiTranslateModal = function(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.closest('.sheet-close-btn') && !e.target.classList.contains('sheet-close-btn')) return;
    const modal = document.getElementById('lyricsAiTranslateModal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.style.display = 'none', 250);
    }
};

window.syncAiProviderModels = function(prov) {
    const modelSelect = document.getElementById('lyricsAiModelSelect');
    const customModelInput = document.getElementById('lyricsAiCustomModelInput');
    const baseUrlContainer = document.getElementById('lyricsAiBaseUrlContainer');
    const portalLink = document.getElementById('lyricsAiKeyPortalLink');
    if (!modelSelect) return;

    const models = AI_MODELS_BY_PROVIDER[prov] || ["Custom"];
    modelSelect.innerHTML = '';
    models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        modelSelect.appendChild(opt);
    });

    const savedModel = localStorage.getItem(`lyrics_ai_model_${prov}`) || models[0];
    if (models.includes(savedModel)) {
        modelSelect.value = savedModel;
        if (customModelInput) customModelInput.style.display = 'none';
    } else {
        modelSelect.value = "Custom";
        if (customModelInput) {
            customModelInput.style.display = 'block';
            customModelInput.value = savedModel;
        }
    }

    if (baseUrlContainer) {
        baseUrlContainer.style.display = (prov === 'Custom') ? 'block' : 'none';
    }

    if (portalLink) {
        const portal = AI_KEY_PORTALS[prov];
        if (portal) {
            portalLink.href = portal;
            portalLink.style.display = 'inline';
            portalLink.innerHTML = `Get ${prov} Key <i class="fas fa-external-link-alt"></i>`;
        } else {
            portalLink.style.display = 'none';
        }
    }
};

window.onAiProviderChange = function(prov) {
    localStorage.setItem('lyrics_ai_provider', prov);
    window.syncAiProviderModels(prov);
    const keyInput = document.getElementById('lyricsAiApiKeyInput');
    if (keyInput) keyInput.value = localStorage.getItem(`lyrics_ai_key_${prov}`) || "";
};

window.onAiModelChange = function(model) {
    const prov = document.getElementById('lyricsAiProviderSelect')?.value || "OpenRouter";
    const customModelInput = document.getElementById('lyricsAiCustomModelInput');
    if (model === "Custom") {
        if (customModelInput) customModelInput.style.display = 'block';
    } else {
        if (customModelInput) customModelInput.style.display = 'none';
        localStorage.setItem(`lyrics_ai_model_${prov}`, model);
    }
};

window.toggleAiEngineSettings = function() {
    const body = document.getElementById('aiEngineSettingsBody');
    const chevron = document.getElementById('aiEngineSettingsChevron');
    if (!body) return;
    const isHidden = (body.style.display === 'none');
    body.style.display = isHidden ? 'block' : 'none';
    if (chevron) chevron.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
};

window.toggleAiKeyVisibility = function() {
    const input = document.getElementById('lyricsAiApiKeyInput');
    const eye = document.getElementById('lyricsAiKeyToggleEye');
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        if (eye) eye.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        if (eye) eye.className = 'fas fa-eye';
    }
};

window.toggleReplaceOriginalLyrics = function() {
    const toggle = document.getElementById('lyricsReplaceOriginalToggle');
    if (toggle) {
        toggle.checked = !toggle.checked;
        window.onReplaceOriginalToggleChange(toggle.checked);
    }
};

window.onReplaceOriginalToggleChange = function(checked) {
    localStorage.setItem('lyrics_replace_original', checked ? 'true' : 'false');
    if (window.currentTranslationMeta) {
        window.currentTranslationMeta.replaceOriginal = checked;
        if (window.currentTranslationMeta.active && lyricsData && lyricsData.length > 0) {
            renderLyrics(lyricsData, null);
        }
    }
};

window.onAiModeChange = function(mode) {
    localStorage.setItem('lyrics_ai_mode', mode);
};

window.applyPromptPreset = function(preset) {
    const input = document.getElementById('lyricsAiCustomPrompt');
    if (!input) return;
    let txt = "";
    if (preset === 'poetic') {
        txt = "Translate with lyrical rhyme and musical rhythm that can be sung along to the music.";
        document.getElementById('lyricsAiModeSelect').value = "Poetic";
    } else if (preset === 'hinglish') {
        txt = "Translate into natural, conversational Hinglish using ONLY the English/Latin alphabet. Make it rhythmic, poetic, and singable. Never use Devanagari script.";
        document.getElementById('lyricsAiModeSelect').value = "Hinglish";
        window.selectTargetLanguage('hi-Latn', 'Hinglish (Hindi in English)');
    } else if (preset === 'literal') {
        txt = "Translate accurately while preserving the poetic meaning and emotion of the song.";
        document.getElementById('lyricsAiModeSelect').value = "Literal";
    } else if (preset === 'romanized') {
        txt = "Romanize/transliterate the lines into standard Latin alphabet characters (a-z, A-Z) without special diacritics.";
        document.getElementById('lyricsAiModeSelect').value = "Romanized";
    } else if (preset === 'meaning') {
        txt = "Explain the artistic metaphor and emotional subtext of each line.";
        document.getElementById('lyricsAiModeSelect').value = "Custom";
    }
    input.value = txt;
    localStorage.setItem('lyrics_ai_custom_prompt', txt);
};

window.executeAiTranslation = async function() {
    if (!lyricsData || lyricsData.length === 0) {
        alert("No lyrics loaded to translate.");
        return;
    }

    const provider = document.getElementById('lyricsAiProviderSelect')?.value || "OpenRouter";
    let model = document.getElementById('lyricsAiModelSelect')?.value || "google/gemini-2.5-flash-lite";
    if (model === "Custom") {
        model = document.getElementById('lyricsAiCustomModelInput')?.value || model;
    }

    const key = document.getElementById('lyricsAiApiKeyInput')?.value || "";
    const baseUrl = document.getElementById('lyricsAiBaseUrlInput')?.value || "";
    const mode = document.getElementById('lyricsAiModeSelect')?.value || "Literal";
    const customPrompt = document.getElementById('lyricsAiCustomPrompt')?.value || "";
    const targetCode = localStorage.getItem('lyrics_ai_target_lang') || "hi-Latn";
    const targetName = getLangName(targetCode);

    // Save configurations
    localStorage.setItem(`lyrics_ai_key_${provider}`, key);
    localStorage.setItem('lyrics_ai_key_default', key);
    localStorage.setItem(`lyrics_ai_model_${provider}`, model);
    localStorage.setItem('lyrics_ai_custom_prompt', customPrompt);
    localStorage.setItem('lyrics_ai_mode', mode);

    const statusBox = document.getElementById('lyricsAiStatusContainer');
    const statusTitle = document.getElementById('lyricsAiStatusTitle');
    const statusSub = document.getElementById('lyricsAiStatusSub');
    const submitBtn = document.getElementById('lyricsAiSubmitBtn');

    if (statusBox) statusBox.style.display = 'block';
    if (statusTitle) statusTitle.textContent = `Translating to ${targetName}...`;
    if (statusSub) statusSub.textContent = `Sending ${lyricsData.length} lines to ${provider}...`;
    if (submitBtn) submitBtn.disabled = true;

    const linesToTranslate = lyricsData.map(l => l.rawText);

    try {
        const resp = await fetch('/api/lyrics/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lines: linesToTranslate,
                target_language_code: targetCode,
                target_language_name: targetName,
                api_key: key,
                base_url: baseUrl,
                model: model,
                mode: mode,
                custom_prompt: customPrompt,
                provider: provider
            })
        });

        const data = await resp.json();

        if (!resp.ok || !data.success) {
            throw new Error(data.error || `HTTP ${resp.status}`);
        }

        const translations = data.translations || [];
        if (translations.length === 0) {
            throw new Error("Empty translation received from AI.");
        }

        // Cache translation locally
        const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
        if (track && track.id) {
            localStorage.setItem(`lyrics_trans_${track.id}_${targetCode}`, JSON.stringify(translations));
        }

        window.currentTranslationMeta = {
            active: true,
            langCode: targetCode,
            langName: targetName,
            translatedLines: translations,
            replaceOriginal: localStorage.getItem('lyrics_replace_original') === 'true'
        };

        // Apply translated lines to lyricsData
        lyricsData.forEach((l, idx) => {
            if (idx < translations.length) {
                l.translatedText = translations[idx];
            }
        });

        renderLyrics(lyricsData, null);
        window.closeAiTranslateModal();
    } catch(e) {
        if (statusTitle) statusTitle.textContent = "Translation Failed";
        if (statusSub) statusSub.textContent = e.message;
        if (statusBox) statusBox.style.background = "rgba(231, 76, 60, 0.2)";
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
};

window.clearAiTranslation = function() {
    window.currentTranslationMeta = {
        active: false,
        langCode: "hi-Latn",
        langName: "Hinglish (Hindi in English)",
        translatedLines: [],
        replaceOriginal: false
    };

    const track = window.getCurrentTrack ? window.getCurrentTrack() : null;
    if (track && track.id) {
        try {
            const targetLang = localStorage.getItem('lyrics_ai_target_lang') || "hi-Latn";
            localStorage.removeItem(`lyrics_trans_${track.id}_${targetLang}`);
        } catch(e) {}
    }

    if (lyricsData && lyricsData.length > 0) {
        lyricsData.forEach(l => { delete l.translatedText; });
        renderLyrics(lyricsData, null);
    }

    window.closeAiTranslateModal();
    updateLyricsSheetMeta();
};


// ==============================================================================
// SEARCHABLE TARGET LANGUAGE SELECTOR (52 Languages)
// ==============================================================================

window.openLangSelectorModal = function() {
    const modal = document.getElementById('lyricsLangSelectorModal');
    if (!modal) return;
    window.filterLanguages("");
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('open'));
};

window.closeLangSelectorModal = function(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.closest('.sheet-close-btn') && !e.target.classList.contains('sheet-close-btn')) return;
    const modal = document.getElementById('lyricsLangSelectorModal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.style.display = 'none', 250);
    }
};

window.filterLanguages = function(query) {
    const container = document.getElementById('lyricsLangListContainer');
    if (!container) return;
    container.innerHTML = '';

    const curLangCode = localStorage.getItem('lyrics_ai_target_lang') || "hi-Latn";
    const q = (query || '').toLowerCase().trim();

    const filtered = AI_TRANSLATION_LANGUAGES.filter(l => {
        return l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q);
    });

    filtered.forEach(lang => {
        const isSelected = (lang.code === curLangCode);
        const item = document.createElement('div');
        item.className = `lyrics-lang-item ${isSelected ? 'selected' : ''}`;
        item.onclick = () => window.selectTargetLanguage(lang.code, lang.name);

        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 13px; color: ${isSelected ? 'var(--accent)' : '#fff'};">${lang.name}</span>
                ${lang.popular ? '<span class="popular-lang-pill">Popular</span>' : ''}
            </div>
            ${isSelected ? '<i class="fas fa-check" style="color: var(--accent-text); font-size: 12px;"></i>' : ''}
        `;
        container.appendChild(item);
    });
};

window.selectTargetLanguage = function(code, name) {
    localStorage.setItem('lyrics_ai_target_lang', code);
    const display = document.getElementById('lyricsAiTargetLangDisplay');
    if (display) display.textContent = name;
    window.closeLangSelectorModal();
};

// Bottom sheet drag gesture support
(function setupLyricsSheetDrag() {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const onStart = (clientY) => {
        const sheet = document.getElementById('lyricsMenuSheet');
        if (!sheet) return;
        startY = clientY;
        currentY = clientY;
        isDragging = true;
        sheet.style.transition = 'none';
    };

    const onMove = (clientY) => {
        if (!isDragging) return;
        const sheet = document.getElementById('lyricsMenuSheet');
        if (!sheet) return;
        const delta = clientY - startY;
        if (delta > 0) {
            sheet.style.transform = `translateY(${delta}px)`;
        }
    };

    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const sheet = document.getElementById('lyricsMenuSheet');
        if (!sheet) return;
        sheet.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        const delta = currentY - startY;
        if (delta > 90) {
            window.closeLyricsMenu();
        } else {
            sheet.style.transform = 'translateY(0)';
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        const handle = document.querySelector('#lyricsMenuSheet .sheet-handle-bar');
        const header = document.querySelector('#lyricsMenuSheet .sheet-header');
        [handle, header].forEach(el => {
            if (!el) return;
            el.addEventListener('mousedown', (e) => onStart(e.clientY));
            el.addEventListener('touchstart', (e) => onStart(e.touches[0].clientY), { passive: true });
        });

        window.addEventListener('mousemove', (e) => onMove(e.clientY));
        window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientY), { passive: true });
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);
    });
})();

// Keyboard listener for Escape key to close lyrics menu or modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const menuSheet = document.getElementById('lyricsMenuSheetOverlay');
        if (menuSheet && menuSheet.style.display !== 'none') {
            window.closeLyricsMenu();
            return;
        }
        const searchModal = document.getElementById('lyricsSearchModal');
        if (searchModal && searchModal.style.display !== 'none') {
            window.closeLyricsSearchModal();
            return;
        }
        const editModal = document.getElementById('lyricsEditModal');
        if (editModal && editModal.style.display !== 'none') {
            window.closeLyricsEditModal();
            return;
        }
        const aiModal = document.getElementById('lyricsAiTranslateModal');
        if (aiModal && aiModal.style.display !== 'none') {
            window.closeAiTranslateModal();
            return;
        }
        const langModal = document.getElementById('lyricsLangSelectorModal');
        if (langModal && langModal.style.display !== 'none') {
            window.closeLangSelectorModal();
            return;
        }
    }
});
