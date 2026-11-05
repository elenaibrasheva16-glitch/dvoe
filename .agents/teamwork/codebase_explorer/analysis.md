# ChibiLove TMA: Comprehensive Codebase & Tech Stack Architectural Survey

**Date**: 2026-10-31  
**Investigator**: Codebase & Tech Stack Explorer  
**Project Path**: `/Users/danil/.gemini/antigravity/scratch/chibilove-tma`  
**Status**: Completed Exhaustive Survey (Read-Only)

---

## 1. Executive Summary

ChibiLove TMA (ЧибиПара) is a Telegram Mini App for romantic couples built with a zero-build, ultra-lightweight architecture:
- **Backend**: Native Python 3.9 multi-threaded HTTP server (`http.server.ThreadingHTTPServer` + `SimpleHTTPRequestHandler`) running on port 8085 with SQLite (`chibilove.db`) and a background Telegram Bot polling thread (`getUpdates` via `@ChibiLovePara_bot`).
- **Frontend**: Zero-framework Vanilla ES6+ Single Page Application rendered into `#app` in `public/index.html`, styled with CSS variables and animations (`public/css/styles.css`), driven by a reactive centralized state controller (`public/js/app.js`), pet catalog configuration (`public/js/chibi-config.js`), and a 60 FPS HTML5 Canvas 2D kinematics engine (`public/js/chibi-anime-2d.js`).
- **Networking & Tunneling**: Exposed via Cloudflare TryCloudflare tunnel (`/Users/danil/.local/bin/cloudflared tunnel --url http://127.0.0.1:8085`) orchestrated by `start_all.sh`.
- **Key Discrepancies Found**:
  1. The codebase transitioned from a 3D Three.js / modular human chibi avatar engine with 14 accessories to a 2D Cartoon Pet engine with 11 pets, leaving behind ~4,000 lines of dead code and hundreds of obsolete sprite assets.
  2. Requirement R4 requires **+10 hearts daily** and **200 initial hearts**, but backend and frontend currently award **+5 hearts daily** and DB default was 250.
  3. Requirement R3 specifies an accurate **Anniversary & Relationship Clock** displaying years, months, days, hours, and minutes together; currently only simple days count is displayed.
  4. Requirement R2 mandates **glance/lookAt tracking** towards touch/cursor; currently only drag petting without lookAt pupil orientation is implemented.
  5. A critical **payment contract mismatch** in `/api/stars/invoice` ignores `packageKey` from `app.js` and defaults to 100 Stars instead of 20 Stars.
  6. A **concurrency TOCTOU race condition** in `/api/care/restore` allowed negative hearts balances (`-1750` observed in DB).

---

## 2. Full Directory Tree & File Inventory

```
/Users/danil/.gemini/antigravity/scratch/chibilove-tma/
├── README.md                           # Overview documentation (mentions legacy SVG renderer)
├── start_all.sh                        # Service orchestrator: launches server.py & cloudflared tunnel
├── run_comprehensive_tests.js          # JSC/Node test suite for Chibi2D canvas engine (46 tests)
├── test_e2e_pet_system.py              # Python E2E backend & asset test suite (33 tests)
├── backend/
│   ├── server.py                       # 1,989 lines monolithic HTTP server + Bot + DB
│   ├── chibilove.db                    # SQLite database (15 users, schema & tables)
│   ├── tunnel_url.txt                  # Active Cloudflare public URL
│   ├── server.log                      # Python server output & exception traces
│   ├── tunnel.log                      # Cloudflared log
│   └── cloudflared.log / lrun.log      # Legacy tunnel logs
├── public/
│   ├── index.html                      # Clean 20-line HTML entry point
│   ├── test_preview.html               # Legacy testbench for Live2D skeletal sliced rig (outfits/accessories)
│   ├── css/
│   │   └── styles.css                  # 1,514 lines of CSS (pastel themes, animations, leftover acc classes)
│   ├── js/
│   │   ├── app.js                      # 1,115 lines SPA controller, UI templates, API client
│   │   ├── chibi-config.js             # 231 lines: 11 pets catalog, foods, themes, moods, flame stages
│   │   ├── chibi-anime-2d.js           # 929 lines: 60 FPS HTML5 Canvas cartoon pet animation engine
│   │   ├── telegram-web-app.js         # Telegram Mini App client SDK
│   │   ├── chibi-renderer.js           # [DEAD CODE] 815 lines old SVG modular avatar engine (14 accessories)
│   │   ├── chibi-character-3d.js       # [DEAD CODE] 1,970 lines old Three.js 3D doll engine (14 accessories)
│   │   ├── chibi-scene-3d.js           # [DEAD CODE] 1,080 lines old Three.js scene manager
│   │   ├── three.min.js                # [DEAD CODE] 140+ KB Three.js library
│   │   └── chibi-anime-2d.js.bak       # [DEAD CODE] 1,220 lines old 2D anime canvas avatar engine
│   └── img/
│       ├── bot_avatar.png/.jpg         # Telegram bot profile pictures
│       ├── bot_description_640x360.jpg # Bot introduction banner
│       ├── pets/                       # [ACTIVE] 11 Authentic Kawaii Pet PNG Sprites
│       │   ├── kitty_bear.png (68 KB)
│       │   ├── puppy.png (144 KB)
│       │   ├── fox.png (98 KB)
│       │   ├── panda.png (86 KB)
│       │   ├── penguin.png (98 KB)
│       │   ├── hamster.png (84 KB)
│       │   ├── bunny.png (71 KB)
│       │   ├── chick.png (57 KB)
│       │   ├── koala.png (82 KB)
│       │   ├── whale.png (79 KB)
│       │   └── bird.png (77 KB)
│       ├── chibi/                      # [OBSOLETE] Modular body parts, hair, heads, accessories
│       │   └── sprites/ (acc_*.png, boy_base.png, outfits)
│       └── cozy_sprites/               # [OBSOLETE] 30+ PNG clothes, hats, and Live2D sliced rig
└── tiktok_refs/                        # Market research reference videos (mp4) & extracted frames
```

---

## 3. Technology Stack & Architectural Components

### 3.1 Backend Architecture (`backend/server.py`)
- **HTTP Server**: Built on standard library `http.server.ThreadingHTTPServer` inheriting from `http.server.SimpleHTTPRequestHandler`.
- **Concurrency & Locking**: Uses a global reentrant lock `db_lock = threading.RLock()` for SQLite transactions.
- **Bot Engine**: Spawns a background thread running long-polling `getUpdates` with Telegram Bot API (`BOT_TOKEN: 9265259467:AAHoLLQJKFknBZJkWUsBLXE0RJsuoc0zafw`). Handles `/start`, `/support`, `pre_checkout_query`, `successful_payment`, and pair confirmations.
- **Telegram Proxy**: Automatically probes local SOCKS/HTTP proxies on ports `10809`, `7890`, `1087` to bypass regional censorship.
- **CORS & Caching**: Custom `end_headers` emits `Access-Control-Allow-Origin: *` and enforces `no-cache, no-store` on HTML/JS/CSS/API to guarantee immediate updates.

### 3.2 Database Schema & Models (`backend/chibilove.db`)
SQLite schema consists of 6 core tables:
1. **`users`**:
   - `username TEXT PRIMARY KEY` (normalized alphanumeric username)
   - `tg_id INTEGER` (Telegram user ID)
   - `display_name TEXT` (User or pet name)
   - `bg_color TEXT` (Chosen pastel theme id: `pink`, `green`, `blue`, `yellow`, `lime`, `purple`, `orange`, `rainbow`)
   - `mood TEXT DEFAULT 'happy'` (Current mood: `in_love`, `happy`, `cozy`, `sleepy`, `missing`, `playful`)
   - `mood_reason TEXT DEFAULT ''` (Custom note/reason accompanying the mood)
   - `avatar_configured INTEGER DEFAULT 0` (1 if user explicitly saved their pet)
   - `avatar_json TEXT` (JSON storing `{"species": "...", "name": "...", "gender": "...", "bgColor": "..."}`)
   - `care_hunger REAL DEFAULT 92.0` (Decays ~4.3 pts/hr over 24h)
   - `care_clean REAL DEFAULT 94.0` (Decays ~4.0 pts/hr over 24h)
   - `care_energy REAL DEFAULT 92.0` (Decays ~4.2 pts/hr awake, gains +28 pts/hr sleeping)
   - `is_sleeping INTEGER DEFAULT 0`
   - `last_care_update REAL` (Timestamp of last decay computation)
   - `last_cared_at REAL` (Timestamp of last interactive care action; reset to `now`)
   - `partner_accessories_json TEXT DEFAULT '[]'` *(Legacy field)*
   - `unlocked_accessories_json TEXT` *(Legacy field)*
   - `hearts INTEGER DEFAULT 250` *(Initial balance was 250 in schema; updated to 200 via migration)*
   - `partner_username TEXT DEFAULT NULL` (Linked partner username)
   - `couple_pose TEXT DEFAULT 'hug'`
   - `streak_days INTEGER DEFAULT 1`
   - `last_streak_day TEXT DEFAULT ''` (YYYY-MM-DD to increment streak once per day)
   - `partner_left INTEGER DEFAULT 0` (1 if >24 hours without care)
   - `paired_at REAL` (Timestamp when pair was formed)
   - `last_heart_reward_day TEXT DEFAULT ''` (YYYY-MM-DD for daily hearts reward)
   - `free_restore_used INTEGER DEFAULT 0` (1 if user already used their one-time free restore)
   - `created_at REAL`
2. **`pair_requests`**: `id`, `from_username`, `from_name`, `to_username`, `status` ('pending'|'accepted'|'declined'), `created_at`.
3. **`care_logs`**: `id`, `couple_key`, `actor_username`, `text`, `created_at`.
4. **`processed_payments`**: `charge_id PRIMARY KEY`, `username`, `stars`, `hearts`, `created_at`.
5. **`support_sessions`**: `tg_id PRIMARY KEY`, `mode`, `target_tg_id`, `updated_at`.
6. **`support_tickets`**: `id`, `tg_id`, `username`, `display_name`, `message_text`, `created_at`.

### 3.3 API Route Catalog
| Method | Path | Description | Key Parameters |
|---|---|---|---|
| `GET` | `/api/health` | Healthcheck & tunnel URL | None |
| `GET` | `/api/state` | Returns full user & partner state, care gauges, requests, logs | `username`, `tg_id`, `name` |
| `POST` | `/api/avatar` (or `/api/pet`) | Saves chosen pet species and custom name | `avatar: {species, name}` |
| `POST` | `/api/settings` | Updates room pastel background theme | `bgColor` |
| `POST` | `/api/pair/request` | Sends or auto-accepts pair invite | `partnerUsername` |
| `POST` | `/api/pair/respond` | Accepts or declines incoming pair request | `requestId`, `fromUsername`, `action` |
| `POST` | `/api/pair/unlink` | Breaks pair connection, clears link and timestamps | None |
| `POST` | `/api/care/action` | Executes care action (`feed`, `shower`, `sleep`, `pet`) | `action`, `itemName` |
| `POST` | `/api/care/restore` | Restores partner after 24h absence (free or 200 💕) | `useFree` |
| `POST` | `/api/mood` | Sets user mood and sweet note for partner | `mood`, `moodLabel`, `moodReason` |
| `POST` | `/api/pose` | Sets couple pose in together mode | `pose` |
| `POST` | `/api/stars/invoice` | Generates Telegram Stars invoice link via Bot API | `stars` (or `packageKey`) |
| `POST` | `/api/care/pet` | Affectionate finger petting log (throttled to 180s) | None |
| `POST` | `/api/support` | Forwards user feedback/support ticket to admin | `message` |
| `POST` | `/api/accessories/toggle` | *Legacy stub returning state* | None |
| `POST` | `/api/save_ref` | Saves reference image base64 data to `public/img/` | `index`, `data` |

### 3.4 Frontend Architecture (`public/`)
- **Reactive Model**: A single state object `STATE` in `public/js/app.js` holds UI state (`activeTab`, `serverData`, `draftAvatar`, `showFoodTray`, `showHeartsModal`, `showSupportModal`). Every action modifies `STATE` and triggers `renderApp()`.
- **4 Main Tabs**:
  1. `care` (**«Питомец»**): Main pet room with 60 FPS animated avatar, 4-stage care gauges (Hunger, Cleanliness, Energy, Love), quick action buttons (Feed with food tray popover, Shower, Sleep, Pet), and 24h streak countdown timer.
  2. `together` (**«Пара»**): Couple bonding room with side-by-side animated pets connected by glowing love bridge, flame milestone evolution tier card, mutual mood status & sweet note input, and care activity history.
  3. `pet` (**«Выбор»**): Interactive pet selector showcasing all 11 pets with live preview, custom naming input, and pastel room theme color picker.
  4. `settings` (**«Связь»**): Partner connection management, Telegram username pairing, direct invite link generator, hearts economy breakdown, and developer support ticket form.
- **Pet Graphics Engine (`chibi-anime-2d.js`)**:
  - Implements `CartoonPetCharacter` class with real kinematic transformations:
    - Ground contact physics with dynamic radial ground shadow.
    - Organic squash & stretch breathing preserving volume (`squashX * squashY ≈ 1.0`).
    - Periodic natural eye blinking with sinusoidal interpolation.
    - Touch/mouse drag petting feedback: elastic squash, rosy blushing cheeks (`ctx.filter = 'blur(4px)'`), happy squint arcs.
    - Particle fountain engine (hearts 💕, sparkles ✨, soap bubbles 🫧, crumbs ⭐, sleeping Zzz 💤).
    - Feeding cycle: treats fly in arcs, chewing vertical bounce, crumb particles.
    - Soapy shower cycle: body shake rotation, floating iridescent bubbles.
    - Sleeping cycle: quilted pastel blanket smoothly sliding up with heart embroidery and floating Zzz.
    - Solo and Together dual-character synchronized rendering with love sparkline.

---

## 4. Audit of Obsolete References (Accessories, Clothing, Shops)

### 4.1 Dead Legacy Source Files (Safe to Archive/Deprecate)
1. `public/js/chibi-renderer.js` (815 lines): Old SVG engine with modular anatomy (skin, eyes, brows, mouths, hairstyles, tops, bottoms, shoes) and 14 accessories.
2. `public/js/chibi-character-3d.js` (1,970 lines): Old Three.js 3D character generator.
3. `public/js/chibi-scene-3d.js` (1,080 lines): Old Three.js scene setup and lighting.
4. `public/js/three.min.js` (140 KB): Unreferenced 3D library.
5. `public/js/chibi-anime-2d.js.bak` (1,220 lines): Backup of old modular anime renderer.
6. `public/test_preview.html` (311 lines): Skeletal rig stand testing dresses and ear accessories.

### 4.2 Obsolete Asset Directories
1. `public/img/cozy_sprites/`: Contains clothing (`dress_mint.png`, `dress_pink.png`, `shirt_striped.png`, `scarf_red.png`, `panama_mint.png`, `crown.png`, `glasses.png`, etc.) and Live2D body sliced parts in `rig/`.
2. `public/img/chibi/sprites/`: Contains modular accessory PNGs (`acc_cat_ears.png`, `acc_glasses_cool.png`, etc.) and hair/body layers.

### 4.3 Code References in Active Files
1. `backend/server.py`:
   - Lines 78-83: `DEFAULT_FREE_ACCESSORIES = ["cat_ears", "glasses_cool", "cozy_scarf", "head_bow"]`
   - Lines 87-102: `ACCESSORY_PRICES = { ... }`
   - Lines 323-324: DB columns `partner_accessories_json` and `unlocked_accessories_json` in `CREATE TABLE users`
   - Lines 604-605: `json.dumps(DEFAULT_FREE_ACCESSORIES)` inserted on user creation
   - Lines 749-750: `partnerAccessories` and `unlockedAccessories` serialized in `apply_decay_and_serialize`
   - Line 1307: `/api/accessories/toggle` dummy route
   - Line 1393: `add_log(..., "🤚 @{username} нежно погладил(а) 3D-аватара @{partner_uname} 💕")` (stale 3D reference)
2. `public/js/chibi-config.js`:
   - Line 190: `accessories: []` (empty array for backward compatibility)
3. `public/js/app.js`:
   - Line 159: `window.onPartner3DPetted` hook
   - Lines 570, 729, 804: `class="chibi-3d-mount"`
4. `public/css/styles.css`:
   - Lines 443-530: `.acc-shelf-scroll`, `.acc-tile`, `.acc-tile.equipped`, `.acc-tile.locked`, `.acc-tile-badge`, `.gender-switch`, `.gender-btn`.

---

## 5. Verification Harness, Test Suite, and Dependency Audit

### 5.1 Test Harnesses
1. **Python E2E Test Suite (`test_e2e_pet_system.py`)**:
   - Executes against running server on `http://127.0.0.1:8085`.
   - Result: **33 / 33 passed** (0 errors).
   - Validates: HTML title, static JS/CSS assets, all 11 pet PNG headers (`\x89PNG`), `/api/state`, `/api/avatar`, all 4 care actions (`feed`, `shower`, `sleep`, `pet`), dual-user pair request and accept, daily reward configuration.
2. **JavaScript Comprehensive Test Suite (`run_comprehensive_tests.js`)**:
   - Executes on macOS JavaScriptCore (`/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc run_comprehensive_tests.js`).
   - Result: **46 / 46 passed** (0 errors).
   - Validates: `CHIBI_CONFIG`, 11 pets catalog, foods, care actions, pet normalization, randomization, `Chibi2D.mount`, solo and together mounts, care animations, petting physics, thought bubble, SVG fallback generation.

### 5.2 Dependencies & Build System
- **No Node.js or npm**: The system does not have `node` installed. The project relies on native zero-build browser scripts.
- **Python Standard Library**: No external virtualenv required; runs on macOS system Python 3.9 using standard libraries + preinstalled `requests`.
- **Linting & Compilation**:
  - `python3 -m py_compile backend/server.py test_e2e_pet_system.py` completes cleanly with exit code 0.
  - JavaScript files execute cleanly under Apple JavaScriptCore without syntax errors.

---

## 6. Critical Defects & Requirement Gaps Discovered

### Defect 1: Telegram Stars Package Invoice Mismatch
- **Observation**: In `public/js/app.js` line 369, `buyStarsPackage('stars_20')` sends `{ packageKey: 'stars_20' }`. In `backend/server.py` line 1352:
  ```python
  stars_count = int(body.get("stars", 100))
  ```
  `server.py` does not check `packageKey`. It falls back to default `100` Stars.
- **Impact**: Any user attempting to purchase the 20 Stars package (200 Hearts) or 50 Stars package gets billed for the 100 Stars package!
- **Fix Required**: Update `server.py` to inspect `body.get("packageKey")` or `body.get("stars")` and resolve the matching `STARS_PACKAGES` entry.

### Defect 2: Daily Heart Reward is +5 Instead of +10 (Requirement R4 Violation)
- **Observation**:
  - `backend/server.py` line 116: `DAILY_HEARTS_REWARD = 5`.
  - `public/js/app.js` lines 917, 951, 666, 714: hardcoded text states `+5 💕 каждый день`.
  - `test_e2e_pet_system.py` line 139: asserts `dailyRewardAmount == 5`.
- **Impact**: Requirement R4 explicitly mandates: *"Daily reward: +10 hearts awarded every day."*
- **Fix Required**: Change `DAILY_HEARTS_REWARD = 10` in `server.py`, update UI strings in `app.js`, and update test assertion in `test_e2e_pet_system.py`.

### Defect 3: Initial Hearts Balance Default in Schema vs Specification
- **Observation**:
  - `backend/server.py` line 114: `INITIAL_FREE_HEARTS = 200`.
  - Line 325: `CREATE TABLE IF NOT EXISTS users (... hearts INTEGER DEFAULT 250 ...)`.
  - Line 361: `UPDATE users SET hearts = 200 WHERE hearts < 200`.
- **Impact**: New users created via raw DB inserts could receive 250 hearts rather than the strict 200 hearts mandated by R4.
- **Fix Required**: Standardize table schema default to `200`.

### Defect 4: Concurrency TOCTOU Race Condition in `/api/care/restore`
- **Observation**: In `backend/server.py` lines 1231-1289, user data is read in a separate connection/lock release. The balance check `if raw_u["hearts"] < RESTORE_PARTNER_COST_HEARTS:` evaluates a stale snapshot outside the debit transaction, and the SQL update `UPDATE users SET hearts = hearts - ? WHERE username = ?` does not check `AND hearts >= ?`.
- **Impact**: Under concurrent restore calls, a user's hearts balance was driven down to `-1750` (verified in `chibilove.db` for user `race_restore_a`).
- **Fix Required**: Perform balance check inside the active transaction lock and use atomic conditional update: `UPDATE users SET hearts = hearts - 200 WHERE username = ? AND hearts >= 200`.

### Defect 5: Unhandled Exceptions in Server Processing (`server.log` evidence)
- **Observation**:
  1. `TypeError: 'NoneType' object is not subscriptable` in `do_POST` when `raw_u` or `raw_p` is None during restore.
  2. `ValueError: invalid literal for int()` in `/api/stars/invoice` when `stars` is non-numeric.
  3. Path traversal vulnerability in `/api/save_ref` (`FileNotFoundError` on `ref_anime_/../../traversal_poc.jpg`).
- **Fix Required**: Wrap route handlers with defensive validation and sanitation.

### Defect 6: Missing Anniversary Clock Components (Requirement R3 Gap)
- **Observation**: Requirement R3 requires:
  *"Relationship & Anniversary Clock: Accurate counter showing years, months, days, hours, and minutes together, streak counter, and relationship milestones."*
  Current implementation only calculates `days_together = max(1, int(max(0.0, effective_time - paired_at) // 86400) + 1)` and shows a simple day badge (`formatDaysWord(days)`).
- **Fix Required**: Implement a dedicated Anniversary & Relationship Clock component showing years, months, days, hours, and minutes with real-time per-second or per-minute updates.

### Defect 7: Missing Glance / LookAt Cursor Tracking (Requirement R2 Gap)
- **Observation**: Requirement R2 requires:
  *"Natural Cartoon Kinematics: Smooth 60 FPS breathing (organic squash & stretch preserving volume), natural eye blinking, expressive glance/lookAt tracking towards touch or cursor."*
  `chibi-anime-2d.js` only triggers actions on `pointerdown` / `pointermove` when dragging (`if (!this.isPointerDown) return;`). There is no lookAt tracking where pet pupils shift to gaze toward cursor position.
- **Fix Required**: Add cursor/pointer coordinate tracking in `chibi-anime-2d.js` and draw pupil glance displacement when cursor moves over the stage.

---

## 7. Recommendations & Strategic Implementation Plan

1. **Phase 1: Cleanup & Legacy Pruning**
   - Retain only active runtime files in `index.html`.
   - Remove obsolete accessory references from `backend/server.py` (`DEFAULT_FREE_ACCESSORIES`, `ACCESSORY_PRICES`).
   - Remove obsolete `.acc-*` and `.gender-*` CSS rules from `styles.css`.
2. **Phase 2: Economy & Contract Alignment (R4)**
   - Set `DAILY_HEARTS_REWARD = 10` in `server.py`.
   - Fix `/api/stars/invoice` to handle both `packageKey` and numeric `stars`.
   - Add atomic `AND hearts >= 200` to `/api/care/restore` to fix race conditions.
   - Update `app.js` UI labels to reflect +10 hearts daily.
3. **Phase 3: Anniversary & Milestone Clock (R3)**
   - Add full calendar breakdown (years, months, days, hours, minutes) from `paired_at` timestamp.
   - Display a prominent couple milestone clock in the «Пара» tab.
4. **Phase 4: Avatar Kinematics Polish (R2)**
   - Add lookAt pupil gaze tracking toward pointer coordinates.
   - Ensure squash & stretch maintains strict volume preservation.
5. **Phase 5: Automated Verification Certification**
   - Update `test_e2e_pet_system.py` to test the updated 10 hearts reward and new contracts.
   - Run adversarial regression suite ensuring 0 HTTP errors and 0 uncaught JS exceptions.
