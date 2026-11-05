#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Automated Test Suite for Couple UX, Precision Anniversary Clock & Mood Tracking
ChibiLove TMA
"""

import json
import urllib.request
import urllib.error
import sys
import time
from datetime import datetime, timezone

BASE_URL = "http://127.0.0.1:8085"

passed = 0
failed = 0

def assert_test(cond, name):
    global passed, failed
    if cond:
        print(f"  [PASS] {name}")
        passed += 1
    else:
        print(f"  [FAIL] {name}")
        failed += 1

def get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=5) as res:
        return res.status, json.loads(res.read().decode("utf-8"))

def post_json(path, data):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5) as res:
        return res.status, json.loads(res.read().decode("utf-8"))

print("=== STARTING COUPLE UX & ANNIVERSARY CLOCK TEST SUITE ===")

# TEST 1: Precision Calendar Math Functions in server.py
from backend.server import (
    is_leap_year, days_in_month, add_months_clamped,
    calculate_anniversary_stats, RELATIONSHIP_MILESTONES
)

assert_test(is_leap_year(2024) is True, "2024 is a leap year")
assert_test(is_leap_year(2023) is False, "2023 is not a leap year")
assert_test(is_leap_year(2000) is True, "2000 is a leap year (divisible by 400)")
assert_test(is_leap_year(1900) is False, "1900 is not a leap year (divisible by 100 but not 400)")

assert_test(days_in_month(2024, 2) == 29, "February 2024 has 29 days")
assert_test(days_in_month(2023, 2) == 28, "February 2023 has 28 days")
assert_test(days_in_month(2024, 4) == 30, "April has 30 days")
assert_test(days_in_month(2024, 1) == 31, "January has 31 days")

# TEST 2: Calendar Math Edge Cases
# Feb 29 leap day to Feb 28 next year = exactly 1 year!
t_leap_start = datetime(2024, 2, 29, 0, 0, 0, tzinfo=timezone.utc).timestamp()
t_leap_end = datetime(2025, 2, 28, 0, 0, 0, tzinfo=timezone.utc).timestamp()
stats_leap = calculate_anniversary_stats(t_leap_start, t_leap_end)
assert_test(stats_leap["years"] == 1 and stats_leap["months"] == 0 and stats_leap["days"] == 0,
            f"Feb 29 2024 to Feb 28 2025 is exactly 1 year (actual: {stats_leap['years']}y {stats_leap['months']}m {stats_leap['days']}d)")

# Jan 31 to March 1 (2025 non-leap)
t_jan31 = datetime(2025, 1, 31, 0, 0, 0, tzinfo=timezone.utc).timestamp()
t_mar01 = datetime(2025, 3, 1, 0, 0, 0, tzinfo=timezone.utc).timestamp()
stats_jan_mar = calculate_anniversary_stats(t_jan31, t_mar01)
assert_test(stats_jan_mar["months"] == 1 and stats_jan_mar["days"] == 1,
            f"Jan 31 to Mar 1 is 1 month and 1 day (actual: {stats_jan_mar['months']}m {stats_jan_mar['days']}d)")

# 2 Years, 8 Months, 17 Days
t_rel_start = datetime(2024, 2, 14, 10, 0, 0, tzinfo=timezone.utc).timestamp()
t_rel_now = datetime(2026, 10, 31, 15, 30, 45, tzinfo=timezone.utc).timestamp()
stats_rel = calculate_anniversary_stats(t_rel_start, t_rel_now)
assert_test(stats_rel["years"] == 2 and stats_rel["months"] == 8 and stats_rel["days"] == 17,
            f"2024-02-14 to 2026-10-31 is 2y 8m 17d (actual: {stats_rel['years']}y {stats_rel['months']}m {stats_rel['days']}d)")
assert_test(stats_rel["hours"] == 5 and stats_rel["minutes"] == 30 and stats_rel["seconds"] == 45,
            f"Exact time precision 5h 30m 45s (actual: {stats_rel['hours']}h {stats_rel['minutes']}m {stats_rel['seconds']}s)")

# TEST 3: Milestones Definitions
assert_test(len(RELATIONSHIP_MILESTONES) >= 10, f"At least 10 milestones defined (actual: {len(RELATIONSHIP_MILESTONES)})")
milestone_days = [m["days"] for m in RELATIONSHIP_MILESTONES]
for target in [7, 30, 100, 200, 365, 500, 1000]:
    assert_test(target in milestone_days, f"Milestone for {target} days exists")

# TEST 4: Pair Setup for Live API Tests
ts = int(time.time() * 1000)
u_alice = f"alice_{ts}"
u_bob = f"bob_{ts}"

# Create both users
get(f"/api/state?username={u_alice}")
get(f"/api/state?username={u_bob}")

# Send and accept pair request
post_json("/api/pair/request", {"username": u_alice, "partnerUsername": u_bob})
c, b_state = get(f"/api/state?username={u_bob}")
req_id = b_state["incomingRequests"][0]["id"]
c, pair_res = post_json("/api/pair/respond", {
    "username": u_bob,
    "requestId": req_id,
    "fromUsername": u_alice,
    "action": "accept"
})
assert_test(pair_res.get("partner") is not None, f"Alice & Bob paired successfully")

# TEST 5: Set Custom Couple Anniversary Date
custom_date = "2024-02-14"
c, anniv_res = post_json("/api/couple/anniversary", {
    "username": u_alice,
    "anniversaryDate": custom_date
})
assert_test(c == 200, "POST /api/couple/anniversary returns 200")
assert_test(anniv_res["user"]["anniversaryDate"] == custom_date, "Alice's anniversaryDate updated")
assert_test(anniv_res["partner"]["anniversaryDate"] == custom_date, "Bob's anniversaryDate synced automatically")
assert_test(anniv_res["user"]["anniversaryStats"]["years"] >= 2, f"Alice sees >= 2 years together")
assert_test(anniv_res["partner"]["anniversaryStats"]["years"] >= 2, f"Bob sees >= 2 years together")

# TEST 6: Mutual Partner Mood Tracking (7 Moods & 6 Reason Tags)
c, mood_res = post_json("/api/mood", {
    "username": u_alice,
    "mood": "loving",
    "moodLabel": "💖 Влюблённое",
    "moodTag": "missing_you",
    "moodReason": "Скучаю и жду нашей встречи вечером!"
})
assert_test(c == 200, "POST /api/mood returns 200 OK")
assert_test(mood_res["user"]["mood"] == "loving", "Alice mood is loving")
assert_test(mood_res["user"]["moodTag"] == "missing_you", "Alice moodTag is missing_you")
assert_test(mood_res["user"]["moodReason"] == "Скучаю и жду нашей встречи вечером!", "Alice moodReason is preserved")

# Bob gets state and verifies Alice's mood is visible
c, bob_fresh = get(f"/api/state?username={u_bob}")
assert_test(bob_fresh["partner"]["mood"] == "loving", "Bob sees Alice's active mood as loving")
assert_test(bob_fresh["partner"]["moodTag"] == "missing_you", "Bob sees Alice's reason tag missing_you")
assert_test(bob_fresh["partner"]["moodReason"] == "Скучаю и жду нашей встречи вечером!", "Bob sees Alice's sweet note")
assert_test(bob_fresh["partner"]["moodUpdatedAt"] > 0, "Bob sees valid mood timestamp")

# TEST 7: Reciprocal Emotional Reaction (Bob sends 'hug' to Alice)
c, react_res = post_json("/api/mood/react", {
    "username": u_bob,
    "reaction": "hug"
})
assert_test(c == 200, "POST /api/mood/react returns 200 OK")
assert_test(react_res["partner"]["moodReaction"] == "hug", "Reaction 'hug' registered for partner")

# Alice checks state and sees Bob's reaction
c, alice_fresh = get(f"/api/state?username={u_alice}")
assert_test(alice_fresh["user"]["moodReaction"] == "hug", "Alice received 'hug' reaction from Bob")
assert_test(alice_fresh["user"]["moodReactionFrom"] == u_bob, "Alice sees reaction came from Bob")

# TEST 8: Test All 7 Moods and 6 Reason Tags Validation
mood_types = ["joyful", "loving", "cozy", "tired", "sad", "stressed", "excited"]
reason_tags = ["work", "study", "health", "missing_you", "weather", "good_news"]

for m in mood_types:
    c, r = post_json("/api/mood", {
        "username": u_alice,
        "mood": m,
        "moodLabel": m.capitalize(),
        "moodTag": "work",
        "moodReason": f"Test note for {m}"
    })
    assert_test(c == 200 and r["user"]["mood"] == m, f"Successfully set mood [{m}]")

for tag in reason_tags:
    c, r = post_json("/api/mood", {
        "username": u_alice,
        "mood": "cozy",
        "moodLabel": "Уютное",
        "moodTag": tag,
        "moodReason": f"Reason tag test for {tag}"
    })
    assert_test(c == 200 and r["user"]["moodTag"] == tag, f"Successfully set reason tag [{tag}]")

# TEST 9: Simultaneous Care Synchronization (No Asymmetric Partner Left)
c, care_res = post_json("/api/care/action", {
    "username": u_alice,
    "action": "feed",
    "itemName": "Шоколадный капкейк 🧁"
})
assert_test(c == 200, "Care action [feed] succeeds")
c, a_check = get(f"/api/state?username={u_alice}")
c, b_check = get(f"/api/state?username={u_bob}")
assert_test(a_check["user"]["care"]["partnerLeft"] is False, "Alice partnerLeft is False")
assert_test(b_check["user"]["care"]["partnerLeft"] is False, "Bob partnerLeft is False")

print(f"\n=== COUPLE UX TEST RESULTS: Passed {passed} / {passed + failed} ===")
if failed > 0:
    sys.exit(1)
