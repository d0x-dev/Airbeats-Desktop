import requests
from flask import Flask, render_template, Response, request, jsonify
import xml.etree.ElementTree as ET
import re
import math
import random
import uuid

import os
import sys

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/mobile')
def mobile():
    return render_template('mobile.html')


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


import time

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

# ==================== STATS CLOUD SYSTEM ====================
# Mirrors Android's AirBeatsStatsCloudClient.kt exactly
# ==================== SECURE SERVER-SIDE STATS CLOUD SYSTEM ====================
# Connects to the same database as the Android app (database.ispro.in)
# Zero database credentials or heavy business logic are exposed to the client.

STATS_BASE_URL = os.environ.get("STATS_BASE_URL", "https://database.airbeats.app")
STATS_API_KEY = os.environ.get("STATS_API_KEY", "DEFAULT_DEV_KEY")
GLOBAL_STATS_FILE = os.environ.get("GLOBAL_STATS_FILE", "airbeats/global_stats.json")
FCM_STATS_FILE = os.environ.get("FCM_STATS_FILE", "airbeats/fcm.json")
MAX_GLOBAL_USERS = int(os.environ.get("MAX_GLOBAL_USERS", 10000000))

RANK_DEFINITIONS = [
    {"name": "Echo", "thresholdHours": 1, "colors": ["#00F2FE", "#4FACFE"]},
    {"name": "Pulse", "thresholdHours": 5, "colors": ["#00FF87", "#60EFFF"]},
    {"name": "Bronze", "thresholdHours": 10, "colors": ["#CA7345", "#EAA17C"]},
    {"name": "Silver", "thresholdHours": 20, "colors": ["#BDC3C7", "#E5E9F0"]},
    {"name": "Gold", "thresholdHours": 35, "colors": ["#FFD700", "#FFA500"]},
    {"name": "Platinum", "thresholdHours": 50, "colors": ["#E5E9F0", "#B0C4DE"]},
    {"name": "Diamond", "thresholdHours": 75, "colors": ["#00F2FE", "#9B51E0"]},
    {"name": "Elite", "thresholdHours": 100, "colors": ["#8E2DE2", "#4A00E0"]},
    {"name": "Master", "thresholdHours": 150, "colors": ["#FF007F", "#FF5E62"]},
    {"name": "Legend", "thresholdHours": 250, "colors": ["#F12711", "#F5AF19"]},
    {"name": "Mythic", "thresholdHours": 400, "colors": ["#0575E6", "#00F260"]},
    {"name": "Immortal", "thresholdHours": 600, "colors": ["#1F1C2C", "#928DAB"]},
    {"name": "Cosmic", "thresholdHours": 1000, "colors": ["#1A1A2E", "#E94560"]},
    {"name": "Nova", "thresholdHours": 1500, "colors": ["#FF416C", "#FF4B2B"]},
    {"name": "Celestial", "thresholdHours": 2500, "colors": ["#7F00FF", "#E100FF"]},
    {"name": "Godlike", "thresholdHours": 4000, "colors": ["#FF007F", "#FFD700", "#00F2FE"]},
    {"name": "Universal", "thresholdHours": 6000, "colors": ["#00C6FF", "#0072FF"]},
    {"name": "Eternal", "thresholdHours": 10000, "colors": ["#8A2387", "#E94057", "#F27121"]},
]

DICEBEAR_STYLES = [
    "adventurer", "avataaars", "big-ears", "bottts", "fun-emoji", 
    "lorelei", "micah", "miniavs", "open-peeps", "personas", "pixel-art", "shapes"
]

def read_stats_board(file_name=GLOBAL_STATS_FILE):
    """Read the global stats board from cloud (mirrors Android readBoard)"""
    try:
        url = f"{STATS_BASE_URL}/read?file={file_name}&_t={int(time.time() * 1000)}"
        headers = {'Cache-Control': 'no-cache', 'Pragma': 'no-cache'}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 404:
            return {"users": [], "updatedAt": 0}
        data = res.json()
        board = data.get("data", data)
        users = board.get("users", [])
        # Normalize user fields
        normalized = []
        for u in users:
            uid = u.get("id") or u.get("uuid", "")
            if not uid:
                continue
            profile_url = u.get("profileUrl")
            if profile_url and (not profile_url.strip() or profile_url.lower() == "null"):
                profile_url = None
            normalized.append({
                "id": uid,
                "name": u.get("name", "AirBeats User"),
                "profileUrl": profile_url,
                "totalListenMs": u.get("totalListenMs") or u.get("listenTime", 0),
                "weeklyListenMs": u.get("weeklyListenMs", 0),
                "lastUpdatedAt": u.get("lastUpdatedAt", 0),
                "rank": u.get("rank", 0),
            })
        normalized.sort(key=lambda x: x["totalListenMs"], reverse=True)
        normalized = normalized[:MAX_GLOBAL_USERS]
        for i, u in enumerate(normalized):
            u["rank"] = i + 1
        return {"users": normalized, "updatedAt": board.get("updatedAt", 0)}
    except Exception as e:
        print(f"[STATS] Error reading board: {e}")
        return {"users": [], "updatedAt": 0}

def write_stats_board(file_name, board_json):
    """Write the stats board to cloud (mirrors Android writeBoard)"""
    try:
        url = f"{STATS_BASE_URL}/write?file={file_name}"
        headers = {
            'X-API-Key': STATS_API_KEY,
            'Content-Type': 'application/json'
        }
        res = requests.post(url, json=board_json, headers=headers, timeout=10)
        if not res.ok:
            print(f"[STATS] Write error: {res.status_code} {res.text[:200]}")
            return False
        return True
    except Exception as e:
        print(f"[STATS] Write exception: {e}")
        return False

def get_rank_from_hours(hours):
    """Get the active rank object based on listened hours"""
    active_rank = None
    for r in RANK_DEFINITIONS:
        if hours >= r["thresholdHours"]:
            active_rank = r
    return active_rank

def get_next_rank(current_rank):
    """Get the next rank object"""
    if not current_rank:
        return RANK_DEFINITIONS[0]
    try:
        idx = RANK_DEFINITIONS.index(current_rank)
        if idx < len(RANK_DEFINITIONS) - 1:
            return RANK_DEFINITIONS[idx + 1]
    except ValueError:
        pass
    return None

def format_hours_string(ms):
    """Format milliseconds into a user-friendly hours string"""
    hours = ms / 3600000.0
    if hours >= 10:
        return f"{int(hours)}h"
    elif hours >= 1.0:
        return f"{hours:.1f}h"
    else:
        mins = ms / 60000.0
        return f"{int(mins)}m" if mins >= 1.0 else "0m"

def get_badge_html(rank, size_px=22):
    """Generate CSS-drawn badge HTML representing a rank"""
    if not rank:
        return ""
    colors = rank["colors"]
    gradient = ", ".join(colors)
    if len(colors) > 2:
        bg_style = f"linear-gradient(135deg, {gradient})"
    else:
        bg_style = f"linear-gradient(135deg, {colors[0]}, {colors[1]})"
    return f'<span class="rank-badge" style="width:{size_px}px; height:{size_px}px; background:{bg_style}; display:inline-block; border-radius:50%; border:2px solid rgba(0,0,0,0.4); box-shadow:0 0 8px {colors[0]}88;" title="{rank["name"]}"></span>'

@app.route('/api/stats/onboard', methods=['POST'])
def stats_onboard():
    """Onboards a new user, generating UUID and profile avatar"""
    try:
        data = request.json or {}
        name = data.get('name', '').strip()
        style = data.get('style', 'shapes')
        seed = data.get('seed', '')
        
        if not name:
            return jsonify({"error": "Name is required"}), 400
        if style not in DICEBEAR_STYLES:
            style = "shapes"
        if not seed:
            seed = str(uuid.uuid4())[:8]

        user_id = str(uuid.uuid4())
        avatar_url = f"https://api.dicebear.com/7.x/{style}/png?seed={seed}&size=200"

        # Register immediately in cloud stats with 0 time
        board = read_stats_board(GLOBAL_STATS_FILE)
        fcm_board = read_stats_board(FCM_STATS_FILE)
        now = int(time.time() * 1000)

        # Append new user to global list
        users_list = [u for u in board["users"] if u["id"] != user_id]
        users_list.append({
            "id": user_id,
            "name": name,
            "profileUrl": avatar_url,
            "totalListenMs": 0,
            "weeklyListenMs": 0,
            "lastUpdatedAt": now,
            "rank": len(users_list) + 1,
        })
        global_json = {
            "service": "AirBeats Global Stats",
            "folder": "airbeats",
            "updatedAt": now,
            "users": users_list
        }
        write_stats_board(GLOBAL_STATS_FILE, global_json)

        return jsonify({
            "success": True,
            "userId": user_id,
            "name": name,
            "profileUrl": avatar_url
        })
    except Exception as e:
        print("[STATS] Onboarding error:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats/listen', methods=['POST'])
def stats_listen():
    """Accumulates user listen duration on the backend, updating the cloud DB directly"""
    try:
        data = request.json or {}
        user_id = data.get('userId', '')
        name = data.get('name', 'AirBeats User')
        profile_url = data.get('profileUrl')
        delta_ms = max(data.get('deltaMs', 0), 0)

        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        # Read current cloud board
        board = read_stats_board(GLOBAL_STATS_FILE)
        fcm_board = read_stats_board(FCM_STATS_FILE)
        now = int(time.time() * 1000)

        # Find existing user info
        user_obj = next((u for u in board["users"] if u["id"] == user_id), None)
        
        client_total_ms = data.get('totalListenMs', -1)
        if client_total_ms == -1:
            client_total_ms = data.get('listenTime', -1)

        old_total = user_obj["totalListenMs"] if user_obj else 0
        old_weekly = user_obj["weeklyListenMs"] if user_obj else 0
        
        # 2-Way Sync logic: if client has more than cloud (or cloud more than client)
        # we always take the maximum to prevent losing listen time (downgrades).
        true_total = max(old_total, client_total_ms) if client_total_ms >= 0 else old_total
        
        new_total = true_total + delta_ms
        new_weekly = old_weekly + delta_ms

        # Calculate ranks
        old_hours = old_total / 3600000.0
        new_hours = new_total / 3600000.0
        
        old_rank = get_rank_from_hours(old_hours)
        new_rank = get_rank_from_hours(new_hours)

        rank_up = False
        if new_rank and (not old_rank or new_rank["name"] != old_rank["name"]):
            rank_up = True

        # Re-build users lists with updated user
        updated_users = [u for u in board["users"] if u["id"] != user_id]
        updated_users.append({
            "id": user_id,
            "name": name,
            "profileUrl": profile_url,
            "totalListenMs": new_total,
            "weeklyListenMs": new_weekly,
            "lastUpdatedAt": now,
            "rank": 0
        })
        updated_users.sort(key=lambda x: x["totalListenMs"], reverse=True)
        updated_users = updated_users[:MAX_GLOBAL_USERS]
        for i, u in enumerate(updated_users):
            u["rank"] = i + 1

        user_global_rank = next((u["rank"] for u in updated_users if u["id"] == user_id), 999)

        # Update FCM board
        fcm_users = [u for u in fcm_board["users"] if u["id"] != user_id]
        fcm_users.append({
            "id": user_id,
            "name": name,
            "profileUrl": None,
            "totalListenMs": new_total,
            "weeklyListenMs": 0,
            "lastUpdatedAt": now,
            "rank": user_global_rank,
        })
        fcm_users.sort(key=lambda x: x["totalListenMs"], reverse=True)
        fcm_users = fcm_users[:MAX_GLOBAL_USERS]

        global_json = {
            "service": "AirBeats Global Stats",
            "folder": "airbeats",
            "updatedAt": now,
            "users": updated_users
        }
        fcm_json = {
            "service": "AirBeats FCM Stats",
            "folder": "airbeats",
            "updatedAt": now,
            "users": [{
                "uuid": u["id"],
                "name": u["name"],
                "fcmToken": None,
                "listenTime": u["totalListenMs"],
                "rank": u["rank"],
            } for u in fcm_users]
        }

        # Write to cloud
        write_stats_board(GLOBAL_STATS_FILE, global_json)
        write_stats_board(FCM_STATS_FILE, fcm_json)

        return jsonify({
            "success": True,
            "totalListenMs": new_total,
            "weeklyListenMs": new_weekly,
            "rankUp": rank_up,
            "newRank": new_rank if rank_up else None
        })
    except Exception as e:
        print("[STATS] Listen tracking error:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats/update_profile', methods=['POST'])
def stats_update_profile():
    """Allows user to edit name/avatar on profile and syncs back to cloud"""
    try:
        data = request.json or {}
        user_id = data.get('userId', '')
        name = data.get('name', '').strip()
        profile_url = data.get('profileUrl', '').strip()

        if not user_id or not name:
            return jsonify({"error": "Missing params"}), 400

        board = read_stats_board(GLOBAL_STATS_FILE)
        now = int(time.time() * 1000)

        user_obj = next((u for u in board["users"] if u["id"] == user_id), None)
        if user_obj:
            user_obj["name"] = name
            if profile_url:
                user_obj["profileUrl"] = profile_url
            user_obj["lastUpdatedAt"] = now
        else:
            board["users"].append({
                "id": user_id,
                "name": name,
                "profileUrl": profile_url,
                "totalListenMs": 0,
                "weeklyListenMs": 0,
                "lastUpdatedAt": now,
                "rank": 0
            })
            
        board["users"].sort(key=lambda x: x["totalListenMs"], reverse=True)
        for i, u in enumerate(board["users"]):
            u["rank"] = i + 1
        
        global_json = {
            "service": "AirBeats Global Stats",
            "folder": "airbeats",
            "updatedAt": now,
            "users": board["users"]
        }
        write_stats_board(GLOBAL_STATS_FILE, global_json)

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

import zipfile
import sqlite3
import tempfile
import os

@app.route('/api/stats/restore_backup', methods=['POST'])
def stats_restore_backup():
    """Restores Android .bin backup file"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Empty file"}), 400
            
        with tempfile.TemporaryDirectory() as temp_dir:
            zip_path = os.path.join(temp_dir, 'backup.bin')
            file.save(zip_path)
            
            try:
                with zipfile.ZipFile(zip_path, 'r') as zf:
                    zf.extractall(temp_dir)
            except zipfile.BadZipFile:
                return jsonify({"error": "Invalid backup file format"}), 400
                
            # Extract UUID from airbeats_global_stats.xml
            user_id = None
            stats_xml_path = os.path.join(temp_dir, 'airbeats_global_stats.xml')
            if os.path.exists(stats_xml_path):
                try:
                    tree = ET.parse(stats_xml_path)
                    root = tree.getroot()
                    for string_elem in root.findall('string'):
                        if string_elem.get('name') == 'global_stats_user_id':
                            user_id = string_elem.text
                            break
                except Exception as e:
                    print(f"Error parsing stats XML: {e}")
                    
            if not user_id:
                return jsonify({"error": "Could not extract user ID from backup"}), 400
                
            # Extract History from music.db
            history = []
            db_path = os.path.join(temp_dir, 'music.db')
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    # We need the most recently played songs.
                    # Join event with song, and maybe artist map
                    query = """
                    SELECT 
                        s.id, 
                        s.title, 
                        s.duration,
                        a.id as artistId,
                        a.name as artistName,
                        e.timestamp
                    FROM event e
                    JOIN song s ON e.songId = s.id
                    LEFT JOIN song_artist_map sam ON s.id = sam.songId AND sam.position = 0
                    LEFT JOIN artist a ON sam.artistId = a.id
                    ORDER BY e.timestamp DESC
                    LIMIT 200
                    """
                    cursor.execute(query)
                    rows = cursor.fetchall()
                    for row in rows:
                        song_id, title, duration, artist_id, artist_name, timestamp = row
                        
                        # Format for web app recentlyPlayed structure
                        history_item = {
                            "id": song_id,
                            "title": title,
                            "subtitle": artist_name or "Unknown Artist",
                            "type": "song",
                            "image": "https://ui-avatars.com/api/?name=Song&background=333&color=fff", # We don't have images in DB
                            "artistIds": artist_id or "",
                            "playedAt": timestamp
                        }
                        history.append(history_item)
                    conn.close()
                except Exception as e:
                    print(f"Error parsing SQLite db: {e}")
            
            return jsonify({
                "success": True,
                "userId": user_id,
                "history": history
            })
    except Exception as e:
        print("[STATS] Restore error:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/stats/profile_html')
def stats_profile_html():
    """Generates and returns premium pre-rendered HTML for settings/profile"""
    try:
        user_id = request.args.get('userId', '')
        client_name = request.args.get('name', 'AirBeats User')
        client_avatar = request.args.get('avatar', '')
        
        board = read_stats_board(GLOBAL_STATS_FILE)
        user_obj = next((u for u in board["users"] if u["id"] == user_id), None)

        name = user_obj["name"] if user_obj else client_name
        profile_url = user_obj["profileUrl"] if user_obj and user_obj.get("profileUrl") else client_avatar
        if profile_url and profile_url.lower() == "null":
            profile_url = ""
        total_ms = user_obj["totalListenMs"] if user_obj else 0
        weekly_ms = user_obj["weeklyListenMs"] if user_obj else 0

        hours = total_ms / 3600000.0
        current_rank = get_rank_from_hours(hours)
        next_rank = get_next_rank(current_rank)

        if current_rank and next_rank:
            progress = ((hours - current_rank["thresholdHours"]) / (next_rank["thresholdHours"] - current_rank["thresholdHours"])) * 100
        elif not current_rank and next_rank:
            progress = (hours / next_rank["thresholdHours"]) * 100
        else:
            progress = 100

        # Ranks grid
        badges_html = ""
        for r in RANK_DEFINITIONS:
            unlocked = hours >= r["thresholdHours"]
            status_class = "unlocked" if unlocked else "locked"
            badge_icon = get_badge_html(r, 48)
            lock_icon = '<div class="badge-lock"><i class="fas fa-lock"></i></div>' if not unlocked else ""
            badges_html += f"""
            <div class="badge-card {status_class}">
                <div class="badge-badge-wrapper">
                    {badge_icon}
                    {lock_icon}
                </div>
                <div class="badge-name">{r["name"]}</div>
                <div class="badge-hours">{r["thresholdHours"]}h</div>
            </div>
            """

        progress_bar_html = ""
        if next_rank:
            prog_fill_style = f"width: {min(progress, 100):.1f}%;"
            if current_rank:
                gradient = ", ".join(current_rank["colors"])
                prog_fill_style += f" background: linear-gradient(90deg, {gradient});"
            else:
                prog_fill_style += " background: var(--accent);"

            progress_bar_html = f"""
            <div class="rank-progress-card">
                <div class="rank-progress-header">
                    <span>Progress to {next_rank["name"]}</span>
                    <span>{progress:.0f}%</span>
                </div>
                <div class="rank-progress-bar">
                    <div class="rank-progress-fill" style="{prog_fill_style}"></div>
                </div>
                <div class="rank-progress-footer">
                    <span>{format_hours_string(total_ms)} listened</span>
                    <span>{next_rank["thresholdHours"]}h needed</span>
                </div>
            </div>
            """
        else:
            progress_bar_html = """
            <div class="rank-progress-card">
                <div class="rank-progress-header" style="justify-content: center;">
                    <span style="color: #FFD700; font-weight: bold; letter-spacing: 1px;">ðŸ† MAXIMUM RANK ACHIEVED! ðŸ†</span>
                </div>
            </div>
            """

        if profile_url and profile_url.strip() and profile_url.lower() != "null":
            img_style = "display: block;"
            css_style = "display: none;"
        else:
            img_style = "display: none;"
            css_style = "display: flex;"
        
        first_letter = name[0].upper() if name else "A"
        avatar_html = f"""
                    <img class="profile-avatar-large" src="{profile_url or ''}" alt="avatar" id="profileAvatarImg" style="{img_style}" onerror="this.style.display='none'; document.getElementById('profileAvatarPlaceholder').style.display='flex';">
                    <div class="profile-avatar-large-css" id="profileAvatarPlaceholder" style="{css_style}">{first_letter}</div>
        """

        profile_html = f"""
        <div class="stats-profile-page">
            <div class="profile-header-card">
                <div class="profile-avatar-section">
                    {avatar_html}
                    <button class="avatar-edit-btn" onclick="window.showAvatarPicker()"><i class="fas fa-camera"></i></button>
                </div>
                <div class="profile-info">
                    <div class="profile-name-row">
                        <h2 id="profileDisplayName">{name}</h2>
                        <button class="edit-name-btn" onclick="window.editProfileName()"><i class="fas fa-pen"></i></button>
                    </div>
                    <div class="profile-rank-row">
                        {get_badge_html(current_rank, 24) if current_rank else ""}
                        <span class="profile-rank-name">{current_rank["name"] if current_rank else "No tier reached"}</span>
                    </div>
                </div>
            </div>

            <div class="stats-cards-row">
                <div class="stat-card">
                    <div class="stat-value">{format_hours_string(total_ms)}</div>
                    <div class="stat-label">Total Listen Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{current_rank["name"] if current_rank else "--"}</div>
                    <div class="stat-label">Current Tier</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{format_hours_string(weekly_ms)}</div>
                    <div class="stat-label">This Week</div>
                </div>
            </div>

            {progress_bar_html}

            <div class="badges-section">
                <h3>All AirBeats Tiers</h3>
                <div class="badges-grid">
                    {badges_html}
                </div>
            </div>

            <div class="profile-actions">
                <button class="stats-btn-secondary" onclick="window.location.hash='#stats'"><i class="fas fa-trophy"></i> View Leaderboard</button>
                <button class="stats-btn-secondary" style="margin-left: 10px;" onclick="document.getElementById('backupFileInput').click()"><i class="fas fa-upload"></i> Restore Backup (.backup)</button>
                <input type="file" id="backupFileInput" accept=".backup,.zip" style="display: none;" onchange="window.restoreBackup(this)">
            </div>
        </div>
        """
        return profile_html
    except Exception as e:
        return f"<div style='padding:40px; color:red;'>Error loading profile: {e}</div>"

@app.route('/api/stats/leaderboard_html')
def stats_leaderboard_html():
    """Generates and returns premium pre-rendered HTML for the leaderboard"""
    try:
        user_id = request.args.get('userId', '')
        board = read_stats_board(GLOBAL_STATS_FILE)
        users = board["users"]

        my_user = next((u for u in users if u["id"] == user_id), None)
        top_user = users[0] if users else None

        users_rows_html = ""
        for u in users:
            is_me = u["id"] == user_id
            row_class = "leaderboard-row is-me" if is_me else "leaderboard-row"
            
            hrs = u["totalListenMs"] / 3600000.0
            rank = get_rank_from_hours(hrs)
            badge_img = get_badge_html(rank, 18) if rank else ""
            
            profile_url = u.get("profileUrl")
            first_letter = u["name"][0].upper() if u["name"] else "A"
            if profile_url and profile_url.strip() and profile_url.lower() != "null":
                avatar_html = f"""
                <div class="lb-avatar-container">
                    <img class="lb-avatar" src="{profile_url}" alt="{u["name"]}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="lb-avatar-css" style="display: none;">{first_letter}</div>
                </div>
                """
            else:
                avatar_html = f"""
                <div class="lb-avatar-container">
                    <div class="lb-avatar-css" style="display: flex;">{first_letter}</div>
                </div>
                """
            
            users_rows_html += f"""
            <div class="{row_class}">
                <div class="lb-rank">#{u["rank"]}</div>
                {avatar_html}
                <div class="lb-name-col">
                    <span class="lb-name">{u["name"]}{" (You)" if is_me else ""}</span>
                    {badge_img}
                </div>
                <div class="lb-hours">{format_hours_string(u["totalListenMs"])}</div>
            </div>
            """

        leaderboard_html = f"""
        <div class="stats-leaderboard-page">
            <div class="leaderboard-header">
                <h2><i class="fas fa-trophy" style="color:#FFD700; margin-right:12px;"></i>Global Stats Leaderboard</h2>
                <button class="stats-btn-secondary" onclick="window.renderGlobalStats()"><i class="fas fa-sync-alt"></i> Refresh</button>
            </div>

            <div class="leaderboard-summary">
                <div class="stat-card">
                    <div class="stat-value">{top_user["name"] if top_user else "--"}</div>
                    <div class="stat-label">Top Listener</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">#{my_user["rank"] if my_user else "--"}</div>
                    <div class="stat-label">Your Rank</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{len(users)}</div>
                    <div class="stat-label">Total Users</div>
                </div>
            </div>

            <div class="leaderboard-list">
                {users_rows_html if users_rows_html else '<p class="no-data">No listener stats available. Start listening!</p>'}
            </div>
        </div>
        """
        return leaderboard_html
    except Exception as e:
        return f"<div style='padding:40px; color:red;'>Error loading leaderboard: {e}</div>"

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
        # Find all p tags
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

def get_lyrics():
    song_name = request.args.get('s', '')
    artist_name = request.args.get('a', '')
    duration = request.args.get('d', '')
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
    
    # Build list of artist queries to try: full string first, then each individual artist
    artist_queries = [artist_name]
    if ',' in artist_name:
        individual = [a.strip() for a in artist_name.split(',') if a.strip()]
        for a in individual:
            if a != artist_name:
                artist_queries.append(a)
    
    force_refresh = request.args.get('force') == '1'
    
    for artist_q in artist_queries:
        print(f"[LYRICS] Trying with artist: '{artist_q}' (force={force_refresh})")
        
        if not force_refresh:
            # 1. Try Boidu API
            try:
                url = f"https://lyrics-api.boidu.dev/getLyrics?s={requests.utils.quote(song_name)}&a={requests.utils.quote(artist_q)}"
                if duration: url += f"&d={duration}"
                res = requests.get(url, headers=headers, timeout=10)
                if res.ok:
                    data = res.json()
                    ttml = data.get('ttml')
                    if ttml:
                        parsed = parse_ttml(ttml)
                        if parsed:
                            print(f"[Boidu] Found lyrics with artist: '{artist_q}'")
                            return jsonify(parsed)
            except Exception as e:
                print("Boidu API Error:", e)
                
            # 2. Try Boidu Kugou API
            try:
                url = f"https://lyrics-api.boidu.dev/kugou/getLyrics?s={requests.utils.quote(song_name)}&a={requests.utils.quote(artist_q)}"
                if duration: url += f"&d={duration}"
                res = requests.get(url, headers=headers, timeout=10)
                if res.ok:
                    data = res.json()
                    ttml = data.get('ttml')
                    if ttml:
                        parsed = parse_ttml(ttml)
                        if parsed:
                            print(f"[Kugou] Found lyrics with artist: '{artist_q}'")
                            return jsonify(parsed)
            except Exception as e:
                print("Boidu Kugou API Error:", e)

        # 3. Try LRCLIB API
        try:
            q = f"{song_name} {artist_q}".strip()
            url = f"https://lrclib.net/api/search?q={requests.utils.quote(q)}"
            print(f"[LRCLIB] Requesting URL: {url}")
            res = requests.get(url, headers=headers, timeout=10)
            print(f"[LRCLIB] Response Status: {res.status_code}")
            
            if res.ok:
                data = res.json()
                print(f"[LRCLIB] Parsed JSON. Is List? {isinstance(data, list)}. Length: {len(data) if isinstance(data, list) else 'N/A'}")
                if isinstance(data, list) and len(data) > 0:
                    for idx, item in enumerate(data):
                        has_synced = bool(item.get('syncedLyrics'))
                        print(f"[LRCLIB] Item {idx} -> has syncedLyrics: {has_synced}")
                        if has_synced:
                            parsed = parse_lrc(item['syncedLyrics'])
                            print(f"[LRCLIB] parse_lrc result length: {len(parsed) if parsed else 0}")
                            if parsed:
                                print(f"[LRCLIB] Successfully returning {len(parsed)} synced lines with artist: '{artist_q}'!")
                                return jsonify(parsed)
            else:
                print(f"[LRCLIB] Failed to fetch. Response Text: {res.text[:200]}")
        except Exception as e:
            print("[LRCLIB] EXCEPTION OCCURRED:", e)

    # 4. Final fallback: try with just the song name, no artist
    print(f"[LYRICS] All artist combos failed, trying song name only: '{song_name}'")
    try:
        url = f"https://lrclib.net/api/search?q={requests.utils.quote(song_name)}"
        res = requests.get(url, headers=headers, timeout=10)
        if res.ok:
            data = res.json()
            if isinstance(data, list) and len(data) > 0:
                for item in data:
                    if item.get('syncedLyrics'):
                        parsed = parse_lrc(item['syncedLyrics'])
                        if parsed:
                            print(f"[LRCLIB] Found lyrics with song name only!")
                            return jsonify(parsed)
    except Exception as e:
        print("[LRCLIB] Song-only fallback error:", e)

    print("[API END] Returning 404 No synchronized lyrics found.")
    return jsonify({"error": "No synchronized lyrics found."}), 404

import backend
backend.add_yt_routes(app, get_lyrics)


# --- AUTH AND CLOUD BACKUP ROUTES ---
AUTH_API_BASE_URL = os.environ.get("AUTH_API_BASE_URL", "https://auth.airbeats.app")
PROJECT_ID = os.environ.get("PROJECT_ID", "proj_35e369a4-ccfa-4d7b-be7f-3fe58dcaece4")

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.json
    try:
        r = requests.post(f"{AUTH_API_BASE_URL}/api/projects/{PROJECT_ID}/auth", json=data, timeout=15)
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/signup', methods=['POST'])
def auth_signup():
    data = request.json
    try:
        r = requests.post(f"{AUTH_API_BASE_URL}/api/projects/{PROJECT_ID}/signup", json=data, timeout=15)
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/backup', methods=['POST'])
def auth_backup():
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Missing email'}), 400
    folder = email.replace('@', '_at_').replace('.', '_dot_')
    file_name = f"airbeats/backups/{folder}/desktop_backup.json"
    data = request.json
    try:
        r = requests.post(
            f"{STATS_BASE_URL}/upload?file={file_name}",
            json=data,
            headers={'X-API-Key': STATS_API_KEY},
            timeout=15
        )
        return jsonify({'success': r.ok}), r.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/restore', methods=['GET'])
def auth_restore():
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Missing email'}), 400
    folder = email.replace('@', '_at_').replace('.', '_dot_')
    file_name = f"airbeats/backups/{folder}/desktop_backup.json"
    try:
        import time
        r = requests.get(
            f"{STATS_BASE_URL}/download?file={file_name}&_t={int(time.time()*1000)}",
            headers={'Cache-Control': 'no-cache'},
            timeout=15
        )
        if r.ok:
            return jsonify(r.json()), 200
        else:
            return jsonify({'error': 'Not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
# ------------------------------------

if __name__ == '__main__':
    print("Server started at http://127.0.0.1:8000")
    app.run(host='127.0.0.1', port=8000, debug=False)

