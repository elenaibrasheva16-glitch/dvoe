#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Adversarial API Fuzzing Suite for ChibiLove TMA
Probes all endpoints for:
- Input sanitization & injection resilience
- Malformed payloads & type handling
- Unhandled 500 exceptions / server crashes
- Stored XSS vectors in logs & mood
- Unauthorized state modification
"""

import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8085"

def send_req(method, path, body=None, headers=None):
    if headers is None:
        headers = {}
    url = f"{BASE_URL}{path}"
    data = None
    if body is not None:
        if isinstance(body, (dict, list)):
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        elif isinstance(body, str):
            data = body.encode("utf-8")
            if "Content-Type" not in headers:
                headers["Content-Type"] = "application/json"
        elif isinstance(body, bytes):
            data = body

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            resp_body = res.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(resp_body)
            except Exception:
                parsed = resp_body
            return res.status, parsed
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(resp_body)
        except Exception:
            parsed = resp_body
        return e.code, parsed
    except Exception as e:
        return 0, str(e)

fuzz_cases = [
    # 1. GET /api/state
    ("GET", "/api/state?username=' OR '1'='1", None, "SQLi in username param"),
    ("GET", "/api/state?username=<script>alert(1)</script>", None, "XSS in username param"),
    ("GET", "/api/state?username=&tg_id=notanumber", None, "Empty username and invalid tg_id"),
    ("GET", "/api/state?username=valid_user&tg_id=999999999999999999999999999999999999999999", None, "Huge tg_id overflow"),
    ("GET", "/api/state?username=../../../../etc/passwd", None, "Directory traversal username"),
    
    # 2. POST /api/care/action
    ("POST", "/api/care/action", {"username": "", "action": "feed"}, "Empty username in care action"),
    ("POST", "/api/care/action", {"username": "test_fuzz_user", "action": "invalid_action_xyz"}, "Invalid action string"),
    ("POST", "/api/care/action", {"username": "test_fuzz_user", "action": None}, "Null action type"),
    ("POST", "/api/care/action", {"username": "test_fuzz_user", "action": "feed", "itemName": "<script>alert('xss')</script>"}, "XSS payload in itemName"),
    ("POST", "/api/care/action", {"username": "test_fuzz_user", "action": "feed", "itemName": "A" * 50000}, "50KB string in itemName"),
    
    # 3. POST /api/care/restore
    ("POST", "/api/care/restore", {"username": ""}, "Empty username in care restore (known crash)"),
    ("POST", "/api/care/restore", {"username": "test_fuzz_user", "useFree": "invalid_bool_string"}, "Invalid useFree type"),
    ("POST", "/api/care/restore", {"username": "nonexistent_random_user_99999"}, "Non-existent user in restore"),
    
    # 4. POST /api/mood
    ("POST", "/api/mood", {"username": "", "mood": "happy"}, "Empty username in mood"),
    ("POST", "/api/mood", {"username": "test_fuzz_user", "mood": "<script>alert(1)</script>", "moodReason": "<img src=x onerror=alert(1)>"}, "Stored XSS in moodReason"),
    ("POST", "/api/mood", {"username": "test_fuzz_user", "mood": None, "moodReason": None}, "Null mood and moodReason"),
    
    # 5. POST /api/stars/invoice
    ("POST", "/api/stars/invoice", {"stars": "not_int"}, "Non-int stars parameter (known crash)"),
    ("POST", "/api/stars/invoice", {"stars": -500}, "Negative stars count"),
    ("POST", "/api/stars/invoice", {"stars": None}, "Null stars parameter"),
    
    # 6. POST /api/save_ref
    ("POST", "/api/save_ref", {"index": "/../../traversal_poc", "data": "dGVzdA=="}, "Path traversal in save_ref"),
    ("POST", "/api/save_ref", {"index": 1, "data": "invalid_base64_###"}, "Invalid base64 in save_ref (known crash)"),
    ("POST", "/api/save_ref", "NOT_JSON_BODY_AT_ALL", "Non-JSON body in save_ref"),
    
    # 7. POST /api/pair/request
    ("POST", "/api/pair/request", {"username": "test_fuzz_user", "partnerUsername": ""}, "Empty partnerUsername in pair request"),
    ("POST", "/api/pair/request", {"username": "test_fuzz_user", "partnerUsername": "test_fuzz_user"}, "Self-pairing attempt"),
    ("POST", "/api/pair/request", {"username": "test_fuzz_user", "partnerUsername": "' OR 1=1 --"}, "SQLi in partnerUsername"),
    
    # 8. POST /api/pair/respond
    ("POST", "/api/pair/respond", {"requestId": "invalid_id", "action": "accept"}, "Non-integer requestId"),
    ("POST", "/api/pair/respond", {"requestId": -1, "action": "invalid_action"}, "Negative requestId"),
    
    # 9. POST /api/settings
    ("POST", "/api/settings", {"username": "test_fuzz_user", "bgColor": "invalid_theme_color"}, "Invalid theme bgColor"),
    ("POST", "/api/settings", {"username": "test_fuzz_user", "bgColor": "<script>alert('xss')</script>"}, "XSS in theme bgColor"),
    
    # 10. POST /api/support
    ("POST", "/api/support", {"username": "test_fuzz_user", "message": ""}, "Empty message in support"),
    ("POST", "/api/support", {"username": "test_fuzz_user", "message": "B" * 60000}, "60KB message in support"),
]

print("=== STARTING API FUZZING SUITE ===")
crashes = []
vulnerabilities = []

for method, path, body, desc in fuzz_cases:
    status, resp = send_req(method, path, body)
    if status == 0:
        print(f"❌ [CRASH/DROP] {desc} -> Connection dropped / Server exception ({resp})")
        crashes.append((desc, method, path, resp))
    elif status >= 500:
        print(f"⚠️ [5xx SERVER ERROR] {desc} -> HTTP {status}: {resp}")
        crashes.append((desc, method, path, resp))
    else:
        print(f"✅ [HANDLED {status}] {desc}")

print(f"\nTotal Fuzz Cases: {len(fuzz_cases)}")
print(f"Total Crashes / Drops (Uncaught Exceptions): {len(crashes)}")
for c in crashes:
    print(f" - {c[0]} ({c[1]} {c[2]}): {c[3]}")
