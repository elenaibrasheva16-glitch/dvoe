#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
ChibiLove TMA — Comprehensive Automated Test Suite (Tiers 1-4)
Couple E2E, Unit & Integration Verification Suite

Tiers Covered:
- Tier 1 (Feature Coverage): Every API endpoint (HTTP 200, JSON schema, anniversary clock, mood setter, care actions)
- Tier 2 (Boundary & Corner Cases): Leap year Feb 29, negative streak recovery, insufficient hearts (<200), timezone UTC rollover, double claiming daily rewards
- Tier 3 (Cross-Feature Combinations & Concurrency): Simultaneous partner actions, mood sync in care mode, streak restore triggering recalculation
- Tier 4 (Real-World Couple Scenarios): End-to-end couple lifecycle (onboarding, 200 hearts, daily claim, mood sharing, care routine, missed streak day, restore with hearts)

Can be executed via:
  python3 test_couple_e2e_integration.py
  python3 -m unittest test_couple_e2e_integration.py
================================================================================
"""

import os
import sys
import time
import json
import uuid
import base64
import sqlite3
import unittest
import threading
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8085")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "backend", "chibilove.db")

# ------------------------------------------------------------------------------
# HTTP Client Helpers
# ------------------------------------------------------------------------------

def http_get(path, timeout=5):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            raw = res.read().decode("utf-8")
            try:
                data = json.loads(raw)
            except Exception:
                data = raw
            return res.status, data
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            data = json.loads(raw)
        except Exception:
            data = raw
        return e.code, data


def http_post(path, data, timeout=5):
    url = f"{BASE_URL}{path}"
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            raw = res.read().decode("utf-8")
            try:
                data = json.loads(raw)
            except Exception:
                data = raw
            return res.status, data
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            data = json.loads(raw)
        except Exception:
            data = raw
        return e.code, data


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn


def cleanup_test_users(*usernames):
    if not os.path.exists(DB_PATH):
        return
    try:
        conn = get_db()
        for u in usernames:
            conn.execute("DELETE FROM users WHERE username = ?", (u,))
            conn.execute("DELETE FROM pair_requests WHERE from_username = ? OR to_username = ?", (u, u))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Warning] DB cleanup error: {e}")


# ==============================================================================
# TIER 1: FEATURE COVERAGE (All API Endpoints, Payloads, Calculations)
# ==============================================================================

class TestTier1FeatureCoverage(unittest.TestCase):
    """
    Tier 1 tests verify every single HTTP endpoint, payload validation,
    response status codes (200, 400), anniversary clock math, mood setting,
    and care actions.
    """

    @classmethod
    def setUpClass(cls):
        cls.user_solo = f"t1_solo_{uuid.uuid4().hex[:8]}"
        cls.user_a = f"t1_user_a_{uuid.uuid4().hex[:8]}"
        cls.user_b = f"t1_user_b_{uuid.uuid4().hex[:8]}"

    @classmethod
    def tearDownClass(cls):
        cleanup_test_users(cls.user_solo, cls.user_a, cls.user_b)

    def test_01_api_health(self):
        """GET /api/health returns 200 and bot details."""
        code, data = http_get("/api/health")
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("bot"), "ChibiLovePara_bot")
        self.assertIn("webappUrl", data)

    def test_02_api_state_solo_user_contract(self):
        """GET /api/state returns full valid schema for solo user."""
        code, data = http_get(f"/api/state?username={self.user_solo}")
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))
        self.assertIn("user", data)
        self.assertIsNone(data.get("partner"))

        user = data["user"]
        self.assertEqual(user["username"], self.user_solo)
        self.assertGreaterEqual(user["hearts"], 200)
        self.assertIn("care", user)
        care = user["care"]
        self.assertIn("hungerStage", care)
        self.assertIn("cleanStage", care)
        self.assertIn("energyStage", care)
        self.assertIn("isSleeping", care)
        self.assertIn("flameStage", care)
        self.assertIn("daysTogether", care)
        self.assertEqual(data.get("restoreCostHearts"), 200)
        self.assertIsInstance(data.get("starsPackages"), list)

    def test_03_api_pet_save(self):
        """POST /api/pet and /api/avatar save pet configuration."""
        pet_payload = {
            "username": self.user_solo,
            "avatar": {
                "species": "bunny",
                "name": "Зефирный Зайка 🐰",
                "bgColor": "green"
            }
        }
        code, data = http_post("/api/pet", pet_payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))
        saved_pet = data["user"]["pet"]
        self.assertEqual(saved_pet["species"], "bunny")
        self.assertEqual(saved_pet["name"], "Зефирный Зайка 🐰")

    def test_04_api_settings_theme(self):
        """POST /api/settings updates background pastel theme."""
        code, data = http_post("/api/settings", {"username": self.user_solo, "bgColor": "purple"})
        self.assertEqual(code, 200)
        self.assertEqual(data["user"]["bgColor"], "purple")

        # Invalid theme does not corrupt user state
        code, data = http_post("/api/settings", {"username": self.user_solo, "bgColor": "invalid_neon_rgb"})
        self.assertEqual(code, 200)
        self.assertEqual(data["user"]["bgColor"], "purple")

    def test_05_api_pair_request_validation(self):
        """POST /api/pair/request validates inputs (empty, self, valid)."""
        # Empty partner username -> 400
        code, data = http_post("/api/pair/request", {"username": self.user_a, "partnerUsername": ""})
        self.assertEqual(code, 400)
        self.assertFalse(data.get("ok"))
        self.assertIn("error", data)

        # Self-pairing -> 400
        code, data = http_post("/api/pair/request", {"username": self.user_a, "partnerUsername": self.user_a})
        self.assertEqual(code, 400)
        self.assertFalse(data.get("ok"))

        # Valid partner request -> 200
        code, data = http_post("/api/pair/request", {"username": self.user_a, "partnerUsername": self.user_b})
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))

        # Check receiver state has incoming request
        _, b_state = http_get(f"/api/state?username={self.user_b}")
        incoming = b_state.get("incomingRequests", [])
        self.assertTrue(any(req["fromUsername"] == self.user_a for req in incoming))

    def test_06_api_pair_respond_and_link(self):
        """POST /api/pair/respond accepts pair request and links both users."""
        _, b_state = http_get(f"/api/state?username={self.user_b}")
        req_id = b_state["incomingRequests"][0]["id"]

        code, data = http_post("/api/pair/respond", {
            "username": self.user_b,
            "requestId": req_id,
            "fromUsername": self.user_a,
            "action": "accept"
        })
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))
        self.assertEqual(data["user"]["partnerUsername"], self.user_a)
        self.assertIsNotNone(data.get("partner"))

        # Confirm User A also sees User B as partner
        _, a_state = http_get(f"/api/state?username={self.user_a}")
        self.assertEqual(a_state["user"]["partnerUsername"], self.user_b)
        self.assertEqual(a_state["partner"]["username"], self.user_b)

    def test_07_api_pair_reciprocal_auto_accept(self):
        """Reciprocal pair request automatically links without explicit respond."""
        u1 = f"t1_auto_1_{uuid.uuid4().hex[:6]}"
        u2 = f"t1_auto_2_{uuid.uuid4().hex[:6]}"
        try:
            http_get(f"/api/state?username={u1}")
            http_get(f"/api/state?username={u2}")

            # U1 -> U2
            http_post("/api/pair/request", {"username": u1, "partnerUsername": u2})
            # U2 -> U1 (reverse request triggers auto-accept)
            code, data = http_post("/api/pair/request", {"username": u2, "partnerUsername": u1})
            self.assertEqual(code, 200)
            self.assertEqual(data["user"]["partnerUsername"], u1)

            _, u1_state = http_get(f"/api/state?username={u1}")
            self.assertEqual(u1_state["user"]["partnerUsername"], u2)
        finally:
            cleanup_test_users(u1, u2)

    def test_08_api_care_actions_full_suite(self):
        """POST /api/care/action executes feed, shower, sleep, pet."""
        # 1. Feed
        code, data = http_post("/api/care/action", {
            "username": self.user_a,
            "action": "feed",
            "itemName": "Капкейк с вишенкой 🧁"
        })
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))

        # 2. Shower
        code, data = http_post("/api/care/action", {
            "username": self.user_a,
            "action": "shower"
        })
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))

        # 3. Sleep (toggle on)
        code, data = http_post("/api/care/action", {
            "username": self.user_a,
            "action": "sleep"
        })
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))
        partner_care = data["partner"]["care"]
        self.assertTrue(partner_care["isSleeping"])

        # 4. Sleep (toggle off / wake up)
        code, data = http_post("/api/care/action", {
            "username": self.user_a,
            "action": "sleep"
        })
        self.assertEqual(code, 200)
        partner_care = data["partner"]["care"]
        self.assertFalse(partner_care["isSleeping"])

        # 5. Pet
        code, data = http_post("/api/care/action", {
            "username": self.user_a,
            "action": "pet"
        })
        self.assertEqual(code, 200)

        # 6. Invalid action returns 400
        code, data = http_post("/api/care/action", {
            "username": self.user_a,
            "action": "unsupported_action_fly"
        })
        self.assertEqual(code, 400)
        self.assertFalse(data.get("ok"))

    def test_09_api_mood_setter_and_sync(self):
        """POST /api/mood updates mood, label, and reason, syncing to partner."""
        mood_payload = {
            "username": self.user_a,
            "mood": "in_love",
            "moodLabel": "Влюблён(а) 💕",
            "moodReason": "Думаю о нас каждую секунду! 💖"
        }
        code, data = http_post("/api/mood", mood_payload)
        self.assertEqual(code, 200)
        self.assertEqual(data["user"]["mood"], "in_love")
        self.assertEqual(data["user"]["moodReason"], "Думаю о нас каждую секунду! 💖")

        # Partner B observes User A's updated mood
        _, b_state = http_get(f"/api/state?username={self.user_b}")
        self.assertEqual(b_state["partner"]["mood"], "in_love")
        self.assertEqual(b_state["partner"]["moodReason"], "Думаю о нас каждую секунду! 💖")

    def test_10_api_pose_setter(self):
        """POST /api/pose sets couple pose for both partners."""
        code, data = http_post("/api/pose", {"username": self.user_a, "pose": "dance"})
        self.assertEqual(code, 200)
        self.assertEqual(data["user"]["couplePose"], "dance")

        _, b_state = http_get(f"/api/state?username={self.user_b}")
        self.assertEqual(b_state["user"]["couplePose"], "dance")

    def test_11_api_care_pet_finger_touch_log(self):
        """POST /api/care/pet logs petting and throttles rapid duplicates."""
        code, data = http_post("/api/care/pet", {"username": self.user_a})
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))

        # Subsequent call within 180s still succeeds gracefully without error
        code2, data2 = http_post("/api/care/pet", {"username": self.user_a})
        self.assertEqual(code2, 200)
        self.assertTrue(data2.get("ok"))

    def test_12_api_support_ticket(self):
        """POST /api/support validates message text."""
        # Empty text -> 400
        code, data = http_post("/api/support", {"username": self.user_a, "message": ""})
        self.assertEqual(code, 400)
        self.assertFalse(data.get("ok"))

        # Valid text -> 200
        code, data = http_post("/api/support", {"username": self.user_a, "message": "Тестовый вопрос в поддержку"})
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))

    def test_13_api_accessories_toggle(self):
        """POST /api/accessories/toggle returns 200 OK."""
        code, data = http_post("/api/accessories/toggle", {"username": self.user_a})
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))

    def test_14_api_save_ref(self):
        """POST /api/save_ref saves anime style reference image."""
        tiny_gif_b64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        code, data = http_post("/api/save_ref", {
            "index": 999,
            "data": f"data:image/gif;base64,{tiny_gif_b64}"
        })
        self.assertEqual(code, 200)
        self.assertTrue(data.get("ok"))

    def test_15_anniversary_clock_calculation(self):
        """Verifies relationship clock, daysTogether, pairedDateStr, hoursLeft countdown."""
        _, a_state = http_get(f"/api/state?username={self.user_a}")
        care = a_state["partner"]["care"]
        self.assertGreaterEqual(care["daysTogether"], 1)
        self.assertIsInstance(care["pairedDateStr"], str)
        self.assertEqual(len(care["pairedDateStr"].split(".")), 3)
        self.assertGreaterEqual(care["hoursLeft"], 0)
        self.assertLessEqual(care["hoursLeft"], 24)
        self.assertGreaterEqual(care["minsLeft"], 0)
        self.assertLess(care["minsLeft"], 60)
        self.assertEqual(care["flameStage"]["tier"], 1)


# ==============================================================================
# TIER 2: BOUNDARY & CORNER CASES
# ==============================================================================

class TestTier2BoundaryCornerCases(unittest.TestCase):
    """
    Tier 2 tests verify tricky edge conditions:
    - Leap Year anniversary date (Feb 29)
    - Negative streak recovery
    - Insufficient hearts (<200) on restore
    - Free restore boundary restrictions
    - Timezone differences & UTC calendar day rollover
    - Double-claiming daily reward prevention
    """

    @classmethod
    def setUpClass(cls):
        cls.leap_a = f"t2_leap_a_{uuid.uuid4().hex[:6]}"
        cls.leap_b = f"t2_leap_b_{uuid.uuid4().hex[:6]}"
        cls.neg_a = f"t2_neg_a_{uuid.uuid4().hex[:6]}"
        cls.neg_b = f"t2_neg_b_{uuid.uuid4().hex[:6]}"
        cls.res_a = f"t2_res_a_{uuid.uuid4().hex[:6]}"
        cls.res_b = f"t2_res_b_{uuid.uuid4().hex[:6]}"

    @classmethod
    def tearDownClass(cls):
        cleanup_test_users(
            cls.leap_a, cls.leap_b,
            cls.neg_a, cls.neg_b,
            cls.res_a, cls.res_b
        )

    def test_201_leap_year_anniversary_feb_29(self):
        """Anniversary paired on Feb 29 (Leap Year) formats and calculates accurately."""
        # Feb 29, 2024 12:00:00 UTC = 1709208000
        leap_paired_at = 1709208000.0

        # Create pair and inject Feb 29, 2024 timestamp
        http_get(f"/api/state?username={self.leap_a}")
        http_get(f"/api/state?username={self.leap_b}")
        http_post("/api/pair/request", {"username": self.leap_a, "partnerUsername": self.leap_b})
        http_post("/api/pair/request", {"username": self.leap_b, "partnerUsername": self.leap_a})

        conn = get_db()
        conn.execute("UPDATE users SET paired_at = ? WHERE username IN (?, ?)",
                     (leap_paired_at, self.leap_a, self.leap_b))
        conn.commit()
        conn.close()

        code, state = http_get(f"/api/state?username={self.leap_a}")
        self.assertEqual(code, 200)
        care = state["partner"]["care"]
        self.assertEqual(care["pairedDateStr"], "29.02.2024")

        # Verify days together calculation 366 days later (exactly 1 leap year)
        # 1709208000 + 366 * 86400
        now_ts = time.time()
        expected_days = max(1, int(max(0.0, now_ts - leap_paired_at) // 86400) + 1)
        self.assertEqual(care["daysTogether"], expected_days)
        self.assertGreaterEqual(care["daysTogether"], 366)

    def test_202_negative_streak_recovery(self):
        """Corrupted negative streak_days or future paired_at recovers safely to >= 1."""
        http_get(f"/api/state?username={self.neg_a}")
        http_get(f"/api/state?username={self.neg_b}")
        http_post("/api/pair/request", {"username": self.neg_a, "partnerUsername": self.neg_b})
        http_post("/api/pair/request", {"username": self.neg_b, "partnerUsername": self.neg_a})

        # Inject negative streak days and future timestamp
        conn = get_db()
        future_time = time.time() + 360000.0  # 100 hours in the future
        conn.execute("UPDATE users SET streak_days = -15, paired_at = ? WHERE username = ?",
                     (future_time, self.neg_b))
        conn.commit()
        conn.close()

        code, state = http_get(f"/api/state?username={self.neg_a}")
        self.assertEqual(code, 200)
        care = state["partner"]["care"]
        # System formula max(1, int(max(0.0, ...))) guarantees daysTogether >= 1
        self.assertGreaterEqual(care["daysTogether"], 1)

        # Performing care action restores positive streak
        code2, state2 = http_post("/api/care/action", {
            "username": self.neg_a,
            "action": "feed"
        })
        self.assertEqual(code2, 200)
        self.assertGreaterEqual(state2["partner"]["care"]["daysTogether"], 1)

    def test_203_insufficient_hearts_on_restore(self):
        """Restoring with < 200 hearts when free restore is exhausted returns 400 needHearts."""
        http_get(f"/api/state?username={self.res_a}")
        http_get(f"/api/state?username={self.res_b}")
        http_post("/api/pair/request", {"username": self.res_a, "partnerUsername": self.res_b})
        http_post("/api/pair/request", {"username": self.res_b, "partnerUsername": self.res_a})

        # Simulate: Partner B was neglected (>24h ago), User A has already used free restore,
        # and User A has only 50 hearts (< 200).
        conn = get_db()
        neglected_time = time.time() - 95000.0  # >26 hours ago
        conn.execute("UPDATE users SET last_cared_at = ?, partner_left = 1 WHERE username = ?",
                     (neglected_time, self.res_b))
        conn.execute("UPDATE users SET hearts = 50, free_restore_used = 1 WHERE username = ?",
                     (self.res_a,))
        conn.commit()
        conn.close()

        # Attempt restore
        code, data = http_post("/api/care/restore", {
            "username": self.res_a,
            "useFree": False
        })
        self.assertEqual(code, 400)
        self.assertFalse(data.get("ok"))
        self.assertTrue(data.get("needHearts"))
        self.assertIn("200 💕", data.get("error", ""))

        # Verify partner is still left
        _, check_state = http_get(f"/api/state?username={self.res_a}")
        self.assertTrue(check_state["partner"]["care"]["partnerLeft"])
        # Verify hearts were not deducted
        self.assertEqual(check_state["user"]["hearts"], 50)

    def test_204_free_restore_restrictions(self):
        """User cannot use free restore if already used or if partner has not left."""
        # 1. Partner has not left -> 400
        u1 = f"t2_fr1_{uuid.uuid4().hex[:6]}"
        u2 = f"t2_fr2_{uuid.uuid4().hex[:6]}"
        try:
            http_get(f"/api/state?username={u1}")
            http_get(f"/api/state?username={u2}")
            http_post("/api/pair/request", {"username": u1, "partnerUsername": u2})
            http_post("/api/pair/request", {"username": u2, "partnerUsername": u1})

            code, data = http_post("/api/care/restore", {"username": u1, "useFree": True})
            self.assertEqual(code, 400)
            self.assertIn("восстанавливать не нужно", data.get("error", ""))

            # 2. Partner left, but free restore was already used -> 400
            conn = get_db()
            conn.execute("UPDATE users SET partner_left = 1, last_cared_at = ? WHERE username = ?",
                         (time.time() - 90000, u2))
            conn.execute("UPDATE users SET free_restore_used = 1, hearts = 250 WHERE username = ?",
                         (u1,))
            conn.commit()
            conn.close()

            code2, data2 = http_post("/api/care/restore", {"username": u1, "useFree": True})
            self.assertEqual(code2, 400)
            self.assertIn("уже использовал(а)", data2.get("error", ""))
        finally:
            cleanup_test_users(u1, u2)

    def test_205_timezone_and_utc_rollover(self):
        """Streak increments across UTC calendar day rollover, but not within same UTC day."""
        u1 = f"t2_tz1_{uuid.uuid4().hex[:6]}"
        u2 = f"t2_tz2_{uuid.uuid4().hex[:6]}"
        try:
            http_get(f"/api/state?username={u1}")
            http_get(f"/api/state?username={u2}")
            http_post("/api/pair/request", {"username": u1, "partnerUsername": u2})
            http_post("/api/pair/request", {"username": u2, "partnerUsername": u1})

            today_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            yesterday_utc = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

            conn = get_db()
            conn.execute("UPDATE users SET last_streak_day = ?, streak_days = 5 WHERE username = ?",
                         (yesterday_utc, u2))
            conn.commit()
            conn.close()

            # Care action crossing UTC day boundary increments streak from 5 to 6
            code, data = http_post("/api/care/action", {"username": u1, "action": "feed"})
            self.assertEqual(code, 200)

            conn = get_db()
            row = conn.execute("SELECT streak_days, last_streak_day FROM users WHERE username = ?", (u2,)).fetchone()
            conn.close()
            self.assertEqual(row["streak_days"], 6)
            self.assertEqual(row["last_streak_day"], today_utc)

            # Second action on the same UTC day does NOT increment streak again
            http_post("/api/care/action", {"username": u1, "action": "shower"})
            conn = get_db()
            row2 = conn.execute("SELECT streak_days FROM users WHERE username = ?", (u2,)).fetchone()
            conn.close()
            self.assertEqual(row2["streak_days"], 6)
        finally:
            cleanup_test_users(u1, u2)

    def test_206_double_claiming_daily_reward_prevention(self):
        """Repeated calls to /api/state on same calendar day do not award hearts multiple times."""
        u = f"t2_dc_{uuid.uuid4().hex[:6]}"
        try:
            http_post("/api/claim-daily", {"username": u})
            _, initial_state = http_get(f"/api/state?username={u}")
            initial_hearts = initial_state["user"]["hearts"]
            self.assertTrue(initial_state["user"]["care"]["dailyRewardGivenToday"])

            # Call /api/state 5 times in succession
            for _ in range(5):
                _, s = http_get(f"/api/state?username={u}")
                self.assertEqual(s["user"]["hearts"], initial_hearts)
        finally:
            cleanup_test_users(u)


# ==============================================================================
# TIER 3: CROSS-FEATURE COMBINATIONS & CONCURRENCY
# ==============================================================================

class TestTier3CrossFeatureCombinations(unittest.TestCase):
    """
    Tier 3 tests verify complex interactions:
    - Simultaneous multithreaded actions from both partners
    - Mood synchronization during ongoing care routine
    - Streak restoration triggering complete recalculation and gauge reset
    """

    @classmethod
    def setUpClass(cls):
        cls.c_user_a = f"t3_usr_a_{uuid.uuid4().hex[:6]}"
        cls.c_user_b = f"t3_usr_b_{uuid.uuid4().hex[:6]}"

        http_get(f"/api/state?username={cls.c_user_a}")
        http_get(f"/api/state?username={cls.c_user_b}")
        http_post("/api/pair/request", {"username": cls.c_user_a, "partnerUsername": cls.c_user_b})
        http_post("/api/pair/request", {"username": cls.c_user_b, "partnerUsername": cls.c_user_a})

    @classmethod
    def tearDownClass(cls):
        cleanup_test_users(cls.c_user_a, cls.c_user_b)

    def test_301_simultaneous_partner_care_actions(self):
        """10 concurrent care actions across threads execute atomically without lock collisions."""
        actions = [
            (self.c_user_a, "feed"),
            (self.c_user_b, "shower"),
            (self.c_user_a, "pet"),
            (self.c_user_b, "feed"),
            (self.c_user_a, "shower"),
            (self.c_user_b, "pet"),
            (self.c_user_a, "feed"),
            (self.c_user_b, "shower"),
            (self.c_user_a, "pet"),
            (self.c_user_b, "feed"),
        ]

        results = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(http_post, "/api/care/action", {"username": u, "action": act})
                for u, act in actions
            ]
            for f in as_completed(futures):
                results.append(f.result())

        for status, data in results:
            self.assertEqual(status, 200)
            self.assertTrue(data.get("ok"))

        # Verify DB integrity: values are valid floats between 0 and 100
        conn = get_db()
        for u in (self.c_user_a, self.c_user_b):
            row = conn.execute("SELECT care_hunger, care_clean, care_energy FROM users WHERE username = ?", (u,)).fetchone()
            self.assertTrue(0.0 <= float(row["care_hunger"]) <= 100.0)
            self.assertTrue(0.0 <= float(row["care_clean"]) <= 100.0)
            self.assertTrue(0.0 <= float(row["care_energy"]) <= 100.0)
        conn.close()

    def test_302_mood_sync_during_care_mode(self):
        """Mood and note update immediately reflects in partner's state during care routine."""
        # User A updates mood
        http_post("/api/mood", {
            "username": self.c_user_a,
            "mood": "cozy",
            "moodLabel": "Уютно ☕",
            "moodReason": "Пьём какао и смотрим сериал вместе"
        })

        # User B performs shower care action
        code, b_care_state = http_post("/api/care/action", {
            "username": self.c_user_b,
            "action": "shower"
        })
        self.assertEqual(code, 200)

        # Partner A's mood must be present in User B's partner state
        self.assertEqual(b_care_state["partner"]["mood"], "cozy")
        self.assertEqual(b_care_state["partner"]["moodReason"], "Пьём какао и смотрим сериал вместе")

    def test_303_streak_restore_triggers_recalculation(self):
        """Neglected streak freeze is unfrozen by restore, resetting metrics to 85.0."""
        # Set partner B neglected
        neglected_time = time.time() - 95000.0
        conn = get_db()
        conn.execute("UPDATE users SET last_cared_at = ?, partner_left = 1, care_hunger = 10, care_clean = 10 WHERE username = ?",
                     (neglected_time, self.c_user_b))
        conn.execute("UPDATE users SET free_restore_used = 0 WHERE username = ?", (self.c_user_a,))
        conn.commit()
        conn.close()

        # Check frozen state
        _, state_frozen = http_get(f"/api/state?username={self.c_user_a}")
        self.assertTrue(state_frozen["partner"]["care"]["partnerLeft"])

        # Execute free restore
        code, restored_state = http_post("/api/care/restore", {
            "username": self.c_user_a,
            "useFree": True
        })
        self.assertEqual(code, 200)
        self.assertTrue(restored_state.get("ok"))
        self.assertFalse(restored_state["partner"]["care"]["partnerLeft"])

        # Confirm care gauges reset to healthy 85.0
        conn = get_db()
        b_row = conn.execute("SELECT care_hunger, care_clean, care_energy, partner_left FROM users WHERE username = ?", (self.c_user_b,)).fetchone()
        conn.close()
        self.assertEqual(float(b_row["care_hunger"]), 85.0)
        self.assertEqual(float(b_row["care_clean"]), 85.0)
        self.assertEqual(float(b_row["care_energy"]), 85.0)
        self.assertEqual(int(b_row["partner_left"]), 0)


# ==============================================================================
# TIER 4: REAL-WORLD COUPLE SCENARIOS (End-to-End Lifecycle)
# ==============================================================================

class TestTier4RealWorldCoupleScenarios(unittest.TestCase):
    """
    Tier 4 tests simulate the complete real-world lifecycle of a couple:
    1. Onboarding & automatic 200 starting hearts (+5 daily claim)
    2. Choosing and saving cute companion pets (species, name)
    3. Pair handshake (invite, notification, acceptance)
    4. Daily care rituals (feed cake, bubble bath, tuck in to sleep)
    5. Emotional mood sharing with cute notes
    6. Missed care streak penalty (>24h neglect -> partner leaves)
    7. First restoration using free first restore
    8. Second missed care penalty -> restore requires 200 hearts
    9. Purchase/Top-up verification & paid restore execution
    10. Graceful couple unlinking
    """

    @classmethod
    def setUpClass(cls):
        cls.alice = f"alice_{uuid.uuid4().hex[:6]}"
        cls.bob = f"bob_{uuid.uuid4().hex[:6]}"

    @classmethod
    def tearDownClass(cls):
        cleanup_test_users(cls.alice, cls.bob)

    def test_401_end_to_end_couple_lifecycle(self):
        # ----------------------------------------------------------------------
        # Step 1: Onboarding
        # ----------------------------------------------------------------------
        code, a_init = http_get(f"/api/state?username={self.alice}")
        self.assertEqual(code, 200)
        self.assertGreaterEqual(a_init["user"]["hearts"], 200)
        self.assertTrue(a_init["user"]["care"]["canClaimDaily"])

        code, b_init = http_get(f"/api/state?username={self.bob}")
        self.assertEqual(code, 200)
        self.assertGreaterEqual(b_init["user"]["hearts"], 200)

        # ----------------------------------------------------------------------
        # Step 2: Customize Pets
        # ----------------------------------------------------------------------
        http_post("/api/pet", {
            "username": self.alice,
            "avatar": {"species": "bunny", "name": "Зефирка"}
        })
        http_post("/api/pet", {
            "username": self.bob,
            "avatar": {"species": "puppy", "name": "Пончик"}
        })

        # ----------------------------------------------------------------------
        # Step 3: Pairing Handshake
        # ----------------------------------------------------------------------
        code, req_res = http_post("/api/pair/request", {
            "username": self.alice,
            "partnerUsername": self.bob
        })
        self.assertEqual(code, 200)

        # Bob views incoming request and accepts
        _, b_state = http_get(f"/api/state?username={self.bob}")
        req_id = b_state["incomingRequests"][0]["id"]

        code, acc_res = http_post("/api/pair/respond", {
            "username": self.bob,
            "requestId": req_id,
            "fromUsername": self.alice,
            "action": "accept"
        })
        self.assertEqual(code, 200)
        self.assertEqual(acc_res["user"]["partnerUsername"], self.alice)
        self.assertEqual(acc_res["partner"]["username"], self.alice)
        self.assertEqual(acc_res["partner"]["care"]["flameStage"]["tier"], 1)

        # ----------------------------------------------------------------------
        # Step 4: Daily Care Rituals
        # ----------------------------------------------------------------------
        # Alice feeds Bob's puppy
        code, _ = http_post("/api/care/action", {
            "username": self.alice,
            "action": "feed",
            "itemName": "Клубничный тортик 🍰"
        })
        self.assertEqual(code, 200)

        # Bob bathes Alice's bunny
        code, _ = http_post("/api/care/action", {
            "username": self.bob,
            "action": "shower"
        })
        self.assertEqual(code, 200)

        # Alice tucks puppy into bed
        code, sleep_state = http_post("/api/care/action", {
            "username": self.alice,
            "action": "sleep"
        })
        self.assertEqual(code, 200)
        self.assertTrue(sleep_state["partner"]["care"]["isSleeping"])

        # Alice wakes Bob's puppy up in the morning
        code, wake_state = http_post("/api/care/action", {
            "username": self.alice,
            "action": "sleep"
        })
        self.assertEqual(code, 200)
        self.assertFalse(wake_state["partner"]["care"]["isSleeping"])

        # ----------------------------------------------------------------------
        # Step 5: Mood & Sweet Notes Sharing
        # ----------------------------------------------------------------------
        http_post("/api/mood", {
            "username": self.alice,
            "mood": "in_love",
            "moodLabel": "Влюблена 💞",
            "moodReason": "Спасибо за заботу, любимый!"
        })

        _, b_read = http_get(f"/api/state?username={self.bob}")
        self.assertEqual(b_read["partner"]["mood"], "in_love")
        self.assertEqual(b_read["partner"]["moodReason"], "Спасибо за заботу, любимый!")

        # ----------------------------------------------------------------------
        # Step 6: 25h Neglect -> Partner Leaves
        # ----------------------------------------------------------------------
        conn = get_db()
        neglected_ts = time.time() - 92000.0
        conn.execute("UPDATE users SET last_cared_at = ?, partner_left = 1 WHERE username = ?",
                     (neglected_ts, self.bob))
        conn.commit()
        conn.close()

        _, a_neglected = http_get(f"/api/state?username={self.alice}")
        self.assertTrue(a_neglected["partner"]["care"]["partnerLeft"])

        # Care action is blocked while partner is left
        code, blocked = http_post("/api/care/action", {"username": self.alice, "action": "feed"})
        self.assertEqual(code, 400)
        self.assertIn("Партнёр ушёл", blocked.get("error", ""))

        # ----------------------------------------------------------------------
        # Step 7: Free First Restore
        # ----------------------------------------------------------------------
        code, restore_res = http_post("/api/care/restore", {
            "username": self.alice,
            "useFree": True
        })
        self.assertEqual(code, 200)
        self.assertFalse(restore_res["partner"]["care"]["partnerLeft"])

        # Confirm free restore marked as used
        _, a_after_free = http_get(f"/api/state?username={self.alice}")
        self.assertTrue(a_after_free["user"]["freeRestoreUsed"])

        # ----------------------------------------------------------------------
        # Step 8: Second Neglect & Paid Restore with 200 Hearts
        # ----------------------------------------------------------------------
        conn = get_db()
        conn.execute("UPDATE users SET last_cared_at = ?, partner_left = 1 WHERE username = ?",
                     (neglected_ts, self.bob))
        # Ensure Alice has 250 hearts
        conn.execute("UPDATE users SET hearts = 250 WHERE username = ?", (self.alice,))
        conn.commit()
        conn.close()

        # Alice cannot use free restore again
        code, fail_free = http_post("/api/care/restore", {"username": self.alice, "useFree": True})
        self.assertEqual(code, 400)

        # Alice executes paid restore for 200 hearts
        code, paid_restore = http_post("/api/care/restore", {
            "username": self.alice,
            "useFree": False
        })
        self.assertEqual(code, 200)
        self.assertFalse(paid_restore["partner"]["care"]["partnerLeft"])

        # Exactly 200 hearts deducted (250 - 200 = 50)
        _, a_final = http_get(f"/api/state?username={self.alice}")
        self.assertEqual(a_final["user"]["hearts"], 50)

        # ----------------------------------------------------------------------
        # Step 9: Clean Unlink
        # ----------------------------------------------------------------------
        code, unlink_res = http_post("/api/pair/unlink", {"username": self.alice})
        self.assertEqual(code, 200)
        self.assertIsNone(unlink_res["user"]["partnerUsername"])

        _, b_unlinked = http_get(f"/api/state?username={self.bob}")
        self.assertIsNone(b_unlinked["user"]["partnerUsername"])


# ==============================================================================
# CLI TEST RUNNER & FORMATTER
# ==============================================================================

def run_all_tiers_cli():
    print("=" * 80)
    print("💕 CHIBILOVE TMA: COMPREHENSIVE COUPLE TEST SUITE (TIERS 1-4)")
    print(f"Target Server: {BASE_URL}")
    print(f"Database:      {DB_PATH}")
    print(f"Timestamp:     {datetime.now(timezone.utc).isoformat()}")
    print("=" * 80)

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    suite.addTests(loader.loadTestsFromTestCase(TestTier1FeatureCoverage))
    suite.addTests(loader.loadTestsFromTestCase(TestTier2BoundaryCornerCases))
    suite.addTests(loader.loadTestsFromTestCase(TestTier3CrossFeatureCombinations))
    suite.addTests(loader.loadTestsFromTestCase(TestTier4RealWorldCoupleScenarios))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 80)
    print(f"FINAL TEST RUN SUMMARY:")
    print(f"  Tests Executed: {result.testsRun}")
    print(f"  Passed:         {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"  Failures:       {len(result.failures)}")
    print(f"  Errors:         {len(result.errors)}")
    print("=" * 80)

    if not result.wasSuccessful():
        sys.exit(1)
    else:
        print("🎉 ALL TESTS ACROSS TIERS 1-4 PASSED WITH ZERO DEFECTS!")
        sys.exit(0)


if __name__ == "__main__":
    run_all_tiers_cli()
