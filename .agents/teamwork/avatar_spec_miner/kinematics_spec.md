# ChibiLove TMA — Living Avatar Kinematics & Interaction Specification
**Document ID:** `SPEC-KIN-001`  
**Version:** 2.0.0-PROD  
**Author:** Avatar Kinematics Spec Miner (`avatar_spec_miner`)  
**Target Consumers:** `avatar_canvas_worker`, `avatar_svg_worker`, `avatar_critic`, `avatar_challenger`, `couple_care_sync_worker`  
**Authoritative Baselines:** SumOne (Eggbun), Widgetable (Pet Care Engine), Paired (Couple Micro-delights), Tamagotchi Classics, Telegram WebApp Bot API 7.0+  

---

## Executive Summary
This document establishes the mathematically rigorous, authoritative kinematics and interaction specification for the ChibiLove Telegram Mini App living character. With accessories removed, the living avatar serves as the central emotional anchor for couples. The specification defines 60 FPS motion dynamics, volume-preserving harmonic breathing, saccadic ocular blinks, 2nd-order damped spring petting recoil, care cycle finite state machines (FSM), multi-emitter particle ballistics, and Telegram WebApp haptic vibration cadences.

---

## 1. Organic Cartoon Kinematics & Timing Curves

### 1.1 Volume-Preserving Harmonic Breathing Engine
In classical 2D cartoon animation (Disney 12 Principles of Animation: *Squash and Stretch*), breathing must preserve the perceptual volume of the character. If the body expands along the vertical $Y$-axis, it must contract along the horizontal $X$-axis such that the normalized volume $V \approx S_x \cdot S_y \cdot S_z \approx 1.0$.

#### Mathematical Formulation
$$\begin{aligned}
S_y(t) &= 1.0 + A_y \cdot \sin(\omega_b t + \phi) \\
S_x(t) &= \frac{1.0}{\sqrt{S_y(t)}} \approx 1.0 - \frac{1}{2} A_y \cdot \sin(\omega_b t + \phi) + \frac{3}{8} A_y^2 \cdot \sin^2(\omega_b t + \phi) \\
Y_{lift}(t) &= -A_{lift} \cdot \left(\frac{1.0 + \sin(\omega_b t + \phi)}{2.0}\right)
\end{aligned}$$

#### Parametric Constants Matrix
| Parameter | Symbol | Idle Awake State | Sleeping State | Petting / Purring State |
| :--- | :---: | :---: | :---: | :---: |
| **Breathing Period** | $T_b$ | $3.00\,\text{s}$ (range: $2.8\,\text{s} - 3.2\,\text{s}$) | $4.00\,\text{s}$ (range: $3.8\,\text{s} - 4.4\,\text{s}$) | $1.80\,\text{s}$ (range: $1.6\,\text{s} - 2.0\,\text{s}$) |
| **Angular Frequency** | $\omega_b = \frac{2\pi}{T_b}$ | $2.094\,\text{rad/s}$ | $1.571\,\text{rad/s}$ | $3.491\,\text{rad/s}$ |
| **Squash Amplitude $Y$** | $A_y$ | $+0.038$ ($+3.8\%$) | $+0.022$ ($+2.2\%$) | $+0.065$ ($+6.5\%$) |
| **Stretch Amplitude $X$** | $A_x$ | $-0.026$ ($-2.6\%$) | $-0.015$ ($-1.5\%$) | $-0.042$ ($-4.2\%$) |
| **Base Lift Displacement** | $A_{lift}$ | $3.0\,\text{px}$ | $1.2\,\text{px}$ | $4.5\,\text{px}$ |
| **Phase Shift (Partner)** | $\Delta \phi$ | $0.0\,\text{rad}$ (Solo) / $+1.5\,\text{rad}$ | $+0.0\,\text{rad}$ (Synchronous) | N/A |

#### Ground Contact & Soft Shadow Kinematics
To guarantee the character feels firmly grounded and never floats detachedly:
1. **Transform Origin Pinning:** Always anchor scaling at the bottom base center:
   - CSS: `transform-origin: 50% 100%;`
   - Canvas 2D: `ctx.translate(baseX, baseY); ctx.scale(totalSquashX, totalSquashY);`
2. **Radial Contact Shadow Modulation:**
   $$\begin{aligned}
   R_{shadow, x}(t) &= R_{0, x} \cdot S_x(t) \cdot \left(1.0 - 0.08 \cdot \frac{Y_{lift}(t)}{A_{lift}}\right) \\
   R_{shadow, y}(t) &= R_{0, y} \cdot S_y(t) \\
   \alpha_{shadow}(t) &= \alpha_0 \cdot \left(1.0 - 0.15 \cdot \frac{|Y_{lift}(t)|}{A_{lift}}\right) \quad (\text{nominal } \alpha_0 = 0.14)
   \end{aligned}$$

---

### 1.2 Saccadic Eye Blink Engine & Glance Tracking

#### Blinking Probability Distribution
Natural animal and anime character blinks are not strictly periodic; they follow an irregular Poisson-like distribution with occasional double-blinks.
$$\Delta t_{interval} = \mu_{blink} + \sigma \cdot \mathcal{N}(0, 1) \quad (\text{clamped to } [2.8\,\text{s}, 5.8\,\text{s}])$$
- Mean interval: $\mu_{blink} = 3.6\,\text{s}$
- Standard deviation: $\sigma = 0.8\,\text{s}$
- Double-blink probability: $P(double) = 0.18$ (second blink triggered $160\,\text{ms}$ after first completes).

#### Single Blink Kinematic Curve (Total Duration = $130\,\text{ms}$)
The blink cycle is asymmetric: eye lid closure is rapid (down-stroke), followed by a brief closed pause, and a slightly slower elastic opening (up-stroke).

```
Eye Aperture
1.0 |-----\                                     /-----
    |      \                                   /
0.5 |       \                                 /
    |        \                               /
0.0 |         \_____________________________/
    +----------+-------------+-------------+-----------> Time (ms)
    0ms       35ms          60ms          130ms
    [Down-stroke]   [Closed Hold]    [Elastic Up-stroke]
```

$$\text{Aperture}(t) = \begin{cases}
1.0 - \left(\frac{t}{0.035}\right)^2 & 0 \le t < 0.035\,\text{s} \quad (\text{Ease-In-Quad Closure}) \\
0.0 & 0.035 \le t < 0.060\,\text{s} \quad (\text{Full Occlusion}) \\
\frac{t - 0.060}{0.070} + 0.15 \cdot \sin\left(\frac{t - 0.060}{0.070} \pi\right) & 0.060 \le t \le 0.130\,\text{s} \quad (\text{Elastic Re-open})
\end{cases}$$

#### Saccadic LookAt & Touch Glance Engine
When the user's cursor or touch moves across the viewport:
- LookAt tracking radius limit: $R_{glance\_max} = 6.5\,\text{px}$.
- Target offset vector:
  $$\vec{D} = (\Delta X, \Delta Y) = (P_{touch, x} - P_{pet, x}, P_{touch, y} - (P_{pet, y} - H_{head}))$$
  $$\vec{O}_{pupil} = \frac{\vec{D}}{\|\vec{D}\| + D_{virtual}} \cdot R_{glance\_max} \quad (D_{virtual} = 140\,\text{px})$$
- Saccade dynamics: Pupils snap towards target with micro-damping:
  $$\vec{O}_{current}(t + \Delta t) = \vec{O}_{current} + (\vec{O}_{pupil} - \vec{O}_{current}) \cdot (1.0 - e^{-18.0 \cdot \Delta t})$$

---

### 1.3 Petting Recoil: 2nd-Order Damped Spring Dynamics
When touched or stroked, the pet exhibits realistic elastic recoil (squash under pressure, spring rebound overshoot upon release, and blushing cheek glow).

#### Mass-Spring-Damper Differential Equation
$$m \frac{d^2 y}{dt^2} + c \frac{dy}{dt} + k (y - y_{rest}) = F_{ext}$$
Dividing by unit mass $m = 1.0$:
$$\ddot{y} + 2\zeta \omega_0 \dot{y} + \omega_0^2 (y - y_{rest}) = 0$$

#### Calibrated Parameter Values
- **Stiffness / Tension ($k$):** $175.0\,\text{N/m}$ ($\omega_0 = \sqrt{175} \approx 13.228\,\text{rad/s}$)
- **Damping Coefficient ($c$):** $15.0\,\text{N}\cdot\text{s/m}$
- **Damping Ratio ($\zeta$):** $\zeta = \frac{c}{2\sqrt{k}} = \frac{15.0}{2 \cdot 13.228} = 0.567$ (Critically Underdamped: gives $1.5$ snappy visible oscillations with zero mechanical oscillation jitter).
- **Target Deformation during Touch Drag:**
  $$S_{y, target} = 0.84 \quad (-16\% \text{ compression})$$
  $$S_{x, target} = 1.18 \quad (+18\% \text{ expansion})$$
- **Rotational Tilt Inertia:**
  $$\theta_{tilt} = \text{clamp}\left(\frac{v_{pointer, x}}{600.0}, -0.12, 0.12\right)\,\text{rad}$$

#### CSS Equivalent Easing Timing Functions
- **Touch Down (Impulsive Squash):** `cubic-bezier(0.18, 0.89, 0.32, 1.28)` over $140\,\text{ms}$.
- **Touch Release (Elastic Recoil):** `cubic-bezier(0.34, 1.56, 0.64, 1.0)` over $480\,\text{ms}$ (Overshoot factor $1.56$).

#### Blush Alpha Kinematics
- Touch active charge rate: $\frac{d\alpha_{blush}}{dt} = +4.5\,\text{s}^{-1}$ up to $\alpha_{max} = 0.85$.
- Decay rate upon release: $\frac{d\alpha_{blush}}{dt} = -1.8\,\text{s}^{-1}$ down to $0.00$.

---

## 2. Care System State Transition Diagrams & FSM

### 2.1 Full Hierarchical State Machine (HFSM)

```
                       +-------------------------------------------------------+
                       |                       ROOT FSM                        |
                       +-------------------------------------------------------+
                                                  |
              +-----------------------------------+-----------------------------------+
              |                                   |                                   |
              v                                   v                                   v
      +---------------+                   +---------------+                   +---------------+
      |  AWAKE_IDLE   |                   |  CARE_ACTION  |                   |   SLEEPING    |
      +---------------+                   +---------------+                   +---------------+
      | - Happy Idle  |                   | - Eating      |                   | - Quilted Bed |
      | - Peckish     |                   | - Bathing     |                   | - Slow Breath |
      | - Dirty Wash  |                   | - Petting     |                   | - Zzz Emitter |
      | - Tired Yawn  |                   +---------------+                   +---------------+
      +---------------+                           |                                   ^
              |                                   | (action completes)                |
              | (sleep toggle action)             +-----------------+                 |
              +-----------------------------------------------------+-----------------+
```

---

### 2.2 Care States: Detailed Transitions & Equations

#### 1. Hunger Cycle: `Starving` $\to$ `Hungry` $\to$ `Peckish` $\to$ `Eating` $\to$ `Satisfied`
- **Decay Rate:** $\lambda_{hunger} = -4.3\,\text{pts/hour}$ (depletes $100 \to 0$ in $23.25\,\text{hours}$).
- **Feed Action Bonus:** $+35.0\,\text{pts}$ (capped at $100.0$).
- **Chewing Animation Kinematics:**
  - Duration: $T_{chew} = 2.4\,\text{s}$.
  - Chewing Frequency: $\omega_{chew} = 14.0\,\text{rad/s}$ (~$2.2\,\text{Hz}$).
  - Vertical Chewing Bounce:
    $$Y_{chew}(t) = -|\sin(\omega_{chew} t)| \cdot 4.0\,\text{px}$$
    $$S_{y, chew}(t) = 1.0 + \sin(\omega_{chew} t) \cdot 0.05$$
  - Treat Bezier Trajectory: Fly from spawn point $(X_{spawn}, Y_{spawn}) = (X_{pet} + 65, Y_{pet} - 60)$ into mouth $(X_{pet}, Y_{pet} - 45)$ using cubic bezier:
    $$B(u) = (1-u)^3 P_0 + 3(1-u)^2 u P_1 + 3(1-u) u^2 P_2 + u^3 P_3 \quad (u \in [0, 1] \text{ over } 700\,\text{ms})$$
    with control points $P_1 = (X_{spawn} - 10, Y_{spawn} - 35)$, $P_2 = (X_{pet} + 25, Y_{pet} - 65)$.

#### 2. Cleanliness Cycle: `Filthy` $\to$ `Dirty` $\to$ `Tidy` $\to$ `Bathing` $\to$ `Sparkle Clean`
- **Decay Rate:** $\lambda_{clean} = -4.0\,\text{pts/hour}$ (depletes $100 \to 0$ in $25.0\,\text{hours}$).
- **Shower Action Bonus:** $+40.0\,\text{pts}$ (capped at $100.0$).
- **Bathing Animation Kinematics:**
  - Duration: $T_{bath} = 2.8\,\text{s}$.
  - Soapy Body Shake Frequency: $\omega_{shake} = 28.0\,\text{rad/s}$ (~$4.5\,\text{Hz}$).
  - Angular Shake Oscillation:
    $$\theta_{shake}(t) = 0.08 \cdot \sin(\omega_{shake} t) \cdot \sin\left(\frac{\pi t}{T_{bath}}\right)\,\text{rad}$$
  - Soap Foam Clumping: Radial clusters around pet crown and shoulders with opacity fade-in over first $500\,\text{ms}$, dissolving at $2.3\,\text{s}$ into radiant sparkles.

#### 3. Energy Cycle: `Exhausted` $\to$ `Sleepy` $\to$ `Bedtime` $\to$ `Sleeping` $\to$ `Recharged`
- **Decay Rate (Awake):** $\lambda_{energy} = -4.2\,\text{pts/hour}$ (depletes $100 \to 0$ in $23.8\,\text{hours}$).
- **Regeneration Rate (Asleep):** $+28.0\,\text{pts/hour}$ (full recharge from $0 \to 100$ in $3.57\,\text{hours}$).
- **Auto-Wake Threshold:** When energy reaches $\ge 99.0\,\text{pts}$, pet automatically wakes up.
- **Quilted Blanket Slide Kinematics:**
  - Transition duration: $420\,\text{ms}$.
  - Travel distance: $120\,\text{px}$ vertical translation ($Y_{off}: 120 \to 0$ for sleep, $0 \to 120$ for wake).
  - Interpolation curve: Spring ease-out `cubic-bezier(0.22, 1.0, 0.36, 1.0)`:
    $$Y_{blanket}(t) = Y_{target} + (Y_{start} - Y_{target}) \cdot e^{-7.5 \cdot t} \cdot \cos(4.0 \cdot t)$$

#### 4. Neglect & Streak Broken State (24-Hour Timeout Gate)
- Condition: If paired and elapsed time since last care action exceeds $86,400\,\text{s}$ ($24\,\text{hours}$):
  - State: `PARTNER_LEFT`.
  - Kinematic presentation: Desaturated grayscale color filter ($60\%$), droopy ears, solitary teardrop particle, flame counter paused.
  - Restoration cost: Free 1st restore or $200$ Hearts ($20$ Stars equivalent).
  - Restoration Transition: Flame ignition burst ($30$ flame/spark particles), joyful bounce ($S_y = 1.25$ jump), state reverts to `AWAKE_IDLE`.

---

## 3. Particle Emitter Ballistics & Physics Models

All particles follow standard Eulerian integration with gravity, drag, angular sway, and life-dependent scale/alpha envelopes.

$$\begin{aligned}
\vec{v}(t + \Delta t) &= \vec{v}(t) \cdot (1.0 - \gamma \Delta t) + \vec{g} \cdot \Delta t \\
\vec{x}(t + \Delta t) &= \vec{x}(t) + \vec{v}(t) \cdot \Delta t \\
\alpha(t) &= \text{Envelope}_\alpha(t / T_{max}) \\
S(t) &= \text{Envelope}_S(t / T_{max})
\end{aligned}$$

### 3.1 Emitter Specifications Matrix

| Emitter Type | Trigger Context | Particle Glyphs / Textures | Velocity Vector $(v_x, v_y)$ | Cone Spread ($\theta$) | Gravity ($\vec{g}$) | Drag ($\gamma$) | Lifespan ($T_{max}$) | Generation Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Heart Fountain** | Petting tap & drag, couple bonding | `💕`, `💖`, `✨`, `🌸`, `🤍` | $v_x \in [-45, 45]$<br>$v_y \in [-90, -180]$ | $\pm 35^\circ$ | $+30.0\,\text{px/s}^2$ | $0.25$ | $1.2\,\text{s} - 1.8\,\text{s}$ | Tap: 5 burst<br>Drag: 12/s |
| **Bath Bubbles** | Shower action | `🫧`, `💧` | $v_x \in [-30, 30]$<br>$v_y \in [-40, -90]$ | $\pm 45^\circ$ | $-45.0\,\text{px/s}^2$ (buoyant lift) | $0.40$ | $1.3\,\text{s} - 1.7\,\text{s}$ | 8/s continuous |
| **Food Crumbs** | Feeding chew phase | `✨`, `⭐`, `🍰`, `🍪` | $v_x \in [-50, 50]$<br>$v_y \in [20, 65]$ | $\pm 60^\circ$ downwards | $+180.0\,\text{px/s}^2$ | $0.15$ | $0.6\,\text{s} - 0.8\,\text{s}$ | 6/s during chew |
| **Sleepy Zzz** | Sleeping active | `💤`, `Zzz` | $v_x \in [15, 30]$<br>$v_y \in [-35, -60]$ | $45^\circ - 65^\circ$ | $-10.0\,\text{px/s}^2$ | $0.10$ | $2.0\,\text{s} - 2.5\,\text{s}$ | 1 particle / 1.1s |
| **Sparkle Burst** | Clean complete, restored | `✨`, `🌟`, `💎`, `🌈` | $v_r \in [70, 140]$ (radial) | $360^\circ$ isotropic | $+15.0\,\text{px/s}^2$ | $0.50$ | $0.9\,\text{s} - 1.2\,\text{s}$ | 12 burst instant |

### 3.2 Visual Envelope Functions
1. **Alpha Fade Curve:**
   $$\text{Envelope}_\alpha(u) = \begin{cases}
   \frac{u}{0.15} & 0 \le u < 0.15 \quad (\text{Rapid Fade-In}) \\
   1.0 & 0.15 \le u \le 0.65 \quad (\text{Sustain}) \\
   \frac{1.0 - u}{0.35} & 0.65 < u \le 1.0 \quad (\text{Smooth Dissolve})
   \end{cases}$$
2. **Scale Pop Curve:**
   $$\text{Envelope}_S(u) = \begin{cases}
   \sin\left(u \cdot \frac{\pi}{0.3}\right) \cdot 1.25 & 0 \le u < 0.15 \quad (\text{Pop overshoot}) \\
   1.0 & 0.15 \le u \le 0.70 \\
   1.0 - 0.7 \cdot \left(\frac{u - 0.70}{0.30}\right) & 0.70 < u \le 1.0 \quad (\text{Shrink-out})
   \end{cases}$$

---

## 4. Telegram WebApp Haptic Feedback Cadences

All haptic triggers must strictly interface with the official `Telegram.WebApp.HapticFeedback` API with error guards for desktop/unsupported browser runners.

```javascript
function triggerHaptic(type, arg) {
  try {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      if (type === "impact") {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(arg); // 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
      } else if (type === "notification") {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(arg); // 'success' | 'warning' | 'error'
      } else if (type === "selection") {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    }
  } catch (err) {
    // Fail silently in environments lacking vibration actuators
  }
}
```

### 4.1 Haptic Interaction Mapping Table

| User Gesture / System Event | Haptic API Call | Timing & Throttling | Perceptual Sensation |
| :--- | :--- | :--- | :--- |
| **Petting Touch Start** (`pointerdown`) | `impactOccurred('medium')` | Immediate ($0\,\text{ms}$) | Crisp, firm contact tap |
| **Petting Continuous Drag** (`pointermove`) | `impactOccurred('light')` | Throttled to min $85\,\text{ms}$ interval AND $\Delta d \ge 14\,\text{px}$ | Velvety cat purring sensation |
| **Food Selection Carousel Scroll** | `selectionChanged()` | Per item boundary crossing | Micro-mechanical detent click |
| **Feed Action Trigger** | `impactOccurred('medium')` | Button release ($0\,\text{ms}$) | Reassuring action commitment |
| **Shower Scrubbing Cycle** | `impactOccurred('soft')` | Fired every $350\,\text{ms}$ ($3\times$ during shower) | Cushioned, water-like pulsing |
| **Care Action Success Completion** | `notificationOccurred('success')` | At $t = 2.4\,\text{s}$ upon gauge fill | Double-tap triumph pulse ($100\,\text{ms}$ gap) |
| **Partner Petting Received (Live Sync)** | `impactOccurred('heavy')` | On WebSocket / SSE packet arrival | Warm heartbeat presence signal |
| **Streak Neglect Warning (<3h left)** | `notificationOccurred('warning')` | On modal dialog display | Alert buzz cadence |
| **Broken Streak / Partner Left** | `notificationOccurred('error')` | On screen transition | Heavy dull thud |
| **Pair Restoration Flame Burst** | `notificationOccurred('success')` followed by `impactOccurred('heavy')` | Separated by $120\,\text{ms}$ | Grand celebratory surge |

---

## 5. Architectural Implementation Guidelines (Canvas vs SVG)

To ensure zero visual seams, glitches, or layer tears across viewport resizing:

### 5.1 Procedural 2D Canvas Architecture (`Chibi2D`)
1. **Device Pixel Ratio Scaling:**
   Always multiply canvas dimensions by `dpr = Math.min(window.devicePixelRatio || 1, 2.5)` and set `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`.
2. **Layer Draw Order:**
   1. Cozy Pastel Rug & Floor Ellipse with outer glow and dashed border.
   2. Dynamic Soft Contact Shadow (scaled via $S_x$ and $S_y$).
   3. Character Body Layer (Sprite Image or procedural geometry with bottom center anchor).
   4. Rosy Cheek Blushing Radial Ellipses with gaussian blur filter.
   5. Ocular Expression Arc Overlay (Happy squint arcs or blinking lids).
   6. Care Action Props (Treat bezier item, shower bubbles, quilted blanket).
   7. Particle System (Sorted front-to-back, rendered with `globalAlpha`).
   8. Expressive Thought Bubble (HTML floating DOM element above canvas).

### 5.2 Vector SVG/CSS Architecture (`ChibiSVG`)
1. **Root ViewBox:** Normalized to `0 0 320 320` with `preserveAspectRatio="xMidYMid meet"`.
2. **Hardware Acceleration:** Apply `will-change: transform;` on animated elements.
3. **No-Seam Guarantees:** Avoid dividing the main body mesh into separate floating limb PNGs; use a whole-body vector group `<g id="pet-body">` deformed via CSS matrix transforms or Canvas path morphing to guarantee zero misalignment glitches.

---
*End of Kinematics Specification `SPEC-KIN-001`.*
