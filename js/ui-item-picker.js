/* ==========================================================================
   ITIM-lite - Unified Multi-Item Picker Component
   Live Typeahead Search (Name, SN, ID) with Keyboard Navigation & Single-Match Enter
   Pure ES5 for Windows HTA / IE11 compatibility (< 250 LOC)
   ========================================================================== */

var UI_ItemPicker = (function () {
  var instances = {};

  function createInstance(containerId, opts) {
    opts = opts || {};
    var items = [];
    var currentMatches = [];
    var highlightedIndex = -1;

    function getItems() { return items.slice(0); }

    function setItems(newItems) {
      items = (newItems || []).slice(0);
      renderTable();
      if (opts.onChange) opts.onChange(items);
    }

    function addItem(type, id, qty) {
      if (!id) return;
      var cObj = (type === "consumable" && typeof ConsumablesService !== "undefined") ? ConsumablesService.getById(id) : null;
      var isConsSerialized = !!(cObj && (cObj.isSerialized || (cObj.serials && cObj.serials.length)));

      if (!isConsSerialized) {
        for (var i = 0; i < items.length; i++) {
          if (items[i].id === id && items[i].itemType === type) {
            if (type === "consumable") {
              items[i].quantity = Math.min(items[i].maxQuantity || 999, (items[i].quantity || 1) + (qty || 1));
              renderTable();
              if (opts.onChange) opts.onChange(items);
            }
            return;
          }
        }
      }

      var record = { itemType: type, id: id, quantity: qty || 1, serial: "" };
      if (type === "asset" && typeof InventoryService !== "undefined") {
        var a = InventoryService.getById(id);
        if (a) { record.name = a.name; record.serial = a.serial || ""; record.category = a.category || ""; }
      } else if (type === "consumable" && cObj) {
        record.name = cObj.name;
        record.category = cObj.category || "";
        record.maxQuantity = cObj.quantity || 0;
        record.isSerialized = isConsSerialized;
        record.serialsPool = cObj.serials || [];
        record.quantity = isConsSerialized ? 1 : Math.min(record.maxQuantity, qty || 1);
      } else if (type === "license" && typeof LicensesService !== "undefined") {
        var l = LicensesService.getById(id);
        if (l) { record.name = l.software; record.category = l.vendor || ""; record.quantity = 1; }
      }
      items.push(record);
      renderTable();
      if (opts.onChange) opts.onChange(items);
    }

    function updateSerial(index, val) {
      if (items[index]) {
        items[index].serial = (val || "").trim();
        if (opts.onChange) opts.onChange(items);
      }
    }

    function removeItem(index) {
      if (index >= 0 && index < items.length) {
        items.splice(index, 1);
        renderTable();
        if (opts.onChange) opts.onChange(items);
      }
    }

    function updateQty(index, qty) {
      if (items[index] && items[index].itemType === "consumable") {
        var n = parseInt(qty, 10) || 1;
        items[index].quantity = Math.max(1, Math.min(items[index].maxQuantity || 999, n));
        renderTable();
        if (opts.onChange) opts.onChange(items);
      }
    }

    function getAllCandidates() {
      var pool = [];
      if (typeof InventoryService !== "undefined") {
        var assets = InventoryService.getAll();
        for (var a = 0; a < assets.length; a++) {
          var ast = assets[a];
          if (ast.status !== "retired") {
            pool.push({
              itemType: "asset", id: ast.id, name: ast.name, serial: ast.serial || "",
              category: ast.category || "", status: ast.status,
              searchStr: (ast.id + " " + ast.name + " " + (ast.serial || "") + " " + (ast.model || "") + " " + (ast.category || "")).toLowerCase()
            });
          }
        }
      }
      if (typeof ConsumablesService !== "undefined") {
        var cons = ConsumablesService.getAll();
        for (var c = 0; c < cons.length; c++) {
          var con = cons[c], snStr = "";
          if (con.serials && con.serials.length) {
            for (var s = 0; s < con.serials.length; s++) snStr += " " + (typeof con.serials[s] === "string" ? con.serials[s] : con.serials[s].sn);
          }
          pool.push({
            itemType: "consumable", id: con.id, name: con.name, category: con.category || "",
            stock: con.quantity || 0, maxQuantity: con.quantity || 0,
            searchStr: (con.id + " " + con.name + " " + (con.category || "") + " " + (con.location || "") + snStr).toLowerCase()
          });
        }
      }
      if (typeof LicensesService !== "undefined") {
        var lics = LicensesService.getAll();
        for (var l = 0; l < lics.length; l++) {
          var lic = lics[l];
          pool.push({
            itemType: "license", id: lic.id, name: lic.software, vendor: lic.vendor || "", key: lic.key || "",
            searchStr: (lic.id + " " + lic.software + " " + (lic.vendor || "") + " " + (lic.key || "")).toLowerCase()
          });
        }
      }
      return pool;
    }

    function onSearch(val) {
      var sug = document.getElementById(containerId + "-suggestions");
      if (!sug) return;
      var q = (val || "").trim().toLowerCase();
      if (!q) { currentMatches = []; highlightedIndex = -1; sug.style.display = "none"; return; }
      currentMatches = getAllCandidates().filter(function (it) { return it.searchStr.indexOf(q) !== -1; });
      highlightedIndex = -1;
      renderSuggestions();
    }

    function renderSuggestions() {
      var sug = document.getElementById(containerId + "-suggestions");
      if (!sug) return;
      if (!currentMatches.length) {
        sug.innerHTML = '<div style="padding:10px 14px; font-size:12px; color:var(--text-tertiary);">No matching equipment, consumables, or software.</div>';
        sug.style.display = "block";
        return;
      }
      var html = [];
      for (var i = 0; i < currentMatches.length; i++) {
        var it = currentMatches[i], isHi = (i === highlightedIndex);
        var typeBadge = (it.itemType === "asset")
          ? '<span class="badge" style="background:rgba(0,120,212,0.12); color:#0078d4; font-size:10px;">Hardware</span>'
          : ((it.itemType === "consumable")
            ? '<span class="badge" style="background:rgba(180,90,0,0.12); color:#b45a00; font-size:10px;">Stock</span>'
            : '<span class="badge" style="background:rgba(16,124,65,0.12); color:#107c41; font-size:10px;">Software</span>');

        var subInfo = it.serial ? ('SN: ' + it.serial) : (it.itemType === "consumable" ? ('Stock: ' + it.stock) : (it.vendor || ""));

        html.push('<div class="picker-sug-item" style="padding:7px 12px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f3f4f6;' + (isHi ? ' background:#e0f0ff;' : '') + '" onclick="UI_ItemPicker.getInstance(\'' + containerId + '\').selectMatch(' + i + ')">' +
          '<div>' +
            '<span style="font-family:var(--font-mono); font-weight:700; font-size:12px; margin-right:6px;">' + it.id + '</span>' +
            '<strong>' + it.name + '</strong>' +
            '<span style="margin-left:8px;">' + typeBadge + '</span>' +
            (subInfo ? '<span style="font-size:11px; color:var(--text-secondary); margin-left:8px;">(' + subInfo + ')</span>' : '') +
          '</div>' +
          '<button type="button" class="btn btn-sm btn-primary" style="padding:1px 8px; font-size:11px;">+ Pick</button>' +
        '</div>');
      }
      sug.innerHTML = html.join("");
      sug.style.display = "block";
    }

    function onKeyDown(e) {
      e = e || window.event;
      if (e.keyCode === 40) { // Arrow Down
        if (currentMatches.length > 0) {
          highlightedIndex = (highlightedIndex + 1) % currentMatches.length;
          renderSuggestions();
          if (e.preventDefault) e.preventDefault();
        }
      } else if (e.keyCode === 38) { // Arrow Up
        if (currentMatches.length > 0) {
          highlightedIndex = (highlightedIndex - 1 + currentMatches.length) % currentMatches.length;
          renderSuggestions();
          if (e.preventDefault) e.preventDefault();
        }
      } else if (e.keyCode === 13) { // Enter
        if (e.preventDefault) e.preventDefault();
        if (highlightedIndex >= 0 && currentMatches[highlightedIndex]) {
          selectMatch(highlightedIndex);
        } else if (currentMatches.length === 1) {
          selectMatch(0);
        } else if (currentMatches.length > 1) {
          if (typeof Notifications !== "undefined") {
            Notifications.show(currentMatches.length + " items matched. Use arrow keys or click to select.", "warning");
          }
        }
      } else if (e.keyCode === 27) { // Escape
        closeSuggestions();
      }
    }

    function selectMatch(idx) {
      if (idx < 0 || idx >= currentMatches.length) return;
      var it = currentMatches[idx];
      addItem(it.itemType, it.id, 1);
      closeSuggestions();
      var input = document.getElementById(containerId + "-search-input");
      if (input) { input.value = ""; input.focus(); }
    }

    function closeSuggestions() {
      var sug = document.getElementById(containerId + "-suggestions");
      if (sug) sug.style.display = "none";
      currentMatches = [];
      highlightedIndex = -1;
    }

    function clearSearch() {
      var input = document.getElementById(containerId + "-search-input");
      if (input) { input.value = ""; input.focus(); }
      closeSuggestions();
    }

    function renderControls() {
      var ctrlBox = document.getElementById(containerId + "-controls");
      if (!ctrlBox) return;
      ctrlBox.innerHTML = '<div style="position:relative; margin-bottom:8px;">' +
        '<div style="display:flex; gap:6px; align-items:center;">' +
          '<input type="text" id="' + containerId + '-search-input" class="form-input" placeholder="Type Name, Serial (SN), ID, or scan barcode..." autocomplete="off" style="flex:1; height:34px;" oninput="UI_ItemPicker.getInstance(\'' + containerId + '\').onSearch(this.value)" onkeydown="UI_ItemPicker.getInstance(\'' + containerId + '\').onKeyDown(event)" />' +
          '<button type="button" class="btn btn-sm" onclick="UI_ItemPicker.getInstance(\'' + containerId + '\').clearSearch()" title="Clear">✕</button>' +
        '</div>' +
        '<div id="' + containerId + '-suggestions" style="display:none; position:absolute; left:0; right:0; top:38px; max-height:220px; overflow-y:auto; z-index:1200; background:#fff; border:1px solid #d1d5db; border-radius:4px; box-shadow:0 6px 16px rgba(0,0,0,0.18);"></div>' +
      '</div>';
    }

    function renderTable() {
      var tableBox = document.getElementById(containerId + "-table");
      if (!tableBox) return;

      if (items.length === 0) {
        tableBox.innerHTML = '<div style="text-align:center; padding:12px; font-size:12px; color:var(--text-tertiary); background:var(--bg-surface-secondary); border-radius:4px; border:1px dashed var(--border-subtle);">' +
          (typeof I18N !== "undefined" ? I18N.t("no_items_selected") : "No items selected yet. Type Name, SN, or scan barcode above to add items.") +
        '</div>';
        return;
      }

      var rows = [];
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var badge = it.itemType === "asset" ? '<span class="badge badge-inuse">Asset</span>' :
          (it.itemType === "consumable" ? '<span class="badge badge-warning">Stock</span>' : '<span class="badge badge-available">License</span>');
        var qtyControl = it.itemType === "consumable"
          ? '<input type="number" min="1" max="' + (it.maxQuantity || 999) + '" value="' + (it.quantity || 1) + '" onchange="UI_ItemPicker.getInstance(\'' + containerId + '\').updateQty(' + i + ', this.value)" style="width:50px; font-size:11px; padding:1px 3px;" />'
          : '<span>1</span>';

        var descHtml = '<strong>' + (it.name || it.id) + '</strong><br><span style="font-family:var(--font-mono); font-size:10px; color:var(--text-secondary);">' + it.id + (it.serial && it.itemType === 'asset' ? ' | ' + it.serial : '') + '</span>';

        if (it.itemType === "consumable" && it.isSerialized) {
          var snDatalist = "";
          if (it.serialsPool && it.serialsPool.length) {
            var optsArr = [];
            for (var p = 0; p < it.serialsPool.length; p++) {
              var pSn = (typeof it.serialsPool[p] === "string") ? it.serialsPool[p] : it.serialsPool[p].sn;
              var pSt = (typeof it.serialsPool[p] === "object") ? it.serialsPool[p].status : "available";
              if (pSt !== "assigned") optsArr.push('<option value="' + pSn + '">' + pSn + ' (Ready)</option>');
            }
            if (optsArr.length) snDatalist = '<datalist id="' + containerId + '-sn-dl-' + i + '">' + optsArr.join("") + '</datalist>';
          }
          descHtml += '<div style="margin-top:4px; display:flex; align-items:center; gap:6px;">' +
            '<span style="font-size:11px; font-weight:700; color:#0078d4;">SN *:</span>' +
            '<input type="text" class="form-input" style="height:24px; font-size:11px; padding:2px 6px; font-family:var(--font-mono); width:170px; border:1px solid #0078d4; background:#f0f8ff;" placeholder="Input / Scan Serial No..." value="' + (it.serial || "") + '" oninput="UI_ItemPicker.getInstance(\'' + containerId + '\').updateSerial(' + i + ', this.value)" list="' + containerId + '-sn-dl-' + i + '" />' +
            snDatalist +
          '</div>';
        }

        var qtyControl = (it.itemType === "consumable" && !it.isSerialized)
          ? '<input type="number" min="1" max="' + (it.maxQuantity || 999) + '" value="' + (it.quantity || 1) + '" onchange="UI_ItemPicker.getInstance(\'' + containerId + '\').updateQty(' + i + ', this.value)" style="width:50px; font-size:11px; padding:1px 3px;" />'
          : '<span>' + (it.quantity || 1) + '</span>';

        rows.push('<tr>' +
          '<td style="width:70px;">' + badge + '</td>' +
          '<td>' + descHtml + '</td>' +
          '<td style="text-align:center; width:65px;">' + qtyControl + '</td>' +
          '<td style="text-align:right; width:35px;"><button type="button" class="btn btn-sm" onclick="UI_ItemPicker.getInstance(\'' + containerId + '\').removeItem(' + i + ')" style="color:#d13438; padding:1px 5px;">✕</button></td>' +
        '</tr>');
      }

      tableBox.innerHTML = '<div style="max-height:150px; overflow-y:auto; border:1px solid var(--border-subtle); border-radius:4px; margin-top:6px;">' +
        '<table class="data-table" style="font-size:11px; margin:0;">' +
          '<thead><tr><th>Type</th><th>Item Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;"></th></tr></thead>' +
          '<tbody>' + rows.join("") + '</tbody>' +
        '</table>' +
      '</div>';
    }

    function init() {
      var root = document.getElementById(containerId);
      if (!root) return;
      root.innerHTML = '<div id="' + containerId + '-controls"></div><div id="' + containerId + '-table"></div>';
      renderControls();
      renderTable();
    }

    return {
      init: init, getItems: getItems, setItems: setItems, addItem: addItem, removeItem: removeItem, updateQty: updateQty, updateSerial: updateSerial,
      clear: function () { setItems([]); }, onSearch: onSearch, onKeyDown: onKeyDown, selectMatch: selectMatch,
      closeSuggestions: closeSuggestions, clearSearch: clearSearch
    };
  }

  return {
    init: function (containerId, opts) {
      var inst = createInstance(containerId, opts);
      instances[containerId] = inst;
      inst.init();
      return inst;
    },
    getInstance: function (containerId) {
      return instances[containerId];
    }
  };
})();
