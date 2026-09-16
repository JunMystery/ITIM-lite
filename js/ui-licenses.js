/* ==========================================================================
   ITIM-lite - Software Licenses View & Modal Controller
   ========================================================================== */

var UI_Licenses = (function () {
  var editingId = null;

  function ensureModal() {
    if (document.getElementById("license-modal")) return;
    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "license-modal";
    div.className = "modal-backdrop";
    div.onclick = function (e) { e = e || window.event; if ((e.target || e.srcElement) === div) closeModal(); };
    div.innerHTML = '<div class="modal">' +
      '<div class="modal-header"><h3 id="license-modal-title">Software License</h3><button class="btn btn-sm" onclick="UI_Licenses.closeModal()">✕</button></div>' +
      '<div class="modal-body">' +
        '<div class="form-group"><label class="form-label">Software Title *:</label><input type="text" id="lic-input-software" class="form-input" /></div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Vendor:</label><input type="text" id="lic-input-vendor" class="form-input" /></div>' +
          '<div class="form-group"><label class="form-label">License Type:</label>' + (typeof UI_ComboBox !== "undefined" ? UI_ComboBox.renderHtml("lic-input-type", ITIM_CONFIG.LICENSE_TYPES, "Perpetual") : '<select id="lic-input-type" class="form-select"></select>') + '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Total Seats (Qty):</label><input type="number" id="lic-input-total-seats" class="form-input" min="0" /></div>' +
          '<div class="form-group"><label class="form-label">Assigned Seats:</label><input type="number" id="lic-input-assigned-seats" class="form-input" min="0" /></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">License Key:</label><input type="text" id="lic-input-key" class="form-input" /></div>' +
          '<div class="form-group"><label class="form-label">Renewal / Expiry:</label><input type="date" id="lic-input-expiry" class="form-input" /></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Notes:</label><textarea id="lic-input-notes" class="form-textarea" rows="2"></textarea></div>' +
      '</div>' +
      '<div class="modal-footer"><button class="btn" onclick="UI_Licenses.closeModal()">Cancel</button><button class="btn btn-primary" onclick="UI_Licenses.save()">Save License</button></div>' +
    '</div>';
    host.appendChild(div);
  }

  function initFilterBar() {
    if (typeof UI_FilterBar === "undefined") return;
    UI_FilterBar.init("licenses", {
      title: "Software Licenses",
      placeholder: "Search software title, vendor, key, notes...",
      fields: [
        {
          id: "type", label: "License Type", type: "select",
          options: [
            { value: "all", label: "All Types" }, { value: "Subscription", label: "Subscription" },
            { value: "Perpetual", label: "Perpetual" }, { value: "OEM", label: "OEM" }, { value: "Open Source", label: "Open Source" }
          ]
        },
        { id: "vendor", label: "Vendor", type: "text", placeholder: "e.g. Microsoft, Adobe" }
      ],
      onFilter: function () { render(); }
    });
  }

  function render() {
    initFilterBar();
    var curSearch = "", curType = "all", curVendor = "";
    if (typeof UI_FilterBar !== "undefined") {
      UI_FilterBar.render("licenses-filter-bar", "licenses");
      var crit = UI_FilterBar.getCriteria("licenses");
      curSearch = (crit.search || "").toLowerCase();
      curType = (crit.filters && crit.filters.type) ? crit.filters.type : "all";
      curVendor = (crit.filters && crit.filters.vendor) ? crit.filters.vendor.toLowerCase() : "";
    }

    var list = LicensesService.getAll();
    if (curType !== "all") list = list.filter(function (l) { return l.type === curType; });
    if (curVendor) list = list.filter(function (l) { return l.vendor && l.vendor.toLowerCase().indexOf(curVendor) !== -1; });
    if (curSearch) {
      list = list.filter(function (l) {
        var s = (l.id + " " + l.software + " " + (l.vendor || "") + " " + (l.key || "") + " " + (l.notes || "")).toLowerCase();
        return s.indexOf(curSearch) !== -1;
      });
    }
    var tbody = document.getElementById("licenses-table-tbody");
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-tertiary); padding:30px;">No software licenses recorded.</td></tr>';
      return;
    }

    var html = [];
    for (var i = 0; i < list.length; i++) {
      var l = list[i];
      var total = (l.totalSeats !== undefined && l.totalSeats !== null && !isNaN(l.totalSeats)) ? parseInt(l.totalSeats, 10) : 0;
      var assigned = (l.assignedSeats !== undefined && l.assignedSeats !== null && !isNaN(l.assignedSeats)) ? parseInt(l.assignedSeats, 10) : 0;
      var avail = Math.max(0, total - assigned);
      var isOut = (total <= 0 || avail <= 0);
      var pct = (total > 0) ? Math.min(100, Math.round((assigned / total) * 100)) : 100;

      var barColor = "#0078d4";
      if (isOut) barColor = "#d13438";
      else if (pct >= 85) barColor = "#ffaa00";

      var seatText = isOut
        ? '<span class="badge badge-retired" style="background:#d13438; color:#fff; font-size:10px;">Out of Stock (' + assigned + '/' + total + ')</span>'
        : ('<span>' + assigned + ' / ' + total + ' seats</span><span>' + pct + '%</span>');

      html.push('<tr class="clickable-row" onclick="UI_ActionsMenu.onRowClick(event, \'license\', \'' + l.id + '\')" oncontextmenu="UI_ActionsMenu.show(event, \'license\', \'' + l.id + '\')">' +
        '<td style="font-family:var(--font-mono); font-weight:600; width:90px;">' + l.id + '</td>' +
        '<td><strong>' + l.software + '</strong><br><span style="font-size:11px; color:var(--text-secondary);">' + (l.vendor || "") + '</span></td>' +
        '<td>' + l.type + '</td>' +
        '<td style="width:160px;">' +
          '<div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">' + seatText + '</div>' +
          '<div style="background:var(--bg-surface-tertiary); border-radius:4px; height:6px; overflow:hidden;"><div style="background:' + barColor + '; width:' + pct + '%; height:100%;"></div></div>' +
        '</td>' +
        '<td style="font-family:var(--font-mono); font-size:11px;">' + (l.expiryDate || "Perpetual") + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-icon btn-sm action-menu-trigger" onclick="UI_ActionsMenu.show(event, \'license\', \'' + l.id + '\')" title="Actions">⋮</button>' +
        '</td>' +
      "</tr>");
    }
    tbody.innerHTML = html.join("");
  }

  function openModal(id) {
    ensureModal();
    editingId = id || null;
    var modal = document.getElementById("license-modal");
    var title = document.getElementById("license-modal-title");

    if (typeof UI_ComboBox !== "undefined") {
      UI_ComboBox.populate("lic-input-type", ITIM_CONFIG.LICENSE_TYPES);
    } else {
      var typeSelect = document.getElementById("lic-input-type");
      if (typeSelect && typeSelect.options.length === 0) {
        for (var t = 0; t < ITIM_CONFIG.LICENSE_TYPES.length; t++) {
          var opt = document.createElement("option");
          opt.value = ITIM_CONFIG.LICENSE_TYPES[t];
          opt.innerText = ITIM_CONFIG.LICENSE_TYPES[t];
          typeSelect.appendChild(opt);
        }
      }
    }

    if (id) {
      var l = LicensesService.getById(id);
      if (!l) return;
      title.innerText = "Edit License (" + l.id + ")";
      document.getElementById("lic-input-software").value = l.software;
      document.getElementById("lic-input-vendor").value = l.vendor || "";
      if (typeof UI_ComboBox !== "undefined") {
        UI_ComboBox.setValue("lic-input-type", l.type);
      } else {
        document.getElementById("lic-input-type").value = l.type;
      }
      var elTotal = document.getElementById("lic-input-total-seats");
      elTotal.value = (l.totalSeats !== undefined && l.totalSeats !== null) ? l.totalSeats : 0;
      elTotal.disabled = true;
      elTotal.readOnly = true;
      elTotal.style.background = "var(--bg-surface-secondary)";
      elTotal.style.cursor = "not-allowed";

      var elAssigned = document.getElementById("lic-input-assigned-seats");
      elAssigned.value = (l.assignedSeats !== undefined && l.assignedSeats !== null) ? l.assignedSeats : 0;
      elAssigned.disabled = true;
      elAssigned.readOnly = true;
      elAssigned.style.background = "var(--bg-surface-secondary)";
      elAssigned.style.cursor = "not-allowed";

      document.getElementById("lic-input-key").value = l.key || "";
      document.getElementById("lic-input-expiry").value = l.expiryDate || "";
      document.getElementById("lic-input-notes").value = l.notes || "";
    } else {
      title.innerText = "Add Software License";
      document.getElementById("lic-input-software").value = "";
      document.getElementById("lic-input-vendor").value = "";
      if (typeof UI_ComboBox !== "undefined") {
        UI_ComboBox.setValue("lic-input-type", ITIM_CONFIG.LICENSE_TYPES[0]);
      } else {
        document.getElementById("lic-input-type").selectedIndex = 0;
      }
      var elTotalNew = document.getElementById("lic-input-total-seats");
      elTotalNew.value = "10";
      elTotalNew.disabled = false;
      elTotalNew.readOnly = false;
      elTotalNew.style.background = "";
      elTotalNew.style.cursor = "";

      var elAssignedNew = document.getElementById("lic-input-assigned-seats");
      elAssignedNew.value = "0";
      elAssignedNew.disabled = false;
      elAssignedNew.readOnly = false;
      elAssignedNew.style.background = "";
      elAssignedNew.style.cursor = "";

      document.getElementById("lic-input-key").value = "";
      document.getElementById("lic-input-expiry").value = "";
      document.getElementById("lic-input-notes").value = "";
    }

    modal.className = "modal-backdrop open";
  }

  function closeModal() {
    var modal = document.getElementById("license-modal");
    if (modal) modal.className = "modal-backdrop";
  }

  function save() {
    var software = document.getElementById("lic-input-software").value.trim();
    if (!software) {
      Notifications.show("Please enter a software title.", "warning");
      return;
    }

    var data;
    if (editingId) {
      var existingLic = LicensesService.getById(editingId);
      data = {
        software: software,
        vendor: document.getElementById("lic-input-vendor").value.trim(),
        type: document.getElementById("lic-input-type").value,
        totalSeats: existingLic ? existingLic.totalSeats : 0,
        assignedSeats: existingLic ? existingLic.assignedSeats : 0,
        key: document.getElementById("lic-input-key").value.trim(),
        expiryDate: document.getElementById("lic-input-expiry").value,
        notes: document.getElementById("lic-input-notes").value.trim()
      };
      LicensesService.update(editingId, data);
      Notifications.show("License updated successfully.", "success");
    } else {
      data = {
        software: software,
        vendor: document.getElementById("lic-input-vendor").value.trim(),
        type: document.getElementById("lic-input-type").value,
        totalSeats: parseInt(document.getElementById("lic-input-total-seats").value, 10) || 0,
        assignedSeats: parseInt(document.getElementById("lic-input-assigned-seats").value, 10) || 0,
        key: document.getElementById("lic-input-key").value.trim(),
        expiryDate: document.getElementById("lic-input-expiry").value,
        notes: document.getElementById("lic-input-notes").value.trim()
      };
      LicensesService.add(data);
      Notifications.show("Software license added successfully.", "success");
    }

    closeModal();
    render();
    NavController.updateBadges();
  }

  function deleteLicense(id) {
    var lic = LicensesService.getById(id);
    if (!lic) return;

    Notifications.confirm("Delete license for " + lic.software + "?", function () {
      LicensesService.remove(id);
      Notifications.show("License removed.", "info");
      render();
      NavController.updateBadges();
    });
  }

  return {
    render: render,
    openModal: openModal,
    closeModal: closeModal,
    save: save,
    deleteLicense: deleteLicense
  };
})();
