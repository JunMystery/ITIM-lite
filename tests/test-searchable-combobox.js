/* ==========================================================================
   ITIM-lite - Searchable Combobox Automated Test Suite
   ========================================================================== */

var fs = require("fs");
var path = require("path");

var domElements = {};
function createMockEl(id, tag) {
  var el = {
    id: id || "",
    tagName: (tag || "div").toUpperCase(),
    innerHTML: "",
    innerText: "",
    textContent: "",
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
    getElementsByTagName: function (t) {
      var tagUpper = t.toUpperCase();
      var found = [];
      function search(node) {
        for (var i = 0; i < (node.children || []).length; i++) {
          if (node.children[i].tagName === tagUpper) found.push(node.children[i]);
          search(node.children[i]);
        }
      }
      search(this);
      return found;
    },
    getAttribute: function (attr) { return this[attr] || null; },
    setAttribute: function (attr, val) { this[attr] = val; },
    select: function () {}
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
  body: createMockEl("body", "body")
};

function loadModule(relPath) {
  var full = path.join(__dirname, "..", relPath);
  var code = fs.readFileSync(full, "utf8");
  eval.call(global, code);
}

loadModule("js/ui-combobox.js");

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

console.log("\n=== 1. UI_ComboBox HTML Rendering & Value Normalization ===");
var items = [
  { value: "laptop", label: "Laptop Workstation" },
  { value: "desktop", label: "Desktop PC" },
  { value: "server", label: "Rack Server" }
];

var html = UI_ComboBox.renderHtml("test-category-picker", items, "desktop", "custom-class", 'required');
assert(html.indexOf('id="test-category-picker"') !== -1, "Rendered hidden input with target ID");
assert(html.indexOf('value="desktop"') !== -1, "Pre-selected value set on hidden input");
assert(html.indexOf('value="Desktop PC"') !== -1, "Pre-selected label displayed in search input");
assert(html.indexOf('combo-search-input') !== -1, "Contains searchable text input");
assert(html.indexOf('combo-chevron') !== -1, "Contains toggle chevron");

console.log("\n=== 2. Value Retrieval & Update API ===");
// Set up mock DOM elements to match rendered HTML
var hiddenEl = document.getElementById("test-category-picker");
hiddenEl.value = "desktop";
var textEl = document.getElementById("combo-input-test-category-picker");
textEl.value = "Desktop PC";

var val = UI_ComboBox.getValue("test-category-picker");
assert(val === "desktop", "getValue returns currently selected value: " + val);

UI_ComboBox.setValue("test-category-picker", "server");
var updatedVal = UI_ComboBox.getValue("test-category-picker");
assert(updatedVal === "server", "setValue updates hidden input value: " + updatedVal);
assert(textEl.value === "Rack Server", "setValue updates text display input: " + textEl.value);

console.log("\n=== 3. Populate Options Dynamically ===");
var newOptions = [
  { value: "opt1", label: "Option 1" },
  { value: "opt2", label: "Option 2" }
];
UI_ComboBox.populate("test-category-picker", newOptions, "opt2");
assert(UI_ComboBox.getValue("test-category-picker") === "opt2", "populate sets new options and updates selection to opt2");
assert(textEl.value === "Option 2", "populate updates text input label to 'Option 2'");

console.log("\n=== 4. Option Selection Callback & Change Notification ===");
var callbackCalled = false;
var callbackVal = "";
UI_ComboBox.register("test-callback-combo", items, "laptop", function (v, l) {
  callbackCalled = true;
  callbackVal = v;
});

UI_ComboBox.selectOption("test-callback-combo", "server", "Rack Server");
assert(callbackCalled, "selectOption triggered registration callback");
assert(callbackVal === "server", "Callback received chosen value: " + callbackVal);
assert(UI_ComboBox.getValue("test-callback-combo") === "server", "Internal registry value updated to server");

console.log("\n=== 5. Dropdown Toggle & Open/Close ===");
var dropdownEl = document.getElementById("combo-dropdown-test-category-picker");
var wrapperEl = document.getElementById("combo-wrapper-test-category-picker");

UI_ComboBox.openDropdown("test-category-picker");
assert(dropdownEl.className.indexOf("open") !== -1, "openDropdown adds 'open' class to dropdown");
assert(wrapperEl.className.indexOf("is-open") !== -1, "openDropdown adds 'is-open' class to wrapper");

UI_ComboBox.closeDropdown("test-category-picker");
assert(dropdownEl.className.indexOf("open") === -1, "closeDropdown removes 'open' class");
assert(wrapperEl.className.indexOf("is-open") === -1, "closeDropdown removes 'is-open' class");

console.log("\n==========================================");
console.log("COMBOBOX SUITE: " + passed + " passed, " + failed + " failed.");
console.log("==========================================\n");

if (failed > 0) process.exit(1); else process.exit(0);
