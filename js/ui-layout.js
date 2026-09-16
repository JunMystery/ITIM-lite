/* ==========================================================================
   ITIM-lite - UI Layout & View Skeleton Renderer
   ========================================================================== */

var UI_Layout = (function () {
  function render() {
    var app = document.getElementById("app");
    if (!app) return;

    var isHta = (typeof FsoStorage !== "undefined" && FsoStorage.isHta);
    var html = [];

    // 1. Linux / Browser Debug Banner
    if (!isHta) {
      html.push('<div class="linux-debug-banner">');
      html.push('  <span><strong>Linux Debug Mode</strong>: Emulating Windows HTA via LocalStorage | Press <strong>F12</strong> to open DevTools</span>');
      html.push('  <span>Target: <a href="ITIM.hta" style="color:#70c4ff; text-decoration:underline;" target="_blank">ITIM.hta</a> (Production Windows File)</span>');
      html.push('</div>');
    }

    // 2. Header
    html.push('<header class="app-header">');
    html.push('  <div class="header-left">');
    html.push('    <div class="app-logo">IT</div>');
    html.push('    <div class="app-title-group"><span class="app-title">ITIM-lite</span><span class="app-badge">' + (isHta ? "HTA Windows" : "Browser Debug") + '</span></div>');
    html.push('  </div>');
    html.push('  <div class="header-center"></div>');
    html.push('  <div class="header-right">');
    html.push('    <div id="storage-status-pill" class="storage-status-pill" onclick="NavController.switchView(\'settings\')" title="Click for storage settings">');
    html.push('      <div id="storage-status-dot" class="status-dot"></div>');
    html.push('    </div>');
    html.push('  </div>');
    html.push('</header>');

    // 3. Body & Sidebar
    html.push('<div class="app-body">');
    html.push('  <aside class="app-sidebar">');
    html.push('    <ul class="nav-menu">');
    html.push('      <li><a class="nav-item active" data-view="dashboard"><span data-i18n="nav_dashboard">Dashboard</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="assets"><span data-i18n="nav_assets">Assets</span> <span id="nav-badge-assets" class="nav-count-badge">0</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="inbound"><span data-i18n="nav_inbound">Inbound &amp; PO</span> <span id="nav-badge-inbound" class="nav-count-badge">0</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="catalog"><span data-i18n="nav_catalog">Master Catalog</span> <span id="nav-badge-catalog" class="nav-count-badge">0</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="licenses"><span data-i18n="nav_licenses">Software</span> <span id="nav-badge-licenses" class="nav-count-badge">0</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="consumables"><span data-i18n="nav_consumables">Stock</span> <span id="nav-badge-consumables" class="nav-count-badge">0</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="assignments"><span data-i18n="nav_assignments">Handover</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="history"><span data-i18n="nav_history">Transactions</span> <span id="nav-badge-history" class="nav-count-badge">0</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="audit"><span data-i18n="nav_audit">Audit Log</span></a></li>');
    html.push('    </ul>');
    html.push('    <div class="sidebar-footer">');
    html.push('      <a class="nav-item" data-view="settings"><span data-i18n="nav_settings">Storage &amp; Backup</span></a>');
    html.push('      <div class="sidebar-controls" style="display:flex; align-items:center; gap:6px; padding:6px 4px 2px 4px;">');
    html.push('        <div style="flex:1;">' + (typeof UI_ComboBox !== "undefined" ? UI_ComboBox.renderHtml("lang-switcher", [{value:"en",label:"EN"},{value:"vi",label:"VI"},{value:"jp",label:"JP"}], "en", "searchable-combo-sm", 'onchange="I18N.setLang(this.value)"') : '<select id="lang-switcher" class="form-select combo-box combo-box-sm" style="flex:1; height:28px;" onchange="I18N.setLang(this.value)"><option value="en">EN</option><option value="vi">VI</option><option value="jp">JP</option></select>') + '</div>');
    html.push('        <button class="btn btn-icon btn-sm" onclick="toggleTheme()" title="Toggle Dark Mode" style="width:28px; height:28px; padding:0; display:flex; align-items:center; justify-content:center;">🌓</button>');
    html.push('      </div>');
    html.push('    </div>');
    html.push('  </aside>');

    // 4. Main Content Views
    html.push('  <main class="app-content">');

    // Dashboard View
    html.push('    <section id="view-dashboard" class="view-container active">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1>IT Operations Dashboard</h1><span class="view-subtitle">Live hardware inventory, license quotas, and audit status</span></div>');
    html.push('        <div style="display:flex; gap:8px;">');
    html.push('          <button class="btn btn-primary btn-sm" onclick="UI_Assignments.openCheckoutModal()">+ Check-out Asset</button>');
    html.push('        </div>');
    html.push('      </div>');
    html.push('      <div class="metrics-grid">');
    html.push('        <div class="metric-card"><span class="metric-title">Total Assets</span><span id="dash-total-assets" class="metric-value">0</span><span class="metric-sub">Cataloged equipment</span></div>');
    html.push('        <div class="metric-card"><span class="metric-title">Deployed</span><span id="dash-inuse-assets" class="metric-value" style="color:var(--color-primary);">0</span><span class="metric-sub">Assigned to staff</span></div>');
    html.push('        <div class="metric-card"><span class="metric-title">In Stock</span><span id="dash-avail-assets" class="metric-value" style="color:var(--status-available);">0</span><span class="metric-sub">Ready to issue</span></div>');
    html.push('        <div class="metric-card"><span class="metric-title">In Repair</span><span id="dash-repair-assets" class="metric-value" style="color:var(--status-repair);">0</span><span class="metric-sub">Service tickets</span></div>');
    html.push('        <div class="metric-card"><span class="metric-title">Expiring Warranty</span><span id="dash-expiring-warranty" class="metric-value" style="color:#d13438;">0</span><span class="metric-sub">&lt; 90 days</span></div>');
    html.push('        <div class="metric-card"><span class="metric-title">Low Stock</span><span id="dash-low-stock" class="metric-value" style="color:#d83b01;">0</span><span class="metric-sub">Below threshold</span></div>');
    html.push('        <div class="metric-card"><span class="metric-title">License Seats</span><span id="dash-license-seats" class="metric-value">0 / 0</span><span class="metric-sub">Allocated</span></div>');
    html.push('      </div>');
    html.push('      <div class="card">');
    html.push('        <h3 style="margin-bottom:12px;">Recent Inventory Activity</h3>');
    html.push('        <div class="data-table-container">');
    html.push('          <table class="data-table"><thead><tr><th>Timestamp</th><th>Action</th><th>Details</th></tr></thead><tbody id="dash-activity-tbody"></tbody></table>');
    html.push('        </div>');
    html.push('      </div>');
    html.push('    </section>');

    // Assets View
    html.push('    <section id="view-assets" class="view-container">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1>Hardware Inventory</h1><span class="view-subtitle">Computers, monitors, network gear, and peripherals</span></div>');
    html.push('        <div style="display:flex; gap:8px;">');
    html.push('          <button class="btn btn-primary btn-sm" onclick="NavController.switchView(\'inbound\')">+ Inbound Intake</button>');
    html.push('        </div>');
    html.push('      </div>');
    html.push('      <div id="assets-filter-bar"></div>');
    html.push('      <div id="assets-bulk-bar" class="bulk-dock-bar" style="display:none;">');
    html.push('        <span id="assets-selected-label" style="font-weight:600; font-size:12px; color:var(--color-primary);">0 selected</span>');
    html.push('        <button class="btn btn-primary btn-sm" onclick="UI_Assets.triggerBulkAction(\'checkout\')" data-i18n="btn_bulk_checkout">Bulk Check-out</button>');
    html.push('        <button class="btn btn-sm" onclick="UI_Assets.triggerBulkAction(\'checkin\')" data-i18n="btn_bulk_checkin">Bulk Check-in</button>');
    html.push('        <button class="btn btn-sm" onclick="UI_Assets.triggerBulkAction(\'status\')" data-i18n="btn_bulk_status">Change Status</button>');
    html.push('        <button class="btn btn-sm" onclick="UI_Assets.triggerBulkAction(\'print\')" data-i18n="btn_tag">Print Tags</button>');
    html.push('        <button class="btn btn-sm" onclick="UI_Assets.clearSelection()" data-i18n="btn_clear">Clear</button>');
    html.push('      </div>');
    html.push('      <div class="data-table-container">');
    html.push('        <table class="data-table">');
    html.push('          <thead><tr><th style="width:30px; text-align:center;"><input type="checkbox" id="assets-select-all" onchange="UI_Assets.toggleSelectAll(this.checked)" /></th><th>Asset ID</th><th>Name / Model</th><th>Category</th><th>Serial No</th><th>Status</th><th>Assigned To</th><th style="text-align:right;">Actions</th></tr></thead>');
    html.push('          <tbody id="assets-table-tbody"></tbody>');
    html.push('        </table>');
    html.push('        <div id="assets-pagination-container"></div>');
    html.push('      </div>');
    html.push('    </section>');

    // Licenses View
    html.push('    <section id="view-licenses" class="view-container">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1>Software Licenses &amp; Subscriptions</h1><span class="view-subtitle">Seat allocations, license keys, and renewal dates</span></div>');
    html.push('        <button class="btn btn-primary btn-sm" onclick="UI_Licenses.openModal()">+ Add License</button>');
    html.push('      </div>');
    html.push('      <div id="licenses-filter-bar"></div>');
    html.push('      <div class="data-table-container">');
    html.push('        <table class="data-table">');
    html.push('          <thead><tr><th>ID</th><th>Software / Vendor</th><th>Type</th><th>Seat Allocation</th><th>Renewal / Expiry</th><th style="text-align:right;">Actions</th></tr></thead>');
    html.push('          <tbody id="licenses-table-tbody"></tbody>');
    html.push('        </table>');
    html.push('      </div>');
    html.push('    </section>');

    // Consumables View
    html.push('    <section id="view-consumables" class="view-container">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1>Consumables &amp; Accessories</h1><span class="view-subtitle">Cables, toners, mice, keyboards, and stock levels</span></div>');
    html.push('        <button class="btn btn-primary btn-sm" onclick="NavController.switchView(\'inbound\')">+ Inbound Intake</button>');
    html.push('      </div>');
    html.push('      <div id="consumables-filter-bar"></div>');
    html.push('      <div class="data-table-container">');
    html.push('        <table class="data-table">');
    html.push('          <thead><tr><th>ID</th><th>Item Name</th><th>Category</th><th>Stock</th><th>Storage Location</th><th style="text-align:right;">Actions</th></tr></thead>');
    html.push('          <tbody id="consumables-table-tbody"></tbody>');
    html.push('        </table>');
    html.push('      </div>');
    html.push('    </section>');

    // Assignments View
    html.push('    <section id="view-assignments" class="view-container">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1>Equipment Handover &amp; Assignments</h1><span class="view-subtitle">Check-out hardware and print sign-off receipts</span></div>');
    html.push('        <button class="btn btn-primary btn-sm" onclick="UI_Assignments.openCheckoutModal()">+ Check-out Asset</button>');
    html.push('      </div>');
    html.push('      <div id="assignments-filter-bar"></div>');
    html.push('      <div class="data-table-container">');
    html.push('        <table class="data-table">');
    html.push('          <thead><tr><th>Record ID</th><th>Hardware Asset</th><th>Assigned Employee</th><th>Checkout Date</th><th>Expected / Returned</th><th>Status</th><th style="text-align:right;">Actions</th></tr></thead>');
    html.push('          <tbody id="assignments-table-tbody"></tbody>');
    html.push('        </table>');
    html.push('      </div>');
    html.push('    </section>');

    // History View
    html.push('    <section id="view-history" class="view-container">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1 data-i18n="history_title">Transaction History &amp; Multi-Item Handover</h1><span class="view-subtitle" data-i18n="history_sub">Track bulk operations, unique Transaction IDs, and sign-offs</span></div>');
    html.push('        <button class="btn btn-primary btn-sm" onclick="UI_History.openCreateModal()" data-i18n="btn_new_txn">+ New Transaction</button>');
    html.push('      </div>');
    html.push('      <div id="history-filter-bar"></div>');
    html.push('      <div class="data-table-container">');
    html.push('        <table class="data-table">');
    html.push('          <thead><tr><th>Txn ID</th><th>Type</th><th>Recipient / Party</th><th>Items</th><th>Timestamp</th><th style="text-align:right;">Actions</th></tr></thead>');
    html.push('          <tbody id="history-table-tbody"></tbody>');
    html.push('        </table>');
    html.push('        <div id="history-pagination-container"></div>');
    html.push('      </div>');
    html.push('    </section>');

    // Audit View
    html.push('    <section id="view-audit" class="view-container">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1>System Audit Log</h1><span class="view-subtitle">Chronological record of changes, handovers, and backups</span></div>');
    html.push('      </div>');
    html.push('      <div id="audit-filter-bar"></div>');
    html.push('      <div class="data-table-container">');
    html.push('        <table class="data-table">');
    html.push('          <thead><tr><th>Timestamp</th><th>Action Type</th><th>Activity Details</th></tr></thead>');
    html.push('          <tbody id="audit-table-tbody"></tbody>');
    html.push('        </table>');
    html.push('      </div>');
    html.push('    </section>');

    // Inbound & PO View
    html.push('    <section id="view-inbound" class="view-container">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1 data-i18n="po_title">Purchase Orders &amp; Inbound Receiving</h1><span class="view-subtitle" data-i18n="po_sub">Authorized intake entrypoint for hardware inventory</span></div>');
    html.push('        <button class="btn btn-primary btn-sm" onclick="UI_Inbound.openCreateModal()" data-i18n="btn_new_po">+ New Purchase Order</button>');
    html.push('      </div>');
    html.push('      <div id="inbound-filter-bar"></div>');
    html.push('      <div class="data-table-container">');
    html.push('        <table class="data-table">');
    html.push('          <thead><tr><th>PO Number</th><th>Vendor</th><th>Order Date</th><th>Line Items</th><th>Status</th><th style="text-align:right;">Actions</th></tr></thead>');
    html.push('          <tbody id="inbound-table-tbody"></tbody>');
    html.push('        </table>');
    html.push('      </div>');
    html.push('    </section>');
    html.push('    <section id="view-catalog" class="view-container">');
    html.push('      <div class="view-header"><div class="view-title-group"><h1 data-i18n="catalog_title">Master Item Catalog</h1><span class="view-subtitle">Pre-registered hardware, software, and consumable templates</span></div><div class="view-actions" style="display:flex; gap:8px;"><button class="btn btn-secondary" onclick="UI_Categories.openModal()">Manage Categories</button><button class="btn btn-primary" onclick="UI_Catalog.openModal()">+ Register Item</button></div></div>');
    html.push('      <div id="catalog-filter-bar"></div>');
    html.push('      <div class="data-table-container"><table class="data-table" id="catalog-table"><thead><tr><th style="width:36px;"><input type="checkbox" id="catalog-select-all" onchange="BulkActions.toggleAll(\'catalog\', this.checked)"></th><th>SKU / Barcode</th><th>Name</th><th>Type</th><th>Category</th><th>Model / Specs</th><th style="text-align:right;">Actions</th></tr></thead><tbody id="catalog-tbody"></tbody></table></div>');
    html.push('    </section>');

    // Settings View
    html.push('    <section id="view-settings" class="view-container">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1>Storage &amp; Automated Backup Engine</h1><span class="view-subtitle">Save directly to Local disk (C:\\...) or SMB Network Share (\\\\server\\share or Z:\\)</span></div>');
    html.push('      </div>');
    html.push('      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">');
    html.push('        <div class="card">');
    html.push('          <h3>Storage Configuration</h3>');
    html.push('          <div class="form-group">');
    html.push('            <label class="form-label">Storage Folder Path (Local or Network UNC / SMB):</label>');
    html.push('            <input type="text" id="setting-storage-path" class="form-input" placeholder="e.g. .\\data or C:\\IT_Inventory or \\\\nas\\share\\ITIM" />');
    html.push('            <small style="color:var(--text-tertiary);">Direct read/write access without browser download prompts.</small>');
    html.push('          </div>');
    html.push('          <div class="form-row">');
    html.push('            <div class="form-group"><label class="form-label">Organization Name:</label><input type="text" id="setting-org-name" class="form-input" /></div>');
    html.push('            <div class="form-group"><label class="form-label">Times of Backup in a Day:</label><input type="number" id="setting-backup-times-day" class="form-input" min="1" max="96" /></div>');
    html.push('          </div>');
    html.push('          <div class="form-row">');
    html.push('            <div class="form-group"><label class="form-label">Max Backup Count:</label><input type="number" id="setting-backup-max-count" class="form-input" min="1" max="500" /></div>');
    html.push('            <div class="form-group"><label class="form-label">Auto Clean:</label>' + (typeof UI_ComboBox !== "undefined" ? UI_ComboBox.renderHtml("setting-backup-clean-mode", [{value:"count",label:"By Count"},{value:"date",label:"By Date"},{value:"both",label:"By Date & Count"}], "both") : '<select id="setting-backup-clean-mode" class="form-select combo-box"><option value="count">By Count</option><option value="date">By Date</option><option value="both">By Date & Count</option></select>') + '</div>');
    html.push('            <div class="form-group"><label class="form-label">Clean Days:</label><input type="number" id="setting-backup-clean-days" class="form-input" min="1" max="365" /></div>');
    html.push('          </div>');
    html.push('          <div style="display:flex; gap:8px; margin-top:8px;">');
    html.push('            <button class="btn" onclick="UI_Settings.testPath()">Test Storage Path</button>');
    html.push('            <button class="btn btn-primary" onclick="UI_Settings.saveSettings()">Save Configuration</button>');
    html.push('          </div>');
    html.push('          <div id="storage-test-result" style="margin-top:12px; font-size:12px;"></div>');
    html.push('        </div>');
    html.push('        <div class="card">');
    html.push('          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">');
    html.push('            <h3>Automated Backup Snapshots</h3>');
    html.push('            <button class="btn btn-sm btn-primary" onclick="UI_Settings.createManualBackup()">Create Snapshot</button>');
    html.push('          </div>');
    html.push('          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">');
    html.push('            Stored in <code>&lt;storagePath&gt;\\backups</code>. Restore any snapshot with 1 click.');
    html.push('          </p>');
    html.push('          <div class="data-table-container" style="max-height:240px; overflow-y:auto;">');
    html.push('            <table class="data-table">');
    html.push('              <thead><tr><th>Snapshot File</th><th>Timestamp</th><th>Size</th><th style="text-align:right;">Action</th></tr></thead>');
    html.push('              <tbody id="backups-table-tbody"></tbody>');
    html.push('            </table>');
    html.push('          </div>');
    html.push('        </div>');
    html.push('      </div>');
    html.push('    </section>');

    html.push('  </main>');
    html.push('</div>');

    app.innerHTML = html.join("\n");
  }

  return {
    render: render
  };
})();
