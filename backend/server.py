#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
«Двое» (Two) — Minimalist Couple Time & Mutual Mood Tracker
Backend Server & Telegram Bot for Telegram Mini App
"""

import base64
import hashlib
import html
import io
import json
import mimetypes
import os
import random
import re
import secrets
import socket
import sqlite3
import threading
import time
import urllib.parse
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import requests
from PIL import Image

# ==============================================================================
# Configuration & Environment
# ==============================================================================

def setup_local_proxy_if_available():
    """Detect local socks5/http proxy (v2ray / clash) on macOS for Telegram API access."""
    for port in (10809, 7890, 1087):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.2)
                if s.connect_ex(("127.0.0.1", port)) == 0:
                    os.environ["HTTP_PROXY"] = f"http://127.0.0.1:{port}"
                    os.environ["HTTPS_PROXY"] = f"http://127.0.0.1:{port}"
                    os.environ["NO_PROXY"] = "localhost,127.0.0.1,::1"
                    print(f"[Proxy] Using local proxy on 127.0.0.1:{port} for Telegram API")
                    break
        except Exception:
            pass

setup_local_proxy_if_available()

BOT_TOKEN = os.environ.get("BOT_TOKEN", "9265259467:AAHoLLQJKFknBZJkWUsBLXE0RJsuoc0zafw")
BOT_USERNAME = os.environ.get("BOT_USERNAME", "ChibiLovePara_bot")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "ksjjfnnn")
ADMIN_TG_ID = int(os.environ.get("ADMIN_TG_ID", "8565474570"))
PORT = int(os.environ.get("PORT", "8085"))

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
UPLOADS_DIR = os.path.join(PUBLIC_DIR, "uploads")
DB_PATH = os.path.join(BASE_DIR, "backend", "chibilove.db")
TUNNEL_URL_FILE = os.path.join(BASE_DIR, "backend", "tunnel_url.txt")
BANNER_IMAGE_PATH = os.path.join(PUBLIC_DIR, "img", "bot_avatar_dvoe.jpg")
AVATAR_IMAGE_PATH = os.path.join(PUBLIC_DIR, "img", "bot_avatar_dvoe.jpg")

os.makedirs(UPLOADS_DIR, exist_ok=True)

ABOUT_APP_TEXT = (
    "✨ <b>О приложении «Двое»</b> 💕\n\n"
    "«Двое» — минималистичное приватное пространство для любящей пары:\n\n"
    "⏳ <b>Точный счётчик времени вместе</b>\n"
    "Считает годы, месяцы, дни, часы, минуты и секунды рука об руку в реальном времени.\n\n"
    "💭 <b>Синхронизация настроения с пояснениями</b>\n"
    "Делитесь своими чувствами и пишите искренние заметки (почему вам грустно, радостно или чего хочется). Партнёр мгновенно видит статус и может отправить вам тепло и поддержку в один клик.\n\n"
    "🖼 <b>Фото 1:1</b>\n"
    "Персональные фотографии профилей с автоматическим квадратным кадрированием.\n\n"
    "💌 <b>Знаки внимания</b>\n"
    "Шлите мгновенные сердечки и напоминайте о своей любви в один клик!"
)

db_lock = threading.RLock()
_tg_session = requests.Session()


# ==============================================================================
# Database Layer
# ==============================================================================

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 30000;")
    return conn


def init_db():
    with db_lock:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("PRAGMA journal_mode=WAL;")
        cur.execute("PRAGMA busy_timeout = 30000;")
        cur.execute("PRAGMA synchronous = NORMAL;")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                tg_id INTEGER,
                display_name TEXT,
                photo_url TEXT DEFAULT '',
                photo_custom TEXT DEFAULT '',
                invite_code TEXT DEFAULT '',
                mood TEXT DEFAULT 'happy',
                mood_emoji TEXT DEFAULT '🥰',
                mood_label TEXT DEFAULT 'Люблю',
                mood_reason TEXT DEFAULT '',
                mood_updated_at REAL DEFAULT 0,
                mood_reaction TEXT DEFAULT '',
                mood_reaction_from TEXT DEFAULT '',
                mood_reaction_at REAL DEFAULT 0,
                partner_username TEXT DEFAULT NULL,
                paired_at REAL DEFAULT 0,
                anniversary_date TEXT DEFAULT '',
                last_active REAL DEFAULT 0,
                created_at REAL DEFAULT 0
            )
        """)

        # Add any missing columns dynamically
        cols = {r["name"] for r in cur.execute("PRAGMA table_info(users)").fetchall()}
        needed = [
            ("photo_url", "TEXT DEFAULT ''"),
            ("photo_custom", "TEXT DEFAULT ''"),
            ("invite_code", "TEXT DEFAULT ''"),
            ("mood_emoji", "TEXT DEFAULT '🥰'"),
            ("mood_label", "TEXT DEFAULT 'Люблю'"),
            ("mood_reason", "TEXT DEFAULT ''"),
            ("mood_updated_at", "REAL DEFAULT 0"),
            ("mood_reaction", "TEXT DEFAULT ''"),
            ("mood_reaction_from", "TEXT DEFAULT ''"),
            ("mood_reaction_at", "REAL DEFAULT 0"),
            ("last_active", "REAL DEFAULT 0"),
        ]
        for cname, ctype in needed:
            if cname not in cols:
                cur.execute(f"ALTER TABLE users ADD COLUMN {cname} {ctype}")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS support_tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tg_id INTEGER,
                username TEXT,
                display_name TEXT,
                message TEXT,
                message_text TEXT,
                category TEXT DEFAULT 'general',
                created_at REAL,
                status TEXT DEFAULT 'new'
            )
        """)
        st_cols = {r["name"] for r in cur.execute("PRAGMA table_info(support_tickets)").fetchall()}
        for st_col, st_type in [("message", "TEXT"), ("message_text", "TEXT"), ("category", "TEXT DEFAULT 'general'"), ("status", "TEXT DEFAULT 'new'")]:
            if st_col not in st_cols:
                cur.execute(f"ALTER TABLE support_tickets ADD COLUMN {st_col} {st_type}")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS support_sessions (
                tg_id INTEGER PRIMARY KEY,
                state TEXT,
                updated_at REAL
            )
        """)
        cur.execute("PRAGMA table_info(support_sessions)")
        ss_cols = [r[1] for r in cur.fetchall()]
        if "state" not in ss_cols:
            cur.execute("ALTER TABLE support_sessions ADD COLUMN state TEXT")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS pair_sessions (
                tg_id INTEGER PRIMARY KEY,
                state TEXT,
                updated_at REAL
            )
        """)

        # Generate invite_code for any users lacking one
        for row in cur.execute("SELECT username, invite_code FROM users").fetchall():
            if not row["invite_code"]:
                code = "PAIR-" + secrets.token_hex(3).upper()
                cur.execute("UPDATE users SET invite_code = ? WHERE username = ?", (code, row["username"]))

        conn.commit()
        conn.close()


init_db()


def normalize_username(u: str) -> str:
    if not u:
        return ""
    u = u.strip().lstrip("@").lower()
    return re.sub(r"[^a-zA-Z0-9_]", "", u)


def generate_invite_code() -> str:
    return "PAIR-" + secrets.token_hex(3).upper()


def get_current_webapp_url() -> str:
    env_url = (os.environ.get("WEBAPP_URL") or os.environ.get("RENDER_EXTERNAL_URL") or "").strip()
    if env_url.startswith("https://"):
        return env_url
    if os.environ.get("SPACE_HOST"):
        return f"https://{os.environ['SPACE_HOST']}"
    if os.path.exists(TUNNEL_URL_FILE):
        try:
            with open(TUNNEL_URL_FILE, "r", encoding="utf-8") as f:
                url = f.read().strip()
                if url.startswith("https://"):
                    return url
        except Exception:
            pass
    return f"http://localhost:{PORT}"


def process_and_crop_square_image(filepath: str, max_size: int = 800) -> str:
    """Crops image to exact 1:1 aspect ratio centered, then resizes to max_size."""
    try:
        with Image.open(filepath) as img:
            img = img.convert("RGB")
            w, h = img.size
            min_dim = min(w, h)
            left = (w - min_dim) // 2
            top = (h - min_dim) // 2
            right = left + min_dim
            bottom = top + min_dim
            img_cropped = img.crop((left, top, right, bottom))
            if min_dim > max_size:
                img_cropped = img_cropped.resize((max_size, max_size), Image.Resampling.LANCZOS)
            img_cropped.save(filepath, "JPEG", quality=90, optimize=True)
            return filepath
    except Exception as e:
        print(f"[Image Crop Error] {e}")
        return ""


def download_and_crop_square_photo(url: str, username: str) -> str:
    """Downloads an external avatar, crops to 1:1 square, and saves to uploads/."""
    try:
        proxies = None
        if os.environ.get("HTTP_PROXY"):
            proxies = {"http": os.environ["HTTP_PROXY"], "https": os.environ["HTTPS_PROXY"]}
        r = _tg_session.get(url, proxies=proxies, timeout=12)
        if r.status_code == 200 and r.content:
            file_hash = hashlib.sha256(r.content).hexdigest()[:12]
            if r.content.startswith(b"<svg") or b"<svg" in r.content[:200]:
                filename = f"avatar_{username}_{file_hash}.svg"
                filepath = os.path.join(UPLOADS_DIR, filename)
                with open(filepath, "wb") as f:
                    f.write(r.content)
                return f"/uploads/{filename}"

            filename = f"avatar_{username}_{file_hash}.jpg"
            filepath = os.path.join(UPLOADS_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(r.content)
            res = process_and_crop_square_image(filepath)
            if res:
                return f"/uploads/{filename}"
    except Exception as e:
        print(f"[Download Avatar Error] {e}")
    return ""


def save_base64_upload(base64_str: str, username: str) -> str:
    """Decodes base64 image data, crops to 1:1 square, and writes to public/uploads/."""
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    raw_data = base64.b64decode(base64_str)
    file_hash = hashlib.sha256(raw_data).hexdigest()[:12]
    filename = f"{username}_{file_hash}_{int(time.time())}.jpg"
    filepath = os.path.join(UPLOADS_DIR, filename)

    img = Image.open(io.BytesIO(raw_data))
    img = img.convert("RGB")
    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    img_cropped = img.crop((left, top, left + min_dim, top + min_dim))
    if min_dim > 800:
        img_cropped = img_cropped.resize((800, 800), Image.Resampling.LANCZOS)
    img_cropped.save(filepath, "JPEG", quality=90, optimize=True)

    return f"/uploads/{filename}"


# ==============================================================================
# Telegram Bot API Helpers
# ==============================================================================

def tg_api_call(method: str, payload: dict):
    global _tg_session
    if not BOT_TOKEN:
        return None
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
    call_timeout = 25 if method == "getUpdates" else 15
    proxies = None
    if os.environ.get("HTTP_PROXY"):
        proxies = {
            "http": os.environ["HTTP_PROXY"],
            "https": os.environ["HTTPS_PROXY"],
        }
    for attempt in range(2):
        try:
            curr_proxies = proxies
            resp = _tg_session.post(url, json=payload, proxies=curr_proxies, timeout=call_timeout)
            return resp.json()
        except Exception as e:
            _tg_session = requests.Session()
            if attempt == 1:
                print(f"[TG API Error] {method}: {e}")
    return None


_configured_menu_chats = set()
_menu_lock = threading.Lock()

def get_main_reply_keyboard() -> dict:
    curr_url = get_current_webapp_url()
    if curr_url and curr_url.startswith("https://"):
        open_btn = {"text": "💑 Открыть «Двое»", "web_app": {"url": curr_url}}
    else:
        open_btn = {"text": "💑 Открыть «Двое»"}
    return {
        "keyboard": [
            [open_btn],
            [{"text": "🔗 Привязать партнёра"}, {"text": "📤 Пригласить партнёра"}],
            [{"text": "📖 О приложении"}, {"text": "💬 Связь с разработчиком"}],
            [{"text": "💌 Послать знак внимания"}, {"text": "ℹ️ Мой статус"}]
        ],
        "resize_keyboard": True,
        "is_persistent": True
    }


def ensure_chat_menu_button(chat_id):
    try:
        chat_id = int(chat_id)
    except (ValueError, TypeError):
        return
    if not chat_id:
        return
    curr_url = get_current_webapp_url()
    if not curr_url or not curr_url.startswith("https://"):
        return
    cache_key = (chat_id, curr_url)
    with _menu_lock:
        if cache_key in _configured_menu_chats:
            return
    user_menu_url = f"{curr_url}?tg_id={chat_id}"
    res = tg_api_call("setChatMenuButton", {
        "chat_id": chat_id,
        "menu_button": {
            "type": "web_app",
            "text": "💑 Двое",
            "web_app": {"url": user_menu_url}
        }
    })
    # Cache user IDs even on 400/error response so invalid IDs are never repeatedly hammered
    with _menu_lock:
        _configured_menu_chats.add(cache_key)


def tg_send_message(chat_id: int, text: str, reply_markup: dict = None):
    try:
        ensure_chat_menu_button(chat_id)
    except Exception:
        pass
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
    else:
        payload["reply_markup"] = get_main_reply_keyboard()
    return tg_api_call("sendMessage", payload)


def tg_send_photo(chat_id: int, photo_path: str, caption: str, reply_markup: dict = None):
    """Sends a photo with caption and reply markup to Telegram chat, falling back to text message on error."""
    global _tg_session
    try:
        ensure_chat_menu_button(chat_id)
    except Exception:
        pass
    if not BOT_TOKEN:
        return None
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto"
    data = {
        "chat_id": chat_id,
        "caption": caption,
        "parse_mode": "HTML",
    }
    if reply_markup is not None:
        data["reply_markup"] = json.dumps(reply_markup)
    else:
        data["reply_markup"] = json.dumps(get_main_reply_keyboard())
    proxies = None
    if os.environ.get("HTTP_PROXY"):
        proxies = {
            "http": os.environ["HTTP_PROXY"],
            "https": os.environ["HTTPS_PROXY"],
        }
    if photo_path and os.path.exists(photo_path):
        for attempt in range(2):
            try:
                curr_proxies = proxies
                with open(photo_path, "rb") as f:
                    files = {"photo": (os.path.basename(photo_path), f, "image/jpeg")}
                    resp = _tg_session.post(url, data=data, files=files, proxies=curr_proxies, timeout=20)
                    res_json = resp.json()
                    if res_json.get("ok"):
                        return res_json
                    print(f"[TG sendPhoto API Error] {res_json}")
                    break
            except Exception as e:
                _tg_session = requests.Session()
                if attempt == 1:
                    print(f"[TG sendPhoto Exception] {e}")

    # Fallback to sendMessage if photo upload fails or file missing
    return tg_send_message(chat_id, caption, reply_markup=reply_markup)


def fetch_and_save_tg_avatar(tg_id: int, username: str) -> str:
    """Attempts to fetch high-res profile photo from Telegram Bot API and saves to uploads/."""
    try:
        res = tg_api_call("getUserProfilePhotos", {"user_id": tg_id, "limit": 1})
        if not res or not res.get("ok"):
            return ""
        result = res.get("result", {})
        if result.get("total_count", 0) <= 0:
            return ""
        photos = result.get("photos", [])
        if not photos or not photos[0]:
            return ""
        file_id = photos[0][-1]["file_id"]
        finfo = tg_api_call("getFile", {"file_id": file_id})
        if not finfo or not finfo.get("ok"):
            return ""
        file_path = finfo["result"]["file_path"]

        dl_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
        proxies = None
        if os.environ.get("HTTP_PROXY"):
            proxies = {"http": os.environ["HTTP_PROXY"], "https": os.environ["HTTPS_PROXY"]}
        r = _tg_session.get(dl_url, proxies=proxies, timeout=15)
        if r.status_code == 200:
            ext = os.path.splitext(file_path)[1] or ".jpg"
            filename = f"tg_{tg_id}_{int(time.time())}{ext}"
            filepath = os.path.join(UPLOADS_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(r.content)
            process_and_crop_square_image(filepath)
            return f"/uploads/{filename}"
    except Exception as e:
        print(f"[Fetch TG Avatar Error] {e}")
    return ""


# ==============================================================================
# Couple Pairing & User Management
# ==============================================================================

def resolve_canonical_username(raw_uname: str, tg_id: int = None) -> tuple:
    """
    Resolves any user identity (username, placeholder user_{tg_id}, or tg_id) to the canonical username.
    Prevents duplicate user_{tg_id} profiles when a user already has an existing account (e.g. adamlanda for tg_id 2034621049).
    """
    if tg_id:
        try:
            tg_id = int(tg_id)
        except (ValueError, TypeError):
            tg_id = None

    uname = normalize_username(raw_uname or "")
    if not tg_id and uname and re.match(r"^user_\d+$", uname):
        try:
            tg_id = int(uname.split("_", 1)[1])
        except (ValueError, TypeError):
            pass

    if tg_id:
        with db_lock:
            conn = get_db()
            row = conn.execute(
                "SELECT username FROM users WHERE tg_id = ? AND username NOT LIKE 'user_%' ORDER BY created_at ASC",
                (tg_id,)
            ).fetchone()
            conn.close()
        if row and row["username"]:
            return row["username"], tg_id

    if not uname and tg_id:
        uname = f"user_{tg_id}"

    return uname, tg_id


def pair_users(uname1: str, uname2: str) -> bool:
    """Links two users bidirectionally, cleans up old orphaned pairs, and starts anniversary counting from current second."""
    uname1, _ = resolve_canonical_username(uname1)
    uname2, _ = resolve_canonical_username(uname2)
    uname1 = normalize_username(uname1)
    uname2 = normalize_username(uname2)
    if not uname1 or not uname2 or uname1 == uname2:
        return False
    now = time.time()
    pair_iso = datetime.fromtimestamp(now).strftime("%Y-%m-%dT%H:%M:%S")
    with db_lock:
        conn = get_db()
        cur = conn.cursor()
        u1 = cur.execute("SELECT * FROM users WHERE username = ?", (uname1,)).fetchone()
        u2 = cur.execute("SELECT * FROM users WHERE username = ?", (uname2,)).fetchone()
        if not u1 or not u2:
            conn.close()
            return False

        # Clean up any old orphaned pairings pointing to either user
        cur.execute("UPDATE users SET partner_username = NULL WHERE partner_username IN (?, ?)", (uname1, uname2))

        # Always start anniversary counting from the exact second of pairing/relinking
        cur.execute("""
            UPDATE users SET partner_username = ?, paired_at = ?, anniversary_date = ? WHERE username = ?
        """, (uname2, now, pair_iso, uname1))
        cur.execute("""
            UPDATE users SET partner_username = ?, paired_at = ?, anniversary_date = ? WHERE username = ?
        """, (uname1, now, pair_iso, uname2))
        conn.commit()
        conn.close()
    return True


def unlink_user(uname: str):
    """Unlinks a user and cleans up reverse partner pointer, resetting pairing timestamp and anniversary."""
    uname, _ = resolve_canonical_username(uname)
    uname = normalize_username(uname)
    if not uname:
        return None
    with db_lock:
        conn = get_db()
        cur = conn.cursor()
        u = cur.execute("SELECT partner_username FROM users WHERE username = ?", (uname,)).fetchone()
        p_uname = u["partner_username"] if u else None
        cur.execute("UPDATE users SET partner_username = NULL, anniversary_date = '', paired_at = 0 WHERE username = ? OR partner_username = ?", (uname, uname))
        if p_uname:
            cur.execute("UPDATE users SET partner_username = NULL, anniversary_date = '', paired_at = 0 WHERE username = ? OR partner_username = ?", (p_uname, p_uname))
        conn.commit()
        conn.close()
    return p_uname


def ensure_user(username: str, display_name: str = "", tg_id: int = None, photo_url: str = ""):
    username, tg_id = resolve_canonical_username(username, tg_id)
    if not username:
        return None
    now = time.time()

    local_photo = ""
    if photo_url and photo_url.startswith("http"):
        cached = download_and_crop_square_photo(photo_url, username)
        if cached:
            local_photo = cached
    elif photo_url and photo_url.startswith("/"):
        local_photo = photo_url

    if not local_photo and tg_id:
        try:
            tg_avatar = fetch_and_save_tg_avatar(int(tg_id), username)
            if tg_avatar:
                local_photo = tg_avatar
        except Exception:
            pass

    with db_lock:
        conn = get_db()
        cur = conn.cursor()

        # If this is a real user and we have tg_id, cleanup/merge any duplicate placeholder user_{tg_id}
        if tg_id and not username.startswith("user_"):
            placeholder_uname = f"user_{tg_id}"
            row_placeholder = cur.execute("SELECT * FROM users WHERE username = ?", (placeholder_uname,)).fetchone()
            if row_placeholder:
                row_existing = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
                if row_existing:
                    cur.execute("DELETE FROM users WHERE username = ?", (placeholder_uname,))
                    cur.execute("UPDATE users SET partner_username = ? WHERE partner_username = ?", (username, placeholder_uname))
                    cur.execute("UPDATE support_tickets SET username = ? WHERE username = ?", (username, placeholder_uname))
                    cur.execute("UPDATE pair_requests SET from_username = ? WHERE from_username = ?", (username, placeholder_uname))
                    cur.execute("UPDATE pair_requests SET to_username = ? WHERE to_username = ?", (username, placeholder_uname))
                else:
                    cur.execute("UPDATE users SET username = ? WHERE username = ?", (username, placeholder_uname))
                    cur.execute("UPDATE users SET partner_username = ? WHERE partner_username = ?", (username, placeholder_uname))
                    cur.execute("UPDATE support_tickets SET username = ? WHERE username = ?", (username, placeholder_uname))
                    cur.execute("UPDATE pair_requests SET from_username = ? WHERE from_username = ?", (username, placeholder_uname))
                    cur.execute("UPDATE pair_requests SET to_username = ? WHERE to_username = ?", (username, placeholder_uname))
                conn.commit()

        row = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not row:
            inv_code = generate_invite_code()
            d_name = display_name or username
            cur.execute("""
                INSERT INTO users (username, tg_id, display_name, photo_url, invite_code, mood_emoji, mood_label, mood_reason, mood_updated_at, last_active, created_at)
                VALUES (?, ?, ?, ?, ?, '🥰', 'Люблю', '', ?, ?, ?)
            """, (username, tg_id, d_name, local_photo or '', inv_code, now, now, now))
            conn.commit()
            row = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        else:
            updates = []
            params = []
            if tg_id and not row["tg_id"]:
                updates.append("tg_id = ?")
                params.append(tg_id)
            if display_name and (not row["display_name"] or row["display_name"] == username):
                updates.append("display_name = ?")
                params.append(display_name)

            cur_photo = row["photo_url"] or ""
            has_valid_photo = bool(cur_photo and cur_photo.startswith("/uploads/"))
            if not row["photo_custom"] and not has_valid_photo:
                found_avatar = local_photo
                eff_tg_id = tg_id or row["tg_id"]
                if not found_avatar and eff_tg_id:
                    try:
                        found_avatar = fetch_and_save_tg_avatar(int(eff_tg_id), username)
                    except Exception:
                        pass
                if not found_avatar and photo_url and photo_url.startswith("http"):
                    found_avatar = download_and_crop_square_photo(photo_url, username)

                if found_avatar:
                    updates.append("photo_url = ?")
                    params.append(found_avatar)

            if not row["invite_code"]:
                updates.append("invite_code = ?")
                params.append(generate_invite_code())
            updates.append("last_active = ?")
            params.append(now)

            if updates:
                params.append(username)
                cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE username = ?", params)
                conn.commit()
                row = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        conn.close()
        return dict(row)


def get_user_full_state(username: str):
    username = normalize_username(username)
    with db_lock:
        conn = get_db()
        cur = conn.cursor()
        u = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not u:
            conn.close()
            return None
        u_dict = dict(u)

        partner_dict = None
        p_uname = u_dict.get("partner_username")
        if p_uname:
            p = cur.execute("SELECT * FROM users WHERE username = ?", (p_uname,)).fetchone()
            if p:
                partner_dict = dict(p)

        conn.close()

    # Relationship start date: only for paired users; if single, empty string
    rel_start = ""
    if partner_dict:
        rel_start = u_dict.get("anniversary_date")
        if not rel_start:
            rel_start = partner_dict.get("anniversary_date")
        if not rel_start:
            if u_dict.get("paired_at"):
                rel_start = datetime.fromtimestamp(u_dict["paired_at"]).strftime("%Y-%m-%dT%H:%M:%S")
            elif partner_dict.get("paired_at"):
                rel_start = datetime.fromtimestamp(partner_dict["paired_at"]).strftime("%Y-%m-%dT%H:%M:%S")
            else:
                rel_start = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    webapp_url = get_current_webapp_url()
    invite_code = u_dict.get("invite_code") or "PAIR-XXXXXX"
    invite_link = f"https://t.me/{BOT_USERNAME}?start=pair_{invite_code}"

    # Default fallback avatars: distinct clean minimalist SVG avatars for user & partner
    user_photo = u_dict.get("photo_url") or "/img/avatar_me.svg"
    partner_photo = "/img/avatar_partner.svg"
    if partner_dict and partner_dict.get("photo_url"):
        partner_photo = partner_dict.get("photo_url")

    user_clean = {
        "username": u_dict["username"],
        "tgId": u_dict.get("tg_id"),
        "displayName": u_dict.get("display_name") or u_dict["username"],
        "photoUrl": user_photo,
        "inviteCode": invite_code,
        "inviteLink": invite_link,
        "moodEmoji": u_dict.get("mood_emoji") or "🥰",
        "moodLabel": u_dict.get("mood_label") or "Люблю",
        "moodReason": u_dict.get("mood_reason") or "",
        "moodUpdatedAt": u_dict.get("mood_updated_at") or 0,
        "moodReaction": u_dict.get("mood_reaction") or "",
        "moodReactionFrom": u_dict.get("mood_reaction_from") or "",
        "moodReactionAt": u_dict.get("mood_reaction_at") or 0,
        "lastActive": u_dict.get("last_active") or 0,
    }

    partner_clean = None
    if partner_dict:
        partner_clean = {
            "username": partner_dict["username"],
            "tgId": partner_dict.get("tg_id"),
            "displayName": partner_dict.get("display_name") or partner_dict["username"],
            "photoUrl": partner_photo,
            "moodEmoji": partner_dict.get("mood_emoji") or "🥰",
            "moodLabel": partner_dict.get("mood_label") or "Люблю",
            "moodReason": partner_dict.get("mood_reason") or "",
            "moodUpdatedAt": partner_dict.get("mood_updated_at") or 0,
            "moodReaction": partner_dict.get("mood_reaction") or "",
            "moodReactionFrom": partner_dict.get("mood_reaction_from") or "",
            "moodReactionAt": partner_dict.get("mood_reaction_at") or 0,
            "lastActive": partner_dict.get("last_active") or 0,
        }

    return {
        "ok": True,
        "user": user_clean,
        "partner": partner_clean,
        "isPaired": bool(partner_dict),
        "relationshipStart": rel_start,
        "serverTime": time.time(),
        "webappUrl": webapp_url,
        "botUsername": BOT_USERNAME,
    }


# ==============================================================================
# Telegram Bot Polling Worker & Menu Button Syncer
# ==============================================================================

def fetch_bot_info_from_telegram():
    global BOT_USERNAME
    if not BOT_TOKEN:
        return
    try:
        res = tg_api_call("getMe", {})
        if res and res.get("ok"):
            info = res.get("result", {})
            uname = info.get("username")
            if uname:
                BOT_USERNAME = uname
                print(f"[Telegram] Bot info synced dynamically: @{BOT_USERNAME} (name: {info.get('first_name')})")
    except Exception as e:
        print(f"[Telegram getMe Error] {e}")


def setup_bot_commands():
    ru_commands = [
        {"command": "start", "description": "💑 Открыть приложение «Двое»"},
        {"command": "menu", "description": "📋 Главное меню и кнопки"},
        {"command": "pair", "description": "🔗 Привязать вторую половинку"},
        {"command": "invite", "description": "📤 Пригласить партнёра (код)"},
        {"command": "about", "description": "📖 О приложении и возможностях"},
        {"command": "nudge", "description": "💌 Послать знак внимания"},
        {"command": "status", "description": "ℹ️ Проверить статус пары"},
        {"command": "unlink", "description": "💔 Отвязать текущую пару"},
        {"command": "support", "description": "💬 Написать разработчику в поддержку"},
    ]
    tg_api_call("setMyCommands", {
        "commands": ru_commands,
        "language_code": "ru"
    })
    default_commands = [
        {"command": "start", "description": "Open «Двое» couple app"},
        {"command": "menu", "description": "Show persistent menu & buttons"},
        {"command": "pair", "description": "Link with partner"},
        {"command": "invite", "description": "Invite partner (code)"},
        {"command": "about", "description": "About app features"},
        {"command": "nudge", "description": "Send sign of attention"},
        {"command": "status", "description": "Check relationship status"},
        {"command": "unlink", "description": "Unlink partner"},
        {"command": "support", "description": "Contact support / developer"},
    ]
    tg_api_call("setMyCommands", {
        "commands": default_commands
    })

    # Configure Bot Presentation (Name, Short Description & About Description) for default, ru, and en locales
    name_ru = "«Двое» 💕 Приложение для пары"
    name_en = "«Двое» 💕 Couple App"

    for lang, name in [("", name_ru), ("ru", name_ru), ("en", name_en)]:
        try:
            payload = {"name": name}
            if lang:
                payload["language_code"] = lang
            res = tg_api_call("setMyName", payload)
            if res and not res.get("ok"):
                # Telegram enforces strict rate limits on setMyName (once/twice per day)
                print(f"[Telegram setMyName {lang or 'default'}] {res.get('description', '')}")
        except Exception as e:
            print(f"[Telegram setMyName {lang} Error] {e}")

    sd_ru = "Эстетичное минималистичное пространство для пары. Точный счётчик времени вместе и статус партнёра 💕"
    sd_en = "Aesthetic minimalist space for couples. Accurate relationship counter and partner status 💕"
    for lang, sd in [("", sd_ru), ("ru", sd_ru), ("en", sd_en)]:
        try:
            payload = {"short_description": sd}
            if lang:
                payload["language_code"] = lang
            tg_api_call("setMyShortDescription", payload)
        except Exception as e:
            print(f"[Telegram setMyShortDescription {lang} Error] {e}")

    desc_ru = (
        "✨ «Двое» — эстетичное минималистичное пространство для любящей пары.\n\n"
        "Здесь вы сможете:\n"
        "⏳ Точный счётчик времени вместе — годы, месяцы, дни, часы, минуты и секунды\n"
        "💭 Настроение партнёра — статус в реальном времени с подробными пояснениями\n"
        "🖼 Фото 1:1 — профили с любимыми фотографиями\n"
        "💌 Знаки внимания вашей половинке в один клик 💕"
    )
    desc_en = (
        "✨ «Двое» (Two) — aesthetic minimalist space for loving couples.\n\n"
        "Features:\n"
        "⏳ Accurate relationship counter — years, months, days, hours, minutes and seconds\n"
        "💭 Partner mood & status in real time\n"
        "🖼 1:1 Couple profiles\n"
        "💌 Instant signs of attention 💕"
    )
    for lang, desc in [("", desc_ru), ("ru", desc_ru), ("en", desc_en)]:
        try:
            payload = {"description": desc}
            if lang:
                payload["language_code"] = lang
            tg_api_call("setMyDescription", payload)
        except Exception as e:
            print(f"[Telegram setMyDescription {lang} Error] {e}")


_last_global_menu_url = ""
_bot_commands_configured = False

def ensure_global_menu_and_commands(force_commands: bool = False):
    global _last_global_menu_url, _bot_commands_configured
    curr_url = get_current_webapp_url()
    if curr_url and curr_url.startswith("https://") and curr_url != _last_global_menu_url:
        res = tg_api_call("setChatMenuButton", {
            "menu_button": {
                "type": "web_app",
                "text": "💑 Двое",
                "web_app": {"url": curr_url}
            }
        })
        if res and res.get("ok"):
            _last_global_menu_url = curr_url
    if not _bot_commands_configured or force_commands:
        setup_bot_commands()
        _bot_commands_configured = True


def update_menu_button_periodically():
    while True:
        try:
            ensure_global_menu_and_commands()
        except Exception as e:
            print(f"[Menu Button Syncer] {e}")
        time.sleep(15)


def telegram_polling_worker():
    """Bot worker: handles /start (with pair_<code>), /pair, /unlink, /support tickets & callbacks."""
    offset = 0
    print("[Bot Worker] Telegram polling started...")
    ensure_global_menu_and_commands()
    while True:
        try:
            res = tg_api_call("getUpdates", {"offset": offset, "timeout": 15})
            if not res or not res.get("ok"):
                time.sleep(3)
                continue

            for upd in res.get("result", []):
                offset = max(offset, upd["update_id"] + 1)

                # Handle Callback Queries
                if "callback_query" in upd:
                    cq = upd["callback_query"]
                    cq_id = cq["id"]
                    from_u = cq.get("from", {})
                    chat_id = from_u.get("id")
                    ensure_chat_menu_button(chat_id)
                    raw_u = from_u.get("username") or ""
                    d_name = from_u.get("first_name") or ""
                    u_row = ensure_user(raw_u, display_name=d_name, tg_id=chat_id)
                    uname = u_row["username"] if (u_row and u_row.get("username")) else normalize_username(raw_u or f"user_{chat_id}")
                    data = cq.get("data", "")

                    tg_api_call("answerCallbackQuery", {"callback_query_id": cq_id})

                    if data == "enter_pair_code":
                        with db_lock:
                            conn = get_db()
                            conn.execute("INSERT OR REPLACE INTO pair_sessions (tg_id, state, updated_at) VALUES (?, 'awaiting_code', ?)", (chat_id, time.time()))
                            conn.commit()
                            conn.close()
                        st = get_user_full_state(uname)
                        u_info = st["user"] if st else {}
                        my_code = u_info.get("inviteCode", "PAIR-XXXXXX")
                        share_text = urllib.parse.quote(f"Привет! Присоединяйся ко мне в приложении «Двое» 💕\nНаш код пары: {my_code}")
                        share_url = f"https://t.me/share/url?url=https://t.me/{BOT_USERNAME}?start=pair_{my_code}&text={share_text}"
                        tg_send_message(
                            chat_id,
                            "🔗 <b>Привязка партнёра</b>\n\n"
                            f"Ваш персональный код: <code>{my_code}</code>\n\n"
                            "Отправьте код вашей второй половинки (например: <code>PAIR-1CAAF2</code>) ответным сообщением:",
                            reply_markup={
                                "inline_keyboard": [
                                    [{"text": "📤 Поделиться моим кодом", "url": share_url}],
                                    [{"text": "❌ Отмена", "callback_data": "cancel_pair_code"}]
                                ]
                            }
                        )
                    elif data == "cancel_pair_code":
                        with db_lock:
                            conn = get_db()
                            conn.execute("DELETE FROM pair_sessions WHERE tg_id = ?", (chat_id,))
                            conn.commit()
                            conn.close()
                        tg_send_message(chat_id, "Привязка отменена.")
                    elif data == "support_prompt":
                        with db_lock:
                            conn = get_db()
                            conn.execute("INSERT OR REPLACE INTO support_sessions (tg_id, state, updated_at) VALUES (?, 'awaiting_ticket', ?)", (chat_id, time.time()))
                            conn.commit()
                            conn.close()
                        tg_send_message(
                            chat_id,
                            "💬 <b>Связь с разработчиком</b>\n\n"
                            "Напишите ваше пожелание, вопрос в поддержку или предложение о сотрудничестве одним сообщением — "
                            "оно сразу будет передано разработчику:",
                            reply_markup={"inline_keyboard": [[{"text": "❌ Отмена", "callback_data": "cancel_support"}]]}
                        )
                    elif data == "cancel_support":
                        with db_lock:
                            conn = get_db()
                            conn.execute("DELETE FROM support_sessions WHERE tg_id = ?", (chat_id,))
                            conn.commit()
                            conn.close()
                        tg_send_message(chat_id, "Действие отменено.")
                    elif data == "show_pair_code":
                        st = get_user_full_state(uname)
                        inv_code = st["user"]["inviteCode"] if st else "PAIR-XXXXXX"
                        share_text = urllib.parse.quote(f"Привет! Присоединяйся ко мне в приложении «Двое» 💕\nНаш код пары: {inv_code}")
                        share_url = f"https://t.me/share/url?url=https://t.me/{BOT_USERNAME}?start=pair_{inv_code}&text={share_text}"
                        tg_send_message(
                            chat_id,
                            f"🔗 <b>Ваш код пары:</b> <code>{inv_code}</code>\n\n"
                            f"Перешлите партнёру ссылку для быстрого подключения:\n"
                            f"https://t.me/{BOT_USERNAME}?start=pair_{inv_code}",
                            reply_markup={"inline_keyboard": [
                                [{"text": "📤 Поделиться в Telegram", "url": share_url}],
                                [{"text": "💑 Открыть Двое", "web_app": {"url": get_current_webapp_url()}}]
                            ]}
                        )
                    elif data == "about_app":
                        st = get_user_full_state(uname)
                        inv_code = st["user"]["inviteCode"] if st else "PAIR-XXXXXX"
                        share_text = urllib.parse.quote(f"Привет! Присоединяйся ко мне в приложении «Двое» 💕\nНаш код пары: {inv_code}")
                        share_url = f"https://t.me/share/url?url=https://t.me/{BOT_USERNAME}?start=pair_{inv_code}&text={share_text}"
                        about_kb = [
                            [{"text": "💑 Открыть «Двое»", "web_app": {"url": get_current_webapp_url()}}],
                            [
                                {"text": "🔗 Привязать партнёра", "callback_data": "enter_pair_code"},
                                {"text": "📤 Пригласить партнёра", "url": share_url}
                            ],
                            [{"text": "💬 Связь с разработчиком", "callback_data": "support_prompt"}]
                        ]
                        tg_send_message(
                            chat_id,
                            ABOUT_APP_TEXT,
                            reply_markup={"inline_keyboard": about_kb}
                        )
                    continue

                # Handle Messages
                if "message" in upd:
                    msg = upd["message"]
                    chat_id = msg.get("chat", {}).get("id") or msg.get("from", {}).get("id")
                    from_user = msg.get("from", {})
                    tg_id = from_user.get("id") or chat_id
                    raw_u = from_user.get("username") or ""
                    first_name = from_user.get("first_name") or ""
                    u_row = ensure_user(raw_u, display_name=first_name, tg_id=tg_id)
                    uname = u_row["username"] if (u_row and u_row.get("username")) else normalize_username(raw_u or f"user_{tg_id}")
                    ensure_chat_menu_button(chat_id)

                    text = (msg.get("text") or "").strip()
                    webapp_url = get_current_webapp_url()
                    user_webapp_url = f"{webapp_url}?tg_user={uname}&tg_id={tg_id}" if (webapp_url and webapp_url.startswith("https://")) else webapp_url

                    KNOWN_MENU_ACTIONS = {
                        "💑 Открыть «Двое»", "🔗 Привязать партнёра", "📤 Пригласить партнёра",
                        "📖 О приложении", "💬 Связь с разработчиком", "💌 Послать знак внимания", "ℹ️ Мой статус"
                    }

                    # 1. Admin Reply to Support Ticket Forwarding
                    if tg_id == ADMIN_TG_ID and msg.get("reply_to_message") and not text.startswith("/"):
                        orig = msg["reply_to_message"].get("text", "")
                        m_uid = re.search(r"TG ID:\s*<code>?(\d+)</code>?", orig)
                        if m_uid:
                            user_dest_id = int(m_uid.group(1))
                            tg_send_message(
                                user_dest_id,
                                f"📬 <b>Ответ разработчика «Двое»:</b>\n\n{text}\n\n<i>Приятного пользования приложением! 💕</i>",
                                reply_markup={"inline_keyboard": [[{"text": "💑 Открыть «Двое»", "web_app": {"url": webapp_url}}]]}
                            )
                            tg_send_message(ADMIN_TG_ID, f"✅ Ответ успешно передан пользователю (TG ID: <code>{user_dest_id}</code>).")
                            continue

                    # 2. Check Support Session
                    in_support = False
                    with db_lock:
                        conn = get_db()
                        sess = conn.execute("SELECT state FROM support_sessions WHERE tg_id = ?", (tg_id,)).fetchone()
                        if sess and sess["state"] == "awaiting_ticket":
                            in_support = True
                        conn.close()

                    if in_support and (text.startswith("/") or text in KNOWN_MENU_ACTIONS):
                        with db_lock:
                            conn = get_db()
                            conn.execute("DELETE FROM support_sessions WHERE tg_id = ?", (tg_id,))
                            conn.commit()
                            conn.close()
                        in_support = False

                    if in_support:
                        with db_lock:
                            conn = get_db()
                            conn.execute(
                                "INSERT INTO support_tickets (tg_id, username, display_name, message, message_text, category, created_at, status) VALUES (?, ?, ?, ?, ?, 'support', ?, 'new')",
                                (tg_id, uname, first_name, text, text, time.time())
                            )
                            conn.execute("DELETE FROM support_sessions WHERE tg_id = ?", (tg_id,))
                            conn.commit()
                            conn.close()

                        # Forward to admin
                        admin_msg = (
                            f"📩 <b>Новое обращение в «Двое»!</b>\n\n"
                            f"👤 <b>От:</b> {first_name} (@{uname})\n"
                            f"🆔 <b>TG ID:</b> <code>{tg_id}</code>\n\n"
                            f"💬 <b>Текст:</b>\n{text}"
                        )
                        tg_send_message(ADMIN_TG_ID, admin_msg)

                        # Confirm to user
                        tg_send_message(
                            chat_id,
                            "✅ <b>Спасибо!</b> Ваше сообщение успешно отправлено разработчику 💕\n"
                            "Мы ответим вам в ближайшее время прямо здесь в боте.",
                            reply_markup=get_main_reply_keyboard()
                        )
                        continue

                    # 3. Check Pair Session OR Direct Code Input
                    in_pair_session = False
                    with db_lock:
                        conn = get_db()
                        psess = conn.execute("SELECT state FROM pair_sessions WHERE tg_id = ?", (tg_id,)).fetchone()
                        if psess and psess["state"] == "awaiting_code":
                            in_pair_session = True
                        conn.close()

                    if in_pair_session and (text.startswith("/") or text in KNOWN_MENU_ACTIONS):
                        with db_lock:
                            conn = get_db()
                            conn.execute("DELETE FROM pair_sessions WHERE tg_id = ?", (tg_id,))
                            conn.commit()
                            conn.close()
                        in_pair_session = False

                    extracted_code = ""
                    m_pair = re.search(r"\b(PAIR-[A-Z0-9]{6})\b", text, re.IGNORECASE)
                    if m_pair:
                        extracted_code = m_pair.group(1).upper()
                    elif in_pair_session and not text.startswith("/"):
                        cleaned = text.strip().upper()
                        if re.match(r"^[A-Z0-9]{6}$", cleaned):
                            extracted_code = f"PAIR-{cleaned}"
                        elif re.match(r"^PAIR-[A-Z0-9]{6}$", cleaned):
                            extracted_code = cleaned

                    if extracted_code:
                        with db_lock:
                            conn = get_db()
                            cur = conn.cursor()
                            target = cur.execute("SELECT * FROM users WHERE invite_code = ? AND username != ?", (extracted_code, uname)).fetchone()
                            conn.execute("DELETE FROM pair_sessions WHERE tg_id = ?", (tg_id,))
                            conn.commit()
                            conn.close()

                        if not target:
                            tg_send_message(
                                chat_id,
                                "❌ Партнёр с таким кодом не найден. Проверьте правильность кода и попробуйте снова:",
                                reply_markup={"inline_keyboard": [[{"text": "🔄 Ввести код снова", "callback_data": "enter_pair_code"}]]}
                            )
                            continue

                        target_uname = target["username"]
                        paired = pair_users(uname, target_uname)
                        if paired:
                            tg_send_message(
                                chat_id,
                                f"🎉 <b>Поздравляем!</b> Вы успешно соединились с <b>{target['display_name']}</b> 💕\n\n"
                                "Откройте приложение «Двое», чтобы видеть общий счётчик и настроение партнёра!",
                                reply_markup=get_main_reply_keyboard()
                            )
                            if target["tg_id"]:
                                tg_send_message(
                                    target["tg_id"],
                                    f"🎉 <b>Поздравляем!</b> <b>{first_name}</b> соединился(-ась) с вами в приложении «Двое» 💕",
                                    reply_markup=get_main_reply_keyboard()
                                )
                        else:
                            tg_send_message(chat_id, "❌ Не удалось привязать пару. Попробуйте позже.", reply_markup=get_main_reply_keyboard())
                        continue

                    # If user is in pair session but typed an invalid code (and didn't select a menu button)
                    if in_pair_session and not text.startswith("/") and text not in KNOWN_MENU_ACTIONS:
                        tg_send_message(
                            chat_id,
                            "⚠️ <b>Неверный формат кода.</b>\n\n"
                            "Отправьте код вашей второй половинки (например: <code>PAIR-1CAAF2</code> или 6 символов <code>1CAAF2</code>) либо нажмите «❌ Отмена»:",
                            reply_markup={"inline_keyboard": [[{"text": "❌ Отмена", "callback_data": "cancel_pair_code"}]]}
                        )
                        continue

                    # 4. Command: /support
                    if text.startswith("/support"):
                        inline_text = text[len("/support"):].strip()
                        if inline_text:
                            with db_lock:
                                conn = get_db()
                                conn.execute(
                                    "INSERT INTO support_tickets (tg_id, username, display_name, message, message_text, category, created_at, status) VALUES (?, ?, ?, ?, ?, 'support', ?, 'new')",
                                    (tg_id, uname, first_name, inline_text, inline_text, time.time())
                                )
                                conn.commit()
                                conn.close()
                            admin_msg = (
                                f"📩 <b>Новое обращение в «Двое»!</b>\n\n"
                                f"👤 <b>От:</b> {first_name} (@{uname})\n"
                                f"🆔 <b>TG ID:</b> <code>{tg_id}</code>\n\n"
                                f"💬 <b>Текст:</b>\n{inline_text}"
                            )
                            tg_send_message(ADMIN_TG_ID, admin_msg)
                            tg_send_message(
                                chat_id,
                                "✅ <b>Спасибо!</b> Ваше обращение передано разработчику 💕",
                                reply_markup=get_main_reply_keyboard()
                            )
                        else:
                            with db_lock:
                                conn = get_db()
                                conn.execute("INSERT OR REPLACE INTO support_sessions (tg_id, state, updated_at) VALUES (?, 'awaiting_ticket', ?)", (tg_id, time.time()))
                                conn.commit()
                                conn.close()
                            tg_send_message(
                                chat_id,
                                "💬 <b>Связь с разработчиком</b>\n\n"
                                "Напишите ваш вопрос, пожелание или предложение одним сообщением — "
                                "оно сразу будет передано разработчику:",
                                reply_markup={"inline_keyboard": [[{"text": "❌ Отмена", "callback_data": "cancel_support"}]]}
                            )
                        continue

                    # 5. Command: /pair <code> or Menu Button "🔗 Привязать партнёра"
                    if text in ("🔗 Привязать партнёра", "привязать партнёра", "привязать", "/pair") or text.startswith("/pair"):
                        code = text[len("/pair"):].strip().upper() if text.startswith("/pair") else ""
                        if not code:
                            st = get_user_full_state(uname)
                            user = st["user"] if st else {}
                            partner = st.get("partner") if st else None
                            inv_code = user.get("inviteCode", "PAIR-XXXXXX")
                            share_text = urllib.parse.quote(f"Привет! Присоединяйся ко мне в приложении «Двое» 💕\nНаш код пары: {inv_code}")
                            share_url = f"https://t.me/share/url?url=https://t.me/{BOT_USERNAME}?start=pair_{inv_code}&text={share_text}"

                            if partner:
                                partner_name = html.escape((partner.get("displayName") or f"@{partner.get('username')}").strip())
                                tg_send_message(
                                    chat_id,
                                    f"💕 <b>У вас уже привязана пара!</b>\n\n"
                                    f"Ваша вторая половинка: <b>{partner_name}</b> (@{partner.get('username')}).\n\n"
                                    "Если вы хотите подключить другого человека, сначала отвяжите текущую пару с помощью команды /unlink.",
                                    reply_markup=get_main_reply_keyboard()
                                )
                                continue

                            with db_lock:
                                conn = get_db()
                                conn.execute("INSERT OR REPLACE INTO pair_sessions (tg_id, state, updated_at) VALUES (?, 'awaiting_code', ?)", (tg_id, time.time()))
                                conn.commit()
                                conn.close()

                            msg = (
                                "🔗 <b>Привязка партнёра</b>\n\n"
                                f"Ваш персональный код: <code>{inv_code}</code>\n\n"
                                "Отправьте код вашей второй половинки (например: <code>PAIR-1CAAF2</code>) следующим сообщением:"
                            )
                            kb = [
                                [{"text": "📤 Поделиться моим кодом", "url": share_url}],
                                [{"text": "❌ Отмена", "callback_data": "cancel_pair_code"}]
                            ]
                            tg_send_message(
                                chat_id,
                                msg,
                                reply_markup={"inline_keyboard": kb}
                            )
                            continue

                        with db_lock:
                            conn = get_db()
                            cur = conn.cursor()
                            target = cur.execute("SELECT * FROM users WHERE invite_code = ? AND username != ?", (code, uname)).fetchone()
                            conn.close()

                        if not target:
                            tg_send_message(chat_id, "❌ Партнёр с таким кодом не найден. Проверьте правильность кода.", reply_markup=get_main_reply_keyboard())
                            continue

                        target_uname = target["username"]
                        paired = pair_users(uname, target_uname)
                        if paired:
                            tg_send_message(
                                chat_id,
                                f"🎉 <b>Поздравляем!</b> Вы успешно соединились с <b>{target['display_name']}</b> 💕\n\n"
                                "Откройте приложение, чтобы увидеть ваш общий счётчик времени и настроение партнёра!",
                                reply_markup=get_main_reply_keyboard()
                            )
                            if target["tg_id"]:
                                tg_send_message(
                                    target["tg_id"],
                                    f"🎉 <b>Поздравляем!</b> <b>{first_name}</b> соединился(-ась) с вами в приложении «Двое» 💕",
                                    reply_markup=get_main_reply_keyboard()
                                )
                        continue

                    # 6. Command: /unlink
                    if text.startswith("/unlink"):
                        p_uname = unlink_user(uname)
                        if p_uname:
                            with db_lock:
                                conn = get_db()
                                p = conn.execute("SELECT tg_id FROM users WHERE username = ?", (p_uname,)).fetchone()
                                conn.close()
                            tg_send_message(chat_id, "💔 Вы отвязали партнёра. Теперь вы можете подключить новую пару.", reply_markup=get_main_reply_keyboard())
                            if p and p["tg_id"]:
                                tg_send_message(p["tg_id"], f"💔 Партнёр @{uname} отвязал пару.", reply_markup=get_main_reply_keyboard())
                        else:
                            tg_send_message(chat_id, "У вас нет привязанного партнёра.", reply_markup=get_main_reply_keyboard())
                        continue

                    # 7. Command: /start (including /start pair_<code>)
                    if text.startswith("/start"):
                        parts = text.split()
                        pair_param = parts[1] if len(parts) > 1 else ""

                        paired_now = False
                        inviter_name = ""
                        if pair_param.startswith("pair_"):
                            code = pair_param[len("pair_"):].strip().upper()
                            with db_lock:
                                conn = get_db()
                                cur = conn.cursor()
                                target = cur.execute("SELECT * FROM users WHERE invite_code = ? AND username != ?", (code, uname)).fetchone()
                                conn.close()
                            if target:
                                target_uname = target["username"]
                                inviter_name = (target["display_name"] or "").strip() or f"@{target_uname}"
                                if pair_users(uname, target_uname):
                                    paired_now = True
                                    if target["tg_id"]:
                                        tg_send_message(
                                            target["tg_id"],
                                            f"🎉 <b>{html.escape(first_name)}</b> перешёл(-ла) по вашей ссылке и соединился(-ась) с вами! 💕",
                                            reply_markup=get_main_reply_keyboard()
                                        )

                        st = get_user_full_state(uname)
                        inv_code = st["user"]["inviteCode"] if st else "PAIR-XXXXXX"
                        share_text = urllib.parse.quote(f"Привет! Присоединяйся ко мне в приложении «Двое» 💕\nНаш код пары: {inv_code}")
                        share_url = f"https://t.me/share/url?url=https://t.me/{BOT_USERNAME}?start=pair_{inv_code}&text={share_text}"

                        if paired_now:
                            welcome = (
                                f"🎉 <b>Вы успешно соединились с {html.escape(inviter_name)}!</b> 💕\n\n"
                                "Теперь в приложении «Двое» вы можете:\n"
                                "⏳ Отслеживать сколько вы вместе (годы, месяцы, дни, часы, минуты, секунды)\n"
                                "💭 Видеть настроение друг друга в реальном времени с подробными пояснениями\n"
                                "🖼 Менять и просматривать фотографии 1:1"
                            )
                        else:
                            welcome = (
                                "✨ <b>«Двое»</b> — эстетичное минималистичное пространство для любящей пары.\n\n"
                                "Здесь вы сможете:\n"
                                "⏳ <b>Точный счётчик времени вместе</b> — годы, месяцы, дни, часы, минуты и секунды\n"
                                "💭 <b>Настроение партнёра</b> — статус в реальном времени с пояснениями, почему такое настроение\n"
                                "🖼 <b>Фото 1:1</b> — профили с любимыми фотографиями\n\n"
                                f"🔗 <b>Ваш код для пары:</b> <code>{inv_code}</code>"
                            )

                        kb = [
                            [{"text": "💑 Открыть «Двое»", "web_app": {"url": user_webapp_url}}],
                            [
                                {"text": "🔗 Привязать партнёра", "callback_data": "enter_pair_code"},
                                {"text": "📤 Пригласить партнёра", "url": share_url}
                            ],
                            [{"text": "📖 О приложении", "callback_data": "about_app"}],
                            [{"text": "💬 Связь с разработчиком", "callback_data": "support_prompt"}]
                        ]
                        tg_send_photo(chat_id, BANNER_IMAGE_PATH, welcome, reply_markup={"inline_keyboard": kb})
                        tg_send_message(
                            chat_id,
                            "💫 <b>Быстрое меню закреплено внизу экрана:</b> вы можете в любой момент отправить знак внимания или проверить статус!",
                            reply_markup=get_main_reply_keyboard()
                        )
                        continue

                    # 8. Command: Nudge / Sign of Attention
                    if text in ("💌 Послать знак внимания", "/nudge", "знак внимания") or text.startswith("/nudge") or "послать знак внимания" in text.lower():
                        with db_lock:
                            conn = get_db()
                            cur = conn.cursor()
                            u_row = cur.execute("SELECT display_name, partner_username FROM users WHERE username = ?", (uname,)).fetchone()
                            p_uname = u_row["partner_username"] if u_row else None
                            p_row = None
                            if p_uname:
                                p_row = cur.execute("SELECT tg_id, display_name FROM users WHERE username = ?", (p_uname,)).fetchone()
                                cur.execute(
                                    "UPDATE users SET mood_reaction = '❤️', mood_reaction_from = ?, mood_reaction_at = ? WHERE username = ?",
                                    (uname, time.time(), p_uname)
                                )
                                conn.commit()
                            conn.close()

                        if not p_uname:
                            tg_send_message(
                                chat_id,
                                "💔 <b>У вас пока нет привязанного партнёра.</b>\n\n"
                                "Используйте команду /pair или передайте ваш код для подключения второй половинке.",
                                reply_markup=get_main_reply_keyboard()
                            )
                        else:
                            sender_name = html.escape(((u_row["display_name"] if u_row else None) or "").strip() or f"@{uname}")
                            partner_name = html.escape(((p_row["display_name"] if p_row else None) or "").strip() or p_uname)
                            if p_row and p_row["tg_id"]:
                                tg_send_message(
                                    p_row["tg_id"],
                                    f"❤️ <b>{sender_name} думает о вас и шлёт вам знак внимания!</b> 💕",
                                    reply_markup={"inline_keyboard": [[{"text": "💑 Открыть «Двое»", "web_app": {"url": webapp_url}}]]}
                                )
                                tg_send_message(
                                    chat_id,
                                    f"❤️ <b>Знак внимания отправлен для {partner_name}!</b> 💕\n<i>Партнёр получит мгновенное уведомление в Telegram.</i>",
                                    reply_markup=get_main_reply_keyboard()
                                )
                            else:
                                tg_send_message(
                                    chat_id,
                                    f"❤️ <b>Знак внимания сохранён для {partner_name}!</b> 💕\n<i>Партнёр увидит его при входе в приложение.</i>",
                                    reply_markup=get_main_reply_keyboard()
                                )
                        continue

                    # 9. Command: Status
                    if text in ("ℹ️ Мой статус", "/status", "мой статус") or text.startswith("/status") or "мой статус" in text.lower():
                        st = get_user_full_state(uname)
                        user = st["user"] if st else {}
                        partner = st.get("partner")
                        inv_code = user.get("inviteCode", "PAIR-XXXXXX")
                        user_name = html.escape((user.get("displayName") or f"@{uname}").strip())
                        user_mood = f"{user.get('moodEmoji', '🥰')} {html.escape(user.get('moodLabel', 'Люблю'))}"
                        user_reason = html.escape((user.get("moodReason") or "").strip())

                        if partner:
                            p_name = html.escape((partner.get("displayName") or f"@{partner.get('username')}").strip())
                            p_mood = f"{partner.get('moodEmoji', '🥰')} {html.escape(partner.get('moodLabel', 'Люблю'))}"
                            p_reason = html.escape((partner.get("moodReason") or "").strip())
                            rel_start = st.get("relationshipStart")
                            days_str = ""
                            if rel_start:
                                try:
                                    dt_rel = datetime.strptime(str(rel_start)[:10], "%Y-%m-%d")
                                    days_cnt = max(0, (datetime.now() - dt_rel).days)
                                    days_str = f"⏳ <b>Дней вместе:</b> {days_cnt} дн.\n"
                                except Exception:
                                    pass

                            status_text = (
                                f"💑 <b>Статус вашей пары</b>\n\n"
                                f"👤 <b>Вы:</b> {user_name}\n"
                                f"💭 <b>Ваше настроение:</b> {user_mood}" + (f"\n<i>«{user_reason}»</i>" if user_reason else "") + "\n\n"
                                f"❤️ <b>Партнёр:</b> {p_name}\n"
                                f"💭 <b>Настроение партнёра:</b> {p_mood}" + (f"\n<i>«{p_reason}»</i>" if p_reason else "") + "\n\n"
                                f"{days_str}"
                                f"🔗 <b>Код пары:</b> <code>{inv_code}</code>"
                            )
                        else:
                            status_text = (
                                f"ℹ️ <b>Ваш статус</b>\n\n"
                                f"👤 <b>Имя:</b> {user_name}\n"
                                f"💭 <b>Настроение:</b> {user_mood}" + (f"\n<i>«{user_reason}»</i>" if user_reason else "") + "\n"
                                f"💔 <b>Партнёр:</b> не подключён\n\n"
                                f"🔗 <b>Ваш код для пары:</b> <code>{inv_code}</code>\n"
                                f"Передайте этот код второй половинке, чтобы соединиться!"
                            )

                        tg_send_message(
                            chat_id,
                            status_text,
                            reply_markup=get_main_reply_keyboard()
                        )
                        continue

                    # 10. Open WebApp command
                    if text in ("💑 Открыть «Двое»", "/open", "/app", "/dvoe", "/webapp", "открыть «двое»", "открыть двое", "двое"):
                        tg_send_message(
                            chat_id,
                            "✨ Нажмите кнопку ниже, чтобы открыть приложение «Двое» 💕",
                            reply_markup={"inline_keyboard": [[{"text": "💑 Открыть «Двое»", "web_app": {"url": user_webapp_url}}]]}
                        )
                        continue

                    # 10b. Menu command
                    if text in ("/menu", "меню", "/help", "помощь") or text.startswith("/menu"):
                        st = get_user_full_state(uname)
                        inv_code = st["user"]["inviteCode"] if st else "PAIR-XXXXXX"
                        share_text = urllib.parse.quote(f"Привет! Присоединяйся ко мне в приложении «Двое» 💕\nНаш код пары: {inv_code}")
                        share_url = f"https://t.me/share/url?url=https://t.me/{BOT_USERNAME}?start=pair_{inv_code}&text={share_text}"
                        menu_kb = [
                            [{"text": "💑 Открыть «Двое»", "web_app": {"url": user_webapp_url}}],
                            [
                                {"text": "🔗 Привязать партнёра", "callback_data": "enter_pair_code"},
                                {"text": "📤 Пригласить партнёра", "url": share_url}
                            ],
                            [{"text": "📖 О приложении", "callback_data": "about_app"}],
                            [{"text": "💬 Связь с разработчиком", "callback_data": "support_prompt"}]
                        ]
                        tg_send_message(
                            chat_id,
                            "📋 <b>Главное меню «Двое» 💕</b>\n\n"
                            "Кнопки быстрого доступа всегда закреплены внизу экрана:\n"
                            "• <b>💑 Открыть «Двое»</b> — открыть приложение для вашей пары\n"
                            "• <b>🔗 Привязать партнёра</b> — соединить профили по коду\n"
                            "• <b>📤 Пригласить партнёра</b> — получить персональный код для второй половинки\n"
                            "• <b>📖 О приложении</b> — узнать о возможностях сервиса\n"
                            "• <b>💬 Связь с разработчиком</b> — поддержка и предложения\n"
                            "• <b>💌 Послать знак внимания</b> — отправить мгновенное уведомление половинке\n"
                            "• <b>ℹ️ Мой статус</b> — проверить дни вместе и статус партнёра",
                            reply_markup={"inline_keyboard": menu_kb}
                        )
                        tg_send_message(
                            chat_id,
                            "💫 <b>Быстрое меню закреплено внизу экрана</b> для доступа в любой момент:",
                            reply_markup=get_main_reply_keyboard()
                        )
                        continue

                    # 10c. About App
                    if text in ("📖 О приложении", "/about", "о приложении", "о проекте") or text.startswith("/about"):
                        st = get_user_full_state(uname)
                        inv_code = st["user"]["inviteCode"] if st else "PAIR-XXXXXX"
                        share_text = urllib.parse.quote(f"Привет! Присоединяйся ко мне в приложении «Двое» 💕\nНаш код пары: {inv_code}")
                        share_url = f"https://t.me/share/url?url=https://t.me/{BOT_USERNAME}?start=pair_{inv_code}&text={share_text}"
                        about_kb = [
                            [{"text": "💑 Открыть «Двое»", "web_app": {"url": webapp_url}}],
                            [
                                {"text": "🔗 Привязать партнёра", "callback_data": "enter_pair_code"},
                                {"text": "📤 Пригласить партнёра", "url": share_url}
                            ],
                            [{"text": "💬 Связь с разработчиком", "callback_data": "support_prompt"}]
                        ]
                        tg_send_message(
                            chat_id,
                            ABOUT_APP_TEXT,
                            reply_markup={"inline_keyboard": about_kb}
                        )
                        continue

                    # 10d. Invite Partner
                    if text in ("📤 Пригласить партнёра", "/invite", "пригласить партнёра", "пригласить") or text.startswith("/invite"):
                        st = get_user_full_state(uname)
                        inv_code = st["user"]["inviteCode"] if st else "PAIR-XXXXXX"
                        share_text = urllib.parse.quote(f"Привет! Присоединяйся ко мне в приложении «Двое» 💕\nНаш код пары: {inv_code}")
                        share_url = f"https://t.me/share/url?url=https://t.me/{BOT_USERNAME}?start=pair_{inv_code}&text={share_text}"
                        invite_msg = (
                            "🔗 <b>Приглашение партнёра</b> 💕\n\n"
                            f"Ваш персональный код пары: <code>{inv_code}</code>\n\n"
                            "Отправьте этот код второй половинке или перешлите готовую ссылку-приглашение:"
                        )
                        tg_send_message(
                            chat_id,
                            invite_msg,
                            reply_markup={"inline_keyboard": [
                                [{"text": "📤 Поделиться ссылкой", "url": share_url}],
                                [{"text": "💑 Открыть «Двое»", "web_app": {"url": user_webapp_url}}]
                            ]}
                        )
                        continue

                    # 10e. Support button from keyboard
                    if text in ("💬 Связь с разработчиком", "связь с разработчиком", "поддержка"):
                        with db_lock:
                            conn = get_db()
                            conn.execute("INSERT OR REPLACE INTO support_sessions (tg_id, state, updated_at) VALUES (?, 'awaiting_ticket', ?)", (chat_id, time.time()))
                            conn.commit()
                            conn.close()
                        tg_send_message(
                            chat_id,
                            "💬 <b>Связь с разработчиком</b>\n\n"
                            "Напишите ваш вопрос, пожелание или предложение одним сообщением — "
                            "оно сразу будет передано разработчику:",
                            reply_markup={"inline_keyboard": [[{"text": "❌ Отмена", "callback_data": "cancel_support"}]]}
                        )
                        continue

                    # 11. Default fallback message
                    st = get_user_full_state(uname)
                    inv_code = st["user"]["inviteCode"] if st else "PAIR-XXXXXX"
                    share_text = urllib.parse.quote(f"Привет! Присоединяйся ко мне в приложении «Двое» 💕\nНаш код пары: {inv_code}")
                    share_url = f"https://t.me/share/url?url=https://t.me/{BOT_USERNAME}?start=pair_{inv_code}&text={share_text}"
                    tg_send_message(
                        chat_id,
                        f"✨ <b>Приложение «Двое» 💕</b>\n\n🔗 Ваш код пары: <code>{inv_code}</code>\n\nИспользуйте кнопки меню внизу для быстрого доступа!",
                        reply_markup=get_main_reply_keyboard()
                    )

        except Exception as e:
            print(f"[Bot Worker Exception] {e}")
            time.sleep(4)


# ==============================================================================
# HTTP Request Handler
# ==============================================================================

class DvoeHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        if self.path.startswith("/api/"):
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data: dict, code: int = 200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self) -> dict:
        content_len = int(self.headers.get("Content-Length", 0))
        if content_len <= 0:
            return {}
        raw = self.rfile.read(content_len)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)

        # Health endpoint
        if path == "/api/health":
            self.send_json({"ok": True, "status": "healthy", "app": "Двое", "version": "2.0.0"})
            return

        # State endpoint: /api/state or /api/user-state
        if path in ("/api/state", "/api/user-state", "/api/sync"):
            raw_uname = qs.get("username", [""])[0] or qs.get("tg_user", [""])[0] or qs.get("user", [""])[0]
            tg_id = int(qs.get("tg_id", [0])[0]) if qs.get("tg_id") else None
            uname, tg_id = resolve_canonical_username(raw_uname, tg_id)
            if not uname and not tg_id:
                uname = "ksjjfnnn"

            d_name = qs.get("displayName", [""])[0]
            photo_url = qs.get("photo_url", [""])[0]

            u_info = ensure_user(uname, display_name=d_name, tg_id=tg_id, photo_url=photo_url)
            if u_info and u_info.get("username"):
                uname = u_info["username"]
            state = get_user_full_state(uname)
            if not state:
                self.send_json({"ok": False, "error": "User not found"}, 404)
                return

            if tg_id:
                ensure_chat_menu_button(tg_id)
            if state.get("partner") and state["partner"].get("tgId"):
                ensure_chat_menu_button(state["partner"]["tgId"])

            self.send_json(state)
            return

        # Profile / Name endpoint
        if path in ("/api/profile", "/api/user/name", "/api/profile/name"):
            raw_uname = qs.get("username", [""])[0] or qs.get("tg_user", [""])[0]
            tg_id = int(qs.get("tg_id", [0])[0]) if qs.get("tg_id") else None
            uname, tg_id = resolve_canonical_username(raw_uname, tg_id)
            if not uname:
                self.send_json({"ok": False, "error": "Username required"}, 400)
                return
            state = get_user_full_state(uname)
            if not state:
                self.send_json({"ok": False, "error": "User not found"}, 404)
                return
            self.send_json({"ok": True, "displayName": state["user"]["displayName"], "user": state["user"]})
            return

        # Fallback to static files
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        data = self.read_json_body()
        raw_uname = data.get("username", "") or data.get("tg_user", "") or data.get("user", "")
        tg_id = int(data.get("tg_id", 0)) if data.get("tg_id") else None
        uname, tg_id = resolve_canonical_username(raw_uname, tg_id)

        if not uname:
            self.send_json({"ok": False, "error": "Username required"}, 400)
            return

        u_info = ensure_user(uname, tg_id=tg_id)
        if u_info and u_info.get("username"):
            uname = u_info["username"]

        # 0. Update Profile / Display Name: /api/profile or /api/user/name
        if path in ("/api/profile", "/api/user/name", "/api/profile/name"):
            display_name = (data.get("displayName") or data.get("display_name") or data.get("name") or "").strip()
            if not display_name:
                self.send_json({"ok": False, "error": "Имя не может быть пустым"}, 400)
                return
            if len(display_name) > 40:
                display_name = display_name[:40]
            now = time.time()
            with db_lock:
                conn = get_db()
                conn.execute(
                    "UPDATE users SET display_name = ?, last_active = ? WHERE username = ?",
                    (display_name, now, uname)
                )
                conn.commit()
                conn.close()
            state = get_user_full_state(uname)
            if state and state.get("user") and state["user"].get("tgId"):
                ensure_chat_menu_button(state["user"]["tgId"])
            self.send_json({"ok": True, "displayName": display_name, "state": state})
            return

        # 1. Update Mood & Explanation: /api/mood
        if path == "/api/mood":
            emoji = (data.get("emoji") or "🥰").strip() or "🥰"
            label = (data.get("label") or "Люблю").strip() or "Люблю"
            reason = (data.get("reason") or "").strip()
            now = time.time()
            with db_lock:
                conn = get_db()
                conn.execute(
                    "UPDATE users SET mood_emoji = ?, mood_label = ?, mood_reason = ?, mood_updated_at = ?, last_active = ? WHERE username = ?",
                    (emoji, label, reason, now, now, uname)
                )
                conn.commit()
                u_row = conn.execute("SELECT tg_id, display_name, partner_username FROM users WHERE username = ?", (uname,)).fetchone()
                p_uname = u_row["partner_username"] if u_row else None
                p_row = None
                if p_uname:
                    p_row = conn.execute("SELECT tg_id, display_name FROM users WHERE username = ?", (p_uname,)).fetchone()
                conn.close()

            if u_row and u_row["tg_id"]:
                ensure_chat_menu_button(u_row["tg_id"])

            # Mood change notification to partner in Telegram
            if p_row and p_row["tg_id"]:
                ensure_chat_menu_button(p_row["tg_id"])
                user_name = html.escape(((u_row["display_name"] if u_row else None) or "").strip() or f"@{uname}")
                safe_emoji = html.escape(emoji)
                safe_label = html.escape(label)
                if reason:
                    safe_reason = html.escape(reason[:500])
                    mood_msg = f"💭 <b>{user_name} обновил(-а) настроение:</b> {safe_emoji} <b>{safe_label}</b>\n<i>«{safe_reason}»</i>"
                else:
                    mood_msg = f"💭 <b>{user_name} обновил(-а) настроение:</b> {safe_emoji} <b>{safe_label}</b>"

                tg_send_message(
                    p_row["tg_id"],
                    mood_msg,
                    reply_markup={"inline_keyboard": [[{"text": "💑 Открыть «Двое»", "web_app": {"url": get_current_webapp_url()}}]]}
                )

            state = get_user_full_state(uname)
            self.send_json({"ok": True, "state": state})
            return

        # 2. Heart Nudge / Sign of Attention: /api/heart-nudge or /api/care/nudge
        if path in ("/api/heart-nudge", "/api/care/nudge"):
            reaction = (data.get("reaction") or "❤️").strip() or "❤️"
            now = time.time()
            with db_lock:
                conn = get_db()
                cur = conn.cursor()
                u_row = cur.execute("SELECT tg_id, display_name, partner_username FROM users WHERE username = ?", (uname,)).fetchone()
                p_uname = u_row["partner_username"] if u_row else None
                p_row = None
                if p_uname:
                    p_row = cur.execute("SELECT tg_id, display_name FROM users WHERE username = ?", (p_uname,)).fetchone()
                    cur.execute(
                        "UPDATE users SET mood_reaction = ?, mood_reaction_from = ?, mood_reaction_at = ? WHERE username = ?",
                        (reaction, uname, now, p_uname)
                    )
                    conn.commit()
                conn.close()

            if u_row and u_row["tg_id"]:
                ensure_chat_menu_button(u_row["tg_id"])

            if p_row and p_row["tg_id"]:
                ensure_chat_menu_button(p_row["tg_id"])
                user_name = html.escape(((u_row["display_name"] if u_row else None) or "").strip() or f"@{uname}")
                if reaction == "❤️":
                    nudge_text = f"❤️ <b>{user_name} думает о вас и шлёт вам знак внимания!</b> 💕"
                else:
                    safe_reaction = html.escape(reaction)
                    nudge_text = f"{safe_reaction} <b>{user_name} думает о вас и шлёт вам знак внимания:</b> {safe_reaction} 💕"

                tg_send_message(
                    p_row["tg_id"],
                    nudge_text,
                    reply_markup={"inline_keyboard": [[{"text": "💑 Открыть «Двое»", "web_app": {"url": get_current_webapp_url()}}]]}
                )

            state = get_user_full_state(uname)
            self.send_json({"ok": True, "message": "Sign of attention sent", "state": state})
            return

        # 3. React to Partner's Mood: /api/mood/react
        if path in ("/api/mood/react", "/api/react"):
            reaction = (data.get("reaction") or "❤️").strip() or "❤️"
            now = time.time()
            with db_lock:
                conn = get_db()
                cur = conn.cursor()
                u_row = cur.execute("SELECT tg_id, display_name, partner_username FROM users WHERE username = ?", (uname,)).fetchone()
                p_uname = u_row["partner_username"] if u_row else None
                p_row = None
                if p_uname:
                    p_row = cur.execute("SELECT tg_id, display_name FROM users WHERE username = ?", (p_uname,)).fetchone()
                    cur.execute(
                        "UPDATE users SET mood_reaction = ?, mood_reaction_from = ?, mood_reaction_at = ? WHERE username = ?",
                        (reaction, uname, now, p_uname)
                    )
                    conn.commit()
                conn.close()

            if u_row and u_row["tg_id"]:
                ensure_chat_menu_button(u_row["tg_id"])

            if p_row and p_row["tg_id"]:
                ensure_chat_menu_button(p_row["tg_id"])
                user_name = html.escape(((u_row["display_name"] if u_row else None) or "").strip() or f"@{uname}")
                if reaction == "❤️":
                    nudge_text = f"❤️ <b>{user_name} думает о вас и шлёт вам знак внимания!</b> 💕"
                else:
                    safe_reaction = html.escape(reaction)
                    nudge_text = f"{safe_reaction} <b>{user_name} думает о вас и шлёт вам знак внимания:</b> {safe_reaction} 💕"
                tg_send_message(
                    p_row["tg_id"],
                    nudge_text,
                    reply_markup={"inline_keyboard": [[{"text": "💑 Открыть «Двое»", "web_app": {"url": get_current_webapp_url()}}]]}
                )

            state = get_user_full_state(uname)
            self.send_json({"ok": True, "state": state})
            return

        # 3. Update Photo (1:1 base64 upload): /api/photo/upload
        if path in ("/api/photo/upload", "/api/photo"):
            base64_data = data.get("image") or data.get("photo") or ""
            if not base64_data:
                self.send_json({"ok": False, "error": "No image data provided"}, 400)
                return
            try:
                photo_url = save_base64_upload(base64_data, uname)
                now = time.time()
                with db_lock:
                    conn = get_db()
                    conn.execute("UPDATE users SET photo_url = ?, photo_custom = ?, last_active = ? WHERE username = ?", (photo_url, photo_url, now, uname))
                    conn.commit()
                    conn.close()
                state = get_user_full_state(uname)
                self.send_json({"ok": True, "photoUrl": photo_url, "state": state})
                return
            except Exception as e:
                self.send_json({"ok": False, "error": str(e)}, 500)
                return

        # 4. Sync Photo from Telegram Avatar: /api/photo/sync-tg
        if path == "/api/photo/sync-tg":
            tg_photo = data.get("photo_url", "")
            tg_id = data.get("tg_id")
            saved_url = ""
            if tg_id:
                try:
                    saved_url = fetch_and_save_tg_avatar(int(tg_id), uname)
                except Exception:
                    pass
            if not saved_url and tg_photo and tg_photo.startswith("http"):
                saved_url = download_and_crop_square_photo(tg_photo, uname)
            if not saved_url and tg_photo:
                saved_url = tg_photo

            if saved_url:
                now = time.time()
                with db_lock:
                    conn = get_db()
                    conn.execute("UPDATE users SET photo_url = ?, photo_custom = '', last_active = ? WHERE username = ?", (saved_url, now, uname))
                    conn.commit()
                    conn.close()
            state = get_user_full_state(uname)
            self.send_json({"ok": True, "photoUrl": saved_url, "state": state})
            return

        # 5. Reset Photo to default: /api/photo/reset
        if path == "/api/photo/reset":
            with db_lock:
                conn = get_db()
                conn.execute("UPDATE users SET photo_url = '', photo_custom = 'reset' WHERE username = ?", (uname,))
                conn.commit()
                conn.close()
            state = get_user_full_state(uname)
            self.send_json({"ok": True, "state": state})
            return

        # 6. Update Relationship Start Date: /api/relationship-date
        if path in ("/api/relationship-date", "/api/couple/anniversary"):
            date_str = (data.get("date") or data.get("anniversaryDate") or "").strip()
            if not date_str:
                self.send_json({"ok": False, "error": "Date required"}, 400)
                return
            with db_lock:
                conn = get_db()
                cur = conn.cursor()
                u = cur.execute("SELECT partner_username FROM users WHERE username = ?", (uname,)).fetchone()
                p_uname = u["partner_username"] if u else None
                cur.execute("UPDATE users SET anniversary_date = ? WHERE username = ?", (date_str, uname))
                if p_uname:
                    cur.execute("UPDATE users SET anniversary_date = ? WHERE username = ?", (date_str, p_uname))
                conn.commit()
                conn.close()

            state = get_user_full_state(uname)
            self.send_json({"ok": True, "state": state})
            return

        # 7. Pair Partners: /api/pair
        if path == "/api/pair":
            partner_code = (data.get("partner_code") or "").strip().upper()
            partner_target = normalize_username(data.get("partner_username") or "")
            if partner_target:
                partner_target, _ = resolve_canonical_username(partner_target)

            with db_lock:
                conn = get_db()
                cur = conn.cursor()
                if partner_code:
                    target = cur.execute("SELECT * FROM users WHERE invite_code = ? AND username != ?", (partner_code, uname)).fetchone()
                elif partner_target:
                    target = cur.execute("SELECT * FROM users WHERE username = ? AND username != ?", (partner_target, uname)).fetchone()
                else:
                    target = None
                conn.close()

            if not target:
                self.send_json({"ok": False, "error": "Партнёр не найден по указанному коду"}, 404)
                return

            target_uname = target["username"]
            paired = pair_users(uname, target_uname)
            if not paired:
                self.send_json({"ok": False, "error": "Не удалось соединить пару"}, 400)
                return

            # Optional notification to partner
            if target["tg_id"]:
                tg_send_message(
                    target["tg_id"],
                    f"🎉 <b>Поздравляем!</b> @{uname} соединился(-ась) с вами в приложении «Двое» 💕",
                    reply_markup={"inline_keyboard": [[{"text": "💑 Открыть «Двое»", "web_app": {"url": get_current_webapp_url()}}]]}
                )

            state = get_user_full_state(uname)
            self.send_json({"ok": True, "state": state})
            return

        # 8. Unlink Partners: /api/pair/unlink
        if path in ("/api/pair/unlink", "/api/unlink"):
            p_uname = unlink_user(uname)
            if p_uname:
                with db_lock:
                    conn = get_db()
                    p = conn.execute("SELECT tg_id FROM users WHERE username = ?", (p_uname,)).fetchone()
                    conn.close()
                if p and p["tg_id"]:
                    tg_send_message(p["tg_id"], f"💔 Партнёр @{uname} отвязал пару.")

            state = get_user_full_state(uname)
            self.send_json({"ok": True, "state": state})
            return

        # 9. Support / Feedback: /api/support
        if path == "/api/support":
            msg_text = (data.get("message") or "").strip()
            cat = data.get("category") or "feedback"
            tg_id = data.get("tg_id")
            if not msg_text:
                self.send_json({"ok": False, "error": "Message is empty"}, 400)
                return

            with db_lock:
                conn = get_db()
                cur = conn.cursor()
                u = cur.execute("SELECT display_name, tg_id FROM users WHERE username = ?", (uname,)).fetchone()
                d_name = u["display_name"] if u else uname
                user_tg_id = tg_id or (u["tg_id"] if u else 0)
                cur.execute(
                    "INSERT INTO support_tickets (tg_id, username, display_name, message, message_text, category, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'new')",
                    (user_tg_id, uname, d_name, msg_text, msg_text, cat, time.time())
                )
                conn.commit()
                conn.close()

            # Forward to admin
            admin_msg = (
                f"📩 <b>Новое обращение из приложения «Двое»!</b>\n\n"
                f"👤 <b>От:</b> {d_name} (@{uname})\n"
                f"🆔 <b>TG ID:</b> <code>{user_tg_id}</code>\n"
                f"🏷 <b>Категория:</b> {cat}\n\n"
                f"💬 <b>Текст:</b>\n{msg_text}"
            )
            tg_send_message(ADMIN_TG_ID, admin_msg)

            self.send_json({"ok": True, "message": "Обращение успешно отправлено разработчику"})
            return

        self.send_json({"ok": False, "error": "Endpoint not found"}, 404)


# ==============================================================================
# Main Entry Point
# ==============================================================================

def main():
    fetch_bot_info_from_telegram()
    print("=" * 60)
    print("💑 Запуск сервера «Двое» (Two Couple App)")
    print(f"📍 Порт: {PORT}")
    print(f"📁 Public: {PUBLIC_DIR}")
    print(f"🤖 Бот: @{BOT_USERNAME}")
    print("=" * 60)

    # Spawn Telegram Bot Polling Thread
    t_bot = threading.Thread(target=telegram_polling_worker, daemon=True)
    t_bot.start()

    # Spawn Menu Button Syncer Thread
    t_menu = threading.Thread(target=update_menu_button_periodically, daemon=True)
    t_menu.start()

    # Start HTTP Server
    server = ThreadingHTTPServer(("0.0.0.0", PORT), DvoeHTTPHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server] Shutdown requested.")
        server.shutdown()


if __name__ == "__main__":
    main()
