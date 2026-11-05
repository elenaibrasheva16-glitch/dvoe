// ============================================================================
// ChibiLove (ЧибиПара) — 3D Stylized Collectible Doll Character & 14 3D Accessories
// Sculpted Three.js Rig with Articulated Bones, Layered Hair Strands, RPG Outfits
// ============================================================================

(function () {
  const S = window.ChibiSculpt;

  function makeClayMat(colorHex, opts = {}) {
    return new THREE.MeshPhysicalMaterial(
      Object.assign(
        {
          color: new THREE.Color(colorHex),
          roughness: 0.58,
          metalness: 0.02,
          clearcoat: 0.12,
          clearcoatRoughness: 0.48,
          bumpMap: S.getClayBumpTexture(),
          bumpScale: 0.004,
        },
        opts
      )
    );
  }

  function makeFabricMat(colorHex, kind = "weave", opts = {}) {
    return new THREE.MeshStandardMaterial(
      Object.assign(
        {
          color: new THREE.Color(colorHex),
          roughness: kind === "knit" ? 0.82 : 0.72,
          metalness: 0.03,
          bumpMap: S.getFabricBumpTexture(kind),
          bumpScale: kind === "knit" ? 0.015 : 0.009,
        },
        opts
      )
    );
  }

  function makeHairStrandMat() {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.48,
      metalness: 0.04,
      clearcoat: 0.24,
      clearcoatRoughness: 0.36,
      bumpMap: S.getClayBumpTexture(),
      bumpScale: 0.005,
    });
  }

  function enableShadows(obj) {
    obj.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
  }

  // Sculpted 3D Hand with Palm + Thumb + 4 Articulated Mini Fingers
  function createSculptedHand(skinMat, side = 1) {
    const g = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 14), skinMat);
    palm.scale.set(0.95, 1.08, 0.68);
    g.add(palm);

    const fingerOffsets = [
      { x: -0.046 * side, y: -0.075, len: 0.068, r: 0.019, rotZ: -0.14 * side },
      { x: -0.016 * side, y: -0.084, len: 0.078, r: 0.02, rotZ: -0.04 * side },
      { x: 0.015 * side, y: -0.082, len: 0.074, r: 0.019, rotZ: 0.05 * side },
      { x: 0.043 * side, y: -0.072, len: 0.062, r: 0.017, rotZ: 0.14 * side },
    ];
    fingerOffsets.forEach((f) => {
      const fg = new THREE.Mesh(new THREE.CapsuleGeometry(f.r, f.len, 6, 10), skinMat);
      fg.position.set(f.x, f.y, 0.012);
      fg.rotation.z = f.rotZ;
      fg.rotation.x = 0.22;
      g.add(fg);
    });

    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.055, 6, 10), skinMat);
    thumb.position.set(-0.068 * side, -0.025, 0.028);
    thumb.rotation.z = -0.62 * side;
    thumb.rotation.x = 0.28;
    g.add(thumb);
    return g;
  }

  // ==========================================================================
  // HAIR BUILDER: 6 FRONT BANGS + 8 BACK HAIRSTYLES + 5 HAIR CLIPS + OMBRE
  // ==========================================================================
  function buildHair3D(av, hairMat, baseCapMat) {
    const hairRoot = new THREE.Group();
    const swayGroups = [];
    const cMain = av.hairColor || "#3B2620";
    const cTip = av.hairTipColor && av.hairTipColor !== "same" ? av.hairTipColor : S.shadeHex(cMain, 16);

    // Snug cranial hair cap so scalp never peeks through
    const capGeo = new THREE.SphereGeometry(0.845, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.62);
    const cap = new THREE.Mesh(capGeo, baseCapMat);
    cap.scale.set(1.08, 0.98, 0.99);
    cap.position.set(0, 0.03, -0.02);
    cap.rotation.x = -0.14;
    hairRoot.add(cap);

    const addStrand = (parent, pts, w, th) => {
      const mesh = new THREE.Mesh(S.createTaperedStrandGeo(pts, w, th, cMain, cTip), hairMat);
      parent.add(mesh);
      return mesh;
    };

    // --- FRONT BANGS & FACE-FRAMING LOCKS ---
    const bangs = av.hairBangs || "doll_wispy";
    if (bangs === "doll_wispy") {
      // Multi-piece wispy doll fringe across forehead + long tapered cheek-framing locks (f_02.jpg!)
      const fringeSpecs = [
        { x: -0.36, w: 0.16, yEnd: -0.08, xEnd: -0.38, zEnd: 0.77 },
        { x: -0.19, w: 0.17, yEnd: -0.13, xEnd: -0.17, zEnd: 0.83 },
        { x: -0.02, w: 0.16, yEnd: -0.11, xEnd: 0.01, zEnd: 0.85 },
        { x: 0.16, w: 0.17, yEnd: -0.14, xEnd: 0.15, zEnd: 0.83 },
        { x: 0.34, w: 0.16, yEnd: -0.07, xEnd: 0.36, zEnd: 0.77 },
      ];
      fringeSpecs.forEach((f) => {
        addStrand(
          hairRoot,
          [
            [f.x * 0.6, 0.72, 0.25],
            [f.x * 0.88, 0.48, 0.68],
            [f.x, 0.18, 0.83],
            [f.xEnd, f.yEnd, f.zEnd],
          ],
          f.w,
          0.085
        );
      });
      // Signature long layered face-framing side locks (left & right!)
      [-1, 1].forEach((side) => {
        const lockPivot = new THREE.Group();
        hairRoot.add(lockPivot);
        swayGroups.push({ group: lockPivot, ampZ: 0.035 * side, phase: side });
        addStrand(
          lockPivot,
          [
            [0.44 * side, 0.62, 0.28],
            [0.76 * side, 0.22, 0.48],
            [0.82 * side, -0.26, 0.44],
            [0.72 * side, -0.78, 0.35],
            [0.64 * side, -1.16, 0.26],
          ],
          0.22,
          0.11
        );
        addStrand(
          lockPivot,
          [
            [0.54 * side, 0.52, 0.16],
            [0.88 * side, 0.08, 0.28],
            [0.92 * side, -0.44, 0.24],
            [0.82 * side, -0.94, 0.18],
          ],
          0.19,
          0.1
        );
      });
    } else if (bangs === "hime_straight") {
      for (let i = -2; i <= 2; i++) {
        addStrand(
          hairRoot,
          [
            [i * 0.13, 0.72, 0.28],
            [i * 0.16, 0.45, 0.71],
            [i * 0.165, 0.16, 0.84],
            [i * 0.165, -0.05, 0.83],
          ],
          0.165,
          0.08
        );
      }
      [-1, 1].forEach((side) => {
        const lp = new THREE.Group();
        hairRoot.add(lp);
        swayGroups.push({ group: lp, ampZ: 0.03 * side, phase: side });
        addStrand(
          lp,
          [
            [0.48 * side, 0.58, 0.3],
            [0.78 * side, 0.16, 0.48],
            [0.77 * side, -0.35, 0.46],
            [0.74 * side, -0.72, 0.42],
          ],
          0.21,
          0.095
        );
      });
    } else if (bangs === "curtain_part") {
      [-1, 1].forEach((side) => {
        addStrand(
          hairRoot,
          [
            [0.05 * side, 0.72, 0.35],
            [0.24 * side, 0.46, 0.74],
            [0.48 * side, 0.14, 0.75],
            [0.64 * side, -0.18, 0.58],
          ],
          0.22,
          0.095
        );
        addStrand(
          hairRoot,
          [
            [0.22 * side, 0.68, 0.28],
            [0.54 * side, 0.36, 0.62],
            [0.76 * side, -0.08, 0.5],
            [0.74 * side, -0.52, 0.38],
          ],
          0.2,
          0.09
        );
      });
    } else if (bangs === "side_swept") {
      const sweepPts = [
        [[-0.32, 0.7, 0.32], [-0.08, 0.46, 0.74], [0.22, 0.15, 0.84], [0.46, -0.12, 0.73]],
        [[-0.12, 0.72, 0.32], [0.16, 0.46, 0.74], [0.42, 0.16, 0.78], [0.62, -0.15, 0.62]],
        [[-0.44, 0.66, 0.28], [-0.36, 0.36, 0.72], [-0.24, 0.04, 0.8], [-0.14, -0.15, 0.78]],
      ];
      sweepPts.forEach((pts) => addStrand(hairRoot, pts, 0.21, 0.09));
      [-1, 1].forEach((side) => {
        addStrand(
          hairRoot,
          [
            [0.52 * side, 0.52, 0.22],
            [0.82 * side, 0.1, 0.36],
            [0.78 * side, -0.45, 0.32],
          ],
          0.18,
          0.09
        );
      });
    } else if (bangs === "fluffy_messy") {
      const messy = [
        { x0: -0.3, x1: -0.42, y1: -0.06, z1: 0.78 },
        { x0: -0.14, x1: -0.06, y1: -0.14, z1: 0.85 },
        { x0: 0.05, x1: -0.08, y1: -0.09, z1: 0.87 },
        { x0: 0.18, x1: 0.28, y1: -0.13, z1: 0.83 },
        { x0: 0.34, x1: 0.45, y1: -0.05, z1: 0.76 },
      ];
      messy.forEach((m) => {
        addStrand(
          hairRoot,
          [
            [m.x0 * 0.5, 0.76, 0.24],
            [m.x0, 0.5, 0.72],
            [(m.x0 + m.x1) * 0.5, 0.2, 0.86],
            [m.x1, m.y1, m.z1],
          ],
          0.18,
          0.095
        );
      });
      [-1, 1].forEach((side) => {
        addStrand(
          hairRoot,
          [
            [0.5 * side, 0.55, 0.2],
            [0.84 * side, 0.15, 0.34],
            [0.8 * side, -0.32, 0.3],
          ],
          0.18,
          0.09
        );
      });
    } else {
      // open_forehead
      [-1, 1].forEach((side) => {
        addStrand(
          hairRoot,
          [
            [0.24 * side, 0.7, 0.35],
            [0.62 * side, 0.42, 0.62],
            [0.82 * side, -0.04, 0.45],
            [0.76 * side, -0.48, 0.34],
          ],
          0.22,
          0.095
        );
      });
    }

    // --- BACK HAIRSTYLES ---
    const back = av.hairBack || "wolf_layered";
    if (back === "wolf_layered" || back === "bob_cut" || back === "long_straight") {
      const yBottom = back === "long_straight" ? -1.85 : back === "wolf_layered" ? -1.18 : -0.68;
      const flare = back === "wolf_layered" ? 1.16 : back === "bob_cut" ? 0.94 : 1.05;
      const numLocks = 11;
      const backPivot = new THREE.Group();
      hairRoot.add(backPivot);
      swayGroups.push({ group: backPivot, ampX: 0.025, phase: 0.5 });

      for (let i = 0; i < numLocks; i++) {
        const u = i / (numLocks - 1); // 0..1 around back arc
        const ang = Math.PI * 0.18 + u * Math.PI * 0.64; // back hemisphere
        const cx = Math.cos(ang);
        const cz = -Math.sin(ang);
        addStrand(
          backPivot,
          [
            [cx * 0.52, 0.66, cz * 0.48],
            [cx * 0.9, 0.22, cz * 0.86],
            [cx * 0.95, -0.36, cz * 0.9],
            [cx * 0.92 * flare, yBottom * 0.72, cz * 0.85],
            [cx * 0.98 * flare, yBottom, cz * 0.78],
          ],
          0.28,
          0.13
        );
      }
      if (back === "wolf_layered") {
        // Extra layered upper wolf-cut flicks!
        for (let i = 0; i < 7; i++) {
          const ang = Math.PI * 0.15 + (i / 6) * Math.PI * 0.7;
          const cx = Math.cos(ang);
          const cz = -Math.sin(ang);
          addStrand(
            backPivot,
            [
              [cx * 0.5, 0.72, cz * 0.45],
              [cx * 0.96, 0.24, cz * 0.9],
              [cx * 1.08, -0.32, cz * 0.96],
              [cx * 1.18, -0.62, cz * 1.02],
            ],
            0.22,
            0.1
          );
        }
      }
    } else if (back === "twin_tails") {
      // Neat back nape hair + 2 lush articulated high twin-tails!
      for (let i = 0; i < 7; i++) {
        const ang = Math.PI * 0.22 + (i / 6) * Math.PI * 0.56;
        addStrand(
          hairRoot,
          [
            [Math.cos(ang) * 0.5, 0.58, -Math.sin(ang) * 0.48],
            [Math.cos(ang) * 0.88, 0.1, -Math.sin(ang) * 0.84],
            [Math.cos(ang) * 0.82, -0.48, -Math.sin(ang) * 0.78],
          ],
          0.24,
          0.11
        );
      }
      [-1, 1].forEach((side) => {
        const tailPivot = new THREE.Group();
        tailPivot.position.set(0.76 * side, 0.42, -0.18);
        hairRoot.add(tailPivot);
        swayGroups.push({ group: tailPivot, ampZ: 0.065 * side, phase: side * 1.3 });

        const tie = new THREE.Mesh(
          new THREE.TorusGeometry(0.13, 0.042, 12, 20),
          makeFabricMat(av.accentColor || "#F43F5E")
        );
        tie.rotation.y = Math.PI * 0.4 * side;
        tailPivot.add(tie);

        [
          [0, 0, 0],
          [0.08 * side, 0.04, 0.08],
          [-0.04 * side, -0.03, -0.09],
        ].forEach((off, idx) => {
          addStrand(
            tailPivot,
            [
              [off[0], off[1], off[2]],
              [0.32 * side + off[0], -0.12, off[2] * 1.2],
              [0.46 * side + off[0], -0.68, 0.08 + idx * 0.05],
              [0.38 * side + off[0], -1.32, 0.14 - idx * 0.06],
              [0.46 * side, -1.75, 0.05],
            ],
            0.24 - idx * 0.03,
            0.13
          );
        });
      });
    } else if (back === "high_ponytail") {
      for (let i = 0; i < 7; i++) {
        const ang = Math.PI * 0.2 + (i / 6) * Math.PI * 0.6;
        addStrand(
          hairRoot,
          [
            [Math.cos(ang) * 0.5, 0.55, -Math.sin(ang) * 0.48],
            [Math.cos(ang) * 0.86, 0.08, -Math.sin(ang) * 0.82],
            [Math.cos(ang) * 0.78, -0.45, -Math.sin(ang) * 0.76],
          ],
          0.23,
          0.11
        );
      }
      const pony = new THREE.Group();
      pony.position.set(0, 0.56, -0.68);
      hairRoot.add(pony);
      swayGroups.push({ group: pony, ampX: 0.07, phase: 0.8 });

      const tie = new THREE.Mesh(
        new THREE.TorusGeometry(0.15, 0.048, 12, 20),
        makeFabricMat(av.accentColor || "#F43F5E")
      );
      tie.rotation.x = 0.6;
      pony.add(tie);

      [-0.12, 0, 0.12].forEach((ox) => {
        addStrand(
          pony,
          [
            [ox, 0, 0],
            [ox * 1.6, 0.14, -0.34],
            [ox * 2.1, -0.36, -0.52],
            [ox * 1.8, -1.05, -0.44],
            [ox * 2.2, -1.56, -0.32],
          ],
          0.26,
          0.13
        );
      });
    } else if (back === "space_buns") {
      for (let i = 0; i < 8; i++) {
        const ang = Math.PI * 0.18 + (i / 7) * Math.PI * 0.64;
        addStrand(
          hairRoot,
          [
            [Math.cos(ang) * 0.5, 0.58, -Math.sin(ang) * 0.48],
            [Math.cos(ang) * 0.88, 0.12, -Math.sin(ang) * 0.84],
            [Math.cos(ang) * 0.86, -0.55, -Math.sin(ang) * 0.8],
          ],
          0.24,
          0.11
        );
      }
      [-1, 1].forEach((side) => {
        const bun = new THREE.Group();
        bun.position.set(0.68 * side, 0.66, -0.1);
        hairRoot.add(bun);
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 20), baseCapMat);
        sphere.scale.set(1.05, 0.95, 1.05);
        bun.add(sphere);
        const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.075, 12, 24), baseCapMat);
        swirl.rotation.y = 0.6 * side;
        bun.add(swirl);
      });
    } else if (back === "curly_cloud") {
      const puffs = [
        [0, 0.72, -0.35, 0.42],
        [-0.55, 0.54, -0.25, 0.38],
        [0.55, 0.54, -0.25, 0.38],
        [-0.78, 0.16, -0.15, 0.36],
        [0.78, 0.16, -0.15, 0.36],
        [-0.64, -0.24, -0.36, 0.35],
        [0.64, -0.24, -0.36, 0.35],
        [0, 0.25, -0.68, 0.46],
        [0, -0.22, -0.66, 0.42],
        [-0.36, -0.35, -0.56, 0.34],
        [0.36, -0.35, -0.56, 0.34],
      ];
      puffs.forEach(([px, py, pz, pr]) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(pr, 20, 16), baseCapMat);
        m.position.set(px, py, pz);
        hairRoot.add(m);
      });
    } else {
      // boy_anime: layered dynamic short spikes & tapered nape locks
      for (let i = 0; i < 9; i++) {
        const ang = Math.PI * 0.12 + (i / 8) * Math.PI * 0.76;
        const cx = Math.cos(ang);
        const cz = -Math.sin(ang);
        addStrand(
          hairRoot,
          [
            [cx * 0.48, 0.68, cz * 0.45],
            [cx * 0.92, 0.28, cz * 0.88],
            [cx * 0.96, -0.18, cz * 0.9],
            [cx * 0.88, -0.48, cz * 0.82],
          ],
          0.25,
          0.11
        );
      }
      // Crown flicks
      [
        [[0, 0.78, -0.1], [-0.22, 0.94, -0.26], [-0.42, 0.86, -0.42]],
        [[0.08, 0.78, -0.05], [0.28, 0.95, -0.2], [0.48, 0.84, -0.34]],
      ].forEach((pts) => addStrand(hairRoot, pts, 0.17, 0.08));
    }

    // --- 3D HAIR CLIPS (Exact dual_doll clips from f_02.jpg + RPG variants!) ---
    const clipStyle = av.hairClips || "none";
    if (clipStyle === "dual_doll") {
      const clipGroup = new THREE.Group();
      clipGroup.position.set(0.46, 0.42, 0.66);
      clipGroup.rotation.set(-0.28, 0.48, -0.52);

      // Top dark glossy bar clip
      const topBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.085, 0.036),
        new THREE.MeshPhysicalMaterial({ color: 0x2a1815, roughness: 0.18, clearcoat: 0.9 })
      );
      topBar.position.set(0, 0.075, 0);
      clipGroup.add(topBar);

      // Bottom crisp white hollow rectangular frame clip!
      const whiteMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.22, clearcoat: 0.8 });
      const bTop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.026, 0.038), whiteMat);
      bTop.position.set(0, -0.02, 0);
      const bBot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.026, 0.038), whiteMat);
      bBot.position.set(0, -0.1, 0);
      const bL = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.105, 0.038), whiteMat);
      bL.position.set(-0.135, -0.06, 0);
      const bR = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.105, 0.038), whiteMat);
      bR.position.set(0.135, -0.06, 0);
      clipGroup.add(bTop, bBot, bL, bR);
      hairRoot.add(clipGroup);
    } else if (clipStyle === "cross_pins") {
      const crossGroup = new THREE.Group();
      crossGroup.position.set(0.48, 0.36, 0.66);
      crossGroup.rotation.set(-0.22, 0.5, -0.3);
      const pinMat = new THREE.MeshStandardMaterial({ color: av.accentColor || "#F43F5E", roughness: 0.3, metalness: 0.35 });
      [0.06, -0.07].forEach((yo, idx) => {
        const g = new THREE.Group();
        g.position.y = yo;
        const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.18, 4, 8), pinMat);
        a.rotation.z = 0.72 + idx * 0.1;
        const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.18, 4, 8), pinMat);
        b.rotation.z = -0.72 + idx * 0.1;
        g.add(a, b);
        crossGroup.add(g);
      });
      hairRoot.add(crossGroup);
    } else if (clipStyle === "star_pins") {
      const sg = new THREE.Group();
      sg.position.set(0.48, 0.38, 0.68);
      sg.rotation.set(-0.22, 0.48, -0.35);
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.25, metalness: 0.75 });
      const s1 = new THREE.Mesh(S.createStarGeo(0.095, 0.045, 0.025), goldMat);
      const s2 = new THREE.Mesh(S.createStarGeo(0.065, 0.032, 0.022), makeClayMat("#F472B6"));
      s2.position.set(0.11, -0.1, 0.01);
      sg.add(s1, s2);
      hairRoot.add(sg);
    } else if (clipStyle === "pearl_pins") {
      const pg = new THREE.Group();
      pg.position.set(0.46, 0.38, 0.67);
      pg.rotation.set(-0.25, 0.46, -0.45);
      const pearlMat = new THREE.MeshPhysicalMaterial({ color: 0xfff8f6, roughness: 0.15, clearcoat: 1.0 });
      for (let k = 0; k < 4; k++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.034 - k * 0.003, 14, 12), pearlMat);
        p.position.set(-0.1 + k * 0.068, 0.03, 0);
        pg.add(p);
      }
      hairRoot.add(pg);
    }

    return { hairRoot, swayGroups };
  }

  // ==========================================================================
  // ALL 14 PARTNER ACCESSORIES IN GENUINE DETAILED 3D
  // ==========================================================================
  function attachAccessories3D(accSet, anchors, av) {
    const animated = {
      tail: null,
      halo: null,
      wingsL: null,
      wingsR: null,
      sprout: null,
      earsGroup: null,
    };

    // 1. cat_ears (Ушки - Free)
    if (accSet.has("cat_ears")) {
      const eg = new THREE.Group();
      const outerMat = makeClayMat(av.hairColor || "#3B2620");
      const innerMat = makeClayMat("#FDA4AF");
      [-1, 1].forEach((side) => {
        const ear = new THREE.Group();
        ear.position.set(0.52 * side, 0.76, 0.08);
        ear.rotation.z = -0.38 * side;
        ear.rotation.x = 0.12;
        const coneOut = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.44, 18), outerMat);
        coneOut.scale.set(1, 1, 0.58);
        const coneIn = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 16), innerMat);
        coneIn.scale.set(1, 1, 0.4);
        coneIn.position.set(0, -0.03, 0.065);
        ear.add(coneOut, coneIn);
        eg.add(ear);
      });
      anchors.head.add(eg);
      animated.earsGroup = eg;
    }

    // 2. glasses_cool (Очки - Free)
    if (accSet.has("glasses_cool")) {
      const gg = new THREE.Group();
      gg.position.set(0, -0.06, 0.84);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e2229, roughness: 0.25, metalness: 0.65 });
      const lensMat = new THREE.MeshPhysicalMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.36,
        roughness: 0.06,
        metalness: 0.1,
        clearcoat: 1.0,
      });
      [-1, 1].forEach((side) => {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.022, 12, 28), frameMat);
        rim.scale.set(1.16, 0.92, 1);
        rim.position.x = 0.31 * side;
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.014, 24), lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.scale.set(1.15, 1, 0.91);
        lens.position.x = 0.31 * side;
        const temple = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.58, 4, 8), frameMat);
        temple.rotation.x = Math.PI / 2;
        temple.position.set(0.55 * side, 0.03, -0.3);
        gg.add(rim, lens, temple);
      });
      const bridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.14, 4, 8), frameMat);
      bridge.rotation.z = Math.PI / 2;
      bridge.position.set(0, 0.03, 0.01);
      gg.add(bridge);
      anchors.head.add(gg);
    }

    // 3. cozy_scarf (Шарф - Free)
    if (accSet.has("cozy_scarf")) {
      const sg = new THREE.Group();
      const scarfMat = makeFabricMat("#E11D48", "knit");
      const loop1 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.12, 16, 28), scarfMat);
      loop1.rotation.x = Math.PI / 2 + 0.12;
      loop1.scale.set(1.08, 0.95, 1.05);
      const loop2 = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.095, 14, 26), scarfMat);
      loop2.rotation.x = Math.PI / 2 - 0.08;
      loop2.position.y = 0.09;
      const tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.58, 0.065), scarfMat);
      tail1.position.set(0.16, -0.28, 0.29);
      tail1.rotation.set(-0.18, 0.1, 0.12);
      const tail2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.06), scarfMat);
      tail2.position.set(0.02, -0.22, 0.32);
      tail2.rotation.set(-0.22, -0.05, -0.08);
      sg.add(loop1, loop2, tail1, tail2);
      sg.position.set(0, 0.54, 0.02);
      anchors.torso.add(sg);
    }

    // 4. head_bow (Бантик 3D - Free, styled right after f_02.jpg top-left puffy ribbon bow!)
    if (accSet.has("head_bow")) {
      const bg = new THREE.Group();
      bg.position.set(-0.46, 0.78, 0.22);
      bg.rotation.set(0.14, 0.22, 0.42);
      const bowMat = makeFabricMat("#FB7185", "weave");
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 14), bowMat);
      knot.scale.set(0.95, 0.9, 0.75);
      bg.add(knot);
      [-1, 1].forEach((side) => {
        const loop = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.068, 14, 24), bowMat);
        loop.scale.set(1.2, 0.85, 0.65);
        loop.position.set(0.21 * side, 0.04, -0.01);
        loop.rotation.z = -0.18 * side;
        loop.rotation.y = -0.25 * side;
        const ribbon = new THREE.Mesh(
          S.createTaperedStrandGeo(
            [
              [0.05 * side, -0.04, 0],
              [0.16 * side, -0.24, 0.05],
              [0.24 * side, -0.45, 0.08],
            ],
            0.095,
            0.03,
            "#FB7185",
            "#F43F5E"
          ),
          makeHairStrandMat()
        );
        bg.add(loop, ribbon);
      });
      anchors.head.add(bg);
    }

    // 5. cheek_plaster (Пластырь на щёчку - 80)
    if (accSet.has("cheek_plaster")) {
      const pg = new THREE.Group();
      pg.position.set(-0.52, -0.25, 0.67);
      pg.rotation.set(0.12, -0.58, -0.26);
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.095, 0.022), makeClayMat("#FFE4E6"));
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.082, 0.028), makeClayMat("#FFF1F2"));
      const miniH = new THREE.Mesh(S.createHeartGeo(0.028, 0.012), makeClayMat("#F43F5E"));
      miniH.position.z = 0.015;
      pg.add(band, pad, miniH);
      anchors.head.add(pg);
    }

    // 6. sprout_leaf (Росточек - 80)
    if (accSet.has("sprout_leaf")) {
      const sp = new THREE.Group();
      sp.position.set(0.04, 0.82, 0.08);
      const greenMat = makeClayMat("#4ADE80", { roughness: 0.42 });
      const stemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.03, 0.18, 0.04),
        new THREE.Vector3(0, 0.34, 0.02),
      ]);
      const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 12, 0.022, 8, false), greenMat);
      sp.add(stem);
      [-1, 1].forEach((side) => {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), greenMat);
        leaf.scale.set(1.35, 0.32, 0.72);
        leaf.position.set(0.12 * side, 0.35, 0.02);
        leaf.rotation.z = 0.36 * side;
        sp.add(leaf);
      });
      anchors.head.add(sp);
      animated.sprout = sp;
    }

    // 7. cat_tail (Хвостик - 80)
    if (accSet.has("cat_tail")) {
      const tg = new THREE.Group();
      tg.position.set(0, 0.04, -0.22);
      const tailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.12, -0.14, -0.28),
        new THREE.Vector3(0.32, 0.08, -0.48),
        new THREE.Vector3(0.42, 0.44, -0.44),
        new THREE.Vector3(0.28, 0.62, -0.34),
      ]);
      const tailMesh = new THREE.Mesh(
        new THREE.TubeGeometry(tailCurve, 24, 0.068, 12, false),
        makeClayMat(av.hairColor || "#3B2620")
      );
      const tipSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.078, 14, 12),
        makeClayMat(av.hairTipColor && av.hairTipColor !== "same" ? av.hairTipColor : "#FFF1F2")
      );
      tipSphere.position.set(0.28, 0.62, -0.34);
      tg.add(tailMesh, tipSphere);
      anchors.hips.add(tg);
      animated.tail = tg;
    }

    // 8. bunny_ears (Ушки зайки - 80)
    if (accSet.has("bunny_ears")) {
      const bg = new THREE.Group();
      const whiteFur = makeClayMat("#FFF5F7");
      const pinkIn = makeClayMat("#F9A8D4");
      // Left upright bunny ear
      const earL = new THREE.Group();
      earL.position.set(-0.34, 0.82, 0.04);
      earL.rotation.z = 0.14;
      const eLOut = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.56, 8, 16), whiteFur);
      eLOut.scale.set(1, 1, 0.52);
      eLOut.position.y = 0.28;
      const eLIn = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 6, 12), pinkIn);
      eLIn.scale.set(1, 1, 0.35);
      eLIn.position.set(0, 0.26, 0.052);
      earL.add(eLOut, eLIn);

      // Right adorably lop/bent bunny ear!
      const earR = new THREE.Group();
      earR.position.set(0.34, 0.82, 0.04);
      earR.rotation.z = -0.22;
      const baseR = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.3, 8, 14), whiteFur);
      baseR.scale.set(1, 1, 0.52);
      baseR.position.y = 0.16;
      const tipR = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.32, 8, 14), whiteFur);
      tipR.scale.set(1, 1, 0.52);
      tipR.position.set(0.18, 0.28, 0.08);
      tipR.rotation.z = -1.25;
      tipR.rotation.x = 0.35;
      earR.add(baseR, tipR);

      bg.add(earL, earR);
      anchors.head.add(bg);
    }

    // 9. headphones (Наушники - 100)
    if (accSet.has("headphones")) {
      const hg = new THREE.Group();
      const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.25, clearcoat: 0.8 });
      const padMat = makeClayMat("#F472B6");
      const glowMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.55 });

      const band = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.055, 14, 36, Math.PI * 1.04), bodyMat);
      band.rotation.z = -0.02 * Math.PI;
      band.position.set(0, -0.04, 0);
      hg.add(band);

      [-1, 1].forEach((side) => {
        const cup = new THREE.Group();
        cup.position.set(0.91 * side, -0.08, 0.02);
        const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.068, 12, 24), padMat);
        cushion.rotation.y = Math.PI / 2;
        const shell = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), bodyMat);
        shell.rotation.z = (-Math.PI / 2) * side;
        shell.position.x = 0.03 * side;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.018, 10, 22), glowMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = 0.12 * side;
        cup.add(cushion, shell, ring);
        hg.add(cup);
      });
      anchors.head.add(hg);
    }

    // 10. devil_horns (Рожки - 100)
    if (accSet.has("devil_horns")) {
      const dg = new THREE.Group();
      const hornMat = new THREE.MeshPhysicalMaterial({ color: 0x991b1b, roughness: 0.22, clearcoat: 0.85 });
      [-1, 1].forEach((side) => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.42 * side, 0.68, 0.28),
          new THREE.Vector3(0.58 * side, 0.88, 0.32),
          new THREE.Vector3(0.52 * side, 1.12, 0.24),
          new THREE.Vector3(0.38 * side, 1.24, 0.18),
        ]);
        const pts = curve.getPoints(16);
        const horn = new THREE.Mesh(
          S.createTaperedStrandGeo(pts, 0.12, 0.12, "#7F1D1D", "#EF4444"),
          hornMat
        );
        dg.add(horn);
      });
      anchors.head.add(dg);
    }

    // 11. angel_halo (Нимб - 120)
    if (accSet.has("angel_halo")) {
      const haloMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.75,
        roughness: 0.18,
        metalness: 0.6,
      });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.046, 16, 40), haloMat);
      halo.rotation.x = Math.PI / 2 + 0.14;
      halo.position.set(0, 1.16, 0.02);
      anchors.head.add(halo);
      animated.halo = halo;
    }

    // 12. royal_crown (Корона - 120)
    if (accSet.has("royal_crown")) {
      const cg = new THREE.Group();
      cg.position.set(0, 0.86, 0.08);
      cg.rotation.x = -0.1;
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.22, metalness: 0.82 });
      const rubyMat = new THREE.MeshPhysicalMaterial({ color: 0xe11d48, roughness: 0.08, clearcoat: 1.0 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.16, 24, 1, true), goldMat);
      base.material.side = THREE.DoubleSide;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.028, 10, 26), goldMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = -0.08;
      cg.add(base, rim);

      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.2, 8), goldMat);
        spike.position.set(Math.cos(a) * 0.32, 0.15, Math.sin(a) * 0.32);
        const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), k % 2 === 0 ? rubyMat : goldMat);
        pearl.position.set(Math.cos(a) * 0.33, 0.25, Math.sin(a) * 0.33);
        const gem = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), rubyMat);
        gem.position.set(Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32);
        cg.add(spike, pearl, gem);
      }
      anchors.head.add(cg);
    }

    // 13. plush_bear (3D Мишка - 120, tucked cozily by the waist/arm!)
    if (accSet.has("plush_bear")) {
      const bear = new THREE.Group();
      bear.position.set(-0.34, 0.14, 0.28);
      bear.rotation.set(-0.1, 0.38, 0.18);
      const furMat = makeFabricMat("#C68B59", "knit");
      const snoutMat = makeClayMat("#FDE68A");
      const darkMat = makeClayMat("#1E1B18", { roughness: 0.2 });

      const bHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 16), furMat);
      bHead.position.y = 0.18;
      const bBody = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 16), furMat);
      bBody.scale.set(0.95, 1.12, 0.88);
      const snout = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 12), snoutMat);
      snout.scale.set(1.1, 0.85, 0.7);
      snout.position.set(0, 0.16, 0.13);
      const bNose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), darkMat);
      bNose.position.set(0, 0.18, 0.17);
      bear.add(bHead, bBody, snout, bNose);

      [-1, 1].forEach((s) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), furMat);
        ear.position.set(0.12 * s, 0.3, 0);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), darkMat);
        eye.position.set(0.055 * s, 0.21, 0.135);
        const paw = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.08, 6, 10), furMat);
        paw.position.set(0.13 * s, 0.04, 0.06);
        paw.rotation.z = -0.4 * s;
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.07, 6, 10), furMat);
        leg.position.set(0.08 * s, -0.13, 0.07);
        leg.rotation.x = 0.8;
        bear.add(ear, eye, paw, leg);
      });
      const miniBow = new THREE.Mesh(S.createHeartGeo(0.045, 0.02), makeClayMat("#F43F5E"));
      miniBow.position.set(0, 0.09, 0.13);
      bear.add(miniBow);
      anchors.hips.add(bear);
    }

    // 14. fairy_wings (Крылышки - 120)
    if (accSet.has("fairy_wings")) {
      const wingMat = new THREE.MeshPhysicalMaterial({
        color: 0xfbcfe8,
        emissive: 0xc084fc,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.62,
        roughness: 0.1,
        metalness: 0.1,
        clearcoat: 1.0,
        side: THREE.DoubleSide,
      });
      const upGeo = S.createFairyWingGeo(true);
      const lowGeo = S.createFairyWingGeo(false);

      const wL = new THREE.Group();
      wL.position.set(-0.08, 0.34, -0.2);
      wL.scale.x = -1;
      wL.rotation.y = 0.42;
      wL.add(new THREE.Mesh(upGeo, wingMat), new THREE.Mesh(lowGeo, wingMat));

      const wR = new THREE.Group();
      wR.position.set(0.08, 0.34, -0.2);
      wR.rotation.y = -0.42;
      wR.add(new THREE.Mesh(upGeo, wingMat), new THREE.Mesh(lowGeo, wingMat));

      anchors.torso.add(wL, wR);
      animated.wingsL = wL;
      animated.wingsR = wR;
    }

    return animated;
  }

  // ==========================================================================
  // MAIN 3D CHARACTER BUILDER
  // ==========================================================================
  window.buildChibi3DCharacter = function (avatarRaw, options = {}) {
    const av = window.normalizeAvatar(avatarRaw || {});
    const isGirl = av.gender === "girl";
    const bodyMeta =
      window.CHIBI_CONFIG.bodyTypes.find((b) => b.id === av.bodyType) ||
      window.CHIBI_CONFIG.bodyTypes[0];

    const care = options.care || { hungerStage: 4, cleanStage: 4, energyStage: 4, isSleeping: false };
    const mood = options.mood || "happy";
    const accSet = new Set(options.accessories || []);
    const isSleeping = Boolean(care.isSleeping);
    const isHungry = (care.hungerStage || 4) <= 2;
    const isDirty = (care.cleanStage || 4) <= 2;
    const isTired = (care.energyStage || 4) <= 2;

    const skinMat = makeClayMat(av.skinColor);
    const skinDarkMat = makeClayMat(S.shadeHex(av.skinColor, -24));
    const hairStrandMat = makeHairStrandMat();
    const hairCapMat = makeClayMat(av.hairColor);
    const topMat = makeFabricMat(av.topColor, av.topStyle === "sweater_knit" ? "knit" : "weave");
    const accentMat = makeFabricMat(av.accentColor || "#523831", "weave");
    const bottomMat = makeFabricMat(av.bottomColor, "weave");
    const shoeMat = makeClayMat(av.shoeColor, { roughness: 0.38, clearcoat: 0.45 });
    const soleMat = makeClayMat(S.shadeHex(av.shoeColor, -22), { roughness: 0.65 });

    const root = new THREE.Group();
    const hitMeshes = [];

    // Proportions layout (feet touch y = 0 cleanly!)
    const legLen = 1.08 * bodyMeta.legScale;
    const torsoH = 0.68 * bodyMeta.torsoScale;
    const hipY = legLen + 0.24;

    const hipsGroup = new THREE.Group();
    hipsGroup.position.y = hipY;
    root.add(hipsGroup);

    // --- LEGS, BOTTOMS & FOOTWEAR ---
    const legGroups = [];
    const hipSpread = 0.185;
    [-1, 1].forEach((side) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(hipSpread * side, 0, 0);
      hipsGroup.add(legPivot);
      legGroups.push(legPivot);

      const bStyle = av.bottomStyle;
      const isFlared = bStyle === "skirt_flared_pants" || bStyle === "flared_jeans";
      const isWide = bStyle === "cargo_wide" || bStyle === "pajama_bottom";
      const isBareLeg = bStyle === "pleated_skirt" || bStyle === "shorts_highsocks";

      if (isFlared) {
        // Sculpted flared bell-bottom pants widening toward the platform shoe (exact f_02.jpg silhouette!)
        const pts = [
          new THREE.Vector2(0.135, 0),
          new THREE.Vector2(0.13, -legLen * 0.36),
          new THREE.Vector2(0.18, -legLen * 0.68),
          new THREE.Vector2(0.265, -legLen * 0.96),
          new THREE.Vector2(0.23, -legLen * 0.98),
        ];
        // LatheGeometry uses +Y; map properly
        const lathePts = pts.map((p) => new THREE.Vector2(p.x, p.y));
        const pantGeo = new THREE.LatheGeometry(lathePts, 22);
        const pant = new THREE.Mesh(pantGeo, bottomMat);
        legPivot.add(pant);

        // Signature metallic side seam studs/rivets running down outer leg (just like f_02.jpg!)
        const studMat = new THREE.MeshStandardMaterial({ color: 0xd6c7be, roughness: 0.28, metalness: 0.78 });
        for (let st = 1; st <= 9; st++) {
          const frac = st / 10;
          const rAt = frac < 0.36 ? 0.134 : 0.134 + ((frac - 0.36) / 0.64) * 0.132;
          const stud = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), studMat);
          stud.position.set(rAt * side, -legLen * frac, 0.02);
          legPivot.add(stud);
        }
      } else if (isWide) {
        const cargo = new THREE.Mesh(
          new THREE.CylinderGeometry(0.155, 0.185, legLen * 0.96, 20),
          bottomMat
        );
        cargo.position.y = -legLen * 0.48;
        legPivot.add(cargo);
        if (bStyle === "cargo_wide") {
          const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.15), bottomMat);
          pocket.position.set(0.16 * side, -legLen * 0.45, 0.01);
          legPivot.add(pocket);
        }
      } else if (bStyle === "classic_trousers") {
        const tr = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.118, legLen * 0.95, 20),
          bottomMat
        );
        tr.position.y = -legLen * 0.48;
        legPivot.add(tr);
      } else if (isBareLeg) {
        // Sculpted doll leg + high sock!
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.1, legLen * 0.54, 18), skinMat);
        thigh.position.y = -legLen * 0.27;
        const sockMat = makeFabricMat("#F8FAFC", "knit");
        const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.095, legLen * 0.48, 18), sockMat);
        sock.position.y = -legLen * 0.74;
        legPivot.add(thigh, sock);
        if (bStyle === "shorts_highsocks") {
          const shortLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.152, legLen * 0.32, 18), bottomMat);
          shortLeg.position.y = -legLen * 0.15;
          legPivot.add(shortLeg);
        }
      }

      // --- 3D FOOTWEAR ---
      const shoeGroup = new THREE.Group();
      shoeGroup.position.set(0, -legLen, 0.05);
      legPivot.add(shoeGroup);

      const sStyle = av.shoeStyle || "chunky_platforms";
      if (sStyle === "chunky_platforms") {
        // Oversized chunky lug-sole platform sandals/boots (exact f_02.jpg chunky silhouette!)
        const platform = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.15, 22), soleMat);
        platform.scale.set(0.95, 1, 1.38);
        platform.position.set(0, -0.15, 0.03);
        shoeGroup.add(platform);

        // Lug treads around bottom edge
        for (let lg = 0; lg < 10; lg++) {
          const a = (lg / 10) * Math.PI * 2;
          const lug = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.065), soleMat);
          lug.position.set(Math.cos(a) * 0.2, -0.2, 0.03 + Math.sin(a) * 0.28);
          shoeGroup.add(lug);
        }
        // Soft foot/sock upper + double buckled straps
        const footIn = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), makeClayMat("#F5EBE6"));
        footIn.scale.set(0.95, 0.72, 1.35);
        footIn.position.set(0, -0.05, 0.04);
        shoeGroup.add(footIn);

        const buckleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });
        [-0.02, 0.1].forEach((sz) => {
          const strap = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.028, 10, 20, Math.PI), shoeMat);
          strap.scale.set(1.02, 0.78, 1);
          strap.position.set(0, -0.05, sz);
          const buck = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.02), buckleMat);
          buck.position.set(0.12 * side, -0.01, sz + 0.02);
          shoeGroup.add(strap, buck);
        });
      } else if (sStyle === "high_sneakers" || sStyle === "combat_boots") {
        const isBoot = sStyle === "combat_boots";
        const sole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.17, 0.19, 0.09, 20),
          isBoot ? soleMat : makeClayMat("#F8FAFC")
        );
        sole.scale.set(0.92, 1, 1.36);
        sole.position.set(0, -0.18, 0.03);
        const upper = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 14), shoeMat);
        upper.scale.set(0.9, 0.78, 1.34);
        upper.position.set(0, -0.1, 0.04);
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.135, 0.22, 18), shoeMat);
        cuff.position.set(0, 0.02, -0.03);
        const laceMat = makeClayMat(isBoot ? "#1E2229" : "#FFFFFF");
        for (let lc = 0; lc < 3; lc++) {
          const bar = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.1, 4, 8), laceMat);
          bar.rotation.z = Math.PI / 2;
          bar.position.set(0, -0.04 + lc * 0.045, 0.11 - lc * 0.015);
          shoeGroup.add(bar);
        }
        shoeGroup.add(sole, upper, cuff);
      } else if (sStyle === "mary_janes" || sStyle === "loafers") {
        const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.175, 0.08, 20), soleMat);
        sole.scale.set(0.9, 1, 1.32);
        sole.position.set(0, -0.18, 0.03);
        const shoeBody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), shoeMat);
        shoeBody.scale.set(0.88, 0.68, 1.3);
        shoeBody.position.set(0, -0.12, 0.03);
        const strap = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.02, 8, 18, Math.PI), shoeMat);
        strap.position.set(0, -0.09, -0.01);
        shoeGroup.add(sole, shoeBody, strap);
      } else {
        // paw_slippers
        const fuzzy = makeFabricMat("#FBCFE8", "knit");
        const base = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 14), fuzzy);
        base.scale.set(0.98, 0.68, 1.35);
        base.position.set(0, -0.13, 0.04);
        shoeGroup.add(base);
        [-0.07, 0, 0.07].forEach((tx, idx) => {
          const toe = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), makeClayMat("#F472B6"));
          toe.position.set(tx, -0.09, 0.22 - Math.abs(idx - 1) * 0.03);
          shoeGroup.add(toe);
        });
      }
    });

    // Skirt / Pelvis Base
    const hasMiniSkirt = av.bottomStyle === "skirt_flared_pants" || av.bottomStyle === "pleated_skirt";
    if (hasMiniSkirt) {
      // Sculpted pleated flared mini-skirt (exact silhouette of f_02.jpg!)
      const skirtMat = av.bottomStyle === "skirt_flared_pants" ? bottomMat : bottomMat;
      const skirtPts = [
        new THREE.Vector2(0.24, 0.08),
        new THREE.Vector2(0.32, -0.08),
        new THREE.Vector2(0.42, -0.28),
        new THREE.Vector2(0.39, -0.29),
      ];
      const skirt = new THREE.Mesh(new THREE.LatheGeometry(skirtPts, 28), skirtMat);
      hipsGroup.add(skirt);

      // Soft pleat ridges around skirt
      for (let pl = 0; pl < 12; pl++) {
        const a = (pl / 12) * Math.PI * 2;
        const pleat = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.24, 5, 10), skirtMat);
        pleat.position.set(Math.cos(a) * 0.33, -0.11, Math.sin(a) * 0.33);
        pleat.rotation.z = Math.cos(a) * 0.34;
        pleat.rotation.x = -Math.sin(a) * 0.34;
        hipsGroup.add(pleat);
      }

      if (av.bottomStyle === "skirt_flared_pants") {
        // Cute 3D Cat-Face Belt Pouch Charm hanging at the front waist (direct detail from f_02.jpg!)
        const pouch = new THREE.Group();
        pouch.position.set(-0.04, -0.05, 0.33);
        pouch.rotation.z = 0.1;
        const pMat = makeClayMat("#EFE3D8");
        const pBody = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 14), pMat);
        pBody.scale.set(1.08, 0.92, 0.62);
        pouch.add(pBody);
        [-1, 1].forEach((s) => {
          const cEar = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.065, 10), pMat);
          cEar.position.set(0.052 * s, 0.072, 0);
          cEar.rotation.z = -0.3 * s;
          pouch.add(cEar);
        });
        const faceDot = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), makeClayMat("#D4A39B"));
        faceDot.scale.set(1.1, 0.75, 0.3);
        faceDot.position.set(0, -0.01, 0.046);
        pouch.add(faceDot);
        hipsGroup.add(pouch);
      }
    } else {
      const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), bottomMat);
      pelvis.scale.set(1.12, 0.75, 0.88);
      pelvis.position.y = -0.04;
      hipsGroup.add(pelvis);
    }

    // --- TORSO & 8 RPG 3D TOPS ---
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.05;
    hipsGroup.add(torsoGroup);

    const tStyle = av.topStyle || "corset_offshoulder";
    // Base upper chest/shoulders skin (visible for off-shoulder corset & collarbones!)
    const chestSkin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, torsoH * 0.42, 20),
      skinMat
    );
    chestSkin.scale.set(1.08, 1, 0.78);
    chestSkin.position.y = torsoH * 0.76;
    torsoGroup.add(chestSkin);
    hitMeshes.push(chestSkin);

    if (tStyle === "corset_offshoulder") {
      // Sculpted hourglass laced corset + folded off-shoulder collar (exact match to f_02.jpg!)
      const corsetPts = [
        new THREE.Vector2(0.265, 0),
        new THREE.Vector2(0.215, torsoH * 0.34),
        new THREE.Vector2(0.245, torsoH * 0.68),
        new THREE.Vector2(0.23, torsoH * 0.72),
      ];
      const corset = new THREE.Mesh(new THREE.LatheGeometry(corsetPts, 24), topMat);
      corset.scale.set(1.06, 1, 0.82);
      torsoGroup.add(corset);
      hitMeshes.push(corset);

      // Folded off-shoulder drape band wrapping around upper chest & arms
      const foldBand = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.35, 0.21, 26, 1, true), topMat);
      foldBand.material.side = THREE.DoubleSide;
      foldBand.scale.set(1.16, 1, 0.78);
      foldBand.position.y = torsoH * 0.64;
      torsoGroup.add(foldBand);

      // Front crisscross corset lacing cords!
      for (let cr = 0; cr < 5; cr++) {
        const cy = torsoH * (0.24 + cr * 0.1);
        const cord1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.11, 4, 8), accentMat);
        cord1.position.set(0, cy, 0.205);
        cord1.rotation.z = 0.42 + Math.PI / 2;
        const cord2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.11, 4, 8), accentMat);
        cord2.position.set(0, cy, 0.208);
        cord2.rotation.z = -0.42 + Math.PI / 2;
        torsoGroup.add(cord1, cord2);
      }
    } else if (tStyle === "hoodie_oversize" || tStyle === "sweater_knit") {
      const puffPts = [
        new THREE.Vector2(0.32, -0.04),
        new THREE.Vector2(0.36, torsoH * 0.35),
        new THREE.Vector2(0.33, torsoH * 0.76),
        new THREE.Vector2(0.23, torsoH * 0.88),
      ];
      const body = new THREE.Mesh(new THREE.LatheGeometry(puffPts, 24), topMat);
      body.scale.set(1.08, 1, 0.86);
      torsoGroup.add(body);
      hitMeshes.push(body);

      if (tStyle === "hoodie_oversize") {
        const hood = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.085, 14, 24), topMat);
        hood.rotation.x = Math.PI / 2 + 0.24;
        hood.position.set(0, torsoH * 0.86, -0.05);
        const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.08), topMat);
        pocket.position.set(0, torsoH * 0.22, 0.27);
        torsoGroup.add(hood, pocket);
        [-0.07, 0.07].forEach((sx) => {
          const str = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.22, 4, 8), accentMat);
          str.position.set(sx, torsoH * 0.64, 0.28);
          torsoGroup.add(str);
        });
      } else {
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.065, 12, 24), topMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = torsoH * 0.86;
        torsoGroup.add(collar);
      }
    } else if (tStyle === "bomber_jacket") {
      const tee = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.24, torsoH * 0.86, 20), accentMat);
      tee.scale.set(1.05, 1, 0.8);
      tee.position.y = torsoH * 0.43;
      const jacket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.31, 0.32, torsoH * 0.86, 22, 1, false, 0.45, Math.PI * 2 - 0.9),
        topMat
      );
      jacket.rotation.y = Math.PI / 2;
      jacket.scale.set(0.86, 1, 1.08);
      jacket.position.y = torsoH * 0.43;
      torsoGroup.add(tee, jacket);
      hitMeshes.push(tee);
    } else if (tStyle === "seifuku_blouse") {
      const blouse = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.25, torsoH * 0.86, 22), topMat);
      blouse.scale.set(1.06, 1, 0.82);
      blouse.position.y = torsoH * 0.43;
      const sailorCollar = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.44), accentMat);
      sailorCollar.position.set(0, torsoH * 0.8, -0.02);
      const bow = new THREE.Mesh(S.createHeartGeo(0.085, 0.03), makeFabricMat("#E11D48"));
      bow.position.set(0, torsoH * 0.62, 0.23);
      torsoGroup.add(blouse, sailorCollar, bow);
      hitMeshes.push(blouse);
    } else if (tStyle === "shirt_vest") {
      const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.25, torsoH * 0.88, 20), accentMat);
      shirt.scale.set(1.04, 1, 0.8);
      shirt.position.y = torsoH * 0.44;
      const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.265, torsoH * 0.78, 20), topMat);
      vest.scale.set(1.06, 1, 0.82);
      vest.position.y = torsoH * 0.4;
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, 0.04), makeFabricMat("#9F1239"));
      tie.position.set(0, torsoH * 0.56, 0.22);
      torsoGroup.add(shirt, vest, tie);
      hitMeshes.push(vest);
    } else {
      // crop_puff or pajama_top
      const topBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, torsoH * 0.84, 22), topMat);
      topBody.scale.set(1.06, 1, 0.82);
      topBody.position.y = torsoH * 0.43;
      torsoGroup.add(topBody);
      hitMeshes.push(topBody);
      if (tStyle === "pajama_top") {
        for (let b = 0; b < 3; b++) {
          const btn = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), accentMat);
          btn.position.set(0, torsoH * (0.25 + b * 0.2), 0.22);
          torsoGroup.add(btn);
        }
      }
    }

    // --- NECK & RPG NECKWEAR ---
    const neckGroup = new THREE.Group();
    neckGroup.position.y = torsoH * 0.88;
    torsoGroup.add(neckGroup);

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.135, 0.24, 18), skinMat);
    neckMesh.position.y = 0.08;
    neckGroup.add(neckMesh);

    if (av.neckwear === "beaded_choker") {
      // Exact dark beaded choker from f_02.jpg!
      const chMat = makeClayMat("#2D1D1A", { roughness: 0.3 });
      const chBand = new THREE.Mesh(new THREE.TorusGeometry(0.132, 0.015, 10, 24), chMat);
      chBand.rotation.x = Math.PI / 2 + 0.08;
      chBand.position.y = 0.03;
      neckGroup.add(chBand);
      for (let bd = -2; bd <= 2; bd++) {
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.019, 8, 8), chMat);
        bead.position.set(bd * 0.042, 0.005, Math.sqrt(Math.max(0.001, 0.135 * 0.135 - Math.pow(bd * 0.042, 2))));
        neckGroup.add(bead);
      }
    } else if (av.neckwear === "heart_pendant" || av.neckwear === "silver_chain") {
      const silMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 8, 24), silMat);
      chain.rotation.x = Math.PI / 2 + 0.18;
      chain.position.y = 0.02;
      neckGroup.add(chain);
      if (av.neckwear === "heart_pendant") {
        const hPend = new THREE.Mesh(S.createHeartGeo(0.042, 0.016), makeClayMat("#F43F5E"));
        hPend.position.set(0, -0.025, 0.145);
        neckGroup.add(hPend);
      }
    }

    // --- ARMS, SLEEVES, CUFFS & 5-FINGER SCULPTED HANDS ---
    const armGroups = {};
    [-1, 1].forEach((side) => {
      const key = side === -1 ? "L" : "R";
      const shoulder = new THREE.Group();
      shoulder.position.set(0.31 * side, torsoH * 0.78, 0);
      torsoGroup.add(shoulder);

      const isLongSleeve = ["hoodie_oversize", "sweater_knit", "bomber_jacket", "pajama_top", "seifuku_blouse"].includes(tStyle);
      const upperArmMat = isLongSleeve ? topMat : skinMat;
      const upperLen = 0.34;
      const upperArm = new THREE.Mesh(
        new THREE.CapsuleGeometry(isLongSleeve ? 0.095 : 0.072, upperLen, 8, 14),
        upperArmMat
      );
      upperArm.position.y = -upperLen * 0.52;
      shoulder.add(upperArm);

      if (tStyle === "crop_puff") {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 14), topMat);
        puff.position.y = -0.1;
        shoulder.add(puff);
      }

      const elbow = new THREE.Group();
      elbow.position.y = -upperLen - 0.02;
      shoulder.add(elbow);

      const foreLen = 0.32;
      const foreArm = new THREE.Mesh(
        new THREE.CapsuleGeometry(isLongSleeve ? 0.088 : 0.066, foreLen, 8, 14),
        upperArmMat
      );
      foreArm.position.y = -foreLen * 0.52;
      elbow.add(foreArm);

      if (tStyle === "corset_offshoulder") {
        // Flared ruffled doll wrist cuffs with ribbon bow (exact detail from f_02.jpg!)
        const cuffPts = [
          new THREE.Vector2(0.072, 0.06),
          new THREE.Vector2(0.135, -0.06),
        ];
        const cuff = new THREE.Mesh(new THREE.LatheGeometry(cuffPts, 16), topMat);
        cuff.material.side = THREE.DoubleSide;
        cuff.position.y = -foreLen;
        const ribbonBand = new THREE.Mesh(new THREE.TorusGeometry(0.076, 0.016, 8, 18), accentMat);
        ribbonBand.rotation.x = Math.PI / 2;
        ribbonBand.position.y = -foreLen + 0.04;
        elbow.add(cuff, ribbonBand);
      }

      const hand = createSculptedHand(skinMat, side);
      hand.position.y = -foreLen - 0.05;
      elbow.add(hand);

      armGroups[key] = { shoulder, elbow, hand };
    });

    // --- HEAD, EARS, SCULPTED EYES, EYELIDS, LASHES, BROWS, MOUTH & HAIR ---
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.88 * bodyMeta.headScale;
    headGroup.scale.setScalar(bodyMeta.headScale);
    neckGroup.add(headGroup);

    const headMesh = new THREE.Mesh(S.createSculptedHeadGeo(av.faceShape), skinMat);
    headGroup.add(headMesh);
    hitMeshes.push(headMesh);

    // Sculpted 3D Ears (normal, elf, mini)
    [-1, 1].forEach((side) => {
      const earG = new THREE.Group();
      earG.position.set(0.87 * side, -0.09, -0.02);
      if (av.earType === "elf") {
        const elfCone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 14), skinMat);
        elfCone.scale.set(0.65, 1, 0.85);
        elfCone.rotation.z = -1.12 * side;
        elfCone.rotation.y = -0.25 * side;
        elfCone.position.x = 0.08 * side;
        earG.add(elfCone);
      } else {
        const sc = av.earType === "mini" ? 0.76 : 1.0;
        const earOuter = new THREE.Mesh(new THREE.SphereGeometry(0.14 * sc, 16, 14), skinMat);
        earOuter.scale.set(0.55, 1.15, 0.82);
        const earInner = new THREE.Mesh(new THREE.SphereGeometry(0.08 * sc, 12, 10), skinDarkMat);
        earInner.scale.set(0.4, 0.9, 0.6);
        earInner.position.set(0.03 * side, 0, 0.04);
        earG.add(earOuter, earInner);
      }
      headGroup.add(earG);
    });

    // Cheek Blush Decals (dynamically intensify during Finger Petting!)
    const blushTex = S.getBlushTexture(av.blushStyle);
    const blushMat = new THREE.MeshBasicMaterial({
      map: blushTex,
      transparent: true,
      opacity: av.blushStyle === "none" ? 0.0 : 0.92,
      depthWrite: false,
    });
    [-1, 1].forEach((side) => {
      const bPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.22), blushMat);
      bPlane.position.set(0.42 * side, -0.22, 0.75);
      bPlane.rotation.y = 0.42 * side;
      bPlane.rotation.x = 0.08;
      headGroup.add(bPlane);
    });

    // RPG Face Details (Blue/Pink Nose Plaster like f_02.jpg, Freckles, Mole, Star Sticker)
    if (av.faceDetail === "nose_plaster_blue" || av.faceDetail === "nose_plaster_pink") {
      const pCol = av.faceDetail === "nose_plaster_blue" ? "#5B7AA6" : "#F48FB1";
      const nCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.11, -0.155, 0.815),
        new THREE.Vector3(0, -0.115, 0.858),
        new THREE.Vector3(0.11, -0.155, 0.815),
      ]);
      const nPlaster = new THREE.Mesh(
        new THREE.TubeGeometry(nCurve, 14, 0.034, 8, false),
        makeClayMat(pCol, { roughness: 0.68 })
      );
      nPlaster.scale.set(1, 0.85, 0.62);
      nPlaster.position.z = 0.32;
      headGroup.add(nPlaster);
    } else if (av.faceDetail === "freckles") {
      const frMat = makeClayMat(S.shadeHex(av.skinColor, -52));
      [
        [-0.36, -0.2, 0.77],
        [-0.44, -0.23, 0.74],
        [-0.3, -0.24, 0.79],
        [0.36, -0.2, 0.77],
        [0.44, -0.23, 0.74],
        [0.3, -0.24, 0.79],
        [-0.06, -0.16, 0.84],
        [0.06, -0.16, 0.84],
      ].forEach(([fx, fy, fz]) => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), frMat);
        dot.position.set(fx, fy, fz);
        headGroup.add(dot);
      });
    } else if (av.faceDetail === "beauty_mole") {
      const mole = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), makeClayMat("#231815"));
      mole.position.set(-0.38, -0.23, 0.76);
      headGroup.add(mole);
    } else if (av.faceDetail === "star_sticker") {
      const st = new THREE.Mesh(S.createStarGeo(0.055, 0.026, 0.012), makeClayMat("#FBBF24"));
      st.position.set(0.46, -0.23, 0.73);
      st.rotation.y = 0.45;
      headGroup.add(st);
    }

    // --- 3D GLOSSY EYES, ARTICULATED EYELIDS, EYELASHES, BLISS ARCS & BROWS ---
    const eyeParts = [];
    const lashDarkMat = makeClayMat("#1B1214", { roughness: 0.35 });
    const lidMat = makeClayMat(S.shadeHex(av.skinColor, -16));

    [-1, 1].forEach((side) => {
      const eyeColor = side === 1 && av.heterochromia ? av.eyeColorRight : av.eyeColor;
      const irisTex = S.getIrisTexture(eyeColor, av.eyeStyle);

      const eyeAnchor = new THREE.Group();
      eyeAnchor.position.set(0.31 * side, -0.06, 0.715);
      eyeAnchor.rotation.y = 0.24 * side;
      headGroup.add(eyeAnchor);

      // Open Eye Container
      const openGroup = new THREE.Group();
      eyeAnchor.add(openGroup);

      // Curved 3D Eyeball Dome with glossy physical cornea!
      const eyeMat = new THREE.MeshPhysicalMaterial({
        map: irisTex,
        roughness: 0.06,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
      });
      const eyeDisc = new THREE.Mesh(new THREE.CircleGeometry(0.185, 32), eyeMat);
      eyeDisc.scale.set(1.06, 0.96, 1);
      eyeDisc.position.z = 0.035;
      // Transparent physical 3D glass cornea dome over the iris for genuine 3D specular reflections!
      const corneaDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.44),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.16,
          roughness: 0.02,
          clearcoat: 1.0,
          depthWrite: false,
        })
      );
      corneaDome.rotation.x = Math.PI / 2;
      corneaDome.scale.set(1.06, 0.38, 0.96);
      corneaDome.position.z = 0.02;
      openGroup.add(eyeDisc, corneaDome);

      // Articulated 3D Upper Eyelid Shell (half-closed for doll_lidded, animates for blink/sleep/tired!)
      const lidPivot = new THREE.Group();
      openGroup.add(lidPivot);
      const lidCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.202, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
        lidMat
      );
      lidCap.scale.set(1.08, 0.98, 0.45);
      lidCap.position.z = 0.028;
      lidPivot.add(lidCap);

      // Base upper eyelid resting angle depending on RPG eyeStyle!
      let baseLidRotX = -0.72; // wide open
      if (av.eyeStyle === "doll_lidded") baseLidRotX = -0.18; // signature half-lidded doll look from f_02.jpg!
      else if (av.eyeStyle === "gentle_droop") baseLidRotX = -0.32;
      else if (av.eyeStyle === "cat_slit") baseLidRotX = -0.28;
      lidPivot.rotation.x = baseLidRotX;
      if (av.eyeStyle === "cat_slit") lidPivot.rotation.z = 0.14 * side;
      if (av.eyeStyle === "gentle_droop") lidPivot.rotation.z = -0.14 * side;

      // Upper 3D Eyelash Wing Curve attached to eyelid rim!
      const lashCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.18 * side, -0.01, 0.08),
        new THREE.Vector3(0, 0.02, 0.1),
        new THREE.Vector3(0.19 * side, 0.0, 0.075),
        new THREE.Vector3(0.24 * side, av.lashStyle === "lush_wings" ? 0.045 : 0.015, 0.055),
      ]);
      const lashR = av.lashStyle === "minimal" ? 0.015 : 0.024;
      const upperLash = new THREE.Mesh(new THREE.TubeGeometry(lashCurve, 16, lashR, 8, false), lashDarkMat);
      lidPivot.add(upperLash);

      // Lower smoky doll liner rim (signature dark lower rim from f_02.jpg!)
      if (av.lashStyle === "smoky_doll") {
        const lowCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.14 * side, -0.14, 0.055),
          new THREE.Vector3(0, -0.17, 0.068),
          new THREE.Vector3(0.17 * side, -0.13, 0.055),
        ]);
        const lowRim = new THREE.Mesh(
          new THREE.TubeGeometry(lowCurve, 14, 0.019, 8, false),
          makeClayMat("#2C191D", { roughness: 0.55 })
        );
        openGroup.add(lowRim);
      }

      // Blissful Petting / Happy Curved Eye Arc (^  ^) — shown when petted with finger!
      const blissCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.16, -0.06, 0.065),
        new THREE.Vector3(0, 0.07, 0.085),
        new THREE.Vector3(0.16, -0.06, 0.065),
      ]);
      const blissMesh = new THREE.Mesh(new THREE.TubeGeometry(blissCurve, 16, 0.025, 8, false), lashDarkMat);
      blissMesh.visible = false;
      eyeAnchor.add(blissMesh);

      // Peaceful Sleeping Closed Eye Arc (◡  ◡)
      const sleepCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.16, 0.01, 0.065),
        new THREE.Vector3(0, -0.09, 0.085),
        new THREE.Vector3(0.16, 0.01, 0.065),
      ]);
      const sleepMesh = new THREE.Mesh(new THREE.TubeGeometry(sleepCurve, 16, 0.023, 8, false), lashDarkMat);
      sleepMesh.visible = false;
      eyeAnchor.add(sleepMesh);

      // Sculpted 3D Eyebrow
      const browPivot = new THREE.Group();
      browPivot.position.set(0, 0.24, 0.065);
      eyeAnchor.add(browPivot);
      const bYMid = av.browStyle === "straight" ? 0.0 : av.browStyle === "sassy" ? 0.035 : 0.025;
      const browCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.14 * side, av.browStyle === "worried_cute" ? 0.03 : -0.01, 0),
        new THREE.Vector3(0, bYMid, 0.015),
        new THREE.Vector3(0.15 * side, av.browStyle === "worried_cute" ? -0.035 : -0.015, 0),
      ]);
      const browThick = av.browStyle === "bold" ? 0.026 : 0.017;
      const browMesh = new THREE.Mesh(
        new THREE.TubeGeometry(browCurve, 12, browThick, 8, false),
        makeClayMat(S.shadeHex(av.hairColor, -15))
      );
      browPivot.add(browMesh);

      eyeParts.push({
        side,
        openGroup,
        lidPivot,
        baseLidRotX,
        blissMesh,
        sleepMesh,
        browPivot,
      });
    });

    // --- 3D DYNAMIC MOUTH SYSTEM ---
    const mouthAnchor = new THREE.Group();
    mouthAnchor.position.set(0, -0.35, 0.8);
    headGroup.add(mouthAnchor);

    const mouthLineMat = makeClayMat("#3D1E24", { roughness: 0.4 });
    const mouthInsideMat = makeClayMat("#B93B58", { roughness: 0.45 });

    const mouths = {};

    // 1. doll_o (Cute little dark-rimmed 3D 'o' mouth from f_02.jpg!)
    const mO = new THREE.Group();
    const oRing = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.012, 10, 20), mouthLineMat);
    oRing.scale.set(0.85, 1.15, 0.7);
    const oIn = new THREE.Mesh(new THREE.CircleGeometry(0.034, 16), mouthInsideMat);
    oIn.scale.set(0.82, 1.12, 1);
    oIn.position.z = -0.004;
    mO.add(oRing, oIn);
    mouths.doll_o = mO;

    // 2. cat_w (:3 / ω mouth from f_06.jpg & petting purr!)
    const catWCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.11, 0.02, 0),
      new THREE.Vector3(-0.055, -0.028, 0.015),
      new THREE.Vector3(0, 0.012, 0.02),
      new THREE.Vector3(0.055, -0.028, 0.015),
      new THREE.Vector3(0.11, 0.02, 0),
    ]);
    mouths.cat_w = new THREE.Mesh(new THREE.TubeGeometry(catWCurve, 20, 0.013, 8, false), mouthLineMat);

    // 3. smile & fang
    const smileCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, 0.022, 0),
      new THREE.Vector3(0, -0.028, 0.02),
      new THREE.Vector3(0.1, 0.022, 0),
    ]);
    mouths.smile = new THREE.Mesh(new THREE.TubeGeometry(smileCurve, 16, 0.013, 8, false), mouthLineMat);

    const fangG = new THREE.Group();
    fangG.add(mouths.smile.clone());
    const fangCone = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.052, 10), makeClayMat("#FFFFFF"));
    fangCone.rotation.x = Math.PI;
    fangCone.position.set(0.058, -0.015, 0.015);
    fangG.add(fangCone);
    mouths.fang = fangG;

    // 4. smirk
    const smirkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, -0.01, 0),
      new THREE.Vector3(0.01, -0.015, 0.018),
      new THREE.Vector3(0.11, 0.036, 0.005),
    ]);
    mouths.smirk = new THREE.Mesh(new THREE.TubeGeometry(smirkCurve, 14, 0.013, 8, false), mouthLineMat);

    // 5. calm
    const calmCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.065, 0, 0.005),
      new THREE.Vector3(0, -0.008, 0.015),
      new THREE.Vector3(0.065, 0, 0.005),
    ]);
    mouths.calm = new THREE.Mesh(new THREE.TubeGeometry(calmCurve, 12, 0.012, 8, false), mouthLineMat);

    // 6. frown (sad / hungry / angry / offended)
    const frownCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.095, -0.028, 0),
      new THREE.Vector3(0, 0.018, 0.018),
      new THREE.Vector3(0.095, -0.028, 0),
    ]);
    mouths.frown = new THREE.Mesh(new THREE.TubeGeometry(frownCurve, 14, 0.013, 8, false), mouthLineMat);

    // 7. open_happy (eating / tier-3 ecstatic petting!)
    const openHappy = new THREE.Group();
    const ohMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 16, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55),
      mouthInsideMat
    );
    ohMesh.scale.set(1.15, 1.0, 0.4);
    const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), makeClayMat("#FB7185"));
    tongue.scale.set(1.1, 0.65, 0.35);
    tongue.position.set(0, -0.042, 0.012);
    openHappy.add(ohMesh, tongue);
    mouths.open_happy = openHappy;

    Object.values(mouths).forEach((m) => {
      m.visible = false;
      mouthAnchor.add(m);
    });

    // --- 3D LAYERED HAIR & CLIPS ---
    const { hairRoot, swayGroups } = buildHair3D(av, hairStrandMat, hairCapMat);
    headGroup.add(hairRoot);
    hairRoot.traverse((c) => {
      if (c.isMesh) hitMeshes.push(c);
    });

    // --- 3D CARE STAGE VISUALS (Automatic Dirty Smudges & Cozy Sleeping Blanket/Pillow!) ---
    if (isDirty) {
      const mudMat = makeClayMat("#785A46", { transparent: true, opacity: 0.52 });
      [
        [-0.46, -0.32, 0.68, 0.065],
        [0.42, 0.14, 0.72, 0.052],
        [0.14, 0.32, 0.25, 0.07, torsoGroup],
      ].forEach(([mx, my, mz, mr, parentObj]) => {
        const smudge = new THREE.Mesh(new THREE.CircleGeometry(mr, 12), mudMat);
        smudge.position.set(mx, my, mz);
        if (!parentObj) smudge.rotation.y = mx < 0 ? -0.45 : 0.45;
        (parentObj || headGroup).add(smudge);
      });
    }

    let sleepProps = null;
    if (isSleeping && options.showSleepBed !== false) {
      sleepProps = new THREE.Group();
      // Plush 3D pillow behind head/shoulders + puffy quilted 3D pastel blanket!
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.65, 0.28), makeFabricMat("#FFF1F2", "weave"));
      pillow.position.set(0, hipY + torsoH * 0.9, -0.34);
      pillow.rotation.x = -0.15;
      const blanket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.56, 0.68, hipY + torsoH * 0.52, 24, 1, false, -Math.PI * 0.55, Math.PI * 1.1),
        makeFabricMat("#C4B5FD", "knit")
      );
      blanket.position.set(0, (hipY + torsoH * 0.5) * 0.48, 0.04);
      const blanketFold = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.085, 12, 24, Math.PI * 1.05),
        makeFabricMat("#F5F3FF", "weave")
      );
      blanketFold.rotation.x = Math.PI / 2;
      blanketFold.rotation.z = -Math.PI * 0.02;
      blanketFold.position.set(0, hipY + torsoH * 0.46, 0.04);
      sleepProps.add(pillow, blanket, blanketFold);
      root.add(sleepProps);
    }

    // --- ATTACH ALL 14 3D PARTNER ACCESSORIES ---
    const animAcc = attachAccessories3D(
      accSet,
      { head: headGroup, torso: torsoGroup, hips: hipsGroup },
      av
    );

    // --- DEFAULT DOLL CONTRAPPOSTO / RPG STANCE ---
    const poseMode = options.poseMode || "solo";
    function applyBasePose() {
      if (poseMode === "solo") {
        if (isGirl) {
          // Stylish S-curve doll stance with hands near hips (direct homage to f_02.jpg!)
          hipsGroup.rotation.z = 0.045;
          torsoGroup.rotation.z = -0.04;
          legGroups[0].rotation.z = -0.05;
          legGroups[0].rotation.x = 0.04;
          legGroups[1].rotation.z = 0.07;
          legGroups[1].rotation.x = -0.06;

          armGroups.L.shoulder.rotation.set(0.08, 0.15, 0.46);
          armGroups.L.elbow.rotation.set(-0.35, 0, -0.78);
          armGroups.L.hand.rotation.set(0.2, 0, 0.35);

          armGroups.R.shoulder.rotation.set(0.08, -0.15, -0.46);
          armGroups.R.elbow.rotation.set(-0.35, 0, 0.78);
          armGroups.R.hand.rotation.set(0.2, 0, -0.35);
        } else {
          // Confident relaxed boy doll stance
          hipsGroup.rotation.z = -0.02;
          torsoGroup.rotation.z = 0.02;
          legGroups[0].rotation.z = -0.055;
          legGroups[1].rotation.z = 0.055;

          armGroups.L.shoulder.rotation.set(0.05, 0.08, 0.24);
          armGroups.L.elbow.rotation.set(-0.24, 0, -0.14);
          armGroups.R.shoulder.rotation.set(0.05, -0.08, -0.24);
          armGroups.R.elbow.rotation.set(-0.24, 0, 0.14);
        }
      }
    }
    applyBasePose();

    enableShadows(root);

    // ========================================================================
    // 60 FPS REAL-TIME ANIMATION & FINGER-PETTING EMOTION CONTROLLER
    // ========================================================================
    let blinkTimer = 1.5 + Math.random() * 2.5;
    let blinkProgress = 0;

    function update(time, dt, state = {}) {
      const petLevel = state.petLevel || 0; // 0..1 intensity of finger petting
      const petTargetX = state.petDirX || 0; // -1..1 finger horizontal offset
      const petTargetY = state.petDirY || 0; // -1..1 finger vertical offset
      const careAnim = state.careAnim || null; // 'feed', 'shower'
      const careAnimT = state.careAnimT || 0;

      // 1. Automatic Natural Eye Blinking
      blinkTimer -= dt;
      if (blinkTimer <= 0) {
        blinkProgress = 1.0;
        blinkTimer = 2.6 + Math.random() * 3.0;
      }
      if (blinkProgress > 0) {
        blinkProgress = Math.max(0, blinkProgress - dt * 7.5);
      }
      const blinkAmt = Math.sin(blinkProgress * Math.PI);

      // 2. Breathing, Idle Doll Sway & Petting Happy Wiggle!
      const breathe = Math.sin(time * (isSleeping ? 1.5 : 2.3));
      const wiggle = petLevel > 0.05 ? Math.sin(time * 11.5) * petLevel : 0;

      hipsGroup.position.y =
        hipY +
        breathe * (isSleeping ? 0.012 : 0.02) +
        (petLevel > 0.35 ? Math.abs(Math.sin(time * 7.5)) * 0.038 * petLevel : 0);

      if (poseMode === "solo") {
        const tiredSlouch = isTired && !isSleeping ? 0.14 : 0;
        torsoGroup.rotation.x = tiredSlouch + breathe * 0.02 - petLevel * 0.05;
        torsoGroup.rotation.y = Math.sin(time * 1.1) * 0.04 + wiggle * 0.08;

        // Expressive doll head look + physical nuzzle INTO the user's petting finger!
        const idleHeadY = isSleeping ? 0.05 : Math.sin(time * 0.85) * 0.14;
        const idleHeadZ = isSleeping ? 0.12 : Math.sin(time * 0.65 + 1.1) * 0.055;
        const idleHeadX = isSleeping ? 0.16 : isHungry || isTired ? 0.12 : Math.sin(time * 1.2) * 0.035;

        const targetHeadY = idleHeadY * (1 - petLevel) + petTargetX * 0.34 * petLevel;
        const targetHeadZ = idleHeadZ * (1 - petLevel) - petTargetX * 0.24 * petLevel + wiggle * 0.09;
        const targetHeadX = idleHeadX * (1 - petLevel) - petTargetY * 0.22 * petLevel + (careAnim === "feed" ? -0.14 * Math.sin(careAnimT * Math.PI) : 0);

        headGroup.rotation.y += (targetHeadY - headGroup.rotation.y) * Math.min(1, dt * 10);
        headGroup.rotation.z += (targetHeadZ - headGroup.rotation.z) * Math.min(1, dt * 10);
        headGroup.rotation.x += (targetHeadX - headGroup.rotation.x) * Math.min(1, dt * 10);
      }

      // 3. Blush Intensifies Warmly When Petted!
      const baseBlushOp = av.blushStyle === "none" ? 0.0 : 0.9;
      blushMat.opacity = Math.min(1.0, baseBlushOp + petLevel * 0.65);

      // 4. Eyes, Eyelids & Brows Facial Expression Solver
      const showBlissEyes =
        !isSleeping && (petLevel > 0.24 || careAnim === "shower" || state.forceBlissEyes);

      eyeParts.forEach((ep) => {
        if (isSleeping) {
          ep.openGroup.visible = false;
          ep.blissMesh.visible = false;
          ep.sleepMesh.visible = true;
          ep.browPivot.rotation.z = 0;
        } else if (showBlissEyes) {
          ep.openGroup.visible = false;
          ep.sleepMesh.visible = false;
          ep.blissMesh.visible = true;
          ep.browPivot.rotation.z = -0.12 * ep.side;
          ep.browPivot.position.y = 0.25 + petLevel * 0.02;
        } else {
          ep.openGroup.visible = true;
          ep.blissMesh.visible = false;
          ep.sleepMesh.visible = false;

          let lidTarget = ep.baseLidRotX;
          if (isTired) lidTarget = Math.max(lidTarget, -0.05);
          if (petLevel > 0.03) lidTarget = Math.max(lidTarget, -0.12); // soft affectionate squint on initial touch
          // Blink closes lid down to +0.28
          ep.lidPivot.rotation.x = lidTarget + (0.28 - lidTarget) * blinkAmt;

          // Mood brow tilt
          if (mood === "angry") ep.browPivot.rotation.z = 0.28 * ep.side;
          else if (mood === "sad" || mood === "missing" || isHungry) ep.browPivot.rotation.z = -0.24 * ep.side;
          else if (mood === "offended") ep.browPivot.rotation.z = 0.18 * ep.side;
          else ep.browPivot.rotation.z = 0;
        }
      });

      // 5. Dynamic 3D Mouth Expression Solver
      let activeMouth = av.mouthStyle || "doll_o";
      if (careAnim === "feed") {
        activeMouth = Math.sin(time * 18) > 0 ? "open_happy" : "cat_w";
      } else if (isSleeping) {
        activeMouth = "doll_o";
      } else if (petLevel > 0.68) {
        activeMouth = "open_happy"; // Tier 3 ecstatic love!
      } else if (petLevel > 0.22) {
        activeMouth = "cat_w"; // Tier 2 purring :3 bliss!
      } else if (petLevel > 0.04) {
        activeMouth = "doll_o"; // Tier 1 cute surprised 'o' touch!
      } else if (mood === "sad" || mood === "angry" || mood === "offended" || isHungry || isDirty) {
        activeMouth = "frown";
      } else if (mood === "missing") {
        activeMouth = "doll_o";
      }

      Object.keys(mouths).forEach((k) => {
        mouths[k].visible = k === activeMouth;
      });

      // 6. Secondary Physics: Hair Locks & 3D Accessories!
      swayGroups.forEach((sw) => {
        if (sw.ampZ) {
          sw.group.rotation.z = Math.sin(time * 2.1 + sw.phase) * sw.ampZ + wiggle * 0.06;
        }
        if (sw.ampX) {
          sw.group.rotation.x = Math.sin(time * 1.9 + sw.phase) * sw.ampX;
        }
      });

      if (animAcc.tail) {
        const tailSpeed = petLevel > 0.1 ? 8.5 : 2.6;
        animAcc.tail.rotation.y = Math.sin(time * tailSpeed) * (0.24 + petLevel * 0.22);
      }
      if (animAcc.halo) {
        animAcc.halo.rotation.z = time * 0.9;
        animAcc.halo.position.y = 1.16 + Math.sin(time * 2.8) * 0.035;
      }
      if (animAcc.wingsL && animAcc.wingsR) {
        const flapSpeed = petLevel > 0.1 ? 14 : 4.2;
        const flap = Math.sin(time * flapSpeed) * (0.18 + petLevel * 0.16);
        animAcc.wingsL.rotation.y = 0.42 + flap;
        animAcc.wingsR.rotation.y = -0.42 - flap;
      }
      if (animAcc.sprout) {
        animAcc.sprout.rotation.z = Math.sin(time * 3.4) * 0.12 + wiggle * 0.15;
      }
      if (animAcc.earsGroup && petLevel > 0.15) {
        animAcc.earsGroup.rotation.z = Math.sin(time * 13) * 0.06 * petLevel;
      }
    }

    return {
      group: root,
      rig: {
        hipsGroup,
        torsoGroup,
        neckGroup,
        headGroup,
        armGroups,
        legGroups,
        hipY,
        torsoH,
        headScale: bodyMeta.headScale,
      },
      hitMeshes,
      update,
    };
  };
})();
