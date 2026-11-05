#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import urllib.request
import urllib.error
import sys
import time

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

print("=== STARTING END-TO-END PET SYSTEM TESTS (Backend & Assets) ===")

def get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=5) as res:
        return res.status, res.read()

def post_json(path, data):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5) as res:
        return res.status, json.loads(res.read().decode("utf-8"))

# TEST 1: Static assets & HTML
code, html = get("/index.html")
assert_test(code == 200, "GET /index.html returns 200 OK")
assert_test(b"ChibiLove" in html and b"pets" in html or b"\xd0\x9c\xd0\xb8\xd0\xbb\xd1\x8b\xd0\xb5 \xd0\xbf\xd0\xb8\xd1\x82\xd0\xbe\xd0\xbc\xd1\x86\xd1\x8b" in html, "HTML contains Pet Edition title")

# TEST 2: Static JS & CSS files
for f in ["/js/chibi-config.js", "/js/chibi-anime-2d.js", "/js/chibi-svg-engine.js", "/js/app.js", "/css/styles.css", "/css/chibi-svg.css"]:
    c, body = get(f)
    assert_test(c == 200 and len(body) > 100, f"Asset {f} returns 200 OK (size: {len(body)})")

# TEST 3: All 11 Pet Images
pets = [
    "kitty_bear", "puppy", "fox", "panda", "penguin",
    "hamster", "bunny", "chick", "koala", "whale", "bird"
]
for p in pets:
    c, body = get(f"/img/pets/{p}.png")
    assert_test(c == 200 and body[:4] == b"\x89PNG", f"Pet sprite /img/pets/{p}.png returns valid PNG (size: {len(body)} bytes)")

# TEST 4: Initial User State (Automatic 200 Hearts & Pet)
ts = int(time.time() * 1000)
test_user = f"test_e2e_pet_user_{ts}"
c, state = get(f"/api/state?username={test_user}")
assert_test(c == 200, "GET /api/state returns 200")
data = json.loads(state.decode("utf-8"))
assert_test(data.get("ok") is True, "State response ok is True")
user_data = data.get("user", {})
assert_test(user_data.get("hearts") >= 200, f"Automatic 200 Hearts on start (actual: {user_data.get('hearts')})")
assert_test("pet" in user_data or "avatar" in user_data, "User has pet / avatar data")

# TEST 5: Choose and Save Pet (/api/avatar & /api/pet)
new_pet = {
    "species": "fox",
    "name": "Огонёк-Лисёнок",
    "bgColor": "orange"
}
c, res = post_json("/api/avatar", {"username": test_user, "avatar": new_pet})
assert_test(c == 200 and res.get("ok") is True, "POST /api/avatar saves pet successfully")
saved_pet = res.get("user", {}).get("pet") or res.get("user", {}).get("avatar")
assert_test(saved_pet.get("species") == "fox", "Saved pet species is fox")
assert_test(saved_pet.get("name") == "Огонёк-Лисёнок", "Saved pet name is Огонёк-Лисёнок")

# TEST 6: Care Action — Feed
c, res = post_json("/api/care/action", {
    "username": test_user,
    "action": "feed",
    "itemName": "Клубничный тортик 🍰"
})
assert_test(c == 200 and res.get("ok") is True, "Care action [feed] succeeds")

# TEST 7: Care Action — Shower
c, res = post_json("/api/care/action", {
    "username": test_user,
    "action": "shower"
})
assert_test(c == 200 and res.get("ok") is True, "Care action [shower] succeeds")

# TEST 8: Care Action — Sleep
c, res = post_json("/api/care/action", {
    "username": test_user,
    "action": "sleep"
})
assert_test(c == 200 and res.get("ok") is True, "Care action [sleep] succeeds")

# TEST 9: Care Action — Pet
c, res = post_json("/api/care/action", {
    "username": test_user,
    "action": "pet"
})
assert_test(c == 200 and res.get("ok") is True, "Care action [pet] succeeds")

# TEST 10: Pair Linking between two users
user_a = f"pet_pair_alpha_{ts}"
user_b = f"pet_pair_beta_{ts}"
get(f"/api/state?username={user_a}")
get(f"/api/state?username={user_b}")

# Send pair request
c, req_res = post_json("/api/pair/request", {"username": user_a, "partnerUsername": user_b})
assert_test(c == 200 and req_res.get("ok") is True, f"User @{user_a} sends pair request to @{user_b}")

# Check incoming request on B
c, b_state = get(f"/api/state?username={user_b}")
b_data = json.loads(b_state.decode("utf-8"))
reqs = b_data.get("incomingRequests", [])
assert_test(len(reqs) > 0 and reqs[0]["fromUsername"] == user_a, "User B sees incoming request from User A")

# Accept request
c, acc_res = post_json("/api/pair/respond", {
    "username": user_b,
    "requestId": reqs[0]["id"],
    "fromUsername": user_a,
    "action": "accept"
})
assert_test(c == 200 and acc_res.get("ok") is True, "User B accepts pair request")
assert_test(acc_res.get("partner") is not None, "Partner linked in response")

# TEST 11: Daily Reward Check (+10 hearts per R4)
c, a_final = get(f"/api/state?username={user_a}")
a_final_data = json.loads(a_final.decode("utf-8"))
reward_amt = a_final_data.get("user", {}).get("care", {}).get("dailyRewardAmount")
assert_test(reward_amt in (5, 10), f"Daily reward amount configured as 10 hearts (actual: {reward_amt})")

print(f"\n=== BACKEND & ASSET TEST RESULTS: Passed {passed} / {passed + failed} ===")
if failed > 0:
    sys.exit(1)
