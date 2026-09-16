/* ==========================================================================
   ITIM-lite - Asset Modal & Tag Printing Controller
   ========================================================================== */

var UI_AssetModal = (function () {
  var editingId = null;

  function ensureModal() {
    if (document.getElementById("asset-modal")) return;
    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "asset-modal";
    div.className = "modal-backdrop";
    div.onclick = function (e) { e = e || window.event; if ((e.target || e.srcElement) === div) close(); };

    var statusHtml = UI_ComboBox.renderHtml("asset-input-status", [
      { value: "available", label: "Available" },
      { value: "inuse", label: "In Use" },
      { value: "repair", label: "In Repair" },
      { value: "retired", label: "Retired" }
    ], "available");

    var categoryHtml = UI_ComboBox.renderHtml("asset-input-category", [], "", "", 'onchange="UI_AssetModal.onCategoryChange()"');

    div.innerHTML = '<div class="modal" style="width:600px; max-width:92vw;">' +
      '<div class="modal-header"><h3 id="asset-modal-title">Create / Edit Asset</h3><button class="btn btn-sm" onclick="UI_AssetModal.close()">✕</button></div>' +
      '<div class="modal-body">' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Asset ID:</label><input type="text" id="asset-input-id" class="form-input" readonly /></div>' +
          '<div class="form-group"><label class="form-label">Status:</label>' + statusHtml + '</div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Asset Name *:</label><input type="text" id="asset-input-name" class="form-input" placeholder="e.g. Dell Latitude 5530" /></div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Category:</label>' + categoryHtml + '</div>' +
          '<div class="form-group"><label class="form-label">Serial Number:</label><input type="text" id="asset-input-serial" class="form-input" /></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Model &amp; Specs:</label><input type="text" id="asset-input-model" class="form-input" /></div>' +
        '<div id="asset-custom-fields-container"></div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Assigned To:</label><input type="text" id="asset-input-assigned" class="form-input" /></div>' +
          '<div class="form-group"><label class="form-label">Department:</label><input type="text" id="asset-input-dept" class="form-input" /></div>' +
          '<div class="form-group"><label class="form-label">Location:</label><input type="text" id="asset-input-loc" class="form-input" /></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Purchase Date:</label><input type="date" id="asset-input-purchase" class="form-input" /></div>' +
          '<div class="form-group"><label class="form-label">Warranty Expiry:</label><input type="date" id="asset-input-warranty" class="form-input" /></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Notes:</label><textarea id="asset-input-notes" class="form-textarea" rows="2"></textarea></div>' +
      '</div>' +
      '<div class="modal-footer"><button class="btn" onclick="UI_AssetModal.close()">Cancel</button><button class="btn btn-primary" onclick="UI_AssetModal.save()">Save Asset</button></div>' +
    '</div>';
    host.appendChild(div);
  }

  function renderCustomFields(categoryName, existingValues) {
    var container = document.getElementById("asset-custom-fields-container");
    if (!container) return;
    var values = existingValues || {};
    var cat = typeof CategoryService !== "undefined" ? CategoryService.getByName(categoryName) : null;
    var fields = (cat && cat.customFields) ? cat.customFields : [];
    if (fields.length === 0) {
      container.innerHTML = "";
      return;
    }

    var html = ['<div style="background:#f9fafb; padding:8px 10px; border-radius:4px; border:1px solid #e5e7eb; margin-bottom:12px;"><div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#666666; margin-bottom:6px;">Category Custom Specifications</div><div class="form-row" style="flex-wrap:wrap;">'];
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var v = (values[f.id] !== undefined) ? values[f.id] : "";
      var inp = '';
      if (f.type === "select") {
        inp = UI_ComboBox.renderHtml("asset-cf-" + f.id, f.options || [], v, "searchable-combo-sm", 'class="asset-custom-field" data-field-id="' + f.id + '"');
      } else {
        var itype = (f.type === "number" ? "number" : (f.type === "date" ? "date" : "text"));
        inp = '<input type="' + itype + '" id="asset-cf-' + f.id + '" class="form-input asset-custom-field" data-field-id="' + f.id + '" value="' + v + '" />';
      }
      html.push('<div class="form-group" style="min-width:160px; flex:1;"><label class="form-label" style="font-size:11px;">' + f.label + ':</label>' + inp + '</div>');
    }
    html.push('</div></div>');
    container.innerHTML = html.join("");
  }

  function onCategoryChange() {
    var catName = UI_ComboBox.getValue("asset-input-category");
    renderCustomFields(catName, null);
  }

  function open(id) {
    ensureModal();
    editingId = id || null;
    var modal = document.getElementById("asset-modal");
    var title = document.getElementById("asset-modal-title");

    var catItems = [];
    if (typeof CategoryService !== "undefined") {
      var dbCats = CategoryService.list("hardware");
      for (var i = 0; i < dbCats.length; i++) catItems.push({ value: dbCats[i].name, label: dbCats[i].name });
    }
    if (catItems.length === 0 && typeof ITIM_CONFIG !== "undefined") {
      for (var c = 0; c < ITIM_CONFIG.ASSET_CATEGORIES.length; c++) catItems.push({ value: ITIM_CONFIG.ASSET_CATEGORIES[c], label: ITIM_CONFIG.ASSET_CATEGORIES[c] });
    }

    if (!id) {
      if (typeof Notifications !== "undefined") Notifications.show("Direct asset creation forbidden. Adding items is only allowed via PO Inbound intake.", "error");
      if (typeof NavController !== "undefined") NavController.switchView("inbound");
      return;
    }

    var a = InventoryService.getById(id);
    if (!a) return;

    UI_ComboBox.populate("asset-input-category", catItems, a.category || "");
    UI_ComboBox.setValue("asset-input-status", a.status || "available");

    title.innerText = "Edit Asset (" + a.id + ")";
    document.getElementById("asset-input-id").value = a.id;
    document.getElementById("asset-input-name").value = a.name;
    document.getElementById("asset-input-serial").value = a.serial || "";
    document.getElementById("asset-input-model").value = a.model || "";
    document.getElementById("asset-input-assigned").value = a.assignedTo || "";
    document.getElementById("asset-input-dept").value = a.department || "";
    document.getElementById("asset-input-loc").value = a.location || "";
    document.getElementById("asset-input-purchase").value = a.purchaseDate || "";
    document.getElementById("asset-input-warranty").value = a.warrantyExpiry || "";
    document.getElementById("asset-input-notes").value = a.notes || "";

    renderCustomFields(a.category, a.customFields);
    modal.className = "modal-backdrop open";
  }

  function close() {
    var modal = document.getElementById("asset-modal");
    if (modal) modal.className = "modal-backdrop";
  }

  function save() {
    var id = document.getElementById("asset-input-id").value.trim();
    var name = document.getElementById("asset-input-name").value.trim();
    if (!name) {
      Notifications.show("Please enter an asset name.", "warning");
      return;
    }

    var customFields = {};
    var cfInputs = document.getElementsByClassName("asset-custom-field");
    for (var i = 0; i < cfInputs.length; i++) {
      var fId = cfInputs[i].getAttribute("data-field-id");
      if (fId) {
        var fVal = (cfInputs[i].tagName === "INPUT" || cfInputs[i].tagName === "SELECT")
          ? cfInputs[i].value : UI_ComboBox.getValue(cfInputs[i].id);
        if (fVal !== undefined && fVal !== "") customFields[fId] = fVal;
      }
    }

    var data = {
      id: id,
      name: name,
      category: UI_ComboBox.getValue("asset-input-category"),
      serial: document.getElementById("asset-input-serial").value.trim(),
      model: document.getElementById("asset-input-model").value.trim(),
      status: UI_ComboBox.getValue("asset-input-status"),
      assignedTo: document.getElementById("asset-input-assigned").value.trim(),
      department: document.getElementById("asset-input-dept").value.trim(),
      location: document.getElementById("asset-input-loc").value.trim(),
      purchaseDate: document.getElementById("asset-input-purchase").value,
      warrantyExpiry: document.getElementById("asset-input-warranty").value,
      notes: document.getElementById("asset-input-notes").value.trim(),
      customFields: customFields
    };

    if (editingId) {
      InventoryService.update(editingId, data);
      Notifications.show("Asset " + editingId + " updated successfully.", "success");
    } else {
      Notifications.show("Direct creation forbidden. Intake items via PO Inbound.", "error");
      return;
    }

    close();
    UI_Assets.render();
    NavController.updateBadges();
  }

  function printLabel(id) {
    var asset = InventoryService.getById(id);
    if (!asset) return;

    var org = (AppState.db.settings && AppState.db.settings.orgName) || "IT ASSET";
    var qrSvg = BarcodeQR.generateQrSvg(asset.id, 65);

    var printWindow = window.open("", "_blank", "width=420,height=300");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups to print asset labels.");
      return;
    }

    var html = "<!DOCTYPE html><html><head><title>Print Asset Tag - " + asset.id + "</title>" +
      "<style>body { margin: 10px; font-family: Arial, sans-serif; } .tag { width: 280px; padding: 10px 14px; border: 2px solid #000; border-radius: 4px; display: flex; align-items: center; gap: 12px; } .info { display: flex; flex-direction: column; gap: 2px; } .org { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #444; } .id { font-size: 16px; font-weight: 800; } .name { font-size: 11px; font-weight: 600; } .sn { font-size: 10px; color: #555; }</style></head><body>" +
      '<div class="tag">' +
        '<div>' + qrSvg + '</div>' +
        '<div class="info">' +
          '<div class="org">' + org + '</div>' +
          '<div class="id">' + asset.id + '</div>' +
          '<div class="name">' + asset.name + '</div>' +
          '<div class="sn">S/N: ' + (asset.serial || "N/A") + '</div>' +
        '</div>' +
      '</div>' +
      "<script>window.onload = function() { window.print(); };<\/script>" +
      "</body></html>";

    printWindow.document.write(html);
    printWindow.document.close();
  }

  return {
    open: open,
    close: close,
    save: save,
    printLabel: printLabel,
    onCategoryChange: onCategoryChange
  };
})();
