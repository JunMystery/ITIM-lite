/* ==========================================================================
   ITIM-lite - Transaction History View & Multi-Item Action Controller
   ========================================================================== */

var UI_History = (function () {
  var selectedAssetIds = [];
  var currentPage = 1;
  var currentPageSize = 10;

  function ensureModal() {
    if (document.getElementById("transaction-modal")) return;
    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "transaction-modal"; div.className = "modal-backdrop";
    div.onclick = function (e) { e = e || window.event; if ((e.target || e.srcElement) === div) closeModal(); };
    div.innerHTML = '<div class="modal" style="width:620px; max-width:92vw;">' +
      '<div class="modal-header"><h3 id="txn-modal-title">Create Multi-Item Transaction</h3><button class="btn btn-sm" onclick="UI_History.closeModal()">✕</button></div>' +
      '<div class="modal-body">' +
        '<div style="background:#f5f5f5; padding:10px; border-radius:4px; margin-bottom:12px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;"><span style="font-size:12px; font-weight:600;">Selected Assets (<span id="txn-selected-count">0</span>):</span></div>' +
          '<div id="txn-selected-chips" style="display:flex; flex-wrap:wrap; gap:6px; min-height:28px; max-height:80px; overflow-y:auto; margin-bottom:8px;"></div>' +
          (typeof UI_ComboBox !== "undefined" ? UI_ComboBox.renderHtml("txn-asset-picker", [], "", "searchable-combo-sm", 'onchange="UI_History.addAssetFromPicker(this.value)"') : '<select id="txn-asset-picker" class="form-select combo-box" onchange="UI_History.addAssetFromPicker(this.value)" style="font-size:12px;"></select>') +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Transaction Type:</label>' + (typeof UI_ComboBox !== "undefined" ? UI_ComboBox.renderHtml("txn-input-type", [{value:"CHECKOUT",label:"Check-out (Assign to Staff)"},{value:"CHECKIN",label:"Check-in (Return to Stock)"},{value:"repair",label:"Send to Repair"},{value:"retired",label:"Retire / Dispose"}], "CHECKOUT", "", 'onchange="UI_History.onTypeChange()"') : '<select id="txn-input-type" class="form-select combo-box" onchange="UI_History.onTypeChange()"><option value="CHECKOUT">Check-out (Assign to Staff)</option><option value="CHECKIN">Check-in (Return to Stock)</option><option value="repair">Send to Repair</option><option value="retired">Retire / Dispose</option></select>') + '</div>' +
          '<div class="form-group"><label class="form-label">Issuing IT Officer:</label><input type="text" id="txn-input-officer" class="form-input" value="IT Administrator" /></div>' +
        '</div>' +
        '<div id="txn-checkout-fields">' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Recipient Employee *:</label><input type="text" id="txn-input-employee" class="form-input" placeholder="Full Name" /></div><div class="form-group"><label class="form-label">Department:</label><input type="text" id="txn-input-dept" class="form-input" placeholder="Department" /></div></div>' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Expected Return Date:</label><input type="date" id="txn-input-expected" class="form-input" /></div><div class="form-group"><label class="form-label">Condition at Handover:</label><input type="text" id="txn-input-condition" class="form-input" value="Good / Functional" /></div></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Transaction Notes / Reference:</label><textarea id="txn-input-notes" class="form-textarea" rows="2" placeholder="Ticket number, project, reason..."></textarea></div>' +
      '</div>' +
      '<div class="modal-footer"><button class="btn" onclick="UI_History.closeModal()">Cancel</button><button class="btn btn-primary" onclick="UI_History.submitTransaction()">Execute Transaction</button></div></div>';
    host.appendChild(div);
  }

  function initFilterBar() {
    if (typeof UI_FilterBar === "undefined") return;
    UI_FilterBar.init("history", {
      title: "Transaction History",
      placeholder: "Search Txn ID, party, notes, items...",
      fields: [
        {
          id: "type", label: "Transaction Type", type: "select",
          options: [
            { value: "all", label: "All Types" }, { value: "CHECKOUT", label: "CHECKOUT" },
            { value: "CHECKIN", label: "CHECKIN" }, { value: "INBOUND", label: "INBOUND" },
            { value: "STATUS_CHANGE", label: "STATUS_CHANGE" }
          ]
        },
        { id: "party", label: "Party / Employee", type: "text", placeholder: "e.g. Sarah, Warehouse" }
      ],
      onFilter: function () { currentPage = 1; render(); }
    });
  }

  function render() {
    initFilterBar();
    var curSearch = "", curType = "all", curParty = "";
    if (typeof UI_FilterBar !== "undefined") {
      UI_FilterBar.render("history-filter-bar", "history");
      var crit = UI_FilterBar.getCriteria("history");
      curSearch = (crit.search || "").toLowerCase();
      curType = (crit.filters && crit.filters.type) ? crit.filters.type : "all";
      curParty = (crit.filters && crit.filters.party) ? crit.filters.party.toLowerCase() : "";
    }

    var list = TransactionsService.getAll();
    if (curType !== "all") list = list.filter(function (t) { return t.type === curType; });
    if (curParty) list = list.filter(function (t) { return (t.employeeName || "").toLowerCase().indexOf(curParty) !== -1 || (t.department || "").toLowerCase().indexOf(curParty) !== -1; });
    if (curSearch) {
      list = list.filter(function (t) {
        var str = (t.id + " " + t.type + " " + (t.employeeName || "") + " " + (t.notes || "")).toLowerCase();
        if (t.items) { for (var k = 0; k < t.items.length; k++) str += " " + (t.items[k].assetId || "") + " " + (t.items[k].name || ""); }
        return str.indexOf(curSearch) !== -1;
      });
    }
    var tbody = document.getElementById("history-table-tbody");
    if (!tbody) return;

    var paged = (typeof UIPagination !== "undefined")
      ? UIPagination.paginate(list, currentPage, currentPageSize)
      : { pagedItems: list, totalItems: list.length, totalPages: 1, currentPage: 1, pageSize: list.length, startItem: (list.length ? 1 : 0), endItem: list.length };

    currentPage = paged.currentPage;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-tertiary); padding:30px;">No transaction history recorded yet.</td></tr>';
      if (typeof UIPagination !== "undefined") {
        UIPagination.renderBar("history-pagination-container", paged, "UI_History.setPage", "UI_History.setPageSize");
      }
      return;
    }

    var html = [];
    for (var i = 0; i < paged.pagedItems.length; i++) {
      var txn = paged.pagedItems[i];
      var badgeClass = "badge-inuse";
      if (txn.type === "CHECKIN") badgeClass = "badge-available";
      else if (txn.type === "STATUS_CHANGE" || txn.type === "retired") badgeClass = "badge-retired";

      var itemsSnippet = [];
      for (var j = 0; j < Math.min(3, txn.items.length); j++) {
        itemsSnippet.push('<span style="font-family:var(--font-mono); font-size:10px; background:var(--bg-surface-secondary); padding:1px 5px; border-radius:3px; border:1px solid var(--border-subtle);">' + txn.items[j].assetId + '</span>');
      }
      if (txn.items.length > 3) {
        itemsSnippet.push('<span style="font-size:10px; color:var(--text-tertiary);">+' + (txn.items.length - 3) + ' more</span>');
      }

      html.push('<tr class="clickable-row" onclick="UI_ActionsMenu.onRowClick(event, \'history\', \'' + txn.id + '\')" oncontextmenu="UI_ActionsMenu.show(event, \'history\', \'' + txn.id + '\')">' +
        '<td style="font-family:var(--font-mono); font-weight:700; width:100px;"><a href="javascript:void(0)" onclick="UI_History.openDetail(\'' + txn.id + '\')" style="color:var(--color-primary); text-decoration:underline;">' + txn.id + '</a></td>' +
        '<td style="width:110px;"><span class="badge ' + badgeClass + '">' + txn.type + '</span></td>' +
        '<td><strong>' + (txn.employeeName || "Stock / Internal") + '</strong><br><span style="font-size:11px; color:var(--text-secondary);">' + (txn.department || "") + '</span></td>' +
        '<td><div style="margin-bottom:3px; font-weight:600;">' + txn.itemCount + ' item' + (txn.itemCount > 1 ? 's' : '') + '</div><div style="display:flex; gap:4px; flex-wrap:wrap;">' + itemsSnippet.join(" ") + '</div></td>' +
        '<td style="font-family:var(--font-mono); font-size:11px; width:140px;">' + txn.timestamp + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="btn btn-icon btn-sm action-menu-trigger" onclick="UI_ActionsMenu.show(event, \'history\', \'' + txn.id + '\')" title="Actions">⋮</button>' +
        '</td>' +
      "</tr>");
    }
    tbody.innerHTML = html.join("");

    if (typeof UIPagination !== "undefined") {
      UIPagination.renderBar("history-pagination-container", paged, "UI_History.setPage", "UI_History.setPageSize");
    }
  }

  function updateChips() {
    var countEl = document.getElementById("txn-selected-count");
    if (countEl) countEl.innerText = selectedAssetIds.length;
    var container = document.getElementById("txn-selected-chips");
    if (!container) return;
    container.innerHTML = "";

    if (selectedAssetIds.length === 0) {
      container.innerHTML = '<span style="font-size:11px; color:var(--text-tertiary); line-height:24px;">No items selected yet. Choose from dropdown below:</span>';
      return;
    }
    for (var i = 0; i < selectedAssetIds.length; i++) {
      var id = selectedAssetIds[i];
      var a = InventoryService.getById(id);
      var chip = document.createElement("span");
      chip.style.cssText = "font-size:11px; background:#fff; padding:2px 8px; border:1px solid #ccc; border-radius:12px; display:inline-flex; align-items:center; gap:4px;";
      chip.innerHTML = (a ? (a.id + " - " + a.name) : id) + ' <a href="javascript:void(0)" onclick="UI_History.removeAsset(\'' + id + '\')" style="color:#d13438; font-weight:bold; text-decoration:none; margin-left:3px;">✕</a>';
      container.appendChild(chip);
    }
  }

  function populateAssetPicker() {
    var assets = InventoryService.getAll();
    var opts = [{ value: "", label: "+ Add Asset to Transaction..." }];
    for (var i = 0; i < assets.length; i++) {
      var a = assets[i];
      opts.push({ value: a.id, label: a.id + ' - ' + a.name + ' (' + a.status + ')' });
    }
    if (typeof UI_ComboBox !== "undefined") {
      UI_ComboBox.populate("txn-asset-picker", opts, "");
    } else {
      var picker = document.getElementById("txn-asset-picker");
      if (picker) picker.innerHTML = opts.map(function(o){ return '<option value="'+o.value+'">'+o.label+'</option>'; }).join("");
    }
  }

  function addAssetFromPicker(id) {
    if (!id) return;
    if (selectedAssetIds.indexOf(id) === -1) {
      selectedAssetIds.push(id);
      updateChips();
    }
    if (typeof UI_ComboBox !== "undefined") {
      UI_ComboBox.setValue("txn-asset-picker", "");
    } else {
      var picker = document.getElementById("txn-asset-picker");
      if (picker) picker.value = "";
    }
  }

  function removeAsset(id) {
    var idx = selectedAssetIds.indexOf(id);
    if (idx !== -1) {
      selectedAssetIds.splice(idx, 1);
      updateChips();
    }
  }

  function openCreateModal() {
    ensureModal();
    selectedAssetIds = [];
    populateAssetPicker();
    updateChips();
    document.getElementById("txn-input-type").selectedIndex = 0;
    onTypeChange();
    document.getElementById("txn-input-employee").value = "";
    document.getElementById("txn-input-dept").value = "";
    document.getElementById("txn-input-expected").value = "";
    document.getElementById("txn-input-notes").value = "";
    document.getElementById("transaction-modal").className = "modal-backdrop open";
  }

  function openBulkModal(assetIds) {
    ensureModal();
    selectedAssetIds = (assetIds || []).slice(0);
    populateAssetPicker();
    updateChips();
    if (typeof UI_ComboBox !== "undefined") UI_ComboBox.setValue("txn-input-type", "CHECKOUT");
    onTypeChange();
    document.getElementById("txn-input-employee").value = "";
    document.getElementById("txn-input-dept").value = "";
    document.getElementById("txn-input-expected").value = "";
    document.getElementById("txn-input-notes").value = "";
    document.getElementById("transaction-modal").className = "modal-backdrop open";
  }

  function closeModal() {
    var modal = document.getElementById("transaction-modal");
    if (modal) modal.className = "modal-backdrop";
  }

  function onTypeChange() {
    var type = UI_ComboBox.getValue("txn-input-type") || (document.getElementById("txn-input-type") ? document.getElementById("txn-input-type").value : "CHECKOUT");
    var f = document.getElementById("txn-checkout-fields");
    if (f) f.style.display = (type === "CHECKOUT") ? "block" : "none";
  }

  function openDetail(txnId) { if (typeof UI_Detail !== "undefined") UI_Detail.open(txnId); }
  function closeDetailModal() { if (typeof UI_Detail !== "undefined") UI_Detail.close(); }

  function submitTransaction() {
    if (selectedAssetIds.length === 0) {
      Notifications.show("Please select at least one asset for this transaction.", "warning");
      return;
    }
    var type = UI_ComboBox.getValue("txn-input-type") || document.getElementById("txn-input-type").value;
    var officer = document.getElementById("txn-input-officer").value.trim();
    var notes = document.getElementById("txn-input-notes").value.trim();
    var res;

    if (type === "CHECKOUT") {
      var emp = document.getElementById("txn-input-employee").value.trim();
      if (!emp) { Notifications.show("Please enter employee recipient name.", "warning"); return; }
      res = TransactionsService.checkoutBulk({
        assetIds: selectedAssetIds, employeeName: emp,
        department: document.getElementById("txn-input-dept").value.trim(),
        expectedReturnDate: document.getElementById("txn-input-expected").value,
        condition: document.getElementById("txn-input-condition").value.trim(),
        notes: notes, officer: officer
      });
    } else if (type === "CHECKIN") {
      res = TransactionsService.checkinBulk({ assetIds: selectedAssetIds, notes: notes, officer: officer });
    } else {
      res = TransactionsService.changeStatusBulk(selectedAssetIds, type, notes);
    }

    if (res && res.success) {
      Notifications.show("Transaction " + res.transaction.id + " executed successfully with " + res.transaction.itemCount + " items!", "success");
      closeModal();
      if (typeof UI_Assets !== "undefined") { UI_Assets.clearSelection(); UI_Assets.render(); }
      render();
      NavController.updateBadges();
      if (type === "CHECKOUT" || type === "CHECKIN") {
        Notifications.confirm("Transaction " + res.transaction.id + " complete. Would you like to print the official sign-off receipt now?", function () {
          TransactionsService.printTransactionReceipt(res.transaction.id);
        });
      }
    } else {
      Notifications.show((res && res.error) ? res.error : "Transaction failed.", "error");
    }
  }

  function setPage(p) { currentPage = parseInt(p, 10) || 1; render(); }
  function setPageSize(s) { currentPageSize = parseInt(s, 10) || 10; currentPage = 1; render(); }

  return {
    render: render, openCreateModal: openCreateModal, openBulkModal: openBulkModal,
    closeModal: closeModal, openDetail: openDetail, closeDetailModal: closeDetailModal,
    onTypeChange: onTypeChange, addAssetFromPicker: addAssetFromPicker,
    removeAsset: removeAsset, submitTransaction: submitTransaction,
    setPage: setPage, setPageSize: setPageSize
  };
})();
