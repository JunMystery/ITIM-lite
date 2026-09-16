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
    html.push('    <div class="app-logo" style="margin-right:10px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>');
    html.push('    <div class="app-title-group"><span class="app-title" style="margin-right:10px;">Asset<span class="app-title-accent">Ops</span></span><span class="app-badge"><span class="app-badge-dot" style="margin-right:6px;"></span>' + (isHta ? "Standalone" : "Browser") + '</span></div>');
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
    html.push('      <li><a class="nav-item" data-view="assets"><span data-i18n="nav_inventory">Inventory</span> <span id="nav-badge-assets" class="nav-count-badge">0</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="inbound"><span data-i18n="nav_inbound">Inbound &amp; PO</span> <span id="nav-badge-inbound" class="nav-count-badge">0</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="catalog"><span data-i18n="nav_catalog">Master Catalog</span> <span id="nav-badge-catalog" class="nav-count-badge">0</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="history"><span data-i18n="nav_history">Transactions</span> <span id="nav-badge-history" class="nav-count-badge">0</span></a></li>');
    html.push('      <li><a class="nav-item" data-view="audit"><span data-i18n="nav_audit">Audit Log</span></a></li>');
    html.push('    </ul>');
    html.push('    <div class="sidebar-footer">');
    html.push('      <a class="nav-item" data-view="settings"><span data-i18n="nav_settings">Storage &amp; Backup</span></a>');
    html.push('      <div class="sidebar-controls" style="display:flex; align-items:center; gap:6px; padding:6px 4px 2px 4px;">');
    html.push('        <div style="flex:1;">' + (typeof UI_ComboBox !== "undefined" ? UI_ComboBox.renderHtml("lang-switcher", [{value:"en",label:"EN"},{value:"vi",label:"VI"},{value:"jp",label:"JP"}], "en", "searchable-combo-sm combo-dropup", 'onchange="I18N.setLang(this.value)"') : '<select id="lang-switcher" class="form-select combo-box combo-box-sm" style="flex:1; height:28px;" onchange="I18N.setLang(this.value)"><option value="en">EN</option><option value="vi">VI</option><option value="jp">JP</option></select>') + '</div>');
    html.push('        <button class="btn btn-icon btn-sm" onclick="toggleTheme()" title="Toggle Dark Mode" style="width:28px; height:28px; padding:0; display:flex; align-items:center; justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></button>');
    html.push('      </div>');
    html.push('    </div>');
    html.push('  </aside>');

    // 4. Main Content Views
    html.push('  <main class="app-content">');

    // Dashboard View (Rebuilt Fleet Command)
    html.push('    <section id="view-dashboard" class="view-container active">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group">');
    html.push('          <div style="display:flex; align-items:center;">');
    html.push('            <h1 style="margin:0 10px 0 0;" data-i18n="dash_title">IT Operations &amp; Fleet Command</h1>');
    html.push('            <span class="badge badge-available" style="font-size:10px;" data-i18n="badge_live_sync">Live Sync</span>');
    html.push('          </div>');
    html.push('          <span class="view-subtitle" data-i18n="dash_sub">Live hardware allocation, consumable risk radar, and sign-offs</span>');
    html.push('        </div>');
    html.push('        <div style="display:flex;">');
    html.push('          <button class="btn btn-primary btn-sm" onclick="UI_History.openCreateModal(\'CHECKOUT\')" style="margin-right:8px;" data-i18n="btn_checkout">+ Check-out Asset</button>');
    html.push('          <button class="btn btn-sm" onclick="UI_Inbound.openCreateModal()" data-i18n="btn_new_po">+ Inbound PO</button>');
    html.push('        </div>');
    html.push('      </div>');
    html.push('      <div class="metrics-grid" style="margin-bottom:16px;">');
    html.push('        <div class="metric-card" style="flex:1 1 260px;">');
    html.push('          <div style="display:flex; justify-content:space-between; align-items:center;">');
    html.push('            <span class="metric-title" data-i18n="kpi_hardware_deploy">Hardware Deployment</span>');
    html.push('            <span id="dash-deploy-rate" style="font-size:11px; font-weight:600; color:var(--color-primary);">0% Active</span>');
    html.push('          </div>');
    html.push('          <div style="margin:6px 0;"><span id="dash-inuse-assets" class="metric-value" style="font-size:26px;">0</span> <span style="font-size:12px; color:var(--text-secondary);">/ <span id="dash-total-assets">0</span> <span data-i18n="units">units</span></span></div>');
    html.push('          <div class="segmented-bar"><div id="dash-bar-inuse" class="seg-inuse"></div><div id="dash-bar-avail" class="seg-avail"></div><div id="dash-bar-repair" class="seg-repair"></div></div>');
    html.push('          <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary); margin-top:6px;">');
    html.push('            <span data-i18n="status_inuse">In-Use</span><span><span data-i18n="status_ready">Ready</span>: <strong id="dash-avail-assets">0</strong></span><span><span data-i18n="status_repair">Repair</span>: <strong id="dash-repair-assets">0</strong></span>');
    html.push('          </div>');
    html.push('        </div>');
    html.push('        <div class="metric-card" style="flex:1 1 260px;">');
    html.push('          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">');
    html.push('            <span class="metric-title" data-i18n="kpi_risk_radar">Risk &amp; Action Radar</span>');
    html.push('            <span id="dash-risk-badge" class="badge badge-warning">0 Alerts</span>');
    html.push('          </div>');
    html.push('          <div style="display:flex; flex-direction:column; gap:6px;">');
    html.push('            <div class="risk-item"><div><strong id="dash-low-stock">0</strong> <span data-i18n="low_stock_consumables">Low-Stock Consumables</span></div><button class="btn btn-sm btn-primary" onclick="UI_Inbound.openCreateModal()" style="padding:1px 6px; font-size:10px;" data-i18n="btn_po">+ PO</button></div>');
    html.push('            <div class="risk-item"><div><strong id="dash-expiring-warranty">0</strong> <span data-i18n="warranties_expiring">Warranties &lt; 90d</span></div><button class="btn btn-sm" onclick="NavController.switchView(\'assets\')" style="padding:1px 6px; font-size:10px;" data-i18n="btn_view">View</button></div>');
    html.push('          </div>');
    html.push('        </div>');
    html.push('        <div class="metric-card" style="flex:1 1 260px;">');
    html.push('          <span class="metric-title" style="margin-bottom:6px;" data-i18n="kpi_software_quotas">Software &amp; Intake Quotas</span>');
    html.push('          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;"><span data-i18n="license_seats">License Seats:</span><strong id="dash-license-seats">0 / 0</strong></div>');
    html.push('          <div class="progress-bar-wrap"><div id="dash-license-bar" class="progress-bar-fill" style="width:0%;"></div></div>');
    html.push('          <div style="font-size:11px; color:var(--text-secondary); margin-top:8px; display:flex; justify-content:space-between;"><span data-i18n="active_inbound_deliveries">Active Inbound Deliveries:</span><strong id="dash-pending-pos">0 POs</strong></div>');
    html.push('        </div>');
    html.push('      </div>');
    html.push('      <div class="card">');
    html.push('        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">');
    html.push('          <h3 style="margin:0;" data-i18n="recent_activity">Recent Activity Stream</h3>');
    html.push('          <div class="activity-filter-group">');
    html.push('            <button class="btn btn-sm active" id="btn-dash-flt-all" onclick="UI_Dashboard.filterRecent(\'ALL\')" data-i18n="filter_all">All</button>');
    html.push('            <button class="btn btn-sm" id="btn-dash-flt-checkout" onclick="UI_Dashboard.filterRecent(\'CHECKOUT\')" data-i18n="filter_checkouts">Checkouts</button>');
    html.push('            <button class="btn btn-sm" id="btn-dash-flt-checkin" onclick="UI_Dashboard.filterRecent(\'CHECKIN\')" data-i18n="filter_checkins">Checkins</button>');
    html.push('            <button class="btn btn-sm" id="btn-dash-flt-inbound" onclick="UI_Dashboard.filterRecent(\'INBOUND\')" data-i18n="filter_inbound">Inbound</button>');
    html.push('          </div>');
    html.push('        </div>');
    html.push('        <div class="data-table-container">');
    html.push('          <table class="data-table"><thead><tr><th data-i18n="th_timestamp">Timestamp</th><th data-i18n="th_type">Type</th><th data-i18n="th_details">Activity Details</th></tr></thead><tbody id="dash-activity-tbody"></tbody></table>');
    html.push('        </div>');
    html.push('      </div>');
    html.push('    </section>');

    // Consolidated Inventory View (Tabs: Hardware, Software, Consumables)
    html.push('    <section id="view-assets" class="view-container">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1 data-i18n="inventory_title">Hardware, Software &amp; Stock Inventory</h1><span class="view-subtitle" data-i18n="inventory_sub">Live allocation of equipment, software seats, and stock levels</span></div>');
    html.push('        <div style="display:flex; gap:8px;">');
    html.push('          <button class="btn btn-primary btn-sm" onclick="NavController.switchView(\'inbound\')" data-i18n="po_inbound_intake">+ Inbound Intake</button>');
    html.push('        </div>');
    html.push('      </div>');
    html.push('      <div class="inventory-tabs" style="display:flex; gap:6px; margin-bottom:14px; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">');
    html.push('        <button id="tab-btn-assets" class="btn btn-sm btn-primary" onclick="UI_Assets.switchTab(\'assets\')" data-i18n="tab_hardware">Hardware</button>');
    html.push('        <button id="tab-btn-licenses" class="btn btn-sm" onclick="UI_Assets.switchTab(\'licenses\')" data-i18n="tab_software">Software</button>');
    html.push('        <button id="tab-btn-consumables" class="btn btn-sm" onclick="UI_Assets.switchTab(\'consumables\')" data-i18n="tab_consumables">Stock</button>');
    html.push('      </div>');
    html.push('      <div id="tab-panel-assets" class="inventory-tab-panel">');
    html.push('        <div id="assets-filter-bar"></div>');
    html.push('        <div id="assets-bulk-bar" class="bulk-dock-bar" style="display:none;">');
    html.push('          <span id="assets-selected-label" style="font-weight:600; font-size:12px; color:var(--color-primary);">0 selected</span>');
    html.push('          <button class="btn btn-primary btn-sm" onclick="UI_Assets.triggerBulkAction(\'checkout\')" data-i18n="btn_bulk_checkout">Bulk Check-out</button>');
    html.push('          <button class="btn btn-sm" onclick="UI_Assets.triggerBulkAction(\'checkin\')" data-i18n="btn_bulk_checkin">Bulk Check-in</button>');
    html.push('          <button class="btn btn-sm" onclick="UI_Assets.triggerBulkAction(\'status\')" data-i18n="btn_bulk_status">Change Status</button>');
    html.push('          <button class="btn btn-sm" onclick="UI_Assets.triggerBulkAction(\'print\')" data-i18n="btn_tag">Print Tags</button>');
    html.push('          <button class="btn btn-sm" onclick="UI_Assets.clearSelection()" data-i18n="btn_clear">Clear</button>');
    html.push('        </div>');
    html.push('        <div class="data-table-container">');
    html.push('          <table class="data-table">');
    html.push('            <thead><tr><th style="width:30px; text-align:center;"><input type="checkbox" id="assets-select-all" onchange="UI_Assets.toggleSelectAll(this.checked)" /></th><th data-i18n="th_asset_id">Asset ID</th><th data-i18n="th_name_model">Name / Model</th><th data-i18n="th_category">Category</th><th data-i18n="th_serial">Serial No</th><th data-i18n="th_status">Status</th><th data-i18n="th_assigned_to">Assigned To</th><th style="text-align:right;" data-i18n="th_actions">Actions</th></tr></thead>');
    html.push('            <tbody id="assets-table-tbody"></tbody>');
    html.push('          </table>');
    html.push('          <div id="assets-pagination-container"></div>');
    html.push('        </div>');
    html.push('      </div>');
    html.push('      <div id="tab-panel-licenses" class="inventory-tab-panel" style="display:none;">');
    html.push('        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">');
    html.push('          <div id="licenses-filter-bar" style="flex:1;"></div>');
    html.push('          <button class="btn btn-primary btn-sm" onclick="UI_Licenses.openModal()" style="margin-left:8px;" data-i18n="btn_add_license">+ Add License</button>');
    html.push('        </div>');
    html.push('        <div class="data-table-container">');
    html.push('          <table class="data-table">');
    html.push('            <thead><tr><th data-i18n="th_id">ID</th><th data-i18n="th_software_vendor">Software / Vendor</th><th data-i18n="th_type">Type</th><th data-i18n="th_seat_alloc">Seat Allocation</th><th data-i18n="th_renewal">Renewal / Expiry</th><th style="text-align:right;" data-i18n="th_actions">Actions</th></tr></thead>');
    html.push('            <tbody id="licenses-table-tbody"></tbody>');
    html.push('          </table>');
    html.push('        </div>');
    html.push('      </div>');
    html.push('      <div id="tab-panel-consumables" class="inventory-tab-panel" style="display:none;">');
    html.push('        <div id="consumables-filter-bar"></div>');
    html.push('        <div class="data-table-container">');
    html.push('          <table class="data-table">');
    html.push('            <thead><tr><th data-i18n="th_id">ID</th><th data-i18n="th_item_name">Item Name</th><th data-i18n="th_category">Category</th><th data-i18n="th_stock">Stock</th><th data-i18n="th_location">Storage Location</th><th style="text-align:right;" data-i18n="th_actions">Actions</th></tr></thead>');
    html.push('            <tbody id="consumables-table-tbody"></tbody>');
    html.push('          </table>');
    html.push('        </div>');
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
    html.push('          <thead><tr><th data-i18n="th_txn_id">Txn ID</th><th data-i18n="th_type">Type</th><th data-i18n="th_recipient">Recipient / Party</th><th data-i18n="th_items">Items</th><th data-i18n="th_timestamp">Timestamp</th><th style="text-align:right;" data-i18n="th_actions">Actions</th></tr></thead>');
    html.push('          <tbody id="history-table-tbody"></tbody>');
    html.push('        </table>');
    html.push('        <div id="history-pagination-container"></div>');
    html.push('      </div>');
    html.push('    </section>');

    // Stocktake & Inventory Audit View
    html.push('    <section id="view-audit" class="view-container">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1 data-i18n="audit_title">Physical Inventory Stocktake &amp; Audit</h1><span class="view-subtitle" data-i18n="audit_sub">Sessions, barcode counting, discrepancy reconciliation, and official reports</span></div>');
    html.push('        <button class="btn btn-primary btn-sm" onclick="UI_Audit.openCreateModal()" data-i18n="btn_new_stocktake">+ New Audit Session</button>');
    html.push('      </div>');
    html.push('      <div id="stocktake-workspace-host"></div>');
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
    html.push('          <thead><tr><th data-i18n="th_po_number">PO Number</th><th data-i18n="th_vendor">Vendor</th><th data-i18n="th_order_date">Order Date</th><th data-i18n="th_line_items">Line Items</th><th data-i18n="th_status">Status</th><th style="text-align:right;" data-i18n="th_actions">Actions</th></tr></thead>');
    html.push('          <tbody id="inbound-table-tbody"></tbody>');
    html.push('        </table>');
    html.push('      </div>');
    html.push('    </section>');
    html.push('    <section id="view-catalog" class="view-container">');
    html.push('      <div class="view-header"><div class="view-title-group"><h1 data-i18n="catalog_title">Master Item Catalog</h1><span class="view-subtitle" data-i18n="catalog_sub">Pre-registered hardware, software, and consumable templates</span></div><div class="view-actions" style="display:flex; gap:8px;"><button class="btn btn-secondary" onclick="UI_Categories.openModal()" data-i18n="btn_manage_categories">Manage Categories</button><button class="btn btn-primary" onclick="UI_Catalog.openModal()" data-i18n="btn_register_item">+ Register Item</button></div></div>');
    html.push('      <div id="catalog-filter-bar"></div>');
    html.push('      <div class="data-table-container"><table class="data-table" id="catalog-table"><thead><tr><th style="width:36px;"><input type="checkbox" id="catalog-select-all" onchange="BulkActions.toggleAll(\'catalog\', this.checked)"></th><th data-i18n="th_sku">SKU / Barcode</th><th data-i18n="th_name">Name</th><th data-i18n="th_type">Type</th><th data-i18n="th_category">Category</th><th data-i18n="th_model_specs">Model / Specs</th><th style="text-align:right;" data-i18n="th_actions">Actions</th></tr></thead><tbody id="catalog-tbody"></tbody></table></div>');
    html.push('    </section>');

    // Settings View
    html.push('    <section id="view-settings" class="view-container">');
    html.push('      <div class="view-header">');
    html.push('        <div class="view-title-group"><h1 data-i18n="settings_title">Storage &amp; Automated Backup Engine</h1><span class="view-subtitle" data-i18n="settings_sub">Save directly to Local disk (C:\\...) or SMB Network Share (\\\\server\\share or Z:\\)</span></div>');
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
