#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ChibiLove TMA — R4 Clean Couples Economy & Restoration Verification Suite
Tests:
1. Registration & Starting balance: exactly 200 hearts, zero accessories.
2. Reliable +10 hearts daily claim mechanism (/api/claim-daily).
3. Double-claim prevention on the same calendar day.
4. Dedicated /api/couple endpoint (GET and POST).
5. Streak protection check on daily claim when streak is broken.
6. First-time free streak restoration (/api/restore-streak).
7. Insufficient hearts (<200) rejection with needHearts flag and no negative balance.
8. Paid streak restoration costing exactly 200 hearts for both partners.
9. Absence of clothing, accessories, and cosmetic purchases.
"""

import json
import sqlite3
import time
import urllib.error
import urllib.request
import sys
import os

BASE_URL = "http://127.0.0.1:8085"
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "chibilove.db")

passed = 0
failed = 0


def assert_test(condition: bool, name: str):
    global passed, failed
    if condition:
        print(f"  [PASS] {name}")
        passed += 1
    else:
        print(f"  [FAIL] {name}")
        failed += 1


def http_get(path: str):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def http_post(path: str, data: dict):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


print("=== STARTING R4 CLEAN COUPLES ECONOMY & RESTORATION TESTS ===")

ts = int(time.time() * 1000)

# TEST 1: Initial User State (Strictly 200 Hearts & Empty Accessories)
user_1 = f"r4_user_alpha_{ts}"
code, res = http_get(f"/api/state?username={user_1}")
assert_test(code == 200 and res.get("ok") is True, "GET /api/state returns 200 OK")
u_data = res.get("user", {})
assert_test(u_data.get("hearts") == 200, f"Starting balance is strictly 200 Hearts (actual: {u_data.get('hearts')})")
assert_test(u_data.get("partnerAccessories") == [], "partnerAccessories is strictly empty list []")
assert_test(u_data.get("unlockedAccessories") == [], "unlockedAccessories is strictly empty list []")
assert_test(u_data.get("freeRestoreAvailable") is True, "Free first restore is available for new user")
assert_test(u_data.get("care", {}).get("dailyRewardAmount") == 10, "Daily reward amount is configured as exactly 10 Hearts")
assert_test(u_data.get("care", {}).get("dailyRewardGivenToday") is False, "Daily reward not yet claimed on start")
assert_test(u_data.get("care", {}).get("canClaimDaily") is True, "canClaimDaily is True on start")

# TEST 2: Reliable +10 Hearts Daily Claim (/api/claim-daily POST)
code, claim_res = http_post("/api/claim-daily", {"username": user_1})
assert_test(code == 200 and claim_res.get("ok") is True, "POST /api/claim-daily returns 200 OK")
assert_test(claim_res.get("claimed") is True, "claimed is True in response")
assert_test(claim_res.get("reward") == 10, "reward is exactly 10 Hearts")
assert_test(claim_res.get("hearts") == 210, f"Hearts updated to exactly 210 (actual: {claim_res.get('hearts')})")

# TEST 3: Double-Claim Prevention on Same Calendar Day
code, dbl_res = http_post("/api/claim-daily", {"username": user_1})
assert_test(code == 400 and dbl_res.get("ok") is False, "Double-claim returns HTTP 400")
assert_test(dbl_res.get("alreadyClaimed") is True, "alreadyClaimed is True in response")
assert_test(dbl_res.get("hearts") == 210, "Balance remains 210 Hearts after rejected double-claim")

# TEST 4: GET /api/claim-daily for Another User
user_2 = f"r4_user_beta_{ts}"
http_get(f"/api/state?username={user_2}")
code, get_claim = http_get(f"/api/claim-daily?username={user_2}")
assert_test(code == 200 and get_claim.get("ok") is True, "GET /api/claim-daily succeeds with 200 OK")
assert_test(get_claim.get("reward") == 10 and get_claim.get("hearts") == 210, "Awarded +10 Hearts via GET /api/claim-daily")

# TEST 5: Dedicated /api/couple Endpoint (Unpaired State)
code, c_unpaired = http_get(f"/api/couple?username={user_1}")
assert_test(code == 200 and c_unpaired.get("ok") is True, "GET /api/couple returns 200 OK")
assert_test(c_unpaired.get("paired") is False, "paired is False when no partner is linked")
assert_test(c_unpaired.get("restoreCostHearts") == 200, "restoreCostHearts is 200 Hearts")
assert_test(c_unpaired.get("dailyRewardAmount") == 10, "dailyRewardAmount is 10 Hearts")

# TEST 6: Couple Formation & Paired /api/couple Endpoint
# Send pair request from user_1 to user_2
http_post("/api/pair/request", {"username": user_1, "partnerUsername": user_2})
# user_2 accepts
http_post("/api/pair/request", {"username": user_2, "partnerUsername": user_1})

code, c_paired = http_get(f"/api/couple?username={user_1}")
assert_test(code == 200 and c_paired.get("ok") is True, "GET /api/couple for paired users returns 200 OK")
assert_test(c_paired.get("paired") is True, "paired is True")
assert_test(c_paired.get("restoreCostHearts") == 200, "restoreCostHearts is 200 Hearts")
assert_test(c_paired.get("dailyRewardAmount") == 10, "dailyRewardAmount is 10 Hearts")
assert_test("partner" in c_paired and c_paired["partner"] is not None, "partner object is present")

# TEST 7: POST /api/couple with Anniversary Date
code, c_post = http_post("/api/couple", {"username": user_1, "anniversaryDate": "2024-02-14"})
assert_test(code == 200 and c_post.get("ok") is True, "POST /api/couple updates and returns state")

# TEST 8: Streak Protection Check on Daily Claim (Broken Streak)
# Simulate partner_left = 1 in database for couple
conn = sqlite3.connect(DB_PATH)
conn.execute("UPDATE users SET partner_left = 1 WHERE username IN (?, ?)", (user_1, user_2))
conn.commit()
conn.close()

user_3 = f"r4_user_gamma_{ts}"
# Create user_3 and link with user_4
user_4 = f"r4_user_delta_{ts}"
http_get(f"/api/state?username={user_3}")
http_get(f"/api/state?username={user_4}")
http_post("/api/pair/request", {"username": user_3, "partnerUsername": user_4})
http_post("/api/pair/request", {"username": user_4, "partnerUsername": user_3})

# Now simulate broken streak on user_3 & user_4
conn = sqlite3.connect(DB_PATH)
conn.execute("UPDATE users SET partner_left = 1 WHERE username IN (?, ?)", (user_3, user_4))
conn.commit()
conn.close()

code, broken_claim = http_post("/api/claim-daily", {"username": user_3})
assert_test(code == 400 and broken_claim.get("ok") is False, "Daily claim rejected when streak is broken (HTTP 400)")
assert_test(broken_claim.get("streakBroken") is True, "streakBroken is True in response")
assert_test(broken_claim.get("needRestore") is True, "needRestore is True in response")

# TEST 9: Free First-Time Streak Restoration (/api/restore-streak)
code, free_restore = http_post("/api/restore-streak", {"username": user_3, "useFree": True})
assert_test(code == 200 and free_restore.get("ok") is True, "POST /api/restore-streak succeeds for 1st free restore")
assert_test(free_restore.get("restored") is True, "restored is True")
assert_test(free_restore.get("usedFree") is True, "usedFree is True")
assert_test(free_restore.get("costHearts") == 0, "costHearts is 0 for free restore")
assert_test(free_restore.get("hearts") == 200, "Hearts balance remains 200 (no charge for free restore)")

# Verify in DB that partner_left is 0 for BOTH partners
conn = sqlite3.connect(DB_PATH)
r3 = conn.execute("SELECT partner_left, free_restore_used FROM users WHERE username = ?", (user_3,)).fetchone()
r4 = conn.execute("SELECT partner_left FROM users WHERE username = ?", (user_4,)).fetchone()
conn.close()
assert_test(r3[0] == 0 and r4[0] == 0, "partner_left is 0 for BOTH partners after restoration")
assert_test(r3[1] == 1, "free_restore_used is 1 after using free restore")

# TEST 10: Insufficient Hearts (< 200) Rejection for Paid Restore
# Break streak again on user_3 & user_4
conn = sqlite3.connect(DB_PATH)
conn.execute("UPDATE users SET partner_left = 1, hearts = 50 WHERE username = ?", (user_3,))
conn.execute("UPDATE users SET partner_left = 1 WHERE username = ?", (user_4,))
conn.commit()
conn.close()

code, broke_restore = http_post("/api/restore-streak", {"username": user_3, "useFree": False})
assert_test(code == 400 and broke_restore.get("ok") is False, "Restore rejected with insufficient hearts (HTTP 400)")
assert_test(broke_restore.get("needHearts") is True, "needHearts is True in response")
assert_test(broke_restore.get("restoreCostHearts") == 200, "restoreCostHearts is 200 Hearts")

# Verify user's balance did not go negative
conn = sqlite3.connect(DB_PATH)
r3_bal = conn.execute("SELECT hearts FROM users WHERE username = ?", (user_3,)).fetchone()[0]
conn.close()
assert_test(r3_bal == 50, f"Balance safely untouched at 50 Hearts, never negative (actual: {r3_bal})")

# TEST 11: Successful Paid Restoration Costing Exactly 200 Hearts
# Grant 350 hearts to user_3
conn = sqlite3.connect(DB_PATH)
conn.execute("UPDATE users SET hearts = 350 WHERE username = ?", (user_3,))
conn.commit()
conn.close()

code, paid_restore = http_post("/api/restore-streak", {"username": user_3, "useFree": False})
assert_test(code == 200 and paid_restore.get("ok") is True, "Paid restore succeeds with 200 Hearts (HTTP 200)")
assert_test(paid_restore.get("restored") is True, "restored is True")
assert_test(paid_restore.get("usedFree") is False, "usedFree is False")
assert_test(paid_restore.get("costHearts") == 200, "costHearts is exactly 200 Hearts")
assert_test(paid_restore.get("hearts") == 150, f"Remaining hearts is exactly 150 (350 - 200) (actual: {paid_restore.get('hearts')})")

# Verify in DB: both partners restored, balance is 150
conn = sqlite3.connect(DB_PATH)
r3_after = conn.execute("SELECT partner_left, hearts FROM users WHERE username = ?", (user_3,)).fetchone()
r4_after = conn.execute("SELECT partner_left FROM users WHERE username = ?", (user_4,)).fetchone()
conn.close()
assert_test(r3_after[0] == 0 and r4_after[0] == 0, "Both partners active in DB after paid restore")
assert_test(r3_after[1] == 150, f"DB balance is 150 Hearts (actual: {r3_after[1]})")

# TEST 12: Zero Clothing, Accessory, or Cosmetic Purchases
code, acc_res = http_post("/api/accessories/toggle", {"username": user_1})
assert_test(code == 200 and acc_res.get("ok") is True, "POST /api/accessories/toggle returns clean status")
assert_test(acc_res.get("accessories") == [], "accessories is strictly empty list []")

print(f"\n=== R4 ECONOMY TEST RESULTS: Passed {passed} / {passed + failed} ===")
if failed > 0:
    print(f"FAILED: {failed} tests failed!")
    sys.exit(1)
else:
    print("ALL R4 ECONOMY & RESTORATION TESTS PASSED PERFECTLY!")
    sys.exit(0)
