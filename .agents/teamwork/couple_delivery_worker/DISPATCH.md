## 2026-11-01T15:29:10Z
From: c79850ad-78d9-4456-8955-eabf03699eda
Mission:
Consolidate, finalize, and verify all backend and frontend couple features and streamlined economy (Requirements R3 and R4) according to the council audit findings:

1. Backend Remediations (backend/server.py):
   - Economy R4: Set DAILY_HEARTS_REWARD = 10 (was 5). Ensure initial balance is 200 hearts and restore cost is exactly 200 hearts.
   - Symmetrical Care: In care actions (feed, bath, sleep), update `last_cared_at = now` for BOTH partners (`WHERE username IN (?, ?)`).
   - Symmetrical Restore: In /api/care/restore, reset `partner_left = 0` for BOTH partners (`WHERE username IN (?, ?)`).
   - Free Restore Check: If a user has already used their free restore (`free_restores_used >= 1`) and sends `useFree: True` without paying, reject with HTTP 400 error `{"error": "Free restore already used"}` instead of silently billing.
   - Atomic Concurrency: Use atomic SQL `UPDATE users SET hearts = hearts - 200 WHERE username = ? AND hearts >= 200` and verify `cursor.rowcount > 0` to prevent TOCTOU double-spend into negative balance. Also ensure daily reward claim is atomic.
   - Remove residual accessory pricing and ensure all accessory purchases are completely eliminated.
   - Robust input error handling for malformed payloads across endpoints.

2. Frontend Remediations (public/js/app.js & CSS):
   - Partner Mood Display: Render partner's mood badge (`partner.mood`) and note (`partner.moodReason`) in `.avatar-mood-bubble` above character.
   - Real-time Sync: Add lightweight polling (every 5-8s) + `visibilitychange` to sync partner care actions and mood in real time.
   - Precision Anniversary Clock: Implement accurate live counter displaying Years, Months, Days, Hours, Minutes, and Seconds together, with milestone badges (100 days, 1 year, etc.) and support for anniversary date.
   - Implement `APP.restorePartner()` method on `window.APP` so the UI restore button functions cleanly without throwing `APP.restorePartner is not a function`.
   - Ensure daily reward UI displays and awards +10 hearts daily.

3. Testing & Verification:
   - Update `test_e2e_pet_system.py` line 139 to assert `dailyRewardAmount == 10`.
   - Run tests: `python3 test_couple_e2e_integration.py`, `python3 test_e2e_pet_system.py`, `bash run_all_tests.sh`.
   - Restart the server if running, verify HTTP endpoints return 200, and ensure all tests pass with exit code 0.
   - Document all changes and test outputs in `handoff.md` in your working directory.
