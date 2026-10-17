from ytmusicapi import YTMusic
from ytmusicapi.helpers import get_authorization, initialize_headers
from yt_dlp import YoutubeDL
import requests
import os
import re
import io
import sys
import json
import zipfile
import logging
import logging.handlers
import threading
import time
import random
import traceback
import socket
import shutil
import glob
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
from flask import request, jsonify, redirect, send_file, Response, stream_with_context

# Some networks advertise an IPv6 default route while the upstream is a black
# hole. DNS returns AAAA records first, so connects hang and yt-dlp/requests
# stall for minutes. Prefer IPv4 results first so connects succeed instantly.
try:
    _orig_getaddrinfo = socket.getaddrinfo

    def _ipv4_first_getaddrinfo(*args, **kwargs):
        results = _orig_getaddrinfo(*args, **kwargs)
        try:
            ipv4 = [r for r in results if r[0] == socket.AF_INET]
            if ipv4:
                return ipv4 + [r for r in results if r[0] != socket.AF_INET]
        except Exception:
            pass
        return results

    socket.getaddrinfo = _ipv4_first_getaddrinfo
except Exception:
    pass

AIRBEATS_CONFIG_DIR = os.path.join(os.path.expanduser('~'), '.config', 'airbeats')
YT_AUTH_FILE = os.path.join(AIRBEATS_CONFIG_DIR, 'yt_auth.json')
LOG_DIR = os.path.join(AIRBEATS_CONFIG_DIR, 'logs')
DESKTOP_SETTINGS_FILE = os.path.join(AIRBEATS_CONFIG_DIR, 'desktop_settings.json')
_yt_account_cache = None

DEFAULT_SETTINGS = {
    'saavn_enabled': True,
    'content_language': '',
    'content_country': '',
    'hide_explicit': False,
    'proxy_enabled': False,
    'proxy_type': 'HTTP',
    'proxy_url': '',
    'use_login_for_browse': True,
    'lyrics_preferred': '',
    'lyrics_disabled': [],
}

LYRICS_PROVIDER_KEYS = [
    'lrclib', 'kugou', 'simpmusic', 'unison', 'youly', 'megalobiz',
    'paxsenix', 'portato', 'betterlyrics', 'youtube_subtitles', 'youtube_music',
]

_desktop_settings = dict(DEFAULT_SETTINGS)

_logger = logging.getLogger('airbeats')


def _log_setup():
    if _logger.handlers:
        return
    _logger.setLevel(logging.INFO)
    _logger.propagate = False
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        handler = logging.handlers.RotatingFileHandler(
            os.path.join(LOG_DIR, 'server.log'),
            maxBytes=2 * 1024 * 1024, backupCount=3, encoding='utf-8')
        handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s', '%Y-%m-%dT%H:%M:%S'))
        _logger.addHandler(handler)
    except OSError:
        pass
    stream = logging.StreamHandler(sys.stderr)
    stream.setFormatter(logging.Formatter('[airbeats] %(levelname)s %(message)s'))
    _logger.addHandler(stream)


def log_event(level, message):
    try:
        _log_setup()
        _logger.log(getattr(logging, str(level).upper(), logging.INFO), str(message))
    except Exception:
        pass


def log_crash(kind, exc):
    try:
        tb = ''.join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    except Exception:
        tb = str(exc)
    log_event('critical', str(kind) + ': ' + tb.strip())


def settings_load():
    global _desktop_settings
    try:
        with open(DESKTOP_SETTINGS_FILE, encoding='utf-8') as fh:
            data = json.load(fh)
        if isinstance(data, dict):
            merged = dict(DEFAULT_SETTINGS)
            merged.update({k: v for k, v in data.items() if k in DEFAULT_SETTINGS})
            _desktop_settings = merged
    except (OSError, ValueError):
        pass
    return _desktop_settings


def settings_save(update):
    global _desktop_settings
    merged = dict(_desktop_settings)
    merged.update({k: v for k, v in (update or {}).items() if k in DEFAULT_SETTINGS})
    _desktop_settings = merged
    try:
        os.makedirs(AIRBEATS_CONFIG_DIR, exist_ok=True)
        with open(DESKTOP_SETTINGS_FILE, 'w', encoding='utf-8') as fh:
            json.dump(merged, fh, indent=2)
    except OSError:
        pass
    return merged


def setting(key):
    return _desktop_settings.get(key, DEFAULT_SETTINGS.get(key))


def saavn_enabled():
    return bool(setting('saavn_enabled'))


def proxy_url():
    if not setting('proxy_enabled'):
        return ''
    url = str(setting('proxy_url') or '').strip()
    if not url:
        return ''
    if '://' not in url:
        scheme = 'socks5h://' if str(setting('proxy_type') or '').upper() == 'SOCKS' else 'http://'
        url = scheme + url
    return url


def proxy_config():
    url = proxy_url()
    return {'http': url, 'https': url} if url else None


def charts_country():
    return str(setting('content_country') or 'US') or 'US'


def apply_settings_runtime():
    # Saavn session uses the proxy directly.
    try:
        _saavn_session.proxies = proxy_config() or {}
    except Exception:
        pass
    # Lyrics providers, ytmusicapi and every other outbound request honor the
    # standard proxy environment variables, so one switch covers them all.
    url = proxy_url()
    for key in ('HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy'):
        if url:
            os.environ[key] = url
        else:
            os.environ.pop(key, None)


def rebuild_yt_instances():
    global yt, _yt_live, _yt_public, _yt_nolang
    with _yt_lock:
        _yt_live = None
        _yt_public = None
        _yt_nolang = None
        try:
            yt = yt_make(_yt_auth) if _yt_auth else yt_make()
        except Exception as e:
            log_event('error', 'rebuild yt failed: ' + str(e))


def client_log_path():
    return os.path.join(LOG_DIR, 'client-' + datetime.now().strftime('%Y-%m-%d') + '.jsonl')


def log_client_event(level, message, stack='', context=''):
    ts = datetime.now(timezone.utc).isoformat()
    entry = {
        'ts': ts,
        'level': str(level or 'error').lower()[:12],
        'source': 'client',
        'message': str(message or '')[:2000],
        'stack': str(stack or '')[:4000],
        'context': str(context or '')[:500],
    }
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        with open(client_log_path(), 'a', encoding='utf-8') as fh:
            fh.write(json.dumps(entry, ensure_ascii=False) + '\n')
    except OSError:
        pass
    verbose = 'client: ' + entry['message']
    if entry['stack']:
        verbose += ' | ' + entry['stack'].splitlines()[0][:300]
    log_event(entry['level'] if entry['level'] in ('error', 'critical') else 'warning', verbose)
    return entry


def yt_cookie_map(cookie):
    parts = {}
    for chunk in (cookie or '').split(';'):
        if '=' not in chunk:
            continue
        key, value = chunk.split('=', 1)
        key = key.strip()
        value = value.strip().strip('"')
        if key and value and key not in parts:
            parts[key] = value
    return parts


def yt_build_headers(cookie, authuser='0', visitor_data=''):
    cookie = ' '.join((cookie or '').replace('\r', ' ').replace('\n', ' ').split())
    parts = yt_cookie_map(cookie)
    sapisid = parts.get('__Secure-3PAPISID') or parts.get('SAPISID')
    if not sapisid:
        raise ValueError('cookie is missing SAPISID')
    headers = dict(initialize_headers())
    headers.update({
        'cookie': cookie,
        'authorization': get_authorization(sapisid + ' https://music.youtube.com'),
        'x-goog-authuser': str(authuser or '0'),
        'origin': 'https://music.youtube.com',
    })
    visitor_data = str(visitor_data or '').strip()
    if visitor_data:
        headers['x-goog-visitor-id'] = visitor_data
    return headers


def yt_parse_auth_input(raw):
    text = (raw or '').strip()
    if not text:
        raise ValueError('empty login input')
    cookie = text
    authuser = '0'
    if '\n' in text or text[:7].lower() == 'cookie:':
        for line in text.splitlines():
            if ':' not in line:
                continue
            name, value = line.split(':', 1)
            key = name.strip().lower()
            value = value.strip()
            if key == 'cookie' and value:
                cookie = value
            elif key == 'x-goog-authuser' and value:
                authuser = value
    return cookie, authuser


try:
    from ytmusicapi.constants import SUPPORTED_LANGUAGES as _YT_SUPPORTED_LANGS
except Exception:
    _YT_SUPPORTED_LANGS = None


def _safe_language(code):
    code = str(code or 'en').strip().lower()
    if _YT_SUPPORTED_LANGS and code not in _YT_SUPPORTED_LANGS:
        return 'en'
    return code


def yt_make(auth_headers=None):
    kwargs = {
        'language': _safe_language(setting('content_language') or 'en'),
        'location': str(setting('content_country') or ''),
    }
    proxies = proxy_config()
    if proxies:
        kwargs['proxies'] = proxies
    if not auth_headers:
        return YTMusic(**kwargs)
    clean = {k: v for k, v in auth_headers.items() if k != 'account' and isinstance(v, str)}
    return YTMusic(clean, **kwargs)


def yt_load_auth():
    try:
        with open(YT_AUTH_FILE, encoding='utf-8') as fh:
            data = json.load(fh)
        if isinstance(data, dict) and data.get('cookie'):
            return data
    except (OSError, ValueError):
        pass
    return None


def yt_save_auth(data):
    os.makedirs(AIRBEATS_CONFIG_DIR, exist_ok=True)
    with open(YT_AUTH_FILE, 'w', encoding='utf-8') as fh:
        json.dump(data, fh)
    os.chmod(YT_AUTH_FILE, 0o600)


def yt_apply_auth(auth_headers, instance=None):
    global yt, _yt_auth, _yt_live, _yt_public, _yt_account_cache, _yt_error
    _yt_auth = auth_headers
    _yt_live = instance
    _yt_error = ''
    _yt_account_cache = None
    _yt_public = None
    try:
        with _aux_clients_lock:
            _aux_clients.clear()
    except Exception:
        pass
    if instance is not None:
        yt = instance
    elif not auth_headers:
        yt = yt_make()


def yt_browse():
    """Browse instance: falls back to the public feed when use_login_for_browse is off."""
    global _yt_public
    if _yt_auth and setting('use_login_for_browse'):
        return yt_active()
    if _yt_public is None:
        try:
            _yt_public = yt_make()
        except Exception:
            return yt
    return _yt_public


def yt_active():
    global yt, _yt_live, _yt_error
    if not _yt_auth:
        return yt
    if _yt_live is not None:
        return _yt_live
    with _yt_lock:
        if _yt_live is not None:
            return _yt_live
        try:
            _yt_live = yt_make(_yt_auth)
            _yt_error = ''
        except Exception as e:
            _yt_error = str(e)
            return yt
        yt = _yt_live
    return _yt_live


_aux_clients = {}
_aux_clients_lock = threading.Lock()


def yt_aux(kind):
    """Per-purpose cached YTMusic instance for parallel tasks (same auth and
    settings as yt_browse). Warm connections keep refreshes fast."""
    with _aux_clients_lock:
        stamp = (_yt_auth, setting('use_login_for_browse'))
        entry = _aux_clients.get(kind)
        if entry and entry[0] == stamp:
            return entry[1]
        try:
            if _yt_auth and setting('use_login_for_browse'):
                clean = {k: v for k, v in _yt_auth.items() if k != 'account' and isinstance(v, str)}
                client = yt_make(clean)
            else:
                client = yt_make()
        except Exception:
            client = yt_browse()
        _aux_clients[kind] = (stamp, client)
        return client


_yt_nolang = None
_yt_nolang_lock = threading.Lock()


def yt_no_language():
    """Client without hl/location — search fallback (hl=hi returns 0 results upstream)."""
    global _yt_nolang
    if _yt_nolang is not None:
        return _yt_nolang
    with _yt_nolang_lock:
        if _yt_nolang is None:
            kwargs = {}
            proxies = proxy_config()
            if proxies:
                kwargs['proxies'] = proxies
            client = None
            if _yt_auth:
                try:
                    clean = {k: v for k, v in _yt_auth.items() if k != 'account' and isinstance(v, str)}
                    client = YTMusic(clean, **kwargs)
                except Exception:
                    client = None
            if client is None:
                client = YTMusic(**kwargs) if kwargs else YTMusic()
            _yt_nolang = client
    return _yt_nolang


def yt_search(query, filter_=None, limit=None):
    """Search with a safety net: the content-language client sometimes returns empty results."""
    try:
        res = yt_browse().search(query, filter=filter_, limit=limit) if limit else yt_browse().search(query, filter=filter_)
    except Exception:
        res = []
    if res:
        return res
    try:
        res = yt_no_language().search(query, filter=filter_, limit=limit) if limit else yt_no_language().search(query, filter=filter_)
    except Exception:
        res = res or []
    return res or []


def yt_warmup():
    global _yt_account_cache
    time.sleep(1)
    try:
        client = yt_active()
    except Exception:
        return
    if not _yt_auth:
        return
    try:
        info = client.get_account_info()
    except Exception:
        return
    if _yt_account_cache is not None:
        return
    account = {
        "name": info.get("accountName") or "YouTube Music",
        "handle": info.get("channelHandle") or "",
        "photo": info.get("accountPhotoUrl") or ""
    }
    _yt_account_cache = account
    try:
        saved = dict(_yt_auth)
        saved["account"] = account
        yt_save_auth(saved)
    except OSError:
        pass


_yt_auth = yt_load_auth()
_yt_live = None
_yt_public = None
_yt_error = ''
_yt_lock = threading.Lock()
if _yt_auth and isinstance(_yt_auth.get('account'), dict):
    _yt_account_cache = _yt_auth['account']
settings_load()
yt = yt_make()

STREAM_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
SAAVN_API = 'https://www.jiosaavn.com/api.php'
SAAVN_REFERER = 'https://www.jiosaavn.com/'
_yt_tracking_cache = {}
_yt_tracking_lock = threading.Lock()
_saavn_session = requests.Session()
_saavn_session.headers.update({'user-agent': STREAM_USER_AGENT, 'referer': SAAVN_REFERER})
apply_settings_runtime()
threading.Thread(target=yt_warmup, daemon=True).start()


_STREAM_RANGE_WINDOW = 8 * 1024 * 1024


def _bounded_range(range_header, window=_STREAM_RANGE_WINDOW):
    """Open-ended ranges (`bytes=0-`) are throttled or get 403s from the CDN — bound the window."""
    if not range_header:
        return 'bytes=0-%d' % (window - 1)
    match = re.match(r'^bytes=(\d+)-(\d*)$', range_header.strip())
    if not match:
        return None
    start = int(match.group(1))
    end = match.group(2)
    if end:
        return 'bytes=%d-%s' % (start, end)
    return 'bytes=%d-%d' % (start, start + window - 1)


def stream_proxy(url, referer=None):
    headers = {'user-agent': STREAM_USER_AGENT}
    if referer:
        headers['referer'] = referer
    range_header = request.headers.get('Range')
    bounded = _bounded_range(range_header)
    if bounded:
        headers['Range'] = bounded
    elif range_header:
        headers['Range'] = range_header
    upstream = requests.get(url, headers=headers, stream=True, timeout=30, proxies=proxy_config())
    if upstream.status_code >= 400:
        upstream.close()
        return None
    passthrough = {}
    for header in ('Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges'):
        value = upstream.headers.get(header)
        if value:
            passthrough[header] = value

    def chunks():
        try:
            for chunk in upstream.iter_content(65536):
                if chunk:
                    yield chunk
        finally:
            upstream.close()

    return Response(stream_with_context(chunks()), status=upstream.status_code, headers=passthrough)


def yt_tracking(video_id):
    with _yt_tracking_lock:
        cached = _yt_tracking_cache.get(video_id)
    if cached and time.time() - cached[0] < 10800:
        return cached[1]
    song = yt_active().get_song(video_id)
    tracking = song.get('playbackTracking') or {}
    if tracking:
        with _yt_tracking_lock:
            _yt_tracking_cache[video_id] = (time.time(), tracking)
    return tracking


def yt_with_params(url, **params):
    parsed = urlparse(url)
    query = parse_qs(parsed.query, keep_blank_values=True)
    for key, value in params.items():
        query[key] = [str(value)]
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


def yt_record_play(video_id, played, duration, final):
    if not video_id or not _yt_auth:
        return
    try:
        tracking = yt_tracking(video_id)
    except Exception:
        return
    played = max(0, int(played or 0))
    duration = max(0, int(duration or 0))
    if final:
        base = (tracking.get('videostatsWatchtimeUrl') or {}).get('baseUrl')
        params = {'st': 0, 'et': played, 'cmt': played}
    else:
        base = (tracking.get('videostatsPlaybackUrl') or {}).get('baseUrl')
        params = {'cmt': played}
    if not base:
        return
    if duration:
        params['len'] = duration
    params['ver'] = 2
    params['c'] = 'WEB_REMIX'
    params['cpn'] = ''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_', k=16))
    base = base.replace('https://s.youtube.com', 'https://music.youtube.com')
    headers = {'user-agent': STREAM_USER_AGENT}
    if _yt_auth.get('cookie'):
        headers['cookie'] = _yt_auth['cookie']
    try:
        requests.get(yt_with_params(base, **params), headers=headers, timeout=20, proxies=proxy_config())
    except Exception:
        pass


def saavn_call(**params):
    payload = {'_format': 'json', '_marker': '0', 'api_version': '4', 'ctx': 'web6dot0'}
    payload.update(params)
    response = _saavn_session.get(SAAVN_API, params=payload, timeout=20)
    response.raise_for_status()
    return response.json()


def format_saavn_song(item):
    more = item.get('more_info') or {}
    artists = []
    for artist in (more.get('artistMap') or {}).get('primary_artists') or []:
        name = (artist or {}).get('name') or ''
        if name:
            artists.append({'id': str(artist.get('id') or ''), 'name': name})
    if not artists:
        fallback = (item.get('subtitle') or '').split(' - ')[0].strip()
        artists.append({'id': '', 'name': fallback or 'Unknown Artist'})
    duration = more.get('duration')
    song_id = str(item.get('id') or '')
    image = item.get('image') or ''
    album_id = str(more.get('album_id') or '')
    return {
        'id': song_id,
        'name': item.get('title') or '',
        'type': 'song',
        'source': 'saavn',
        'duration': int(duration) if str(duration).isdigit() else 0,
        'image': [{'quality': '500x500', 'url': image}] if image else [],
        'album': {'id': album_id, 'name': more.get('album') or ''},
        'artists': {'primary': artists},
        'downloadUrl': [
            {'quality': '128kbps', 'url': f'/api/saavn/stream?id={song_id}'},
            {'quality': '320kbps', 'url': f'/api/saavn/stream?id={song_id}'}
        ]
    }


def saavn_media_url(song_id, bitrate='320'):
    details = saavn_call(__call='song.getDetails', pids=song_id)
    songs = details.get('songs') if isinstance(details, dict) else None
    song = songs[0] if songs else {}
    encrypted = (song.get('more_info') or {}).get('encrypted_media_url') or ''
    if not encrypted:
        raise ValueError('song not found')
    token = saavn_call(__call='song.generateAuthToken', url=encrypted, bitrate=bitrate)
    auth_url = token.get('auth_url') if isinstance(token, dict) else ''
    if not auth_url:
        raise ValueError('stream unavailable')
    return auth_url


def song_is_explicit(item):
    if not item or not isinstance(item, dict):
        return False
    sources = [item]
    more = item.get('more_info')
    if isinstance(more, dict):
        sources.append(more)
    for src in sources:
        for key in ('isExplicit', 'is_explicit', 'explicit_content', 'explicit'):
            value = src.get(key)
            if value is True:
                return True
            if isinstance(value, str) and value.strip().lower() in ('1', 'true', 'yes'):
                return True
    return False


def format_songs(items):
    out = []
    hide = bool(setting('hide_explicit'))
    for item in items or []:
        if not item:
            continue
        if hide and song_is_explicit(item):
            continue
        out.append(format_song(item))
    return out


def format_saavn_songs(items):
    out = []
    hide = bool(setting('hide_explicit'))
    for item in items or []:
        if not item:
            continue
        if hide and song_is_explicit(item):
            continue
        out.append(format_saavn_song(item))
    return out


# Matching engine: Python port of the Android AirBeats TrackMatcher.kt
# Decides whether a JioSaavn entry and a YouTube Music entry are the same recording.

_MATCH_NOISE_WORDS = {
    'official', 'video', 'audio', 'lyrics', 'lyric', 'lyrical', 'visualizer',
    'song', 'songs', 'full', 'music', 'the', 'and', 'from', 'feat', 'ft',
    'featuring', 'with', 'new', 'latest', 'free', 'download', 'remaster',
    'remastered', 'explicit', 'clean', 'bonus', 'track', 'deluxe', 'original',
    'album', 'single', 'hd', 'hq', '4k', 'mp3',
}
_MATCH_VERSION_WORDS = {
    'remix', 'remixes', 'rmx', 'refix', 'flip', 'bootleg', 'mashup', 'medley',
    'live', 'concert', 'unplugged', 'acoustic', 'instrumental', 'karaoke',
    'vocals', 'vocal', 'acapella', 'acappella', 'backing', 'stems', 'stem',
    'cover', 'demo', 'reprise', 'remake', 'rework', 'extended', 'edit',
    'version', 'mix', 'dub', 'vip', 'session', 'sessions',
    'sped', 'slowed', 'reverb', 'nightcore', 'lofi', 'orchestral', 'symphonic',
    'part', 'pt', 'chapter',
}
_MATCH_NEUTRAL_SEGMENTS = {
    'albumversion', 'originalversion', 'originalmix', 'singleversion',
    'radioversion', 'radioedit', 'stereoversion', 'monoversion',
    'studioversion', 'fullversion', 'standardversion', 'explicitversion',
    'deluxeversion', 'originaltrack',
}
_MATCH_TRAILING_NOISE = {
    'song', 'songs', 'video', 'audio', 'lyrics', 'lyric', 'lyrical',
    'official', 'full', 'hd', 'hq', '4k', 'mp3', 'ost', 'soundtrack',
}
_MATCH_ARTIST_SEPARATORS = re.compile(r'\s*(?:[,&/;·|]|\band\b|\bx\b|\bvs\.?\b|\bfeat\.?\b|\bft\.?\b|\bfeaturing\b|\bwith\b)\s*')
_MATCH_WORD_SPLIT = re.compile(r'[\s.·]+')
_MATCH_NON_ALNUM = re.compile(r'[^a-z0-9]')


def _match_words(text):
    return [w for w in (_MATCH_NON_ALNUM.sub('', part) for part in _MATCH_WORD_SPLIT.split((text or '').lower())) if w]


def _match_artist_names(raw):
    return [name for name in (part.strip() for part in _MATCH_ARTIST_SEPARATORS.split((raw or '').lower())) if name]


def _match_is_artist_credit(text, artist):
    if not artist:
        return False
    words = _match_words(text)
    if not words:
        return False
    credited = set(_match_words(artist))
    return all(word in credited for word in words)


def _match_parse(title, artist=''):
    text = (title or '').lower().replace('&', ' and ')
    versions, context = set(), set()

    def classify(segment):
        words = _match_words(segment)
        if not words or ''.join(words) in _MATCH_NEUTRAL_SEGMENTS:
            return
        marks = [w for w in words if w in _MATCH_VERSION_WORDS]
        if marks:
            versions.update(marks)
            return
        context.update(w for w in words if len(w) > 2 and w not in _MATCH_NOISE_WORDS)

    for _ in range(3):
        match = re.search(r'[(\[]([^()\[\]]*)[)\]]', text)
        if not match:
            break
        classify(match.group(1))
        text = text[:match.start()] + ' ' + text[match.end():]
    open_match = re.search(r'[(\[]', text)
    if open_match:
        classify(text[open_match.start():])
        text = text[:open_match.start()]
    for _ in range(3):
        dash = re.search(r'\s+[-–—|]+\s+', text)
        if not dash:
            break
        head, tail = text[:dash.start()], text[dash.end():]
        if artist and _match_is_artist_credit(head, artist):
            classify(head)
            text = tail
        else:
            classify(tail)
            text = head
    text = re.sub(r'\b(feat|ft|featuring|with)\b.*', ' ', text)
    words = [w for w in _match_words(text) if w != 'and']
    while len(words) > 1 and words[-1] in _MATCH_TRAILING_NOISE:
        words = words[:-1]
    return {'core': ''.join(words), 'words': words, 'versions': versions, 'context': context}


def _match_artist_score(wanted, got):
    want = _match_artist_names(wanted)
    have = _match_artist_names(got)
    if not want or not have:
        return 0
    if want == have:
        return 25
    for a in want:
        for b in have:
            if a == b or _MATCH_NON_ALNUM.sub('', a) == _MATCH_NON_ALNUM.sub('', b):
                return 10
    return None


def _match_duration_score(wanted, got, allow_drift):
    if not wanted or not got:
        return 0
    diff = abs(int(wanted) - int(got))
    limit = 90 if allow_drift else 30
    if diff > limit:
        return None
    if diff <= 3:
        return 40
    if diff <= 10:
        return 15
    return 0


def score_track_match(name, artist, duration, cand_title, cand_artist, cand_duration):
    """Return an int score when the candidate is the same recording, otherwise None."""
    wanted = _match_parse(name, artist or '')
    got = _match_parse(cand_title, cand_artist or '')
    if not wanted['core'] or not got['core'] or wanted['core'] != got['core']:
        return None
    if wanted['versions'] != got['versions']:
        return None
    duration = int(duration or 0) or None
    cand_duration = int(cand_duration or 0) or None
    credited = _match_artist_score(artist or '', cand_artist or '')
    dur_score = _match_duration_score(duration, cand_duration, credited is not None)
    if dur_score is None:
        return None
    if credited is None:
        if duration and cand_duration and abs(duration - cand_duration) <= 2:
            credited = -30
        else:
            return None
    total = 100 + credited + dur_score
    if wanted['context'] & got['context']:
        total += 20
    return total


def _yt_candidate_duration(candidate):
    duration = candidate.get('duration_seconds')
    if not duration:
        raw = candidate.get('duration')
        if isinstance(raw, str) and ':' in raw:
            parts = [int(p) for p in raw.split(':') if p.isdigit()]
            if len(parts) == 2:
                duration = parts[0] * 60 + parts[1]
            elif len(parts) == 3:
                duration = parts[0] * 3600 + parts[1] * 60 + parts[2]
    return int(duration or 0)


def yt_best_match(candidates, name, artist, duration):
    best, best_score = None, None
    for candidate in candidates or []:
        cand_artist = ', '.join(a.get('name', '') for a in candidate.get('artists') or [])
        score = score_track_match(name, artist, duration, candidate.get('title'), cand_artist, _yt_candidate_duration(candidate))
        if score is None:
            continue
        if best is None or score > best_score:
            best, best_score = candidate, score
    return best


def yt_resolve_song(name, artist='', duration=0):
    """Find the YouTube Music match for a (JioSaavn) track. Cached for 24h."""
    name = (name or '').strip()
    if not name or not _yt_auth:
        return None
    cache_key = 'resolve:%s|%s|%s' % (name.lower(), (artist or '').lower(), int(duration or 0))
    cached = cache_lookup(cache_key, 86400)
    if cached is not None:
        return cached if isinstance(cached, dict) else None
    parsed = _match_parse(name, artist or '')
    clean_title = ' '.join(parsed['words'] + sorted(parsed['versions'])).strip() or name
    primary = _match_artist_names(artist or '')
    queries = []
    if primary:
        queries.append('%s %s' % (clean_title, primary[0]))
    queries.append(clean_title)
    queries.append(('%s %s' % (name, artist or '')).strip())
    result = None
    for query in queries:
        candidates = yt_search(query, 'songs', limit=10)
        match = yt_best_match(candidates or [], name, artist, duration)
        if match:
            result = match
            break
    cache_store(cache_key, result if result else False)
    return result


def saavn_best_match(results, name, artist, duration=0):
    best, best_score = None, None
    for item in results or []:
        more = item.get('more_info') or {}
        cand_artist = ', '.join(
            (a or {}).get('name', '') for a in (more.get('artistMap') or {}).get('primary_artists') or []
        ) or (item.get('subtitle') or '')
        raw_duration = more.get('duration')
        cand_duration = int(raw_duration) if str(raw_duration).isdigit() else 0
        score = score_track_match(name, artist, duration, item.get('title'), cand_artist, cand_duration)
        if score is None:
            continue
        if best is None or score > best_score:
            best, best_score = item, score
    return best

_api_cache = {}
_api_cache_lock = threading.Lock()
_stream_url_cache = {}
_stream_url_lock = threading.Lock()


def cache_lookup(key, ttl):
    with _api_cache_lock:
        entry = _api_cache.get(key)
    if entry and time.time() - entry[0] < ttl:
        return entry[1]
    return None


def cache_store(key, value):
    with _api_cache_lock:
        _api_cache[key] = (time.time(), value)


def cache_clear(prefix=''):
    with _api_cache_lock:
        for key in [k for k in _api_cache if k.startswith(prefix)]:
            _api_cache.pop(key, None)


def _find_js_runtime():
    """Locate a JS runtime (deno/node) for yt-dlp — required to solve YouTube JS
    challenges (nsig). Without one, extraction is deprecated and streams may be
    throttled or formats missing. Also checks nvm/local installs."""
    found = {}
    home = os.path.expanduser('~')
    priority = ['deno', 'node', 'quickjs', 'bun']
    candidates = []
    for name in priority:
        try:
            w = shutil.which(name)
        except Exception:
            w = None
        if w:
            candidates.append((name, w))
    for pattern, name in (
        (os.path.join(home, '.nvm', 'versions', 'node', '*', 'bin', 'node'), 'node'),
        (os.path.join(home, '.deno', 'bin', 'deno'), 'deno'),
        (os.path.join(home, '.local', 'bin', 'deno'), 'deno'),
        (os.path.join(home, '.local', 'bin', 'node'), 'node'),
        ('/usr/local/bin/deno', 'deno'),
        ('/usr/local/bin/node', 'node'),
        ('/usr/bin/deno', 'deno'),
    ):
        try:
            for p in sorted(glob.glob(pattern), reverse=True):
                if os.path.exists(p):
                    candidates.append((name, p))
        except Exception:
            pass
    candidates.sort(key=lambda t: priority.index(t[0]) if t[0] in priority else 9)
    for name, path in candidates:
        if name not in found:
            found[name] = {'path': path}
    return found


def ydl_opts_base(extra=None):
    opts = dict(extra or {})
    # Force IPv4 — avoids yt-dlp hangs on networks with a broken IPv6 route
    opts['source_address'] = '0.0.0.0'
    js = _find_js_runtime()
    if js:
        opts['js_runtimes'] = js
    p = proxy_url()
    if p:
        opts['proxy'] = p
    return opts


def extract_stream_url(video_id):
    with _stream_url_lock:
        entry = _stream_url_cache.get(video_id)
    if entry and time.time() - entry[0] < 3600:
        return entry[1]
    with YoutubeDL(ydl_opts_base({"format": "bestaudio[ext=m4a]/bestaudio", "quiet": True})) as ydl:
        info = ydl.extract_info(f"https://youtube.com/watch?v={video_id}", download=False)
    url = info.get('url')
    if url:
        with _stream_url_lock:
            _stream_url_cache[video_id] = (time.time(), url)
    return url


def prefetch_stream(video_id):
    try:
        extract_stream_url(video_id)
    except Exception:
        pass


# Helper to format songs
def format_song(song):
    title = song.get("title", "")
    video_id = song.get("videoId", "")
    artists = ", ".join([artist["name"] for artist in song.get("artists", [])]) if song.get("artists") else song.get("artist", "")
    artist_id = song.get("artists", [{}])[0].get("id", "") if song.get("artists") and isinstance(song["artists"], list) else ""
    
    primary_artists_arr = []
    if song.get("artists") and isinstance(song.get("artists"), list):
        for a in song["artists"]:
            primary_artists_arr.append({"name": a.get("name", ""), "id": a.get("id", "")})
    elif song.get("artist"):
        primary_artists_arr.append({"name": song.get("artist", ""), "id": ""})
        
    album_name = song.get("album", {}).get("name", "") if song.get("album") else ""
    album_id = song.get("album", {}).get("id", "") if song.get("album") else ""
    
    thumbnails = song.get("thumbnails", [])
    image_url = thumbnails[-1]["url"] if thumbnails else "https://via.placeholder.com/150"
    
    duration = song.get("duration_seconds")
    if not duration and song.get("duration"):
        # Sometimes duration is a string like "3:45"
        d_str = song.get("duration")
        if isinstance(d_str, str) and ":" in d_str:
            parts = d_str.split(":")
            if len(parts) == 2:
                duration = int(parts[0]) * 60 + int(parts[1])
            elif len(parts) == 3:
                duration = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    if not duration:
        duration = 0

    return {
        "id": video_id,
        "name": title,
        "title": title,
        "subtitle": artists,
        "image": [{"quality": "500x500", "url": image_url}],
        "url": "",  
        "downloadUrl": [
            {"quality": "128kbps", "url": f"/api/play_stream?id={video_id}"},
            {"quality": "320kbps", "url": f"/api/play_stream?id={video_id}"}
        ],
        "has_lyrics": "true",
        "album": {"name": album_name, "id": album_id},
        "primary_artists": artists,
        "primary_artists_id": artist_id,
        "artists": {
            "primary": primary_artists_arr
        },
        "duration": duration,
        "type": "song"
    }

def format_artist(artist):
    name = artist.get("artist") or artist.get("name") or artist.get("title") or ""
    thumbs = artist.get("thumbnails", [])
    img_url = thumbs[-1]["url"] if thumbs else ""
    return {
        "id": artist.get("browseId", ""),
        "name": name,
        "title": name,
        "subtitle": "Artist",
        "type": "artist",
        "image": [{"quality": "500x500", "url": img_url}] if img_url else []
    }

def format_album(album):
    # Some search results return artist info differently
    subtitle = ""
    if album.get("artist"):
        subtitle = album["artist"]
    elif album.get("artists") and isinstance(album["artists"], list):
        subtitle = ", ".join([a["name"] for a in album["artists"]])
        
    return {
        "id": album.get("browseId", ""),
        "name": album.get("title", ""),
        "title": album.get("title", ""),
        "subtitle": subtitle,
        "type": "album",
        "image": [{"quality": "500x500", "url": album.get("thumbnails", [{"url": "https://via.placeholder.com/150"}])[-1]["url"] if album.get("thumbnails") else "https://via.placeholder.com/150"}]
    }

def format_playlist(playlist):
    return {
        "id": playlist.get("browseId", "") or playlist.get("playlistId", ""),
        "name": playlist.get("title", ""),
        "title": playlist.get("title", ""),
        "subtitle": playlist.get("author", "Playlist"),
        "type": "playlist",
        "image": [{"quality": "500x500", "url": playlist.get("thumbnails", [{"url": "https://via.placeholder.com/150"}])[-1]["url"] if playlist.get("thumbnails") else "https://via.placeholder.com/150"}]
    }

def format_home_shelf_item(item):
    if not item:
        return None
    if setting('hide_explicit') and song_is_explicit(item):
        return None
    if "videoId" in item:
        return format_song(item)
    elif "playlistId" in item:
        title = item.get("title", "")
        p_id = item.get("playlistId", "")
        thumbs = item.get("thumbnails", [])
        img = thumbs[-1]["url"] if thumbs else "https://via.placeholder.com/150"
        desc = item.get("description", "")
        return {
            "id": p_id,
            "title": title,
            "name": title,
            "subtitle": desc or "Playlist",
            "type": "playlist",
            "image": [{"quality": "500x500", "url": img}]
        }
    elif "browseId" in item:
        title = item.get("title", "")
        b_id = item.get("browseId", "")
        thumbs = item.get("thumbnails", [])
        img = thumbs[-1]["url"] if thumbs else "https://via.placeholder.com/150"
        artists = item.get("artists", [])
        art_name = ", ".join([a.get("name", "") for a in artists]) if artists else item.get("description", "")
        is_artist = "artist" in str(item.get("subscribers", "")).lower() or "artist" in str(item.get("subtitle", "")).lower()
        item_type = "artist" if is_artist else "album"
        return {
            "id": b_id,
            "title": title,
            "name": title,
            "subtitle": art_name or ("Artist" if is_artist else "Album"),
            "type": item_type,
            "image": [{"quality": "500x500", "url": img}]
        }
    return None

def _warm_liked_cache():
    """Background warm-up: pre-fetch Liked Songs into cache so the page opens
    instantly (a cold fetch is slow)."""
    try:
        if not _yt_auth:
            return
        if cache_lookup('lib:liked', 300) is not None:
            return
        liked = yt_active().get_liked_songs(limit=200)
        tracks = liked.get("tracks", []) if isinstance(liked, dict) else []
        cache_store('lib:liked', {"success": True, "data": format_songs(tracks)})
        log_event('info', 'warmed liked cache: ' + str(len(tracks)) + ' tracks')
    except Exception as e:
        log_event('warning', 'warm liked cache failed: ' + str(e))


def add_yt_routes(app, get_lyrics_fn):
    @app.route('/api/search/songs')
    def api_search_songs():
        query = request.args.get('query', '')
        if not query:
            return jsonify({"success": False, "data": []})

        cache_key = 'search:songs:' + query.strip().lower()
        cached = cache_lookup(cache_key, 300)
        if cached is not None:
            return jsonify(cached)

        if query.lower() in ['latest', 'popular', 'trending', 'hits', 'party']:
            try:
                charts = yt_browse().get_charts(country=charts_country())
                # Use trending songs if available, else videos
                items = charts.get('trending', {}).get('items', [])
                if not items:
                    items = charts.get('videos', {}).get('items', [])
                
                # Format them to look like search results
                formatted = format_songs(items)
                payload = {"success": True, "data": {"results": formatted}}
                cache_store(cache_key, payload)
                return jsonify(payload)
            except Exception:
                results = yt_search(f"{query} popular songs", "songs")
        else:
            results = yt_search(query, "songs")
        
        formatted = format_songs(results)
        payload = {"success": True, "data": {"results": formatted}}
        cache_store(cache_key, payload)
        return jsonify(payload)

    @app.route('/api/search/suggestions')
    def api_search_suggestions():
        query = request.args.get('query', '')
        if not query:
            return jsonify({"success": False, "data": []})
        cache_key = 'search:sug:' + query.strip().lower()
        cached = cache_lookup(cache_key, 300)
        if cached is not None:
            return jsonify(cached)
        try:
            results = yt_browse().get_search_suggestions(query)
            payload = {"success": True, "data": results}
            cache_store(cache_key, payload)
            return jsonify(payload)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/search/artists')
    def api_search_artists():
        query = request.args.get('query', '')
        cache_key = 'search:artists:' + (query or '').strip().lower()
        cached = cache_lookup(cache_key, 300)
        if cached is not None:
            return jsonify(cached)
        if query.lower() in ['latest', 'popular', 'trending', 'hits', 'party']:
            results = yt_search(f"{query} popular artists", "artists")
        else:
            results = yt_search(query, "artists")
            
        formatted = [format_artist(a) for a in results]
        payload = {"success": True, "data": {"results": formatted}}
        cache_store(cache_key, payload)
        return jsonify(payload)

    @app.route('/api/search/albums')
    def api_search_albums():
        query = request.args.get('query', '')
        cache_key = 'search:albums:' + (query or '').strip().lower()
        cached = cache_lookup(cache_key, 300)
        if cached is not None:
            return jsonify(cached)
        results = yt_search(query, "albums")
        formatted = [format_album(a) for a in results]
        payload = {"success": True, "data": {"results": formatted}}
        cache_store(cache_key, payload)
        return jsonify(payload)

    @app.route('/api/search/playlists')
    def api_search_playlists():
        query = request.args.get('query', '')
        cache_key = 'search:playlists:' + (query or '').strip().lower()
        cached = cache_lookup(cache_key, 300)
        if cached is not None:
            return jsonify(cached)
        results = yt_search(query, "playlists")
        formatted = [format_playlist(a) for a in results]
        payload = {"success": True, "data": {"results": formatted}}
        cache_store(cache_key, payload)
        return jsonify(payload)

    @app.route('/api/songs/related')
    def api_songs_related():
        song_id = request.args.get('id', '')
        if not song_id:
            return jsonify({"success": False, "data": []})
        cache_key = 'related:' + song_id
        cached = cache_lookup(cache_key, 600)
        if cached is not None:
            return jsonify(cached)
        try:
            # get_watch_playlist gets the radio/up next for a song
            watch_playlist = yt_browse().get_watch_playlist(videoId=song_id, limit=20)
            tracks = watch_playlist.get("tracks", [])
            # Skip the first track as it's the requested song itself
            if len(tracks) > 0 and tracks[0].get("videoId") == song_id:
                tracks = tracks[1:]
            
            formatted = []
            for t in tracks:
                t_duration = t.get("length")
                # ytmusicapi get_watch_playlist returns "length" string e.g. "3:45"
                if t_duration and ":" in t_duration:
                    parts = t_duration.split(":")
                    if len(parts) == 2:
                        duration_sec = int(parts[0]) * 60 + int(parts[1])
                    else:
                        duration_sec = 0
                else:
                    duration_sec = 0

                formatted.append({
                    "id": t.get("videoId"),
                    "name": t.get("title"),
                    "title": t.get("title"),
                    "subtitle": ", ".join([a["name"] for a in t.get("artists", [])]) if t.get("artists") else "",
                    "image": [{"quality": "500x500", "url": t.get("thumbnail", [{"url": ""}])[-1]["url"] if t.get("thumbnail") else ""}],
                    "url": "",
                    "downloadUrl": [
                        {"quality": "128kbps", "url": f"/api/play_stream?id={t.get('videoId')}"},
                        {"quality": "320kbps", "url": f"/api/play_stream?id={t.get('videoId')}"}
                    ],
                    "artists": {
                        "primary": t.get("artists", [])
                    },
                    "duration": duration_sec,
                    "type": "song"
                })
            payload = {"success": True, "data": formatted}
            cache_store(cache_key, payload)
            return jsonify(payload)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    _home_cache = {"timestamp": 0, "data": None}
    _home_cache_lock = threading.Lock()
    _similar_cache = {}
    _similar_cache_lock = threading.Lock()
    _home_ff_rot = [0]

    @app.route('/api/home')
    def api_home():
        nonlocal _home_cache
        now = time.time()
        force_refresh = request.args.get('refresh') in ('1', 'true', 'yes')
        _t_start = time.time()
        with _home_cache_lock:
            if not force_refresh and _home_cache["data"] and (now - _home_cache["timestamp"] < 600):
                return jsonify({"success": True, "data": _home_cache["data"]})
        
        try:
            # Home feed + charts + new releases + fresh finds run in
            # parallel. Previously sequential (~4-5s); now the total is roughly
            # the slowest call plus parse/render.
            def _charts_task():
                try:
                    return yt_aux('charts').get_charts(country=charts_country()) or {}
                except Exception as e:
                    print("[home] charts task failed:", e, flush=True)
                    return {}

            def _new_releases_task():
                items = []
                try:
                    res_nr = yt_aux('new_releases')._send_request('browse', {'browseId': 'FEmusic_new_releases_albums'})
                    contents_nr = res_nr.get('contents', {}).get('singleColumnBrowseResultsRenderer', {}).get('tabs', [{}])[0].get('tabRenderer', {}).get('content', {}).get('sectionListRenderer', {}).get('contents', [{}])[0].get('gridRenderer', {}).get('items', [])
                    for item_nr in contents_nr:
                        renderer = item_nr.get("musicTwoRowItemRenderer", {})
                        if not renderer:
                            continue
                        title_nr = renderer.get("title", {}).get("runs", [{"text": ""}])[0].get("text", "")
                        b_id = renderer.get("navigationEndpoint", {}).get("browseEndpoint", {}).get("browseId", "")
                        sub_runs = renderer.get("subtitle", {}).get("runs", [])
                        art_name = sub_runs[2].get("text", "Artist") if len(sub_runs) >= 3 else (sub_runs[0].get("text", "Artist") if sub_runs else "Artist")
                        thumbs_nr = renderer.get("thumbnailRenderer", {}).get("musicThumbnailRenderer", {}).get("thumbnail", {}).get("thumbnails", [])
                        img_nr = thumbs_nr[-1]["url"] if thumbs_nr else ""
                        items.append({
                            "id": b_id,
                            "title": title_nr,
                            "name": title_nr,
                            "subtitle": art_name,
                            "type": "album",
                            "image": [{"quality": "500x500", "url": img_nr}]
                        })
                except Exception as e:
                    print("[home] new-releases task failed:", e, flush=True)
                return items

            def _fresh_finds_task(query):
                try:
                    client = yt_aux('fresh_finds')
                    res = client.search(query, filter="songs") or []
                    if not res:
                        res = yt_no_language().search(query, filter="songs") or []
                    return format_songs(res[:15])
                except Exception as e:
                    print("[home] fresh-finds task failed:", e, flush=True)
                    return []

            # Rotate the Fresh Finds query every refresh so the shelf actually changes
            if force_refresh:
                _home_ff_rot[0] += 1
            _ff_variants = ["Fresh Finds", "Fresh Finds Pop", "Fresh Finds India", "Fresh Finds Indie", "Fresh Finds Dance"]
            _ff_query = _ff_variants[_home_ff_rot[0] % len(_ff_variants)]

            with ThreadPoolExecutor(max_workers=4) as _pool:
                _fut_home = _pool.submit(lambda: yt_browse().get_home(limit=14))
                _fut_charts = _pool.submit(_charts_task)
                _fut_nr = _pool.submit(_new_releases_task)
                _fut_ff = _pool.submit(_fresh_finds_task, _ff_query)
                home_raw = _fut_home.result()
                charts = _fut_charts.result()
                new_releases = _fut_nr.result()
                fresh_finds = _fut_ff.result()

            quick_picks = []
            dancing_on_your_own = []
            _ff_section = []
            sections = []
            
            for sec in home_raw:
                sec_title = sec.get("title", "")
                contents = sec.get("contents", [])
                formatted_items = []
                for it in contents:
                    f = format_home_shelf_item(it)
                    if f:
                        formatted_items.append(f)
                
                if not formatted_items:
                    continue
                
                lower_title = sec_title.lower()
                if "quick" in lower_title and not quick_picks:
                    quick_picks = [i for i in formatted_items if i.get("type") == "song"]
                elif "dancing" in lower_title and not dancing_on_your_own:
                    dancing_on_your_own = formatted_items
                elif ("fresh" in lower_title or "finds" in lower_title) and not _ff_section:
                    _ff_section = formatted_items
                
                sections.append({
                    "title": sec_title,
                    "items": formatted_items
                })
            
            # Fall back to home-section items when search-based fresh finds is empty
            if not fresh_finds:
                fresh_finds = _ff_section

            # If quick_picks is empty from home_raw, fallback to trending charts (reuse)
            if not quick_picks:
                try:
                    trending_items = charts.get('trending', {}).get('items', []) or charts.get('videos', {}).get('items', [])
                    quick_picks = format_songs(trending_items[:20])
                except Exception:
                    pass

            # Popular artists — reuse the same charts call, rotate order on refresh
            popular_artists = []
            try:
                chart_artists = charts.get('artists', []) if isinstance(charts, dict) else []
                if force_refresh and len(chart_artists) > 1:
                    _roff = (_home_ff_rot[0] * 3) % len(chart_artists)
                    chart_artists = chart_artists[_roff:] + chart_artists[:_roff]
                popular_artists = [format_artist(a) for a in chart_artists[:15] if a]
            except Exception as e:
                print("Error getting chart artists:", e)
                try:
                    art_res = yt_search("Top Artists", "artists")
                    popular_artists = [format_artist(a) for a in art_res[:15] if a]
                except Exception:
                    pass

            payload = {
                "quick_picks": quick_picks,
                "dancing_on_your_own": dancing_on_your_own,
                "fresh_finds": fresh_finds,
                "popular_artists": popular_artists,
                "new_releases": new_releases,
                "sections": sections
            }

            print(f"[home] fetch done in {time.time() - _t_start:.2f}s (refresh={bool(force_refresh)})", flush=True)
            
            with _home_cache_lock:
                _home_cache["timestamp"] = now
                _home_cache["data"] = payload

            return jsonify({"success": True, "data": payload})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/similar_to')
    def api_similar_to():
        artist_id = request.args.get('artist_id', '')
        artist_name = request.args.get('artist_name', '')
        song_id = request.args.get('song_id', '')
        _force = request.args.get('refresh') in ('1', 'true', 'yes')
        _ckey = f"{song_id}|{artist_id}|{artist_name}".lower()
        _now = time.time()
        if not _force:
            with _similar_cache_lock:
                _ent = _similar_cache.get(_ckey)
                if _ent and (_now - _ent[0]) < 300:
                    return jsonify({"success": True, "data": _ent[1]})
        results = []
        try:
            if song_id:
                watch_pl = yt_browse().get_watch_playlist(videoId=song_id, limit=15)
                tracks = watch_pl.get("tracks", [])
                for t in tracks:
                    if t.get("videoId") != song_id:
                        if setting('hide_explicit') and song_is_explicit(t):
                            continue
                        results.append(format_song(t))
            elif artist_id:
                artist_data = yt_browse().get_artist(artist_id)
                songs_data = artist_data.get("songs", {})
                raw = []
                if isinstance(songs_data, dict) and songs_data.get("browseId"):
                    try:
                        pl = yt_browse().get_playlist(songs_data["browseId"])
                        raw = pl.get("tracks", [])
                    except:
                        raw = songs_data.get("results", [])
                elif isinstance(songs_data, dict):
                    raw = songs_data.get("results", [])
                elif isinstance(songs_data, list):
                    raw = songs_data
                results = format_songs(raw[:15])
            elif artist_name:
                search_res = yt_search(f"{artist_name} songs", "songs")
                results = format_songs(search_res[:15])
        except Exception as e:
            print("similar_to error:", e)
        with _similar_cache_lock:
            _similar_cache[_ckey] = (time.time(), results)
            if len(_similar_cache) > 60:
                for _k in list(_similar_cache.keys())[:-40]:
                    _similar_cache.pop(_k, None)
        return jsonify({"success": True, "data": results})

    @app.route('/api/artists')
    def api_artists():
        artist_id = request.args.get('id', '')
        if not artist_id:
            return jsonify({"success": False})
        try:
            artist = yt_browse().get_artist(artist_id)
            
            songs_data = artist.get("songs", {})
            raw_songs = []
            if songs_data.get("browseId"):
                try:
                    playlist = yt_browse().get_playlist(songs_data["browseId"])
                    raw_songs = playlist.get("tracks", [])
                except Exception:
                    raw_songs = songs_data.get("results", []) if isinstance(songs_data, dict) else songs_data
            else:
                raw_songs = songs_data.get("results", []) if isinstance(songs_data, dict) else songs_data
                
            songs = format_songs(raw_songs)
            
            sub_str = artist.get("subscribers", "")
            sub_count = 0
            if sub_str:
                clean_str = sub_str.upper().replace("SUBSCRIBERS", "").strip()
                try:
                    if clean_str.endswith("M"): sub_count = int(float(clean_str[:-1]) * 1000000)
                    elif clean_str.endswith("K"): sub_count = int(float(clean_str[:-1]) * 1000)
                    elif clean_str.isdigit(): sub_count = int(clean_str)
                except:
                    pass
                    
            albums = [format_album(a) for a in artist.get("albums", {}).get("results", [])]
            singles = [format_album(a) for a in artist.get("singles", {}).get("results", [])]
                
            data = {
                "id": artist_id,
                "name": artist.get("name", ""),
                "followerCount": sub_count,
                "description": artist.get("description", ""),
                "image": [{"quality": "500x500", "url": artist.get("thumbnails", [{"url": ""}])[-1]["url"] if artist.get("thumbnails") else ""}],
                "topSongs": songs,
                "albums": albums,
                "singles": singles,
                "playlists": []
            }
            return jsonify({"success": True, "data": data})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/artists/<artist_id>/songs')
    def api_artist_songs(artist_id):
        try:
            artist = yt_browse().get_artist(artist_id)
            songs_data = artist.get("songs", {})
            if isinstance(songs_data, dict):
                raw_songs = songs_data.get("results", [])
            else:
                raw_songs = songs_data
            songs = format_songs(raw_songs)
            return jsonify({"success": True, "data": {"songs": songs}})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/albums')
    def api_albums():
        album_id = request.args.get('id', '')
        if not album_id:
            return jsonify({"success": False})
        try:
            album = yt_browse().get_album(album_id)
            
            tracks = []
            for t in album.get("tracks", []):
                tracks.append({
                    "id": t.get("videoId"),
                    "name": t.get("title"),
                    "title": t.get("title"),
                    "subtitle": ", ".join([a["name"] for a in t.get("artists", [])]) if t.get("artists") else album.get("title"),
                    "image": [{"quality": "500x500", "url": album.get("thumbnails", [{"url": ""}])[-1]["url"] if album.get("thumbnails") else ""}],
                    "url": "",
                    "downloadUrl": [
                        {"quality": "128kbps", "url": f"/api/play_stream?id={t.get('videoId')}"},
                        {"quality": "320kbps", "url": f"/api/play_stream?id={t.get('videoId')}"}
                    ],
                    "artists": {
                        "primary": [{"name": ", ".join([a["name"] for a in t.get("artists", [])]) if t.get("artists") else album.get("title")}]
                    },
                    "duration": t.get("duration_seconds", 0),
                    "album": {"name": album.get("title"), "id": album_id},
                    "has_lyrics": "true"
                })
                
            data = {
                "id": album_id,
                "name": album.get("title"),
                "image": [{"quality": "500x500", "url": album.get("thumbnails", [{"url": ""}])[-1]["url"] if album.get("thumbnails") else ""}],
                "songs": tracks,
                "year": album.get("year", ""),
                "songCount": album.get("trackCount", len(tracks)),
                "artists": {
                    "primary": album.get("artists", [])
                }
            }
            return jsonify({"success": True, "data": data})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/playlists')
    def api_playlists():
        playlist_id = request.args.get('id', '')
        if not playlist_id:
            return jsonify({"success": False})
        try:
            playlist = yt_browse().get_playlist(playlist_id)
            pl_thumbs = playlist.get("thumbnails") or []
            pl_img = pl_thumbs[-1]["url"] if pl_thumbs else ""
            
            tracks = []
            for t in playlist.get("tracks", []):
                # Every track keeps its own thumbnail/album — playlist cover is only a fallback.
                t_thumbs = t.get("thumbnails") or []
                t_img = t_thumbs[-1]["url"] if t_thumbs else pl_img
                artist_names = ", ".join([a.get("name", "") for a in (t.get("artists") or []) if a.get("name")])
                album = t.get("album") or {}
                tracks.append({
                    "id": t.get("videoId"),
                    "name": t.get("title"),
                    "title": t.get("title"),
                    "subtitle": artist_names or playlist.get("title"),
                    "image": [{"quality": "500x500", "url": t_img}],
                    "url": "",
                    "downloadUrl": [
                        {"quality": "128kbps", "url": f"/api/play_stream?id={t.get('videoId')}"},
                        {"quality": "320kbps", "url": f"/api/play_stream?id={t.get('videoId')}"}
                    ],
                    "artists": {
                        "primary": [{"name": artist_names or playlist.get("title")}]
                    },
                    "duration": t.get("duration_seconds", 0),
                    "album": {"name": album.get("name") or "", "id": album.get("id") or playlist_id},
                    "has_lyrics": "true"
                })
                
            data = {
                "id": playlist_id,
                "name": playlist.get("title"),
                "image": [{"quality": "500x500", "url": pl_img}],
                "songs": tracks,
                "songCount": len(tracks) or playlist.get("trackCount", 0),
                "author": playlist.get("author", {}).get("name", "YouTube Music") if isinstance(playlist.get("author"), dict) else playlist.get("author", "YouTube Music")
            }
            return jsonify({"success": True, "data": data})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/songs')
    def api_songs():
        song_ids = request.args.get('ids', '')
        if not song_ids:
            return jsonify({"success": False})
            
        ids = song_ids.split(',')
        results = []
        
        for vid in ids:
            try:
                with YoutubeDL(ydl_opts_base({"quiet": True})) as ydl:
                    info = ydl.extract_info(f"https://youtube.com/watch?v={vid}", download=False)
                    
                results.append({
                    "id": vid,
                    "name": info.get("title", ""),
                    "title": info.get("title", ""),
                    "subtitle": info.get("channel", ""),
                    "image": [{"quality": "500x500", "url": info.get("thumbnail", "")}],
                    "url": "",
                    "downloadUrl": [
                        {"quality": "128kbps", "url": f"/api/play_stream?id={vid}"},
                        {"quality": "320kbps", "url": f"/api/play_stream?id={vid}"}
                    ],
                    "artists": {
                        "primary": [{"name": info.get("channel", ""), "id": info.get("channel_id", "")}]
                    },
                    "duration": info.get("duration", 0),
                    "has_lyrics": "true",
                    "album": {"name": "", "id": ""},
                    "primary_artists": info.get("channel", "")
                })
            except Exception as e:
                print("Error getting song", e)
                
        return jsonify({"success": True, "data": results})

    @app.route('/api/new_releases', endpoint='yt_new_releases')
    def api_new_releases():
        try:
            res = yt_browse()._send_request('browse', {'browseId': 'FEmusic_new_releases_albums'})
            contents = res.get('contents', {}).get('singleColumnBrowseResultsRenderer', {}).get('tabs', [{}])[0].get('tabRenderer', {}).get('content', {}).get('sectionListRenderer', {}).get('contents', [{}])[0].get('gridRenderer', {}).get('items', [])
            
            formatted_releases = []
            for item in contents:
                renderer = item.get("musicTwoRowItemRenderer", {})
                if not renderer: continue
                
                title = renderer.get("title", {}).get("runs", [{"text": ""}])[0].get("text", "")
                browse_id = renderer.get("navigationEndpoint", {}).get("browseEndpoint", {}).get("browseId", "")
                
                # Extract subtitle runs
                subtitle_runs = renderer.get("subtitle", {}).get("runs", [])
                album_type = "album"
                artist_name = "Unknown Artist"
                if len(subtitle_runs) >= 3:
                    album_type = subtitle_runs[0].get("text", "Album").lower()
                    artist_name = subtitle_runs[2].get("text", "Unknown Artist")
                elif len(subtitle_runs) == 1:
                    artist_name = subtitle_runs[0].get("text", "Unknown Artist")
                
                thumbnails = renderer.get("thumbnailRenderer", {}).get("musicThumbnailRenderer", {}).get("thumbnail", {}).get("thumbnails", [])
                img_url = thumbnails[-1]["url"] if thumbnails else ""
                
                formatted_releases.append({
                    "id": browse_id,
                    "name": title,
                    "type": album_type,
                    "image": [{"quality": "500x500", "url": img_url}],
                    "artists": {
                        "primary": [{"name": artist_name}]
                    }
                })
                
            return jsonify({"success": True, "data": formatted_releases})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/explore', endpoint='yt_explore')
    def api_explore():
        try:
            now = time.time()
            if hasattr(api_explore, 'cache') and (now - getattr(api_explore, 'cache_time', 0) < 600):
                return jsonify({"success": True, "data": api_explore.cache})

            exp = {}
            try:
                exp = yt_browse().get_explore()
            except Exception as e:
                print("yt.get_explore exception:", e)

            # 1. New Releases
            formatted_new_releases = []
            for item in exp.get("new_releases", []):
                title = item.get("title", "")
                browse_id = item.get("browseId", "")
                artists = ", ".join([a.get("name", "") for a in item.get("artists", [])]) if item.get("artists") else "Unknown Artist"
                thumbnails = item.get("thumbnails", [])
                img_url = thumbnails[-1]["url"] if thumbnails else ""
                album_type = item.get("type", "Album")
                formatted_new_releases.append({
                    "id": browse_id,
                    "name": title,
                    "title": title,
                    "type": album_type,
                    "image": [{"quality": "500x500", "url": img_url}],
                    "artists": {
                        "primary": [{"name": artists}]
                    }
                })

            # 2. Trending
            trending_raw = exp.get("trending", {})
            trending_items = trending_raw.get("items", []) if isinstance(trending_raw, dict) else []
            formatted_trending = format_songs(trending_items)

            # 3. Mood Categories
            mood_categories = {}
            try:
                mood_categories = yt_browse().get_mood_categories()
            except Exception as e:
                print("yt.get_mood_categories exception:", e)
                if exp.get("moods_and_genres"):
                    mood_categories = {"Moods & moments": exp.get("moods_and_genres", []), "Genres": []}

            # 4. Charts (Videos and Artists)
            top_charts = []
            top_artists = []
            try:
                charts = yt_browse().get_charts(country=charts_country())
                for v in charts.get('videos', []):
                    top_charts.append({
                        "id": v.get('playlistId', ''),
                        "title": v.get('title', ''),
                        "image": v.get('thumbnails', [{}])[-1].get('url', '')
                    })
                for a in charts.get('artists', [])[:20]:
                    top_artists.append({
                        "id": a.get('browseId', ''),
                        "name": a.get('title', ''),
                        "title": a.get('title', ''),
                        "subscribers": a.get('subscribers', ''),
                        "rank": a.get('rank', ''),
                        "image": [{"quality": "500x500", "url": a.get('thumbnails', [{}])[-1].get('url', '')}]
                    })
            except Exception as e:
                print("yt.get_charts exception:", e)

            result_data = {
                "new_releases": formatted_new_releases,
                "trending": formatted_trending,
                "mood_categories": mood_categories,
                "top_charts": top_charts,
                "top_artists": top_artists
            }

            api_explore.cache = result_data
            api_explore.cache_time = now
            return jsonify({"success": True, "data": result_data})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/mood_playlists', endpoint='yt_mood_playlists')
    def api_mood_playlists():
        params = request.args.get('params', '')
        title = request.args.get('title', 'Mood & Genre')
        if not params:
            return jsonify({"success": False, "error": "Missing params parameter"})
        try:
            playlists = yt_browse().get_mood_playlists(params)
            formatted = []
            for p in playlists:
                formatted.append({
                    "id": p.get('playlistId', ''),
                    "name": p.get('title', ''),
                    "title": p.get('title', ''),
                    "description": p.get('description', ''),
                    "image": [{"quality": "500x500", "url": p.get('thumbnails', [{}])[-1].get('url', '') if p.get('thumbnails') else ''}]
                })
            return jsonify({"success": True, "title": title, "data": formatted})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/play_stream', endpoint='yt_play_stream')
    def api_play_stream2():
        song_id = request.args.get('id')
        if not song_id:
            return jsonify({"error": "No ID"})
            
        # Check if song is in cache
        try:
            cache_dir = os.path.join(os.environ.get('APPDATA', os.path.expanduser('~')), 'Airbeats', 'Cache')
            audio_path = os.path.join(cache_dir, 'Songs', f"{song_id}.m4a")
            if os.path.exists(audio_path):
                return send_file(audio_path)
        except:
            pass
            
        try:
            url = extract_stream_url(song_id)
            if not url:
                raise ValueError('stream unavailable')
            # Default: direct CDN redirect (fastest, native range support).
            # ?proxy=1 -> server-side proxy (fallback when direct playback fails).
            if request.args.get('proxy') == '1':
                proxied = stream_proxy(url)
                if proxied is not None:
                    return proxied
            return redirect(url)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/prefetch')
    def api_prefetch():
        ids = (request.args.get('ids') or request.args.get('id') or '').strip()
        if not ids:
            return jsonify({"success": False, "error": "no id"})
        queued = []
        for video_id in [v.strip() for v in ids.split(',') if v.strip()][:3]:
            if not re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id):
                continue
            with _stream_url_lock:
                entry = _stream_url_cache.get(video_id)
            if entry and time.time() - entry[0] < 3600:
                continue
            queued.append(video_id)
            threading.Thread(target=prefetch_stream, args=(video_id,), daemon=True).start()
        return jsonify({"success": True, "data": queued})

    @app.route('/api/lyrics', endpoint='yt_api_lyrics')
    def api_lyrics():
        song_id = request.args.get('song_id')
        if song_id:
            try:
                cache_dir = os.path.join(os.environ.get('APPDATA', os.path.expanduser('~')), 'Airbeats', 'Cache')
                index_file = os.path.join(cache_dir, 'cache_index.json')
                if os.path.exists(index_file):
                    with open(index_file, 'r', encoding='utf-8') as f:
                        idx = json.load(f)
                    cached_song = next((s for s in idx if s['id'] == song_id), None)
                    if cached_song and cached_song.get('lyrics'):
                        return jsonify(cached_song['lyrics'])
            except:
                pass
        return get_lyrics_fn()

    @app.route('/api/cache/add', methods=['POST'])
    def api_cache_add():
        data = request.json
        if not data or not data.get('id') or not data.get('metadata'):
            return jsonify({"success": False, "error": "Invalid data"})
            
        song_id = data['id']
        metadata = data['metadata']
        lyrics = data.get('lyrics')
        
        cache_dir = os.path.join(os.environ.get('APPDATA', os.path.expanduser('~')), 'Airbeats', 'Cache')
        songs_dir = os.path.join(cache_dir, 'Songs')
        index_file = os.path.join(cache_dir, 'cache_index.json')
        
        os.makedirs(songs_dir, exist_ok=True)
        if not os.path.exists(index_file):
            with open(index_file, 'w', encoding='utf-8') as f:
                json.dump([], f)
                
        def download_task():
            try:
                # 1. Update index immediately to prevent duplicate downloads
                with open(index_file, 'r', encoding='utf-8') as f:
                    idx = json.load(f)
                
                if any(s['id'] == song_id for s in idx):
                    return # Already cached
                    
                new_entry = {
                    "id": song_id,
                    "metadata": metadata,
                    "lyrics": lyrics,
                    "cached_at": __import__('time').time()
                }
                idx.append(new_entry)
                with open(index_file, 'w', encoding='utf-8') as f:
                    json.dump(idx, f, indent=4)
                    
                # 2. Download audio
                audio_path = os.path.join(songs_dir, f"{song_id}.m4a")
                ydl_opts = ydl_opts_base({
                    "format": "bestaudio[ext=m4a]/bestaudio",
                    "outtmpl": audio_path,
                    "quiet": True,
                    "noplaylist": True,
                })
                with YoutubeDL(ydl_opts) as ydl:
                    ydl.download([f"https://youtube.com/watch?v={song_id}"])
            except Exception as e:
                print("Cache download error:", e)
                
        threading.Thread(target=download_task).start()
        return jsonify({"success": True})

    @app.route('/api/cache/list')
    def api_cache_list():
        cache_dir = os.path.join(os.environ.get('APPDATA', os.path.expanduser('~')), 'Airbeats', 'Cache')
        index_file = os.path.join(cache_dir, 'cache_index.json')
        if not os.path.exists(index_file):
            return jsonify({"success": True, "data": []})
            
        try:
            with open(index_file, 'r', encoding='utf-8') as f:
                idx = json.load(f)
            # Format back to song objects
            songs = []
            for item in idx:
                s = item['metadata']
                s['id'] = item['id']
                s['downloadUrl'] = [
                    {"quality": "128kbps", "url": f"/api/play_stream?id={item['id']}"},
                    {"quality": "320kbps", "url": f"/api/play_stream?id={item['id']}"}
                ]
                songs.append(s)
            return jsonify({"success": True, "data": songs})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/cache/stream')
    def api_cache_stream():
        song_id = request.args.get('id')
        if not song_id:
            return "No id", 400
        cache_dir = os.path.join(os.environ.get('APPDATA', os.path.expanduser('~')), 'Airbeats', 'Cache')
        audio_path = os.path.join(cache_dir, 'Songs', f"{song_id}.m4a")
        if os.path.exists(audio_path):
            return send_file(audio_path, mimetype='audio/mp4')
        return "Not found", 404

    @app.route('/api/yt/status')
    def api_yt_status():
        global _yt_account_cache
        if not _yt_auth:
            return jsonify({"success": True, "data": {"loggedIn": False}})
        if _yt_account_cache is None:
            try:
                info = yt_active().get_account_info()
                _yt_account_cache = {
                    "name": info.get("accountName") or "YouTube Music",
                    "handle": info.get("channelHandle") or "",
                    "photo": info.get("accountPhotoUrl") or ""
                }
                saved = dict(_yt_auth)
                saved["account"] = _yt_account_cache
                yt_save_auth(saved)
            except Exception as e:
                return jsonify({"success": True, "data": {"loggedIn": True, "name": "", "handle": "", "photo": "", "error": str(e)}})
        data = {"loggedIn": True}
        data.update(_yt_account_cache)
        return jsonify({"success": True, "data": data})

    @app.route('/api/yt/login', methods=['POST'])
    def api_yt_login():
        global _yt_account_cache
        payload = request.get_json(silent=True) or {}
        try:
            cookie, authuser = yt_parse_auth_input(payload.get('input', ''))
            headers = yt_build_headers(cookie, authuser, payload.get('visitorData', ''))
            candidate = yt_make(headers)
            info = candidate.get_account_info()
        except Exception as e:
            return jsonify({"success": False, "error": str(e) or "login failed"})
        account = {
            "name": info.get("accountName") or "YouTube Music",
            "handle": info.get("channelHandle") or "",
            "photo": info.get("accountPhotoUrl") or ""
        }
        try:
            fetched_visitor = candidate.base_headers.get("x-goog-visitor-id", "")
        except Exception:
            fetched_visitor = ""
        if fetched_visitor and not headers.get("x-goog-visitor-id"):
            headers["x-goog-visitor-id"] = fetched_visitor
        saved = dict(headers)
        saved["account"] = account
        try:
            yt_save_auth(saved)
        except OSError as e:
            return jsonify({"success": False, "error": str(e)})
        yt_apply_auth(saved, candidate)
        _yt_account_cache = account
        cache_clear('')
        return jsonify({"success": True, "data": account})

    @app.route('/api/yt/logout', methods=['POST'])
    def api_yt_logout():
        yt_apply_auth(None)
        cache_clear('')
        try:
            os.remove(YT_AUTH_FILE)
        except OSError:
            pass
        return jsonify({"success": True})

    def resolve_payload_video_id(payload):
        """Resolve the YouTube Music match when the id is not a YT video id (Saavn)."""
        video_id = str(payload.get('id') or '').strip()
        name = str(payload.get('name') or payload.get('title') or '').strip()
        artist = str(payload.get('artist') or payload.get('subtitle') or '').strip()
        duration = payload.get('duration') or 0
        if payload.get('source') == 'saavn' or not re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id or ''):
            match = yt_resolve_song(name, artist, duration) if name else None
            if match:
                return match.get('videoId') or '', match
        return video_id, None

    @app.route('/api/library/playlists')
    def api_library_playlists():
        if not _yt_auth:
            return jsonify({"success": False, "error": "not logged in"})
        cached = cache_lookup('lib:playlists', 60)
        if cached is not None:
            return jsonify(cached)
        try:
            items = yt_active().get_library_playlists(limit=50)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
        data = []
        for item in items:
            playlist = format_playlist(item)
            count = item.get("count")
            if count:
                playlist["subtitle"] = f"{count} songs" if str(count).isdigit() else str(count)
            data.append(playlist)
        payload = {"success": True, "data": data}
        cache_store('lib:playlists', payload)
        return jsonify(payload)

    @app.route('/api/library/liked')
    def api_library_liked():
        if not _yt_auth:
            return jsonify({"success": False, "error": "not logged in"})
        cached = cache_lookup('lib:liked', 300)
        if cached is not None:
            return jsonify(cached)
        try:
            liked = yt_active().get_liked_songs(limit=200)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
        tracks = liked.get("tracks", []) if isinstance(liked, dict) else []
        payload = {"success": True, "data": format_songs(tracks)}
        cache_store('lib:liked', payload)
        return jsonify(payload)

    @app.route('/api/library/subscriptions')
    def api_library_subscriptions():
        if not _yt_auth:
            return jsonify({"success": False, "error": "not logged in"})
        cached = cache_lookup('lib:subs', 60)
        if cached is not None:
            return jsonify(cached)
        try:
            items = yt_active().get_library_subscriptions(limit=100)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
        payload = {"success": True, "data": [format_artist(a) for a in items]}
        cache_store('lib:subs', payload)
        return jsonify(payload)

    @app.route('/api/library/albums')
    def api_library_albums():
        if not _yt_auth:
            return jsonify({"success": False, "error": "not logged in"})
        cached = cache_lookup('lib:albums', 60)
        if cached is not None:
            return jsonify(cached)
        try:
            items = yt_active().get_library_albums(limit=100)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
        payload = {"success": True, "data": [format_album(a) for a in items]}
        cache_store('lib:albums', payload)
        return jsonify(payload)

    @app.route('/api/yt/like', methods=['POST'])
    def api_yt_like():
        if not _yt_auth:
            return jsonify({"success": False, "error": "not logged in"})
        payload = request.get_json(silent=True) or {}
        video_id, resolved = resolve_payload_video_id(payload)
        if not video_id:
            return jsonify({"success": False, "error": "no id"})
        try:
            yt_active().rate_song(video_id, 'LIKE' if payload.get('liked') else 'INDIFFERENT')
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
        cache_clear('lib:')
        data = format_song(resolved) if resolved else {"id": video_id}
        data["ytLike"] = bool(payload.get('liked'))
        return jsonify({"success": True, "data": data})

    @app.route('/api/yt/played', methods=['POST'])
    def api_yt_played():
        if not _yt_auth:
            return jsonify({"success": False, "error": "not logged in"})
        payload = request.get_json(silent=True) or {}

        def worker():
            video_id, _ = resolve_payload_video_id(payload)
            if video_id:
                yt_record_play(video_id, payload.get('played') or 0, payload.get('duration') or 0, bool(payload.get('final')))

        threading.Thread(target=worker, daemon=True).start()
        return jsonify({"success": True})

    @app.route('/api/yt/resolve')
    def api_yt_resolve():
        if not _yt_auth:
            return jsonify({"success": False, "error": "not logged in"})
        name = (request.args.get('name') or '').strip()
        artist = (request.args.get('artist') or '').strip()
        try:
            duration = int(request.args.get('duration') or 0)
        except ValueError:
            duration = 0
        if not name:
            return jsonify({"success": False, "error": "no name"})
        try:
            match = yt_resolve_song(name, artist, duration)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
        if not match:
            return jsonify({"success": False, "error": "no match"})
        return jsonify({"success": True, "data": format_song(match)})

    @app.route('/api/saavn/search')
    def api_saavn_search():
        if not saavn_enabled():
            return jsonify({"success": False, "error": "JioSaavn integration is disabled", "disabled": True}), 403
        query = (request.args.get('query') or '').strip()
        if not query:
            return jsonify({"success": False, "error": "no query"})
        try:
            limit = min(int(request.args.get('limit') or 30), 50)
        except ValueError:
            limit = 30
        try:
            payload = saavn_call(__call='search.getResults', q=query, n=limit)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
        results = payload.get('results') if isinstance(payload, dict) else None
        return jsonify({"success": True, "data": format_saavn_songs(results or [])})

    @app.route('/api/saavn/stream')
    def api_saavn_stream():
        if not saavn_enabled():
            return jsonify({"success": False, "error": "JioSaavn integration is disabled", "disabled": True}), 403
        song_id = (request.args.get('id') or '').strip()
        if not song_id:
            return jsonify({"success": False, "error": "no id"})
        try:
            media_url = saavn_media_url(song_id)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
        proxied = stream_proxy(media_url, referer=SAAVN_REFERER)
        if proxied is not None:
            return proxied
        return redirect(media_url)

    @app.route('/api/saavn/resolve')
    def api_saavn_resolve():
        if not saavn_enabled():
            return jsonify({"success": False, "error": "JioSaavn integration is disabled", "disabled": True}), 403
        name = (request.args.get('name') or '').strip()
        artist = (request.args.get('artist') or '').strip()
        try:
            duration = int(request.args.get('duration') or 0)
        except ValueError:
            duration = 0
        if not name:
            return jsonify({"success": False, "error": "no name"})
        try:
            payload = saavn_call(__call='search.getResults', q=f'{name} {artist}'.strip(), n=8)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
        results = payload.get('results') if isinstance(payload, dict) else None
        match = saavn_best_match(results or [], name, artist, duration)
        if not match:
            return jsonify({"success": False, "error": "no match"})
        return jsonify({"success": True, "data": format_saavn_song(match)})

    def _sanitize_settings(payload):
        updates = {}
        if 'saavn_enabled' in payload:
            updates['saavn_enabled'] = bool(payload.get('saavn_enabled'))
        if 'hide_explicit' in payload:
            updates['hide_explicit'] = bool(payload.get('hide_explicit'))
        if 'use_login_for_browse' in payload:
            updates['use_login_for_browse'] = bool(payload.get('use_login_for_browse'))
        if 'content_language' in payload:
            updates['content_language'] = str(payload.get('content_language') or '').strip()[:16]
        if 'content_country' in payload:
            updates['content_country'] = str(payload.get('content_country') or '').strip().upper()[:4]
        if 'proxy_enabled' in payload:
            updates['proxy_enabled'] = bool(payload.get('proxy_enabled'))
        if 'proxy_type' in payload:
            updates['proxy_type'] = 'SOCKS' if str(payload.get('proxy_type') or '').upper() == 'SOCKS' else 'HTTP'
        if 'proxy_url' in payload:
            updates['proxy_url'] = str(payload.get('proxy_url') or '').strip()[:200]
        if 'lyrics_preferred' in payload:
            value = str(payload.get('lyrics_preferred') or '').strip().lower()
            updates['lyrics_preferred'] = value if value in LYRICS_PROVIDER_KEYS else ''
        if 'lyrics_disabled' in payload:
            raw = payload.get('lyrics_disabled')
            if isinstance(raw, list):
                updates['lyrics_disabled'] = [k for k in raw if str(k).lower() in LYRICS_PROVIDER_KEYS][:20]
            else:
                updates['lyrics_disabled'] = []
        return updates

    @app.route('/api/settings')
    def api_settings_get():
        return jsonify({"success": True, "data": dict(_desktop_settings)})

    @app.route('/api/settings', methods=['POST'])
    def api_settings_set():
        payload = request.get_json(silent=True) or {}
        updates = _sanitize_settings(payload)
        if not updates:
            return jsonify({"success": True, "data": dict(_desktop_settings)})
        settings_save(updates)
        apply_settings_runtime()
        rebuild_yt_instances()
        cache_clear('')
        log_event('info', 'settings updated: ' + ', '.join(sorted(updates.keys())))
        return jsonify({"success": True, "data": dict(_desktop_settings)})

    def _mask_secret(value):
        value = str(value or '')
        if len(value) <= 8:
            return '*' * len(value)
        return value[:4] + '*' * (len(value) - 8) + value[-4:]

    @app.route('/api/yt/token')
    def api_yt_token():
        if not _yt_auth:
            return jsonify({"success": True, "data": {"hasAuth": False}})
        reveal = (request.args.get('reveal') or '') in ('1', 'true', 'yes')
        cookie = str(_yt_auth.get('cookie') or '')
        parts = yt_cookie_map(cookie)
        masked_cookie = '; '.join(f'{name}={_mask_secret(value)}' for name, value in parts.items())
        data = {
            "hasAuth": True,
            "masked": masked_cookie,
            "cookie": cookie if reveal else '',
            "length": len(cookie),
            "cookieNames": sorted(parts.keys()),
            "authuser": str(_yt_auth.get('x-goog-authuser') or '0'),
            "visitorId": str(_yt_auth.get('x-goog-visitor-id') or ''),
            "hasSapisid": bool(parts.get('SAPISID') or parts.get('__Secure-3PAPISID')),
            "authorization": "present" if _yt_auth.get('authorization') else "missing",
        }
        return jsonify({"success": True, "data": data})

    @app.route('/api/yt/create_playlist', methods=['POST'])
    def api_yt_create_playlist():
        if not _yt_auth:
            return jsonify({"success": False, "error": "not logged in"})
        payload = request.get_json(silent=True) or {}
        title = str(payload.get('title') or '').strip()[:150]
        if not title:
            return jsonify({"success": False, "error": "title required"})
        description = str(payload.get('description') or '')[:1000]
        try:
            result = yt_active().create_playlist(title, description, privacy_status='PRIVATE')
        except Exception as e:
            log_event('error', 'create_playlist failed: ' + str(e))
            return jsonify({"success": False, "error": str(e)})
        if isinstance(result, dict):
            browse_id = result.get('playlistId') or result.get('browseId') or ''
        else:
            browse_id = str(result or '')
        cache_clear('lib:')
        log_event('info', 'yt create_playlist "' + title + '" -> ' + (browse_id or '?'))
        return jsonify({"success": True, "data": {"id": browse_id, "name": title}})

    _client_log_counter = {'window': 0, 'count': 0}

    def _client_log_allow():
        now = int(time.time() // 60)
        if _client_log_counter['window'] != now:
            _client_log_counter['window'] = now
            _client_log_counter['count'] = 0
        _client_log_counter['count'] += 1
        return _client_log_counter['count'] <= 150

    def _read_server_log(limit):
        entries = []
        path = os.path.join(LOG_DIR, 'server.log')
        try:
            with open(path, encoding='utf-8', errors='replace') as fh:
                lines = fh.readlines()[-max(limit * 2, 400):]
        except OSError:
            return entries
        for line in lines:
            line = line.rstrip('\n')
            if not line:
                continue
            m = re.match(r'^(\d{4}-\d{2}-\d{2}T[\d:]+) (\w+) (.*)$', line)
            if m:
                entries.append({'ts': m.group(1), 'level': m.group(2).lower(), 'source': 'server', 'message': m.group(3)})
            else:
                entries.append({'ts': '', 'level': 'info', 'source': 'server', 'message': line})
        return entries[-limit:]

    def _read_main_log(limit):
        entries = []
        try:
            files = sorted(f for f in os.listdir(LOG_DIR) if f.startswith('main-') and f.endswith('.log'))
        except OSError:
            return entries
        for name in files[-2:]:
            try:
                with open(os.path.join(LOG_DIR, name), encoding='utf-8', errors='replace') as fh:
                    lines = fh.readlines()[-limit:]
            except OSError:
                continue
            for line in lines:
                line = line.rstrip('\n')
                if not line:
                    continue
                m = re.match(r'^(\S+) \[(\w+)\] (.*)$', line)
                if m:
                    level = m.group(2).lower()
                    if level == 'log':
                        level = 'info'
                    entries.append({'ts': m.group(1), 'level': level, 'source': 'main', 'message': m.group(3)})
                else:
                    entries.append({'ts': '', 'level': 'info', 'source': 'main', 'message': line})
        return entries[-limit:]

    def _read_client_log(limit):
        entries = []
        try:
            files = sorted(f for f in os.listdir(LOG_DIR) if f.startswith('client-') and f.endswith('.jsonl'))
        except OSError:
            return entries
        for name in files[-3:]:
            try:
                with open(os.path.join(LOG_DIR, name), encoding='utf-8', errors='replace') as fh:
                    for line in fh:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            entry = json.loads(line)
                        except ValueError:
                            continue
                        if isinstance(entry, dict):
                            entry.setdefault('source', 'client')
                            entries.append(entry)
            except OSError:
                continue
        return entries[-limit:]

    def _is_crash_entry(entry):
        level = str(entry.get('level') or '').lower()
        if level in ('critical', 'fatal'):
            return True
        message = str(entry.get('message') or '').lower()
        # Benign media-element noise is not a crash.
        if any(word in message for word in ('no supported sources', 'play() request was interrupted', 'aborterror')):
            return False
        return any(word in message for word in ('uncaughtexception', 'unhandledrejection', 'unhandled: ', 'crash'))

    @app.route('/api/logs')
    def api_logs():
        try:
            limit = int(request.args.get('limit') or 300)
        except ValueError:
            limit = 300
        limit = max(50, min(limit, 2000))
        source = (request.args.get('source') or 'all').lower()
        entries = []
        if source in ('all', 'server'):
            entries += _read_server_log(limit)
        if source in ('all', 'main'):
            entries += _read_main_log(limit)
        if source in ('all', 'client'):
            entries += _read_client_log(limit)
        entries.sort(key=lambda e: str(e.get('ts') or ''))
        error_count = sum(1 for e in entries if str(e.get('level') or '').lower() in ('error', 'critical', 'fatal'))
        crash_count = sum(1 for e in entries if _is_crash_entry(e))
        return jsonify({"success": True, "data": {
            "entries": entries[-limit:],
            "errorCount": error_count,
            "crashCount": crash_count,
            "logDir": LOG_DIR,
            "serverLog": os.path.join(LOG_DIR, 'server.log'),
        }})

    @app.route('/api/logs/client', methods=['POST'])
    def api_logs_client():
        if not _client_log_allow():
            return jsonify({"success": True, "dropped": True})
        payload = request.get_json(silent=True) or {}
        items = payload.get('entries')
        if not isinstance(items, list):
            items = [payload]
        stored = []
        for item in items[:20]:
            if not isinstance(item, dict):
                continue
            entry = log_client_event(
                item.get('level') or 'error',
                item.get('message') or item.get('msg') or '',
                item.get('stack') or '',
                item.get('context') or '',
            )
            stored.append(entry)
        return jsonify({"success": True, "stored": len(stored)})

    @app.route('/api/logs/download')
    def api_logs_download():
        _log_setup()
        buffer = io.BytesIO()
        stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        info_lines = [
            'AirBeats desktop log bundle',
            'generated: ' + datetime.now().isoformat(),
            'python: ' + sys.version.replace('\n', ' '),
            'platform: ' + sys.platform,
            'frozen: ' + str(getattr(sys, 'frozen', False)),
        ]
        try:
            import ytmusicapi
            info_lines.append('ytmusicapi: ' + getattr(ytmusicapi, '__version__', '?'))
        except Exception:
            pass
        safe_settings = dict(_desktop_settings)
        if safe_settings.get('proxy_url'):
            safe_settings['proxy_url'] = '<configured>'
        info_lines.append('settings: ' + json.dumps(safe_settings, ensure_ascii=False))
        info_lines.append('yt auth: ' + ('logged in (' + str((_yt_account_cache or {}).get('handle') or '') + ')' if _yt_auth else 'not logged in'))
        try:
            with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.writestr('info.txt', '\n'.join(info_lines) + '\n')
                try:
                    names = sorted(os.listdir(LOG_DIR))
                except OSError:
                    names = []
                for name in names:
                    if not (name.endswith('.log') or name.endswith('.jsonl')):
                        continue
                    path = os.path.join(LOG_DIR, name)
                    try:
                        if os.path.getsize(path) > 8 * 1024 * 1024:
                            continue
                        zf.write(path, arcname=name)
                    except OSError:
                        continue
        except Exception as e:
            log_event('error', 'log bundle failed: ' + str(e))
            return jsonify({"success": False, "error": str(e)})
        buffer.seek(0)
        return send_file(buffer, mimetype='application/zip', as_attachment=True,
                         download_name='airbeats-logs-' + stamp + '.zip')

    @app.route('/api/logs/clear', methods=['POST'])
    def api_logs_clear():
        payload = request.get_json(silent=True) or {}
        removed = []
        try:
            names = sorted(os.listdir(LOG_DIR))
        except OSError:
            names = []
        for name in names:
            try:
                if name.startswith('client-') and name.endswith('.jsonl'):
                    os.remove(os.path.join(LOG_DIR, name))
                    removed.append(name)
                elif name.startswith('server.log'):
                    with open(os.path.join(LOG_DIR, name), 'w', encoding='utf-8'):
                        pass
                    removed.append(name)
                elif payload.get('main') and name.startswith('main-') and name.endswith('.log'):
                    with open(os.path.join(LOG_DIR, name), 'w', encoding='utf-8'):
                        pass
                    removed.append(name)
            except OSError:
                continue
        log_event('info', 'logs cleared: ' + ', '.join(removed[:10]) if removed else 'logs clear: nothing to remove')
        return jsonify({"success": True, "data": {"removed": removed}})


def install_error_hooks(app):
    _log_setup()
    boot_settings = {k: v for k, v in _desktop_settings.items() if k != 'proxy_url'}
    log_event('info', 'server ready: python ' + sys.version.split()[0] + ', settings=' + json.dumps(boot_settings, ensure_ascii=False))
    try:
        from werkzeug.exceptions import HTTPException
    except Exception:
        HTTPException = None

    @app.errorhandler(Exception)
    def _handle_exception(e):
        if HTTPException is not None and isinstance(e, HTTPException):
            return e
        log_crash('unhandled-request', e)
        return jsonify({"success": False, "error": "internal error"}), 500

    @app.after_request
    def _log_bad_status(resp):
        try:
            if request.path.startswith('/api/'):
                # Local desktop app: never let the renderer reuse stale API data.
                resp.headers['Cache-Control'] = 'no-store'
            if resp.status_code >= 500:
                log_event('error', f'{request.method} {request.path} -> {resp.status_code}')
            elif resp.status_code >= 400:
                if request.path == '/health' or request.path.startswith('/v1/'):
                    pass
                elif not (request.path.startswith('/api/saavn/') and not saavn_enabled()):
                    extra = ''
                    if resp.status_code == 404:
                        ref = request.headers.get('Referer') or ''
                        if ref:
                            extra = ' (ref: ' + ref[:120] + ')'
                    log_event('warning', f'{request.method} {request.path} -> {resp.status_code}{extra}')
        except Exception:
            pass
        return resp

    def _hook_excepthook(exc_type, exc, tb):
        try:
            log_event('critical', 'uncaught: ' + ''.join(traceback.format_exception(exc_type, exc, tb)))
        finally:
            sys.__excepthook__(exc_type, exc, tb)

    sys.excepthook = _hook_excepthook

    try:
        def _thread_hook(args):
            log_event('critical', 'thread ' + str(getattr(args.thread, 'name', '?')) + ' crashed: ' + ''.join(
                traceback.format_exception(args.exc_type, args.exc_value, args.exc_traceback)))
        threading.excepthook = _thread_hook
    except Exception:
        pass

    # Warm the Liked Songs cache ~10s after startup so the page loads instantly.
    try:
        threading.Timer(10.0, _warm_liked_cache).start()
    except Exception:
        pass

    return app
