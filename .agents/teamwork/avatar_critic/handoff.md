# Handoff Report: Avatar Animation & Visual Architecture Critique

**Agent Folder:** `/Users/danil/.gemini/antigravity/scratch/chibilove-tma/.agents/teamwork/avatar_critic`  
**Recipient:** Project Orchestrator (`c79850ad-78d9-4456-8955-eabf03699eda`)  
**Type:** Hard Handoff (Task Complete)  
**Date:** 2026-10-31  

---

## 1. Observation

1. **Frame Budget & Execution Speed:**
   Running 1,000 frames of `public/js/chibi-anime-2d.js` on Apple WebKit JavaScriptCore (`/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc .agents/teamwork/avatar_critic/benchmark_avatar_engines.js`):
   - Total CPU time: `4.0 ms` across 1,000 frames.
   - Average JS frame execution: `0.004 ms/frame` (consuming `0.024%` of the 16.66ms 60 FPS frame budget and `0.048%` of the 8.33ms 120 FPS ProMotion budget).
   - High-frequency touch petting (200 rapid taps/drags): `0.000 ms/event`, active particle buffer strictly capped at 50 particles.
   - Rapid state cancellation (500 rapid interruptions): `0` exceptions or unhandled promise rejections.
   - Lifecycle cleanup (100 mount/unmount cycles): `100%` instances properly destroyed, event listeners detached, RAF cancelled.

2. **The "Four-Eyes & Eyebrows" Blinking Artifact:**
   In `public/js/chibi-anime-2d.js` lines 663-714:
   ```javascript
   if (img && img.complete && img.naturalWidth > 0) {
     ctx.drawImage(img, -baseSize * 0.5, -baseSize + 6, baseSize, baseSize);
   }
   ...
   if (pet.isHappySquint || pet.isBlinking || isSleeping) {
     ctx.lineWidth = 3.5;
     const eyeY = -baseSize * 0.46;
     const eyeSpread = baseSize * 0.17;
     ctx.arc(-eyeSpread, eyeY, eyeW, Math.PI * 1.15, Math.PI * 1.85);
     ctx.arc(eyeSpread, eyeY, eyeW, Math.PI * 1.15, Math.PI * 1.85);
   }
   ```
   All 11 sprite assets in `public/img/pets/*.png` already have open eyes and features pre-painted. Overlaying `ctx.arc` without masking or hiding the underlying painted eyes produces two black dots AND two curved stroke arcs, creating a double-eye or raised-eyebrow visual glitch. On non-mammalian shapes like `whale.png` (eye at $Y \approx -0.32$) and `bird.png` (eyes at side), the arcs appear on the forehead/blowhole (see generated composite artifact `pets_blinking_all.png`).

3. **Cheek Blushing Misalignment:**
   In `public/js/chibi-anime-2d.js` line 684:
   `ctx.ellipse(-baseSize * 0.22, -baseSize * 0.40, 14, 8, 0, 0, Math.PI * 2);`
   On `bunny.png`, cheeks float in empty space outside the narrow face contour; on `fox.png`, cheeks overlap its paws holding the apple; on `penguin.png`, cheeks overlap its sideways sleeping cap.

4. **Missing Gaze / LookAt Tracking:**
   Grep search for `pointerX` in `public/js/chibi-anime-2d.js` reveals `pointerX` is solely used to determine if the left or right pet was clicked in couple mode (lines 433-435). No angular head tilt ($\theta_{tilt}$) or pupil offset ($\vec{O}_{pupil}$) is applied to track cursor/finger movement, in direct non-conformance with R2 and `SPEC-KIN-001` Section 1.2.

5. **`ctx.filter` GPU Overhead in Mobile WebKit:**
   Lines 653 and 681 invoke `ctx.filter = "blur(3px)"` and `ctx.filter = "blur(4px)"` on every frame. In mobile Safari (iOS WKWebView), dynamic filter changes invalidate GPU raster tile caches and require temporary offscreen framebuffer allocations.

6. **SVG InnerHTML Allocations:**
   In `public/js/chibi-anime-2d.js.bak`, lines 1114-1118:
   `this.svgContainer.innerHTML = '<svg ...>' + svgContent + '</svg>'`
   Generating 500 frames of SVG markup generates ~15-25 KB of strings per frame (~1.2 - 1.5 MB/s), causing mandatory Minor GC pauses and layout thrashing.

---

## 2. Logic Chain

1. From Observation 1, the Canvas 2D engine in `chibi-anime-2d.js` demonstrates superior raw compute efficiency (0.004 ms/frame, <1% of the 16.6ms budget) and flawless lifecycle cleanup.
2. From Observation 6, re-rendering SVG via `innerHTML` at 60 FPS creates an unsustainable memory allocation profile (1.5 MB/s) that degrades battery life and triggers main-thread GC freezes in mobile Telegram WebApps.
3. Therefore, HTML5 Canvas 2D is the decisive architectural winner for the living character animation engine.
4. However, from Observation 2 and 3, drawing fixed facial strokes over diverse pre-baked raster sprites produces severe visual defects ("four-eyes" and floating cheeks) that violate the "zero visual seams, awkward overlays, or frozen states" acceptance criteria of R2.
5. From Observation 4, the pet currently lacks lookAt / gaze tracking towards touch, violating R2.
6. From Observation 5, replacing `ctx.filter = "blur(...)"` with `ctx.createRadialGradient(...)` is necessary to eliminate GPU pipeline stalls in iOS Safari.
7. Consequently, the architecture is sound and winning, but code modifications are strictly required to resolve the visual glitches before production sign-off.

---

## 3. Caveats

1. Measurements were performed using Apple WebKit JavaScriptCore (`jsc`) on Apple Silicon macOS, which accurately reflects the WebKit execution core of iOS Telegram WebApp, but physical GPU thermal throttling was modeled rather than measured across a 4-hour live device run.
2. This critic agent adheres strictly to the review-only role and has not modified implementation files (`chibi-anime-2d.js`); fixes are scoped as actionable tasks for `avatar_canvas_worker`.

---

## 4. Conclusion

- **Verdict:** **REQUEST_CHANGES** (Architectural direction APPROVED; visual fixes MANDATED).
- **Architecture Winner:** **Hybrid Architecture** — HTML5 Canvas 2D for character kinematics, squish physics, and particle fountains; HTML/CSS for floating thought bubbles and interface badges.
- **Mandatory Fixes for `avatar_canvas_worker`:**
  1. Add `SPECIES_FACE_CONFIG` landmark dictionary with species-specific eye and cheek coordinates.
  2. In `drawCharacter`, before drawing closed eye arcs, fill the eye landmark with a soft patch of base fur color to mask the sprite's open eyes and eliminate the four-eyes artifact.
  3. Replace `ctx.filter = "blur(...)"` with `ctx.createRadialGradient(...)` for ground shadows and blushing cheeks.
  4. Implement `lookAt` gaze kinematics: adjust pet head tilt ($\pm 0.08\,\text{rad}$) based on touch pointer position.
  5. Cancel active feeding/showering animations when sleep is toggled.

---

## 5. Verification Method

1. **Frame Budget & Stress Test Verification:**
   Run:
   ```bash
   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc .agents/teamwork/avatar_critic/benchmark_avatar_engines.js
   ```
   *Expected:* All 5 benchmark sections pass; JS execution time < 1.0 ms/frame; zero exceptions across 500 interruptions.

2. **Visual Blink & Alignment Inspection:**
   Inspect the visual artifact generated during this review:
   - File: `.agents/teamwork/avatar_critic/pets_blinking_all.png`
   - Invalidation condition: If any pet displays double eyes, eyebrow floating, or cheeks outside body bounds, the build is rejected.

3. **Comprehensive Pet Engine Tests:**
   Run:
   ```bash
   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc run_comprehensive_tests.js
   ```
   *Expected:* 46 / 46 passing tests.
