/* ==========================================================================
   ITIM-lite - Unified Searchable Combobox Component
   Pure ES5 for Windows HTA / IE11 compatibility (< 250 LOC)
   ========================================================================== */

var UI_ComboBox = (function () {
  var registry = {};
  var activeHighlights = {};

  function normalizeItems(items) {
    var list = [];
    for (var i = 0; i < (items || []).length; i++) {
      var it = items[i];
      if (typeof it === "object" && it !== null) {
        list.push({
          value: String(it.value !== undefined ? it.value : ""),
          label: String(it.label || it.text || it.name || it.value || "")
        });
      } else {
        list.push({ value: String(it), label: String(it) });
      }
    }
    return list;
  }

  function register(id, items, selectedValue, onSelect) {
    registry[id] = {
      items: normalizeItems(items),
      value: selectedValue !== undefined && selectedValue !== null ? String(selectedValue) : "",
      onSelect: onSelect || null
    };
  }

  function renderHtml(id, items, selectedValue, extraClass, extraAttrs, placeholder) {
    var norm = normalizeItems(items);
    register(id, norm, selectedValue);

    var selVal = selectedValue !== undefined && selectedValue !== null ? String(selectedValue) : "";
    var selText = "";
    for (var i = 0; i < norm.length; i++) {
      if (norm[i].value === selVal) { selText = norm[i].label; break; }
    }
    if (!selText && norm.length > 0 && selVal === "") {
      selText = norm[0].label;
      selVal = norm[0].value;
      if (registry[id]) registry[id].value = selVal;
    }

    var cls = "searchable-combo" + (extraClass ? " " + extraClass : "");
    var ph = placeholder || "Type to search...";
    var attrs = extraAttrs || "";

    return '<div class="' + cls + '" id="combo-box-' + id + '" data-combo-id="' + id + '">' +
      '<input type="hidden" id="' + id + '" value="' + selVal + '" ' + attrs + ' />' +
      '<div class="combo-input-wrapper" id="combo-wrapper-' + id + '">' +
      '<input type="text" class="combo-search-input" id="combo-input-' + id + '" value="' + selText + '" placeholder="' + ph + '" autocomplete="off" oninput="UI_ComboBox.onSearchInput(\'' + id + '\', this.value)" onfocus="UI_ComboBox.openDropdown(\'' + id + '\')" onkeydown="UI_ComboBox.onKey(\'' + id + '\', event)" />' +
      '<span class="combo-chevron" onclick="UI_ComboBox.toggleDropdown(\'' + id + '\')">▼</span></div>' +
      '<div class="combo-dropdown" id="combo-dropdown-' + id + '"></div></div>';
  }

  function renderDropdownOptions(id, filterText) {
    var dd = document.getElementById("combo-dropdown-" + id);
    if (!dd || !registry[id]) return;

    var items = registry[id].items || [];
    var currentVal = registry[id].value;
    var query = (filterText || "").toLowerCase().trim();
    var matches = [];

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!query || it.label.toLowerCase().indexOf(query) !== -1 || it.value.toLowerCase().indexOf(query) !== -1) {
        matches.push(it);
      }
    }

    if (matches.length === 0) {
      dd.innerHTML = '<div class="combo-no-match">No matching options</div>';
      activeHighlights[id] = -1;
      return;
    }

    activeHighlights[id] = 0;
    var html = [];
    for (var m = 0; m < matches.length; m++) {
      var opt = matches[m];
      var isSel = (opt.value === currentVal);
      var cls = "combo-option" + (isSel ? " selected" : "") + (m === 0 ? " highlighted" : "");
      var safeVal = opt.value.replace(/'/g, "\\'");
      var safeLabel = opt.label.replace(/'/g, "\\'");
      html.push('<div class="' + cls + '" data-val="' + opt.value + '" onmousedown="UI_ComboBox.selectOption(\'' + id + '\', \'' + safeVal + '\', \'' + safeLabel + '\')">' + opt.label + '</div>');
    }
    dd.innerHTML = html.join("");
  }

  function openDropdown(id) {
    closeAll(id);
    var dd = document.getElementById("combo-dropdown-" + id);
    var wrap = document.getElementById("combo-wrapper-" + id);
    if (!dd || !wrap) return;
    renderDropdownOptions(id, "");
    dd.className = "combo-dropdown open";
    wrap.className = "combo-input-wrapper is-open";
  }

  function closeDropdown(id) {
    var dd = document.getElementById("combo-dropdown-" + id);
    var wrap = document.getElementById("combo-wrapper-" + id);
    if (dd) dd.className = "combo-dropdown";
    if (wrap) wrap.className = "combo-input-wrapper";
  }

  function closeAll(exceptId) {
    for (var k in registry) {
      if (registry.hasOwnProperty(k) && k !== exceptId) closeDropdown(k);
    }
  }

  function toggleDropdown(id) {
    var dd = document.getElementById("combo-dropdown-" + id);
    if (dd && dd.className.indexOf("open") !== -1) {
      closeDropdown(id);
    } else {
      openDropdown(id);
      var input = document.getElementById("combo-input-" + id);
      if (input) input.select();
    }
  }

  function onSearchInput(id, query) {
    var dd = document.getElementById("combo-dropdown-" + id);
    var wrap = document.getElementById("combo-wrapper-" + id);
    if (dd && dd.className.indexOf("open") === -1) {
      dd.className = "combo-dropdown open";
      if (wrap) wrap.className = "combo-input-wrapper is-open";
    }
    renderDropdownOptions(id, query);
  }

  function selectOption(id, val, label) {
    if (!registry[id]) return;
    registry[id].value = String(val);

    var hidden = document.getElementById(id);
    if (hidden) {
      hidden.value = String(val);
      if (hidden.onchange) hidden.onchange();
    }

    var textInput = document.getElementById("combo-input-" + id);
    if (textInput) textInput.value = String(label);

    closeDropdown(id);
    if (typeof registry[id].onSelect === "function") {
      registry[id].onSelect(val, label);
    }
  }

  function onKey(id, e) {
    e = e || window.event;
    var dd = document.getElementById("combo-dropdown-" + id);
    if (!dd) return;
    if (e.keyCode === 27) { closeDropdown(id); return; }

    if (dd.className.indexOf("open") === -1) {
      if (e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 13) { openDropdown(id); return; }
    }

    var opts = dd.getElementsByTagName("div");
    if (!opts || opts.length === 0) return;
    var cur = activeHighlights[id] !== undefined ? activeHighlights[id] : 0;

    if (e.keyCode === 40) { // Down
      cur = (cur + 1) % opts.length;
      updateHighlight(opts, cur);
      activeHighlights[id] = cur;
      if (e.preventDefault) e.preventDefault();
    } else if (e.keyCode === 38) { // Up
      cur = (cur - 1 + opts.length) % opts.length;
      updateHighlight(opts, cur);
      activeHighlights[id] = cur;
      if (e.preventDefault) e.preventDefault();
    } else if (e.keyCode === 13) { // Enter
      if (opts[cur]) {
        var optVal = opts[cur].getAttribute("data-val");
        var optTxt = opts[cur].innerText || opts[cur].textContent;
        if (optVal !== null) selectOption(id, optVal, optTxt);
      }
      if (e.preventDefault) e.preventDefault();
    }
  }

  function updateHighlight(opts, idx) {
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].className.indexOf("combo-no-match") !== -1) continue;
      if (i === idx) {
        if (opts[i].className.indexOf("highlighted") === -1) opts[i].className += " highlighted";
      } else {
        opts[i].className = opts[i].className.replace(/\bhighlighted\b/g, "").trim();
      }
    }
  }

  function populate(elOrId, items, selectedValue) {
    var id = typeof elOrId === "string" ? elOrId : (elOrId && elOrId.id ? elOrId.id : "");
    if (!id) return;
    var norm = normalizeItems(items);
    var selVal = selectedValue !== undefined && selectedValue !== null ? String(selectedValue) : (norm.length > 0 ? norm[0].value : "");
    var selLabel = "";
    for (var i = 0; i < norm.length; i++) {
      if (norm[i].value === selVal) { selLabel = norm[i].label; break; }
    }
    register(id, norm, selVal);
    var hidden = document.getElementById(id);
    if (hidden) hidden.value = selVal;
    var textInput = document.getElementById("combo-input-" + id);
    if (textInput) textInput.value = selLabel;
  }

  function getValue(elOrId) {
    var id = typeof elOrId === "string" ? elOrId : (elOrId && elOrId.id ? elOrId.id : "");
    var hidden = document.getElementById(id);
    return hidden ? hidden.value : (registry[id] ? registry[id].value : "");
  }

  function setValue(elOrId, val) {
    var id = typeof elOrId === "string" ? elOrId : (elOrId && elOrId.id ? elOrId.id : "");
    var strVal = String(val);
    if (!registry[id]) return;
    registry[id].value = strVal;
    var label = strVal;
    for (var i = 0; i < registry[id].items.length; i++) {
      if (registry[id].items[i].value === strVal) { label = registry[id].items[i].label; break; }
    }
    var hidden = document.getElementById(id);
    if (hidden) hidden.value = strVal;
    var textInput = document.getElementById("combo-input-" + id);
    if (textInput) textInput.value = label;
  }

  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("click", function (e) {
      e = e || window.event;
      var target = e.target || e.srcElement;
      while (target && target !== document.body) {
        if (target.className && target.className.indexOf && target.className.indexOf("searchable-combo") !== -1) return;
        target = target.parentNode;
      }
      closeAll();
    });
  }

  return {
    register: register, renderHtml: renderHtml, openDropdown: openDropdown,
    closeDropdown: closeDropdown, closeAll: closeAll, toggleDropdown: toggleDropdown,
    onSearchInput: onSearchInput, selectOption: selectOption, onKey: onKey,
    populate: populate, getValue: getValue, setValue: setValue
  };
})();
