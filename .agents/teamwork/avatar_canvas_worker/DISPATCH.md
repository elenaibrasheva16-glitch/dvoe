## 2026-10-31T21:14:51Z
You are the Avatar Canvas Engine Architect in the 15-agent competitive council for ChibiLove TMA.
Working directory: /Users/danil/.gemini/antigravity/scratch/chibilove-tma/.agents/teamwork/avatar_canvas_worker
Project root: /Users/danil/.gemini/antigravity/scratch/chibilove-tma
Authoritative original request: /Users/danil/.gemini/antigravity/scratch/chibilove-tma/.agents/teamwork/ORIGINAL_REQUEST.md (read this first!).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mission:
Build a state-of-the-art HTML5 Canvas-based 60 FPS Living Character/Avatar engine for ChibiLove.
Requirements:
1. Captivating, adorable chibi pet character (inspired by SumOne & Widgetable).
2. Pure 60 FPS organic procedural kinematics:
   - Volume-preserving squash & stretch breathing (sine/cosine easing, no seams or clipping).
   - Natural saccadic eye blinking with micro-twitches and expressive eye gaze tracking towards cursor/touch.
   - Responsive touch/petting physics: elastic squash deformation on drag/tap, heart particle explosion emitter, haptic feedback integration (Telegram.WebApp.HapticFeedback.impactOccurred('medium')).
   - Expressive emotional state animations:
     * Feeding: joyful chewing, floating crumbs/stars, happy closed-eye bounce.
     * Bathing: floating bubbly suds, gentle water splash, scrub response.
     * Sleeping: cozy blanket, floating 'Zzz' particles, slow deep peaceful breathing.
     * Idle/lookAt: follows finger or pointer with realistic neck/eye head tilt.
3. Completely eliminate any seams, multi-layer slicing tears, or awkward static placeholders.
4. Implement as a drop-in modular component or engine in frontend, fully verified.
5. Run build and tests. Report your architecture, benchmarks, and write handoff.md in your working directory.


## 2026-10-31T21:19:55Z
**Context**: Living Avatar Kinematics Specification Ready
**Content**: `avatar_spec_miner` has completed the authoritative kinematics specification. Please read `/Users/danil/.gemini/antigravity/scratch/chibilove-tma/.agents/teamwork/avatar_spec_miner/kinematics_spec.md` for exact formulas (volume-preserving harmonic breathing, 2nd-order spring recoil for petting, 3-phase saccadic blinking, Eulerian particle emitters, and Telegram haptic feedback timings).
**Action**: Integrate these exact kinematic parameters and state transitions into your Canvas living pet engine.


## 2026-10-31T21:22:18Z
**Context**: Adversarial Visual Audit Feedback from avatar_critic
**Content**: The adversarial critic reviewed your Canvas engine and declared Canvas 2D the winning architecture (0.004 ms/frame vs SVG GC drops), but issued REQUEST_CHANGES on 4 visual flaws:
1. "Four-Eyes" Glitch: Drawing closed eye arcs directly over pre-baked raster eyes leaves open eyes visible underneath. Implement eye fur-color masking before drawing closed lids, or dynamic eyelid clipping.
2. Cheek Misalignment: Replace hardcoded cheek coordinates with per-species landmarks (`SPECIES_FACE_CONFIG`) so cheeks do not float outside contours on bunny, fox, and penguin.
3. Missing Gaze Tracking: Implement procedural lookAt pupil/iris gaze tracking towards pointer/touch coordinates.
4. GPU Inefficiency: Replace `ctx.filter = "blur(...)"` with `createRadialGradient` to prevent GPU render-pass stalls in mobile Safari.
See full report at: `/Users/danil/.gemini/antigravity/scratch/chibilove-tma/.agents/teamwork/avatar_critic/critique_report.md`
**Action**: Implement these fixes in the Canvas engine to achieve zero-glitch certification.
