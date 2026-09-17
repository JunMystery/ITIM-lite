/* ==========================================================================
   ITIM-lite - Unified Search Bar & Filter Dialog Controller
   Pure ES5 for Windows HTA / IE11 compatibility
   ========================================================================== */

var UI_FilterBar = (function () {
  var configs = {};
  var state = {};
  var debounceTimer = null;
  var activeDialogViewId = null;

  function init(viewId, config) {
    configs[viewId] = config || {};
    if (!state[viewId]) {
      state[viewId] = { search: "", filters: {} };
    }
  }

  function getCriteria(viewId) {
    if (!state[viewId]) state[viewId] = { search: "", filters: {} };
    return {
      search: state[viewId].search || "",
      filters: state[viewId].filters || {}
    };
  }

  function countActive(viewId) {
    var filters = (state[viewId] && state[viewId].filters) ? state[viewId].filters : {};
    var count = 0;
    for (var k in filters) {
      if (filters.hasOwnProperty(k)) {
        var v = filters[k];
        if (v !== undefined && v !== null && v !== "" && v !== "all") count++;
      }
    }
    return count;
  }

  function render(containerId, viewId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var cfg = configs[viewId] || {};
    var ph = cfg.placeholder || "Search items...";
    var curSearch = (state[viewId] && state[viewId].search) ? state[viewId].search : "";
    var cnt = countActive(viewId);

    var html = '<div class="table-toolbar">' +
      '<div class="toolbar-search-wrap">' +
        '<span class="search-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>' +
        '<input type="text" class="toolbar-search-input" id="search-input-' + viewId + '" placeholder="' + ph + '" value="' + curSearch.replace(/"/g, "&quot;") + '" oninput="UI_FilterBar.onInput(\'' + viewId + '\', this.value)" onkeydown="UI_FilterBar.onKeyDown(event, \'' + viewId + '\')" />' +
        '<button type="button" class="toolbar-search-clear" id="search-clear-' + viewId + '" style="' + (curSearch ? 'display:block;' : 'display:none;') + '" onclick="UI_FilterBar.clearSearch(\'' + viewId + '\')">✕</button>' +
      '</div>' +
      '<button type="button" class="toolbar-btn-filter" onclick="UI_FilterBar.openDialog(\'' + viewId + '\')">' +
        '<span>Filter</span>' +
        '<span class="filter-badge" id="filter-badge-' + viewId + '" style="' + (cnt > 0 ? 'display:inline-block;' : 'display:none;') + '">' + cnt + '</span>' +
      '</button>' +
      '<button type="button" class="toolbar-btn-reset" id="filter-reset-' + viewId + '" style="' + (cnt > 0 ? 'display:inline-flex;' : 'display:none;') + '" onclick="UI_FilterBar.resetFilters(\'' + viewId + '\')">Reset Filters</button>' +
      '<div class="filter-active-pills" id="filter-pills-' + viewId + '">' + renderPills(viewId) + '</div>' +
    '</div>';

    el.innerHTML = html;
  }

  function renderPills(viewId) {
    var cfg = configs[viewId];
    if (!cfg || !cfg.fields) return "";
    var filters = (state[viewId] && state[viewId].filters) ? state[viewId].filters : {};
    var pills = [];
    for (var i = 0; i < cfg.fields.length; i++) {
      var f = cfg.fields[i];
      var v = filters[f.id];
      if (v !== undefined && v !== null && v !== "" && v !== "all") {
        var displayVal = v;
        if (f.options) {
          for (var o = 0; o < f.options.length; o++) {
            if (f.options[o].value === v) { displayVal = f.options[o].label; break; }
          }
        }
        pills.push('<span class="filter-pill">' + f.label + ': ' + displayVal + ' <span class="filter-pill-remove" onclick="UI_FilterBar.removeField(\'' + viewId + '\', \'' + f.id + '\')">✕</span></span>');
      }
    }
    return pills.join("");
  }

  function onInput(viewId, val) {
    var clearBtn = document.getElementById("search-clear-" + viewId);
    if (clearBtn) clearBtn.style.display = val ? "block" : "none";
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      if (!state[viewId]) state[viewId] = { search: "", filters: {} };
      state[viewId].search = val.trim();
      notify(viewId);
    }, 250);
  }

  function onKeyDown(e, viewId) {
    e = e || window.event;
    if (e.keyCode === 13) {
      if (debounceTimer) clearTimeout(debounceTimer);
      var input = document.getElementById("search-input-" + viewId);
      if (input) {
        if (!state[viewId]) state[viewId] = { search: "", filters: {} };
        state[viewId].search = input.value.trim();
        notify(viewId);
      }
    }
  }

  function clearSearch(viewId) {
    var input = document.getElementById("search-input-" + viewId);
    if (input) input.value = "";
    var clearBtn = document.getElementById("search-clear-" + viewId);
    if (clearBtn) clearBtn.style.display = "none";
    if (!state[viewId]) state[viewId] = { search: "", filters: {} };
    state[viewId].search = "";
    notify(viewId);
  }

  function openDialog(viewId) {
    activeDialogViewId = viewId;
    var cfg = configs[viewId];
    if (!cfg || !cfg.fields) return;

    var host = document.getElementById("modal-host") || document.body;
    var curFilters = (state[viewId] && state[viewId].filters) ? state[viewId].filters : {};

    var fieldsHtml = [];
    for (var i = 0; i < cfg.fields.length; i++) {
      var f = cfg.fields[i];
      var curVal = (curFilters[f.id] !== undefined) ? curFilters[f.id] : (f.defaultValue || "all");
      var inputHtml = "";
      if (f.type === "select") {
        inputHtml = (typeof UI_ComboBox !== "undefined")
          ? UI_ComboBox.renderHtml("modal-filter-" + f.id, f.options, curVal)
          : '<select class="form-select combo-box" id="modal-filter-' + f.id + '">' + (f.options || []).map(function(o){ return '<option value="' + o.value + '">' + o.label + '</option>'; }).join("") + '</select>';
      } else if (f.type === "date") {
        inputHtml = '<input type="date" class="form-input" id="modal-filter-' + f.id + '" value="' + (curVal === "all" ? "" : curVal) + '" />';
      } else {
        inputHtml = '<input type="text" class="form-input" id="modal-filter-' + f.id + '" value="' + (curVal === "all" ? "" : curVal) + '" placeholder="' + (f.placeholder || "") + '" />';
      }
      fieldsHtml.push('<div class="form-group"><label class="form-label">' + f.label + ':</label>' + inputHtml + '</div>');
    }

    var div = document.createElement("div");
    div.id = "filter-modal-dialog";
    div.className = "modal-backdrop open";
    div.onclick = function (e) {
      e = e || window.event;
      if ((e.target || e.srcElement) === div) closeDialog();
    };

    div.innerHTML = '<div class="modal modal-secondary" style="width:66vw; max-width:92vw;">' +
      '<div class="modal-header"><h3>Filter ' + (cfg.title || "Items") + '</h3><button type="button" class="btn btn-sm" onclick="UI_FilterBar.closeDialog()">✕</button></div>' +
      '<div class="modal-body"><div class="filter-dialog-grid">' + fieldsHtml.join("") + '</div></div>' +
      '<div class="modal-footer"><button type="button" class="btn" onclick="UI_FilterBar.resetModalInputs()">Reset</button><button type="button" class="btn btn-primary" onclick="UI_FilterBar.applyDialog()">Apply Filters</button></div>' +
    '</div>';

    var existing = document.getElementById("filter-modal-dialog");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    host.appendChild(div);
  }

  function closeDialog() {
    var modal = document.getElementById("filter-modal-dialog");
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    activeDialogViewId = null;
  }

  function resetModalInputs() {
    var viewId = activeDialogViewId;
    if (!viewId || !configs[viewId]) return;
    var fields = configs[viewId].fields || [];
    for (var i = 0; i < fields.length; i++) {
      var defVal = fields[i].defaultValue || (fields[i].type === "select" ? "all" : "");
      if (fields[i].type === "select" && typeof UI_ComboBox !== "undefined") {
        UI_ComboBox.setValue("modal-filter-" + fields[i].id, defVal);
      } else {
        var el = document.getElementById("modal-filter-" + fields[i].id);
        if (el) el.value = defVal;
      }
    }
  }

  function applyDialog() {
    var viewId = activeDialogViewId;
    if (!viewId || !configs[viewId]) return;
    var fields = configs[viewId].fields || [];
    var newFilters = {};
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var el = document.getElementById("modal-filter-" + f.id);
      var v = ((typeof UI_ComboBox !== "undefined" ? UI_ComboBox.getValue("modal-filter-" + f.id) : "") || (el ? el.value : "")).trim();
      if (v && v !== "all") newFilters[f.id] = v;
    }
    if (!state[viewId]) state[viewId] = { search: "", filters: {} };
    state[viewId].filters = newFilters;
    closeDialog();
    updateToolbarUI(viewId);
    notify(viewId);
  }

  function resetFilters(viewId) {
    if (state[viewId]) state[viewId].filters = {};
    updateToolbarUI(viewId);
    notify(viewId);
  }

  function removeField(viewId, fieldId) {
    if (state[viewId] && state[viewId].filters) {
      delete state[viewId].filters[fieldId];
      updateToolbarUI(viewId);
      notify(viewId);
    }
  }

  function updateToolbarUI(viewId) {
    var cnt = countActive(viewId);
    var badge = document.getElementById("filter-badge-" + viewId);
    if (badge) {
      badge.innerText = cnt;
      badge.style.display = cnt > 0 ? "inline-block" : "none";
    }
    var resetBtn = document.getElementById("filter-reset-" + viewId);
    if (resetBtn) resetBtn.style.display = cnt > 0 ? "inline-flex" : "none";
    var pills = document.getElementById("filter-pills-" + viewId);
    if (pills) pills.innerHTML = renderPills(viewId);
  }

  function notify(viewId) {
    var cfg = configs[viewId];
    if (cfg && typeof cfg.onFilter === "function") {
      cfg.onFilter(getCriteria(viewId));
    }
  }

  return {
    init: init,
    render: render,
    getCriteria: getCriteria,
    onInput: onInput,
    onKeyDown: onKeyDown,
    clearSearch: clearSearch,
    openDialog: openDialog,
    closeDialog: closeDialog,
    resetModalInputs: resetModalInputs,
    applyDialog: applyDialog,
    resetFilters: resetFilters,
    removeField: removeField
  };
})();
