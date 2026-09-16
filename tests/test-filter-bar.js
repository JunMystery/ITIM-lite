/* ==========================================================================
   ITIM-lite - Unified Search Bar & Filter Dialog Unit Tests
   ========================================================================== */

var fs = require("fs");
var path = require("path");

global.window = {
  location: { pathname: path.join(process.cwd(), "ITIM.hta") }
};
global.localStorage = {
  store: {},
  getItem: function (k) { return this.store[k] || null; },
  setItem: function (k, v) { this.store[k] = String(v); },
  removeItem: function (k) { delete this.store[k]; }
};
global.alert = function () {};

// Minimal DOM Mock for Node.js
var domElements = {};
function createMockEl(id, tag) {
  var el = {
    id: id || "",
    tagName: tag || "div",
    innerHTML: "",
    innerText: "",
    value: "",
    style: {},
    className: "",
    children: [],
    parentNode: null,
    appendChild: function (child) {
      if (child) {
        child.parentNode = this;
        this.children.push(child);
      }
      return child;
    },
    removeChild: function (child) {
      this.children = this.children.filter(function (c) { return c !== child; });
      if (child) child.parentNode = null;
      return child;
    },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; }
  };
  return el;
}

global.document = {
  getElementById: function (id) {
    if (!domElements[id]) {
      domElements[id] = createMockEl(id, "div");
    }
    return domElements[id];
  },
  createElement: function (tag) {
    return createMockEl("", tag);
  },
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; },
  body: createMockEl("body", "body")
};

function loadModule(relPath) {
  var full = path.join(__dirname, "..", relPath);
  var code = fs.readFileSync(full, "utf8");
  eval.call(global, code);
}

[
  "config.js", "i18n.js", "fso-storage.js", "backup-engine.js", "barcode-qr.js",
  "inventory-service.js", "licenses-service.js", "consumables-service.js",
  "assignments-service.js", "transactions-service.js", "catalog-service.js",
  "po-service.js", "export-import.js", "ui-combobox.js", "ui-pagination.js",
  "ui-filter-bar.js", "ui-actions-menu.js", "ui-layout.js", "ui-assets.js",
  "ui-inbound.js", "ui-catalog.js", "ui-licenses.js", "ui-consumables.js",
  "ui-assignments.js", "ui-history.js", "ui-dashboard.js"
].forEach(function (m) { loadModule("js/" + m); });

global.AppState = {
  db: JSON.parse(JSON.stringify(global.ITIM_CONFIG.DEFAULT_SEED_DATA)),
  getStoragePath: function () { return ".\\data"; },
  save: function () { return true; }
};

var passed = 0;
var failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log("  ✓ " + message);
  } else {
    failed++;
    console.error("  ✕ FAIL: " + message);
  }
}

console.log("\n=== 1. UI_FilterBar Initialization & Schema Tests ===");
var filteredViews = [];
UI_FilterBar.init("test_view", {
  title: "Test Items",
  placeholder: "Search test items...",
  fields: [
    { id: "status", label: "Status", type: "select", options: [{ value: "all", label: "All" }, { value: "active", label: "Active" }] },
    { id: "category", label: "Category", type: "text" }
  ],
  onFilter: function (crit) {
    filteredViews.push(crit);
  }
});

var initCrit = UI_FilterBar.getCriteria("test_view");
assert(initCrit.search === "" && typeof initCrit.filters === "object", "Initialized view criteria with empty search and filter object");

console.log("\n=== 2. Search Input & Clear Tests ===");
UI_FilterBar.onInput("test_view", "latitude");
var inputEl = document.getElementById("search-input-test_view");
inputEl.value = "latitude";
UI_FilterBar.onKeyDown({ keyCode: 13 }, "test_view");

var searchCrit = UI_FilterBar.getCriteria("test_view");
assert(searchCrit.search === "latitude", "Enter key triggers immediate search query update: " + searchCrit.search);

UI_FilterBar.clearSearch("test_view");
var clearedCrit = UI_FilterBar.getCriteria("test_view");
assert(clearedCrit.search === "", "clearSearch resets search query to empty string");

console.log("\n=== 3. Filter Application & Active Count Tests ===");
UI_FilterBar.openDialog("test_view");
var statusInput = document.getElementById("modal-filter-status");
var catInput = document.getElementById("modal-filter-category");
statusInput.value = "active";
catInput.value = "Laptops";

UI_FilterBar.applyDialog();
var appliedCrit = UI_FilterBar.getCriteria("test_view");
assert(appliedCrit.filters.status === "active" && appliedCrit.filters.category === "Laptops", "Applied dialog filters updated state");

var badgeEl = document.getElementById("filter-badge-test_view");
assert(badgeEl.innerText === 2 && badgeEl.style.display === "inline-block", "Active filter badge shows 2 filters active");

console.log("\n=== 4. Filter Removal & Reset Tests ===");
UI_FilterBar.removeField("test_view", "category");
var remCrit = UI_FilterBar.getCriteria("test_view");
assert(!remCrit.filters.category && remCrit.filters.status === "active", "removeField removes single filter pill");
assert(badgeEl.innerText === 1, "Badge updated to 1 after removing category");

UI_FilterBar.resetFilters("test_view");
var resetCrit = UI_FilterBar.getCriteria("test_view");
assert(Object.keys(resetCrit.filters).length === 0, "resetFilters clears all active filters");
assert(badgeEl.style.display === "none", "Filter badge hidden when 0 active filters");

console.log("\n=== 5. View Integration & Render Tests (All 8 Functions) ===");
var views = ["assets", "inbound", "catalog", "licenses", "consumables", "assignments", "history", "audit"];
var allRendered = true;

for (var i = 0; i < views.length; i++) {
  var v = views[i];
  if (v === "assets") UI_Assets.render();
  else if (v === "inbound") UI_Inbound.render();
  else if (v === "catalog") UI_Catalog.render();
  else if (v === "licenses") UI_Licenses.render();
  else if (v === "consumables") UI_Consumables.render();
  else if (v === "assignments") UI_Assignments.render();
  else if (v === "history") UI_History.render();
  else if (v === "audit") UI_Dashboard.renderAuditLogs();

  var toolbarEl = document.getElementById(v + "-filter-bar");
  if (!toolbarEl || toolbarEl.innerHTML.indexOf("table-toolbar") === -1) {
    allRendered = false;
    console.error("Missing filter bar toolbar in view: " + v);
  }
}
assert(allRendered, "All 8 views successfully mount unified UI_FilterBar toolbar with Search and Filter button");

console.log("\n==========================================");
console.log("FILTER BAR SUITE: " + passed + " passed, " + failed + " failed.");
console.log("==========================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
