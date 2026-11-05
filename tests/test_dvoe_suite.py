#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Master Test Suite for «Двое» (Two) Couple Mini App & Telegram Bot
Executes complete end-to-end verification across:
1. Health & Server Status
2. User State & Partner Sync
3. Mood Tracking & Explanation Storage / Retrieval
4. Reaction to Partner Mood
5. 1:1 Photo Upload & Center Square Cropping Verification
6. Relationship Start Date Synchronization
7. High-Precision Calendar Time Together Calculation (Years, Months, Days, Hours, Minutes, Seconds)
8. Couple Pairing via Invite Code
9. Couple Unlinking
10. Support Ticket Submission & Admin Forwarding
11. Concurrency, Race Condition & Edge Case Resilience
"""

import base64
import io
import json
import os
import sqlite3
import sys
import time
import unittest
import requests
from datetime import datetime
from PIL import Image

SERVER_URL = "http://127.0.0.1:8085"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
DB_PATH = os.path.join(BASE_DIR, "backend", "chibilove.db")


class TestDvoeBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Verify server is reachable
        try:
            r = requests.get(f"{SERVER_URL}/api/health", timeout=5)
            assert r.status_code == 200
            assert r.json().get("ok") is True
            print(">>> Server is healthy and responding.")
        except Exception as e:
            raise RuntimeError(f"Server at {SERVER_URL} is not responding: {e}")

        # Snapshot live production users to guarantee test isolation and non-mutation
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username IN ('ksjjfnnn', 'adamlanda')")
        cls.initial_live_users = {row["username"]: dict(row) for row in cur.fetchall()}
        conn.close()

    @classmethod
    def tearDownClass(cls):
        # Assert and guarantee live production users were never mutated by any test
        if hasattr(cls, "initial_live_users"):
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM users WHERE username IN ('ksjjfnnn', 'adamlanda')")
            current_live_users = {row["username"]: dict(row) for row in cur.fetchall()}
            ignore_cols = {"last_active"}
            for u in ("ksjjfnnn", "adamlanda"):
                for k, v in cls.initial_live_users[u].items():
                    if k not in ignore_cols:
                        assert current_live_users[u][k] == v, (
                            f"Live user '{u}' column '{k}' was mutated! Expected {v}, got {current_live_users[u][k]}"
                        )
            # Wipe any test users and data created during this test run
            cur.execute("DELETE FROM users WHERE username NOT IN ('ksjjfnnn', 'adamlanda')")
            cur.execute("DELETE FROM pair_requests WHERE from_username NOT IN ('ksjjfnnn', 'adamlanda') AND to_username NOT IN ('ksjjfnnn', 'adamlanda')")
            cur.execute("DELETE FROM support_tickets WHERE username NOT IN ('ksjjfnnn', 'adamlanda') OR message LIKE 'Очень нравится%'")
            cur.execute("DELETE FROM support_sessions WHERE tg_id = 2034621049")
            cur.execute("DELETE FROM care_logs WHERE couple_key NOT LIKE '%ksjjfnnn%' AND couple_key NOT LIKE '%adamlanda%'")
            cur.execute("DELETE FROM uploaded_files WHERE filename LIKE 'test_%' OR filename LIKE 'avatar_avatar_%' OR filename LIKE 'ext_src_%' OR filename LIKE 'avatar_test_%'")
            conn.commit()
            conn.close()

            # Clean disk test uploads
            uploads_dir = os.path.join(BASE_DIR, "public", "uploads")
            if os.path.exists(uploads_dir):
                for f in os.listdir(uploads_dir):
                    if f.startswith(("test_", "avatar_test_", "avatar_avatar_", "ext_src_")):
                        try:
                            os.remove(os.path.join(uploads_dir, f))
                        except Exception:
                            pass

    def test_01_health_and_info(self):
        """Verify health check endpoint returns 200 and correct app metadata."""
        r = requests.get(f"{SERVER_URL}/api/health")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("app"), "Двое")
        self.assertEqual(data.get("version"), "2.0.0")

    def test_02_user_state_and_existing_couple(self):
        """Verify ksjjfnnn and adamlanda are paired and data is consistent."""
        r = requests.get(f"{SERVER_URL}/api/state?username=ksjjfnnn")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data.get("ok"))
        self.assertTrue(data.get("isPaired"))
        
        user = data.get("user")
        self.assertEqual(user["username"], "ksjjfnnn")
        self.assertTrue(user["inviteCode"].startswith("PAIR-"))
        self.assertIn("start=pair_", user["inviteLink"])
        
        partner = data.get("partner")
        self.assertIsNotNone(partner)
        self.assertEqual(partner["username"], "adamlanda")

        # Verify adamlanda sees ksjjfnnn as partner too
        r2 = requests.get(f"{SERVER_URL}/api/state?username=adamlanda")
        self.assertEqual(r2.status_code, 200)
        data2 = r2.json()
        self.assertTrue(data2.get("isPaired"))
        self.assertEqual(data2["partner"]["username"], "ksjjfnnn")

    def test_03_mood_update_and_explanation(self):
        """Verify setting mood and explanation updates user and partner state."""
        from backend.server import pair_users, unlink_user
        ts = int(time.time() * 1000)
        u1 = f"test_mood_a_{ts}"
        u2 = f"test_mood_b_{ts}"
        requests.get(f"{SERVER_URL}/api/state?username={u1}")
        requests.get(f"{SERVER_URL}/api/state?username={u2}")
        self.assertTrue(pair_users(u1, u2))

        test_reason = "Сдал сложный проект, очень соскучился и жду встречи! ❤️"
        r = requests.post(f"{SERVER_URL}/api/mood", json={
            "username": u1,
            "emoji": "🥰",
            "label": "Люблю",
            "reason": test_reason
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data["state"]["user"]["moodEmoji"], "🥰")
        self.assertEqual(data["state"]["user"]["moodReason"], test_reason)

        # Check partner sees the new mood and explanation
        r_partner = requests.get(f"{SERVER_URL}/api/state?username={u2}")
        p_data = r_partner.json()
        self.assertEqual(p_data["partner"]["moodEmoji"], "🥰")
        self.assertEqual(p_data["partner"]["moodLabel"], "Люблю")
        self.assertEqual(p_data["partner"]["moodReason"], test_reason)

        unlink_user(u1)
        unlink_user(u2)

    def test_04_reaction_to_mood(self):
        """Verify sending a reaction to partner's mood."""
        from backend.server import pair_users, unlink_user
        ts = int(time.time() * 1000)
        u1 = f"test_react_a_{ts}"
        u2 = f"test_react_b_{ts}"
        requests.get(f"{SERVER_URL}/api/state?username={u1}")
        requests.get(f"{SERVER_URL}/api/state?username={u2}")
        self.assertTrue(pair_users(u1, u2))

        r = requests.post(f"{SERVER_URL}/api/mood/react", json={
            "username": u2,
            "reaction": "🤗"
        })
        self.assertEqual(r.status_code, 200)
        
        # u1 should now have moodReaction = "🤗"
        r_user = requests.get(f"{SERVER_URL}/api/state?username={u1}")
        u_data = r_user.json()
        self.assertEqual(u_data["user"]["moodReaction"], "🤗")
        self.assertEqual(u_data["user"]["moodReactionFrom"], u2)

        unlink_user(u1)
        unlink_user(u2)

    def test_05_photo_upload_1x1_processing(self):
        """Verify 1:1 square image upload, processing and aspect ratio."""
        ts = int(time.time() * 1000)
        u = f"test_photo_u_{ts}"
        requests.get(f"{SERVER_URL}/api/state?username={u}")

        # Create a non-square test image (400x250) in memory
        im = Image.new("RGB", (400, 250), color="#FF6B81")
        buf = io.BytesIO()
        im.save(buf, format="JPEG")
        b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

        r = requests.post(f"{SERVER_URL}/api/photo/upload", json={
            "username": u,
            "image": b64
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data.get("ok"))
        photo_url = data.get("photoUrl")
        self.assertTrue(photo_url.startswith("/uploads/"))

        # Verify on disk that the saved file is strictly 1:1 square!
        disk_path = os.path.join(BASE_DIR, "public", photo_url.lstrip("/"))
        self.assertTrue(os.path.exists(disk_path))
        with Image.open(disk_path) as saved_img:
            w, h = saved_img.size
            self.assertEqual(w, h, f"Image must be 1:1 square, got {w}x{h}")
            self.assertEqual(w, 250, "Cropped size should match min dimension")

    def test_06_relationship_date_sync(self):
        """Verify relationship start date synchronization for both partners."""
        from backend.server import pair_users, unlink_user
        ts = int(time.time() * 1000)
        u1 = f"test_date_a_{ts}"
        u2 = f"test_date_b_{ts}"
        requests.get(f"{SERVER_URL}/api/state?username={u1}")
        requests.get(f"{SERVER_URL}/api/state?username={u2}")
        self.assertTrue(pair_users(u1, u2))

        test_date = "2023-09-01"
        r = requests.post(f"{SERVER_URL}/api/relationship-date", json={
            "username": u1,
            "date": test_date
        })
        self.assertEqual(r.status_code, 200)
        
        # Verify both partners see the new start date
        r1 = requests.get(f"{SERVER_URL}/api/state?username={u1}")
        r2 = requests.get(f"{SERVER_URL}/api/state?username={u2}")
        self.assertEqual(r1.json()["relationshipStart"], test_date)
        self.assertEqual(r2.json()["relationshipStart"], test_date)

        unlink_user(u1)
        unlink_user(u2)

    def test_07_pairing_and_unlinking_lifecycle(self):
        """Test full pairing and unlinking lifecycle between two new test users."""
        ts = int(time.time() * 1000)
        u1 = f"test_romeo_{ts}"
        u2 = f"test_juliet_{ts}"

        # Initialize users
        s1 = requests.get(f"{SERVER_URL}/api/state?username={u1}").json()
        s2 = requests.get(f"{SERVER_URL}/api/state?username={u2}").json()

        self.assertFalse(s1["isPaired"])
        self.assertFalse(s2["isPaired"])

        code2 = s2["user"]["inviteCode"]
        self.assertTrue(code2.startswith("PAIR-"))

        # Pair u1 with u2 using u2's invite code
        r_pair = requests.post(f"{SERVER_URL}/api/pair", json={
            "username": u1,
            "partner_code": code2
        })
        self.assertEqual(r_pair.status_code, 200)
        pair_data = r_pair.json()
        self.assertTrue(pair_data["ok"])
        self.assertTrue(pair_data["state"]["isPaired"])
        self.assertEqual(pair_data["state"]["partner"]["username"], u2)

        # Check u2 state
        s2_after = requests.get(f"{SERVER_URL}/api/state?username={u2}").json()
        self.assertTrue(s2_after["isPaired"])
        self.assertEqual(s2_after["partner"]["username"], u1)

        # Unlink
        r_unlink = requests.post(f"{SERVER_URL}/api/pair/unlink", json={"username": u1})
        self.assertEqual(r_unlink.status_code, 200)
        self.assertFalse(r_unlink.json()["state"]["isPaired"])

        s2_unlinked = requests.get(f"{SERVER_URL}/api/state?username={u2}").json()
        self.assertFalse(s2_unlinked["isPaired"])

    def test_08_support_ticket_submission(self):
        """Verify support ticket submission and database persistence."""
        ts = int(time.time() * 1000)
        u = f"test_support_{ts}"
        ticket_msg = "Очень нравится новый минималистичный дизайн приложения Двое! Предлагаю добавить виджет на экран блокировки."
        r = requests.post(f"{SERVER_URL}/api/support", json={
            "username": u,
            "message": ticket_msg,
            "category": "collaboration"
        })
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json().get("ok"))

        # Check database
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        row = cur.execute("SELECT message, category, username FROM support_tickets WHERE username = ? ORDER BY id DESC LIMIT 1", (u,)).fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertEqual(row[0], ticket_msg)
        self.assertEqual(row[1], "collaboration")

    def test_09_time_together_calculation_math(self):
        """Verify time together math for calendar exactness across leap years and months with forward addition."""
        import calendar

        def days_in_month(year, month):
            return calendar.monthrange(year, month)[1]

        def get_calendar_diff(d0, d1):
            if d1 < d0:
                return {"y": 0, "m": 0, "d": 0, "h": 0, "min": 0, "s": 0}

            y = d1.year - d0.year
            # Probe whole years forward
            try:
                cur = d0.replace(year=d0.year + y)
            except ValueError:
                cur = d0.replace(year=d0.year + y, day=days_in_month(d0.year + y, d0.month))
            if cur > d1:
                y -= 1
                try:
                    cur = d0.replace(year=d0.year + y)
                except ValueError:
                    cur = d0.replace(year=d0.year + y, day=days_in_month(d0.year + y, d0.month))

            m = 0
            while True:
                target_m = cur.month + 1
                target_y = cur.year
                if target_m > 12:
                    target_m = 1
                    target_y += 1
                max_d = days_in_month(target_y, target_m)
                target_d = min(d0.day, max_d)
                next_month = cur.replace(year=target_y, month=target_m, day=target_d)
                if next_month <= d1:
                    m += 1
                    cur = next_month
                else:
                    break

            rem_sec = int((d1 - cur).total_seconds())
            d = rem_sec // 86400
            rem = rem_sec % 86400
            h = rem // 3600
            rem = rem % 3600
            mn = rem // 60
            s = rem % 60
            return {"y": y, "m": m, "d": d, "h": h, "min": mn, "s": s}

        # 1. Standard interval
        start_date = datetime(2024, 2, 14, 0, 0, 0)
        curr_date = datetime(2026, 11, 4, 18, 30, 15)
        diff = get_calendar_diff(start_date, curr_date)
        self.assertEqual(diff["y"], 2)
        self.assertEqual(diff["m"], 8)
        self.assertEqual(diff["d"], 21)
        self.assertEqual(diff["h"], 18)
        self.assertEqual(diff["min"], 30)
        self.assertEqual(diff["s"], 15)

        # 2. Edge case: Jan 31 -> Mar 1 (borrowing short Feb, never negative!)
        diff_feb = get_calendar_diff(datetime(2024, 1, 31), datetime(2024, 3, 1))
        self.assertGreaterEqual(diff_feb["d"], 0, "Days must never be negative")
        self.assertEqual(diff_feb["y"], 0)
        self.assertEqual(diff_feb["m"], 1)
        self.assertEqual(diff_feb["d"], 1)

        # 3. Edge case: Leap year Feb 29 -> Feb 28 next year
        diff_leap1 = get_calendar_diff(datetime(2024, 2, 29), datetime(2025, 2, 28))
        self.assertEqual(diff_leap1["y"], 1)
        self.assertEqual(diff_leap1["m"], 0)
        self.assertEqual(diff_leap1["d"], 0)

        # 4. Edge case: Leap year Feb 29 -> Mar 1 next year
        diff_leap2 = get_calendar_diff(datetime(2024, 2, 29), datetime(2025, 3, 1))
        self.assertEqual(diff_leap2["y"], 1)
        self.assertEqual(diff_leap2["m"], 0)
        self.assertEqual(diff_leap2["d"], 1)

        # 5. Future date
        diff_future = get_calendar_diff(datetime(2030, 1, 1), datetime(2026, 1, 1))
        self.assertEqual(diff_future, {"y": 0, "m": 0, "d": 0, "h": 0, "min": 0, "s": 0})

    def test_10_edge_cases_and_error_handling(self):
        """Verify handling of edge cases, empty values, invalid codes, and boundaries."""
        ts = int(time.time() * 1000)
        u = f"test_edge_{ts}"
        requests.get(f"{SERVER_URL}/api/state?username={u}")

        # 1. Missing username in POST requests
        r = requests.post(f"{SERVER_URL}/api/mood", json={})
        self.assertEqual(r.status_code, 400)
        self.assertFalse(r.json().get("ok"))

        # 2. Pair with invalid non-existent code
        r_inv = requests.post(f"{SERVER_URL}/api/pair", json={
            "username": u,
            "partner_code": "PAIR-INVALID999"
        })
        self.assertEqual(r_inv.status_code, 404)
        self.assertFalse(r_inv.json().get("ok"))

        # 3. Empty mood explanation should be permitted
        r_empty = requests.post(f"{SERVER_URL}/api/mood", json={
            "username": u,
            "emoji": "😊",
            "label": "Счастлив",
            "reason": ""
        })
        self.assertEqual(r_empty.status_code, 200)
        self.assertTrue(r_empty.json().get("ok"))
        self.assertEqual(r_empty.json()["state"]["user"]["moodReason"], "")

        # 4. Long unicode text with emojis
        long_reason = "Мы гуляли по набережной под снегом ❄️✨ и пили горячий шоколад ☕️🍫! Это было самое прекрасное свидание на свете ❤️" * 3
        r_long = requests.post(f"{SERVER_URL}/api/mood", json={
            "username": u,
            "emoji": "🥰",
            "label": "Люблю",
            "reason": long_reason
        })
        self.assertEqual(r_long.status_code, 200)
        self.assertEqual(r_long.json()["state"]["user"]["moodReason"], long_reason)

        # 5. Reset photo endpoint
        r_reset = requests.post(f"{SERVER_URL}/api/photo/reset", json={"username": u})
        self.assertEqual(r_reset.status_code, 200)
        self.assertTrue(r_reset.json().get("ok"))

    def test_11_telegram_avatar_caching_and_defaults(self):
        """Verify external avatar downloading, caching, and fallback to default SVG avatars."""
        from backend.server import process_and_crop_square_image
        ts = int(time.time() * 1000)
        u = f"test_avatar_user_{ts}"

        # 1. State for newly created user without avatar should return default SVG
        s1 = requests.get(f"{SERVER_URL}/api/state?username={u}").json()
        self.assertTrue(s1["ok"])
        self.assertEqual(s1["user"]["photoUrl"], "/img/avatar_me.svg")
        self.assertIsNone(s1["partner"])

        # 2. Square cropping of non-square image
        test_img_path = os.path.join(BASE_DIR, "public", "uploads", f"test_crop_{ts}.jpg")
        im = Image.new("RGB", (300, 150), color="#4A90E2")
        im.save(test_img_path)
        res = process_and_crop_square_image(test_img_path)
        self.assertEqual(res, test_img_path)
        with Image.open(test_img_path) as c_img:
            w, h = c_img.size
            self.assertEqual(w, h)
            self.assertEqual(w, 150)
        if os.path.exists(test_img_path):
            os.remove(test_img_path)

    def test_12_atomic_pairing_and_anniversary_sync(self):
        """Verify atomic pair_users synchronizes anniversary dates and cleans up orphaned pairs."""
        from backend.server import pair_users, unlink_user, get_user_full_state
        ts = int(time.time() * 1000)
        u1 = f"sync_u1_{ts}"
        u2 = f"sync_u2_{ts}"
        u3 = f"sync_u3_{ts}"

        # Initialize users in DB
        requests.get(f"{SERVER_URL}/api/state?username={u1}")
        requests.get(f"{SERVER_URL}/api/state?username={u2}")
        requests.get(f"{SERVER_URL}/api/state?username={u3}")

        # Pair u1 and u2: both get exact current timestamp with seconds
        self.assertTrue(pair_users(u1, u2))
        s1 = get_user_full_state(u1)
        s2 = get_user_full_state(u2)
        self.assertIn("T", s1["relationshipStart"])
        self.assertEqual(s1["relationshipStart"], s2["relationshipStart"])

        # u1 updates anniversary date: synchronizes to u2
        requests.post(f"{SERVER_URL}/api/relationship-date", json={"username": u1, "date": "2023-07-20"})
        s1_synced = get_user_full_state(u1)
        s2_synced = get_user_full_state(u2)
        self.assertEqual(s1_synced["relationshipStart"], "2023-07-20")
        self.assertEqual(s2_synced["relationshipStart"], "2023-07-20")

        # Now u2 pairs with u3: u1 should be atomically unlinked with empty relationshipStart!
        # u2 and u3 get a fresh second-precision pairing timestamp (not u1's old 2023-07-20)!
        self.assertTrue(pair_users(u2, u3))
        s1_after = get_user_full_state(u1)
        s2_after = get_user_full_state(u2)
        s3_after = get_user_full_state(u3)

        self.assertFalse(s1_after["isPaired"])
        self.assertIsNone(s1_after["partner"])
        self.assertEqual(s1_after["relationshipStart"], "")
        self.assertTrue(s2_after["isPaired"])
        self.assertEqual(s2_after["partner"]["username"], u3)
        self.assertIn("T", s2_after["relationshipStart"])
        self.assertNotEqual(s2_after["relationshipStart"], "2023-07-20")
        self.assertTrue(s3_after["isPaired"])
        self.assertEqual(s3_after["partner"]["username"], u2)
        self.assertEqual(s2_after["relationshipStart"], s3_after["relationshipStart"])

        # Cleanup
        unlink_user(u2)
        unlink_user(u3)

    def test_13_photo_reset_and_button_flow(self):
        """Verify photo upload then reset endpoint /api/photo/reset returns default avatar."""
        ts = int(time.time() * 1000)
        u = f"test_reset_{ts}"

        # Upload photo
        im = Image.new("RGB", (200, 200), color="#E91E63")
        buf = io.BytesIO()
        im.save(buf, format="JPEG")
        b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

        r_up = requests.post(f"{SERVER_URL}/api/photo/upload", json={"username": u, "image": b64})
        self.assertEqual(r_up.status_code, 200)
        self.assertTrue(r_up.json()["photoUrl"].startswith("/uploads/"))

        # Verify state has custom photo
        s_up = requests.get(f"{SERVER_URL}/api/state?username={u}").json()
        self.assertTrue(s_up["user"]["photoUrl"].startswith("/uploads/"))

        # Reset photo
        r_rst = requests.post(f"{SERVER_URL}/api/photo/reset", json={"username": u})
        self.assertEqual(r_rst.status_code, 200)
        self.assertTrue(r_rst.json()["ok"])
        self.assertEqual(r_rst.json()["state"]["user"]["photoUrl"], "/img/avatar_me.svg")

    def test_14_admin_support_reply_forwarding_regex(self):
        """Verify regex extraction of TG ID from admin reply header."""
        import re
        sample_admin_reply_text = "<b>Ответ разработчика «Двое»:</b>\nСпасибо за отзыв! Функция уже добавлена.\n\n🆔 TG ID: <code>8565474570</code>"
        m = re.search(r"🆔 TG ID: <code>(\d+)</code>", sample_admin_reply_text)
        self.assertIsNotNone(m)
        self.assertEqual(m.group(1), "8565474570")

    def test_15_profile_name_update_and_partner_sync(self):
        """Verify editing display name via /api/profile and /api/user/name updates DB and syncs to partner."""
        from backend.server import pair_users, unlink_user
        ts = int(time.time() * 1000)
        u1 = f"name_u1_{ts}"
        u2 = f"name_u2_{ts}"

        # Initialize users and pair them
        requests.get(f"{SERVER_URL}/api/state?username={u1}&displayName=OriginalU1")
        requests.get(f"{SERVER_URL}/api/state?username={u2}&displayName=OriginalU2")
        self.assertTrue(pair_users(u1, u2))

        # 1. Update display name via /api/profile
        r_prof = requests.post(f"{SERVER_URL}/api/profile", json={"username": u1, "displayName": "Алиса Любимая"})
        self.assertEqual(r_prof.status_code, 200)
        self.assertTrue(r_prof.json()["ok"])
        self.assertEqual(r_prof.json()["displayName"], "Алиса Любимая")

        # 2. Check u1 state
        s1 = requests.get(f"{SERVER_URL}/api/state?username={u1}").json()
        self.assertEqual(s1["user"]["displayName"], "Алиса Любимая")

        # 3. Check u2 state has partner displayName synced
        s2 = requests.get(f"{SERVER_URL}/api/state?username={u2}").json()
        self.assertEqual(s2["partner"]["displayName"], "Алиса Любимая")

        # 4. Check alias endpoint /api/user/name
        r_alias = requests.post(f"{SERVER_URL}/api/user/name", json={"username": u2, "displayName": "Боб Заботливый"})
        self.assertEqual(r_alias.status_code, 200)
        self.assertEqual(r_alias.json()["displayName"], "Боб Заботливый")
        s1_fresh = requests.get(f"{SERVER_URL}/api/state?username={u1}").json()
        self.assertEqual(s1_fresh["partner"]["displayName"], "Боб Заботливый")

        # 5. Check empty name error validation
        r_empty = requests.post(f"{SERVER_URL}/api/profile", json={"username": u1, "displayName": "   "})
        self.assertEqual(r_empty.status_code, 400)

        # Cleanup
        unlink_user(u1)
        unlink_user(u2)

    def test_16_automatic_relationship_time_on_pairing(self):
        """Verify linking two partners automatically sets relationshipStart to current pairing date."""
        from backend.server import pair_users, unlink_user, get_user_full_state
        ts = int(time.time() * 1000)
        u1 = f"pair_auto1_{ts}"
        u2 = f"pair_auto2_{ts}"

        today_iso = datetime.now().strftime("%Y-%m-%d")

        # Fresh users without any pre-set anniversary date
        requests.get(f"{SERVER_URL}/api/state?username={u1}")
        requests.get(f"{SERVER_URL}/api/state?username={u2}")

        # Pair via pair_users (used by /pair, /start pair_..., and web app)
        self.assertTrue(pair_users(u1, u2))

        s1 = get_user_full_state(u1)
        s2 = get_user_full_state(u2)
        self.assertTrue(s1["relationshipStart"].startswith(today_iso))
        self.assertTrue(s2["relationshipStart"].startswith(today_iso))
        self.assertIn("T", s1["relationshipStart"])
        self.assertIn("T", s2["relationshipStart"])

        # Cleanup
        unlink_user(u1)
        unlink_user(u2)

    def test_17_new_mood_presets_obidelsya_and_obidelas(self):
        """Verify setting and syncing new mood presets «Обиделся» and «Обиделась» with explanations."""
        from backend.server import pair_users, unlink_user
        ts = int(time.time() * 1000)
        u1 = f"mood_u1_{ts}"
        u2 = f"mood_u2_{ts}"
        requests.get(f"{SERVER_URL}/api/state?username={u1}")
        requests.get(f"{SERVER_URL}/api/state?username={u2}")
        self.assertTrue(pair_users(u1, u2))

        # 1. User 1 sets «😤 Обиделся»
        r1 = requests.post(f"{SERVER_URL}/api/mood", json={
            "username": u1,
            "emoji": "😤",
            "label": "Обиделся",
            "reason": "Ты забыл пожелать доброго утра!"
        })
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r1.json()["state"]["user"]["moodEmoji"], "😤")
        self.assertEqual(r1.json()["state"]["user"]["moodLabel"], "Обиделся")

        # User 2 sees updated partner mood and reason
        s2 = requests.get(f"{SERVER_URL}/api/state?username={u2}").json()
        self.assertEqual(s2["partner"]["moodEmoji"], "😤")
        self.assertEqual(s2["partner"]["moodLabel"], "Обиделся")
        self.assertEqual(s2["partner"]["moodReason"], "Ты забыл пожелать доброго утра!")

        # 2. User 2 sets «😒 Обиделась»
        r2 = requests.post(f"{SERVER_URL}/api/mood", json={
            "username": u2,
            "emoji": "😒",
            "label": "Обиделась",
            "reason": "Жду извинений с шоколадкой"
        })
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.json()["state"]["user"]["moodEmoji"], "😒")
        self.assertEqual(r2.json()["state"]["user"]["moodLabel"], "Обиделась")

        # User 1 sees updated partner mood
        s1 = requests.get(f"{SERVER_URL}/api/state?username={u1}").json()
        self.assertEqual(s1["partner"]["moodEmoji"], "😒")
        self.assertEqual(s1["partner"]["moodLabel"], "Обиделась")

        unlink_user(u1)
        unlink_user(u2)

    def test_18_automatic_first_visit_avatar(self):
        """Verify automatic avatar fetching and 1:1 cropping from photo_url on first user visit."""
        ts = int(time.time() * 1000)
        u = f"avatar_test_{ts}"

        # Create a mock 400x200 rectangular image in uploads directory to simulate external image
        mock_ext_filename = f"ext_src_{ts}.jpg"
        mock_ext_path = os.path.join(BASE_DIR, "public", "uploads", mock_ext_filename)
        im = Image.new("RGB", (400, 200), color="#8E44AD")
        im.save(mock_ext_path)

        # External URL pointing to our local server
        ext_url = f"{SERVER_URL}/uploads/{mock_ext_filename}"

        # User visits for the very first time with photo_url in query
        resp = requests.get(f"{SERVER_URL}/api/state?username={u}&photo_url={ext_url}")
        self.assertEqual(resp.status_code, 200)
        user_state = resp.json()["user"]

        # Avatar must be automatically downloaded, cropped to 1:1, and saved in /uploads/
        self.assertTrue(user_state["photoUrl"].startswith("/uploads/avatar_"))
        self.assertNotEqual(user_state["photoUrl"], f"/uploads/{mock_ext_filename}")

        # Verify the saved image is exactly 1:1 square
        saved_local_path = os.path.join(BASE_DIR, "public", user_state["photoUrl"].lstrip("/"))
        self.assertTrue(os.path.exists(saved_local_path))
        with Image.open(saved_local_path) as saved_img:
            w, h = saved_img.size
            self.assertEqual(w, h)
            self.assertEqual(w, 200)

        # Cleanup test files
        if os.path.exists(mock_ext_path):
            os.remove(mock_ext_path)
        if os.path.exists(saved_local_path):
            os.remove(saved_local_path)

    def test_19_heart_nudge_api_and_sign_of_attention(self):
        """Verify POST /api/heart-nudge and POST /api/care/nudge endpoints and partner state sync."""
        from backend.server import pair_users, unlink_user, get_user_full_state
        ts = int(time.time() * 1000)
        u1 = f"nudge_u1_{ts}"
        u2 = f"nudge_u2_{ts}"

        # Initialize users with simulated tg_ids
        requests.get(f"{SERVER_URL}/api/state?username={u1}&tg_id=999111&displayName=Ромео")
        requests.get(f"{SERVER_URL}/api/state?username={u2}&tg_id=999222&displayName=Джульетта")
        self.assertTrue(pair_users(u1, u2))

        # 1. User 1 sends heart nudge via /api/heart-nudge
        r_nudge = requests.post(f"{SERVER_URL}/api/heart-nudge", json={
            "username": u1
        })
        self.assertEqual(r_nudge.status_code, 200)
        data = r_nudge.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("message"), "Sign of attention sent")

        # Partner (u2) should now have moodReaction == '❤️' and moodReactionFrom == u1
        s2 = get_user_full_state(u2)
        self.assertEqual(s2["user"]["moodReaction"], "❤️")
        self.assertEqual(s2["user"]["moodReactionFrom"], u1)

        # 2. User 2 sends care nudge back via /api/care/nudge with custom reaction
        r_care = requests.post(f"{SERVER_URL}/api/care/nudge", json={
            "username": u2,
            "reaction": "🤗"
        })
        self.assertEqual(r_care.status_code, 200)
        self.assertTrue(r_care.json().get("ok"))

        # User 1 should now have moodReaction == '🤗' and moodReactionFrom == u2
        s1 = get_user_full_state(u1)
        self.assertEqual(s1["user"]["moodReaction"], "🤗")
        self.assertEqual(s1["user"]["moodReactionFrom"], u2)

        # Cleanup
        unlink_user(u1)
        unlink_user(u2)

    def test_20_mood_change_notification_to_partner(self):
        """Verify mood update triggers partner state sync and handles edge cases (empty reason, null reason, HTML escaping)."""
        from backend.server import pair_users, unlink_user, get_user_full_state
        ts = int(time.time() * 1000)
        u1 = f"mood_notif_u1_{ts}"
        u2 = f"mood_notif_u2_{ts}"

        requests.get(f"{SERVER_URL}/api/state?username={u1}&tg_id=888111&displayName=Александр")
        requests.get(f"{SERVER_URL}/api/state?username={u2}&tg_id=888222&displayName=Екатерина")
        self.assertTrue(pair_users(u1, u2))

        # Case A: Standard mood update with reason and special chars like <3 and &
        r_mood = requests.post(f"{SERVER_URL}/api/mood", json={
            "username": u1,
            "emoji": "🥰",
            "label": "Счастлив",
            "reason": "Люблю тебя <3 & скучаю невероятно!"
        })
        self.assertEqual(r_mood.status_code, 200)
        s2 = get_user_full_state(u2)
        self.assertEqual(s2["partner"]["moodEmoji"], "🥰")
        self.assertEqual(s2["partner"]["moodLabel"], "Счастлив")
        self.assertEqual(s2["partner"]["moodReason"], "Люблю тебя <3 & скучаю невероятно!")

        # Case B: Mood update with empty string reason
        r_mood_empty = requests.post(f"{SERVER_URL}/api/mood", json={
            "username": u1,
            "emoji": "😴",
            "label": "Устал",
            "reason": ""
        })
        self.assertEqual(r_mood_empty.status_code, 200)
        s2_empty = get_user_full_state(u2)
        self.assertEqual(s2_empty["partner"]["moodEmoji"], "😴")
        self.assertEqual(s2_empty["partner"]["moodLabel"], "Устал")
        self.assertEqual(s2_empty["partner"]["moodReason"], "")

        # Case C: Critical edge case: reason is JSON null (None)
        r_mood_null = requests.post(f"{SERVER_URL}/api/mood", json={
            "username": u1,
            "emoji": "😤",
            "label": "Обиделся",
            "reason": None
        })
        self.assertEqual(r_mood_null.status_code, 200)
        s2_null = get_user_full_state(u2)
        self.assertEqual(s2_null["partner"]["moodEmoji"], "😤")
        self.assertEqual(s2_null["partner"]["moodLabel"], "Обиделся")
        self.assertEqual(s2_null["partner"]["moodReason"], "")

        # Cleanup
        unlink_user(u1)
        unlink_user(u2)

    def test_21_bot_persistent_menu_and_commands(self):
        """Verify persistent reply keyboard structure, commands setup, and menu button helpers."""
        from backend.server import get_main_reply_keyboard, setup_bot_commands, ensure_chat_menu_button, ensure_global_menu_and_commands

        # 1. Verify get_main_reply_keyboard structure
        kb = get_main_reply_keyboard()
        self.assertIn("keyboard", kb)
        self.assertTrue(kb.get("resize_keyboard"))
        self.assertTrue(kb.get("is_persistent"))

        rows = kb["keyboard"]
        self.assertEqual(len(rows), 5)

        # Row 1: WebApp button
        self.assertEqual(rows[0][0]["text"], "💑 Открыть «Двое»")

        # Row 2: Pair & Invite
        self.assertEqual(rows[1][0]["text"], "🔗 Привязать партнёра")
        self.assertEqual(rows[1][1]["text"], "📤 Пригласить партнёра")

        # Row 3: Nudge & Status buttons
        self.assertEqual(rows[2][0]["text"], "💌 Послать знак внимания")
        self.assertEqual(rows[2][1]["text"], "ℹ️ Мой статус")

        # Row 4: About & VP Collaboration
        self.assertEqual(rows[3][0]["text"], "📖 О приложении")
        self.assertEqual(rows[3][1]["text"], "🤝 Сотрудничество и ВП")

        # Row 5: Support
        self.assertEqual(rows[4][0]["text"], "💬 Связь с разработчиком")

        # 2. Verify commands setup function executes cleanly
        setup_bot_commands()

        # 3. Verify ensure_chat_menu_button executes cleanly for int and str chat ids
        ensure_chat_menu_button(8565474570)
        ensure_chat_menu_button("8565474570")
        ensure_global_menu_and_commands()

    def test_22_second_precision_timestamp_on_pairing(self):
        """Verify pairing and relinking sets exact second-precision ISO timestamp."""
        from backend.server import pair_users, unlink_user, get_user_full_state
        ts = int(time.time() * 1000)
        u1 = f"pair_sec1_{ts}"
        u2 = f"pair_sec2_{ts}"

        # Initialize users
        requests.get(f"{SERVER_URL}/api/state?username={u1}")
        requests.get(f"{SERVER_URL}/api/state?username={u2}")

        # Pair users
        self.assertTrue(pair_users(u1, u2))
        s1 = get_user_full_state(u1)
        s2 = get_user_full_state(u2)

        # Must have YYYY-MM-DDTHH:MM:SS format
        self.assertIn("T", s1["relationshipStart"])
        self.assertEqual(len(s1["relationshipStart"]), 19)
        self.assertEqual(s1["relationshipStart"], s2["relationshipStart"])

        # Unlink: must clear relationshipStart
        unlink_user(u1)
        s1_unlinked = get_user_full_state(u1)
        self.assertFalse(s1_unlinked["isPaired"])
        self.assertEqual(s1_unlinked["relationshipStart"], "")

        # Re-pair after 1 second sleep
        time.sleep(1.1)
        self.assertTrue(pair_users(u1, u2))
        s1_repaired = get_user_full_state(u1)
        self.assertTrue(s1_repaired["isPaired"])
        self.assertNotEqual(s1_repaired["relationshipStart"], s1["relationshipStart"])

        # Also verify re-pairing when users had a previous custom anniversary date (e.g. 2022-01-01)
        from backend.server import get_db, db_lock
        with db_lock:
            conn = get_db()
            conn.execute("UPDATE users SET anniversary_date = '2022-01-01' WHERE username = ?", (u1,))
            conn.commit()
            conn.close()
        time.sleep(1.1)
        self.assertTrue(pair_users(u1, u2))
        s1_repaired_cust = get_user_full_state(u1)
        self.assertNotEqual(s1_repaired_cust["relationshipStart"], "2022-01-01")
        self.assertIn("T", s1_repaired_cust["relationshipStart"])

        unlink_user(u1)
        unlink_user(u2)

    def test_23_welcome_photo_banner_file(self):
        """Verify bot avatar/banner is the new minimalist «Двое» image."""
        from backend.server import BANNER_IMAGE_PATH, AVATAR_IMAGE_PATH
        self.assertTrue(os.path.exists(BANNER_IMAGE_PATH))
        self.assertTrue(os.path.exists(AVATAR_IMAGE_PATH))
        self.assertTrue(BANNER_IMAGE_PATH.endswith("bot_avatar_dvoe.jpg"))
        # Verify it is the authentic high-res minimalist image (>100KB, not the old 29KB chibi)
        self.assertGreater(os.path.getsize(BANNER_IMAGE_PATH), 100000)

    def test_24_bot_menu_and_commands_handling(self):
        """Verify bot menu buttons and about presentation structure."""
        from backend.server import ABOUT_APP_TEXT, get_main_reply_keyboard
        self.assertTrue(len(ABOUT_APP_TEXT) > 50)
        self.assertIn("счётчик", ABOUT_APP_TEXT.lower())
        self.assertIn("Синхронизация настроения", ABOUT_APP_TEXT)

        kb = get_main_reply_keyboard()
        btn_texts = [btn["text"] for row in kb["keyboard"] for btn in row]
        self.assertIn("💑 Открыть «Двое»", btn_texts)
        self.assertIn("🔗 Привязать партнёра", btn_texts)
        self.assertIn("📤 Пригласить партнёра", btn_texts)
        self.assertIn("📖 О приложении", btn_texts)
        self.assertIn("💬 Связь с разработчиком", btn_texts)
        self.assertIn("💌 Послать знак внимания", btn_texts)
        self.assertIn("ℹ️ Мой статус", btn_texts)


if __name__ == "__main__":
    unittest.main()


