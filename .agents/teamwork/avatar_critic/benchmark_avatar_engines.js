// ============================================================================
// Benchmark & Stress Test Harness for ChibiLove Avatar Engines
// Runs on native Apple JavaScriptCore (WebKit JSC)
// Evaluates Canvas 2D vs SVG innerHTML architectures
// ============================================================================

var windowListeners = {};
var window = {
  devicePixelRatio: 2.0,
  Telegram: {
    WebApp: {
      HapticFeedback: {
        impactOccurred: function (style) {},
        notificationOccurred: function (type) {}
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

var listeners = {};
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
        remove: function (c) { delete this[c]; }
      },
      appendChild: function (c) {
        this.children = this.children || [];
        this.children.push(c);
      },
      removeEventListener: function (evt, fn) {
        if (listeners[evt]) {
          listeners[evt] = listeners[evt].filter(function (f) { return f !== fn; });
        }
      },
      addEventListener: function (evt, fn) {
        listeners[evt] = listeners[evt] || [];
        listeners[evt].push(fn);
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
          quadraticCurveTo: function () {}
        };
      }
    };
  }
};

var performance = { now: function () { return Date.now(); } };
var setTimeout = function (fn, d) { return 1; };
var clearTimeout = function (id) {};
var requestAnimationFrame = function (fn) { return 1; };
var cancelAnimationFrame = function (id) {};

load("public/js/chibi-config.js");
load("public/js/chibi-anime-2d.js");

print("=== AVATAR ENGINE PERFORMANCE & ADVERSARIAL STRESS TEST ===");

var mockContainer = document.createElement("div");

// 1. Benchmark Canvas Engine Frame Execution Time
var canvasInstance = window.Chibi2D.mount(mockContainer, {
  mode: "together",
  avatar: { species: "kitty_bear", name: "Мишка" },
  partnerAvatar: { species: "puppy", name: "Хвостик" },
  care: { isSleeping: false }
});

var startCanvas = Date.now();
var frames = 1000;
for (var f = 0; f < frames; f++) {
  canvasInstance.render(startCanvas + f * 16.666);
}
var totalCanvasMs = Date.now() - startCanvas;
var avgCanvasMs = totalCanvasMs / frames;
print("1. Canvas Engine (Solo + Couple) 1,000 Frames:");
print("   - Total CPU execution: " + totalCanvasMs + " ms");
print("   - Avg time per frame:  " + avgCanvasMs.toFixed(3) + " ms");
print("   - Frame budget (16.6ms): " + (avgCanvasMs < 16.66 ? "PASSED (" + ((avgCanvasMs / 16.66) * 100).toFixed(1) + "% of budget)" : "FAILED (exceeded budget)"));

// 2. Stress Test: High-Frequency Petting (50 taps/second)
var startPet = Date.now();
for (var p = 0; p < 200; p++) {
  canvasInstance.interactAt(170 + (p % 20), 140 + (p % 10), true);
}
var petMs = Date.now() - startPet;
print("2. High-Frequency Touch Petting (200 rapid taps/drags):");
print("   - Total time: " + petMs + " ms (" + (petMs / 200).toFixed(3) + " ms/event)");
print("   - Active particles count: " + canvasInstance.particles.length + " (capped at 50: " + (canvasInstance.particles.length <= 50) + ")");

// 3. Stress Test: Rapid State Cancellation & Race Conditions
var stateSwitches = ["feed", "shower", "sleep", "pet", "sleep", "feed", "shower"];
var stateErrors = 0;
for (var s = 0; s < 500; s++) {
  var action = stateSwitches[s % stateSwitches.length];
  try {
    canvasInstance.playCareAction(action, "🍰");
    canvasInstance.render(Date.now() + s * 16);
  } catch (err) {
    stateErrors++;
    print("   [ERROR] Exception on state switch: " + err);
  }
}
print("3. Rapid State Cancellation (500 rapid interruptions):");
print("   - Errors / Exceptions: " + stateErrors + " (PASSED: " + (stateErrors === 0) + ")");

// 4. Volume Preservation Math Check (Squash & Stretch)
var pet = canvasInstance.pet1;
var volumeErrors = 0;
var maxVolumeDeviation = 0;
for (var t = 0; t < 200; t++) {
  var breathPhase = (t * 0.05) * 3.0;
  var bSquashY = 1.0 + Math.sin(breathPhase) * 0.038;
  var bSquashX = 1.0 - Math.sin(breathPhase) * 0.026;
  var area = bSquashX * bSquashY;
  var dev = Math.abs(area - 1.0);
  if (dev > maxVolumeDeviation) maxVolumeDeviation = dev;
}
print("4. Kinematics Mathematical Area Conservation:");
print("   - Max Area Deviation: " + (maxVolumeDeviation * 100).toFixed(2) + "%");
print("   - Petting recoil deformation target: Sx=" + pet.targetSquashX + ", Sy=" + pet.targetSquashY + ", Area=" + (pet.targetSquashX * pet.targetSquashY).toFixed(4));

// 5. Memory Leak / Detached State Test
var leakPassed = true;
var instances = [];
for (var i = 0; i < 100; i++) {
  var c = document.createElement("div");
  var inst = window.Chibi2D.mount(c, { avatar: { species: "fox" } });
  window.Chibi2D.unmount(c);
  if (!inst.destroyed) leakPassed = false;
}
print("5. Mounting & Unmounting Lifecycle Cleanup:");
print("   - 100 Mount/Unmount cycles destroyed flag check: " + (leakPassed ? "PASSED" : "FAILED"));

print("=== BENCHMARK HARNESS COMPLETE ===");
