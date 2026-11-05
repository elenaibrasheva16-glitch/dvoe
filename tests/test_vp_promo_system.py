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
    normalize_promo_code,
    add_or_update_promo_channel,
    deactivate_promo_channel,
    record_promo_referral,
    get_random_active_promo_partner,
    get_all_promo_channels,
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

    def test_04_deactivate_channel(self):
        success = deactivate_promo_channel("test_romance")
        self.assertTrue(success)

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT active FROM promo_channels WHERE code = 'test_romance'").fetchone()
        conn.close()
        self.assertEqual(row["active"], 0)

    def test_05_creative_text_generation(self):
        text = get_promo_creative_text("test_channel")
        self.assertIn("https://t.me/ChibiLovePara_bot?start=vp_test_channel", text)
        self.assertIn("«Двое»", text)
        self.assertIn("счётчик отношений", text)

        # Privacy verification: guarantee NO personal name or username in creative
        for forbidden in ["danil", "ksjjfnnn", "adamlanda", "данил", "адам"]:
            self.assertNotIn(forbidden, text.lower())

    def test_06_http_api_endpoints(self):
        # Register an active test partner
        add_or_update_promo_channel("@test_live_partner", "Партнёр Тест", "Уютный тестовый канал", custom_code="test_live_partner")

        # 1. /api/promo_partner
        r = requests.get(f"{SERVER_URL}/api/promo_partner", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data.get("ok"))
        self.assertIsNotNone(data.get("partner"))

        # 2. /api/state includes promoPartner
        r_st = requests.get(f"{SERVER_URL}/api/state?username=test_vp_viewer", timeout=5)
        self.assertEqual(r_st.status_code, 200)
        st_data = r_st.json()
        self.assertIn("promoPartner", st_data)

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

if __name__ == "__main__":
    unittest.main()
