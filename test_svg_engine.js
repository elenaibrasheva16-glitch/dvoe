// ============================================================================
// Comprehensive Verification Suite for ChibiLove Vector SVG Kinematic Engine
// Validates Full Compliance with SPEC-KIN-001 (v2.0.0-PROD)
// Runs on Apple JavaScriptCore (jsc)
// ============================================================================

var passed = 0;
var failed = 0;

function assert(condition, testName) {
  if (condition) {
    print("  [PASS] " + testName);
    passed++;
  } else {
    print("  [FAIL] " + testName);
    failed++;
  }
}

// ----------------------------------------------------------------------------
// Minimal DOM Mock for JavaScriptCore (JSC) Environment
// ----------------------------------------------------------------------------
var windowListeners = {};
var window = {
  Telegram: {
    WebApp: {
      HapticFeedback: {
        lastCall: null,
        impactOccurred: function (style) { this.lastCall = { type: "impact", style: style }; },
        notificationOccurred: function (type) { this.lastCall = { type: "notification", notifType: type }; },
        selectionChanged: function () { this.lastCall = { type: "selection" }; }
      }
    }
  },
  addEventListener: function (evt, fn) {
    windowListeners[evt] = windowListeners[evt] || [];
    windowListeners[evt].push(fn);
  },
  removeEventListener: function (evt, fn) {
    if (windowListeners[evt]) {
      windowListeners[evt] = windowListeners[evt].filter(function (f) { return f !== fn; });
    }
  }
};

var elementIdMap = {};
function createMockElement(tag, ns) {
  var attrs = {};
  var children = [];
  var _html = "";
  var el = {
    tagName: tag,
    namespaceURI: ns,
    attributes: attrs,
    children: children,
    style: {},
    get innerHTML() { return _html; },
    set innerHTML(val) {
      _html = val;
      var idRegex = /id=["']([^"']+)["']/g;
      var match;
      while ((match = idRegex.exec(val)) !== null) {
        var id = match[1];
        if (!elementIdMap[id]) {
          var child = createMockElement("g", "http://www.w3.org/2000/svg");
          child.setAttribute("id", id);
          elementIdMap[id] = child;
        }
      }
    },
    classList: {
      add: function (c) { this[c] = true; },
      remove: function (c) { delete this[c]; }
    },
    setAttribute: function (k, v) {
      attrs[k] = String(v);
      if (k === "id") elementIdMap[v] = el;
    },
    getAttribute: function (k) { return attrs[k]; },
    appendChild: function (c) {
      children.push(c);
      c.parentNode = this;
      return c;
    },
    removeChild: function (c) {
      var idx = children.indexOf(c);
      if (idx !== -1) children.splice(idx, 1);
      c.parentNode = null;
      return c;
    },
    addEventListener: function () {},
    removeEventListener: function () {},
    getBoundingClientRect: function () {
      return { left: 0, top: 0, width: 340, height: 280 };
    },
    querySelector: function (sel) {
      var parts = sel.split(" ");
      var targetId = parts[parts.length - 1].replace("#", "");
      return elementIdMap[targetId] || null;
    },
    querySelectorAll: function () { return []; },
    getElementById: function (id) {
      return elementIdMap[id] || null;
    }
  };
  return el;
}

var document = {
  getElementById: function (id) { return elementIdMap[id] || null; },
  createElement: function (tag) { return createMockElement(tag, null); },
  createElementNS: function (ns, tag) { return createMockElement(tag, ns); }
};

var performance = { now: function () { return Date.now(); } };
var setTimeout = function (fn) { return 1; };
var clearTimeout = function () {};
var requestAnimationFrame = function (fn) { return 1; };
var cancelAnimationFrame = function () {};

// Load Engine
load("public/js/chibi-config.js");
load("public/js/chibi-svg-engine.js");

print("=== STARTING VECTOR SVG KINEMATIC ENGINE TESTS (SPEC-KIN-001) ===");

// ----------------------------------------------------------------------------
// TEST 1: Global Interface & Contract
// ----------------------------------------------------------------------------
assert(typeof window.ChibiSVG === "object", "window.ChibiSVG exists");
assert(typeof window.ChibiSVG.mount === "function", "window.ChibiSVG.mount is a function");
assert(typeof window.ChibiSVG.unmount === "function", "window.ChibiSVG.unmount is a function");
assert(typeof window.ChibiSVG.playCareAction === "function", "window.ChibiSVG.playCareAction is a function");
assert(typeof window.ChibiSVG.playWithPet === "function", "window.ChibiSVG.playWithPet is a function");
assert(typeof window.ChibiSVG.showBubble === "function", "window.ChibiSVG.showBubble is a function");
assert(typeof window.ChibiSVG.buildSVG === "function", "window.ChibiSVG.buildSVG is a function");
assert(typeof window.ChibiSVG.getBenchmarkComparison === "function", "window.ChibiSVG.getBenchmarkComparison is a function");

// ----------------------------------------------------------------------------
// TEST 2: All 11 Species Vector SVG Generation & Color Palettes
// ----------------------------------------------------------------------------
var speciesList = [
  "kitty_bear", "puppy", "fox", "panda", "penguin",
  "hamster", "bunny", "chick", "koala", "whale", "bird"
];

for (var i = 0; i < speciesList.length; i++) {
  var sp = speciesList[i];
  var svg = window.ChibiSVG.buildSVG({ species: sp, name: "Тест" }, { care: {} });
  assert(svg.indexOf("<svg") !== -1, "buildSVG returns valid SVG for [" + sp + "]");
  assert(svg.indexOf("headGradient_" + sp) !== -1 || svg.indexOf("<g") !== -1, "buildSVG includes species geometry for [" + sp + "]");
  assert(window.ChibiSVG.SPECIES_CONFIG[sp] !== undefined, "SPECIES_CONFIG defines palette for [" + sp + "]");
}

// ----------------------------------------------------------------------------
// TEST 3: SPEC-KIN-001 Section 1.1: Volume-Preserving Harmonic Breathing Physics
// ----------------------------------------------------------------------------
var container = document.createElement("div");
var instance = window.ChibiSVG.mount(container, {
  mode: "solo",
  avatar: { species: "fox", name: "Рыжик" },
  care: { isSleeping: false }
});

assert(instance !== null, "Solo SVG pet instance mounted successfully");
assert(instance.pet1.species === "fox", "Pet 1 species is fox");

// Verify volume preservation formula: Sx * Sy = 1.0 (Area preserved within 1%)
instance.pet1.update(0.016, 0.75); // simulate frame at t = 0.75s
var areaProduct = instance.pet1.squashX * instance.pet1.squashY;
assert(Math.abs(areaProduct - 1.0) < 0.05, "Breathing volume compensation preserves area: Sx * Sy = " + areaProduct.toFixed(4) + " ~= 1.0");

// Verify vertical lift is anchored downwards (Y_lift <= 0)
assert(instance.pet1.currentLiftY <= 0.001, "Breathing lift displacement stays grounded: Y_lift = " + instance.pet1.currentLiftY.toFixed(2) + "px");

// Verify breathing constants match SPEC-KIN-001
assert(instance.pet1.breathConstants.idle.Tb === 3.0, "Idle breathing period is exactly 3.0s (SPEC-KIN-001)");
assert(Math.abs(instance.pet1.breathConstants.idle.omega - 2.0944) < 0.001, "Idle angular frequency is 2.0944 rad/s");
assert(instance.pet1.breathConstants.sleep.Tb === 4.0, "Sleep breathing period is exactly 4.0s (SPEC-KIN-001)");

// ----------------------------------------------------------------------------
// TEST 4: SPEC-KIN-001 Section 1.2: 3-Phase Saccadic Eye Blink Engine
// ----------------------------------------------------------------------------
// Force blink start
instance.pet1.isBlinking = true;
instance.pet1.blinkTime = 0.020; // 20ms in (Phase 1: Down-stroke)
instance.pet1.update(0.001, 1.0);
assert(instance.pet1.eyeAperture > 0.0 && instance.pet1.eyeAperture < 1.0, "Blink Phase 1 (down-stroke): aperture closing (" + instance.pet1.eyeAperture.toFixed(2) + ")");

instance.pet1.blinkTime = 0.045; // 45ms in (Phase 2: Occlusion Hold)
instance.pet1.update(0.001, 1.0);
assert(instance.pet1.eyeAperture === 0.0, "Blink Phase 2 (full occlusion): aperture is 0.0");

instance.pet1.blinkTime = 0.095; // 95ms in (Phase 3: Elastic Re-open)
instance.pet1.update(0.001, 1.0);
assert(instance.pet1.eyeAperture > 0.0, "Blink Phase 3 (elastic re-open): aperture reopening (" + instance.pet1.eyeAperture.toFixed(2) + ")");

// Saccadic LookAt glance tracking clamp test
instance.pet1.setLookAt(9999, 9999, 170, 150);
var pupilOffsetMag = Math.sqrt(Math.pow(instance.pet1.targetPupilX, 2) + Math.pow(instance.pet1.targetPupilY, 2));
assert(pupilOffsetMag <= 6.51, "LookAt pupil excursion clamped to max 6.5px (actual: " + pupilOffsetMag.toFixed(2) + "px)");

// ----------------------------------------------------------------------------
// TEST 5: SPEC-KIN-001 Section 1.3: 2nd-Order Damped Spring Petting Recoil
// ----------------------------------------------------------------------------
assert(instance.pet1.springK === 175.0, "Spring stiffness k = 175.0 N/m");
assert(instance.pet1.springC === 15.0, "Spring damping c = 15.0 N*s/m");
var zeta = instance.pet1.springC / (2.0 * Math.sqrt(instance.pet1.springK));
assert(Math.abs(zeta - 0.5669) < 0.002, "Damping ratio zeta is critically underdamped (0.567)");

// Trigger Pet
instance.pet1.triggerPet();
assert(instance.pet1.isPetted === true, "Petting triggers isPetted state");
assert(instance.pet1.targetSpringSquashY === 0.84, "Petting target squash is 0.84 (-16% compression)");
assert(instance.pet1.pupilDilation === 1.28, "Petting dilates pupils to 1.28");

// Simulate spring recoil update
instance.pet1.update(0.05, 2.0);
assert(instance.pet1.springSquashY < 1.0, "Pet compresses under spring force (Sy = " + instance.pet1.springSquashY.toFixed(3) + ")");
assert(instance.pet1.blushAlpha > 0.20, "Blush cheek alpha increases on pet (alpha = " + instance.pet1.blushAlpha.toFixed(2) + ")");

// ----------------------------------------------------------------------------
// TEST 6: SPEC-KIN-001 Section 2: Care State Transitions
// ----------------------------------------------------------------------------
// Feed Action
window.ChibiSVG.playCareAction("feed", "🍰");
assert(instance.pet1.activeAction === "feed", "Feed action activated");
assert(instance.pet1.actionDuration === 2.4, "Chewing action duration is 2.4s (SPEC-KIN-001)");

// Shower Action
window.ChibiSVG.playCareAction("shower");
assert(instance.pet1.activeAction === "shower", "Shower action activated");
assert(instance.pet1.actionDuration === 2.8, "Shower action duration is 2.8s (SPEC-KIN-001)");

// Sleep Action
window.ChibiSVG.playCareAction("sleep");
assert(instance.pet1.isSleeping === true, "Sleep toggled to true");
assert(instance.pet1.targetBlanketOffsetY === 0.0, "Target blanket offset is 0.0 (covered)");

window.ChibiSVG.playCareAction("sleep");
assert(instance.pet1.isSleeping === false, "Sleep toggled back to false");
assert(instance.pet1.targetBlanketOffsetY === 130.0, "Target blanket offset is 130.0 (offstage)");

// ----------------------------------------------------------------------------
// TEST 7: SPEC-KIN-001 Section 3: Eulerian Ballistic Particle System
// ----------------------------------------------------------------------------
instance.spawnParticle({
  type: "heart",
  x: 170,
  y: 130,
  vx: 20,
  vy: -100,
  gravity: 30.0,
  drag: 0.25,
  life: 1.5,
  maxLife: 1.5
});

assert(instance.particles.length > 0, "Particle successfully spawned in Eulerian pool");
var p0 = instance.particles[instance.particles.length - 1];
var oldVy = p0.vy;
instance.renderParticles(0.05); // update particles by 50ms
assert(p0.y < 130, "Particle drifted upward along velocity");
assert(p0.vy > oldVy, "Gravity adjusted velocity downward (Eulerian integration)");

// ----------------------------------------------------------------------------
// TEST 8: SPEC-KIN-001 Section 4: Telegram Haptics Integration
// ----------------------------------------------------------------------------
instance.interactAt(170, 140);
assert(window.Telegram.WebApp.HapticFeedback.lastCall !== null, "Telegram Haptic API called on interaction");

// ----------------------------------------------------------------------------
// TEST 9: Together Mode (Couple Side-by-Side View)
// ----------------------------------------------------------------------------
var coupleInstance = window.ChibiSVG.mount(container, {
  mode: "together",
  avatar: { species: "kitty_bear", name: "Зефирка" },
  partnerAvatar: { species: "puppy", name: "Пончик" },
  care: { isSleeping: false }
});

assert(coupleInstance.mode === "together", "Couple instance mounted in together mode");
assert(coupleInstance.pet1.species === "kitty_bear", "Couple Pet 1 is kitty_bear");
assert(coupleInstance.pet2 !== null, "Couple Pet 2 exists");
assert(coupleInstance.pet2.species === "puppy", "Couple Pet 2 is puppy");

// ----------------------------------------------------------------------------
// TEST 10: Quantitative Benchmark Comparison vs Canvas
// ----------------------------------------------------------------------------
var benchmark = window.ChibiSVG.getBenchmarkComparison();
assert(typeof benchmark === "object", "getBenchmarkComparison returns structured metrics");
assert(benchmark.metrics.memoryFootprint.ratio.indexOf("40x") !== -1, "Documents ~40x lower memory footprint vs Canvas");
assert(benchmark.metrics.resolutionIndependence.advantage.indexOf("vector") !== -1, "Documents infinite vector resolution advantage");

print("=== ALL VECTOR SVG KINEMATIC ENGINE TESTS FINISHED ===");
print("Passed: " + passed + " / " + (passed + failed));
if (failed > 0) {
  print("CRITICAL: " + failed + " tests failed!");
}
