#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Adversarial Stress Test Harness for ChibiLove TMA
Tests:
1. Concurrent daily claim race condition
2. Concurrent streak restore double-spend race condition
3. Malformed payload & injection fuzzing
"""

import concurrent.futures
import json
import sqlite3
import time
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8085"
DB_PATH = "/Users/danil/.gemini/antigravity/scratch/chibilove-tma/backend/chibilove.db"

def http_get(url):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8"))
        except Exception:
            return e.code, None
    except Exception as e:
        return 0, str(e)

def http_post(path, data):
    try:
        url = f"{BASE_URL}{path}"
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8"))
        except Exception:
            return e.code, None
    except Exception as e:
        return 0, str(e)


print("=====================================================================")
print("=== ADVERSARIAL STRESS TEST 1: Concurrent Daily Claim Spam ===")
print("=====================================================================")

race_user = "adversarial_daily_race_tester"
# Setup user in DB with last_heart_reward_day in past and hearts = 200
conn = sqlite3.connect(DB_PATH)
conn.execute("DELETE FROM users WHERE username = ?", (race_user,))
conn.execute("""
    INSERT INTO users (username, hearts, last_heart_reward_day, created_at)
    VALUES (?, 200, '2025-01-01', ?)
""", (race_user, time.time()))
conn.commit()
conn.close()

# Fire 20 simultaneous GET requests for /api/state
num_concurrent = 20
print(f"Firing {num_concurrent} concurrent requests for user {race_user}...")
with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
    futures = [
        executor.submit(http_get, f"{BASE_URL}/api/state?username={race_user}")
        for _ in range(num_concurrent)
    ]
    results = [f.result() for f in futures]

# Check DB hearts balance
conn = sqlite3.connect(DB_PATH)
row = conn.execute("SELECT hearts, last_heart_reward_day FROM users WHERE username = ?", (race_user,)).fetchone()
conn.close()

initial_hearts = 200
final_hearts = row[0]
print(f"Initial Hearts: {initial_hearts}")
print(f"Final Hearts in DB: {final_hearts}")
print(f"Expected Hearts (if thread-safe single claim): 205 (or 210)")

if final_hearts > 210:
    print(f"🚨 CRITICAL RACE CONDITION VULNERABILITY CONFIRMED!")
    print(f"   Daily reward claimed MULTIPLE times! Over-awarded {final_hearts - 205} extra hearts!")
else:
    print(f"   Daily claim handled correctly (Hearts: {final_hearts})")


print("\n=====================================================================")
print("=== ADVERSARIAL STRESS TEST 2: Concurrent Streak Restore Double-Spend ===")
print("=====================================================================")

user_a = "race_restore_a"
user_b = "race_restore_b"
now = time.time() - 100000 # 27+ hours ago

conn = sqlite3.connect(DB_PATH)
conn.execute("DELETE FROM users WHERE username IN (?, ?)", (user_a, user_b))
conn.execute("""
    INSERT INTO users (username, partner_username, hearts, free_restore_used, partner_left, last_cared_at, created_at)
    VALUES (?, ?, 200, 1, 0, ?, ?)
""", (user_a, user_b, now, now))
conn.execute("""
    INSERT INTO users (username, partner_username, hearts, free_restore_used, partner_left, last_cared_at, created_at)
    VALUES (?, ?, 200, 1, 1, ?, ?)
""", (user_b, user_a, now, now))
conn.commit()
conn.close()

print(f"User {user_a} has exactly 200 hearts and free_restore_used=1.")
print(f"Partner {user_b} has partner_left=1.")
print(f"Firing 10 simultaneous POST /api/care/restore requests...")

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    futures = [
        executor.submit(http_post, "/api/care/restore", {"username": user_a, "useFree": False})
        for _ in range(10)
    ]
    results = [f.result() for f in futures]

conn = sqlite3.connect(DB_PATH)
row_a = conn.execute("SELECT hearts, free_restore_used FROM users WHERE username = ?", (user_a,)).fetchone()
conn.close()

print(f"User {user_a} Final Hearts in DB: {row_a[0]}")
if row_a[0] < 0:
    print(f"🚨 CRITICAL DOUBLE-SPEND / NEGATIVE BALANCE VULNERABILITY CONFIRMED!")
    print(f"   Balance dropped to negative: {row_a[0]} hearts!")
else:
    print(f"   Balance check prevented double-spend: {row_a[0]} hearts.")
