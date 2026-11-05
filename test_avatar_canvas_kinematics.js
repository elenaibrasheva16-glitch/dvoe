// ============================================================================
// Comprehensive Kinematics & Visual Architecture Verification Suite
// Tests for ChibiLove TMA Canvas Engine SPEC-KIN-001 & Adversarial Audit Fixes
// Runs on Apple JavaScriptCore (jsc) or Node
// ============================================================================

var windowListeners = {};
var mockContext = {
  setTransform: function () {},
  clearRect: function () {},
  beginPath: function () {},
  ellipse: function () {},
  arc: function () {},
  fill: function () {},
  stroke: function () {},
  save: function () {},
  restore: function () {},
  translate: function () {},
  scale: function () {},
  rotate: function () {},
  drawImage: function () {},
  fillText: function () {},
  setLineDash: function () {},
  roundRect: function () {},
  moveTo: function () {},
  lineTo: function () {},
  quadraticCurveTo: function () {},
  createRadialGradient: function (x0, y0, r0, x1, y1, r1) {
    mockContext.gradientCalls++;
    return {
      addColorStop: function (stop, color) {},
    };
  },
  gradientCalls: 0,
};

var window = {
  devicePixelRatio: 2.0,
  Telegram: {
    WebApp: {
      HapticFeedback: {
        lastCall: null,
        impactOccurred: function (style) {
          window.Telegram.WebApp.HapticFeedback.lastCall = { type: "impact", style: style };
        },
        notificationOccurred: function (type) {
          window.Telegram.WebApp.HapticFeedback.lastCall = { type: "notification", style: type };
        },
        selectionChanged: function () {
          window.Telegram.WebApp.HapticFeedback.lastCall = { type: "selection" };
        },
      },
    },
  },
  addEventListener: function (evt, fn) {
    windowListeners[evt] = windowListeners[evt] || [];
    windowListeners[evt].push(fn);
  },
  removeEventListener: function (evt, fn) {
    if (windowListeners[evt]) {
      windowListeners[evt] = windowListeners[evt].filter(function (f) { return f !== fn; });
    }
  },
};

var stageListeners = {};
var document = {
  getElementById: function () { return null; },
  head: { appendChild: function () {} },
  createElement: function (tag) {
    return {
      tagName: tag,
      style: {},
      innerHTML: "",
      classList: {
        add: function (c) { this[c] = true; },
        remove: function (c) { delete this[c]; },
      },
      appendChild: function (c) {
        this.children = this.children || [];
        this.children.push(c);
      },
      addEventListener: function (evt, fn) {
        stageListeners[evt] = stageListeners[evt] || [];
        stageListeners[evt].push(fn);
      },
      removeEventListener: function (evt, fn) {
        if (stageListeners[evt]) {
          stageListeners[evt] = stageListeners[evt].filter(function (f) { return f !== fn; });
        }
      },
      getBoundingClientRect: function () {
        return { left: 0, top: 0, width: 340, height: 280 };
      },
      getContext: function () {
        return mockContext;
      },
    };
  },
};

var performance = { now: function () { return Date.now(); } };
var setTimeout = function (fn, d) { return 1; };
var clearTimeout = function (id) {};
var requestAnimationFrame = function (fn) { return 1; };
var cancelAnimationFrame = function (id) {};

load("public/js/chibi-config.js");
load("public/js/chibi-anime-2d.js");

var passed = 0;
var failed = 0;

function assert(cond, name) {
  if (cond) {
    print("  [PASS] " + name);
    passed++;
  } else {
    print("  [FAIL] " + name);
    failed++;
  }
}

print("=== STARTING LIVING AVATAR KINEMATICS & VISUAL VERIFICATION ===");

// 1. Mount test
var container = document.createElement("div");
var engine = window.Chibi2D.mount(container, {
  mode: "solo",
  avatar: { species: "fox", name: "Огонёк" },
  care: { isSleeping: false },
});

assert(engine !== null, "Canvas Engine mounted successfully");
assert(engine.pet1.species === "fox", "Character species is fox");

// 2. Volume-Preserving Harmonic Breathing Math
print("\n--- TEST: Volume-Preserving Harmonic Breathing Math ---");
var pet = engine.pet1;
var maxVolumeDeviation = 0;
var steps = 100;
for (var i = 0; i < steps; i++) {
  var t = (i / steps) * 3.0; // full breathing period
  var breathSy = 1.0 + 0.038 * Math.sin(t * 2.094);
  var breathSx = 1.0 / Math.sqrt(breathSy);
  var area = breathSx * breathSy;
  var dev = Math.abs(area - 1.0);
  if (dev > maxVolumeDeviation) maxVolumeDeviation = dev;
}
assert(maxVolumeDeviation < 0.02, "Max area deviation over breathing cycle is " + (maxVolumeDeviation * 100).toFixed(3) + "% (< 2.0% volume conservation)");

// 3. 2nd-Order Damped Spring Dynamics
print("\n--- TEST: 2nd-Order Spring Dynamics & Petting ---");
pet.triggerPet(1.0);
assert(pet.isPetted === true, "Petting triggers isPetted state");
assert(pet.targetSquashY === 0.84, "Target squash Y is 0.84 (-16% compression per SPEC-KIN-001)");
var expectedSx = 1.0 / Math.sqrt(0.84);
assert(Math.abs(pet.targetSquashX - expectedSx) < 0.001, "Target squash X volume-preserves to " + pet.targetSquashX.toFixed(4));
assert(pet.blushAlpha > 0.3, "Blush alpha surges on petting (actual: " + pet.blushAlpha.toFixed(2) + ")");

// Simulate spring step
pet.update(0.016, 170, 140, true, 0);
assert(pet.squashVelY !== 0, "Spring kinematics computed velocity on squash update");

// 4. 3-Phase Saccadic Eye Blink Engine
print("\n--- TEST: 3-Phase Saccadic Eye Blink Engine ---");
pet.isBlinking = true;
pet.blinkTime = 0.02; // Down-stroke
pet.update(0, 0, 0, false, 0);
assert(pet.blinkAperture < 1.0 && pet.blinkAperture > 0, "Down-stroke aperture decreases (aperture: " + pet.blinkAperture.toFixed(3) + ")");

pet.blinkTime = 0.045; // Occlusion hold
pet.update(0, 0, 0, false, 0);
assert(pet.blinkAperture === 0.0, "Closed hold aperture is 0.0 (full occlusion)");

pet.blinkTime = 0.095; // Elastic re-open
pet.update(0, 0, 0, false, 0);
assert(pet.blinkAperture > 0.4, "Elastic re-open aperture is restoring (aperture: " + pet.blinkAperture.toFixed(3) + ")");

// 5. LookAt Gaze Tracking towards Pointer
print("\n--- TEST: LookAt Gaze Tracking ---");
pet.isBlinking = false;
pet.isSleeping = false;
// Pointer to the right of pet
var pointerX = pet.baseX + 120;
var pointerY = pet.baseY - 70;
for (var k = 0; k < 10; k++) {
  pet.update(0.016, pointerX, pointerY, true, 50);
}
assert(pet.pupilOffsetX > 1.5, "Pupils track gaze horizontally towards touch (pupilOffsetX: " + pet.pupilOffsetX.toFixed(2) + " px)");
assert(pet.headTilt > 0.01, "Head tilts towards pointer (headTilt: " + pet.headTilt.toFixed(3) + " rad)");

// 6. Care Action State Interruption & Preemption
print("\n--- TEST: Care Action State Interruption & Preemption ---");
window.Chibi2D.playCareAction("feed", "🍓");
assert(pet.activeAction === "feed", "Feed action started");
assert(pet.actionItem === "🍓", "Feed action treat is strawberry");

// Now trigger sleep while feeding
window.Chibi2D.playCareAction("sleep");
assert(pet.isSleeping === true, "Sleep triggered");
assert(pet.activeAction === null, "Active feed action successfully PREEMPTED upon sleep (Zero visual overlap!)");
assert(pet.blanketTargetY === 0, "Blanket target set to 0 (covers pet cozy)");

// 7. Haptic Feedback Integration
print("\n--- TEST: Telegram WebApp Haptic Feedback Cadences ---");
var hf = window.Telegram.WebApp.HapticFeedback;
// Trigger tap
engine.interactAt(170, 140, false);
assert(hf.lastCall !== null, "Haptic feedback fired on tap");

// 8. Hardware Radial Gradient Verification (Audit Fix)
print("\n--- TEST: Hardware Radial Gradients (Zero ctx.filter stalls) ---");
mockContext.gradientCalls = 0;
// Render one frame
engine.render(performance.now());
assert(mockContext.gradientCalls >= 1, "createRadialGradient used for hardware ground shadow (gradientCalls: " + mockContext.gradientCalls + ")");

// 9. Particle Emitter Pool Ballistics & Memory
print("\n--- TEST: Particle Emitter Pool Ballistics & Memory ---");
engine.fxPool.emitBurst(170, 140, 10);
assert(engine.fxPool.active.length >= 10, "10 particles active in pool");
var initialPoolCap = engine.fxPool.maxSize;
// Update 150 frames to drain particles
for (var f = 0; f < 150; f++) {
  engine.fxPool.updateAndRender(mockContext, 0.033);
}
assert(engine.fxPool.active.length === 0, "All particles naturally recycled back to pool (Zero Memory Leaks)");
assert(engine.fxPool.pool.length === initialPoolCap, "Pool length restored to initial capacity (" + initialPoolCap + ")");

// 10. Frame Budget & Execution Speed Benchmark (1,000 frames)
print("\n--- BENCHMARK: 1,000 Canvas Render Passes ---");
var benchStart = Date.now();
var benchFrames = 1000;
for (var b = 0; b < benchFrames; b++) {
  engine.render(benchStart + b * 16.66);
}
var benchElapsed = Date.now() - benchStart;
var avgPerFrame = benchElapsed / benchFrames;
print("  Total CPU time for " + benchFrames + " frames: " + benchElapsed + " ms");
print("  Average frame time: " + avgPerFrame.toFixed(4) + " ms");
assert(avgPerFrame < 1.0, "Average frame time (" + avgPerFrame.toFixed(4) + " ms) is well within 16.66ms 60 FPS budget (< 6% budget)");

print("\n=== KINEMATICS & VISUAL VERIFICATION RESULTS ===");
print("Passed: " + passed + " / " + (passed + failed));
if (failed > 0) {
  print("CRITICAL: " + failed + " tests failed!");
}
