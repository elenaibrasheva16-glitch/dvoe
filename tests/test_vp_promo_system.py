#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unit and Integration Test Suite for Cross-Promo (ВП), Partner Channels & Promo Materials
Validates:
1. SQLite schema: promo_channels & promo_referrals tables exist and function correctly.
2. Helper functions: add, update, deactivate, and normalize promo codes.
3. Referral tracking: /start vp_<code> counts unique clicks per tg_id and ignores duplicate visits.
4. HTTP API: /api/promo_partner and /api/state integration.
5. Promo Assets: promo_screen_1.png, promo_screen_2.png, promo_post_banner.jpg existence and valid dimensions.
6. Privacy & Anonymization: zero leaks of owner personal info in promo texts, tools, or bot responses.
"""

import os
import sqlite3
import sys
import time
import unittest
import requests
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.server import (
    DB_PATH,
    PUBLIC_DIR,
    ADMIN_SYNC_TOKEN,
    normalize_promo_code,
    add_or_update_promo_channel,
    activate_promo_channel,
    deactivate_promo_channel,
    delete_promo_channel_permanently,
    build_vpadmin_panel,
    export_db_snapshot,
    import_db_snapshot,
    record_promo_referral,
    get_random_active_promo_partner,
    get_all_promo_channels,
    get_promo_channel_by_code,
    get_promo_creative_text,
)

SERVER_URL = "http://127.0.0.1:8085"

class TestVpPromoSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Clean test channels
        conn = sqlite3.connect(DB_PATH)
        conn.execute("DELETE FROM promo_referrals WHERE code LIKE 'test_%'")
        conn.execute("DELETE FROM promo_channels WHERE code LIKE 'test_%'")
        conn.commit()
        conn.close()

    @classmethod
    def tearDownClass(cls):
        conn = sqlite3.connect(DB_PATH)
        conn.execute("DELETE FROM promo_referrals WHERE code LIKE 'test_%'")
        conn.execute("DELETE FROM promo_channels WHERE code LIKE 'test_%'")
        conn.execute("DELETE FROM users WHERE username LIKE 'test_%'")
        conn.commit()
        conn.close()

    def test_01_code_normalization(self):
        self.assertEqual(normalize_promo_code("vp_love_notes"), "love_notes")
        self.assertEqual(normalize_promo_code("ref_sweet_couple"), "sweet_couple")
        self.assertEqual(normalize_promo_code("  VP_MyChannel! "), "mychannel")
        self.assertEqual(normalize_promo_code(""), "")

    def test_02_add_and_update_channel(self):
        ch = add_or_update_promo_channel("@test_romance", "Романтика для двоих", "Цитаты и эстетика любви", custom_code="test_romance")
        self.assertEqual(ch["code"], "test_romance")
        self.assertEqual(ch["channel_username"], "@test_romance")
        self.assertEqual(ch["channel_title"], "Романтика для двоих")
        self.assertEqual(ch["clicks"], 0)
        self.assertEqual(ch["active"], 1)

        # Update description
        ch2 = add_or_update_promo_channel("@test_romance", "Романтика для двоих 2.0", "Новое описание", custom_code="test_romance")
        self.assertEqual(ch2["channel_title"], "Романтика для двоих 2.0")
        self.assertEqual(ch2["channel_description"], "Новое описание")

    def test_03_referral_click_tracking_and_deduplication(self):
        # Fresh unique users
        tg_id_1 = 999001
        tg_id_2 = 999002

        # First click by user 1 -> counted
        res1 = record_promo_referral(tg_id_1, "vp_test_romance")
        self.assertTrue(res1)

        # Duplicate click by same user 1 -> NOT counted
        res2 = record_promo_referral(tg_id_1, "vp_test_romance")
        self.assertFalse(res2)

        # Click by user 2 -> counted
        res3 = record_promo_referral(tg_id_2, "test_romance")
        self.assertTrue(res3)

        # Verify clicks in database
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT clicks FROM promo_channels WHERE code = 'test_romance'").fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertEqual(row["clicks"], 2)

    def test_04_deactivate_and_reactivate_channel(self):
        success = deactivate_promo_channel("test_romance")
        self.assertTrue(success)

        ch_paused = get_promo_channel_by_code("test_romance")
        self.assertIsNotNone(ch_paused)
        self.assertEqual(ch_paused["active"], 0)

        # Resume channel
        resumed = activate_promo_channel("test_romance")
        self.assertTrue(resumed)
        ch_active = get_promo_channel_by_code("test_romance")
        self.assertEqual(ch_active["active"], 1)

        # Pause again
        self.assertTrue(deactivate_promo_channel("@test_romance"))

    def test_05_creative_text_generation(self):
        # 1. Variant A (default / aesthetic)
        text_a = get_promo_creative_text("test_channel", "a")
        self.assertIn("https://t.me/ChibiLovePara_bot?start=vp_test_channel", text_a)
        self.assertIn("«двое»", text_a.lower())
        self.assertIn("счётчик любви", text_a.lower())
        # Ensure zero raw HTML tags so copied text doesn't show broken markup in Telegram
        self.assertNotIn("<b>", text_a)
        self.assertNotIn("<i>", text_a)

        # 2. Variant B (emotional sync)
        text_b = get_promo_creative_text("test_channel", "b")
        self.assertIn("https://t.me/ChibiLovePara_bot?start=vp_test_channel", text_b)
        self.assertIn("«Двое»", text_b)
        self.assertIn("синхронизация настроения", text_b)
        self.assertNotIn("<b>", text_b)
        self.assertNotIn("<i>", text_b)

        # 3. Variant C (short native)
        text_c = get_promo_creative_text("test_channel", "c")
        self.assertIn("https://t.me/ChibiLovePara_bot?start=vp_test_channel", text_c)
        self.assertIn("«Двое»", text_c)
        self.assertIn("Находка для тех, кто в отношениях", text_c)
        self.assertNotIn("<b>", text_c)
        self.assertNotIn("<i>", text_c)

        # Privacy verification across all 3 variants: guarantee NO personal name or username in creatives
        for txt in [text_a, text_b, text_c]:
            for forbidden in ["danil", "ksjjfnnn", "adamlanda", "данил", "адам", "8565474570"]:
                self.assertNotIn(forbidden, txt.lower())

    def test_06_http_api_endpoints_and_admin_sync(self):
        import threading
        from backend.server import ThreadingHTTPServer, DvoeHTTPHandler
        srv = ThreadingHTTPServer(("127.0.0.1", 0), DvoeHTTPHandler)
        port = srv.server_address[1]
        t = threading.Thread(target=srv.serve_forever, daemon=True)
        t.start()
        try:
            url_base = f"http://127.0.0.1:{port}"
            # Register an active test partner
            add_or_update_promo_channel("@test_live_partner", "Партнёр Тест", "Уютный тестовый канал", custom_code="test_live_partner")

            # 1. /api/promo_partner
            r = requests.get(f"{url_base}/api/promo_partner", timeout=5)
            self.assertEqual(r.status_code, 200)
            data = r.json()
            self.assertTrue(data.get("ok"))
            self.assertIsNotNone(data.get("partner"))

            # 2. /api/state includes promoPartner
            r_st = requests.get(f"{url_base}/api/state?username=test_vp_viewer", timeout=5)
            self.assertEqual(r_st.status_code, 200)
            st_data = r_st.json()
            self.assertIn("promoPartner", st_data)

            # 3. /api/admin/sync unauthorized check
            r_unauth = requests.get(f"{url_base}/api/admin/sync?token=wrong", timeout=5)
            self.assertEqual(r_unauth.status_code, 403)

            # 4. /api/admin/sync authorized export
            r_sync = requests.get(f"{url_base}/api/admin/sync?token={ADMIN_SYNC_TOKEN}", timeout=5)
            self.assertEqual(r_sync.status_code, 200)
            sync_data = r_sync.json()
            self.assertTrue(sync_data.get("ok"))
            self.assertIn("promo_channels", sync_data)

            # 5. /api/admin/vp lifecycle (add -> pause -> resume -> delete)
            r_add = requests.post(f"{url_base}/api/admin/vp", json={
                "token": ADMIN_SYNC_TOKEN,
                "action": "add",
                "channel_username": "@test_api_vp",
                "channel_title": "Тест API ВП",
                "channel_description": "Описание теста",
                "code": "test_api_vp"
            }, timeout=5)
            self.assertEqual(r_add.status_code, 200)
            self.assertTrue(r_add.json().get("ok"))

            r_pause = requests.post(f"{url_base}/api/admin/vp", json={
                "token": ADMIN_SYNC_TOKEN,
                "action": "pause",
                "code": "test_api_vp"
            }, timeout=5)
            self.assertEqual(r_pause.status_code, 200)
            self.assertTrue(r_pause.json().get("ok"))
            self.assertEqual(get_promo_channel_by_code("test_api_vp")["active"], 0)

            r_resume = requests.post(f"{url_base}/api/admin/vp", json={
                "token": ADMIN_SYNC_TOKEN,
                "action": "resume",
                "code": "test_api_vp"
            }, timeout=5)
            self.assertEqual(r_resume.status_code, 200)
            self.assertTrue(r_resume.json().get("ok"))
            self.assertEqual(get_promo_channel_by_code("test_api_vp")["active"], 1)

            r_del = requests.post(f"{url_base}/api/admin/vp", json={
                "token": ADMIN_SYNC_TOKEN,
                "action": "delete",
                "code": "test_api_vp"
            }, timeout=5)
            self.assertEqual(r_del.status_code, 200)
            self.assertTrue(r_del.json().get("ok"))
            self.assertIsNone(get_promo_channel_by_code("test_api_vp"))
        finally:
            srv.shutdown()
            srv.server_close()

    def test_07_promo_visual_assets_integrity(self):
        s1_path = os.path.join(PUBLIC_DIR, "img", "promo_screen_1.png")
        s2_path = os.path.join(PUBLIC_DIR, "img", "promo_screen_2.png")
        banner_path = os.path.join(PUBLIC_DIR, "img", "promo_post_banner.jpg")

        self.assertTrue(os.path.exists(s1_path), f"Missing {s1_path}")
        self.assertTrue(os.path.exists(s2_path), f"Missing {s2_path}")
        self.assertTrue(os.path.exists(banner_path), f"Missing {banner_path}")

        # Check valid image headers and dimensions
        with Image.open(s1_path) as im:
            self.assertEqual(im.size, (800, 1380))
        with Image.open(s2_path) as im:
            self.assertEqual(im.size, (800, 1380))
        with Image.open(banner_path) as im:
            self.assertEqual(im.size, (1280, 720))

    def test_08_privacy_audit_promo_kit(self):
        kit_path = os.path.join(BASE_DIR, "PROMO_VP_KIT.md")
        self.assertTrue(os.path.exists(kit_path))
        with open(kit_path, "r", encoding="utf-8") as f:
            content = f.read().lower()

        # Guarantee zero personal leaks
        for forbidden in ["danil", "ksjjfnnn", "adamlanda", "данил", "адам"]:
            self.assertNotIn(forbidden, content)

    def test_09_channel_finder_bio_extraction(self):
        from tools.vp_channel_finder import extract_contacts_from_bio, generate_outreach_pack
        bio = "Наш канал о любви 💕 Связь с администратором: @love_manager и бот предложки https://t.me/love_feed_bot"
        contacts = extract_contacts_from_bio(bio)
        self.assertIn("@love_manager", contacts["admins"])
        self.assertIn("@love_feed_bot", contacts["bots"])

        pack = generate_outreach_pack("@love_manager", "Любовь и Нежность")
        self.assertTrue(pack["template_1_dm"]["privacy_clean"])
        self.assertTrue(pack["template_2_bot"]["privacy_clean"])
        self.assertTrue(pack["template_3_comment"]["privacy_clean"])

    def test_10_deactivate_and_delete_channel_by_username(self):
        # Add channel with custom code
        add_or_update_promo_channel("@test_user_deact", "Канал Тест", custom_code="test_code_deact")
        
        # Deactivate by @username
        success = deactivate_promo_channel("@test_user_deact")
        self.assertTrue(success)

        row = get_promo_channel_by_code("test_code_deact")
        self.assertEqual(row["active"], 0)

        # Permanently delete by @username
        self.assertTrue(delete_promo_channel_permanently("@test_user_deact"))
        self.assertIsNone(get_promo_channel_by_code("test_code_deact"))

    def test_11_polina_channel_and_vpadmin_panel(self):
        polina = get_promo_channel_by_code("blogtpdevochki")
        self.assertIsNotNone(polina)
        self.assertEqual(polina["channel_username"], "@blogtpdevochki")
        self.assertEqual(polina["channel_title"], "блог девочки ❄️")
        self.assertEqual(polina["channel_description"], "девчачий блог про креатив, учебу, искренность и отношения💋❄️")
        self.assertEqual(polina["active"], 1)

        panel_text, panel_kb = build_vpadmin_panel()
        self.assertIn("блог девочки ❄️", panel_text)
        self.assertIn("blogtpdevochki", panel_text)
        self.assertIn("inline_keyboard", panel_kb)

if __name__ == "__main__":
    unittest.main()
