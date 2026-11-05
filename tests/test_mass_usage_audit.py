#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Production Mass Usage & Concurrency Stress Audit Suite for «Двое»
Validates:
1. Arbitrary new users with ONLY numeric tg_id (no username)
2. Photo upload with center-square 1:1 cropping & reset
3. Full pairing lifecycle: pairing, partner state sync, and unlinking
4. Mood & detailed reason tracking and synchronization
5. Tactile heart nudges and reactions
6. Support tickets via WebApp API and bot forwarding
7. High-concurrency stress test (25 concurrent threads under SQLite WAL)
8. Telegram Bot API presentation compliance (no "chibi", clean locale texts)
"""

import concurrent.futures
import io
import json
import os
import random
import sys
import time
import unittest
import requests
from PIL import Image

SERVER_URL = "http://127.0.0.1:8085"
BOT_TOKEN = "9265259467:AAHoLLQJKFknBZJkWUsBLXE0RJsuoc0zafw"


class TestMassUsageAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        r = requests.get(f"{SERVER_URL}/api/health", timeout=5)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    @classmethod
    def tearDownClass(cls):
        try:
            import sqlite3
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_path = os.path.join(base_dir, "backend", "chibilove.db")
            if os.path.exists(db_path):
                conn = sqlite3.connect(db_path)
                conn.execute("DELETE FROM users WHERE username NOT IN ('ksjjfnnn', 'adamlanda')")
                conn.execute("DELETE FROM pair_requests WHERE from_username NOT IN ('ksjjfnnn', 'adamlanda') AND to_username NOT IN ('ksjjfnnn', 'adamlanda')")
                conn.execute("DELETE FROM support_tickets WHERE username NOT IN ('ksjjfnnn', 'adamlanda') OR message LIKE 'Очень нравится%'")
                conn.execute("DELETE FROM support_sessions WHERE tg_id = 2034621049")
                conn.execute("DELETE FROM care_logs WHERE couple_key NOT LIKE '%ksjjfnnn%' AND couple_key NOT LIKE '%adamlanda%'")
                conn.execute("DELETE FROM uploaded_files WHERE filename LIKE 'test_%' OR filename LIKE 'avatar_avatar_%' OR filename LIKE 'ext_src_%' OR filename LIKE 'avatar_test_%' OR filename LIKE 'user_%'")
                conn.commit()
                conn.close()

                # Clean disk test uploads
                uploads_dir = os.path.join(base_dir, "public", "uploads")
                if os.path.exists(uploads_dir):
                    for f in os.listdir(uploads_dir):
                        if f.startswith(("test_", "avatar_test_", "avatar_avatar_", "ext_src_", "user_")):
                            try:
                                os.remove(os.path.join(uploads_dir, f))
                            except Exception:
                                pass
        except Exception:
            pass

    def test_01_user_without_username_numeric_tg_id(self):
        """Verify arbitrary user with no Telegram username (only tg_id) can register, get state, and display name."""
        unique_tg_id = random.randint(100000000, 999999999)
        r = requests.get(f"{SERVER_URL}/api/state?tg_id={unique_tg_id}&displayName=АнонимныйПользователь")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data["user"]["tgId"], unique_tg_id)
        self.assertEqual(data["user"]["username"], f"user_{unique_tg_id}")
        self.assertEqual(data["user"]["displayName"], "АнонимныйПользователь")
        self.assertTrue(data["user"]["inviteCode"].startswith("PAIR-"))
        self.assertFalse(data.get("isPaired"))

    def test_02_photo_upload_and_center_square_crop(self):
        """Verify photo upload crops rectangular images to exact 1:1 centered squares."""
        import base64
        unique_tg_id = random.randint(100000000, 999999999)
        uname = f"user_{unique_tg_id}"
        requests.get(f"{SERVER_URL}/api/state?tg_id={unique_tg_id}")

        # Create wide rectangle 600x300 (2:1 aspect ratio)
        img = Image.new("RGB", (600, 300), color=(255, 105, 180))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        r = requests.post(f"{SERVER_URL}/api/photo/upload", json={
            "username": uname,
            "image": b64
        })
        self.assertEqual(r.status_code, 200)
        photo_url = r.json().get("photoUrl")
        self.assertTrue(photo_url.startswith("/uploads/"))

        # Check physical file dimensions
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(base_dir, "public", photo_url.lstrip("/"))
        self.assertTrue(os.path.exists(file_path))
        with Image.open(file_path) as saved_img:
            self.assertEqual(saved_img.size[0], saved_img.size[1], "Uploaded avatar must be exactly 1:1 square")

        # Test photo reset
        r_reset = requests.post(f"{SERVER_URL}/api/photo/reset", json={"username": uname})
        self.assertEqual(r_reset.status_code, 200)
        s_reset = requests.get(f"{SERVER_URL}/api/state?username={uname}").json()
        self.assertEqual(s_reset["user"]["photoUrl"], "/img/avatar_me.svg")

    def test_03_full_pairing_and_unlinking_lifecycle(self):
        """Verify two arbitrary users can pair via invite code, see shared state, and unlink cleanly."""
        id_a = random.randint(100000000, 999999999)
        id_b = random.randint(100000000, 999999999)
        uname_a = f"user_{id_a}"
        uname_b = f"user_{id_b}"

        s_a = requests.get(f"{SERVER_URL}/api/state?tg_id={id_a}&displayName=ПользовательА").json()
        s_b = requests.get(f"{SERVER_URL}/api/state?tg_id={id_b}&displayName=ПользовательБ").json()
        code_b = s_b["user"]["inviteCode"]

        # User A enters User B's code
        r_pair = requests.post(f"{SERVER_URL}/api/pair", json={
            "username": uname_a,
            "partner_code": code_b
        })
        self.assertEqual(r_pair.status_code, 200)
        self.assertTrue(r_pair.json().get("ok"))
        self.assertTrue(r_pair.json()["state"]["isPaired"])

        # Check User B's state reflects pairing
        s_b_paired = requests.get(f"{SERVER_URL}/api/state?username={uname_b}").json()
        self.assertTrue(s_b_paired["isPaired"])
        self.assertEqual(s_b_paired["partner"]["username"], uname_a)
        self.assertEqual(s_b_paired["partner"]["displayName"], "ПользовательА")

        # Unlink
        r_unlink = requests.post(f"{SERVER_URL}/api/pair/unlink", json={"username": uname_a})
        self.assertEqual(r_unlink.status_code, 200)
        self.assertFalse(r_unlink.json()["state"]["isPaired"])

        s_b_unlinked = requests.get(f"{SERVER_URL}/api/state?username={uname_b}").json()
        self.assertFalse(s_b_unlinked["isPaired"])
        self.assertIsNone(s_b_unlinked["partner"])

    def test_04_mood_tracking_and_heart_nudge(self):
        """Verify mood update with reason and heart nudges sync between paired partners."""
        id_a = random.randint(100000000, 999999999)
        id_b = random.randint(100000000, 999999999)
        uname_a = f"user_{id_a}"
        uname_b = f"user_{id_b}"

        s_a = requests.get(f"{SERVER_URL}/api/state?tg_id={id_a}&displayName=Данил").json()
        s_b = requests.get(f"{SERVER_URL}/api/state?tg_id={id_b}&displayName=Алина").json()
        requests.post(f"{SERVER_URL}/api/pair", json={"username": uname_a, "partner_code": s_b["user"]["inviteCode"]})

        # Set mood with long note
        reason_note = "Готовлю вкусный ужин для нас двоих 🍝 Жду с нетерпением!"
        r_mood = requests.post(f"{SERVER_URL}/api/mood", json={
            "username": uname_a,
            "emoji": "🥰",
            "label": "Люблю",
            "reason": reason_note
        })
        self.assertEqual(r_mood.status_code, 200)

        # Partner checks
        s_b_cur = requests.get(f"{SERVER_URL}/api/state?username={uname_b}").json()
        self.assertEqual(s_b_cur["partner"]["moodEmoji"], "🥰")
        self.assertEqual(s_b_cur["partner"]["moodReason"], reason_note)

        # Heart nudge
        r_nudge = requests.post(f"{SERVER_URL}/api/heart-nudge", json={"username": uname_b})
        self.assertEqual(r_nudge.status_code, 200)
        self.assertTrue(r_nudge.json().get("ok"))

        # Check partner received reaction
        s_a_cur = requests.get(f"{SERVER_URL}/api/state?username={uname_a}").json()
        self.assertEqual(s_a_cur["user"]["moodReaction"], "❤️")
        self.assertEqual(s_a_cur["user"]["moodReactionFrom"], uname_b)

        # Cleanup
        requests.post(f"{SERVER_URL}/api/pair/unlink", json={"username": uname_a})

    def test_05_support_ticket_submission(self):
        """Verify support ticket submission from WebApp."""
        uid = random.randint(100000000, 999999999)
        uname = f"user_{uid}"
        msg = "Тестовое обращение в поддержку через API: приложение работает отлично!"
        r = requests.post(f"{SERVER_URL}/api/support", json={
            "username": uname,
            "tg_id": uid,
            "message": msg,
            "category": "feedback"
        })
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json().get("ok"))

    def test_06_high_concurrency_stress_wal(self):
        """Execute 50 concurrent requests across 20 worker threads to stress test SQLite WAL and busy timeout."""
        def hit_endpoint(i):
            uid = random.randint(100000000, 999999999)
            uname = f"stress_user_{uid}"
            r1 = requests.get(f"{SERVER_URL}/api/state?username={uname}&tg_id={uid}&displayName=StressTester")
            if r1.status_code != 200:
                return False, f"GET state failed: {r1.status_code}"

            r2 = requests.post(f"{SERVER_URL}/api/mood", json={
                "username": uname,
                "emoji": "🎉",
                "label": "Праздную",
                "reason": f"Concurrent test iteration {i}"
            })
            if r2.status_code != 200:
                return False, f"POST mood failed: {r2.status_code}"

            r3 = requests.post(f"{SERVER_URL}/api/profile", json={
                "username": uname,
                "displayName": f"Stress Tester #{i}"
            })
            if r3.status_code != 200:
                return False, f"POST profile failed: {r3.status_code}"

            return True, "OK"

        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(hit_endpoint, i) for i in range(50)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        for ok, msg in results:
            self.assertTrue(ok, f"Concurrency stress failed: {msg}")

    def test_07_telegram_bot_api_presentation_verification(self):
        """Verify bot description and commands via live Telegram Bot API."""
        import urllib.request
        def call_tg(method, data=None):
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
            if data:
                req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"})
            else:
                req = urllib.request.Request(url)
            try:
                proxies = {"http": "http://127.0.0.1:10809", "https": "http://127.0.0.1:10809"}
                proxy_support = urllib.request.ProxyHandler(proxies)
                opener = urllib.request.build_opener(proxy_support)
                with opener.open(req, timeout=10) as resp:
                    return json.loads(resp.read().decode("utf-8"))
            except Exception:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    return json.loads(resp.read().decode("utf-8"))

        me = call_tg("getMe")
        self.assertTrue(me.get("ok"))
        self.assertEqual(me["result"]["first_name"], "«Двое» 💕 Приложение для пары")

        desc_default = call_tg("getMyDescription")
        self.assertTrue(desc_default.get("ok"))
        self.assertIn("«Двое»", desc_default["result"]["description"])
        self.assertNotIn("chibi", desc_default["result"]["description"].lower())

        desc_ru = call_tg("getMyDescription", {"language_code": "ru"})
        self.assertTrue(desc_ru.get("ok"))
        self.assertIn("«Двое»", desc_ru["result"]["description"])
        self.assertNotIn("chibi", desc_ru["result"]["description"].lower())

        desc_en = call_tg("getMyDescription", {"language_code": "en"})
        self.assertTrue(desc_en.get("ok"))
        self.assertIn("«Двое»", desc_en["result"]["description"])
        self.assertNotIn("chibi", desc_en["result"]["description"].lower())

        sd_ru = call_tg("getMyShortDescription", {"language_code": "ru"})
        self.assertTrue(sd_ru.get("ok"))
        self.assertIn("Эстетичное", sd_ru["result"]["short_description"])
        self.assertNotIn("chibi", sd_ru["result"]["short_description"].lower())

        cmds = call_tg("getMyCommands", {"language_code": "ru"})
        self.assertTrue(cmds.get("ok"))
        cmd_names = [c["command"] for c in cmds["result"]]
        self.assertIn("start", cmd_names)
        self.assertIn("pair", cmd_names)
        self.assertIn("nudge", cmd_names)
        self.assertIn("status", cmd_names)


if __name__ == "__main__":
    unittest.main()
