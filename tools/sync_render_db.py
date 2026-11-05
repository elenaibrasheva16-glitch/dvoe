#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cloud & Local DB Synchronizer and VP Partner Manager for «Двое»
Ensures Render live state (users, pairs, promo_channels, promo_referrals) is safely
merged into local backend/chibilove.db before git push/deploy, and allows instant
CLI management of partner channels.
"""

import argparse
import json
import os
import sys
import requests

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.server import (
    ADMIN_SYNC_TOKEN,
    add_or_update_promo_channel,
    activate_promo_channel,
    deactivate_promo_channel,
    delete_promo_channel_permanently,
    get_all_promo_channels,
    export_db_snapshot,
    import_db_snapshot,
)

RENDER_URL = os.environ.get("RENDER_URL", "https://dvoe.onrender.com")


def pull_from_render():
    """Fetches state from Render and merges into local backend/chibilove.db."""
    try:
        r = requests.get(
            f"{RENDER_URL}/api/admin/sync",
            params={"token": ADMIN_SYNC_TOKEN},
            timeout=15
        )
        if r.status_code == 200:
            data = r.json()
            if data.get("ok"):
                res = import_db_snapshot(data)
                print(f"[Sync Pull] Merged from Render /api/admin/sync: {res}")
                return True
    except Exception as e:
        print(f"[Sync Pull Info] /api/admin/sync not yet available or unreachable ({e}), checking /api/promo_partner...")

    # Fallback: check /api/promo_partner and key users from Render /api/state
    try:
        r_p = requests.get(f"{RENDER_URL}/api/promo_partner", timeout=10)
        if r_p.status_code == 200:
            p_data = r_p.json().get("partner")
            if p_data and p_data.get("code"):
                import_db_snapshot({"promo_channels": [{
                    "code": p_data["code"],
                    "channel_username": p_data.get("channel_username", ""),
                    "channel_title": p_data.get("channel_title", ""),
                    "channel_description": p_data.get("channel_description", ""),
                    "clicks": p_data.get("clicks", 0),
                    "active": 1,
                }]})
                print(f"[Sync Fallback] Synced active partner channel: {p_data['code']} (clicks={p_data.get('clicks', 0)})")
    except Exception as e:
        print(f"[Sync Fallback Error] {e}")
    return False


def push_to_render():
    """Pushes local DB snapshot to live Render instance."""
    snap = export_db_snapshot()
    try:
        r = requests.post(
            f"{RENDER_URL}/api/admin/sync",
            json={"token": ADMIN_SYNC_TOKEN, "snapshot": snap},
            timeout=15
        )
        print(f"[Sync Push] Status {r.status_code}: {r.text}")
        return r.status_code == 200
    except Exception as e:
        print(f"[Sync Push Error] {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Manage VP collaborations and sync Render DB")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("pull", help="Pull live state from Render into local DB")
    sub.add_parser("push", help="Push local DB state to live Render")
    sub.add_parser("list", help="List all promo partner channels")

    p_add = sub.add_parser("add", help="Add or update a promo partner channel")
    p_add.add_argument("username", help="@username of channel")
    p_add.add_argument("title", help="Channel title")
    p_add.add_argument("description", nargs="?", default="", help="Channel description")

    p_pause = sub.add_parser("pause", help="Pause a promo partner channel")
    p_pause.add_argument("code", help="Channel code or @username")

    p_resume = sub.add_parser("resume", help="Resume a promo partner channel")
    p_resume.add_argument("code", help="Channel code or @username")

    p_del = sub.add_parser("delete", help="Permanently delete a promo partner channel")
    p_del.add_argument("code", help="Channel code or @username")

    args = parser.parse_args()
    if args.cmd == "pull":
        pull_from_render()
    elif args.cmd == "push":
        push_to_render()
    elif args.cmd == "add":
        ch = add_or_update_promo_channel(args.username, args.title, args.description)
        print("Added/Updated local:", json.dumps(ch, ensure_ascii=False))
        push_to_render()
    elif args.cmd == "pause":
        ok = deactivate_promo_channel(args.code)
        print(f"Paused {args.code}: {ok}")
        push_to_render()
    elif args.cmd == "resume":
        ok = activate_promo_channel(args.code)
        print(f"Resumed {args.code}: {ok}")
        push_to_render()
    elif args.cmd == "delete":
        ok = delete_promo_channel_permanently(args.code)
        print(f"Deleted {args.code}: {ok}")
        push_to_render()
    else:
        for ch in get_all_promo_channels():
            print(json.dumps(ch, ensure_ascii=False))


if __name__ == "__main__":
    main()
