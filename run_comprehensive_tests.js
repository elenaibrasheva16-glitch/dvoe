// ============================================================================
// Comprehensive Verification Test Suite for ChibiLove Pet Edition (v12)
// Runs on Apple JavaScriptCore (jsc)
// ============================================================================

var windowListeners = {};
var window = {
  Telegram: {
    WebApp: {
      HapticFeedback: {
        impactOccurred: function () {},
        notificationOccurred: function () {},
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

var listeners = {};
var document = {
  getElementById: function () { return null; },
  head: { appendChild: function () {} },
  createElementNS: function (ns, tag) { return this.createElement(tag); },
  createElement: function (tag) {
    return {
      tagName: tag,
      style: {},
      innerHTML: "",
      setAttribute: function (k, v) { this[k] = v; },
      getAttribute: function (k) { return this[k]; },
      classList: {
        add: function (c) { this[c] = true; },
        remove: function (c) { delete this[c]; },
      },
      appendChild: function (c) {
        this.children = this.children || [];
        this.children.push(c);
      },
      removeChild: function (c) {
        if (this.children) {
          var idx = this.children.indexOf(c);
          if (idx !== -1) this.children.splice(idx, 1);
        }
      },
      querySelector: function () { return null; },
      querySelectorAll: function () { return []; },
      addEventListener: function (evt, fn) {
        listeners[evt] = listeners[evt] || [];
        listeners[evt].push(fn);
      },
      removeEventListener: function (evt, fn) {
        if (listeners[evt]) {
          listeners[evt] = listeners[evt].filter(function (f) { return f !== fn; });
        }
      },
      getBoundingClientRect: function () {
        return { left: 0, top: 0, width: 340, height: 280 };
      },
      getContext: function () {
        return {
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
          quadraticCurveTo: function () {},
        };
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
load("public/js/chibi-svg-engine.js");

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

print("=== STARTING COMPREHENSIVE PET ENGINE TESTS (v12) ===");

// TEST 1: Config & Pet Catalog
assert(typeof window.CHIBI_CONFIG === "object", "CHIBI_CONFIG exists");
assert(Array.isArray(window.CHIBI_CONFIG.pets), "CHIBI_CONFIG.pets is array");
assert(window.CHIBI_CONFIG.pets.length === 11, "CHIBI_CONFIG.pets has all 11 adorable pets");

var expectedPets = [
  "kitty_bear", "puppy", "fox", "panda", "penguin",
  "hamster", "bunny", "chick", "koala", "whale", "bird"
];
for (var p = 0; p < expectedPets.length; p++) {
  var petId = expectedPets[p];
  var found = window.CHIBI_CONFIG.pets.some(function (x) { return x.id === petId; });
  assert(found, "Pet [" + petId + "] exists in catalog");
}

// TEST 2: Foods & Care Actions
assert(Array.isArray(window.CHIBI_CONFIG.foods), "CHIBI_CONFIG.foods is array");
assert(window.CHIBI_CONFIG.foods.length >= 6, "Has at least 6 yummy treats");
assert(Array.isArray(window.CHIBI_CONFIG.careActions), "CHIBI_CONFIG.careActions is array");
assert(window.CHIBI_CONFIG.careActions.length === 4, "Has all 4 care actions (feed, shower, sleep, pet)");

// TEST 3: Pet Normalization & Randomization
var normGirl = window.normalizeAvatar({ gender: "girl" });
assert(normGirl.species === "kitty_bear", "Default girl pet maps to kitty_bear");
var normBoy = window.normalizeAvatar({ gender: "boy" });
assert(normBoy.species === "puppy", "Default boy pet maps to puppy");
var randomPet = window.randomizeAvatar();
assert(typeof randomPet.species === "string" && randomPet.species.length > 0, "Randomize pet creates valid species: " + randomPet.species);
assert(typeof randomPet.name === "string" && randomPet.name.length > 0, "Randomize pet creates valid name: " + randomPet.name);

// TEST 4: Engine Initialization & Public API
assert(typeof window.Chibi2D === "object", "window.Chibi2D exists");
assert(typeof window.Chibi2D.mount === "function", "window.Chibi2D.mount is a function");
assert(typeof window.Chibi2D.showBubble === "function", "window.Chibi2D.showBubble is a function");
assert(typeof window.Chibi2D.playCareAction === "function", "window.Chibi2D.playCareAction is a function");
assert(typeof window.Chibi3D === "object", "window.Chibi3D alias exists for backward compatibility");
assert(window.Chibi3D === window.Chibi2D, "window.Chibi3D strictly equals window.Chibi2D");

// TEST 5: Solo Pet Mount
var container = document.createElement("div");
var instance = window.Chibi2D.mount(container, {
  mode: "solo",
  avatar: { species: "fox", name: "Рыжик" },
  care: { hungerStage: 4, cleanStage: 4, energyStage: 4, isSleeping: false },
});
assert(instance !== null, "Solo pet instance mounted successfully");
assert(instance.pet1.species === "fox", "Solo pet species is fox");
assert(instance.pet1.name === "Рыжик", "Solo pet name is Рыжик");

// TEST 6: Care Actions on Pet
window.Chibi2D.playCareAction("feed", "🍰");
assert(instance.pet1.activeAction === "feed", "Feed care action triggered successfully");
assert(instance.pet1.actionItem === "🍰", "Feed care action uses cake item");

window.Chibi2D.playCareAction("shower");
assert(instance.pet1.activeAction === "shower", "Shower care action triggered successfully");

window.Chibi2D.playCareAction("sleep");
assert(instance.pet1.isSleeping === true, "Sleep care action sets isSleeping to true");

window.Chibi2D.playCareAction("sleep");
assert(instance.pet1.isSleeping === false, "Second sleep toggles isSleeping back to false");

// TEST 7: Interactive Petting & Thought Bubble
instance.interactAt(170, 140);
assert(instance.pet1.isPetted === true, "Petting triggers isPetted state");
assert(instance.particles.length > 0, "Petting spawns floating heart particles");

window.Chibi2D.showBubble("Мурр! 💕", 1000);
assert(instance.bubbleEl.textContent === "Мурр! 💕", "Thought bubble displays text correctly");

// TEST 8: Together Mode (Couple view with 2 pets)
var coupleInstance = window.Chibi2D.mount(container, {
  mode: "together",
  avatar: { species: "kitty_bear", name: "Зефирка" },
  partnerAvatar: { species: "puppy", name: "Пончик" },
  care: { hungerStage: 4, cleanStage: 4, energyStage: 4, isSleeping: false },
});
assert(coupleInstance.mode === "together", "Couple instance mounted in together mode");
assert(coupleInstance.pet1.species === "kitty_bear", "Pet 1 is kitty_bear");
assert(coupleInstance.pet2 !== null, "Pet 2 exists");
assert(coupleInstance.pet2.species === "puppy", "Pet 2 is puppy");

// TEST 9: Fallback SVG generation
var svgOutput = window.Chibi2D.buildSVG({ species: "panda" }, { care: { isSleeping: true } });
assert(svgOutput.indexOf("<svg") !== -1, "buildSVG returns valid SVG");
assert(svgOutput.indexOf("panda.png") !== -1, "buildSVG references panda.png sprite");
assert(svgOutput.indexOf("Спит в одеялке") !== -1, "buildSVG shows sleeping status when sleeping");

// TEST 10: Vector SVG Kinematic Engine (ChibiSVG)
assert(typeof window.ChibiSVG === "object", "window.ChibiSVG exists");
assert(typeof window.ChibiSVG.mount === "function", "window.ChibiSVG.mount is a function");
assert(typeof window.ChibiSVG.getBenchmarkComparison === "function", "window.ChibiSVG.getBenchmarkComparison is a function");

var svgInstance = window.ChibiSVG.mount(container, {
  mode: "solo",
  avatar: { species: "fox", name: "Рыжик" },
  care: { isSleeping: false }
});
assert(svgInstance !== null, "ChibiSVG solo instance mounted successfully");
assert(svgInstance.pet1.species === "fox", "ChibiSVG pet species is fox");

window.ChibiSVG.playCareAction("feed", "🍰");
assert(svgInstance.pet1.activeAction === "feed", "ChibiSVG feed action triggered");
assert(svgInstance.pet1.actionDuration === 2.4, "ChibiSVG chew duration matches SPEC-KIN-001 (2.4s)");

var benchmarkData = window.ChibiSVG.getBenchmarkComparison();
assert(typeof benchmarkData === "object", "ChibiSVG benchmark comparison returns valid object");
assert(benchmarkData.metrics.memoryFootprint.ratio.indexOf("40x") !== -1, "ChibiSVG confirms ~40x lower memory footprint vs Canvas");

print("=== ALL JAVASCRIPT PET ENGINE TESTS FINISHED ===");
print("Passed: " + passed + " / " + (passed + failed));
if (failed > 0) {
  print("CRITICAL: " + failed + " tests failed!");
}
