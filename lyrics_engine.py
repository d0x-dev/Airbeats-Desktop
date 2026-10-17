"""
AirBeats Desktop - Lyrics Engine & AI Translation Service
Ported faithfully from AirBeats Android app:
- 11 Lyrics Providers (LrcLib, KuGou, SimpMusic, YouTube Subtitles, Paxsenix, Unison, BetterLyrics, Portato, YouLyPlus, Megalobiz, YouTube Music)
- AI Lyrics Translation Service supporting OpenRouter, Gemini, OpenAI, DeepL, Claude, Groq, Perplexity, XAi, Mistral, Nvidia, OrcaRouter, Puter, Custom
- Language support matching Android AiTranslationLanguages (52 languages including Hinglish hi-Latn)
"""

import re
import os
import json
import time
import xml.etree.ElementTree as ET
import urllib.parse
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
}

AI_LANGUAGES = {
    "hi-Latn": "Hinglish (Hindi in English)",
    "en": "English (US)",
    "en-GB": "English (UK)",
    "hi": "हिन्दी (Hindi)",
    "es": "Español (Spanish)",
    "fr": "Français (French)",
    "de": "Deutsch (German)",
    "ja": "日本語 (Japanese)",
    "ko": "한국어 (Korean)",
    "zh": "中文 (Chinese)",
    "ar": "العربية (Arabic)",
    "ru": "Русский (Russian)",
    "pt": "Português (Portuguese)",
    "it": "Italiano (Italian)",
    "tr": "Türkçe (Turkish)",
    "ur": "اردو (Urdu)",
    "pa": "ਪੰਜਾਬੀ (Punjabi)",
    "bn": "বাংলা (Bengali)",
    "mr": "मराठी (Marathi)",
    "gu": "ગુજરાતી (Gujarati)",
    "ta": "தமிழ் (Tamil)",
    "te": "తెలుగు (Telugu)",
    "kn": "ಕನ್ನಡ (Kannada)",
    "ml": "മലയാളം (Malayalam)",
    "id": "Bahasa Indonesia",
    "ms": "Bahasa Malaysia",
    "vi": "Tiếng Việt",
    "th": "ไทย (Thai)",
    "pl": "Polski",
    "nl": "Nederlands",
    "sv": "Svenska",
    "no": "Norsk",
    "da": "Dansk",
    "fi": "Suomi",
    "el": "Ελληνικά (Greek)",
    "he": "עברית (Hebrew)",
    "fa": "فارسی (Persian)",
    "ro": "Română",
    "hu": "Magyar",
    "cs": "Čeština",
    "sk": "Slovenčina",
    "uk": "Українська",
    "bg": "Български",
    "hr": "Hrvatski",
    "sr": "Српски",
    "sl": "Slovenščina",
    "et": "Eesti",
    "lv": "Latviešu",
    "lt": "Lietuvių",
    "fil": "Filipino",
    "sw": "Kiswahili",
    "af": "Afrikaans",
}

PROVIDER_KEYS = [
    "lrclib",
    "simpmusic",
    "youtube_subtitles",
    "kugou",
    "paxsenix",
    "unison",
    "betterlyrics",
    "portato",
    "youly",
    "megalobiz",
    "youtube_music"
]

PROVIDER_NAMES = {
    "lrclib": "LRC Lib",
    "simpmusic": "SimpMusic",
    "youtube_subtitles": "YouTube subtitles",
    "kugou": "KuGou",
    "paxsenix": "Paxsenix (Multi-Source)",
    "unison": "Unison",
    "betterlyrics": "BetterLyrics",
    "portato": "BetterLyrics (Portato)",
    "youly": "YouLyPlus",
    "megalobiz": "Megalobiz",
    "youtube_music": "YouTube Music"
}


# ==============================================================================
# LRC & TTML PARSING HELPERS
# ==============================================================================

def parse_time_ms(time_str):
    if not time_str:
        return 0
    parts = time_str.split(':')
    if len(parts) == 2:
        return int((float(parts[0]) * 60 + float(parts[1])) * 1000)
    elif len(parts) == 3:
        return int((float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])) * 1000)
    try:
        return int(float(time_str) * 1000)
    except:
        return 0

def parse_ttml(ttml_string):
    try:
        clean_xml = re.sub(r'</?([a-zA-Z0-9_\-]+):', lambda m: '</' if m.group(0).startswith('</') else '<', ttml_string)
        clean_xml = re.sub(r'\s+xmlns(:[a-zA-Z0-9_\-]+)?=\"[^\"]*\"', '', clean_xml)
        clean_xml = re.sub(r'\s+[a-zA-Z0-9_\-]+:[a-zA-Z0-9_\-]+=\"[^\"]*\"', '', clean_xml)
        root = ET.fromstring(clean_xml)
        parsed_lines = []
        
        for p in root.findall('.//p'):
            line_begin = parse_time_ms(p.get('begin'))
            line_end = parse_time_ms(p.get('end'))
            words = []
            
            for span in p.findall('.//span'):
                words.append({
                    'text': span.text or '',
                    'begin': parse_time_ms(span.get('begin')),
                    'end': parse_time_ms(span.get('end'))
                })
                
            if not words:
                text = ''.join(p.itertext()).strip()
                parts = [part for part in text.split(' ') if part]
                total_chars = len(''.join(parts)) or 1
                current_begin = line_begin
                
                for i, part in enumerate(parts):
                    char_ratio = len(part) / total_chars
                    duration = (line_end - line_begin) * char_ratio
                    words.append({
                        'text': part,
                        'begin': int(current_begin),
                        'end': int(current_begin + duration)
                    })
                    current_begin += duration
                    
            raw_text = ''.join(p.itertext()).strip()
            if raw_text:
                parsed_lines.append({
                    'begin': line_begin,
                    'end': line_end if line_end > line_begin else line_begin + 4000,
                    'words': words,
                    'rawText': raw_text
                })
                
        return parsed_lines
    except Exception as e:
        print("[TTML Parse Error]:", e)
        return []

def parse_lrc(lrc_string):
    if not lrc_string:
        return []
    lines = lrc_string.split('\n')
    parsed_lines = []
    time_regex = re.compile(r'\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\]')
    
    for line in lines:
        match = time_regex.search(line)
        if match:
            minutes = int(match.group(1))
            seconds = float(match.group(2))
            begin_ms = int((minutes * 60 + seconds) * 1000)
            text = time_regex.sub('', line).strip()
            if text:
                parsed_lines.append({
                    'begin': begin_ms,
                    'end': 0,
                    'words': [],
                    'rawText': text
                })
                
    if not parsed_lines:
        return []
        
    for i in range(len(parsed_lines)):
        current_line = parsed_lines[i]
        end_ms = current_line['begin'] + 5000
        if i < len(parsed_lines) - 1:
            end_ms = parsed_lines[i+1]['begin']
        current_line['end'] = end_ms
        
        parts = [p for p in current_line['rawText'].split(' ') if p]
        if not parts:
            current_line['words'] = [{'text': '', 'begin': current_line['begin'], 'end': current_line['end']}]
        else:
            time_per_word = int((current_line['end'] - current_line['begin']) / len(parts))
            current_word_begin = current_line['begin']
            for p in parts:
                current_line['words'].append({
                    'text': p,
                    'begin': current_word_begin,
                    'end': current_word_begin + time_per_word
                })
                current_word_begin += time_per_word
                
    return parsed_lines

def parse_plain_lyrics(plain_text, duration_seconds=0):
    lines = [l.strip() for l in plain_text.split('\n') if l.strip()]
    if not lines:
        return []
    parsed_lines = []
    line_count = len(lines)
    dur_ms = (duration_seconds * 1000) if duration_seconds > 0 else (line_count * 4000)
    per_line = dur_ms // line_count if line_count > 0 else 4000

    for i, line in enumerate(lines):
        b = i * per_line
        e = b + per_line
        parts = [p for p in line.split(' ') if p]
        words = []
        if parts:
            wp = per_line // len(parts)
            cur = b
            for p in parts:
                words.append({'text': p, 'begin': cur, 'end': cur + wp})
                cur += wp
        else:
            words.append({'text': line, 'begin': b, 'end': e})

        parsed_lines.append({
            'begin': b,
            'end': e,
            'words': words,
            'rawText': line
        })
    return parsed_lines

def parse_any_lyrics(lyrics_content, duration=0):
    if not lyrics_content or not isinstance(lyrics_content, str):
        return []
    trimmed = lyrics_content.strip()
    if trimmed.startswith('<') and ('<tt' in trimmed.lower() or 'xmlns' in trimmed.lower() or '<body>' in trimmed.lower()):
        res = parse_ttml(trimmed)
        if res: return res
    if '[' in trimmed and re.search(r'\[\d{2}:\d{2}', trimmed):
        res = parse_lrc(trimmed)
        if res: return res
    return parse_plain_lyrics(trimmed, duration)


# ==============================================================================
# 11 LYRICS PROVIDERS IMPLEMENTATION
# ==============================================================================

# 1. LrcLib
def fetch_lrclib(title, artist, duration=0):
    headers = DEFAULT_HEADERS.copy()
    try:
        # Direct GET
        q_title = urllib.parse.quote(title.strip())
        q_artist = urllib.parse.quote(artist.strip())
        url = f"https://lrclib.net/api/get?track_name={q_title}&artist_name={q_artist}"
        if duration:
            url += f"&duration={duration}"
        r = requests.get(url, headers=headers, timeout=8)
        if r.ok:
            data = r.json()
            if data.get('syncedLyrics'):
                return data['syncedLyrics'], True
            if data.get('plainLyrics'):
                return data['plainLyrics'], False
    except Exception as e:
        pass

    try:
        # Search query
        q = f"{title} {artist}".strip()
        url = f"https://lrclib.net/api/search?q={urllib.parse.quote(q)}"
        r = requests.get(url, headers=headers, timeout=8)
        if r.ok:
            items = r.json()
            if isinstance(items, list):
                for item in items:
                    if item.get('syncedLyrics'):
                        return item['syncedLyrics'], True
                for item in items:
                    if item.get('plainLyrics'):
                        return item['plainLyrics'], False
    except Exception as e:
        pass
    return None, False

# 2. KuGou
def fetch_kugou(title, artist, duration=0):
    headers = DEFAULT_HEADERS.copy()
    try:
        url = f"https://lyrics-api.boidu.dev/kugou/getLyrics?s={urllib.parse.quote(title)}&a={urllib.parse.quote(artist)}"
        if duration:
            url += f"&d={duration}"
        r = requests.get(url, headers=headers, timeout=8)
        if r.ok:
            data = r.json()
            ttml = data.get('ttml') or (r.text if r.text.startswith('<') else None)
            if ttml:
                return ttml, True
    except Exception as e:
        pass
    return None, False

# 3. SimpMusic
def fetch_simpmusic(video_id, duration=0):
    if not video_id or video_id.startswith('JS:'):
        return None, False
    headers = {
        'User-Agent': 'AirBeats/1.0',
        'Accept': 'application/json'
    }
    try:
        url = f"https://api-lyrics.simpmusic.org/v1/{video_id}"
        r = requests.get(url, headers=headers, timeout=8)
        if r.ok:
            data = r.json()
            if data.get('success'):
                arr = data.get('data') or []
                best_synced = None
                best_plain = None
                min_diff = 999999
                for item in arr:
                    synced = item.get('syncedLyrics', '').strip()
                    plain = item.get('plainLyrics', '').strip()
                    item_dur = int(item.get('duration', 0) or 0)
                    if synced:
                        if duration and item_dur:
                            diff = abs(item_dur - duration)
                            if diff < min_diff:
                                min_diff = diff
                                best_synced = synced
                        elif not best_synced:
                            best_synced = synced
                    if plain and not best_plain:
                        best_plain = plain
                if best_synced:
                    return best_synced, True
                if best_plain:
                    return best_plain, False
    except Exception as e:
        pass
    return None, False

# 4. YouTube Subtitles
def fetch_youtube_subtitles(video_id):
    if not video_id or video_id.startswith('JS:'):
        return None, False
    headers = DEFAULT_HEADERS.copy()
    # Try youtube timedtext or paxsenix youtube/lyrics
    try:
        url = f"https://lyrics.paxsenix.org/youtube/lyrics?id={video_id}"
        r = requests.get(url, headers=headers, timeout=8)
        if r.ok and r.text.strip():
            txt = r.text.strip()
            if txt.startswith('{'):
                j = r.json()
                for k in ['lyrics', 'lrc', 'syncedLyrics', 'text']:
                    if j.get(k): return j[k], True
            elif '[' in txt:
                return txt, True
    except Exception as e:
        pass

    try:
        # YouTube timedtext
        for lang in ['en', 'hi', 'auto']:
            url = f"https://www.youtube.com/api/timedtext?v={video_id}&lang={lang}&fmt=srv3"
            r = requests.get(url, headers=headers, timeout=6)
            if r.ok and '<p t="' in r.text:
                root = ET.fromstring(r.text)
                lrc_lines = []
                for p in root.iter('p'):
                    t_ms = int(p.get('t', 0))
                    m = (t_ms // 1000) // 60
                    s = (t_ms // 1000) % 60
                    ms = (t_ms % 1000) // 10
                    txt = ''.join(p.itertext()).strip()
                    if txt:
                        lrc_lines.append(f"[{m:02d}:{s:02d}.{ms:02d}] {txt}")
                if lrc_lines:
                    return "\n".join(lrc_lines), True
    except Exception as e:
        pass
    return None, False

# 5. Paxsenix (Multi-Source)
def fetch_paxsenix(video_id, title, artist):
    headers = DEFAULT_HEADERS.copy()
    clean_id = (video_id or '').strip()
    if clean_id and not clean_id.startswith('JS:'):
        try:
            r = requests.get(f"https://lyrics.paxsenix.org/youtube/lyrics?id={clean_id}", headers=headers, timeout=6)
            if r.ok and r.text.strip():
                txt = r.text.strip()
                if txt.startswith('{'):
                    j = r.json()
                    for k in ['lyrics', 'lrc', 'syncedLyrics', 'plainLyrics', 'text']:
                        if j.get(k): return j[k], ('[' in j[k])
                elif len(txt) > 20:
                    return txt, ('[' in txt)
        except Exception:
            pass

    clean_title = urllib.parse.quote(title.strip())
    clean_artist = urllib.parse.quote(artist.strip())
    endpoints = [
        f"spotify/lyrics?title={clean_title}&artist={clean_artist}",
        f"musixmatch/lyrics?title={clean_title}&artist={clean_artist}",
        f"apple-music/lyrics?title={clean_title}&artist={clean_artist}",
        f"netease/lyrics?title={clean_title}&artist={clean_artist}"
    ]
    for path in endpoints:
        try:
            r = requests.get(f"https://lyrics.paxsenix.org/{path}", headers=headers, timeout=6)
            if r.ok and r.text.strip():
                txt = r.text.strip()
                if txt.startswith('{'):
                    j = r.json()
                    for k in ['lyrics', 'lrc', 'syncedLyrics', 'plainLyrics', 'text']:
                        if j.get(k): return j[k], ('[' in j[k])
                elif len(txt) > 20:
                    return txt, ('[' in txt)
        except Exception:
            continue
    return None, False

# 6. Unison
def fetch_unison(video_id, title, artist, duration=0):
    headers = DEFAULT_HEADERS.copy()
    base = "https://unison.boidu.dev/"
    q = urllib.parse.quote(f"{title} {artist}".strip())
    try:
        url = f"{base}search?q={q}"
        if duration: url += f"&d={duration}"
        r = requests.get(url, headers=headers, timeout=8)
        if r.ok:
            j = r.json()
            if j.get('success'):
                arr = j.get('data') or []
                for item in arr:
                    lrc = item.get('lyrics', '').strip()
                    if lrc: return lrc, ('[' in lrc)
    except Exception:
        pass

    clean_id = (video_id or '').strip()
    if clean_id and not clean_id.startswith('JS:'):
        try:
            r = requests.get(f"{base}lyrics?v={clean_id}", headers=headers, timeout=8)
            if r.ok:
                j = r.json()
                if j.get('success'):
                    data = j.get('data') or {}
                    lrc = data.get('lyrics', '').strip()
                    if lrc: return lrc, ('[' in lrc)
        except Exception:
            pass
    return None, False

# 7. BetterLyrics
def fetch_betterlyrics(title, artist, duration=0, album=""):
    headers = DEFAULT_HEADERS.copy()
    clean_t = urllib.parse.quote(title.strip())
    clean_a = urllib.parse.quote(artist.strip())
    endpoints = [
        f"https://lyrics-api.boidu.dev/getLyrics?s={clean_t}&a={clean_a}",
        f"https://lyrics-api.boidu.dev/kugou/getLyrics?s={clean_t}&a={clean_a}"
    ]
    for url in endpoints:
        if album: url += f"&al={urllib.parse.quote(album)}"
        if duration: url += f"&d={duration}"
        try:
            r = requests.get(url, headers=headers, timeout=8)
            if r.ok:
                txt = r.text.strip()
                if txt.startswith('<'):
                    return txt, True
                j = r.json()
                ttml = j.get('ttml')
                if ttml: return ttml, True
        except Exception:
            continue
    return None, False

# 8. Portato
def fetch_portato(title, artist):
    headers = DEFAULT_HEADERS.copy()
    clean_t = urllib.parse.quote(title.strip())
    clean_a = urllib.parse.quote(artist.strip())
    url = f"https://lyrics.portato.app/api/v1/lyrics?title={clean_t}&artist={clean_a}"
    try:
        r = requests.get(url, headers=headers, verify=False, timeout=8)
        if r.ok:
            j = r.json()
            lrc = j.get('lyrics') or j.get('lrc')
            if lrc and lrc.strip():
                return lrc.strip(), ('[' in lrc)
    except Exception:
        pass
    return None, False

# 9. YouLyPlus
def fetch_youly(title, artist, duration=0):
    headers = DEFAULT_HEADERS.copy()
    clean_t = urllib.parse.quote(title.strip())
    clean_a = urllib.parse.quote(artist.strip())
    base_urls = [
        "https://lyricsplus.binimum.org/",
        "https://lyricsplus.prjktla.my.id/",
        "https://lyricsplus.atomix.one/",
        "https://lyricsplus-seven.vercel.app/"
    ]
    for b in base_urls:
        # 1. TTML
        try:
            url = f"{b}v1/ttml/get?title={clean_t}&artist={clean_a}"
            if duration: url += f"&duration={duration}"
            r = requests.get(url, headers=headers, timeout=6)
            if r.ok:
                j = r.json()
                ttml = j.get('ttml', '').strip()
                if ttml: return ttml, True
        except Exception:
            pass

        # 2. LRC
        try:
            url = f"{b}v2/lyrics/get?title={clean_t}&artist={clean_a}"
            if duration: url += f"&duration={duration}"
            r = requests.get(url, headers=headers, timeout=6)
            if r.ok:
                j = r.json()
                lrc = j.get('lyrics', '').strip()
                if lrc: return lrc, True
        except Exception:
            pass
    return None, False

# 10. Megalobiz
def fetch_megalobiz(title, artist):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    }
    q = urllib.parse.quote(f"{artist} {title}".strip())
    try:
        search_url = f"https://www.megalobiz.com/searchall?qry={q}"
        r = requests.get(search_url, headers=headers, timeout=8)
        if r.ok:
            m = re.search(r'href=["\'](/lrc/maker/download/[^"\']+)["\']', r.text)
            if m:
                download_url = "https://www.megalobiz.com" + m.group(1)
                r_detail = requests.get(download_url, headers=headers, timeout=8)
                if r_detail.ok:
                    span_m = re.search(r'id=["\']lrc_[^"\']*_details["\'][^>]*>(.*?)</span>', r_detail.text, re.DOTALL)
                    raw_lrc = span_m.group(1) if span_m else r_detail.text
                    clean = (raw_lrc
                             .replace('&lt;', '<')
                             .replace('&gt;', '>')
                             .replace('&amp;', '&')
                             .replace('<br>', '\n')
                             .replace('<br/>', '\n')
                             .replace('<br />', '\n'))
                    clean = re.sub(r'<[^>]+>', '', clean).strip()
                    if '[' in clean:
                        return clean, True
    except Exception:
        pass
    return None, False

# 11. YouTube Music
def fetch_youtube_music(video_id, title, artist, ytmusic_instance=None):
    if ytmusic_instance and video_id and not video_id.startswith('JS:'):
        try:
            watch = ytmusic_instance.get_watch_playlist(videoId=video_id)
            browse_id = watch.get('lyrics')
            if browse_id:
                lyrics_obj = ytmusic_instance.get_lyrics(browse_id)
                lyrics_str = lyrics_obj.get('lyrics', '')
                if lyrics_str and lyrics_str.strip():
                    return lyrics_str.strip(), False
        except Exception:
            pass
    return None, False


# ==============================================================================
# UNIFIED FETCH & SEARCH DISPATCHER
# ==============================================================================

def fetch_from_provider(provider_key, title, artist, duration=0, video_id=None, album=None, ytmusic_instance=None):
    provider_key = (provider_key or '').lower()
    if provider_key == 'lrclib':
        return fetch_lrclib(title, artist, duration)
    elif provider_key == 'simpmusic':
        return fetch_simpmusic(video_id, duration)
    elif provider_key == 'youtube_subtitles':
        return fetch_youtube_subtitles(video_id)
    elif provider_key == 'kugou':
        return fetch_kugou(title, artist, duration)
    elif provider_key == 'paxsenix':
        return fetch_paxsenix(video_id, title, artist)
    elif provider_key == 'unison':
        return fetch_unison(video_id, title, artist, duration)
    elif provider_key == 'betterlyrics':
        return fetch_betterlyrics(title, artist, duration, album or "")
    elif provider_key == 'portato':
        return fetch_portato(title, artist)
    elif provider_key == 'youly':
        return fetch_youly(title, artist, duration)
    elif provider_key == 'megalobiz':
        return fetch_megalobiz(title, artist)
    elif provider_key == 'youtube_music':
        return fetch_youtube_music(video_id, title, artist, ytmusic_instance)
    return None, False

def get_lyrics_unified(title, artist, duration=0, video_id=None, album=None, preferred_provider=None, ytmusic_instance=None, disabled=None):
    """
    Tries providers starting with preferred_provider, followed by the remaining providers in recommended priority order.
    Providers listed in the disabled list are skipped entirely.
    """
    default_order = [
        "lrclib",
        "betterlyrics",
        "youly",
        "kugou",
        "simpmusic",
        "paxsenix",
        "unison",
        "portato",
        "megalobiz",
        "youtube_subtitles",
        "youtube_music"
    ]

    blocked = {str(k).lower() for k in (disabled or []) if k}

    order = [k for k in default_order if k not in blocked]
    if preferred_provider and preferred_provider.lower() in order:
        order.remove(preferred_provider.lower())
        order.insert(0, preferred_provider.lower())

    # Try variants of artist name (e.g. split commas)
    artist_variants = [artist]
    if ',' in artist:
        parts = [a.strip() for a in artist.split(',') if a.strip()]
        for p in parts:
            if p not in artist_variants:
                artist_variants.append(p)

    for prov_key in order:
        for art in artist_variants:
            raw_lyrics, is_synced = fetch_from_provider(
                prov_key, title, art, duration, video_id, album, ytmusic_instance
            )
            if raw_lyrics:
                parsed = parse_any_lyrics(raw_lyrics, duration)
                if parsed:
                    return {
                        "success": True,
                        "provider": PROVIDER_NAMES.get(prov_key, prov_key),
                        "provider_key": prov_key,
                        "is_synced": is_synced,
                        "raw": raw_lyrics,
                        "parsed": parsed
                    }

    # Final fallback: search LrcLib with title only
    if "lrclib" not in blocked:
        raw_lyrics, is_synced = fetch_lrclib(title, "", duration)
        if raw_lyrics:
            parsed = parse_any_lyrics(raw_lyrics, duration)
            if parsed:
                return {
                    "success": True,
                    "provider": "LRC Lib",
                    "provider_key": "lrclib",
                    "is_synced": is_synced,
                    "raw": raw_lyrics,
                    "parsed": parsed
                }

    return {"success": False, "error": "No synchronized lyrics found."}

def search_lyrics_all_providers(title, artist, duration=0, video_id=None, album=None, ytmusic_instance=None, disabled=None):
    """
    Searches across all 11 providers and returns all found results for manual preview and selection.
    """
    results = []
    seen_texts = set()
    blocked = {str(k).lower() for k in (disabled or []) if k}

    for prov_key in PROVIDER_KEYS:
        if prov_key in blocked:
            continue
        try:
            raw_lyrics, is_synced = fetch_from_provider(
                prov_key, title, artist, duration, video_id, album, ytmusic_instance
            )
            if raw_lyrics and len(raw_lyrics.strip()) > 10:
                clean_sample = raw_lyrics[:80].strip()
                if clean_sample not in seen_texts:
                    seen_texts.add(clean_sample)
                    parsed = parse_any_lyrics(raw_lyrics, duration)
                    preview = "\n".join([p['rawText'] for p in parsed[:4]]) if parsed else raw_lyrics[:150]
                    results.append({
                        "provider": PROVIDER_NAMES.get(prov_key, prov_key),
                        "provider_key": prov_key,
                        "is_synced": is_synced,
                        "raw": raw_lyrics,
                        "preview": preview,
                        "parsed": parsed
                    })
        except Exception:
            continue

    return results


# ==============================================================================
# AI TRANSLATION SERVICE (OpenRouter, Gemini, OpenAI, DeepL, Claude, Groq, etc.)
# ==============================================================================

AI_PROVIDER_ENDPOINTS = {
    "OpenRouter": "https://openrouter.ai/api/v1/chat/completions",
    "OpenAI": "https://api.openai.com/v1/chat/completions",
    "Perplexity": "https://api.perplexity.ai/chat/completions",
    "Claude": "https://api.anthropic.com/v1/messages",
    "Gemini": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    "XAi": "https://api.x.ai/v1/chat/completions",
    "Mistral": "https://api.mistral.ai/v1/chat/completions",
    "Nvidia": "https://integrate.api.nvidia.com/v1/chat/completions",
    "OrcaRouter": "https://api.orcarouter.com/v1/chat/completions",
    "Groq": "https://api.groq.com/openai/v1/chat/completions",
    "Puter": "https://api.puter.com/v1/chat/completions",
    "DeepL": "https://api.deepl.com/v2/translate"
}

def translate_lyrics_ai(lines, target_language_code="hi-Latn", target_language_name=None,
                        api_key="", base_url="", model="", mode="Literal",
                        custom_prompt=None, provider="OpenRouter"):
    """
    Line-by-line AI lyrics translation faithful to AiTranslationService.kt
    Preserves rhythm, emotion, and line-by-line array structure.
    """
    if not lines or not isinstance(lines, list):
        return {"success": False, "error": "No lines provided for translation."}

    line_count = len(lines)
    target_name = target_language_name or AI_LANGUAGES.get(target_language_code, target_language_code)
    is_hinglish = (target_language_code == "hi-Latn" or "hinglish" in target_name.lower())

    # DeepL Provider branch
    if provider and provider.lower() == "deepl":
        if not api_key:
            return {"success": False, "error": "DeepL API Key is required."}
        try:
            is_free = api_key.endswith(":fx")
            endpoint = "https://api-free.deepl.com/v2/translate" if is_free else "https://api.deepl.com/v2/translate"
            lang = target_language_code.split('-')[0].upper()
            payload = {
                "text": lines,
                "target_lang": lang
            }
            resp = requests.post(
                endpoint,
                headers={"Authorization": f"DeepL-Auth-Key {api_key.strip()}", "Content-Type": "application/json"},
                json=payload,
                timeout=45
            )
            if not resp.ok:
                return {"success": False, "error": f"DeepL error {resp.status_code}: {resp.text}"}
            j = resp.json()
            translations = [t["text"] for t in j.get("translations", [])]
            return {"success": True, "translations": translations}
        except Exception as e:
            return {"success": False, "error": f"DeepL Exception: {str(e)}"}

    # Standard OpenAI-Compatible Prompting
    system_prompt = (
        "You are an expert, award-winning music lyrics translator. Your task is to translate song lyrics line-by-line.\n"
        "CRITICAL OUTPUT RULES:\n"
        f"1. Output MUST be ONLY a valid JSON array of strings: [\"line 1\", \"line 2\", ...]\n"
        f"2. Output EXACTLY {line_count} items in the array (one output line per input line).\n"
        "3. If an input line is empty or purely whitespace, the output array item MUST be empty string \"\".\n"
        "4. Maintain the rhythm, poetic flow, and emotional feeling of the song lyrics.\n"
        "5. DO NOT wrap with markdown, DO NOT write any explanations, intro or outro text.\n"
    )
    if is_hinglish:
        system_prompt += (
            "6. For HINGLISH: You MUST translate into natural, conversational Hindi using ONLY English/Latin alphabet letters "
            "(e.g., 'Tum mere paas ho', 'Dil ki dhadkan', 'Zindagi ek safar hai'). NEVER use Devanagari script for Hinglish.\n"
        )

    user_prompt = ""
    if is_hinglish:
        user_prompt += (
            f"Translate the following {line_count} song lyrics lines into conversational HINGLISH "
            "(Hindi written with standard English/Latin alphabet letters).\n"
            "Make it poetic, singable, and easy to read phonetically. Do not use Devanagari script.\n"
        )
    elif mode == "Poetic":
        user_prompt += (
            f"Translate the following {line_count} song lyrics lines into {target_name} with rhyming lyrics, "
            "preserving musical meter, rhythm, and lyrical poetry suitable for singing along.\n"
        )
    elif mode == "Romanized":
        user_prompt += (
            f"Romanize/transliterate the following {line_count} lines into basic Latin alphabet characters (a-z, A-Z) "
            "without special diacritics.\n"
        )
    elif mode == "Transcribed":
        user_prompt += (
            f"Transcribe the phonetic sound of the following {line_count} lines into {target_name} script.\n"
        )
    else:
        user_prompt += (
            f"Translate the following {line_count} song lyrics lines into {target_name}.\n"
            "Preserve the rhyme, rhythm, and artistic meaning suitable for singing.\n"
        )

    if custom_prompt and custom_prompt.strip():
        user_prompt += f"\nUser Custom Instructions:\n{custom_prompt.strip()}\n"

    user_prompt += f"\nOriginal Lyrics ({line_count} lines):\n" + "\n".join(lines)
    user_prompt += f"\n\nReturn EXACTLY a JSON array of {line_count} strings."

    endpoint = base_url.strip() if (base_url and base_url.strip()) else AI_PROVIDER_ENDPOINTS.get(provider, "https://openrouter.ai/api/v1/chat/completions")
    req_model = model.strip() if (model and model.strip()) else "google/gemini-2.5-flash-lite"

    headers = {
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/d0x-dev/AirBeats",
        "X-Title": "AirBeats"
    }
    if api_key and api_key.strip():
        headers["Authorization"] = f"Bearer {api_key.strip()}"

    payload = {
        "model": req_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3,
        "max_tokens": max(1024, line_count * 80)
    }

    try:
        resp = requests.post(endpoint, headers=headers, json=payload, timeout=60)
        if not resp.ok:
            err_msg = ""
            try:
                err_msg = resp.json().get('error', {}).get('message', '')
            except:
                err_msg = resp.text[:200]
            return {"success": False, "error": f"AI API Error ({resp.status_code}): {err_msg or resp.reason}"}

        body = resp.json()
        choices = body.get('choices') or []
        if not choices:
            return {"success": False, "error": "Empty choices array in AI response."}

        content = choices[0].get('message', {}).get('content', '').strip()
        # Clean markdown code blocks if wrapped
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        parsed_arr = None
        try:
            parsed_arr = json.loads(content)
        except:
            start = content.find('[')
            end = content.rfind(']')
            if start != -1 and end != -1 and end > start:
                try:
                    parsed_arr = json.loads(content[start:end+1])
                except:
                    pass

        if not parsed_arr or not isinstance(parsed_arr, list):
            # Fallback line-by-line
            parsed_arr = [line.strip().strip('"\'') for line in content.split('\n') if line.strip()]

        # Pad or trim to match exact line_count
        while len(parsed_arr) < line_count:
            parsed_arr.append("")
        final_lines = parsed_arr[:line_count]

        return {
            "success": True,
            "target_language_code": target_language_code,
            "target_language_name": target_name,
            "translations": final_lines
        }

    except requests.exceptions.Timeout:
        return {"success": False, "error": "AI request timed out. Please try again."}
    except Exception as e:
        return {"success": False, "error": f"AI translation error: {str(e)}"}
