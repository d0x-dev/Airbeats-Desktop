import requests
from flask import Flask, render_template, Response, request, jsonify
import xml.etree.ElementTree as ET
import re
import math
import random
import uuid
import os
import sys
import time
import json
from datetime import datetime
import zipfile
import sqlite3
import tempfile

# Load .env if it exists (for local development and GitHub Actions secrets)
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k.strip()] = v.strip()


if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

@app.after_request
def add_no_cache_headers(response):
    if 'text/html' in response.headers.get('Content-Type', ''):
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/mobile')
def mobile():
    return render_template('mobile.html')


@app.route('/health')
def health():
    return jsonify({"ok": True, "service": "airbeats-server"})


@app.route('/robots.txt')
def robots():
    return '''User-agent: *
Allow: /
Sitemap: https://airbeats.xyz/sitemap.xml
''', 200, {'Content-Type': 'text/plain'}

@app.route('/sitemap.xml')
def sitemap():
    xml = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://airbeats.xyz/</loc>
    <lastmod>2026-06-30</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>'''
    return xml, 200, {'Content-Type': 'application/xml'}


# Simple cache to avoid re-fetching the same mp4 url multiple times
stream_cache = {}


@app.route('/api/shuffle', methods=['POST'])
def shuffle_queue():
    try:
        data = request.json
        tracks = data.get('tracks', [])
        if tracks:
            random.shuffle(tracks)
        return jsonify({'success': True, 'shuffled': tracks})
    except Exception as e:
        print('Shuffle Error:', e)
        return jsonify({'success': False, 'shuffled': []}), 500


# ==================== DEVELOPER NEWS (FIREBASE RTDB) ====================

@app.route('/api/developer_news', methods=['GET'])
def api_developer_news():
    try:
        url = "https://airbeats-54c06-default-rtdb.firebaseio.com/developer_news.json"
        headers = {"User-Agent": "AirBeats-Desktop/1.0", "Cache-Control": "no-cache"}
        res = requests.get(url, headers=headers, timeout=10)
        if res.ok:
            data = res.json() or {}
            items = []
            for k, obj in data.items():
                if not isinstance(obj, dict):
                    continue
                is_active = obj.get("active", obj.get("isActive", True))
                if is_active:
                    items.append({
                        "id": obj.get("id", k),
                        "title": obj.get("title", ""),
                        "message": obj.get("message", ""),
                        "author": obj.get("author") or obj.get("authorName") or "Developer",
                        "imageUrl": obj.get("imageUrl") or "",
                        "actionUrl": obj.get("actionUrl") or "",
                        "actionText": obj.get("actionText") or "",
                        "tag": obj.get("tag") or "Announcement",
                        "timestamp": int(obj.get("timestamp", int(time.time() * 1000))),
                        "showPopup": bool(obj.get("showPopup", False)),
                        "priority": int(obj.get("priority", 0)),
                        "active": True
                    })
            items.sort(key=lambda x: (x["priority"], x["timestamp"]), reverse=True)
            return jsonify(items)
    except Exception as e:
        print("[DEV NEWS] Fetch error:", e)
    return jsonify([]), 500


# ==================== ANDROID .BACKUP RESTORE SYSTEM ====================

@app.route('/api/restore_backup', methods=['POST'])
@app.route('/api/stats/restore_backup', methods=['POST'])
def restore_backup():
    """Restores Android AirBeats .backup or .zip file containing music.db and airbeats_global_stats.xml, or JSON backups"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Empty file"}), 400
            
        with tempfile.TemporaryDirectory() as temp_dir:
            zip_path = os.path.join(temp_dir, 'backup.zip')
            file.save(zip_path)
            
            history = []
            favorites = []
            playlists = []
            stats_events = []
            
            try:
                with zipfile.ZipFile(zip_path, 'r') as zf:
                    zf.extractall(temp_dir)
            except zipfile.BadZipFile:
                # Check if the uploaded file is a raw JSON backup file (.json or renamed to .backup)
                try:
                    with open(zip_path, 'r', encoding='utf-8') as jf:
                        jdata = json.load(jf)
                        if isinstance(jdata, dict):
                            return jsonify({
                                "success": True,
                                "history": jdata.get('recentlyPlayed', []),
                                "favoriteSongs": jdata.get('favoriteSongs', []),
                                "playlists": jdata.get('user_playlists', []),
                                "statsEvents": jdata.get('statsEvents', [])
                            })
                except Exception:
                    pass
                return jsonify({"error": "Invalid backup file format. Must be a valid .backup, .zip, or .json file."}), 400
                
            # Locate sqlite database file within the extracted archive
            db_path = None
            for root, dirs, files in os.walk(temp_dir):
                for f in files:
                    if f.lower() == 'music.db':
                        db_path = os.path.join(root, f)
                        break
                if db_path:
                    break

            if not db_path:
                for root, dirs, files in os.walk(temp_dir):
                    for f in files:
                        if f.lower().endswith('.db') or f.lower().endswith('.sqlite'):
                            db_path = os.path.join(root, f)
                            break
                    if db_path:
                        break

            # If no SQLite database found, check for JSON backup inside the archive
            if not db_path:
                for root, dirs, files in os.walk(temp_dir):
                    for f in files:
                        if f.lower().endswith('.json'):
                            try:
                                with open(os.path.join(root, f), 'r', encoding='utf-8') as jf:
                                    jdata = json.load(jf)
                                    if isinstance(jdata, dict):
                                        history = jdata.get('recentlyPlayed', []) or history
                                        favorites = jdata.get('favoriteSongs', []) or favorites
                                        playlists = jdata.get('user_playlists', []) or playlists
                                        stats_events = jdata.get('statsEvents', []) or stats_events
                                        break
                            except Exception as ej:
                                print(f"[BACKUP] JSON parse notice: {ej}")
                    if history or favorites or playlists or stats_events:
                        break

            if db_path and os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    
                    # Inspect tables
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                    tables = {r[0].lower() for r in cursor.fetchall()}

                    has_song = 'song' in tables
                    s_cols = []
                    if has_song:
                        cursor.execute("PRAGMA table_info(song);")
                        s_cols = [c[1] for c in cursor.fetchall()]
                    
                    has_song_thumb = 'thumbnailUrl' in s_cols
                    song_thumb_expr = "s.thumbnailUrl" if has_song_thumb else "NULL"

                    has_artist = 'artist' in tables
                    a_cols = []
                    if has_artist:
                        cursor.execute("PRAGMA table_info(artist);")
                        a_cols = [c[1] for c in cursor.fetchall()]

                    has_art_thumb = 'thumbnailUrl' in a_cols
                    art_thumb_expr = "a.thumbnailUrl" if has_art_thumb else "NULL"

                    has_sam = 'song_artist_map' in tables
                    sam_join = "LEFT JOIN song_artist_map sam ON s.id = sam.songId AND sam.position = 0 LEFT JOIN artist a ON sam.artistId = a.id" if (has_sam and has_artist) else ""
                    art_id_col = "a.id" if (has_sam and has_artist) else "NULL"
                    art_name_col = "a.name" if (has_sam and has_artist) else ("s.artist" if 'artist' in s_cols else "NULL")
                    art_thumb_col = art_thumb_expr if (has_sam and has_artist) else "NULL"

                    # 1. Query History from event joined with song & artist
                    if 'event' in tables and has_song:
                        try:
                            query = f"""
                            SELECT 
                                s.id, 
                                s.title, 
                                s.duration,
                                {song_thumb_expr} as thumbnailUrl,
                                {art_id_col} as artistId,
                                {art_name_col} as artistName,
                                {art_thumb_col} as artistThumbnailUrl,
                                e.timestamp
                            FROM event e
                            JOIN song s ON e.songId = s.id
                            {sam_join}
                            ORDER BY e.timestamp DESC
                            LIMIT 200
                            """
                            cursor.execute(query)
                            for row in cursor.fetchall():
                                song_id, title, duration, thumb, artist_id, artist_name, art_thumb, timestamp = row
                                song_img = thumb if (thumb and "ui-avatars" not in thumb) else (f"https://i.ytimg.com/vi/{song_id}/hqdefault.jpg" if song_id else "")
                                history.append({
                                    "id": song_id,
                                    "name": title,
                                    "title": title,
                                    "artist": artist_name or "Unknown Artist",
                                    "subtitle": artist_name or "Unknown Artist",
                                    "type": "song",
                                    "image": song_img,
                                    "artistIds": artist_id or "",
                                    "artistImage": art_thumb if (art_thumb and "ui-avatars" not in art_thumb) else "",
                                    "playedAt": timestamp
                                })
                        except Exception as e_hist:
                            print(f"[BACKUP] History parse notice: {e_hist}")

                    # 2. Query Favorites
                    if has_song:
                        try:
                            fav_where = None
                            if 'inLibrary' in s_cols:
                                fav_where = "s.inLibrary = 1"
                            elif 'favorite' in s_cols:
                                fav_where = "s.favorite = 1"
                            elif 'isFavorite' in s_cols:
                                fav_where = "s.isFavorite = 1"
                            elif 'liked' in s_cols:
                                fav_where = "s.liked = 1"
                            
                            if fav_where:
                                cursor.execute(f"""
                                    SELECT s.id, s.title, s.duration, {art_name_col}, {song_thumb_expr}
                                    FROM song s
                                    {sam_join}
                                    WHERE {fav_where}
                                    ORDER BY s.id DESC
                                """)
                                for f_row in cursor.fetchall():
                                    s_id = f_row[0]
                                    f_thumb = f_row[4]
                                    f_img = f_thumb if (f_thumb and "ui-avatars" not in f_thumb) else (f"https://i.ytimg.com/vi/{s_id}/hqdefault.jpg" if s_id else "")
                                    favorites.append({
                                        "id": s_id,
                                        "name": f_row[1],
                                        "title": f_row[1],
                                        "artist": f_row[3] or "Unknown Artist",
                                        "duration": f_row[2] or 0,
                                        "image": f_img
                                    })
                        except Exception as e_fav:
                            print(f"[BACKUP] Favorites parse notice: {e_fav}")

                    # 3. Query Playlists
                    if 'playlist' in tables and has_song:
                        try:
                            cursor.execute("SELECT id, title FROM playlist;")
                            p_rows = cursor.fetchall()
                            
                            has_psm = 'playlist_song_map' in tables
                            
                            for pid, ptitle in p_rows:
                                songs = []
                                if has_psm:
                                    cursor.execute(f"""
                                        SELECT s.id, s.title, s.duration, {art_name_col}, {song_thumb_expr}
                                        FROM playlist_song_map psm
                                        JOIN song s ON psm.songId = s.id
                                        {sam_join}
                                        WHERE psm.playlistId = ?
                                        ORDER BY psm.position ASC
                                    """, (pid,))
                                    for s_row in cursor.fetchall():
                                        ps_id = s_row[0]
                                        ps_thumb = s_row[4]
                                        ps_img = ps_thumb if (ps_thumb and "ui-avatars" not in ps_thumb) else (f"https://i.ytimg.com/vi/{ps_id}/hqdefault.jpg" if ps_id else "")
                                        songs.append({
                                            "id": ps_id,
                                            "name": s_row[1],
                                            "title": s_row[1],
                                            "artist": s_row[3] or "Unknown Artist",
                                            "duration": s_row[2] or 0,
                                            "image": ps_img
                                        })
                                playlists.append({
                                    "id": f"pl_{pid}",
                                    "name": ptitle,
                                    "title": ptitle,
                                    "songs": songs
                                })
                        except Exception as e_pl:
                            print(f"[BACKUP] Playlists parse notice: {e_pl}")

                    # 4. Query Listening Events for Stats Engine
                    if 'event' in tables and has_song:
                        try:
                            cursor.execute("PRAGMA table_info(event);")
                            e_cols = [c[1] for c in cursor.fetchall()]

                            has_play_time = 'playTime' in e_cols
                            has_album_id = 'albumId' in s_cols
                            has_album_name = 'albumName' in s_cols

                            play_time_expr = "e.playTime" if has_play_time else "COALESCE(s.duration * 1000, 180000)"
                            album_id_expr = "s.albumId" if has_album_id else "NULL"
                            album_name_expr = "s.albumName" if has_album_name else "NULL"

                            events_query = f"""
                            SELECT 
                                e.songId,
                                s.title,
                                s.duration,
                                {song_thumb_expr} as thumbnailUrl,
                                {album_id_expr} as albumId,
                                {album_name_expr} as albumName,
                                {art_id_col} as artistId,
                                {art_name_col} as artistName,
                                {art_thumb_col} as artistThumbnailUrl,
                                e.timestamp,
                                {play_time_expr} as playTime
                            FROM event e
                            JOIN song s ON e.songId = s.id
                            {sam_join}
                            ORDER BY e.timestamp DESC
                            """
                            cursor.execute(events_query)
                            for ev_row in cursor.fetchall():
                                song_id, title, duration, thumb, alb_id, alb_name, art_id, art_name, art_thumb, t_stamp, p_time = ev_row
                                song_img = thumb if (thumb and "ui-avatars" not in thumb) else (f"https://i.ytimg.com/vi/{song_id}/hqdefault.jpg" if song_id else "")
                                stats_events.append({
                                    "songId": song_id,
                                    "title": title or "Unknown Track",
                                    "artist": art_name or "Unknown Artist",
                                    "artistId": art_id or "",
                                    "artistImage": art_thumb if (art_thumb and "ui-avatars" not in art_thumb) else "",
                                    "album": alb_name or "",
                                    "albumId": alb_id or "",
                                    "image": song_img,
                                    "duration": duration or 0,
                                    "timeListenedMs": int(p_time if p_time is not None else (duration * 1000 if duration else 180000)),
                                    "timestamp": t_stamp
                                })
                        except Exception as e_ev:
                            print(f"[BACKUP] Stats events parse notice: {e_ev}")
                        
                    conn.close()
                except Exception as e_db:
                    print(f"[BACKUP] SQLite connection error: {e_db}")

            # If stats_events is empty but history has songs, seed stats_events from history
            if not stats_events and history:
                now_ts = time.time()
                for idx, h in enumerate(history):
                    stats_events.append({
                        "songId": h.get("id", ""),
                        "title": h.get("title") or h.get("name") or "Unknown Track",
                        "artist": h.get("artist") or "Unknown Artist",
                        "artistId": h.get("artistIds") or "",
                        "artistImage": h.get("artistImage") or "",
                        "album": "",
                        "albumId": "",
                        "image": h.get("image") or "",
                        "duration": h.get("duration") or 0,
                        "timeListenedMs": int((h.get("duration") or 180) * 1000),
                        "timestamp": h.get("playedAt") or datetime.utcfromtimestamp(now_ts - (idx * 300)).isoformat()
                    })

            return jsonify({
                "success": True,
                "history": history,
                "favoriteSongs": favorites,
                "playlists": playlists,
                "statsEvents": stats_events
            })
    except Exception as e:
        print("[BACKUP] Restore exception:", e)
        return jsonify({"error": str(e)}), 500


# ==================== LYRICS SYSTEM ====================

def parse_time_ms(time_str):
    if not time_str:
        return 0
    if ':' not in time_str:
        return int(float(time_str) * 1000)
    parts = time_str.split(':')
    seconds = 0
    if len(parts) == 3:
        seconds = float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
    elif len(parts) == 2:
        seconds = float(parts[0]) * 60 + float(parts[1])
    return int(seconds * 1000)

def parse_ttml(xml_string):
    try:
        root = ET.fromstring(xml_string)
        # Handle namespaces if any
        ns = {'tt': 'http://www.w3.org/ns/ttml'}
        body = root.find('.//body') or root.find('.//{http://www.w3.org/ns/ttml}body')
        if body is None: body = root
        
        parsed_lines = []
        p_tags = root.findall('.//p') or root.findall('.//{http://www.w3.org/ns/ttml}p')
        
        for p in p_tags:
            line_begin = parse_time_ms(p.get('begin'))
            line_end = parse_time_ms(p.get('end'))
            
            words = []
            spans = p.findall('.//span') or p.findall('.//{http://www.w3.org/ns/ttml}span')
            
            for span in spans:
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
                    
            parsed_lines.append({
                'begin': line_begin,
                'end': line_end,
                'words': words,
                'rawText': ''.join(p.itertext()).strip()
            })
            
        return parsed_lines
    except Exception as e:
        print("TTML Parse Error:", e)
        return []

def parse_lrc(lrc_string):
    lines = lrc_string.split('\n')
    parsed_lines = []
    time_regex = re.compile(r'\[(\d{2}):(\d{2}\.\d{2,3})\]')
    
    for line in lines:
        match = time_regex.search(line)
        if match:
            minutes = int(match.group(1))
            seconds = float(match.group(2))
            begin_ms = int((minutes * 60 + seconds) * 1000)
            text = time_regex.sub('', line).strip()
            parsed_lines.append({
                'begin': begin_ms,
                'end': 0,
                'words': [],
                'rawText': text
            })
            
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

import lyrics_engine

def get_lyrics():
    song_name = request.args.get('s', '').strip()
    artist_name = request.args.get('a', '').strip()
    duration_str = request.args.get('d', '0')
    duration = int(float(duration_str)) if duration_str and duration_str.replace('.', '', 1).isdigit() else 0
    video_id = request.args.get('vid') or request.args.get('song_id') or ''
    album = request.args.get('album', '')
    provider = request.args.get('provider')
    preferred = request.args.get('preferred') or (backend.setting('lyrics_preferred') or None)
    format_type = request.args.get('format', '')

    yt_inst = getattr(backend, 'yt', None)

    if provider:
        raw, is_synced = lyrics_engine.fetch_from_provider(
            provider, song_name, artist_name, duration, video_id, album, yt_inst
        )
        if raw:
            parsed = lyrics_engine.parse_any_lyrics(raw, duration)
            if parsed:
                if format_type == 'array':
                    return jsonify(parsed)
                return jsonify({
                    "success": True,
                    "provider": lyrics_engine.PROVIDER_NAMES.get(provider.lower(), provider),
                    "provider_key": provider.lower(),
                    "is_synced": is_synced,
                    "raw": raw,
                    "parsed": parsed
                })
        return jsonify({"error": f"Lyrics not found on provider '{provider}'."}), 404

    res = lyrics_engine.get_lyrics_unified(
        song_name, artist_name, duration, video_id, album, preferred, yt_inst,
        disabled=backend.setting('lyrics_disabled')
    )
    if res.get('success'):
        if format_type == 'array':
            return jsonify(res['parsed'])
        return jsonify(res)

    return jsonify({"error": "No synchronized lyrics found."}), 404

import backend
backend.add_yt_routes(app, get_lyrics)
backend.install_error_hooks(app)

@app.route('/api/lyrics/providers')
def api_lyrics_providers():
    providers_list = [
        {"key": "lrclib", "name": "LRC Lib", "icon": "fa-music", "desc": "Community synchronized LRC database"},
        {"key": "kugou", "name": "KuGou", "icon": "fa-headphones-alt", "desc": "KuGou music synchronized lyrics"},
        {"key": "simpmusic", "name": "SimpMusic", "icon": "fa-compact-disc", "desc": "SimpMusic synchronized lyrics API"},
        {"key": "unison", "name": "Unison", "icon": "fa-wave-square", "desc": "Unison database search & video matcher"},
        {"key": "youly", "name": "YouLyPlus", "icon": "fa-star", "desc": "YouLyPlus TTML & LRC mirror network"},
        {"key": "megalobiz", "name": "Megalobiz", "icon": "fa-globe", "desc": "Megalobiz community LRC search"},
        {"key": "paxsenix", "name": "Paxsenix (Multi-Source)", "icon": "fa-layer-group", "desc": "Spotify, Musixmatch & Apple Music aggregator"},
        {"key": "portato", "name": "BetterLyrics (Portato)", "icon": "fa-file-audio", "desc": "Portato lyrics mirror"},
        {"key": "betterlyrics", "name": "BetterLyrics", "icon": "fa-align-left", "desc": "High-fidelity TTML syllable sync"},
        {"key": "youtube_subtitles", "name": "YouTube subtitles", "icon": "fa-closed-captioning", "desc": "Timed video subtitles and captions"},
        {"key": "youtube_music", "name": "YouTube Music", "icon": "fa-play-circle", "desc": "Official YouTube Music lyrics"}
    ]
    return jsonify({"success": True, "providers": providers_list})

@app.route('/api/lyrics/search')
def api_lyrics_search():
    song_name = request.args.get('s', '').strip()
    artist_name = request.args.get('a', '').strip()
    duration_str = request.args.get('d', '0')
    duration = int(float(duration_str)) if duration_str and duration_str.replace('.', '', 1).isdigit() else 0
    video_id = request.args.get('vid') or request.args.get('song_id') or ''
    album = request.args.get('album', '')
    yt_inst = getattr(backend, 'yt', None)

    results = lyrics_engine.search_lyrics_all_providers(
        song_name, artist_name, duration, video_id, album, yt_inst,
        disabled=backend.setting('lyrics_disabled')
    )
    return jsonify({"success": True, "results": results})

@app.route('/api/lyrics/translate', methods=['POST'])
def api_lyrics_translate():
    data = request.get_json(silent=True) or {}
    lines = data.get('lines', [])
    target_code = data.get('target_language_code', 'hi-Latn')
    target_name = data.get('target_language_name')
    api_key = data.get('api_key', '')
    base_url = data.get('base_url', '')
    model = data.get('model', '')
    mode = data.get('mode', 'Literal')
    custom_prompt = data.get('custom_prompt')
    provider = data.get('provider', 'OpenRouter')

    result = lyrics_engine.translate_lyrics_ai(
        lines=lines,
        target_language_code=target_code,
        target_language_name=target_name,
        api_key=api_key,
        base_url=base_url,
        model=model,
        mode=mode,
        custom_prompt=custom_prompt,
        provider=provider
    )
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 400

def _pick_port(preferred=8000, tries=25):
    """Return the first free TCP port at or after `preferred`.

    Port 8000 is hardcoded in the Electron wrapper. If something else already
    owns it -- a leftover airbeats instance, a dev webserver, another app -- the
    server used to die with an opaque "Address already in use" traceback and the
    UI just showed a blank window. Walk forward until we find a free port and
    publish it so the wrapper can pick it up.
    """
    import socket
    for port in range(preferred, preferred + tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    raise RuntimeError(
        f"No free port in range {preferred}-{preferred + tries - 1}"
    )


def _publish_port(port):
    """Write the chosen port where the Electron wrapper can find it."""
    candidates = []

    # packaged: sys._MEIPASS (temp, not writable). fallbacks below.
    meipass = getattr(sys, '_MEIPASS', None)
    if meipass:
        candidates.append(os.path.join(meipass, 'port.txt'))

    # Source checkout: next to this file.
    try:
        here = os.path.dirname(os.path.abspath(__file__))
        candidates.append(os.path.join(here, 'port.txt'))
    except NameError:
        pass

    # Packaged: next to the real executable (writable, survives the run).
    try:
        exe_dir = os.path.dirname(os.path.abspath(sys.executable))
        candidates.append(os.path.join(exe_dir, 'port.txt'))
    except Exception:
        pass

    for path in candidates:
        try:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(str(port))
            return path
        except OSError:
            continue
    return None


if __name__ == '__main__':
    host = os.environ.get('HOST', '0.0.0.0')
    env_port = os.environ.get('PORT')
    if env_port:
        PORT = int(env_port)
    else:
        try:
            PORT = _pick_port()
        except RuntimeError as exc:
            print(f"AirBeats server: {exc}", file=sys.stderr)
            sys.exit(1)

    written = _publish_port(PORT)
    if PORT != 8000 and not env_port:
        print(f"Port 8000 was busy, using {PORT} instead.", file=sys.stderr)
    print(f"Server started at http://{host}:{PORT}", flush=True)
    if written:
        print(f"Port published to {written}", flush=True)
    app.run(host=host, port=PORT, debug=False, threaded=True)

