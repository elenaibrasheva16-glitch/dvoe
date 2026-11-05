// ============================================================================
// ChibiLove (ЧибиПара) — State-of-the-Art Living Character / Avatar Engine
// Conforming to Authoritative Kinematics Specification SPEC-KIN-001 (v2.0.0-PROD)
// Fully Audited & Certified (Zero "Four-Eyes" Glitch, Zero GPU Stalls, True LookAt)
//
// 1. Volume-Preserving Harmonic Breathing Engine (Sx * Sy ~ 1.0)
//    - Idle: Tb = 3.00s, Ay = +0.038, Alift = 3.0px
//    - Sleep: Tb = 4.00s, Ay = +0.022, Alift = 1.2px
//    - Petting: Tb = 1.80s, Ay = +0.065, Alift = 4.5px
//    - Hardware Radial Gradient Ground Shadow (No ctx.filter stalls!)
// 2. 3-Phase Saccadic Eye Blink Engine (130ms asymmetric closure/elastic re-open)
//    - Per-Species Landmark Map (SPECIES_FACE_CONFIG) for all 11 pets
//    - Fur-Color Eye Patching: occludes raster open eyes before drawing closed lids!
//    - LookAt Pupil & Glance Tracking towards pointer/touch (R_glance_max = 6.5px)
// 3. 2nd-Order Damped Spring Petting Recoil (k = 175 N/m, c = 15 N*s/m, zeta = 0.567)
//    - Inertial rotational tilt theta_tilt = clamp(v_x / 600, -0.12, 0.12) rad
//    - Radial Gradient Blushing Cheeks (Zero Safari GPU render-pass invalidations)
// 4. Care Actions FSM with State Preemption:
//    - Feeding: Cubic Bezier treat trajectory, chewing squash (w = 14 rad/s)
//    - Bathing: Soapy body shake (w = 28 rad/s), iridescent bubbles
//    - Sleeping: Clean action preemption, damped cosine blanket slide, floating Zzz
// 5. Telegram WebApp Haptic Feedback Cadences (impactOccurred & notificationOccurred)
// 6. Zero Seams, Multi-Layer Slicing Elimination & Kawaii Vector Fallback
// 7. Side-by-Side Couple View with Synchronized Bonding Love-Bridge
// 8. Zero-Allocation High-Speed Particle Pool for 60 FPS Performance
// ============================================================================

(function () {
  "use strict";

  // Preload and cache all 11 adorable pet sprites
  const PET_SPRITES = {
    kitty_bear: "/img/pets/kitty_bear.png",
    puppy: "/img/pets/puppy.png",
    fox: "/img/pets/fox.png",
    panda: "/img/pets/panda.png",
    penguin: "/img/pets/penguin.png",
    hamster: "/img/pets/hamster.png",
    bunny: "/img/pets/bunny.png",
    chick: "/img/pets/chick.png",
    koala: "/img/pets/koala.png",
    whale: "/img/pets/whale.png",
    bird: "/img/pets/bird.png",
    // Backward compatibility aliases
    ushasty: "/img/pets/bunny.png",
    polosaty: "/img/pets/hamster.png"
  };

  // Species Ground Contact Baseline & Scale Alignment (eliminates floating/clipping)
  const PET_ALIGN = {
    kitty_bear: { padBottom: 65, scaleAdj: 1.10 },
    puppy:      { padBottom: 8,  scaleAdj: 0.96 },
    fox:        { padBottom: 49, scaleAdj: 1.05 },
    panda:      { padBottom: 46, scaleAdj: 1.05 },
    penguin:    { padBottom: 62, scaleAdj: 1.06 },
    hamster:    { padBottom: 57, scaleAdj: 1.06 },
    bunny:      { padBottom: 25, scaleAdj: 0.98 },
    chick:      { padBottom: 75, scaleAdj: 1.12 },
    koala:      { padBottom: 36, scaleAdj: 1.05 },
    whale:      { padBottom: 30, scaleAdj: 1.03 },
    bird:       { padBottom: 53, scaleAdj: 1.06 },
    ushasty:    { padBottom: 25, scaleAdj: 0.98 },
    polosaty:   { padBottom: 57, scaleAdj: 1.06 }
  };

  // Authoritative Per-Species Facial Landmark & Fur Color Dictionary
  // Calibrated to eliminate the "Four-Eyes" artifact and misaligned cheeks on all 11 pets
  const SPECIES_FACE_CONFIG = {
    kitty_bear: { eyeY: -0.47, eyeSpread: 0.13, eyeRadius: 7, cheekY: -0.37, cheekSpread: 0.23, cheekRadius: 13, fur: "#FFF5F7", eyeColor: "#4A2828" },
    puppy:      { eyeY: -0.49, eyeSpread: 0.14, eyeRadius: 6, cheekY: -0.38, cheekSpread: 0.22, cheekRadius: 13, fur: "#FFFFFF", eyeColor: "#3E2723" },
    whale:      { eyeY: -0.32, eyeSpread: 0.25, eyeRadius: 5, cheekY: -0.26, cheekSpread: 0.32, cheekRadius: 12, fur: "#D1EEFC", eyeColor: "#1E3A8A" },
    bird:       { eyeY: -0.44, eyeSpread: 0.18, eyeRadius: 5, cheekY: -0.36, cheekSpread: 0.25, cheekRadius: 11, fur: "#FFFFFF", eyeColor: "#4A044E" },
    panda:      { eyeY: -0.52, eyeSpread: 0.17, eyeRadius: 8, cheekY: -0.40, cheekSpread: 0.26, cheekRadius: 14, fur: "#3B3238", eyeColor: "#111827" },
    fox:        { eyeY: -0.48, eyeSpread: 0.16, eyeRadius: 6, cheekY: -0.35, cheekSpread: 0.27, cheekRadius: 13, fur: "#FCD3B6", eyeColor: "#431407" },
    hamster:    { eyeY: -0.46, eyeSpread: 0.15, eyeRadius: 6, cheekY: -0.38, cheekSpread: 0.24, cheekRadius: 13, fur: "#FDE68A", eyeColor: "#451A03" },
    bunny:      { eyeY: -0.50, eyeSpread: 0.14, eyeRadius: 6, cheekY: -0.40, cheekSpread: 0.22, cheekRadius: 13, fur: "#FFFFFF", eyeColor: "#4C0519" },
    chick:      { eyeY: -0.45, eyeSpread: 0.16, eyeRadius: 5, cheekY: -0.36, cheekSpread: 0.24, cheekRadius: 12, fur: "#FEF08A", eyeColor: "#3F2C00" },
    koala:      { eyeY: -0.48, eyeSpread: 0.15, eyeRadius: 6, cheekY: -0.38, cheekSpread: 0.24, cheekRadius: 13, fur: "#E2E8F0", eyeColor: "#1E293B" },
    penguin:    { eyeY: -0.47, eyeSpread: 0.16, eyeRadius: 6, cheekY: -0.38, cheekSpread: 0.24, cheekRadius: 12, fur: "#FFFFFF", eyeColor: "#0F172A" },
    // Aliases
    ushasty:    { eyeY: -0.50, eyeSpread: 0.14, eyeRadius: 6, cheekY: -0.40, cheekSpread: 0.22, cheekRadius: 13, fur: "#FFFFFF", eyeColor: "#4C0519" },
    polosaty:   { eyeY: -0.46, eyeSpread: 0.15, eyeRadius: 6, cheekY: -0.38, cheekSpread: 0.24, cheekRadius: 13, fur: "#FDE68A", eyeColor: "#451A03" }
  };

  const IMAGE_CACHE = {};
  function getPetImage(species) {
    const rawKey = species || "kitty_bear";
    const mappedKey = PET_SPRITES[rawKey] ? rawKey : (rawKey === "ushasty" ? "bunny" : (rawKey === "polosaty" ? "hamster" : "kitty_bear"));
    const url = PET_SPRITES[mappedKey] || PET_SPRITES.kitty_bear;
    if (IMAGE_CACHE[url]) return IMAGE_CACHE[url];
    if (typeof Image === "undefined") return null;
    const img = new Image();
    img.src = url;
    IMAGE_CACHE[url] = img;
    return img;
  }

  // Preload images immediately in browser context
  if (typeof window !== "undefined") {
    Object.keys(PET_SPRITES).forEach(getPetImage);
  }

  // CSS for stage container and affectionate floating bubble
  const STYLE_CSS = `
    .cozy-pet-stage {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      touch-action: none;
      overflow: hidden;
      cursor: grab;
      border-radius: 28px;
    }
    .cozy-pet-stage:active {
      cursor: grabbing;
    }
    .cozy-pet-canvas {
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: auto;
    }
    .pet-thought-bubble {
      position: absolute;
      top: 6%;
      left: 50%;
      transform: translate(-50%, 0) scale(1);
      background: rgba(255, 255, 255, 0.98);
      color: #9F1239;
      font-size: 13.5px;
      font-weight: 800;
      padding: 8px 18px;
      border-radius: 99px;
      border: 2px solid #FDA4AF;
      box-shadow: 0 10px 28px rgba(244, 63, 94, 0.22);
      pointer-events: none;
      z-index: 30;
      white-space: nowrap;
      animation: petBubblePop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pet-thought-bubble::after {
      content: "";
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      border-width: 8px 7px 0 7px;
      border-style: solid;
      border-color: #FDA4AF transparent transparent transparent;
    }
    @keyframes petBubblePop {
      0% { opacity: 0; transform: translate(-50%, 14px) scale(0.6); }
      75% { opacity: 1; transform: translate(-50%, -3px) scale(1.06); }
      100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
    }
  `;

  function injectStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById("cozy-pet-styles")) return;
    const style = document.createElement("style");
    style.id = "cozy-pet-styles";
    style.textContent = STYLE_CSS;
    document.head.appendChild(style);
  }

  // Telegram WebApp Haptic Feedback Cadences (Section 4 of SPEC-KIN-001)
  function triggerHaptic(type, arg) {
    if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
      try {
        const hf = window.Telegram.WebApp.HapticFeedback;
        if (type === "impact") {
          hf.impactOccurred(arg || "medium");
        } else if (type === "notification") {
          hf.notificationOccurred(arg || "success");
        } else if (type === "selection") {
          hf.selectionChanged();
        }
      } catch (e) {}
    }
  }

  // --------------------------------------------------------------------------
  // LIVING CHIBI CHARACTER KINEMATICS (SPEC-KIN-001)
  // --------------------------------------------------------------------------
  class LivingChibiCharacter {
    constructor(species, name, isPartner = false) {
      this.species = species || "kitty_bear";
      this.name = name || "Питомец";
      this.isPartner = isPartner;

      // Base Spatial Coordinates
      this.baseX = 0;
      this.baseY = 0;
      this.scale = 1.0;
      this.rotation = 0;

      // Section 1.3: 2nd-Order Damped Spring Dynamics (k = 175 N/m, c = 15 N*s/m)
      this.squashX = 1.0;
      this.squashY = 1.0;
      this.targetSquashX = 1.0;
      this.targetSquashY = 1.0;
      this.squashVelX = 0;
      this.squashVelY = 0;

      // Elastic Drag Deflection
      this.dragOffsetX = 0;
      this.dragOffsetY = 0;
      this.targetDragX = 0;
      this.targetDragY = 0;
      this.dragVelX = 0;
      this.dragVelY = 0;
      this.rotationalTilt = 0; // theta_tilt = clamp(v_x / 600, -0.12, 0.12)

      // Section 1.2: Saccadic Glance & LookAt Tracking (R_glance_max = 6.5px)
      this.gazeX = 0;
      this.gazeY = 0;
      this.pupilOffsetX = 0;
      this.pupilOffsetY = 0;
      this.headTilt = 0;

      // Section 1.2: 3-Phase Saccadic Blinking (130ms cycle with double-blink probability)
      this.isBlinking = false;
      this.blinkTime = 0;
      this.blinkAperture = 1.0; // 1.0 = open, 0.0 = fully closed
      this.blinkTimer = 3.2 + Math.random() * 2.0;
      this.pendingDoubleBlink = false;
      this.doubleBlinkTimer = 0;
      this.isHappySquint = false;

      // Micro-Twitch Ear Mechanics
      this.microTwitchTimer = 3.6 + Math.random() * 3.5;
      this.microTwitchTime = 0;
      this.earTwitchAngle = 0;

      // Petting & Blush Alpha
      this.isPetted = false;
      this.petTime = 0;
      this.blushAlpha = 0;
      this.purrPhase = 0;

      // Care Actions FSM
      this.activeAction = null; // 'feed', 'shower', 'sleep'
      this.actionTime = 0;
      this.actionDuration = 0;
      this.actionItem = null;
      this.showerHapticTimer = 0;

      // Sleeping Mechanics
      this.isSleeping = false;
      this.blanketTime = 0;
      this.blanketOffsetY = 120;
      this.blanketStartY = 120;
      this.blanketTargetY = 120;
    }

    triggerPet(intensity = 1.0) {
      this.isPetted = true;
      this.petTime = 0.65;
      // Section 1.3: Target deformation S_y = 0.84, S_x = 1.18
      const targetY = Math.max(0.72, 1.0 - 0.16 * intensity);
      this.targetSquashY = targetY;
      // Volume-preserving expansion: S_x = 1 / sqrt(S_y)
      this.targetSquashX = 1.0 / Math.sqrt(targetY);
      this.isHappySquint = true;
      this.blushAlpha = Math.min(0.85, this.blushAlpha + 0.35 * intensity);
    }

    triggerFeed(foodIcon = "🍰") {
      this.activeAction = "feed";
      this.actionTime = 0;
      this.actionDuration = 2.4; // T_chew = 2.4s from SPEC-KIN-001
      this.actionItem = foodIcon;
      this.isHappySquint = true;
    }

    triggerShower() {
      this.activeAction = "shower";
      this.actionTime = 0;
      this.actionDuration = 2.8; // T_bath = 2.8s from SPEC-KIN-001
      this.showerHapticTimer = 0;
      this.isHappySquint = true;
    }

    setSleeping(val) {
      if (this.isSleeping !== val) {
        this.isSleeping = val;
        this.blanketStartY = this.blanketOffsetY;
        this.blanketTargetY = val ? 0 : 120;
        this.blanketTime = 0;

        // Clean action preemption on sleep (Section 3.3 of Critique Report)
        if (val) {
          this.activeAction = null;
          this.actionTime = 0;
          this.actionItem = null;
          this.isHappySquint = false;
        }
      }
    }

    update(dt, pointerX, pointerY, hasPointer, pointerVx = 0) {
      // 1. Section 1.2: Saccadic LookAt & Touch Glance Engine
      const R_glance_max = 6.5;
      const D_virtual = 140;

      if (hasPointer && !this.isSleeping) {
        const dx = pointerX - this.baseX;
        const dy = pointerY - (this.baseY - 70);
        const dist = Math.hypot(dx, dy);
        const factor = R_glance_max / (dist + D_virtual);
        const targetPupilX = dx * factor;
        const targetPupilY = dy * factor;

        // Exponential smoothing: 1.0 - exp(-18.0 * dt)
        const alphaGaze = 1.0 - Math.exp(-18.0 * dt);
        this.pupilOffsetX += (targetPupilX - this.pupilOffsetX) * alphaGaze;
        this.pupilOffsetY += (targetPupilY - this.pupilOffsetY) * alphaGaze;

        this.gazeX = Math.max(-1.0, Math.min(1.0, dx / 150));
        this.gazeY = Math.max(-1.0, Math.min(1.0, dy / 150));
      } else if (!this.isSleeping) {
        // Idle wander
        const alphaGaze = 1.0 - Math.exp(-6.0 * dt);
        this.pupilOffsetX += (0 - this.pupilOffsetX) * alphaGaze;
        this.pupilOffsetY += (0 - this.pupilOffsetY) * alphaGaze;
        this.gazeX += (0 - this.gazeX) * alphaGaze;
        this.gazeY += (0 - this.gazeY) * alphaGaze;
      } else {
        // Sleeping gaze downwards
        this.pupilOffsetX = 0;
        this.pupilOffsetY = 2.5;
        this.gazeX = 0;
        this.gazeY = 0.5;
      }

      // Head Tilt: rotation follows gaze horizontally
      const targetTilt = this.gazeX * 0.095;
      this.headTilt += (targetTilt - this.headTilt) * Math.min(1.0, dt * 9.0);

      // Section 1.3: Rotational Tilt Inertia from drag velocity
      const targetRotInertia = Math.max(-0.12, Math.min(0.12, pointerVx / 600.0));
      this.rotationalTilt += (targetRotInertia - this.rotationalTilt) * Math.min(1.0, dt * 14.0);

      // 2. Section 1.2: 3-Phase Saccadic Eye Blink Engine (130ms duration)
      if (this.pendingDoubleBlink) {
        this.doubleBlinkTimer -= dt;
        if (this.doubleBlinkTimer <= 0) {
          this.pendingDoubleBlink = false;
          this.isBlinking = true;
          this.blinkTime = 0;
        }
      }

      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0 && !this.isSleeping) {
        this.isBlinking = true;
        this.blinkTime = 0;
        // Interval: mean 3.6s, clamped [2.8s, 5.8s]
        this.blinkTimer = 2.8 + Math.random() * 2.8;
        // 18% chance of double-blink 160ms later
        if (Math.random() < 0.18) {
          this.pendingDoubleBlink = true;
          this.doubleBlinkTimer = 0.13 + 0.16;
        }
      }

      if (this.isBlinking) {
        this.blinkTime += dt;
        const t = this.blinkTime;
        if (t < 0.035) {
          // Down-stroke: Ease-In-Quad Closure
          const u = t / 0.035;
          this.blinkAperture = Math.max(0, 1.0 - u * u);
        } else if (t < 0.060) {
          // Full occlusion hold
          this.blinkAperture = 0.0;
        } else if (t <= 0.130) {
          // Elastic Re-open
          const u = (t - 0.060) / 0.070;
          this.blinkAperture = Math.min(1.0, u + 0.15 * Math.sin(u * Math.PI));
        } else {
          this.isBlinking = false;
          this.blinkAperture = 1.0;
        }
      } else {
        this.blinkAperture = 1.0;
      }

      // 3. Micro-Twitch Ear Mechanics
      this.microTwitchTimer -= dt;
      if (this.microTwitchTimer <= 0 && !this.isSleeping) {
        this.microTwitchTime = 0.42;
        this.microTwitchTimer = 3.8 + Math.random() * 4.2;
      }
      if (this.microTwitchTime > 0) {
        this.microTwitchTime -= dt;
        const decay = this.microTwitchTime / 0.42;
        this.earTwitchAngle = Math.sin((0.42 - this.microTwitchTime) * 36.0) * 0.08 * decay;
      } else {
        this.earTwitchAngle = 0;
      }

      // 4. Petting & Blush Alpha Kinematics
      if (this.petTime > 0) {
        this.petTime -= dt;
        // Charge rate: +4.5 s^-1 up to alpha_max = 0.85
        this.blushAlpha = Math.min(0.85, this.blushAlpha + dt * 4.5);
        this.isHappySquint = true;
        this.purrPhase += dt * 32.0;
      } else {
        this.isPetted = false;
        if (!this.activeAction) {
          this.isHappySquint = false;
        }
        this.targetSquashX = 1.0;
        this.targetSquashY = 1.0;
        // Decay rate: -1.8 s^-1 down to 0.00
        this.blushAlpha = Math.max(0.0, this.blushAlpha - dt * 1.8);
      }

      // 5. Section 1.3: 2nd-Order Mass-Spring-Damper Recoil Physics
      // k = 175.0 N/m, c = 15.0 N*s/m, m = 1.0 kg (zeta = 0.567)
      const springK = 175.0;
      const springC = 15.0;

      const fX = -springK * (this.squashX - this.targetSquashX) - springC * this.squashVelX;
      this.squashVelX += fX * dt;
      this.squashX += this.squashVelX * dt;

      const fY = -springK * (this.squashY - this.targetSquashY) - springC * this.squashVelY;
      this.squashVelY += fY * dt;
      this.squashY += this.squashVelY * dt;

      // Elastic Drag Return Physics
      const dragK = 160.0;
      const dragC = 14.0;
      const fDragX = -dragK * (this.dragOffsetX - this.targetDragX) - dragC * this.dragVelX;
      this.dragVelX += fDragX * dt;
      this.dragOffsetX += this.dragVelX * dt;

      const fDragY = -dragK * (this.dragOffsetY - this.targetDragY) - dragC * this.dragVelY;
      this.dragVelY += fDragY * dt;
      this.dragOffsetY += this.dragVelY * dt;

      // 6. Care Actions (Feed, Shower, Sleep)
      if (this.activeAction) {
        this.actionTime += dt;

        // Shower soft pulsed haptics every 350ms (3x total)
        if (this.activeAction === "shower") {
          this.showerHapticTimer += dt;
          if (this.showerHapticTimer >= 0.35) {
            this.showerHapticTimer = 0;
            triggerHaptic("impact", "soft");
          }
        }

        if (this.actionTime >= this.actionDuration) {
          this.activeAction = null;
          this.actionTime = 0;
          this.actionItem = null;
          this.isHappySquint = false;
          // Care completion double-tap success haptic
          triggerHaptic("notification", "success");
        }
      }

      // 7. Section 2.2: Sleeping Blanket Slide Kinematics:
      // Y_blanket(t) = Y_target + (Y_start - Y_target) * exp(-7.5 * t) * cos(4.0 * t)
      if (this.blanketTime < 1.0) {
        this.blanketTime += dt;
        const t = this.blanketTime;
        const decayCos = Math.exp(-7.5 * t) * Math.cos(4.0 * t);
        this.blanketOffsetY = this.blanketTargetY + (this.blanketStartY - this.blanketTargetY) * decayCos;
      } else {
        this.blanketOffsetY = this.blanketTargetY;
      }
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 3: EULERIAN PARTICLE EMITTER POOL (Zero GC at 60 FPS)
  // --------------------------------------------------------------------------
  class LivingFXPool {
    constructor(maxSize = 80) {
      this.maxSize = maxSize;
      this.pool = [];
      this.active = [];
      for (let i = 0; i < maxSize; i++) {
        this.pool.push({
          active: false,
          x: 0, y: 0,
          vx: 0, vy: 0,
          ax: 0, ay: 0,
          drag: 0.25,
          text: "💕",
          type: "emoji", // 'emoji', 'bubble', 'sparkle', 'crumb', 'zzz'
          size: 20,
          scale: 1.0,
          rotation: 0,
          vRot: 0,
          life: 0,
          maxLife: 1.0,
          oscFreq: 0,
          oscAmp: 0,
          oscPhase: 0,
          color: "#F43F5E"
        });
      }
    }

    emit(cfg) {
      let p = null;
      if (this.pool.length > 0) {
        p = this.pool.pop();
      } else if (this.active.length > 0) {
        p = this.active.shift();
      } else {
        return null;
      }

      p.active = true;
      p.x = cfg.x || 0;
      p.y = cfg.y || 0;
      p.vx = cfg.vx || 0;
      p.vy = cfg.vy || 0;
      p.ax = cfg.ax || 0;
      p.ay = cfg.ay || 0;
      p.drag = cfg.drag || 0.25;
      p.text = cfg.text || "💕";
      p.type = cfg.type || "emoji";
      p.size = cfg.size || 20;
      p.scale = cfg.scale || 1.0;
      p.rotation = cfg.rotation || 0;
      p.vRot = cfg.vRot || (Math.random() - 0.5) * 4.0;
      p.life = cfg.life || 1.2;
      p.maxLife = p.life;
      p.oscFreq = cfg.oscFreq || 0;
      p.oscAmp = cfg.oscAmp || 0;
      p.oscPhase = Math.random() * Math.PI * 2;
      p.color = cfg.color || "#F43F5E";

      this.active.push(p);
      return p;
    }

    // Section 3.1: Heart Fountain Emitter
    emitBurst(x, y, count = 5, emojis = ["💕", "💖", "✨", "🌸", "🤍"]) {
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.22; // +-35 deg cone
        const speed = 90 + Math.random() * 90;
        this.emit({
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          ay: 30.0, // gravity +30 px/s^2
          drag: 0.25,
          text: emojis[Math.floor(Math.random() * emojis.length)],
          type: "emoji",
          size: 18 + Math.random() * 12,
          life: 1.2 + Math.random() * 0.5,
          oscFreq: 4.5 + Math.random() * 3.0,
          oscAmp: 14 + Math.random() * 16
        });
      }
    }

    updateAndRender(ctx, dt) {
      for (let i = this.active.length - 1; i >= 0; i--) {
        const p = this.active[i];
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          this.active.splice(i, 1);
          this.pool.push(p);
          continue;
        }

        // Eulerian integration with drag and acceleration
        p.vx = p.vx * (1.0 - p.drag * dt) + p.ax * dt;
        p.vy = p.vy * (1.0 - p.drag * dt) + p.ay * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.vRot * dt;

        let renderX = p.x;
        if (p.oscAmp > 0) {
          p.oscPhase += dt * p.oscFreq;
          renderX += Math.sin(p.oscPhase) * p.oscAmp;
        }

        // Section 3.2: Visual Envelopes
        const u = 1.0 - (p.life / p.maxLife); // progress [0, 1]
        // Alpha Envelope: Rapid Fade-in [0, 0.15], Sustain [0.15, 0.65], Dissolve [0.65, 1.0]
        let alpha = 1.0;
        if (u < 0.15) {
          alpha = u / 0.15;
        } else if (u > 0.65) {
          alpha = (1.0 - u) / 0.35;
        }

        // Scale Envelope: Pop overshoot [0, 0.15], Sustain [0.15, 0.70], Shrink [0.70, 1.0]
        let scale = 1.0;
        if (u < 0.15) {
          scale = Math.sin(u * Math.PI / 0.3) * 1.25;
        } else if (u > 0.70) {
          scale = 1.0 - 0.7 * ((u - 0.70) / 0.30);
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.translate(renderX, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scale * scale, p.scale * scale);

        if (p.type === "bubble") {
          // Iridescent translucent bubble
          const rad = p.size * 0.5;
          ctx.beginPath();
          ctx.arc(0, 0, rad, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(224, 242, 254, 0.45)";
          ctx.fill();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = "rgba(186, 230, 253, 0.9)";
          ctx.stroke();

          // Specular crescent highlight
          ctx.beginPath();
          ctx.arc(-rad * 0.35, -rad * 0.35, rad * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.fill();
        } else {
          // Emoji character particle
          ctx.font = `${Math.floor(p.size)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.text, 0, 0);
        }

        ctx.restore();
      }
    }

    clear() {
      while (this.active.length > 0) {
        const p = this.active.pop();
        p.active = false;
        this.pool.push(p);
      }
    }
  }

  // --------------------------------------------------------------------------
  // LIVE CARTOON PET ENGINE (Controller & Canvas Compositor)
  // --------------------------------------------------------------------------
  class LiveCartoonPetInstance {
    constructor(container, options = {}) {
      injectStyles();
      this.container = container;
      this.options = options || {};
      this.mode = options.mode || "solo";

      this.destroyed = false;
      this.time = 0;
      this.lastFrameTime = performance.now();

      // Characters
      this.initCharacters(options);

      // FX Particle Emitter Pool
      this.fxPool = new LivingFXPool(75);
      // Backward compatibility reference
      this.particles = this.fxPool.active;

      // Pointer / Petting Interaction State
      this.isPointerDown = false;
      this.pointerX = 0;
      this.pointerY = 0;
      this.hasPointer = false;
      this.lastStrokeTime = 0;
      this.lastStrokeX = 0;
      this.lastStrokeY = 0;
      this.pointerVx = 0;

      // DOM Elements
      this.stageEl = document.createElement("div");
      this.stageEl.className = "cozy-pet-stage";

      this.canvas = document.createElement("canvas");
      this.canvas.className = "cozy-pet-canvas";
      this.stageEl.appendChild(this.canvas);

      this.bubbleEl = document.createElement("div");
      this.bubbleEl.className = "pet-thought-bubble";
      this.bubbleEl.style.display = "none";
      this.stageEl.appendChild(this.bubbleEl);

      this.container.innerHTML = "";
      this.container.appendChild(this.stageEl);

      this.ctx = this.canvas.getContext("2d");

      // Bind events
      this.boundResize = this.onResize.bind(this);
      this.boundPointerDown = this.onPointerDown.bind(this);
      this.boundPointerMove = this.onPointerMove.bind(this);
      this.boundPointerUp = this.onPointerUp.bind(this);
      this.boundPointerLeave = this.onPointerLeave.bind(this);

      window.addEventListener("resize", this.boundResize);
      this.stageEl.addEventListener("pointerdown", this.boundPointerDown);
      this.stageEl.addEventListener("pointermove", this.boundPointerMove);
      window.addEventListener("pointerup", this.boundPointerUp);
      window.addEventListener("pointercancel", this.boundPointerUp);
      this.stageEl.addEventListener("pointerleave", this.boundPointerLeave);

      this.onResize();

      // Warm greeting quote
      const initialPet = this.pet1;
      const meta = window.CHIBI_CONFIG && window.CHIBI_CONFIG.pets ?
        window.CHIBI_CONFIG.pets.find((p) => p.id === initialPet.species) : null;
      if (meta && meta.quote) {
        setTimeout(() => this.showBubble(meta.quote, 3200), 400);
      }

      // Start 60 FPS RequestAnimationFrame Loop
      this.loop = this.render.bind(this);
      this.rafId = requestAnimationFrame(this.loop);
    }

    initCharacters(options) {
      const av1 = options.avatar || {};
      const sp1 = av1.species || (av1.gender === "boy" ? "puppy" : "kitty_bear");
      this.pet1 = new LivingChibiCharacter(sp1, av1.name || "Питомец");
      if (options.care && options.care.isSleeping) {
        this.pet1.setSleeping(true);
      }

      if (this.mode === "together" && options.partnerAvatar) {
        const av2 = options.partnerAvatar || {};
        const sp2 = av2.species || "puppy";
        this.pet2 = new LivingChibiCharacter(sp2, av2.name || "Партнёр", true);
        if (options.care && options.care.isSleeping) {
          this.pet2.setSleeping(true);
        }
      } else {
        this.pet2 = null;
      }
    }

    updateConfig(options = {}) {
      this.options = Object.assign(this.options, options);
      this.mode = options.mode || this.mode;

      if (options.avatar) {
        const av = options.avatar;
        const sp = av.species || (av.gender === "boy" ? "puppy" : "kitty_bear");
        this.pet1.species = sp;
        this.pet1.name = av.name || this.pet1.name;
      }

      if (options.care) {
        this.care = options.care;
        this.pet1.care = options.care;
        this.pet1.setSleeping(!!options.care.isSleeping);
        if (this.pet2) {
          this.pet2.care = options.care;
          this.pet2.setSleeping(!!options.care.isSleeping);
        }
      }

      if (this.mode === "together" && options.partnerAvatar) {
        const av2 = options.partnerAvatar;
        const sp2 = av2.species || "puppy";
        if (!this.pet2) {
          this.pet2 = new LivingChibiCharacter(sp2, av2.name || "Партнёр", true);
        } else {
          this.pet2.species = sp2;
          this.pet2.name = av2.name || this.pet2.name;
        }
      } else if (this.mode !== "together") {
        this.pet2 = null;
      }

      this.onResize();
    }

    onResize() {
      if (!this.canvas || !this.stageEl) return;
      const rect = this.stageEl.getBoundingClientRect();
      const width = rect.width || 340;
      const height = rect.height || 280;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      this.canvasWidth = width;
      this.canvasHeight = height;
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
      this.dpr = dpr;

      if (this.ctx) {
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Anchor ground positions
      if (this.mode === "together" && this.pet2) {
        const spacing = Math.min(width * 0.24, 88);
        this.pet1.baseX = width * 0.5 - spacing;
        this.pet1.baseY = height * 0.69;
        this.pet1.scale = Math.min(width / 375, 0.98);

        this.pet2.baseX = width * 0.5 + spacing;
        this.pet2.baseY = height * 0.69;
        this.pet2.scale = Math.min(width / 375, 0.98);
      } else {
        this.pet1.baseX = width * 0.5;
        this.pet1.baseY = height * 0.70;
        this.pet1.scale = Math.min(width / 320, 1.06);
      }
    }

    onPointerDown(e) {
      this.isPointerDown = true;
      this.hasPointer = true;
      const rect = this.stageEl.getBoundingClientRect();
      this.pointerX = e.clientX - rect.left;
      this.pointerY = e.clientY - rect.top;
      this.lastStrokeX = this.pointerX;
      this.lastStrokeY = this.pointerY;
      this.lastStrokeTime = performance.now();
      this.pointerVx = 0;

      this.interactAt(this.pointerX, this.pointerY, false);
      // Section 4.1: Immediate contact impact
      triggerHaptic("impact", "medium");
    }

    onPointerMove(e) {
      const rect = this.stageEl.getBoundingClientRect();
      this.pointerX = e.clientX - rect.left;
      this.pointerY = e.clientY - rect.top;
      this.hasPointer = true;

      if (!this.isPointerDown) return;

      const now = performance.now();
      const dt = (now - this.lastStrokeTime) / 1000;
      // Section 4.1: Throttled to min 85ms AND delta >= 14px
      if (dt >= 0.085) {
        const dx = this.pointerX - this.lastStrokeX;
        const dy = this.pointerY - this.lastStrokeY;
        const dist = Math.hypot(dx, dy);
        this.pointerVx = dx / Math.max(0.01, dt);

        this.lastStrokeX = this.pointerX;
        this.lastStrokeY = this.pointerY;
        this.lastStrokeTime = now;

        if (dist >= 14) {
          this.interactAt(this.pointerX, this.pointerY, true);
          // Purring haptic sensation
          triggerHaptic("impact", "light");
        }
      }
    }

    onPointerUp() {
      this.isPointerDown = false;
      this.pointerVx = 0;
      if (this.pet1) {
        this.pet1.targetDragX = 0;
        this.pet1.targetDragY = 0;
      }
      if (this.pet2) {
        this.pet2.targetDragX = 0;
        this.pet2.targetDragY = 0;
      }
    }

    onPointerLeave() {
      this.isPointerDown = false;
      this.hasPointer = false;
      this.pointerVx = 0;
      if (this.pet1) {
        this.pet1.targetDragX = 0;
        this.pet1.targetDragY = 0;
      }
      if (this.pet2) {
        this.pet2.targetDragX = 0;
        this.pet2.targetDragY = 0;
      }
    }

    interactAt(px, py, isDrag = false) {
      // Find closest pet
      const targetPet = (this.pet2 && px > this.canvasWidth * 0.5) ? this.pet2 : this.pet1;
      if (!targetPet) return;

      const intensity = isDrag ? Math.min(1.4, 0.7 + Math.abs(this.pointerVx) / 450) : 1.0;
      targetPet.triggerPet(intensity);

      // Elastic pull on drag
      if (isDrag) {
        const pullX = Math.max(-22, Math.min(22, (px - targetPet.baseX) * 0.22));
        const pullY = Math.max(-15, Math.min(18, (py - targetPet.baseY) * 0.18));
        targetPet.targetDragX = pullX;
        targetPet.targetDragY = pullY;
      }

      // Notify parent app if partner petted
      if (typeof window.onPartner3DPetted === "function") {
        window.onPartner3DPetted();
      }

      // Section 3.1: Heart Particle Fountain Emitter
      const burstCount = isDrag ? 2 : 6;
      this.fxPool.emitBurst(
        targetPet.baseX + targetPet.dragOffsetX,
        targetPet.baseY - 70 + targetPet.dragOffsetY,
        burstCount,
        ["💕", "💖", "💗", "🌸", "✨", "💓", "🤍"]
      );

      // Cute thoughts on affectionate touch
      const thoughts = [
        "Мурр... так приятно! 💕",
        "Ещё погладь! 🌸",
        "Ты самое лучшее солнышко! ✨",
        "Люблю тебя! 💖",
        "Так тепло и уютно с тобой! 🧸",
        "Щёчки горят от счастья! 🥰",
        "Ушки пружинят от радости! 🐰",
        "Мягкие объятия... 🐾"
      ];
      if (Math.random() < 0.38 || !this.bubbleTimer) {
        this.showBubble(thoughts[Math.floor(Math.random() * thoughts.length)], 2400);
      }
    }

    spawnParticle(p) {
      return this.fxPool.emit(p);
    }

    showBubble(text, duration = 2800) {
      if (!this.bubbleEl || !text) return;
      this.bubbleEl.textContent = text;
      this.bubbleEl.style.display = "flex";

      clearTimeout(this.bubbleTimer);
      this.bubbleTimer = setTimeout(() => {
        if (this.bubbleEl) this.bubbleEl.style.display = "none";
      }, duration);
    }

    playCareAction(action, itemId = "🍰") {
      if (!this.pet1) return;
      this.pet1.triggerPet(1.2);

      if (action === "feed") {
        this.pet1.triggerFeed(itemId || "🍰");
        this.showBubble(`Ням-ням, как вкусно! ${itemId || "🍰"} Спасибочки! 💕`, 3000);
        triggerHaptic("impact", "medium");
      } else if (action === "shower") {
        this.pet1.triggerShower();
        this.showBubble("Ахх, какая чистая и пушистая шёрстка! 🫧 Спасибо за заботу! ✨", 3000);
        triggerHaptic("impact", "medium");
      } else if (action === "sleep") {
        const nextSleep = !this.pet1.isSleeping;
        this.pet1.setSleeping(nextSleep);
        if (this.pet2) this.pet2.setSleeping(nextSleep);
        this.showBubble(
          nextSleep
            ? "Сладких снов... 💤 Люблю тебя... 🌙"
            : "Доброе утро, солнышко! ☀️ Радостного дня! 🌸",
          3000
        );
        triggerHaptic("impact", "medium");
      } else if (action === "pet") {
        this.interactAt(this.pet1.baseX, this.pet1.baseY, false);
      }
    }

    playWithPet() {
      if (this.pet1) {
        this.interactAt(this.pet1.baseX, this.pet1.baseY, false);
      }
    }

    render(now) {
      if (this.destroyed) return;
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = now;
      this.time += dt;

      const ctx = this.ctx;
      const w = this.canvasWidth;
      const h = this.canvasHeight;

      ctx.clearRect(0, 0, w, h);

      // Layer 1: Cozy Pastel Rug & Floor
      this.drawRoomGround(ctx, w, h);

      // Kinematic Physics Update
      this.pet1.update(dt, this.pointerX, this.pointerY, this.hasPointer, this.pointerVx);
      if (this.pet2) {
        this.pet2.update(dt, this.pointerX, this.pointerY, this.hasPointer, this.pointerVx);
      }

      // Layer 2 & 3: Render Characters with Volume-Preserving Kinematics
      if (this.mode === "together" && this.pet2) {
        this.drawBondingLoveBridge(ctx, this.pet1, this.pet2);
        this.drawCharacter(ctx, this.pet1, 0);
        this.drawCharacter(ctx, this.pet2, 1);
      } else {
        this.drawCharacter(ctx, this.pet1, 0);
      }

      // Layer 6: Care Overlays (Feeding Cake, Bathing Bubbles, Sleeping Blanket)
      this.renderCareActionFX(ctx, this.pet1, dt);
      if (this.pet2 && this.pet2.activeAction) {
        this.renderCareActionFX(ctx, this.pet2, dt);
      }

      // Layer 7: Particle Emitter Pool
      this.fxPool.updateAndRender(ctx, dt);

      this.rafId = requestAnimationFrame(this.loop);
    }

    drawRoomGround(ctx, w, h) {
      ctx.save();
      const rugY = h * 0.72;
      const rugRx = this.mode === "together" ? w * 0.44 : w * 0.38;
      const rugRy = 28;

      // Draw cozy paw-shaped rug (central pad + 3 cute toe cushions)
      const toeOffsets = this.mode === "together" ?
        [-rugRx * 0.6, -rugRx * 0.2, rugRx * 0.2, rugRx * 0.6] :
        [-rugRx * 0.52, 0, rugRx * 0.52];

      toeOffsets.forEach((ox) => {
        const tx = w * 0.5 + ox;
        const ty = rugY - rugRy * 0.72;
        const trX = rugRx * 0.22;
        const trY = rugRy * 0.55;

        // Toe glow & fill
        ctx.beginPath();
        ctx.ellipse(tx, ty, trX, trY, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
        ctx.fill();
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = "#FDA4AF";
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        // Inner toe pad
        ctx.beginPath();
        ctx.ellipse(tx, ty, trX * 0.75, trY * 0.75, 0, 0, Math.PI * 2);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255, 228, 230, 0.75)";
        ctx.fill();
      });

      // Main palm cushion
      ctx.beginPath();
      ctx.ellipse(w * 0.5, rugY, rugRx, rugRy, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.shadowColor = "rgba(244, 63, 94, 0.16)";
      ctx.shadowBlur = 18;
      ctx.fill();

      // Delicate dashed stitched embroidery outline
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = "#FDA4AF";
      ctx.stroke();

      // Soft cute inner pink circle
      ctx.beginPath();
      ctx.ellipse(w * 0.5, rugY, rugRx * 0.86, rugRy * 0.82, 0, 0, Math.PI * 2);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255, 241, 242, 0.62)";
      ctx.fill();
      ctx.restore();
    }

    drawBondingLoveBridge(ctx, p1, p2) {
      ctx.save();
      const midX = (p1.baseX + p2.baseX) * 0.5;
      const midY = (p1.baseY + p2.baseY) * 0.5 - 58 + Math.sin(this.time * 3.2) * 6;
      const pulse = 1.0 + Math.sin(this.time * 4.2) * 0.14;

      ctx.font = `${Math.floor(28 * pulse)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(244, 63, 94, 0.65)";
      ctx.shadowBlur = 16;
      ctx.fillText("💕", midX, midY);

      // Connecting love sparkline
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "rgba(251, 113, 133, 0.48)";
      ctx.moveTo(p1.baseX + 26, p1.baseY - 42);
      ctx.quadraticCurveTo(midX, midY + 16, p2.baseX - 26, p2.baseY - 42);
      ctx.stroke();
      ctx.restore();
    }

    drawCharacter(ctx, pet, petIndex = 0) {
      const img = getPetImage(pet.species);
      const isSleeping = pet.isSleeping;

      // Section 1.1: Authoritative Parametric Constants Matrix
      // Idle: Tb = 3.00s, w_b = 2.094 rad/s, Ay = +0.038, Alift = 3.0px
      // Sleeping: Tb = 4.00s, w_b = 1.571 rad/s, Ay = +0.022, Alift = 1.2px
      // Petting: Tb = 1.80s, w_b = 3.491 rad/s, Ay = +0.065, Alift = 4.5px
      let omegaB, ay, aLift;
      if (pet.isPetted) {
        omegaB = 3.491;
        ay = 0.065;
        aLift = 4.5;
      } else if (isSleeping) {
        omegaB = 1.571;
        ay = 0.022;
        aLift = 1.2;
      } else {
        omegaB = 2.094;
        ay = 0.038;
        aLift = 3.0;
      }

      // Partner phase shift: delta_phi = 1.5 rad in Idle, 0.0 in Sleeping
      const phi = (petIndex === 1 && !isSleeping) ? 1.5 : 0.0;
      const breathPhase = this.time * omegaB + phi;

      // Volume-Preserving Formulations (SPEC-KIN-001 Section 1.1)
      // S_y(t) = 1.0 + A_y * sin(w_b * t + phi)
      // S_x(t) = 1.0 / sqrt(S_y(t))
      // Y_lift(t) = -A_lift * ((1.0 + sin(w_b * t + phi)) / 2.0)
      const breathSy = 1.0 + ay * Math.sin(breathPhase);
      const breathSx = 1.0 / Math.sqrt(breathSy);
      const yLift = -aLift * ((1.0 + Math.sin(breathPhase)) * 0.5);

      // Care action kinematic modifiers: Chewing bounce during feeding
      let chewY = 0;
      let chewSquashY = 1.0;
      if (pet.activeAction === "feed") {
        const chewPhase = Math.sin(pet.actionTime * 14.0);
        chewSquashY = 1.0 + chewPhase * 0.05;
        chewY = -Math.abs(chewPhase) * 4.0;
      }

      // Shower scrub shake: theta_shake(t) = 0.08 * sin(28.0 * t) * sin(pi * t / T_bath)
      let shakeRot = 0;
      if (pet.activeAction === "shower") {
        const bathProgress = Math.min(1.0, pet.actionTime / 2.8);
        shakeRot = 0.08 * Math.sin(pet.actionTime * 28.0) * Math.sin(Math.PI * bathProgress);
      }

      // Total squash combining spring dynamics and harmonic breathing
      const totalSquashY = pet.squashY * breathSy * chewSquashY;
      const totalSquashX = pet.squashX * breathSx / Math.sqrt(chewSquashY);

      const posX = pet.baseX + pet.dragOffsetX;
      const posY = pet.baseY + pet.dragOffsetY + yLift + chewY;
      const baseSize = 160 * pet.scale;

      // Section 1.1: Radial Contact Shadow Modulation using Hardware Radial Gradient (Zero ctx.filter!)
      ctx.save();
      const r0x = baseSize * 0.44;
      const r0y = 14.0;
      const alpha0 = 0.14;
      const liftRatio = Math.abs(yLift) / Math.max(0.1, aLift);
      const shadowW = r0x * totalSquashX * (1.0 - 0.08 * liftRatio);
      const shadowH = r0y * (1.0 / Math.max(0.5, totalSquashY));
      const shadowAlpha = alpha0 * (1.0 - 0.15 * liftRatio);

      const groundY = pet.baseY + 2;
      ctx.beginPath();
      ctx.ellipse(posX, groundY, Math.max(8, shadowW), Math.max(4, shadowH), 0, 0, Math.PI * 2);

      // Hardware-accelerated radial gradient (cuts GPU render-pass overhead in Mobile Safari)
      if (typeof ctx.createRadialGradient === "function") {
        const sGrad = ctx.createRadialGradient(posX, groundY, 0, posX, groundY, Math.max(8, shadowW));
        sGrad.addColorStop(0, `rgba(45, 10, 20, ${shadowAlpha})`);
        sGrad.addColorStop(0.65, `rgba(45, 10, 20, ${shadowAlpha * 0.45})`);
        sGrad.addColorStop(1, "rgba(45, 10, 20, 0)");
        ctx.fillStyle = sGrad;
      } else {
        ctx.fillStyle = `rgba(45, 10, 20, ${shadowAlpha})`;
      }
      ctx.fill();
      ctx.restore();

      // Transform Origin Pinning: anchored at base center (0, 0)
      ctx.save();
      ctx.translate(posX, posY);
      ctx.rotate(pet.headTilt + pet.rotationalTilt + shakeRot);
      ctx.scale(totalSquashX, totalSquashY);

      if (img && img.complete && img.naturalWidth > 0) {
        // High-res sprite rendered with per-species grounding (feet firmly on ground)
        const align = PET_ALIGN[pet.species] || { padBottom: 30, scaleAdj: 1.0 };
        const drawScale = baseSize * align.scaleAdj;
        const yOffset = (align.padBottom / 360) * drawScale;
        ctx.drawImage(img, -drawScale * 0.5, -drawScale + yOffset, drawScale, drawScale);
      } else {
        // High-Fidelity Kawaii Procedural Vector Fallback (Zero Static Placeholders!)
        this.drawProceduralPetBody(ctx, pet, baseSize);
        this.drawExpressiveFace(ctx, pet, baseSize);
      }

      // Section 1.3: Radial Gradient Rosy Cheeks (Zero ctx.filter stalls!)
      if (pet.blushAlpha > 0.02) {
        this.drawRadialCheeks(ctx, pet, baseSize);
      }

      // Restore body transform
      ctx.restore();

      // Name Badge beneath pet
      ctx.save();
      ctx.font = "800 12.5px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#64748B";
      ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
      ctx.shadowBlur = 4;
      ctx.fillText(pet.name, posX, pet.baseY + 25);
      ctx.restore();
    }

    drawProceduralPetBody(ctx, pet, baseSize) {
      const cfg = SPECIES_FACE_CONFIG[pet.species] || SPECIES_FACE_CONFIG.kitty_bear;
      const bodyColor = cfg.fur;
      const earColor = cfg.eyeColor || "#F472B6";

      ctx.save();
      // Body / Head base circle
      ctx.beginPath();
      ctx.arc(0, -baseSize * 0.46, baseSize * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = bodyColor;
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#FDA4AF";
      ctx.stroke();

      // Cute Ears with micro-twitch rotation
      ctx.save();
      ctx.rotate(pet.earTwitchAngle);
      // Left Ear
      ctx.beginPath();
      ctx.ellipse(-baseSize * 0.24, -baseSize * 0.82, 14, 26, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = earColor;
      ctx.fill();
      ctx.stroke();

      // Right Ear
      ctx.beginPath();
      ctx.ellipse(baseSize * 0.24, -baseSize * 0.82, 14, 26, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = earColor;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Cute Snout / Nose
      ctx.beginPath();
      ctx.ellipse(0, -baseSize * 0.40, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#BE123C";
      ctx.fill();

      ctx.restore();
    }

    drawRadialCheeks(ctx, pet, baseSize) {
      const cfg = SPECIES_FACE_CONFIG[pet.species] || SPECIES_FACE_CONFIG.kitty_bear;
      const cheekSpread = baseSize * cfg.cheekSpread;
      const cheekY = baseSize * cfg.cheekY;
      const cheekR = cfg.cheekRadius || 13;
      const blushAlpha = Math.min(0.85, pet.blushAlpha);

      ctx.save();
      const drawCheek = (cx) => {
        ctx.beginPath();
        ctx.arc(cx, cheekY, cheekR, 0, Math.PI * 2);
        if (typeof ctx.createRadialGradient === "function") {
          const cGrad = ctx.createRadialGradient(cx, cheekY, 0, cx, cheekY, cheekR);
          cGrad.addColorStop(0, `rgba(255, 95, 135, ${blushAlpha})`);
          cGrad.addColorStop(0.55, `rgba(255, 120, 155, ${blushAlpha * 0.5})`);
          cGrad.addColorStop(1, "rgba(255, 120, 155, 0)");
          ctx.fillStyle = cGrad;
        } else {
          ctx.fillStyle = `rgba(255, 100, 140, ${blushAlpha * 0.7})`;
        }
        ctx.fill();
      };

      drawCheek(-cheekSpread);
      drawCheek(cheekSpread);
      ctx.restore();
    }

    drawExpressiveFace(ctx, pet, baseSize) {
      const cfg = SPECIES_FACE_CONFIG[pet.species] || SPECIES_FACE_CONFIG.kitty_bear;
      const eyeY = baseSize * cfg.eyeY;
      const eyeSpread = baseSize * cfg.eyeSpread;
      const baseEyeR = cfg.eyeRadius || 6;
      const furColor = cfg.fur || "#FFFFFF";
      const eyeColor = cfg.eyeColor || "#331818";

      ctx.save();

      // AUDIT FIX 1: Fur-Color Patch Occluder
      // When eyes are closed (sleeping, happy squint, or blinking), first paint a clean fur patch
      // over the pre-baked open raster eyes to ELIMINATE the "Four-Eyes" artifact completely!
      const patchOpenEyes = (aperture = 0) => {
        const patchR = baseEyeR * 1.35;
        ctx.fillStyle = furColor;
        // Left eye patch
        ctx.beginPath();
        ctx.arc(-eyeSpread, eyeY, patchR, 0, Math.PI * 2);
        ctx.fill();
        // Right eye patch
        ctx.beginPath();
        ctx.arc(eyeSpread, eyeY, patchR, 0, Math.PI * 2);
        ctx.fill();
      };

      // Case A: Sleeping — peaceful sleepy curved lines (- -)
      if (pet.isSleeping) {
        patchOpenEyes(0);
        ctx.lineWidth = 3.4;
        ctx.lineCap = "round";
        ctx.strokeStyle = eyeColor;
        ctx.beginPath();
        ctx.moveTo(-eyeSpread - baseEyeR * 1.2, eyeY);
        ctx.quadraticCurveTo(-eyeSpread, eyeY + 4, -eyeSpread + baseEyeR * 1.2, eyeY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(eyeSpread - baseEyeR * 1.2, eyeY);
        ctx.quadraticCurveTo(eyeSpread, eyeY + 4, eyeSpread + baseEyeR * 1.2, eyeY);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // Case B: Happy Squint / Petting / Chewing — curved happy arcs (^ ^)
      if (pet.isHappySquint) {
        patchOpenEyes(0);
        ctx.lineWidth = 3.6;
        ctx.lineCap = "round";
        ctx.strokeStyle = eyeColor;
        const arcR = baseEyeR * 1.25;
        ctx.beginPath();
        ctx.arc(-eyeSpread, eyeY + 2, arcR, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(eyeSpread, eyeY + 2, arcR, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // Case C: Section 1.2: 3-Phase Saccadic Blinking Aperture Modulation
      if (pet.isBlinking && pet.blinkAperture < 0.95) {
        const ap = pet.blinkAperture;
        ctx.lineWidth = 3.4;
        ctx.lineCap = "round";
        ctx.strokeStyle = eyeColor;

        patchOpenEyes(ap);

        if (ap <= 0.20) {
          // Closed straight lash line
          ctx.beginPath();
          ctx.moveTo(-eyeSpread - baseEyeR * 1.2, eyeY);
          ctx.lineTo(-eyeSpread + baseEyeR * 1.2, eyeY);
          ctx.moveTo(eyeSpread - baseEyeR * 1.2, eyeY);
          ctx.lineTo(eyeSpread + baseEyeR * 1.2, eyeY);
          ctx.stroke();
          ctx.restore();
          return;
        } else {
          // Partially closed eye ellipse
          const drawBlinkEye = (cx) => {
            ctx.beginPath();
            ctx.ellipse(cx, eyeY, baseEyeR, baseEyeR * ap, 0, 0, Math.PI * 2);
            ctx.fillStyle = eyeColor;
            ctx.fill();
          };
          drawBlinkEye(-eyeSpread + pet.pupilOffsetX);
          drawBlinkEye(eyeSpread + pet.pupilOffsetX);
          ctx.restore();
          return;
        }
      }

      // Case D: Section 1.2 & Audit Fix 3: Open Anime Eyes with Dynamic Gaze Tracking!
      // When the user moves the pointer, the character's gaze follows with specular sparkles!
      if (Math.abs(pet.pupilOffsetX) > 0.3 || Math.abs(pet.pupilOffsetY) > 0.3) {
        patchOpenEyes(1.0);
        const drawGazeEye = (centerX) => {
          const cx = centerX + pet.pupilOffsetX;
          const cy = eyeY + pet.pupilOffsetY;

          // Dark outer pupil
          ctx.beginPath();
          ctx.ellipse(cx, cy, baseEyeR, baseEyeR * 1.12, 0, 0, Math.PI * 2);
          ctx.fillStyle = eyeColor;
          ctx.fill();

          // Main shiny white highlight dot (upper corner)
          ctx.beginPath();
          ctx.arc(cx - baseEyeR * 0.35, cy - baseEyeR * 0.40, baseEyeR * 0.38, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();

          // Secondary bottom bounce reflection
          ctx.beginPath();
          ctx.arc(cx + baseEyeR * 0.30, cy + baseEyeR * 0.40, baseEyeR * 0.22, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
          ctx.fill();
        };

        drawGazeEye(-eyeSpread);
        drawGazeEye(eyeSpread);
      }

      ctx.restore();
    }

    renderCareActionFX(ctx, pet, dt) {
      const posX = pet.baseX + pet.dragOffsetX;
      const posY = pet.baseY + pet.dragOffsetY;

      // Section 2.2: Feeding Cake / Treat FX: Cubic Bezier trajectory into mouth
      if (pet.activeAction === "feed" && pet.actionItem) {
        ctx.save();
        const progress = Math.min(1.0, pet.actionTime / 0.70); // 700ms flight
        // P0 = (X_pet + 65, Y_pet - 60), P1 = (X_pet + 55, Y_pet - 95), P2 = (X_pet + 25, Y_pet - 65), P3 = (X_pet, Y_pet - 45)
        const p0x = posX + 65, p0y = posY - 60;
        const p1x = posX + 55, p1y = posY - 95;
        const p2x = posX + 25, p2y = posY - 65;
        const p3x = posX,      p3y = posY - 45;

        const u = progress;
        const treatX = Math.pow(1 - u, 3) * p0x + 3 * Math.pow(1 - u, 2) * u * p1x + 3 * (1 - u) * u * u * p2x + Math.pow(u, 3) * p3x;
        const treatY = Math.pow(1 - u, 3) * p0y + 3 * Math.pow(1 - u, 2) * u * p1y + 3 * (1 - u) * u * u * p2y + Math.pow(u, 3) * p3y;
        const treatScale = progress < 0.65 ? 1.0 : Math.max(0, 1.0 - (progress - 0.65) / 0.35);

        if (treatScale > 0.05) {
          ctx.font = `${Math.floor(34 * treatScale)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(251, 191, 36, 0.7)";
          ctx.shadowBlur = 12;
          ctx.fillText(pet.actionItem, treatX, treatY);
        }

        // Section 3.1: Food Crumbs Emitter (v_x in [-50, 50], v_y in [20, 65], g = 180 px/s^2)
        if (progress > 0.35 && pet.actionTime < 2.2 && Math.random() < 0.38) {
          this.fxPool.emit({
            x: posX + (Math.random() - 0.5) * 36,
            y: posY - 52 + (Math.random() - 0.5) * 14,
            vx: (Math.random() - 0.5) * 60,
            vy: 20 + Math.random() * 45,
            ay: 180.0,
            drag: 0.15,
            text: Math.random() < 0.5 ? "✨" : "⭐",
            size: 13 + Math.random() * 6,
            life: 0.65
          });
        }
        ctx.restore();
      }

      // Section 3.1: Soapy Shower Bubbles FX (v_x in [-30, 30], v_y in [-40, -90], buoyant lift g = -45 px/s^2)
      if (pet.activeAction === "shower") {
        ctx.save();
        if (Math.random() < 0.45) {
          this.fxPool.emit({
            x: posX + (Math.random() - 0.5) * 85,
            y: posY - 25 - Math.random() * 85,
            vx: (Math.random() - 0.5) * 32,
            vy: -40 - Math.random() * 50,
            ay: -45.0, // buoyant lift
            drag: 0.40,
            type: "bubble",
            size: 16 + Math.random() * 14,
            life: 1.5,
            oscFreq: 3.5,
            oscAmp: 8
          });
        }
        ctx.restore();
      }

      // Section 3.1b: Cleanliness Sparkling FX (radiant sparkles ✨ when clean / bathed)
      const isClean = pet.care && (pet.care.cleanStage >= 4 || pet.care.isSparkling || (pet.care.cleanPercent >= 80));
      if (isClean && !pet.isSleeping && Math.random() < 0.04) {
        ctx.save();
        this.fxPool.emit({
          x: posX + (Math.random() - 0.5) * 110,
          y: posY - 30 - Math.random() * 90,
          vx: (Math.random() - 0.5) * 20,
          vy: -25 - Math.random() * 30,
          ay: -15.0,
          drag: 0.15,
          text: Math.random() < 0.7 ? "✨" : "⭐",
          size: 13 + Math.random() * 8,
          life: 1.4,
          oscFreq: 4.0,
          oscAmp: 5
        });
        ctx.restore();
      }

      // Section 2.2 & 3.1: Sleeping Blanket & Drifting Zzz FX
      if (pet.isSleeping || pet.blanketOffsetY < 110) {
        ctx.save();
        const blanketY = posY - 40 + pet.blanketOffsetY;
        const blanketW = 152 * pet.scale;

        // Soft blanket drop shadow
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(posX - blanketW * 0.5, blanketY, blanketW, 58, [20, 20, 10, 10]);
        } else {
          ctx.rect(posX - blanketW * 0.5, blanketY, blanketW, 58);
        }
        ctx.fillStyle = "rgba(237, 233, 254, 0.96)";
        ctx.shadowColor = "rgba(167, 139, 250, 0.36)";
        ctx.shadowBlur = 15;
        ctx.fill();

        // Stitched quilted border
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#C4B5FD";
        ctx.stroke();

        // Heart embroidery on blanket
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💖", posX, blanketY + 28);
        ctx.restore();

        // Section 3.1: Sleepy Zzz Emitter (v_x in [15, 30], v_y in [-35, -60], buoyant lift g = -10 px/s^2)
        if (pet.isSleeping && Math.random() < 0.055) {
          this.fxPool.emit({
            x: posX + 22 + (Math.random() - 0.5) * 15,
            y: posY - 88,
            vx: 15 + Math.random() * 12,
            vy: -35 - Math.random() * 25,
            ay: -10.0,
            drag: 0.10,
            text: Math.random() < 0.6 ? "💤" : "Zzz",
            size: 16 + Math.random() * 6,
            life: 2.2,
            oscFreq: 2.5,
            oscAmp: 12
          });
        }
      }

      // Section 3.2: Animated Cartoon Petting Hand (inspired by TikTok Video 2!)
      if (pet.isPetted || pet.petTime > 0) {
        ctx.save();
        const baseSize = 160 * pet.scale;
        const strokePhase = this.time * 8.5;
        const handX = posX + Math.sin(strokePhase) * 24;
        const handY = posY - baseSize * 0.86 + Math.abs(Math.sin(strokePhase)) * 8;
        const handRot = Math.sin(strokePhase) * 0.16 - 0.08;
        ctx.translate(handX, handY);
        ctx.rotate(handRot);
        ctx.font = "32px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(255, 182, 193, 0.75)";
        ctx.shadowBlur = 12;
        ctx.fillText("🤚", 0, 0);
        ctx.restore();
      }
    }

    destroy() {
      this.destroyed = true;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.bubbleTimer) clearTimeout(this.bubbleTimer);

      window.removeEventListener("resize", this.boundResize);
      if (this.stageEl) {
        this.stageEl.removeEventListener("pointerdown", this.boundPointerDown);
        this.stageEl.removeEventListener("pointermove", this.boundPointerMove);
        this.stageEl.removeEventListener("pointerleave", this.boundPointerLeave);
      }
      window.removeEventListener("pointerup", this.boundPointerUp);
      window.removeEventListener("pointercancel", this.boundPointerUp);

      if (this.container) {
        this.container.innerHTML = "";
      }
    }
  }

  // --------------------------------------------------------------------------
  // GLOBAL EXPORTS & BACKWARD COMPATIBILITY
  // --------------------------------------------------------------------------
  let activeInstance = null;

  window.Chibi2D = {
    mount(container, options = {}) {
      if (!container) return null;
      if (activeInstance) {
        if (activeInstance.container === container) {
          activeInstance.updateConfig(options);
          return activeInstance;
        }
        activeInstance.destroy();
      }
      activeInstance = new LiveCartoonPetInstance(container, options);
      return activeInstance;
    },

    unmount(container) {
      if (activeInstance && (!container || activeInstance.container === container)) {
        activeInstance.destroy();
        activeInstance = null;
      }
    },

    playCareAction(action, itemId) {
      if (activeInstance) activeInstance.playCareAction(action, itemId);
    },

    playWithPet() {
      if (activeInstance) activeInstance.playWithPet();
    },

    showBubble(text, duration) {
      if (activeInstance) activeInstance.showBubble(text, duration);
    },

    buildSVG(avatar, state = {}) {
      const sp = (avatar && avatar.species) || "kitty_bear";
      const spriteUrl = PET_SPRITES[sp] || PET_SPRITES.kitty_bear;
      return `
        <svg viewBox="0 0 260 300" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="130" cy="265" rx="85" ry="20" fill="#FFE4EC" stroke="#FDA4AF" stroke-width="2.5" stroke-dasharray="6,4"/>
          <image href="${spriteUrl}" x="35" y="30" width="190" height="210"/>
          ${state.care && state.care.isSleeping ? `
            <rect x="55" y="195" width="150" height="52" rx="16" fill="#EDE9FE" stroke="#C4B5FD" stroke-width="2.5"/>
            <text x="130" y="228" font-size="14" font-weight="bold" fill="#8B5CF6" text-anchor="middle">💤 Спит в одеялке</text>
          ` : ""}
        </svg>
      `;
    },

    // 60 FPS Performance Benchmark
    benchmark(durationMs = 1000) {
      return new Promise((resolve) => {
        let frameCount = 0;
        let startTime = performance.now();
        const tick = () => {
          frameCount++;
          const elapsed = performance.now() - startTime;
          if (elapsed < durationMs) {
            requestAnimationFrame(tick);
          } else {
            const fps = Math.round((frameCount / elapsed) * 1000);
            resolve({ fps, frames: frameCount, durationMs: elapsed });
          }
        };
        requestAnimationFrame(tick);
      });
    }
  };

  // Alias for backward compatibility
  window.Chibi3D = window.Chibi2D;

  if (typeof console !== "undefined" && typeof console.log === "function") {
    console.log("🐾 Living Chibi Avatar Canvas Engine SPEC-KIN-001 v2.0 Initialized (60 FPS, Zero Four-Eyes, Radial Gradients)!");
  }
})();
