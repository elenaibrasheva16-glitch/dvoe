// ============================================================================
// ChibiLove (ЧибиПара) — Persistent WebGL 3D Studio Engine, 3D Care Props,
// 3D Couple Poses & Real-Time Interactive Finger-Petting Emotion System
// ============================================================================

(function () {
  const S = window.ChibiSculpt;

  const PET_PHRASES_T1 = [
    "Ой~ как тепло 🥰",
    "Твои ручки? ✨",
    "Ммм~ нежно 🌸",
  ];
  const PET_PHRASES_T2 = [
    "Мрр~ так приятно! 💕",
    "Ещё погладь меня~ 🥰",
    "Уиии, мур-мур! 🌸",
  ];
  const PET_PHRASES_T3 = [
    "Обожаю твои ручки! 💖✨",
    "Самый любимый человек! 💞",
    "Счастье зашкаливает~ 🥰💕",
  ];

  // Build real 3D Food Models for Feeding Animation!
  function build3DFoodProp(foodId = "cake") {
    const g = new THREE.Group();
    const clay = (hex, r = 0.45) =>
      new THREE.MeshPhysicalMaterial({ color: hex, roughness: r, clearcoat: 0.25 });

    if (foodId === "ramen") {
      const bowl = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 20, 14, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58),
        clay("#E11D48", 0.3)
      );
      const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.04, 20), clay("#FDE68A", 0.35));
      soup.position.y = -0.02;
      const egg = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), clay("#FFFFFF"));
      egg.scale.set(1, 0.45, 1.2);
      egg.position.set(0.06, 0.01, 0.04);
      const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), clay("#F59E0B"));
      yolk.position.set(0.06, 0.025, 0.04);
      const stick1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.36, 8), clay("#92400E"));
      stick1.rotation.z = 1.25;
      stick1.position.set(0.05, 0.08, 0);
      g.add(bowl, soup, egg, yolk, stick1);
    } else if (foodId === "onigiri") {
      const rice = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.26, 3), clay("#FFFDFB", 0.7));
      rice.scale.set(1, 1, 0.55);
      rice.rotation.y = Math.PI;
      const nori = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.14), clay("#1E293B", 0.8));
      nori.position.y = -0.07;
      g.add(rice, nori);
    } else if (foodId === "boba") {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.105, 0.3, 20),
        new THREE.MeshPhysicalMaterial({ color: 0xfde68a, transparent: true, opacity: 0.85, roughness: 0.12, clearcoat: 1 })
      );
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), clay("#FFF1F2", 0.2));
      lid.position.y = 0.15;
      const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.26, 12), clay("#FB7185", 0.3));
      straw.position.set(0.03, 0.22, 0);
      straw.rotation.z = -0.15;
      g.add(cup, lid, straw);
      for (let p = 0; p < 7; p++) {
        const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), clay("#291D18", 0.2));
        pearl.position.set((Math.random() - 0.5) * 0.12, -0.11 + (p % 2) * 0.03, (Math.random() - 0.5) * 0.12);
        g.add(pearl);
      }
    } else if (foodId === "mochi") {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 8), clay("#D97706"));
      stick.rotation.z = 0.65;
      g.add(stick);
      ["#86EFAC", "#FFFDFB", "#F9A8D4"].forEach((col, idx) => {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 14), clay(col, 0.5));
        const off = (idx - 1) * 0.125;
        ball.position.set(-Math.sin(0.65) * off, Math.cos(0.65) * off, 0);
        g.add(ball);
      });
    } else if (foodId === "pizza") {
      const wedge = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.32, 4), clay("#FBBF24", 0.6));
      wedge.scale.set(1, 1, 0.22);
      wedge.rotation.z = Math.PI * 0.75;
      const crust = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.2, 6, 10), clay("#D97706", 0.65));
      crust.position.set(0.11, 0.11, 0);
      crust.rotation.z = -Math.PI * 0.25;
      g.add(wedge, crust);
      [[-0.02, 0.02], [0.04, 0.06], [0.02, -0.03]].forEach(([px, py]) => {
        const pep = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.055, 10), clay("#DC2626"));
        pep.rotation.x = Math.PI / 2;
        pep.position.set(px, py, 0);
        g.add(pep);
      });
    } else {
      // Strawberry Cake 3D!
      const sponge = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.16, 3), clay("#FEF3C7", 0.65));
      const icing = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.045, 3), clay("#FFFDFB", 0.4));
      icing.position.y = 0.08;
      const berry = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.095, 12), clay("#E11D48", 0.3));
      berry.position.set(0, 0.14, 0.02);
      g.add(sponge, icing, berry);
    }
    return g;
  }

  // ==========================================================================
  // SINGLETON PERSISTENT WEBGL ENGINE
  // ==========================================================================
  let renderer = null;
  let scene = null;
  let camera = null;
  let stageGroup = null;
  let charactersGroup = null;
  let fxGroup = null;
  let pedestalGroup = null;
  let lights = {};

  let wrapperEl = null;
  let speechBubbleEl = null;
  let hintBadgeEl = null;

  let currentContainer = null;
  let currentSignature = "";
  let currentMode = "solo"; // 'solo' | 'couple'
  let canPetCurrent = false;
  let isSleepingCurrent = false;

  let charControllers = [];
  let floatingParticles = []; // 3D hearts, stars, soap bubbles, Zzz
  let activeCareProp = null;  // { group, kind, timer, duration }

  let turntableYaw = 0.16;
  let targetYaw = 0.16;
  let yawVelocity = 0;

  // Pointer & Finger-Petting State
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  let isPointerDown = false;
  let pointerMode = "none"; // 'pet' | 'rotate'
  let lastPointerX = 0;
  let lastPointerY = 0;
  let petLevel = 0;         // 0..1 smoothed emotion intensity
  let petDirX = 0;
  let petDirY = 0;
  let petStrokeAccum = 0;
  let petSpawnCooldown = 0;
  let petNotifiedSession = false;
  let lastPhraseTier = 0;
  let bubbleHideTimer = null;

  let clockLast = performance.now();
  let rafId = null;

  function ensureEngineInitialized() {
    if (renderer) return;

    wrapperEl = document.createElement("div");
    wrapperEl.className = "chibi-3d-canvas-wrap";

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;

    renderer.domElement.className = "chibi-3d-canvas";
    wrapperEl.appendChild(renderer.domElement);

    // Floating Affection Speech Bubble (for Finger Petting reactions!)
    speechBubbleEl = document.createElement("div");
    speechBubbleEl.className = "pet-speech-bubble";
    wrapperEl.appendChild(speechBubbleEl);

    // Subtle Interactive Gesture Badge
    hintBadgeEl = document.createElement("div");
    hintBadgeEl.className = "chibi-3d-hint";
    wrapperEl.appendChild(hintBadgeEl);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(0, 1.85, 5.85);
    camera.lookAt(0, 1.48, 0);

    // Studio 3-Point + Signature Pink/Warm Rim Lighting (inspired directly by ref3d/f_02.jpg!)
    lights.hemi = new THREE.HemisphereLight(0xfff5f8, 0x9f6b82, 1.15);
    scene.add(lights.hemi);

    lights.key = new THREE.DirectionalLight(0xfff7f0, 1.75);
    lights.key.position.set(2.6, 4.2, 3.8);
    lights.key.castShadow = true;
    lights.key.shadow.mapSize.width = 1024;
    lights.key.shadow.mapSize.height = 1024;
    lights.key.shadow.camera.near = 0.5;
    lights.key.shadow.camera.far = 14;
    const d = 2.6;
    lights.key.shadow.camera.left = -d;
    lights.key.shadow.camera.right = d;
    lights.key.shadow.camera.top = d;
    lights.key.shadow.camera.bottom = -d;
    lights.key.shadow.bias = -0.0008;
    scene.add(lights.key);

    lights.fill = new THREE.DirectionalLight(0xffd6e7, 0.9);
    lights.fill.position.set(-3.0, 2.0, 2.4);
    scene.add(lights.fill);

    // Strong dramatic studio rim backlight for velvety doll silhouette glow!
    lights.rim = new THREE.DirectionalLight(0xff9ebb, 2.35);
    lights.rim.position.set(1.8, 2.9, -3.5);
    scene.add(lights.rim);

    lights.rimLeft = new THREE.PointLight(0xffe4f2, 1.2, 9);
    lights.rimLeft.position.set(-1.9, 2.4, -2.4);
    scene.add(lights.rimLeft);

    stageGroup = new THREE.Group();
    scene.add(stageGroup);

    pedestalGroup = new THREE.Group();
    stageGroup.add(pedestalGroup);

    charactersGroup = new THREE.Group();
    stageGroup.add(charactersGroup);

    fxGroup = new THREE.Group();
    scene.add(fxGroup);

    bindPointerInteractions(renderer.domElement);

    window.addEventListener("resize", syncViewportSize);
    clockLast = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function buildPedestal(isCouple, isNight) {
    while (pedestalGroup.children.length > 0) {
      pedestalGroup.remove(pedestalGroup.children[0]);
    }
    const rTop = isCouple ? 1.48 : 0.96;
    const rBot = isCouple ? 1.62 : 1.08;

    const topMat = new THREE.MeshPhysicalMaterial({
      color: isNight ? 0x312e81 : 0xfff5f8,
      roughness: 0.36,
      metalness: 0.04,
      clearcoat: 0.45,
      bumpMap: S.getClayBumpTexture(),
      bumpScale: 0.004,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x818cf8 : 0xfda4af,
      roughness: 0.32,
      metalness: 0.25,
    });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, 0.16, 48), topMat);
    base.position.y = -0.09;
    base.receiveShadow = true;
    pedestalGroup.add(base);

    const trim = new THREE.Mesh(new THREE.TorusGeometry(rTop, 0.026, 12, 48), rimMat);
    trim.rotation.x = Math.PI / 2;
    trim.position.y = -0.015;
    pedestalGroup.add(trim);

    if (isNight) {
      // Dreamy floating 3D Crescent Moon & Golden Stars in Night Mode!
      const moonMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.85,
        roughness: 0.2,
      });
      const moon = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.065, 12, 26, Math.PI * 1.35), moonMat);
      moon.position.set(0.88, 2.85, -0.75);
      moon.rotation.z = 0.6;
      pedestalGroup.add(moon);
    }
  }

  function spawn3DParticle(kind, pos, vel) {
    let mesh;
    if (kind === "heart") {
      const cols = ["#F43F5E", "#FB7185", "#EC4899", "#F472B6"];
      const col = cols[Math.floor(Math.random() * cols.length)];
      mesh = new THREE.Mesh(
        S.createHeartGeo(0.085 + Math.random() * 0.05, 0.03),
        new THREE.MeshPhysicalMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.35,
          roughness: 0.2,
          clearcoat: 0.9,
        })
      );
    } else if (kind === "star") {
      mesh = new THREE.Mesh(
        S.createStarGeo(0.08, 0.038, 0.024),
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.55,
          roughness: 0.2,
          metalness: 0.5,
        })
      );
    } else if (kind === "spark") {
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.028 + Math.random() * 0.02, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffd166 })
      );
    } else {
      // Iridescent 3D Soap Bubble!
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.07 + Math.random() * 0.07, 16, 14),
        new THREE.MeshPhysicalMaterial({
          color: 0xe0f2fe,
          emissive: 0xbae6fd,
          emissiveIntensity: 0.2,
          transparent: true,
          opacity: 0.48,
          roughness: 0.04,
          metalness: 0.1,
          clearcoat: 1.0,
        })
      );
    }
    mesh.position.copy(pos);
    fxGroup.add(mesh);
    floatingParticles.push({
      mesh,
      vel: vel || new THREE.Vector3((Math.random() - 0.5) * 0.7, 0.85 + Math.random() * 0.6, (Math.random() - 0.5) * 0.5),
      rotSpeed: (Math.random() - 0.5) * 3.5,
      age: 0,
      maxAge: 1.35 + Math.random() * 0.5,
    });
  }

  function showPetBubble(text) {
    if (!speechBubbleEl) return;
    speechBubbleEl.textContent = text;
    speechBubbleEl.classList.add("visible");
    clearTimeout(bubbleHideTimer);
    bubbleHideTimer = setTimeout(() => {
      speechBubbleEl.classList.remove("visible");
    }, 1850);
  }

  function triggerSoftHaptic(style = "light") {
    try {
      const tg = window.Telegram && window.Telegram.WebApp;
      if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred(style);
      }
    } catch (e) {}
  }

  // ==========================================================================
  // POINTER / TOUCH RAYCASTING: FINGER PETTING vs 360° 3D ROTATION
  // ==========================================================================
  function updatePointerNDC(e, dom) {
    const rect = dom.getBoundingClientRect();
    pointerNDC.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    pointerNDC.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
  }

  function bindPointerInteractions(dom) {
    dom.addEventListener("pointerdown", (e) => {
      isPointerDown = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      yawVelocity = 0;
      try {
        dom.setPointerCapture(e.pointerId);
      } catch (err) {}

      updatePointerNDC(e, dom);

      // Check if user touched Partner's 3D Avatar to stroke/pet them!
      if (canPetCurrent && !isSleepingCurrent && charControllers.length > 0) {
        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObjects(charControllers[0].hitMeshes, true);
        if (hits.length > 0) {
          pointerMode = "pet";
          petNotifiedSession = false;
          lastPhraseTier = 0;
          petStrokeAccum = Math.max(petStrokeAccum, 0.16);
          petDirX = Math.max(-1, Math.min(1, pointerNDC.x * 1.8));
          petDirY = Math.max(-1, Math.min(1, (pointerNDC.y - 0.15) * 1.8));
          triggerSoftHaptic("light");
          spawn3DParticle(
            "heart",
            hits[0].point.clone().add(new THREE.Vector3(0, 0.12, 0.15)),
            new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.95, 0.35)
          );
          return;
        }
      }

      pointerMode = "rotate";
    });

    dom.addEventListener("pointermove", (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      if (pointerMode === "rotate") {
        const deltaYaw = dx * 0.011;
        targetYaw += deltaYaw;
        yawVelocity = deltaYaw;
        return;
      }

      if (pointerMode === "pet" && canPetCurrent && !isSleepingCurrent) {
        updatePointerNDC(e, dom);
        const dist = Math.hypot(dx, dy);
        if (dist > 0.5) {
          // Accumulate loving stroke energy as finger rubs across the 3D avatar!
          petStrokeAccum = Math.min(1.15, petStrokeAccum + dist * 0.0055);
          petDirX = Math.max(-1, Math.min(1, pointerNDC.x * 2.0));
          petDirY = Math.max(-1, Math.min(1, (pointerNDC.y - 0.15) * 1.8));

          if (petSpawnCooldown <= 0) {
            petSpawnCooldown = 0.09;
            raycaster.setFromCamera(pointerNDC, camera);
            const hits = charControllers.length > 0 ? raycaster.intersectObjects(charControllers[0].hitMeshes, true) : [];
            const spawnOrigin =
              hits.length > 0
                ? hits[0].point.clone().add(new THREE.Vector3(0, 0.08, 0.14))
                : new THREE.Vector3(pointerNDC.x * 0.6, 2.25 + pointerNDC.y * 0.4, 0.55);

            spawn3DParticle(petStrokeAccum > 0.65 && Math.random() < 0.4 ? "star" : "heart", spawnOrigin);
            if (Math.random() < 0.35) triggerSoftHaptic("light");
          }

          // Escalating Special Emotion Speech Bubbles!
          if (petStrokeAccum > 0.78 && lastPhraseTier < 3) {
            lastPhraseTier = 3;
            triggerSoftHaptic("medium");
            showPetBubble(PET_PHRASES_T3[Math.floor(Math.random() * PET_PHRASES_T3.length)]);
            if (!petNotifiedSession) {
              petNotifiedSession = true;
              if (typeof window.onPartner3DPetted === "function") {
                window.onPartner3DPetted();
              }
            }
          } else if (petStrokeAccum > 0.42 && lastPhraseTier < 2) {
            lastPhraseTier = 2;
            triggerSoftHaptic("light");
            showPetBubble(PET_PHRASES_T2[Math.floor(Math.random() * PET_PHRASES_T2.length)]);
          } else if (petStrokeAccum > 0.14 && lastPhraseTier < 1) {
            lastPhraseTier = 1;
            showPetBubble(PET_PHRASES_T1[Math.floor(Math.random() * PET_PHRASES_T1.length)]);
          }
        }
      }
    });

    const endPointer = (e) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      pointerMode = "none";
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };
    dom.addEventListener("pointerup", endPointer);
    dom.addEventListener("pointercancel", endPointer);
  }

  // ==========================================================================
  // 3D COUPLE POSES ARTICULATOR (hug, hold_hands, pat_a_to_b, pat_b_to_a)
  // ==========================================================================
  function applyCouplePose3D(charA, charB, poseId, time) {
    const rigA = charA.rig;
    const rigB = charB.rig;
    const sway = Math.sin(time * 1.8) * 0.025;

    if (poseId === "hug") {
      charA.group.position.set(-0.27, 0, 0.05);
      charB.group.position.set(0.27, 0, -0.03);
      charA.group.rotation.y = 0.74;
      charB.group.rotation.y = -0.78;

      // Wrap 3D arms warmly around each other!
      rigA.armGroups.R.shoulder.rotation.set(-0.85, -0.35, -0.3);
      rigA.armGroups.R.elbow.rotation.set(-0.7, 0, 0.55);
      rigA.armGroups.L.shoulder.rotation.set(-0.72, 0.35, 0.25);
      rigA.armGroups.L.elbow.rotation.set(-0.65, 0, -0.45);

      rigB.armGroups.L.shoulder.rotation.set(-0.85, 0.35, 0.3);
      rigB.armGroups.L.elbow.rotation.set(-0.7, 0, -0.55);
      rigB.armGroups.R.shoulder.rotation.set(-0.72, -0.35, -0.25);
      rigB.armGroups.R.elbow.rotation.set(-0.65, 0, 0.45);

      // Lean heads tenderly together!
      rigA.headGroup.rotation.set(0.05, -0.28, -0.14 + sway);
      rigB.headGroup.rotation.set(0.05, 0.28, 0.14 - sway);
    } else if (poseId === "pat_a_to_b") {
      // User (left) gently strokes/pats Partner's (right) 3D head!
      charA.group.position.set(-0.46, 0, 0);
      charB.group.position.set(0.42, 0, 0.04);
      charA.group.rotation.y = 0.42;
      charB.group.rotation.y = -0.32;

      const patWave = Math.sin(time * 5.8) * 0.11;
      rigA.armGroups.R.shoulder.rotation.set(-1.72 + patWave * 0.5, -0.25, -0.58);
      rigA.armGroups.R.elbow.rotation.set(-0.52 + patWave, 0, 0.42);
      rigA.armGroups.L.shoulder.rotation.set(0.08, 0.1, 0.3);
      rigA.armGroups.L.elbow.rotation.set(-0.3, 0, -0.2);

      rigA.headGroup.rotation.set(0.06, -0.18, -0.06);
      // Partner leans affectionately into the pat!
      rigB.headGroup.rotation.set(0.08, -0.12, 0.16 + patWave * 0.35);
      rigB.armGroups.L.shoulder.rotation.set(0.1, 0.1, 0.35);
      rigB.armGroups.L.elbow.rotation.set(-0.4, 0, -0.5);
      rigB.armGroups.R.shoulder.rotation.set(0.1, -0.1, -0.35);
      rigB.armGroups.R.elbow.rotation.set(-0.4, 0, 0.5);
    } else if (poseId === "pat_b_to_a") {
      // Partner (right) gently strokes/pats User's (left) 3D head!
      charA.group.position.set(-0.42, 0, 0.04);
      charB.group.position.set(0.46, 0, 0);
      charA.group.rotation.y = 0.32;
      charB.group.rotation.y = -0.42;

      const patWave = Math.sin(time * 5.8) * 0.11;
      rigB.armGroups.L.shoulder.rotation.set(-1.72 + patWave * 0.5, 0.25, 0.58);
      rigB.armGroups.L.elbow.rotation.set(-0.52 + patWave, 0, -0.42);
      rigB.armGroups.R.shoulder.rotation.set(0.08, -0.1, -0.3);
      rigB.armGroups.R.elbow.rotation.set(-0.3, 0, 0.2);

      rigB.headGroup.rotation.set(0.06, 0.18, 0.06);
      rigA.headGroup.rotation.set(0.08, 0.12, -0.16 - patWave * 0.35);
      rigA.armGroups.L.shoulder.rotation.set(0.1, 0.1, 0.35);
      rigA.armGroups.L.elbow.rotation.set(-0.4, 0, -0.5);
      rigA.armGroups.R.shoulder.rotation.set(0.1, -0.1, -0.35);
      rigA.armGroups.R.elbow.rotation.set(-0.4, 0, 0.5);
    } else {
      // hold_hands (Holding 3D hands side-by-side!)
      charA.group.position.set(-0.5, 0, 0);
      charB.group.position.set(0.5, 0, 0);
      charA.group.rotation.y = 0.22;
      charB.group.rotation.y = -0.22;

      const handSwing = Math.sin(time * 2.4) * 0.08;
      rigA.armGroups.R.shoulder.rotation.set(handSwing, 0, -0.38);
      rigA.armGroups.R.elbow.rotation.set(-0.18, 0, 0.1);
      rigA.armGroups.L.shoulder.rotation.set(0.08, 0.1, 0.38);
      rigA.armGroups.L.elbow.rotation.set(-0.35, 0, -0.55);

      rigB.armGroups.L.shoulder.rotation.set(handSwing, 0, 0.38);
      rigB.armGroups.L.elbow.rotation.set(-0.18, 0, -0.1);
      rigB.armGroups.R.shoulder.rotation.set(0.08, -0.1, -0.38);
      rigB.armGroups.R.elbow.rotation.set(-0.35, 0, 0.55);

      rigA.headGroup.rotation.set(0.03, -0.1, -0.07 + sway);
      rigB.headGroup.rotation.set(0.03, 0.1, 0.07 - sway);
    }
  }

  // ==========================================================================
  // LIVING 3D FLAME SPIRIT PET (10 EVOLUTION TIERS UP TO 1 YEAR)
  // ==========================================================================
  function buildFlamePet3D(tierInfo = {}, isExtinguished = false) {
    const tier = tierInfo.tier || 1;
    const group = new THREE.Group();
    const bodyGroup = new THREE.Group();
    group.add(bodyGroup);

    const flameColor = isExtinguished
      ? new THREE.Color(0x64748b)
      : new THREE.Color(tierInfo.color || "#F59E0B");

    const flameMat = new THREE.MeshPhysicalMaterial({
      color: flameColor,
      emissive: isExtinguished ? 0x1e293b : (tierInfo.glowHex || 0xff6600),
      emissiveIntensity: isExtinguished ? 0.12 : 0.65,
      roughness: 0.18,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const innerMat = new THREE.MeshBasicMaterial({
      color: isExtinguished ? 0x94a3b8 : 0xfff066,
      transparent: true,
      opacity: 0.85,
    });

    // 1. Teardrop Base Body
    const baseSphere = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 18), flameMat);
    baseSphere.position.y = 0.14;
    bodyGroup.add(baseSphere);

    const coneGeo = new THREE.CylinderGeometry(0.015, 0.135, 0.22, 20);
    const topCone = new THREE.Mesh(coneGeo, flameMat);
    topCone.position.y = 0.25;
    bodyGroup.add(topCone);

    const tipSphere = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), flameMat);
    tipSphere.position.y = 0.36;
    bodyGroup.add(tipSphere);

    // Glowing Inner Spark Core
    const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), innerMat);
    coreMesh.position.y = 0.14;
    bodyGroup.add(coreMesh);

    // Dynamic Point Light
    const petLight = new THREE.PointLight(
      isExtinguished ? 0x334155 : (tierInfo.glowHex || 0xff7a00),
      isExtinguished ? 0.15 : 0.75,
      2.4
    );
    petLight.position.set(0, 0.22, 0);
    bodyGroup.add(petLight);

    // 2. Cute Cartoon Face
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xff758f, transparent: true, opacity: 0.75 });

    if (!isExtinguished) {
      // Anime bead eyes with white catchlight dots
      [-0.055, 0.055].forEach((ex) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), eyeMat);
        eye.position.set(ex, 0.165, 0.125);
        const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), whiteMat);
        catchlight.position.set(ex + 0.006, 0.173, 0.142);
        bodyGroup.add(eye, catchlight);
      });

      // Sweet pink blush cheeks
      [-0.082, 0.082].forEach((bx) => {
        const blush = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), blushMat);
        blush.scale.set(1.2, 0.6, 0.4);
        blush.position.set(bx, 0.128, 0.115);
        bodyGroup.add(blush);
      });

      // Cute tiny smile
      const mouth = new THREE.Mesh(
        new THREE.TorusGeometry(0.022, 0.004, 6, 12, Math.PI * 0.75),
        new THREE.MeshBasicMaterial({ color: 0x9f1239 })
      );
      mouth.position.set(0, 0.128, 0.134);
      mouth.rotation.x = 0.35;
      mouth.rotation.z = Math.PI;
      bodyGroup.add(mouth);
    } else {
      // Extinguished sad sleeping eyes: "- -"
      [-0.055, 0.055].forEach((ex) => {
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.006, 0.01), eyeMat);
        dash.position.set(ex, 0.155, 0.13);
        bodyGroup.add(dash);
      });
    }

    // 3. Stage-Specific Evolution Features
    let tailMesh = null;
    let crownMesh = null;
    let wingsGroup = null;
    let wingL = null;
    let wingR = null;
    let starSatellitesGroup = null;
    let auroraRing = null;

    // TIER >= 2: Flexible Flame Tail
    if (tier >= 2 && !isExtinguished) {
      tailMesh = new THREE.Group();
      const t1 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), flameMat);
      t1.position.set(0, 0.08, -0.12);
      const t2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), flameMat);
      t2.position.set(0, 0.12, -0.18);
      const t3 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), innerMat);
      t3.position.set(0, 0.18, -0.23);
      tailMesh.add(t1, t2, t3);
      bodyGroup.add(tailMesh);
    }

    // TIER >= 3: Floating Golden Crown with Ruby Gem
    if (tier >= 3 && !isExtinguished) {
      crownMesh = new THREE.Group();
      const goldMat = new THREE.MeshPhysicalMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 0.3,
        metalness: 0.85,
        roughness: 0.15,
      });
      const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.028, 14, 1, true), goldMat);
      crownMesh.add(crownBase);
      for (let p = 0; p < 4; p++) {
        const ang = (p * Math.PI * 2) / 4;
        const peak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 6), goldMat);
        peak.position.set(Math.cos(ang) * 0.062, 0.026, Math.sin(ang) * 0.062);
        crownMesh.add(peak);
      }
      const ruby = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 8, 8),
        new THREE.MeshPhysicalMaterial({ color: 0xe11d48, emissive: 0xbe123c, emissiveIntensity: 0.6 })
      );
      ruby.position.set(0, 0.032, 0.062);
      crownMesh.add(ruby);
      crownMesh.position.set(0, 0.44, 0);
      bodyGroup.add(crownMesh);
    }

    // TIER >= 4: Kitsune Flame Ears & Double Flame Tail
    if (tier >= 4 && !isExtinguished) {
      [-0.075, 0.075].forEach((ex, idx) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.11, 8), flameMat);
        ear.position.set(ex, 0.35, 0.02);
        ear.rotation.z = idx === 0 ? 0.35 : -0.35;
        ear.rotation.x = -0.15;
        bodyGroup.add(ear);
      });
      if (tailMesh) {
        const t2b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), innerMat);
        t2b.position.set(0.05, 0.15, -0.22);
        tailMesh.add(t2b);
      }
    }

    // TIER >= 5: Orbiting Star Satellites
    if (tier >= 5 && !isExtinguished) {
      starSatellitesGroup = new THREE.Group();
      const starMatA = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const starMatB = new THREE.MeshStandardMaterial({
        color: 0xe9d5ff,
        emissive: 0xa855f7,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const s1 = new THREE.Mesh(S.createStarGeo(0.045, 0.02, 0.015), starMatA);
      s1.position.set(0.24, 0.22, 0);
      const s2 = new THREE.Mesh(S.createStarGeo(0.038, 0.018, 0.015), starMatB);
      s2.position.set(-0.24, 0.22, 0);
      starSatellitesGroup.add(s1, s2);
      bodyGroup.add(starSatellitesGroup);
    }

    // TIER >= 6: Flame Guardian Wings & Chest Crystal Heart
    if (tier >= 6 && !isExtinguished) {
      wingsGroup = new THREE.Group();
      const wingMat = new THREE.MeshPhysicalMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.88,
        roughness: 0.15,
        clearcoat: 1.0,
      });
      wingL = new THREE.Mesh(S.createFairyWingGeo(true), wingMat);
      wingL.scale.set(0.26, 0.26, 0.26);
      wingL.position.set(0.08, 0.16, -0.06);
      wingR = new THREE.Mesh(S.createFairyWingGeo(true), wingMat);
      wingR.scale.set(-0.26, 0.26, 0.26);
      wingR.position.set(-0.08, 0.16, -0.06);
      wingsGroup.add(wingL, wingR);
      bodyGroup.add(wingsGroup);

      const chestHeart = new THREE.Mesh(
        S.createHeartGeo(0.042, 0.018),
        new THREE.MeshPhysicalMaterial({
          color: 0xff1744,
          emissive: 0xd50000,
          emissiveIntensity: 0.65,
          roughness: 0.1,
          clearcoat: 1.0,
        })
      );
      chestHeart.position.set(0, 0.125, 0.138);
      bodyGroup.add(chestHeart);
    }

    // TIER >= 7: Aurora of Love Ring
    if (tier >= 7 && !isExtinguished) {
      auroraRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.018, 12, 32),
        new THREE.MeshPhysicalMaterial({
          color: 0x06b6d4,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.65,
          roughness: 0.05,
          clearcoat: 1.0,
        })
      );
      auroraRing.rotation.x = Math.PI / 2.8;
      auroraRing.position.set(0, 0.18, 0);
      bodyGroup.add(auroraRing);
    }

    // TIER >= 8: Dragon Horns & Spines
    if (tier >= 8 && !isExtinguished) {
      [-0.06, 0.06].forEach((hx, idx) => {
        const horn = new THREE.Mesh(
          new THREE.ConeGeometry(0.024, 0.09, 8),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.25 })
        );
        horn.position.set(hx, 0.32, 0.04);
        horn.rotation.z = idx === 0 ? -0.45 : 0.45;
        horn.rotation.x = -0.3;
        bodyGroup.add(horn);
      });
      for (let sp = 0; sp < 3; sp++) {
        const spine = new THREE.Mesh(
          new THREE.ConeGeometry(0.016, 0.035, 6),
          new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        spine.position.set(0, 0.12 + sp * 0.07, -0.13);
        spine.rotation.x = -Math.PI / 2.5;
        bodyGroup.add(spine);
      }
    }

    // TIER >= 9: Eternal Faceted Ruby Heart Core
    if (tier >= 9 && !isExtinguished) {
      const bigHeart = new THREE.Mesh(
        S.createHeartGeo(0.075, 0.035),
        new THREE.MeshPhysicalMaterial({
          color: 0xbe123c,
          emissive: 0x9f1239,
          emissiveIntensity: 0.7,
          roughness: 0.08,
          clearcoat: 1.0,
        })
      );
      bigHeart.position.set(0, 0.18, 0);
      bodyGroup.add(bigHeart);
    }

    // TIER 10: Legendary Solar Phoenix Corona & Golden Halo
    if (tier >= 10 && !isExtinguished) {
      const coronaGroup = new THREE.Group();
      const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      for (let ray = 0; ray < 8; ray++) {
        const a = (ray * Math.PI * 2) / 8;
        const beam = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.08, 6), goldMat);
        beam.position.set(Math.cos(a) * 0.22, 0.26 + Math.sin(a) * 0.22, -0.02);
        beam.rotation.z = a - Math.PI / 2;
        coronaGroup.add(beam);
      }
      bodyGroup.add(coronaGroup);
    }

    // 4. Animation & Physics Controller
    let orbitAngle = Math.random() * Math.PI * 2;
    let spinJumpT = 0;
    let sparkTimer = 0;

    return {
      group,
      bodyGroup,
      triggerPlay() {
        spinJumpT = 1.0;
        // Burst 3D Hearts around pet!
        if (typeof spawn3DParticle === "function") {
          for (let p = 0; p < 5; p++) {
            spawn3DParticle(
              "heart",
              group.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.2 + Math.random() * 0.2, (Math.random() - 0.5) * 0.3))
            );
          }
        }
      },
      update(time, dt) {
        if (isExtinguished) {
          group.position.set(0, 0.18, 1.45);
          group.rotation.set(0.12, 0, 0);
          bodyGroup.scale.set(1.06, 0.78, 1.06);
          return;
        }

        orbitAngle += dt * 1.55;
        const orbitRadiusX = 1.45;
        const orbitRadiusZ = 1.25;

        const px = Math.sin(orbitAngle) * orbitRadiusX;
        const pz = Math.cos(orbitAngle) * orbitRadiusZ;
        const hop = Math.abs(Math.sin(orbitAngle * 3.6));
        const py = 0.16 + hop * 0.19;

        group.position.set(px, py, pz);

        // Forward heading tangent
        const nextX = Math.sin(orbitAngle + 0.08) * orbitRadiusX;
        const nextZ = Math.cos(orbitAngle + 0.08) * orbitRadiusZ;
        group.rotation.y = Math.atan2(nextX - px, nextZ - pz);
        group.rotation.z = -0.12;

        // Dynamic Squash & Stretch
        const squash = (hop - 0.5) * 0.24;
        bodyGroup.scale.set(1.0 - squash * 0.35, 1.0 + squash, 1.0 - squash * 0.35);

        // Interactive Spin Jump Roll
        if (spinJumpT > 0) {
          spinJumpT = Math.max(0, spinJumpT - dt * 2.8);
          bodyGroup.rotation.x = Math.sin((1 - spinJumpT) * Math.PI * 2) * Math.PI * 2;
          group.position.y += Math.sin((1 - spinJumpT) * Math.PI) * 0.35;
        } else {
          bodyGroup.rotation.x = 0;
        }

        // Secondary Animations
        if (tailMesh) {
          tailMesh.rotation.y = Math.sin(time * 9.0) * 0.35;
          tailMesh.rotation.x = Math.sin(time * 6.0) * 0.2;
        }
        if (crownMesh) {
          crownMesh.position.y = 0.44 + Math.sin(time * 4.0) * 0.03;
          crownMesh.rotation.y = time * 1.5;
        }
        if (wingsGroup && wingL && wingR) {
          const flap = Math.sin(time * 14.0) * 0.45;
          wingL.rotation.y = flap;
          wingR.rotation.y = -flap;
        }
        if (starSatellitesGroup) {
          starSatellitesGroup.rotation.y = time * 3.2;
        }
        if (auroraRing) {
          auroraRing.rotation.z = time * 1.2;
          auroraRing.rotation.x = Math.sin(time * 1.8) * 0.25;
        }

        // Emit Trail Sparks
        sparkTimer += dt;
        if (sparkTimer > 0.1) {
          sparkTimer = 0;
          if (typeof spawn3DParticle === "function") {
            spawn3DParticle(
              "spark",
              group.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.08, 0.08 + Math.random() * 0.1, (Math.random() - 0.5) * 0.08)),
              new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.45 + Math.random() * 0.3, (Math.random() - 0.5) * 0.2)
            );
          }
        }
      },
    };
  }

  // ==========================================================================
  // SCENE REBUILDER (ONLY RUNS WHEN AVATAR / ACCESSORIES / POSE ACTUALLY CHANGE)
  // ==========================================================================
  let coupleHeartMesh = null;
  let flamePetController = null;

  function rebuildSceneContent(desc) {
    while (charactersGroup.children.length > 0) {
      charactersGroup.remove(charactersGroup.children[0]);
    }
    charControllers = [];
    coupleHeartMesh = null;
    flamePetController = null;

    currentMode = desc.mode || "solo";
    canPetCurrent = Boolean(desc.canPet);
    isSleepingCurrent = Boolean(desc.care && desc.care.isSleeping);

    // Adjust camera framing cleanly for Solo vs Couple 3D view!
    if (currentMode === "couple") {
      camera.position.set(0, 1.85, 6.95);
      camera.lookAt(0, 1.48, 0);
    } else {
      camera.position.set(0, 1.84, 5.55);
      camera.lookAt(0, 1.52, 0);
    }

    // Update studio vs night lighting
    if (isSleepingCurrent) {
      lights.hemi.color.setHex(0xc7d2fe);
      lights.hemi.groundColor.setHex(0x1e1b4b);
      lights.hemi.intensity = 0.85;
      lights.key.color.setHex(0xa5b4fc);
      lights.key.intensity = 1.05;
      lights.rim.color.setHex(0xfde047);
      lights.rim.intensity = 1.55;
    } else {
      lights.hemi.color.setHex(0xfff5f8);
      lights.hemi.groundColor.setHex(0x9f6b82);
      lights.hemi.intensity = 1.18;
      lights.key.color.setHex(0xfff7f0);
      lights.key.intensity = 1.78;
      lights.rim.color.setHex(0xff9ebb);
      lights.rim.intensity = 2.35;
    }

    buildPedestal(currentMode === "couple", isSleepingCurrent);

    if (currentMode === "couple" && desc.user && desc.partner) {
      const cA = window.buildChibi3DCharacter(desc.user.avatar, {
        accessories: desc.user.partnerAccessories || [],
        mood: desc.user.mood,
        care: { hungerStage: 4, cleanStage: 4, energyStage: 4, isSleeping: false },
        poseMode: "couple",
        showSleepBed: false,
      });
      const cB = window.buildChibi3DCharacter(desc.partner.avatar, {
        accessories: desc.partner.partnerAccessories || [],
        mood: desc.partner.mood,
        care: desc.partner.care || {},
        poseMode: "couple",
        showSleepBed: false,
      });
      charactersGroup.add(cA.group, cB.group);
      charControllers.push(cA, cB);
      charControllers._poseId = desc.pose || "hug";

      // Floating 3D Pulsing Crystal Heart Above Couple!
      coupleHeartMesh = new THREE.Mesh(
        S.createHeartGeo(0.18, 0.065),
        new THREE.MeshPhysicalMaterial({
          color: 0xf43f5e,
          emissive: 0xe11d48,
          emissiveIntensity: 0.35,
          roughness: 0.14,
          clearcoat: 1.0,
        })
      );
      coupleHeartMesh.position.set(0, 3.15, 0.1);
      charactersGroup.add(coupleHeartMesh);

      // Living 3D Flame Spirit Pet Orbiting the Couple!
      const daysTogether = desc.daysTogether || (desc.partner && desc.partner.care && desc.partner.care.daysTogether) || 1;
      const partnerLeft = Boolean(desc.partnerLeft || (desc.partner && desc.partner.care && desc.partner.care.partnerLeft));
      const tierInfo = window.getFlameStageMeta ? window.getFlameStageMeta(daysTogether, partnerLeft) : { tier: 1 };

      flamePetController = buildFlamePet3D(tierInfo, partnerLeft);
      charactersGroup.add(flamePetController.group);
    } else {
      const cSolo = window.buildChibi3DCharacter(desc.avatar, {
        accessories: desc.accessories || [],
        mood: desc.mood || "happy",
        care: desc.care || {},
        poseMode: "solo",
      });
      charactersGroup.add(cSolo.group);
      charControllers.push(cSolo);
    }

    if (hintBadgeEl) {
      if (canPetCurrent && !isSleepingCurrent) {
        hintBadgeEl.textContent = "🤚 Погладь пальцем • 🔄 360°";
      } else {
        hintBadgeEl.textContent = "🔄 Крути 3D на 360°";
      }
    }
  }

  function syncViewportSize() {
    if (!renderer || !currentContainer) return;
    const w = Math.max(240, currentContainer.clientWidth || 320);
    const h = Math.max(210, currentContainer.clientHeight || 265);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  // ==========================================================================
  // MAIN 60 FPS RENDER & PHYSICS LOOP
  // ==========================================================================
  function tick(nowMs) {
    rafId = requestAnimationFrame(tick);
    if (!renderer || !currentContainer) return;

    const dt = Math.min(0.05, Math.max(0.001, (nowMs - clockLast) / 1000));
    clockLast = nowMs;
    const time = nowMs * 0.001;

    if (petSpawnCooldown > 0) petSpawnCooldown -= dt;

    // Smooth decay of Finger-Petting emotion after lifting finger
    if (pointerMode !== "pet") {
      petStrokeAccum = Math.max(0, petStrokeAccum - dt * 0.42);
      petDirX *= Math.pow(0.08, dt);
      petDirY *= Math.pow(0.08, dt);
    }
    petLevel += (Math.min(1, petStrokeAccum) - petLevel) * Math.min(1, dt * 8.5);

    // Smooth 360° turntable rotation with subtle inertia
    if (pointerMode !== "rotate") {
      if (Math.abs(yawVelocity) > 0.0002) {
        targetYaw += yawVelocity;
        yawVelocity *= Math.pow(0.04, dt);
      }
    }
    turntableYaw += (targetYaw - turntableYaw) * Math.min(1, dt * 12);
    stageGroup.rotation.y = turntableYaw;

    // Active 3D Care Action Prop Animation (3D Food Flying to Mouth / 3D Shower Head + Bubbles!)
    let careAnimKind = null;
    let careAnimT = 0;
    if (activeCareProp) {
      activeCareProp.timer += dt;
      const p = Math.min(1, activeCareProp.timer / activeCareProp.duration);
      careAnimKind = activeCareProp.kind;
      careAnimT = p;

      if (activeCareProp.kind === "feed") {
        // Arc 3D food smoothly toward avatar's mouth and shrink as eaten!
        const arc = Math.sin(p * Math.PI);
        activeCareProp.group.position.set(
          0.55 * (1 - p),
          1.75 + 0.48 * p + arc * 0.16,
          1.05 * (1 - p * 0.58)
        );
        activeCareProp.group.rotation.y += dt * 3.2;
        const eatScale = p > 0.65 ? Math.max(0.01, 1 - (p - 0.65) / 0.35) : 1.0;
        activeCareProp.group.scale.setScalar(eatScale);
        if (Math.random() < 0.25) {
          spawn3DParticle("heart", new THREE.Vector3((Math.random() - 0.5) * 0.5, 2.45, 0.4));
        }
      } else if (activeCareProp.kind === "shower") {
        // Gentle spin & cascade of 3D iridescent soap bubbles!
        targetYaw += dt * 2.2;
        if (Math.random() < 0.48) {
          spawn3DParticle(
            "bubble",
            new THREE.Vector3((Math.random() - 0.5) * 0.9, 0.8 + Math.random() * 1.8, (Math.random() - 0.5) * 0.9),
            new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.7 + Math.random() * 0.6, (Math.random() - 0.5) * 0.4)
          );
        }
      }

      if (p >= 1) {
        scene.remove(activeCareProp.group);
        activeCareProp = null;
      }
    }

    // Ambient Sleeping Stars / Bubbles
    if (isSleepingCurrent && Math.random() < 0.04) {
      spawn3DParticle(
        "star",
        new THREE.Vector3((Math.random() - 0.5) * 0.7, 2.55, 0.25),
        new THREE.Vector3(0.15, 0.45, 0)
      );
    }

    // Update 3D Characters
    if (currentMode === "couple" && charControllers.length === 2) {
      const poseId = charControllers._poseId || "hug";
      applyCouplePose3D(charControllers[0], charControllers[1], poseId, time);
      charControllers[0].update(time, dt, {
        forceBlissEyes: poseId === "pat_b_to_a" || poseId === "hug",
      });
      charControllers[1].update(time + 0.7, dt, {
        forceBlissEyes: poseId === "pat_a_to_b" || poseId === "hug",
      });
      if (coupleHeartMesh) {
        coupleHeartMesh.rotation.y = time * 1.4;
        const pulse = 1.0 + Math.sin(time * 3.8) * 0.12;
        coupleHeartMesh.scale.setScalar(pulse);
        coupleHeartMesh.position.y = 3.12 + Math.sin(time * 2.2) * 0.06;
      }
      if (flamePetController) {
        flamePetController.update(time, dt);
      }
    } else if (charControllers.length === 1) {
      charControllers[0].update(time, dt, {
        petLevel: canPetCurrent ? petLevel : 0,
        petDirX,
        petDirY,
        careAnim: careAnimKind,
        careAnimT,
      });
    }

    // Update Floating 3D Hearts / Stars / Soap Bubbles
    for (let i = floatingParticles.length - 1; i >= 0; i--) {
      const fp = floatingParticles[i];
      fp.age += dt;
      if (fp.age >= fp.maxAge) {
        fxGroup.remove(fp.mesh);
        floatingParticles.splice(i, 1);
        continue;
      }
      fp.mesh.position.addScaledVector(fp.vel, dt);
      fp.mesh.rotation.y += fp.rotSpeed * dt;
      const life = 1 - fp.age / fp.maxAge;
      const sc = fp.age < 0.15 ? fp.age / 0.15 : life;
      fp.mesh.scale.setScalar(Math.max(0.01, sc));
    }

    renderer.render(scene, camera);
  }

  // ==========================================================================
  // PUBLIC API FOR APP.JS
  // ==========================================================================
  window.Chibi3D = {
    mount(containerEl, descriptor) {
      if (!containerEl || typeof THREE === "undefined") return;
      ensureEngineInitialized();

      if (wrapperEl.parentElement !== containerEl) {
        containerEl.innerHTML = "";
        containerEl.appendChild(wrapperEl);
      }
      currentContainer = containerEl;
      syncViewportSize();

      const sig = JSON.stringify(descriptor);
      if (sig !== currentSignature) {
        const modeChanged = currentMode !== (descriptor.mode || "solo");
        currentSignature = sig;
        if (modeChanged) {
          turntableYaw = 0.14;
          targetYaw = 0.14;
          petStrokeAccum = 0;
          petLevel = 0;
        }
        rebuildSceneContent(descriptor);
      }
    },

    playCareAction(kind, foodId = "cake") {
      ensureEngineInitialized();
      if (activeCareProp) {
        scene.remove(activeCareProp.group);
        activeCareProp = null;
      }

      if (kind === "feed") {
        const prop = build3DFoodProp(foodId);
        scene.add(prop);
        activeCareProp = { group: prop, kind: "feed", timer: 0, duration: 1.75 };
        targetYaw = 0.12;
      } else if (kind === "shower") {
        // Build 3D Chrome Shower Head Above Character!
        const sh = new THREE.Group();
        const chrome = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.88 });
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 12), chrome);
        pipe.position.set(0, 3.45, 0);
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
          chrome
        );
        dome.position.set(0, 3.24, 0);
        sh.add(pipe, dome);
        scene.add(sh);
        activeCareProp = { group: sh, kind: "shower", timer: 0, duration: 1.85 };
      }
    },

    resetRotation() {
      targetYaw = 0.14;
    },

    playWithPet() {
      if (flamePetController && typeof flamePetController.triggerPlay === "function") {
        flamePetController.triggerPlay();
      }
    },
  };
})();
