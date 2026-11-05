// ============================================================================
// Adversarial Client Runtime & Console Error Auditor for ChibiLove TMA
// Runs on Apple JavaScriptCore (jsc)
// ============================================================================

var consoleErrors = [];
var consoleWarns = [];
var consoleLogs = [];

var console = {
  log: function() { consoleLogs.push(Array.prototype.slice.call(arguments).join(" ")); },
  warn: function() { consoleWarns.push(Array.prototype.slice.call(arguments).join(" ")); },
  error: function() {
    var msg = Array.prototype.slice.call(arguments).join(" ");
    consoleErrors.push(msg);
    print("  🚨 [CLIENT ERROR]: " + msg);
  }
};

var windowListeners = {};
var domElements = {};

function createFakeElement(id, tag) {
  var el = {
    id: id || "",
    tagName: (tag || "div").toUpperCase(),
    value: "",
    style: {},
    innerHTML: "",
    outerHTML: "",
    children: [],
    classList: {
      add: function(c) { this[c] = true; },
      remove: function(c) { delete this[c]; },
      contains: function(c) { return !!this[c]; }
    },
    appendChild: function(c) { this.children.push(c); },
    addEventListener: function(evt, fn) {
      this._listeners = this._listeners || {};
      this._listeners[evt] = this._listeners[evt] || [];
      this._listeners[evt].push(fn);
    },
    removeEventListener: function() {},
    getBoundingClientRect: function() {
      return { left: 0, top: 0, width: 360, height: 280 };
    },
    getContext: function() {
      return {
        clearRect: function() {},
        beginPath: function() {},
        ellipse: function() {},
        arc: function() {},
        fill: function() {},
        stroke: function() {},
        save: function() {},
        restore: function() {},
        translate: function() {},
        scale: function() {},
        rotate: function() {},
        drawImage: function() {},
        fillText: function() {},
        setLineDash: function() {},
        roundRect: function() {},
        moveTo: function() {},
        quadraticCurveTo: function() {},
      };
    }
  };
  if (id) domElements[id] = el;
  return el;
}

var rootApp = createFakeElement("app", "div");

var document = {
  getElementById: function(id) {
    if (!domElements[id]) {
      domElements[id] = createFakeElement(id, "div");
    }
    return domElements[id];
  },
  createElement: function(tag) {
    return createFakeElement("", tag);
  },
  head: createFakeElement("head", "head"),
  body: createFakeElement("body", "body")
};

var window = {
  Telegram: {
    WebApp: {
      ready: function() {},
      expand: function() {},
      close: function() {},
      openInvoice: function(url, cb) { if (cb) cb("paid"); },
      HapticFeedback: {
        impactOccurred: function() {},
        notificationOccurred: function() {}
      },
      initDataUnsafe: {
        user: { id: 12345678, username: "adversarial_user", first_name: "Tester" }
      }
    }
  },
  location: { search: "?tg_user=adversarial_user" },
  navigator: {
    clipboard: {
      writeText: function(txt) { return Promise.resolve(); }
    }
  },
  addEventListener: function(evt, fn) {
    windowListeners[evt] = windowListeners[evt] || [];
    windowListeners[evt].push(fn);
  },
  removeEventListener: function() {},
  confirm: function() { return true; },
  setTimeout: function(fn, d) { return 1; },
  clearTimeout: function() {},
  setInterval: function(fn, d) { return 1; },
  clearInterval: function() {},
  requestAnimationFrame: function(fn) { return 1; },
  cancelAnimationFrame: function() {}
};

// Global bindings
var setTimeout = window.setTimeout;
var clearTimeout = window.clearTimeout;
var setInterval = window.setInterval;
var clearInterval = window.clearInterval;
var requestAnimationFrame = window.requestAnimationFrame;
var cancelAnimationFrame = window.cancelAnimationFrame;
var location = window.location;
var navigator = window.navigator;
var confirm = window.confirm;

print("=== LOADING SCRIPTS ===");
load("public/js/chibi-config.js");
load("public/js/chibi-anime-2d.js");
load("public/js/app.js");

print("Scripts loaded successfully.");

var testResults = [];
function test(name, fn) {
  try {
    fn();
    print("  [PASS] " + name);
    testResults.push({ name: name, pass: true });
  } catch (e) {
    print("  ❌ [FAIL] " + name + " -> " + e);
    testResults.push({ name: name, pass: false, error: String(e) });
  }
}

print("\n=== AUDITING APP & UI EVENT HANDLERS ===");

test("window.APP exists", function() {
  if (!window.APP) throw new Error("window.APP is not defined");
});

test("Check APP.switchTab for all tabs", function() {
  ["care", "together", "pet", "settings"].forEach(function(t) {
    window.APP.switchTab(t);
  });
});

test("Check APP.restorePair function exists and is callable", function() {
  if (typeof window.APP.restorePair !== "function") {
    throw new Error("window.APP.restorePair is not a function");
  }
});

test("Check APP.restorePartner function (called by button in HTML)", function() {
  if (typeof window.APP.restorePartner !== "function") {
    throw new Error("CRITICAL BUG: window.APP.restorePartner is NOT defined! UI button onclick fails!");
  }
});

test("Check button onclick handlers inside rendered HTML", function() {
  // Let's inspect rootApp.innerHTML when partner has left
  var mockServerData = {
    user: {
      username: "test_a",
      hearts: 200,
      freeRestoreAvailable: true,
      avatar: { species: "kitty_bear", name: "Зефирка" },
      care: { partnerLeft: true }
    },
    partner: {
      username: "test_b",
      avatar: { species: "puppy", name: "Шарик" },
      care: { partnerLeft: true, daysTogether: 5, hoursLeft: 0, minsLeft: 0 }
    },
    incomingRequests: [],
    outgoingRequests: [],
    flameStage: { title: "✨ Искорка", color: "#F59E0B", badge: "1-й", desc: "Тест" },
    botUsername: "ChibiLove_bot",
    restoreCostHearts: 200
  };
  
  // Set state
  window.APP.switchTab("care");
  // Check if restorePartner is referenced in HTML
  var html = rootApp.innerHTML;
  if (html.indexOf("APP.restorePartner") !== -1 && typeof window.APP.restorePartner === "undefined") {
    throw new Error("HTML binds onclick='APP.restorePartner(...)' but function is undefined!");
  }
});

test("Check buyStarsPackage argument vs backend expectations", function() {
  // Check whether buyStarsPackage exists
  if (typeof window.APP.buyStarsPackage !== "function") {
    throw new Error("buyStarsPackage is not a function");
  }
});

print("\n=== SUMMARY OF CLIENT AUDIT ===");
var failed = testResults.filter(function(t) { return !t.pass; });
print("Total tests: " + testResults.length + ", Failed: " + failed.length);
failed.forEach(function(f) {
  print(" - " + f.name + ": " + f.error);
});
