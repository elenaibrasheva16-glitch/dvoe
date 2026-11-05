# Handoff Report: Adversarial System & Security Stress Testing for ChibiLove TMA

## 1. Observation

Direct empirical observations from source inspection, fuzzing, concurrency harnesses, and browser console auditing:

### Obs-1: Concurrency Double-Spend on Streak Restore & Negative Balance
- File: `/Users/danil/.gemini/antigravity/scratch/chibilove-tma/backend/server.py`, lines 1231–1299
- Code snippet:
  ```python
  with db_lock:
      conn = get_db()
      raw_u = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
      raw_p = conn.execute("SELECT * FROM users WHERE username = ?", (partner_uname,)).fetchone()
      conn.close()
  # [Lock is released here!]
  ...
  with db_lock:
      conn = get_db()
      if is_free: ...
      else:
          if raw_u["hearts"] < RESTORE_PARTNER_COST_HEARTS:
              ...
              return
          conn.execute("UPDATE users SET hearts = hearts - ? WHERE username = ?", (RESTORE_PARTNER_COST_HEARTS, username))
  ```
- Command executed: `python3 test_race_conditions.py`
- Output:
  ```text
  User race_restore_a has exactly 200 hearts and free_restore_used=1.
  Partner race_restore_b has partner_left=1.
  Firing 10 simultaneous POST /api/care/restore requests...
  User race_restore_a Final Hearts in DB: -1750
  🚨 CRITICAL DOUBLE-SPEND / NEGATIVE BALANCE VULNERABILITY CONFIRMED!
     Balance dropped to negative: -1750 hearts!
  ```

### Obs-2: Concurrency Race Condition on Daily Reward Claim Spam
- File: `/Users/danil/.gemini/antigravity/scratch/chibilove-tma/backend/server.py`, lines 708–720
- Code snippet:
  ```python
  daily_reward_given = bool(d.get("last_heart_reward_day") == today_str)
  if not daily_reward_given:
      with db_lock:
          conn = get_db()
          conn.execute("UPDATE users SET hearts = hearts + ?, last_heart_reward_day = ? WHERE username = ?",
                       (DAILY_HEARTS_REWARD, today_str, d["username"]))
          conn.commit()
          conn.close()
      d["hearts"] = int(d.get("hearts") or 0) + DAILY_HEARTS_REWARD
      daily_reward_given = True
  ```
- Command executed: `python3 test_race_conditions.py`
- Output:
  ```text
  Firing 20 concurrent requests for user adversarial_daily_race_tester...
  Initial Hearts: 200
  Final Hearts in DB: 250
  Expected Hearts (if thread-safe single claim): 205 (or 210)
  🚨 CRITICAL RACE CONDITION VULNERABILITY CONFIRMED!
     Daily reward claimed MULTIPLE times! Over-awarded 45 extra hearts!
  ```

### Obs-3: Unhandled 500 Exceptions & Socket Drops in Backend Endpoints
- File: `/Users/danil/.gemini/antigravity/scratch/chibilove-tma/backend/server.py`
- Fuzzing suite command: `python3 test_api_fuzzing.py`
- Fuzz results: 7 out of 31 cases crashed worker threads without returning an HTTP response (Remote end closed connection without response, curl code 52):
  1. `POST /api/care/restore` with `{"username": ""}`:
     Line 1245: `u_last = raw_u["last_cared_at"] or now`
     Error in `server.log`: `TypeError: 'NoneType' object is not subscriptable`
  2. `POST /api/save_ref` with malformed base64 (`{"index": 1, "data": "invalid_base64_###"}`):
     Line 964: `raw = base64.b64decode(data_b64)`
     Error in `server.log`: `binascii.Error: Invalid base64-encoded string: number of data characters (13) cannot be 1 more than a multiple of 4`
  3. `POST /api/save_ref` path traversal (`{"index": "/../../traversal_poc", "data": "dGVzdA=="}`):
     Line 965: `save_path = os.path.join(PUBLIC_DIR, "img", f"ref_anime_{idx}.jpg")`
     Error in `server.log`: `FileNotFoundError: [Errno 2] No such file or directory: '.../public/img/ref_anime_/../../traversal_poc.jpg'`
  4. `POST /api/stars/invoice` with non-integer stars (`{"stars": "not_int"}`):
     Line 1352: `stars_count = int(body.get("stars", 100))`
     Error in `server.log`: `ValueError: invalid literal for int() with base 10: 'not_int'`
  5. `POST /api/stars/invoice` with null stars (`{"stars": None}`):
     Line 1352: `stars_count = int(body.get("stars", 100))`
     Error in `server.log`: `TypeError: int() argument must be a string, a bytes-like object or a number, not 'NoneType'`
  6. `GET /api/state` with huge integer overflow in `tg_id`:
     Line 631: `conn.execute(f"UPDATE users SET ...", tuple(params))`
     Error in `server.log`: `sqlite3.OverflowError: Python int too large to convert to SQLite INTEGER`

### Obs-4: Fatal Client Runtime Error: `APP.restorePartner is not a function`
- File: `/Users/danil/.gemini/antigravity/scratch/chibilove-tma/public/js/app.js`
- Lines 529 and 533 generate HTML with onclick handler:
  `<button ... onclick="APP.restorePartner(true)">` and `<button ... onclick="APP.restorePartner(false)">`
- Lines 163–416 define `window.APP`:
  Line 229 declares `async restorePair(useFree = false)`.
  There is NO `restorePartner` defined on `window.APP`.
- Command executed: `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc test_client_console_auditor.js`
- Output:
  ```text
  ❌ [FAIL] Check APP.restorePartner function (called by button in HTML) -> Error: CRITICAL BUG: window.APP.restorePartner is NOT defined! UI button onclick fails!
  ```

### Obs-5: Client-to-Backend Parameter Mismatch on Telegram Stars Invoices
- File: `/Users/danil/.gemini/antigravity/scratch/chibilove-tma/public/js/app.js`, line 369:
  `const res = await apiPost("/api/stars/invoice", { packageKey: pkgKey });`
- File: `/Users/danil/.gemini/antigravity/scratch/chibilove-tma/backend/server.py`, line 1352:
  `stars_count = int(body.get("stars", 100))`
- Impact: Client sends `{ packageKey: "stars_20" }`. The backend ignores `packageKey`, falls back to `body.get("stars", 100) = 100`, and always bills 100 Stars even when the user selected the 20 Stars package.

### Obs-6: Requirement Discrepancy (R4 Economics)
- Requirement: `ORIGINAL_REQUEST.md` line 31: `Daily reward: +10 hearts awarded every day`, line 46: `Exactly 200 initial hearts for registration/existing users; +10 hearts daily claim works reliably.`
- Current Code: `backend/server.py` line 116 has `DAILY_HEARTS_REWARD = 5`.
- In `public/js/app.js` line 917: UI reads `+5 💕 каждый день`.

---

## 2. Logic Chain

1. **Race Condition Mechanics (Obs-1)**:
   - In `server.py`, the user's hearts balance is queried in `raw_u` outside the critical update section.
   - When 10 concurrent HTTP threads invoke `/api/care/restore`, all 10 threads read `raw_u["hearts"] == 200` before any thread commits an update.
   - Each thread passes the condition `raw_u["hearts"] >= 200` because they all evaluate their local, stale snapshot.
   - Each thread executes `UPDATE users SET hearts = hearts - 200 WHERE username = ?`.
   - SQLite subtracts 200 repeatedly: 200 -> 0 -> -200 -> ... -> -1750.
   - Conclusion: The hearts balance is susceptible to double-spend and unbounded negative balances.

2. **Daily Reward Inflation (Obs-2)**:
   - `apply_decay_and_serialize` is invoked on every user query and evaluates `d.get("last_heart_reward_day") == today_str`.
   - The dictionary `d` is populated from an initial `SELECT` before the update block.
   - Under concurrent requests, multiple threads receive stale `row` snapshots where `last_heart_reward_day` is not yet updated to today's date.
   - Each thread executes `UPDATE users SET hearts = hearts + ? ...` sequentially under `db_lock`.
   - In our empirical test with 20 concurrent threads, 9 extra reward increments were applied (+45 hearts over-awarded).
   - Conclusion: Users can intentionally or accidentally inflate hearts via concurrent refreshes.

3. **Malformed Input Vulnerabilities (Obs-3)**:
   - Python's standard `http.server.ThreadingHTTPServer` terminates the request handler thread whenever an unhandled exception is raised inside `do_GET` or `do_POST`.
   - The absence of top-level try/except blocks and missing type conversions (e.g. `int()`, `base64.b64decode()`, None-checks on database queries) converts minor client typos or malicious probes into instant Denial of Service for that HTTP session.
   - Conclusion: Endpoints lack defensiveness and must validate types and catch exceptions with proper HTTP 400 responses.

4. **UI Button Disconnect (Obs-4)**:
   - The HTML template in `renderCareTab` references `APP.restorePartner`.
   - `window.APP` only implements `restorePair`.
   - When a user's companion leaves due to 24h inactivity and the user clicks either the free or paid restore button, the browser throws an unhandled `TypeError` in the onclick handler.
   - Conclusion: The UI cannot restore broken relationships without fixing the method name binding.

---

## 3. Caveats

- Tests were run against the local development server at `http://127.0.0.1:8085`.
- Network-level rate limiting or reverse proxy WAFs (such as Cloudflare Web Application Firewall) might attenuate some high-frequency concurrent burst attacks in production, but do not resolve the underlying application concurrency flaws.
- The Telegram Stars payment webhook handler was tested up to invoice generation; testing live Telegram Stars settlement requires a live Telegram account with funded Stars.

---

## 4. Conclusion

The system under test exhibits critical vulnerabilities and architectural bugs across three major categories:
1. **Financial & Concurrency Integrity**: Broken streaks can be restored while driving hearts balances to negative values (-1750 💕), and daily claims can be multiplied by concurrent requests.
2. **Availability & Stability**: 7 unhandled crash vectors drop HTTP connections when receiving malformed, empty, or unexpected payloads.
3. **Frontend Usability & Economics**: The streak restore button in `app.js` is completely broken due to a method naming mismatch (`restorePartner` vs `restorePair`), Telegram Stars invoices default to 100 Stars regardless of user choice, and daily rewards award 5 hearts instead of 10.

### Recommended Actions for Worker Agents:
- **`couple_economy_worker`**:
  1. In `POST /api/care/restore` (or `/api/restore-streak`), execute atomic balance deduction:
     `UPDATE users SET hearts = hearts - ? WHERE username = ? AND hearts >= ?`
     and verify `cursor.rowcount > 0` within the same transaction.
  2. In daily claim, enforce atomic claiming:
     `UPDATE users SET hearts = hearts + 10, last_heart_reward_day = ? WHERE username = ? AND (last_heart_reward_day != ? OR last_heart_reward_day IS NULL)`
     and check `cursor.rowcount > 0`.
  3. Align `DAILY_HEARTS_REWARD = 10` per R4.
  4. Fix invoice generation: accept `packageKey` or extract `stars` integer safely with try/except.
- **`couple_ux_worker`**:
  1. In `public/js/app.js`, alias `APP.restorePartner = APP.restorePair` or update HTML onclick to `APP.restorePair(true)`.
  2. Sanitize `fromUsername` in `renderIncomingRequests`.
- **`couple_care_sync_worker` / Backend Workers**:
  1. Add top-level try/except in `do_POST` and `do_GET` to return clean JSON error payloads instead of unhandled thread terminations.
  2. Validate types and sanitize path inputs in `/api/save_ref` (`os.path.basename` or integer validation).

---

## 5. Verification Method

To independently verify all findings, run the empirical test harnesses created during this investigation:

```bash
cd /Users/danil/.gemini/antigravity/scratch/chibilove-tma

# 1. Verify Concurrency & Race Conditions (Double-Spend and Daily Spam)
python3 test_race_conditions.py

# 2. Verify API Fuzzing & Unhandled 500 Crash Exceptions
python3 test_api_fuzzing.py

# 3. Verify Client Console Runtime & UI Event Handlers
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc test_client_console_auditor.js
```

**Invalidation conditions**:
- `test_race_conditions.py`: Balance remains non-negative (>= 0) and final hearts after 20 concurrent daily claims equals exactly initial + reward amount.
- `test_api_fuzzing.py`: All 31 test cases return structured HTTP 200 or 400 responses with zero dropped connections.
- `test_client_console_auditor.js`: 0 failed tests, `APP.restorePartner` successfully executes without throwing `TypeError`.
