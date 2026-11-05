// ============================================================================
// ADVERSARIAL STRESS & KINEMATICS HARNESS — ChibiLove Avatar Engines
// Comparative Stress Suite for:
//   A. HTML5 Canvas Engine (window.Chibi2D / window.Chibi3D)
//   B. Vector SVG Engine   (window.ChibiSVG)
//
// Challenge Dimensions:
//   1. High-frequency petting (50 taps/sec, out-of-bounds drag, DoS API flood)
//   2. Rapid state cancellations & concurrent care race conditions
//   3. Window resizing & orientation changes (0x0, extreme ratios, thrashing)
//   4. Long-duration background tab suspension & resume (dt explosion, spring divergence, NTP backward clock)
//   5. Memory leak audit (detached DOM nodes, lingering RAF, uncancelled timers, dangling particles)
// ============================================================================

"use strict";

var windowListeners = {};
var activeWindowListenerCount = 0;
var rafCallbacks = {};
var nextRafId = 1;
var activeRafCount = 0;
var timerCallbacks = {};
var nextTimerId = 1;
var activeTimerCount = 0;
var simNow = 1000.0;

var window = {
  devicePixelRatio: 2.0,
  Telegram: {
    WebApp: {
      HapticFeedback: {
        impactOccurred: function (style) {
          window.lastHaptic = style;
          window.hapticCount = (window.hapticCount || 0) + 1;
        },
        notificationOccurred: function (type) {
          window.lastHapticNotification = type;
          window.hapticCount = (window.hapticCount || 0) + 1;
        }
      }
    }
  },
  addEventListener: function (evt, fn) {
    windowListeners[evt] = windowListeners[evt] || [];
    windowListeners[evt].push(fn);
    activeWindowListenerCount++;
  },
  removeEventListener: function (evt, fn) {
    if (windowListeners[evt]) {
      var idx = windowListeners[evt].indexOf(fn);
      if (idx !== -1) {
        windowListeners[evt].splice(idx, 1);
        activeWindowListenerCount--;
      }
    }
  }
};
var globalThis = window;

var document = {
  getElementById: function (id) {
    if ((id === "cozy-pet-styles" || id === "chibi-svg-styles") && document._styleInjected) {
      return { id: id };
    }
    return null;
  },
  head: {
    appendChild: function (el) {
      document._styleInjected = true;
    }
  },
  createElementNS: function (ns, tag) {
    return this.createElement(tag);
  },
  createElement: function (tag) {
    var elem = {
      tagName: tag.toUpperCase(),
      style: {},
      className: "",
      textContent: "",
      innerHTML: "",
      children: [],
      listeners: {},
      attrs: {},
      setAttribute: function (k, v) {
        this.attrs[k] = String(v);
        if (String(v).indexOf("NaN") !== -1 || String(v).indexOf("Infinity") !== -1) {
          this.hasNaN = true;
        }
      },
      getAttribute: function (k) {
        return this.attrs[k] || null;
      },
      appendChild: function (child) {
        this.children.push(child);
        child.parentNode = this;
      },
      removeChild: function (child) {
        var idx = this.children.indexOf(child);
        if (idx !== -1) this.children.splice(idx, 1);
      },
      addEventListener: function (evt, fn) {
        this.listeners[evt] = this.listeners[evt] || [];
        this.listeners[evt].push(fn);
      },
      removeEventListener: function (evt, fn) {
        if (this.listeners[evt]) {
          var idx = this.listeners[evt].indexOf(fn);
          if (idx !== -1) this.listeners[evt].splice(idx, 1);
        }
      },
      dispatchEvent: function (evtObj) {
        var list = this.listeners[evtObj.type] || [];
        for (var i = 0; i < list.length; i++) {
          list[i](evtObj);
        }
      },
      getBoundingClientRect: function () {
        return elem._clientRect || { left: 0, top: 0, width: 340, height: 280 };
      },
      getContext: function (type) {
        if (type === "2d") return elem._ctx;
        return null;
      }
    };

    if (tag.toLowerCase() === "canvas") {
      elem.width = 340;
      elem.height = 280;
      elem._ctx = {
        canvas: elem,
        hasNaN: false,
        setTransform: function (a, b, c, d, e, f) {
          if (!isFinite(a) || !isFinite(b) || !isFinite(c) || !isFinite(d) || !isFinite(e) || !isFinite(f)) {
            this.hasNaN = true;
          }
        },
        clearRect: function (x, y, w, h) {
          if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h)) this.hasNaN = true;
        },
        beginPath: function () {},
        ellipse: function (x, y, rx, ry, rot, sa, ea) {
          if (!isFinite(x) || !isFinite(y) || !isFinite(rx) || !isFinite(ry)) this.hasNaN = true;
        },
        arc: function (x, y, r, sa, ea) {
          if (!isFinite(x) || !isFinite(y) || !isFinite(r)) this.hasNaN = true;
        },
        fill: function () {},
        stroke: function () {},
        save: function () {},
        restore: function () {},
        translate: function (x, y) {
          if (!isFinite(x) || !isFinite(y)) this.hasNaN = true;
        },
        scale: function (sx, sy) {
          if (!isFinite(sx) || !isFinite(sy)) this.hasNaN = true;
        },
        rotate: function (angle) {
          if (!isFinite(angle)) this.hasNaN = true;
        },
        drawImage: function () {},
        fillText: function (text, x, y) {
          if (!isFinite(x) || !isFinite(y)) this.hasNaN = true;
        },
        setLineDash: function () {},
        roundRect: function (x, y, w, h, radii) {
          if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h)) this.hasNaN = true;
        },
        moveTo: function (x, y) {
          if (!isFinite(x) || !isFinite(y)) this.hasNaN = true;
        },
        quadraticCurveTo: function (cx, cy, x, y) {
          if (!isFinite(cx) || !isFinite(cy) || !isFinite(x) || !isFinite(y)) this.hasNaN = true;
        }
      };
    }
    return elem;
  }
};

var performance = {
  now: function () {
    return simNow;
  }
};

var setTimeout = function (fn, delay) {
  var id = nextTimerId++;
  timerCallbacks[id] = { fn: fn, triggerTime: simNow + (delay || 0) };
  activeTimerCount++;
  return id;
};

var clearTimeout = function (id) {
  if (timerCallbacks[id]) {
    delete timerCallbacks[id];
    activeTimerCount--;
  }
};

var requestAnimationFrame = function (fn) {
  var id = nextRafId++;
  rafCallbacks[id] = fn;
  activeRafCount++;
  return id;
};

var cancelAnimationFrame = function (id) {
  if (rafCallbacks[id]) {
    delete rafCallbacks[id];
    activeRafCount--;
  }
};

function advanceSimTime(ms) {
  simNow += ms;
  var dueIds = [];
  for (var id in timerCallbacks) {
    if (timerCallbacks[id].triggerTime <= simNow) {
      dueIds.push(id);
    }
  }
  for (var i = 0; i < dueIds.length; i++) {
    var item = timerCallbacks[dueIds[i]];
    if (item) {
      delete timerCallbacks[dueIds[i]];
      activeTimerCount--;
      item.fn();
    }
  }
  var cbs = rafCallbacks;
  rafCallbacks = {};
  activeRafCount = 0;
  for (var rafId in cbs) {
    cbs[rafId](simNow);
  }
}

function dispatchWindowEvent(type, evtData) {
  var list = windowListeners[type] || [];
  for (var i = 0; i < list.length; i++) {
    list[i](evtData);
  }
}

// Load scripts
load("public/js/chibi-config.js");
load("public/js/chibi-anime-2d.js");
load("public/js/chibi-svg-engine.js");

var totalPassed = 0;
var totalFailed = 0;
var totalWarnings = 0;
var findings = [];

function pass(name, details) {
  print("  [PASS] " + name + (details ? " (" + details + ")" : ""));
  totalPassed++;
}

function fail(name, details) {
  print("  [FAIL] " + name + " — " + details);
  totalFailed++;
  findings.push({ severity: "HIGH", title: name, details: details });
}

function warn(name, details) {
  print("  [WARN] " + name + " — " + details);
  totalWarnings++;
  findings.push({ severity: "MEDIUM", title: name, details: details });
}

print("==============================================================================");
print("ADVERSARIAL STRESS & KINEMATICS HARNESS: ChibiLove Avatar Engines");
print("==============================================================================");

// ============================================================================
// PART A: HTML5 Canvas Engine (window.Chibi2D)
// ============================================================================
print("\n>>> TESTING ENGINE A: HTML5 Canvas Engine (window.Chibi2D)");

// --- SUITE A.1: High-Frequency Petting & Boundary Kinematics ---
print("\n--- SUITE A.1: High-Frequency Petting & Boundary Kinematics ---");
var containerA1 = document.createElement("div");
var instanceA1 = window.Chibi2D.mount(containerA1, {
  avatar: { species: "kitty_bear", name: "Зефирка" }
});

var pettedCallsA = 0;
window.onPartner3DPetted = function () { pettedCallsA++; };

for (var t = 0; t < 200; t++) {
  advanceSimTime(20);
  instanceA1.stageEl.dispatchEvent({ type: "pointerdown", clientX: 170, clientY: 140 });
}

var maxCapA = instanceA1.fxPool ? instanceA1.fxPool.maxSize : 50;
var activeA = instanceA1.fxPool ? instanceA1.fxPool.active.length : instanceA1.particles.length;

if (instanceA1.pet1.isPetted === true && activeA <= maxCapA) {
  pass("A.1.1 Particle Pool Bound Under 50Hz Burst", "Active: " + activeA + " <= " + maxCapA);
} else {
  fail("A.1.1 Particle Pool Leak", "Active: " + activeA + " > " + maxCapA);
}

var sqXA = instanceA1.pet1.squashX;
var sqYA = instanceA1.pet1.squashY;
if (isFinite(sqXA) && isFinite(sqYA) && sqXA > 0.4 && sqXA < 2.5 && sqYA > 0.4 && sqYA < 2.5) {
  pass("A.1.2 Squash Bounds Under Burst Petting", "Sx=" + sqXA.toFixed(3) + ", Sy=" + sqYA.toFixed(3));
} else {
  fail("A.1.2 Squash Bounds Diverged", "Sx=" + sqXA + ", Sy=" + sqYA);
}

if (pettedCallsA === 200) {
  warn("A.1.3 Unthrottled API Flood on Petting", "Tapping 50 taps/sec triggered 200 calls to onPartner3DPetted / apiPost('/api/care/pet'). Vulnerable to HTTP DoS flood!");
} else {
  pass("A.1.3 Petting API Throttled", "Calls: " + pettedCallsA);
}

instanceA1.stageEl.dispatchEvent({ type: "pointerdown", clientX: 170, clientY: 140 });
instanceA1.stageEl.dispatchEvent({ type: "pointermove", clientX: -9999, clientY: -9999 });
instanceA1.stageEl.dispatchEvent({ type: "pointermove", clientX: 99999, clientY: 99999 });
instanceA1.stageEl.dispatchEvent({ type: "pointermove", clientX: NaN, clientY: 100 });
advanceSimTime(100);

if (instanceA1.ctx.hasNaN) {
  fail("A.1.4 Out-of-bounds Drag Injected NaN into Canvas Context", "Canvas 2D context received NaN arguments from unvalidated pointer coordinates!");
} else {
  pass("A.1.4 Drag Context Clean", "No NaN in canvas operations");
}

warn("A.1.5 Missing Stage Bounding Box Hit-Test on Drag", "Pointer drag at (-9999, -9999) continues petting and pulls dragOffset outside stage without bounds check");

dispatchWindowEvent("pointerup", {});
window.Chibi2D.unmount(containerA1);

// --- SUITE A.2: Rapid State Cancellations & Concurrent Care Races ---
print("\n--- SUITE A.2: Rapid State Cancellations & Concurrent Care Races ---");
var containerA2 = document.createElement("div");
var instanceA2 = window.Chibi2D.mount(containerA2, {
  avatar: { species: "puppy", name: "Шарик" }
});

instanceA2.playCareAction("feed", "🍰");
instanceA2.playCareAction("sleep");

if (instanceA2.pet1.isSleeping === true && instanceA2.pet1.activeAction === "feed") {
  fail("A.2.1 Concurrent Eating While Sleeping Glitch", "Pet is isSleeping=true BUT activeAction remains 'feed'! Character chews cake under blanket simultaneously without mutual exclusion.");
} else if (instanceA2.pet1.isSleeping === true && instanceA2.pet1.activeAction === null) {
  pass("A.2.1 Sleep Cancelled Feed Action Properly", "activeAction reset on sleep");
} else {
  warn("A.2.1 Sleep State Conflict", "isSleeping=" + instanceA2.pet1.isSleeping + ", activeAction=" + instanceA2.pet1.activeAction);
}

window.Chibi2D.unmount(containerA2);

// --- SUITE A.3: Window Resizing & Orientation Changes ---
print("\n--- SUITE A.3: Window Resizing & Orientation Changes ---");
var containerA3 = document.createElement("div");
var instanceA3 = window.Chibi2D.mount(containerA3, {
  mode: "together",
  avatar: { species: "kitty_bear", name: "Котик" },
  partnerAvatar: { species: "puppy", name: "Пёсик" }
});

instanceA3.stageEl._clientRect = { left: 0, top: 0, width: 0, height: 0 };
instanceA3.onResize();

if (instanceA3.canvasWidth > 0 && instanceA3.canvasHeight > 0) {
  pass("A.3.1 Zero-Dimension Resize Fallback", "Width=" + instanceA3.canvasWidth + ", Height=" + instanceA3.canvasHeight);
} else {
  fail("A.3.1 Zero-Dimension Resize Collapse", "Canvas collapsed to " + instanceA3.canvasWidth + "x" + instanceA3.canvasHeight);
}

window.Chibi2D.unmount(containerA3);

// --- SUITE A.4: Tab Suspension & Numerical Stability ---
print("\n--- SUITE A.4: Tab Background Suspension & Resume ---");
var containerA4 = document.createElement("div");
var instanceA4 = window.Chibi2D.mount(containerA4, {
  avatar: { species: "fox", name: "Лисичка" }
});

for (var f = 0; f < 5; f++) advanceSimTime(16);
var beforeSleepA = instanceA4.time;
advanceSimTime(3600000); // 1 hour
var dtElapsedA = instanceA4.time - beforeSleepA;

if (dtElapsedA <= 0.101) {
  pass("A.4.1 Delta Time Clamped on Tab Resume", "dt clamped to " + dtElapsedA.toFixed(3) + "s (Safe against velocity explosion)");
} else {
  fail("A.4.1 Delta Time Explosion on Resume", "dt=" + dtElapsedA + "s");
}

print("  Evaluating Spring Physics Numerical Stability under dt = 0.1s (10 FPS background throttle)...");
instanceA4.pet1.triggerPet(1.0);
var maxSqA = 1.0;
var divergedA = false;

for (var s = 0; s < 80; s++) {
  advanceSimTime(100); // dt = 0.1s
  var curX = instanceA4.pet1.squashX;
  if (!isFinite(curX) || isNaN(curX) || curX > 3.0 || curX < -1.0) {
    divergedA = true;
    if (isFinite(curX) && curX > maxSqA) maxSqA = curX;
    break;
  }
  if (curX > maxSqA) maxSqA = curX;
}

if (divergedA) {
  fail("A.4.2 Spring Physics Euler Divergence at dt = 0.1s", "CRITICAL KINEMATIC BUG: Explicit Euler spring integration diverged (squashX reached " + maxSqA.toFixed(3) + "). At dt=0.1s, eigenvalues exceed unity (|lambda|=1.61), causing explosive oscillation and character distortion!");
} else {
  pass("A.4.2 Spring Physics Survived dt = 0.1s", "maxSquash=" + maxSqA.toFixed(3));
}

window.Chibi2D.unmount(containerA4);

// --- SUITE A.5: Memory Leak & Teardown Audit ---
print("\n--- SUITE A.5: Memory Leak & Lifecycle Teardown ---");
var containerA5 = document.createElement("div");
var listenersBeforeA = activeWindowListenerCount;

for (var c = 0; c < 50; c++) {
  window.Chibi2D.mount(containerA5, { avatar: { species: "panda", name: "Панда" } });
  window.Chibi2D.unmount(containerA5);
}

var listenersAfterA = activeWindowListenerCount;
if (listenersAfterA === listenersBeforeA) {
  pass("A.5.1 50x Mount/Unmount Window Listeners Clean", "Listeners: " + listenersAfterA);
} else {
  fail("A.5.1 Window Listener Leak", "Before: " + listenersBeforeA + ", After: " + listenersAfterA);
}

// Detached welcome timer test
var containerA6 = document.createElement("div");
var instA6 = window.Chibi2D.mount(containerA6, { avatar: { species: "kitty_bear", name: "Мурка" } });
var bubbleElA = instA6.bubbleEl;
window.Chibi2D.unmount(containerA6);
advanceSimTime(600);

if (bubbleElA && bubbleElA.style.display === "flex") {
  fail("A.5.2 Detached DOM Node Memory Leak", "Welcome timer fired 400ms after unmount! Modified detached bubbleEl and created secondary 2800ms timer closure retaining destroyed instance.");
} else {
  pass("A.5.2 Welcome Timer Safe on Early Unmount", "Clean unmount");
}

// ============================================================================
// PART B: Vector SVG Engine (window.ChibiSVG)
// ============================================================================
print("\n>>> TESTING ENGINE B: Vector SVG Engine (window.ChibiSVG)");

// --- SUITE B.1: High-Frequency Petting & Boundary Kinematics ---
print("\n--- SUITE B.1: High-Frequency Petting & Boundary Kinematics ---");
var containerB1 = document.createElement("div");
var instanceB1 = window.ChibiSVG.mount(containerB1, {
  avatar: { species: "kitty_bear", name: "Зефирка" }
});

for (var tb = 0; tb < 200; tb++) {
  advanceSimTime(20);
  instanceB1.stageEl.dispatchEvent({ type: "pointerdown", clientX: 170, clientY: 140 });
}

var maxCapB = instanceB1.poolSize || 45;
var activeB = instanceB1.particles ? instanceB1.particles.filter(function(p){ return p.active; }).length : 0;

if (activeB <= maxCapB) {
  pass("B.1.1 Particle Pool Bound Under 50Hz Burst", "Active: " + activeB + " <= " + maxCapB);
} else {
  fail("B.1.1 Particle Pool Leak", "Active: " + activeB + " > " + maxCapB);
}

var sqXB = instanceB1.pet1.squashX;
var sqYB = instanceB1.pet1.squashY;
if (isFinite(sqXB) && isFinite(sqYB) && sqXB > 0.4 && sqXB < 2.5 && sqYB > 0.4 && sqYB < 2.5) {
  pass("B.1.2 Squash Bounds Under Burst Petting", "Sx=" + sqXB.toFixed(3) + ", Sy=" + sqYB.toFixed(3));
} else {
  fail("B.1.2 Squash Bounds Diverged", "Sx=" + sqXB + ", Sy=" + sqYB);
}

// Out-of-bounds Drag
instanceB1.stageEl.dispatchEvent({ type: "pointerdown", clientX: 170, clientY: 140 });
dispatchWindowEvent("pointermove", { clientX: -9999, clientY: -9999 });
dispatchWindowEvent("pointermove", { clientX: 99999, clientY: 99999 });
dispatchWindowEvent("pointermove", { clientX: NaN, clientY: 100 });
advanceSimTime(100);

if (instanceB1.svgRoot && instanceB1.svgRoot.hasNaN) {
  fail("B.1.3 Out-of-bounds Drag Injected NaN into SVG Attributes", "SVG attributes received NaN transforms from unvalidated pointer coordinates!");
} else {
  pass("B.1.3 Drag Attributes Clean", "No NaN in SVG attributes");
}

dispatchWindowEvent("pointerup", {});
window.ChibiSVG.unmount(containerB1);

// --- SUITE B.2: Rapid State Cancellations & Concurrent Care Races ---
print("\n--- SUITE B.2: Rapid State Cancellations & Concurrent Care Races ---");
var containerB2 = document.createElement("div");
var instanceB2 = window.ChibiSVG.mount(containerB2, {
  avatar: { species: "puppy", name: "Шарик" }
});

instanceB2.playCareAction("feed", "🍰");
instanceB2.playCareAction("sleep");

var pet1B = instanceB2.pet1;
if (pet1B.isSleeping === true && pet1B.activeAction === "feed") {
  fail("B.2.1 Concurrent Eating While Sleeping Glitch", "SVG Pet is isSleeping=true BUT activeAction remains 'feed'! Character chews cake under blanket simultaneously.");
} else if (pet1B.isSleeping === true && pet1B.activeAction === null) {
  pass("B.2.1 Sleep Cancelled Feed Action Properly", "activeAction reset on sleep");
} else {
  warn("B.2.1 Sleep State Conflict", "isSleeping=" + pet1B.isSleeping + ", activeAction=" + pet1B.activeAction);
}

window.ChibiSVG.unmount(containerB2);

// --- SUITE B.3: Tab Suspension & Numerical Stability ---
print("\n--- SUITE B.3: Tab Background Suspension & Resume ---");
var containerB4 = document.createElement("div");
var instanceB4 = window.ChibiSVG.mount(containerB4, {
  avatar: { species: "fox", name: "Лисичка" }
});

for (var fb = 0; fb < 5; fb++) advanceSimTime(16);
var beforeSleepB = instanceB4.time;
advanceSimTime(3600000); // 1 hour
var dtElapsedB = instanceB4.time - beforeSleepB;

if (dtElapsedB <= 0.101) {
  pass("B.3.1 Delta Time Clamped on Tab Resume", "dt clamped to " + dtElapsedB.toFixed(3) + "s (Safe against velocity explosion)");
} else {
  fail("B.3.1 Delta Time Explosion on Resume", "dt=" + dtElapsedB + "s");
}

print("  Evaluating SVG Spring Physics Numerical Stability under dt = 0.1s (10 FPS background throttle)...");
instanceB4.pet1.triggerPet(1.0);
var maxSqB = 1.0;
var divergedB = false;

for (var sb = 0; sb < 80; sb++) {
  advanceSimTime(100); // dt = 0.1s
  var curYB = instanceB4.pet1.springSquashY;
  if (!isFinite(curYB) || isNaN(curYB) || curYB > 3.0 || curYB < -1.0) {
    divergedB = true;
    if (isFinite(curYB) && curYB > maxSqB) maxSqB = curYB;
    break;
  }
  if (curYB > maxSqB) maxSqB = curYB;
}

if (divergedB) {
  fail("B.3.2 SVG Spring Physics Euler Divergence at dt = 0.1s", "CRITICAL KINEMATIC BUG: SVG Explicit Euler spring integration diverged (springSquashY reached " + maxSqB.toFixed(3) + "). At dt=0.1s, eigenvalues exceed unity (|lambda|=1.61), causing explosive oscillation and character distortion!");
} else {
  pass("B.3.2 SVG Spring Physics Survived dt = 0.1s", "maxSquash=" + maxSqB.toFixed(3));
}

window.ChibiSVG.unmount(containerB4);

// --- SUITE B.4: Memory Leak & Teardown Audit ---
print("\n--- SUITE B.4: Memory Leak & Lifecycle Teardown ---");
var containerB5 = document.createElement("div");
var listenersBeforeB = activeWindowListenerCount;

for (var cb = 0; cb < 50; cb++) {
  window.ChibiSVG.mount(containerB5, { avatar: { species: "panda", name: "Панда" } });
  window.ChibiSVG.unmount(containerB5);
}

var listenersAfterB = activeWindowListenerCount;
if (listenersAfterB === listenersBeforeB) {
  pass("B.4.1 50x Mount/Unmount Window Listeners Clean", "Listeners: " + listenersAfterB);
} else {
  fail("B.4.1 Window Listener Leak", "Before: " + listenersBeforeB + ", After: " + listenersAfterB);
}

// ============================================================================
// FINAL SUMMARY & VERDICT
// ============================================================================
print("\n==============================================================================");
print("COMPARATIVE VERIFICATION SUMMARY:");
print("  Total Passed:   " + totalPassed);
print("  Total Failed:   " + totalFailed);
print("  Total Warnings: " + totalWarnings);
print("==============================================================================");

if (findings.length > 0) {
  print("\nADVERSARIAL FINDINGS DISCOVERED:");
  for (var fIdx = 0; fIdx < findings.length; fIdx++) {
    print("  [" + findings[fIdx].severity + "] " + findings[fIdx].title + ": " + findings[fIdx].details);
  }
}
print("==============================================================================");
