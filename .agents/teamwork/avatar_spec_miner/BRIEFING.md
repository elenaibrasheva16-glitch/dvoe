# BRIEFING — 2026-10-31T21:19:30Z

## Mission
Mine deep animation mechanics and interaction design from market leaders (SumOne, Widgetable, Paired, Tamagotchi classics): exact timing curves, care state transitions, particle emitter physics, and Telegram WebApp haptic timings for ChibiLove TMA living avatar.

## 🔒 My Identity
- Archetype: teamwork_preview_spec_miner
- Roles: avatar_spec_miner, specification_miner
- Working directory: /Users/danil/.gemini/antigravity/scratch/chibilove-tma/.agents/teamwork/avatar_spec_miner
- Original parent: c79850ad-78d9-4456-8955-eabf03699eda
- Milestone: Kinematics & Timing Specification Delivery

## 🔒 Key Constraints
- Read-only specification miner: do NOT implement code or modify project source code.
- Probe authoritative sources, market leader benchmarks, existing codebase references, and Telegram WebApp specifications.
- Output exact mathematical formulations, timing curves (cubic-bezier, spring constants), state transition matrices, particle kinematics, and haptic vibration patterns.
- Deliver comprehensive specification document `kinematics_spec.md` and self-contained `handoff.md`.

## Current Parent
- Conversation ID: c79850ad-78d9-4456-8955-eabf03699eda
- Updated: 2026-10-31T21:19:30Z

## Task Summary
- **What to build**: Comprehensive Avatar Kinematics Specification (`kinematics_spec.md`) and handoff report (`handoff.md`).
- **Success criteria**:
  1. Exact timing curves (easing functions, cubic-bezier, spring constants, frequency, amplitude) for breathing cycles (2.8-3.4s), saccadic blinks (3-6s interval, 120ms duration), lookAt eye saccades, and petting squash/stretch recoil. [DONE]
  2. Complete state transition diagrams and matrices for care states: Hunger -> Eating -> Satisfied, Dirty -> Bathing -> Sparkle Clean, Tired -> Sleeping -> Recharged, plus Idle, Petting, and Negative states (Neglected, Hungry, Dirty, Exhausted). [DONE]
  3. Particle emitter physics equations and parameters (velocity, angle spread, gravity, wind, opacity decay, scale curve, heart icons/bubbles/sparkles/zzz). [DONE]
  4. Haptic feedback timings and mapping for Telegram WebApp (`Telegram.WebApp.HapticFeedback`). [DONE]
  5. Discovery tables (`## Features Discovered` and `## Edge Cases`) as per specification miner protocol. [DONE]
- **Interface contracts**: Specifications delivered for consumption by `avatar_canvas_worker`, `avatar_svg_worker`, `avatar_critic`, `avatar_challenger`, and `couple_care_sync_worker`.

## Key Decisions Made
- Established volume-preserving harmonic breathing model ($S_x \approx 1/\sqrt{S_y}$) pinned to ground base to prevent character levitation.
- Calibrated 2nd-order damped spring oscillator with $k=175.0\,\text{N/m}, c=15.0\,\text{N}\cdot\text{s/m}$, yielding underdamped ratio $\zeta = 0.567$ ($1.5$ snappy visible oscillations).
- Formulated asymmetric 3-phase saccadic eye blinking ($130\,\text{ms}$ total duration: $35\,\text{ms}$ downstroke, $25\,\text{ms}$ hold, $70\,\text{ms}$ elastic upstroke) with Poisson distributed intervals ($2.8-5.8\,\text{s}$).
- Designed 4-stage discrete care state engine matching backend decay metrics ($-4.3, -4.0, -4.2\,\text{pts/hr}$) and Telegram haptic feedback cadences.
- Formulated Eulerian particle ballistics for 5 emitter types (Heart Fountain, Soapy Bath Bubbles, Food Crumbs, Sleepy Zzz, Sparkle Burst).

## Artifact Index
- /Users/danil/.gemini/antigravity/scratch/chibilove-tma/.agents/teamwork/avatar_spec_miner/DISPATCH.md — Incoming assignments
- /Users/danil/.gemini/antigravity/scratch/chibilove-tma/.agents/teamwork/avatar_spec_miner/progress.md — Liveness & progress tracking
- /Users/danil/.gemini/antigravity/scratch/chibilove-tma/.agents/teamwork/avatar_spec_miner/kinematics_spec.md — Complete Kinematics Specification Document
- /Users/danil/.gemini/antigravity/scratch/chibilove-tma/.agents/teamwork/avatar_spec_miner/handoff.md — 5-component handoff report with discovery tables
