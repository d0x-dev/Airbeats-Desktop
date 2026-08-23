from ytmusicapi import YTMusic
from yt_dlp import YoutubeDL
import requests
import os
import json
import threading
from flask import request, jsonify, redirect, send_file

yt = YTMusic()

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
    return {
        "id": artist.get("browseId", ""),
        "name": artist.get("artist", artist.get("name", "")),
        "title": artist.get("artist", artist.get("name", "")),
        "subtitle": "Artist",
        "type": "artist",
        "image": [{"quality": "500x500", "url": artist.get("thumbnails", [{"url": "https://via.placeholder.com/150"}])[-1]["url"] if artist.get("thumbnails") else "https://via.placeholder.com/150"}]
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
        "id": playlist.get("browseId", ""),
        "name": playlist.get("title", ""),
        "title": playlist.get("title", ""),
        "subtitle": playlist.get("author", "Playlist"),
        "type": "playlist",
        "image": [{"quality": "500x500", "url": playlist.get("thumbnails", [{"url": "https://via.placeholder.com/150"}])[-1]["url"] if playlist.get("thumbnails") else "https://via.placeholder.com/150"}]
    }

def add_yt_routes(app, get_lyrics_fn):
    @app.route('/api/search/songs')
    def api_search_songs():
        query = request.args.get('query', '')
        if not query:
            return jsonify({"success": False, "data": []})
        
        if query.lower() in ['latest', 'popular', 'trending', 'hits', 'party']:
            try:
                charts = yt.get_charts(country='US')
                # Use trending songs if available, else videos
                items = charts.get('trending', {}).get('items', [])
                if not items:
                    items = charts.get('videos', {}).get('items', [])
                
                # Format them to look like search results
                formatted = []
                for item in items:
                    formatted.append(format_song(item))
                return jsonify({"success": True, "data": {"results": formatted}})
            except Exception:
                results = yt.search(f"{query} popular songs", filter="songs")
        else:
            results = yt.search(query, filter="songs")
        
        formatted = [format_song(s) for s in results]
        return jsonify({"success": True, "data": {"results": formatted}})

    @app.route('/api/search/suggestions')
    def api_search_suggestions():
        query = request.args.get('query', '')
        if not query:
            return jsonify({"success": False, "data": []})
        try:
            results = yt.get_search_suggestions(query)
            return jsonify({"success": True, "data": results})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/search/artists')
    def api_search_artists():
        query = request.args.get('query', '')
        if query.lower() in ['latest', 'popular', 'trending', 'hits', 'party']:
            results = yt.search(f"{query} popular artists", filter="artists")
        else:
            results = yt.search(query, filter="artists")
            
        formatted = [format_artist(a) for a in results]
        return jsonify({"success": True, "data": {"results": formatted}})

    @app.route('/api/search/albums')
    def api_search_albums():
        query = request.args.get('query', '')
        results = yt.search(query, filter="albums")
        formatted = [format_album(a) for a in results]
        return jsonify({"success": True, "data": {"results": formatted}})

    @app.route('/api/search/playlists')
    def api_search_playlists():
        query = request.args.get('query', '')
        results = yt.search(query, filter="playlists")
        formatted = [format_playlist(a) for a in results]
        return jsonify({"success": True, "data": {"results": formatted}})

    @app.route('/api/songs/related')
    def api_songs_related():
        song_id = request.args.get('id', '')
        if not song_id:
            return jsonify({"success": False, "data": []})
        try:
            # get_watch_playlist gets the radio/up next for a song
            watch_playlist = yt.get_watch_playlist(videoId=song_id, limit=20)
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
            return jsonify({"success": True, "data": formatted})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/home')
    def api_home():
        try:
            home_data = yt.get_home(limit=5)
            return jsonify({"success": True, "data": home_data})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/artists')
    def api_artists():
        artist_id = request.args.get('id', '')
        if not artist_id:
            return jsonify({"success": False})
        try:
            artist = yt.get_artist(artist_id)
            
            songs_data = artist.get("songs", {})
            raw_songs = []
            if songs_data.get("browseId"):
                try:
                    playlist = yt.get_playlist(songs_data["browseId"])
                    raw_songs = playlist.get("tracks", [])
                except Exception:
                    raw_songs = songs_data.get("results", []) if isinstance(songs_data, dict) else songs_data
            else:
                raw_songs = songs_data.get("results", []) if isinstance(songs_data, dict) else songs_data
                
            songs = [format_song(s) for s in raw_songs]
            
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
            artist = yt.get_artist(artist_id)
            songs_data = artist.get("songs", {})
            if isinstance(songs_data, dict):
                raw_songs = songs_data.get("results", [])
            else:
                raw_songs = songs_data
            songs = [format_song(s) for s in raw_songs]
            return jsonify({"success": True, "data": {"songs": songs}})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

    @app.route('/api/albums')
    def api_albums():
        album_id = request.args.get('id', '')
        if not album_id:
            return jsonify({"success": False})
        try:
            album = yt.get_album(album_id)
            
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
            playlist = yt.get_playlist(playlist_id)
            
            tracks = []
            for t in playlist.get("tracks", []):
                tracks.append({
                    "id": t.get("videoId"),
                    "name": t.get("title"),
                    "title": t.get("title"),
                    "subtitle": ", ".join([a["name"] for a in t.get("artists", [])]) if t.get("artists") else playlist.get("title"),
                    "image": [{"quality": "500x500", "url": playlist.get("thumbnails", [{"url": ""}])[-1]["url"] if playlist.get("thumbnails") else ""}],
                    "url": "",
                    "downloadUrl": [
                        {"quality": "128kbps", "url": f"/api/play_stream?id={t.get('videoId')}"},
                        {"quality": "320kbps", "url": f"/api/play_stream?id={t.get('videoId')}"}
                    ],
                    "artists": {
                        "primary": [{"name": ", ".join([a["name"] for a in t.get("artists", [])]) if t.get("artists") else playlist.get("title")}]
                    },
                    "duration": t.get("duration_seconds", 0),
                    "album": {"name": playlist.get("title"), "id": playlist_id},
                    "has_lyrics": "true"
                })
                
            data = {
                "id": playlist_id,
                "name": playlist.get("title"),
                "image": [{"quality": "500x500", "url": playlist.get("thumbnails", [{"url": ""}])[-1]["url"] if playlist.get("thumbnails") else ""}],
                "songs": tracks,
                "songCount": playlist.get("trackCount", len(tracks)),
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
                with YoutubeDL({"quiet": True}) as ydl:
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
            res = yt._send_request('browse', {'browseId': 'FEmusic_new_releases_albums'})
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
            ydl_opts = {
                "format": "bestaudio[ext=m4a]/bestaudio",
                "quiet": True
            }
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f"https://youtube.com/watch?v={song_id}", download=False)
                
            return redirect(info["url"])
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

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
                ydl_opts = {
                    "format": "bestaudio[ext=m4a]/bestaudio",
                    "outtmpl": audio_path,
                    "quiet": True,
                    "noplaylist": True,
                }
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
