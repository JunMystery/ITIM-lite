/* ==========================================================================
   ITIM-lite - Unified Multi-Item Picker Component
   Supports Hardware Assets, Consumables, and Software Licenses
   ========================================================================== */

var UI_ItemPicker = (function () {
  var instances = {};

  function createInstance(containerId, opts) {
    opts = opts || {};
    var currentTab = opts.initialTab || "asset";
    var items = [];

    function getItems() { return items.slice(0); }

    function setItems(newItems) {
      items = (newItems || []).slice(0);
      renderTable();
      if (opts.onChange) opts.onChange(items);
    }

    function addItem(type, id, qty) {
      if (!id) return;
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
      var record = { itemType: type, id: id, quantity: qty || 1 };
      if (type === "asset" && typeof InventoryService !== "undefined") {
        var a = InventoryService.getById(id);
        if (a) { record.name = a.name; record.serial = a.serial || ""; record.category = a.category || ""; }
      } else if (type === "consumable" && typeof ConsumablesService !== "undefined") {
        var c = ConsumablesService.getById(id);
        if (c) { record.name = c.name; record.category = c.category || ""; record.maxQuantity = c.quantity || 0; record.quantity = Math.min(record.maxQuantity, qty || 1); }
      } else if (type === "license" && typeof LicensesService !== "undefined") {
        var l = LicensesService.getById(id);
        if (l) { record.name = l.software; record.category = l.vendor || ""; record.quantity = 1; }
      }
      items.push(record);
      renderTable();
      if (opts.onChange) opts.onChange(items);
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

    function setTab(tab) {
      currentTab = tab;
      renderControls();
    }

    function renderControls() {
      var ctrlBox = document.getElementById(containerId + "-controls");
      if (!ctrlBox) return;

      var tAsset = (typeof I18N !== "undefined" ? I18N.t("tab_hardware") : "Hardware Assets");
      var tCon = (typeof I18N !== "undefined" ? I18N.t("tab_consumables") : "Consumables");
      var tLic = (typeof I18N !== "undefined" ? I18N.t("tab_software") : "Software");

      var tabsHtml = '<div style="display:flex; gap:4px; margin-bottom:8px; border-bottom:1px solid var(--border-subtle); padding-bottom:4px;">' +
        '<button type="button" class="btn btn-sm ' + (currentTab === "asset" ? "btn-primary" : "") + '" onclick="UI_ItemPicker.getInstance(\'' + containerId + '\').setTab(\'asset\')">' + tAsset + '</button>' +
        '<button type="button" class="btn btn-sm ' + (currentTab === "consumable" ? "btn-primary" : "") + '" onclick="UI_ItemPicker.getInstance(\'' + containerId + '\').setTab(\'consumable\')">' + tCon + '</button>' +
        '<button type="button" class="btn btn-sm ' + (currentTab === "license" ? "btn-primary" : "") + '" onclick="UI_ItemPicker.getInstance(\'' + containerId + '\').setTab(\'license\')">' + tLic + '</button>' +
      '</div>';

      var formHtml = "";
      if (currentTab === "asset") {
        var assets = (typeof InventoryService !== "undefined") ? InventoryService.getAll() : [];
        var optsHtml = '<option value="">-- ' + (typeof I18N !== "undefined" ? I18N.t("select_asset") : "Select Hardware Asset") + ' --</option>';
        for (var i = 0; i < assets.length; i++) {
          var a = assets[i];
          if (a.status !== "retired") {
            optsHtml += '<option value="' + a.id + '">' + a.id + ' - ' + a.name + ' (' + a.status + ')</option>';
          }
        }
        formHtml = '<div style="display:flex; gap:6px; align-items:center;">' +
          '<select id="' + containerId + '-asset-sel" class="form-select" style="flex:1;">' + optsHtml + '</select>' +
          '<button type="button" class="btn btn-sm btn-primary" onclick="UI_ItemPicker.getInstance(\'' + containerId + '\').onAddAsset()">+ ' + (typeof I18N !== "undefined" ? I18N.t("btn_add") : "Add") + '</button>' +
        '</div>';
      } else if (currentTab === "consumable") {
        var cons = (typeof ConsumablesService !== "undefined") ? ConsumablesService.getAll() : [];
        var cOpts = '<option value="">-- ' + (typeof I18N !== "undefined" ? I18N.t("select_consumable") : "Select Consumable") + ' --</option>';
        for (var j = 0; j < cons.length; j++) {
          var c = cons[j];
          if (c.quantity > 0) {
            cOpts += '<option value="' + c.id + '">' + c.id + ' - ' + c.name + ' (Stock: ' + c.quantity + ')</option>';
          }
        }
        formHtml = '<div style="display:flex; gap:6px; align-items:center;">' +
          '<select id="' + containerId + '-con-sel" class="form-select" style="flex:1;">' + cOpts + '</select>' +
          '<input type="number" id="' + containerId + '-con-qty" class="form-input" value="1" min="1" style="width:65px;" title="Quantity" />' +
          '<button type="button" class="btn btn-sm btn-primary" onclick="UI_ItemPicker.getInstance(\'' + containerId + '\').onAddConsumable()">+ ' + (typeof I18N !== "undefined" ? I18N.t("btn_add") : "Add") + '</button>' +
        '</div>';
      } else if (currentTab === "license") {
        var lics = (typeof LicensesService !== "undefined") ? LicensesService.getAll() : [];
        var lOpts = '<option value="">-- ' + (typeof I18N !== "undefined" ? I18N.t("select_license") : "Select Software") + ' --</option>';
        for (var k = 0; k < lics.length; k++) {
          var l = lics[k];
          var avail = Math.max(0, (l.totalSeats || 0) - (l.assignedSeats || 0));
          lOpts += '<option value="' + l.id + '">' + l.id + ' - ' + l.software + ' (' + avail + ' seats free)</option>';
        }
        formHtml = '<div style="display:flex; gap:6px; align-items:center;">' +
          '<select id="' + containerId + '-lic-sel" class="form-select" style="flex:1;">' + lOpts + '</select>' +
          '<button type="button" class="btn btn-sm btn-primary" onclick="UI_ItemPicker.getInstance(\'' + containerId + '\').onAddLicense()">+ ' + (typeof I18N !== "undefined" ? I18N.t("btn_add") : "Add") + '</button>' +
        '</div>';
      }

      ctrlBox.innerHTML = tabsHtml + formHtml;
    }

    function renderTable() {
      var tableBox = document.getElementById(containerId + "-table");
      if (!tableBox) return;

      if (items.length === 0) {
        tableBox.innerHTML = '<div style="text-align:center; padding:10px; font-size:11px; color:var(--text-tertiary); background:var(--bg-surface-secondary); border-radius:4px; border:1px dashed var(--border-subtle);">' +
          (typeof I18N !== "undefined" ? I18N.t("no_items_selected") : "No items selected yet. Use tabs above to add equipment, consumables, or software.") +
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

        rows.push('<tr>' +
          '<td style="width:70px;">' + badge + '</td>' +
          '<td><strong>' + (it.name || it.id) + '</strong><br><span style="font-family:var(--font-mono); font-size:10px; color:var(--text-secondary);">' + it.id + (it.serial ? ' | ' + it.serial : '') + '</span></td>' +
          '<td style="text-align:center; width:65px;">' + qtyControl + '</td>' +
          '<td style="text-align:right; width:35px;"><button type="button" class="btn btn-sm" onclick="UI_ItemPicker.getInstance(\'' + containerId + '\').removeItem(' + i + ')" style="color:#d13438; padding:1px 5px;">✕</button></td>' +
        '</tr>');
      }

      tableBox.innerHTML = '<div style="max-height:140px; overflow-y:auto; border:1px solid var(--border-subtle); border-radius:4px; margin-top:6px;">' +
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
      init: init,
      setTab: setTab,
      getItems: getItems,
      setItems: setItems,
      addItem: addItem,
      removeItem: removeItem,
      updateQty: updateQty,
      clear: function () { setItems([]); },
      onAddAsset: function () {
        var sel = document.getElementById(containerId + "-asset-sel");
        if (sel && sel.value) { addItem("asset", sel.value); sel.value = ""; }
      },
      onAddConsumable: function () {
        var sel = document.getElementById(containerId + "-con-sel");
        var qtyInput = document.getElementById(containerId + "-con-qty");
        var qty = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;
        if (sel && sel.value) { addItem("consumable", sel.value, qty); sel.value = ""; if (qtyInput) qtyInput.value = "1"; }
      },
      onAddLicense: function () {
        var sel = document.getElementById(containerId + "-lic-sel");
        if (sel && sel.value) { addItem("license", sel.value, 1); sel.value = ""; }
      }
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
