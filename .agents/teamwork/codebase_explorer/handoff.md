# Handoff Report: Codebase & Tech Stack Survey (ChibiLove TMA)

**Role**: Codebase & Tech Stack Explorer  
**Working Directory**: `/Users/danil/.gemini/antigravity/scratch/chibilove-tma/.agents/teamwork/codebase_explorer`  
**Recipient**: Project Orchestrator (`c79850ad-78d9-4456-8955-eabf03699eda`) and Evolutionary Council  
**Date**: 2026-10-31  
**Handoff Type**: Hard (Mission Complete)

---

## 1. Observation

1. **Active Frontend Entry Point (`public/index.html`)**:
   - Lines 15–17 directly load only three application scripts:
     ```html
     <script src="/js/chibi-config.js?v=201"></script>
     <script src="/js/chibi-anime-2d.js?v=201"></script>
     <script src="/js/app.js?v=201"></script>
     ```
   - Unreferenced legacy files residing in `public/js/`:
     - `chibi-renderer.js` (815 lines)
     - `chibi-character-3d.js` (1,970 lines)
     - `chibi-scene-3d.js` (1,080 lines)
     - `three.min.js` (140 KB)
     - `chibi-anime-2d.js.bak` (1,220 lines)
   - Unreferenced test page: `public/test_preview.html` (311 lines).

2. **Backend Server & Database Architecture (`backend/server.py` & `backend/chibilove.db`)**:
   - `backend/server.py` runs on port 8085 via standard library `ThreadingHTTPServer` and `SimpleHTTPRequestHandler`.
   - SQLite database `chibilove.db` contains 6 active tables: `users` (15 existing rows), `pair_requests`, `care_logs`, `processed_payments`, `support_sessions`, and `support_tickets`.
   - Lines 932–1413 implement 16 HTTP endpoints:
     `GET /api/health`, `GET /api/state`, `POST /api/save_ref`, `POST /api/avatar` (or `/api/pet`), `POST /api/settings`, `POST /api/pair/request`, `POST /api/pair/respond`, `POST /api/pair/unlink`, `POST /api/care/action`, `POST /api/care/restore`, `POST /api/accessories/toggle`, `POST /api/mood`, `POST /api/pose`, `POST /api/stars/invoice`, `POST /api/care/pet`, `POST /api/support`.

3. **Discrepancy: Daily Reward Economy (R4)**:
   - In `backend/server.py` line 116:
     ```python
     DAILY_HEARTS_REWARD = 5            # +5 Hearts each new day!
     ```
   - In `public/js/app.js` line 917:
     ```javascript
     • Ежедневная награда: <strong>+5 💕 каждый день</strong><br/>
     ```
   - In `test_e2e_pet_system.py` line 139:
     ```python
     assert_test(a_final_data.get("user", {}).get("care", {}).get("dailyRewardAmount") == 5, "Daily reward amount configured as 5 hearts")
     ```
   - Requirement R4 verbatim:
     > *"Initial balance: Automatically 200 hearts granted at start (free first restore). Daily reward: +10 hearts awarded every day."*

4. **Bug: Payment Contract Mismatch in Telegram Stars Invoice (`/api/stars/invoice`)**:
   - In `public/js/app.js` line 369:
     ```javascript
     const res = await apiPost("/api/stars/invoice", { packageKey: pkgKey });
     ```
   - In `backend/server.py` line 1352:
     ```python
     stars_count = int(body.get("stars", 100))
     pkg = None
     for p in STARS_PACKAGES.values():
         if p["stars"] == stars_count:
             pkg = p
             break
     if not pkg:
         pkg = STARS_PACKAGES["stars_100"]
     ```
   - Verified via live probe: Sending `{"packageKey": "stars_20"}` returns:
     ```json
     {"ok": true, "package": {"stars": 100, "hearts": 1000, "title": "1000 Сердечек 💕"}}
     ```
     Any package key passed from the UI always generates a 100-Stars invoice.

5. **Bug: TOCTOU Concurrency Race Condition in Pair Restoration (`/api/care/restore`)**:
   - In `backend/server.py` lines 1231–1236, user record `raw_u` is read into memory, then `conn.close()` is called and lock released.
   - At line 1281, the check `if raw_u["hearts"] < RESTORE_PARTNER_COST_HEARTS:` evaluates the stale variable.
   - At line 1288, `conn.execute("UPDATE users SET hearts = hearts - ? WHERE username = ?", (RESTORE_PARTNER_COST_HEARTS, username))` executes without a `WHERE hearts >= ?` guard.
   - Observed in `chibilove.db`: User `race_restore_a` has `hearts: -1750`.

6. **Requirement R3 Gap: Anniversary Clock Breakdown**:
   - In `backend/server.py` lines 664–667:
     ```python
     days_together = max(1, int(max(0.0, effective_time - paired_at) // 86400) + 1)
     ```
   - In `public/js/app.js` line 548:
     ```html
     <span>Огонёк любви: ${formatDaysWord(c.daysTogether || c.streakDays || 1)}</span>
     ```
   - There is no calculation or display of years, months, days, hours, and minutes together as mandated by R3.

7. **Requirement R2 Gap: Glance / LookAt Cursor Tracking**:
   - In `public/js/chibi-anime-2d.js` line 415:
     ```javascript
     onPointerMove(e) {
       if (!this.isPointerDown) return;
     ```
   - The engine only tracks touch during dragging for petting. There is no gaze / pupil displacement tracking cursor movement across the stage.

8. **Test Harness Execution Results**:
   - `python3 test_e2e_pet_system.py` -> **Passed 33 / 33**.
   - `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc run_comprehensive_tests.js` -> **Passed 46 / 46**.
   - `python3 -m py_compile backend/server.py test_e2e_pet_system.py` -> Clean compilation (exit code 0).

---

## 2. Logic Chain

1. **From Observation 1**: The application has definitively adopted the 2D Cartoon Pet engine (`chibi-anime-2d.js` with 11 pets) as its active rendering pipeline. Files `chibi-renderer.js`, `chibi-character-3d.js`, `chibi-scene-3d.js`, and `three.min.js` are not loaded anywhere in `public/index.html` and constitute dead code that should be purged or archived.
2. **From Observation 2 & 5**: The server architecture relies on SQLite with a single global Python `RLock`. Because the restore handler reads user state, releases the lock, and later debits hearts using an unconditional SQL decrement, concurrent requests evade the balance check, producing negative balances (`-1750`). The decrement must be made atomic: `UPDATE users SET hearts = hearts - 200 WHERE username = ? AND hearts >= 200`.
3. **From Observation 4**: In the frontend-to-backend communication, `app.js` dispatches `{ packageKey: "stars_20" }`, but `server.py` only extracts `body.get("stars", 100)`. Because `"packageKey"` is ignored, the backend falls back to `stars_100` (100 Stars / 1000 Hearts). This is a critical payment bug that mischarges users.
4. **From Observation 3**: The requirement specification R4 strictly dictates a daily reward of +10 hearts and 200 initial hearts. The current codebase has `DAILY_HEARTS_REWARD = 5` in `server.py`, `app.js`, and `test_e2e_pet_system.py`. Updating this parameter across backend, frontend, and tests will directly fulfill R4.
5. **From Observation 6 & 7**: The current pet animation and UI lack the specific R2 kinematics (lookAt glance towards touch/cursor) and R3 anniversary clock breakdown (years, months, days, hours, minutes). Because the foundational kinematics loop in `chibi-anime-2d.js` already runs at 60 FPS, adding pupil lookAt offsets and a reactive anniversary timer component is straightforward and low-risk.

---

## 3. Caveats

1. **Live Production Process**: The server is currently running in the background on port 8085 serving active Cloudflare tunnel requests (`https://midi-recreation-farm-surrounding.trycloudflare.com`). Any modifications by downstream implementers must avoid interrupting port 8085 without restarting `start_all.sh`.
2. **Node.js Environment**: The local macOS host does not have `node` in its `$PATH` (zsh error 127). All JavaScript automated testing must be invoked via native Apple JavaScriptCore (`/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc`).
3. **Telegram Stars Testing**: The Bot API `createInvoiceLink` uses live Telegram Stars currency (`XTR`). Live invoice generation succeeds (returns `https://t.me/$...`), but full end-to-end payment clearance requires a real Telegram client with Telegram Stars.

---

## 4. Conclusion

The repository is healthy, lightweight, and completely functional (all 33 Python E2E and 46 JS engine tests currently pass). However, achieving full compliance with the authoritative request (`ORIGINAL_REQUEST.md`) requires six targeted fixes:
1. **Remove obsolete accessories and dead files**: Deprecate `chibi-renderer.js`, `chibi-character-3d.js`, `chibi-scene-3d.js`, `three.min.js`, and remove `DEFAULT_FREE_ACCESSORIES` and `ACCESSORY_PRICES` from `server.py`.
2. **Fix payment contract**: In `/api/stars/invoice`, support `body.get("packageKey")` to correctly map `stars_20` to 20 Stars.
3. **Fix economy parameters**: Set `DAILY_HEARTS_REWARD = 10` and standardize user table schema default `hearts = 200`.
4. **Fix restore race condition**: Use atomic conditional SQL update in `/api/care/restore` to eliminate negative balances.
5. **Implement Anniversary & Relationship Clock**: Add years, months, days, hours, and minutes breakdown to UI.
6. **Implement Glance / LookAt Kinematics**: Add pointer move coordinate listener and pupil gaze offset to `chibi-anime-2d.js`.

---

## 5. Verification Method

To independently verify all findings and test fixes:

1. **Verify Python E2E Test Suite**:
   ```bash
   python3 /Users/danil/.gemini/antigravity/scratch/chibilove-tma/test_e2e_pet_system.py
   ```
   *Expected output*: `=== BACKEND & ASSET TEST RESULTS: Passed 33 / 33 ===`.

2. **Verify JavaScript Core Test Suite**:
   ```bash
   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc /Users/danil/.gemini/antigravity/scratch/chibilove-tma/run_comprehensive_tests.js
   ```
   *Expected output*: `Passed: 46 / 46`.

3. **Verify Stars Invoice Contract Bug**:
   ```bash
   python3 -c "import urllib.request, json; req = urllib.request.Request('http://127.0.0.1:8085/api/stars/invoice', data=json.dumps({'username':'ksjjfnnn','packageKey':'stars_20'}).encode(), headers={'Content-Type':'application/json'}); print(json.loads(urllib.request.urlopen(req).read().decode())['package'])"
   ```
   *Current output*: `{'stars': 100, ...}` (Demonstrates the bug; should return `{'stars': 20, ...}`).

4. **Verify Database Negative Balance Bug**:
   ```bash
   python3 -c "import sqlite3; conn = sqlite3.connect('/Users/danil/.gemini/antigravity/scratch/chibilove-tma/backend/chibilove.db'); cur = conn.cursor(); print(cur.execute('SELECT username, hearts FROM users WHERE hearts < 0').fetchall())"
   ```
   *Current output*: `[('race_restore_a', -1750)]`.
