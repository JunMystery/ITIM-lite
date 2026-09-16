/* ==========================================================================
   ITIM-lite - Internationalization (i18n) Engine & Placeholders
   Languages Supported: EN (English), VI (Tiếng Việt), JP (日本語)
   ========================================================================== */

var I18N = (function () {
  var currentLang = "en";

  var DICT = {
    en: {
      app_title: "AssetOps", search_placeholder: "Search assets, serials, users, models... (Ctrl+F)",
      ph_asset_name: "e.g. Dell Latitude 5530", ph_serial: "Service Tag / Serial Number",
      ph_model: "CPU, RAM, Storage specifications", ph_storage_path: "e.g. .\\data or C:\\IT_Inventory or \\\\nas\\share\\ITIM",
      ph_employee_name: "Employee full name", ph_department: "Department name", ph_location: "Floor / Desk / Server Rack", ph_notes: "Additional observations or notes",
      nav_dashboard: "Dashboard", nav_assets: "Inventory", nav_inventory: "Inventory", nav_licenses: "Software", nav_consumables: "Stock",
      nav_assignments: "Handover", nav_history: "Transactions", nav_audit: "Inventory Audit", nav_settings: "Storage & Backup",
      nav_inbound: "Inbound & PO", nav_catalog: "Master Catalog",
      tab_hardware: "Hardware", tab_software: "Software", tab_consumables: "Stock",
      inventory_title: "Hardware, Software & Stock Inventory", inventory_sub: "Live allocation of equipment, software seats, and stock levels",
      dash_title: "IT Operations & Fleet Command", dash_sub: "Live hardware allocation, consumable risk radar, and sign-offs", badge_live_sync: "Live Sync",
      assets_title: "Hardware Inventory", assets_sub: "Computers, monitors, network gear, and peripherals",
      licenses_title: "Software Licenses & Subscriptions", licenses_sub: "Seat allocations, license keys, and renewal dates",
      consumables_title: "Consumables & Accessories", consumables_sub: "Cables, toners, mice, keyboards, and stock levels",
      assignments_title: "Equipment Handover & Assignments", assignments_sub: "Check-out hardware and print sign-off receipts",
      history_title: "Transaction History & Multi-Item Handover", history_sub: "Track bulk operations, unique Transaction IDs, and sign-offs",
      audit_title: "Physical Inventory Stocktake & Audit", audit_sub: "Sessions, barcode counting, discrepancy reconciliation, and official reports",
      btn_new_stocktake: "+ New Audit Session", th_session_id: "Session ID", th_session_name: "Session Name", th_scope: "Scope",
      th_progress: "Progress", th_matched: "Matched", th_missing: "Missing", th_surplus: "Surplus",
      btn_print_stocktake: "Print Audit Report", btn_reconcile: "Reconciliation", btn_start_scan: "Live Count", btn_close_audit: "Complete & Close Session",
      po_title: "Purchase Orders & Inbound Receiving", po_sub: "Authorized intake entrypoint for hardware inventory",
      catalog_title: "Master Item Catalog", catalog_sub: "Pre-registered hardware, software, and consumable templates",
      settings_title: "Storage & Automated Backup Engine", settings_sub: "Save directly to Local disk (C:\\...) or SMB Network Share (\\\\server\\share or Z:\\)",
      kpi_total: "Total Assets", kpi_inuse: "Deployed", kpi_avail: "In Stock", kpi_repair: "In Repair", kpi_value: "Valuation",
      kpi_warranty: "Expiring Warranty", kpi_low_stock: "Low Stock", kpi_seats: "License Seats", recent_activity: "Recent Activity Stream",
      kpi_hardware_deploy: "Hardware Deployment", kpi_risk_radar: "Risk & Action Radar", kpi_software_quotas: "Software & Intake Quotas",
      status_active: "Active", status_ready: "Ready", risk_alert: "Alert", risk_alerts: "Alerts",
      active_pos: "Active POs", active_po: "Active PO", low_stock_consumables: "Low-Stock Consumables", warranties_expiring: "Warranties < 90d",
      license_seats: "License Seats:", active_inbound_deliveries: "Active Inbound Deliveries:", units: "units",
      filter_all: "All", filter_checkouts: "Checkouts", filter_checkins: "Checkins", filter_inbound: "Inbound",
      btn_new_asset: "+ New Asset", btn_checkout: "+ Check-out Asset", btn_bulk_checkout: "Bulk Check-out", btn_bulk_checkin: "Bulk Check-in",
      btn_bulk_status: "Change Status", btn_clear: "Clear", btn_backup: "Backup", btn_export_csv: "Export CSV", btn_import_csv: "Import CSV",
      btn_save: "Save", btn_cancel: "Cancel", btn_return: "Return", btn_receipt: "Receipt", btn_tag: "Tag", btn_new_txn: "+ New Transaction",
      btn_details: "Details", btn_new_po: "+ Inbound PO", btn_po: "+ PO", btn_view: "View", btn_add_license: "+ Add License",
      btn_manage_categories: "Manage Categories", btn_register_item: "+ Register Item", po_inbound_intake: "+ Inbound Intake",
      txn_detail_title: "Transaction Details & Sign-Off", showing_items: "Showing", per_page: "per page", page: "Page", of: "of",
      status_all: "All", status_available: "Available", status_inuse: "In Use", status_repair: "In Repair", status_retired: "Retired",
      status_received: "Fully Received", status_partial: "Partially Received", status_pending: "Pending Delivery",
      storage_connected_local: "Local Storage Connected", storage_connected_smb: "SMB Storage Connected",
      th_timestamp: "Timestamp", th_type: "Type", th_details: "Activity Details",
      th_asset_id: "Asset ID", th_name_model: "Name / Model", th_category: "Category", th_serial: "Serial No", th_status: "Status", th_assigned_to: "Assigned To", th_actions: "Actions",
      th_id: "ID", th_software_vendor: "Software / Vendor", th_seat_alloc: "Seat Allocation", th_renewal: "Renewal / Expiry",
      th_item_name: "Item Name", th_stock: "Stock", th_location: "Storage Location",
      th_record_id: "Record ID", th_asset: "Hardware Asset", th_employee: "Assigned Employee", th_checkout_date: "Checkout Date", th_expected_return: "Expected / Returned",
      th_po_number: "PO Number", th_vendor: "Vendor", th_order_date: "Order Date", th_line_items: "Line Items",
      th_sku: "SKU / Barcode", th_name: "Name", th_model_specs: "Model / Specs", th_recipient: "Recipient / Party", th_items: "Items", th_action_type: "Action Type",
      tab_hardware: "Hardware Assets", tab_consumables: "Consumables", tab_software: "Software",
      select_asset: "Select Hardware Asset", select_consumable: "Select Consumable", select_license: "Select Software",
      no_items_selected: "No items selected yet. Use tabs above to add equipment, consumables, or software.", btn_add: "Add",
      action_return_stock: "Return to Stock", action_set_disposal: "Set Disposal / Consumed",
      section_hardware: "Hardware Assets", section_consumables: "Consumables & Accessories", section_software: "Software Licenses",
      no_activity: "No recent activity recorded", empty_assets: "No assets match current criteria."
    },
    vi: {
      app_title: "AssetOps", search_placeholder: "Tìm kiếm tài sản, số serial, người dùng, model... (Ctrl+F)",
      ph_asset_name: "ví dụ: Dell Latitude 5530", ph_serial: "Mã số serial / Service Tag",
      ph_model: "Chi tiết CPU, RAM, ổ cứng", ph_storage_path: "ví dụ: .\\data hoặc C:\\IT_Inventory hoặc \\\\nas\\share\\ITIM",
      ph_employee_name: "Họ và tên nhân viên", ph_department: "Phòng ban", ph_location: "Tầng / Bàn làm việc / Tủ rack", ph_notes: "Ghi chú thêm hoặc tình trạng",
      nav_dashboard: "Bảng điều khiển", nav_assets: "Kho & Tài sản", nav_inventory: "Kho & Tài sản", nav_licenses: "Bản quyền", nav_consumables: "Vật tư phụ",
      nav_assignments: "Bàn giao", nav_history: "Lịch sử giao dịch", nav_audit: "Kiểm kê", nav_settings: "Lưu trữ & Sao lưu",
      nav_inbound: "Nhập kho & PO", nav_catalog: "Danh mục chuẩn",
      tab_hardware: "Phần cứng", tab_software: "Phần mềm", tab_consumables: "Vật tư",
      inventory_title: "Quản lý Kho & Danh mục Tài sản", inventory_sub: "Theo dõi phần cứng, hạn mức bản quyền phần mềm và tồn kho vật tư",
      dash_title: "Trung tâm Giám sát & Vận hành IT", dash_sub: "Phân bổ thiết bị thời gian thực, radar rủi ro và biên bản bàn giao", badge_live_sync: "Đồng bộ",
      assets_title: "Kho thiết bị phần cứng", assets_sub: "Máy tính, màn hình, thiết bị mạng và phụ kiện",
      licenses_title: "Bản quyền phần mềm & Đăng ký", licenses_sub: "Phân bổ số lượng, mã bản quyền và thời hạn gia hạn",
      consumables_title: "Vật tư & Phụ kiện tiêu hao", consumables_sub: "Dây cáp, mực in, chuột, bàn phím và định mức kho",
      assignments_title: "Bàn giao & Cấp phát thiết bị", assignments_sub: "Xuất kho thiết bị và in biên bản bàn giao",
      history_title: "Lịch Sử Giao Dịch & Bàn Giao Nhiều Thiết Bị", history_sub: "Quản lý thao tác hàng loạt, mã giao dịch duy nhất và phiếu ký",
      audit_title: "Kiểm Kê Tài Sản & Đối Chiếu Thực Tế", audit_sub: "Tạo phiên kiểm kê, quét barcode/nhập tay, đối chiếu chênh lệch và in biên bản",
      btn_new_stocktake: "+ Tạo phiên kiểm kê", th_session_id: "Mã phiên", th_session_name: "Tên phiên kiểm kê", th_scope: "Phạm vi",
      th_progress: "Tiến độ", th_matched: "Khớp", th_missing: "Thiếu", th_surplus: "Thừa",
      btn_print_stocktake: "In biên bản kiểm kê", btn_reconcile: "Đối chiếu", btn_start_scan: "Kiểm đếm", btn_close_audit: "Hoàn tất & Đóng phiên",
      po_title: "Đơn Mua Hàng & Nhập Kho", po_sub: "Điểm nhập kho thiết bị phần cứng chính thức",
      catalog_title: "Danh Mục Thiết Bị Gốc", catalog_sub: "Mẫu định nghĩa phần cứng, phần mềm và vật tư",
      settings_title: "Cấu hình lưu trữ & Động cơ sao lưu tự động", settings_sub: "Lưu trực tiếp vào ổ đĩa cục bộ (C:\\...) hoặc ổ mạng SMB (\\\\server\\share hoặc Z:\\)",
      kpi_total: "Tổng thiết bị", kpi_inuse: "Đang cấp phát", kpi_avail: "Còn trong kho", kpi_repair: "Đang sửa chữa", kpi_value: "Tổng định giá",
      kpi_warranty: "Sắp hết bảo hành", kpi_low_stock: "Vật tư sắp hết", kpi_seats: "Chỗ cấp phép", recent_activity: "Hoạt Động Gần Đây",
      kpi_hardware_deploy: "Tỷ lệ cấp phát phần cứng", kpi_risk_radar: "Radar rủi ro & Hành động", kpi_software_quotas: "Hạn mức phần mềm & Nhập kho",
      status_active: "Hoạt động", status_ready: "Sẵn sàng", risk_alert: "Cảnh báo", risk_alerts: "Cảnh báo",
      active_pos: "Đơn hàng", active_po: "Đơn hàng", low_stock_consumables: "Vật tư sắp hết", warranties_expiring: "Bảo hành < 90 ngày",
      license_seats: "Số lượng bản quyền:", active_inbound_deliveries: "Đơn hàng đang giao:", units: "thiết bị",
      filter_all: "Tất cả", filter_checkouts: "Cấp phát", filter_checkins: "Thu hồi", filter_inbound: "Nhập kho",
      btn_new_asset: "+ Thêm thiết bị", btn_checkout: "+ Xuất bàn giao", btn_bulk_checkout: "Cấp phát hàng loạt", btn_bulk_checkin: "Thu hồi hàng loạt",
      btn_bulk_status: "Đổi trạng thái", btn_clear: "Bỏ chọn", btn_backup: "Sao lưu", btn_export_csv: "Xuất file CSV", btn_import_csv: "Nhập file CSV",
      btn_save: "Lưu lại", btn_cancel: "Hủy bỏ", btn_return: "Thu hồi", btn_receipt: "Phiếu ký", btn_tag: "In nhãn", btn_new_txn: "+ Tạo giao dịch",
      btn_details: "Chi tiết", btn_new_po: "+ Tạo đơn mua", btn_po: "+ PO", btn_view: "Xem", btn_add_license: "+ Thêm bản quyền",
      btn_manage_categories: "Quản lý danh mục", btn_register_item: "+ Đăng ký mẫu", po_inbound_intake: "+ Nhập Kho PO",
      txn_detail_title: "Chi tiết giao dịch & Biên bản bàn giao", showing_items: "Hiển thị", per_page: "mục / trang", page: "Trang", of: "trên",
      status_all: "Tất cả", status_available: "Sẵn sàng", status_inuse: "Đang dùng", status_repair: "Đang sửa", status_retired: "Thanh lý",
      status_received: "Đã nhận đủ", status_partial: "Nhận một phần", status_pending: "Chờ giao hàng",
      storage_connected_local: "Đã kết nối ổ đĩa nội bộ", storage_connected_smb: "Đã kết nối thư mục mạng SMB",
      th_timestamp: "Thời gian", th_type: "Loại", th_details: "Chi tiết hoạt động",
      th_asset_id: "Mã thiết bị", th_name_model: "Tên / Model", th_category: "Danh mục", th_serial: "Số Serial", th_status: "Trạng thái", th_assigned_to: "Người nhận", th_actions: "Thao tác",
      th_id: "Mã", th_software_vendor: "Phần mềm / Hãng", th_seat_alloc: "Số lượng cấp", th_renewal: "Hạn gia hạn",
      th_item_name: "Tên vật tư", th_stock: "Tồn kho", th_location: "Vị trí lưu trữ",
      th_record_id: "Mã phiếu", th_asset: "Thiết bị", th_employee: "Nhân viên nhận", th_checkout_date: "Ngày cấp", th_expected_return: "Hạn trả / Ngày trả",
      th_po_number: "Số đơn PO", th_vendor: "Nhà cung cấp", th_order_date: "Ngày đặt", th_line_items: "Mặt hàng",
      th_sku: "Mã SKU / Barcode", th_name: "Tên", th_model_specs: "Thông số / Model", th_recipient: "Người nhận / Đối tác", th_items: "Mặt hàng", th_action_type: "Loại hành động",
      tab_hardware: "Phần cứng", tab_consumables: "Vật tư phụ", tab_software: "Phần mềm",
      select_asset: "Chọn thiết bị phần cứng", select_consumable: "Chọn vật tư tiêu hao", select_license: "Chọn bản quyền phần mềm",
      no_items_selected: "Chưa có mục nào được chọn. Sử dụng các tab phía trên để thêm thiết bị, vật tư hoặc phần mềm.", btn_add: "Thêm",
      action_return_stock: "Nhập lại kho", action_set_disposal: "Thanh lý / Tiêu hao",
      section_hardware: "Thiết bị phần cứng", section_consumables: "Vật tư & Phụ kiện", section_software: "Bản quyền phần mềm",
      no_activity: "Chưa có hoạt động nào được ghi nhận", empty_assets: "Không có thiết bị nào phù hợp với điều kiện."
    },
    jp: {
      app_title: "AssetOps", search_placeholder: "資産、シリアル、利用者、モデルを検索... (Ctrl+F)",
      ph_asset_name: "例: Dell Latitude 5530", ph_serial: "サービスタグ / シリアル番号",
      ph_model: "CPU、メモリ、ストレージ詳細", ph_storage_path: "例: .\\data または C:\\IT_Inventory または \\\\nas\\share\\ITIM",
      ph_employee_name: "社員氏名", ph_department: "所属部署", ph_location: "フロア / デスク / サーバーラック", ph_notes: "特記事項・備考",
      nav_dashboard: "ダッシュボード", nav_assets: "在庫・資産管理", nav_inventory: "在庫・資産管理", nav_licenses: "ライセンス", nav_consumables: "消耗品・在庫",
      nav_assignments: "機器受渡", nav_history: "取引履歴", nav_audit: "実地棚卸", nav_settings: "保存・バックアップ",
      nav_inbound: "入庫 & PO", nav_catalog: "マスター台帳",
      tab_hardware: "ハードウェア", tab_software: "ソフトウェア", tab_consumables: "消耗品",
      inventory_title: "IT資産・ソフトウェア・消耗品統合管理", inventory_sub: "ハードウェア、ライセンス、消耗品のリアルタイム管理",
      dash_title: "IT運用 & フリート管理センター", dash_sub: "リアルタイムハードウェア稼働状況、リスク警報および取引ログ", badge_live_sync: "同期中",
      assets_title: "ハードウェア資産台帳", assets_sub: "PC、モニター、ネットワーク機器および周辺機器",
      licenses_title: "ソフトウェアライセンス & サブスクリプション", licenses_sub: "ライセンス割当、キー管理および更新期限",
      consumables_title: "消耗品 & アクセサリ管理", consumables_sub: "ケーブル、トナー、マウス、キーボードおよび在庫残数",
      assignments_title: "機器払出 & 割当管理", assignments_sub: "ハードウェア払出および受領証・署名記録",
      history_title: "取引履歴 & 一括払出管理", history_sub: "一括操作、個別取引番号および署名録の追跡",
      audit_title: "実地棚卸 & 資産監査", audit_sub: "棚卸セッション作成、バーコード照合、差異分析および報告書印刷",
      btn_new_stocktake: "+ 新規棚卸セッション", th_session_id: "セッションID", th_session_name: "棚卸名称", th_scope: "対象範囲",
      th_progress: "進捗率", th_matched: "一致", th_missing: "不明・紛失", th_surplus: "台帳外・余剰",
      btn_print_stocktake: "棚卸報告書印刷", btn_reconcile: "差異照合", btn_start_scan: "現品確認", btn_close_audit: "棚卸完了・確定",
      po_title: "発注管理 & 入庫受入", po_sub: "正規ハードウェア在庫受入管理",
      catalog_title: "マスター品目台帳", catalog_sub: "登録済みハードウェア、ソフトウェア、消耗品テンプレート",
      settings_title: "ストレージ & 自動バックアップ設定", settings_sub: "ローカルディスク (C:\\...) または SMB ネットワーク共有 (\\\\server\\share) に直接保存",
      kpi_total: "総資産数", kpi_inuse: "配備中", kpi_avail: "利用可能", kpi_repair: "修理中", kpi_value: "資産評価額",
      kpi_warranty: "保守期限切迫", kpi_low_stock: "在庫僅少", kpi_seats: "ライセンス枠", recent_activity: "最新操作履歴",
      kpi_hardware_deploy: "機器稼働状況", kpi_risk_radar: "リスク & アクション警報", kpi_software_quotas: "ソフトウェア枠 & 発注状況",
      status_active: "稼働中", status_ready: "待機中", risk_alert: "件の警告", risk_alerts: "件の警告",
      active_pos: "件の発注", active_po: "件の発注", low_stock_consumables: "在庫僅少品目", warranties_expiring: "保守期限 90日以内",
      license_seats: "ライセンス利用状況:", active_inbound_deliveries: "入荷待ち発注:", units: "台",
      filter_all: "全て", filter_checkouts: "払出", filter_checkins: "返却", filter_inbound: "入庫",
      btn_new_asset: "+ 機器登録", btn_checkout: "+ 機器払出", btn_bulk_checkout: "一括払出", btn_bulk_checkin: "一括返却",
      btn_bulk_status: "状態変更", btn_clear: "選択解除", btn_backup: "バックアップ", btn_export_csv: "CSVエクスポート", btn_import_csv: "CSVインポート",
      btn_save: "保存", btn_cancel: "キャンセル", btn_return: "返却", btn_receipt: "受領書", btn_tag: "ラベル印刷", btn_new_txn: "+ 新規取引登録",
      btn_details: "詳細", btn_new_po: "+ 発注作成", btn_po: "+ 発注", btn_view: "表示", btn_add_license: "+ ライセンス登録",
      btn_manage_categories: "カテゴリ管理", btn_register_item: "+ 品目登録", po_inbound_intake: "+ 入庫受入",
      txn_detail_title: "取引詳細および署名録", showing_items: "表示中:", per_page: "件/ページ", page: "ページ", of: "/",
      status_all: "全て", status_available: "利用可能", status_inuse: "使用中", status_repair: "修理中", status_retired: "廃棄・除籍",
      status_received: "入荷完了", status_partial: "一部入荷", status_pending: "入荷待ち",
      storage_connected_local: "ローカルストレージ接続済", storage_connected_smb: "SMBネットワーク共有接続済",
      th_timestamp: "日時", th_type: "種別", th_details: "操作詳細",
      th_asset_id: "資産ID", th_name_model: "品名 / 型番", th_category: "カテゴリ", th_serial: "シリアル番号", th_status: "状態", th_assigned_to: "使用者", th_actions: "操作",
      th_id: "ID", th_software_vendor: "ソフトウェア / ベンダー", th_seat_alloc: "割当数 / 上限", th_renewal: "更新期限",
      th_item_name: "品名", th_stock: "在庫数", th_location: "保管場所",
      th_record_id: "管理番号", th_asset: "対象機器", th_employee: "使用者", th_checkout_date: "払出日", th_expected_return: "返却予定 / 返却日",
      th_po_number: "発注番号", th_vendor: "仕入先", th_order_date: "発注日", th_line_items: "品目数",
      th_sku: "SKU / バーコード", th_name: "品名", th_model_specs: "仕様 / 型番", th_recipient: "取引先 / 受取人", th_items: "品目", th_action_type: "操作種別",
      tab_hardware: "ハードウェア", tab_consumables: "消耗品", tab_software: "ソフトウェア",
      select_asset: "機器を選択", select_consumable: "消耗品を選択", select_license: "ソフトウェアを選択",
      no_items_selected: "品目が選択されていません。上部タブから機器、消耗品、ソフトウェアを追加してください。", btn_add: "追加",
      action_return_stock: "在庫に返却", action_set_disposal: "廃棄・消耗処理",
      section_hardware: "ハードウェア資産", section_consumables: "消耗品・アクセサリ", section_software: "ソフトウェアライセンス",
      no_activity: "最近の履歴はありません", empty_assets: "該当する資産がありません。"
    }
  };

  function t(key) {
    var langDict = DICT[currentLang] || DICT.en;
    return langDict[key] || DICT.en[key] || key;
  }

  function apply() {
    if (typeof document === "undefined") return;
    // Translate innerText for elements with data-i18n
    var translatables = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < translatables.length; i++) {
      var el = translatables[i];
      var key = el.getAttribute("data-i18n");
      if (key) el.innerText = t(key);
    }

    // Translate placeholder for inputs with data-i18n-placeholder
    var inputs = document.querySelectorAll("[data-i18n-placeholder]");
    for (var j = 0; j < inputs.length; j++) {
      var input = inputs[j];
      var phKey = input.getAttribute("data-i18n-placeholder");
      if (phKey) input.placeholder = t(phKey);
    }

    // Update language select dropdown value if present
    var select = document.getElementById("lang-switcher");
    if (select) select.value = currentLang;

    // Refresh active view to reflect language changes
    if (typeof NavController !== "undefined") {
      NavController.switchView(NavController.getActiveView());
    }
  }

  function setLang(lang) {
    if (!DICT[lang]) lang = "en";
    currentLang = lang;
    try {
      localStorage.setItem("ITIM_LANG", lang);
    } catch (e) {}

    if (typeof AppState !== "undefined" && AppState.db && AppState.db.settings) {
      AppState.db.settings.language = lang;
      AppState.save();
    }

    apply();
  }

  function init() {
    var saved = "en";
    try {
      saved = localStorage.getItem("ITIM_LANG") || "en";
    } catch (e) {}

    if (typeof AppState !== "undefined" && AppState.db && AppState.db.settings && AppState.db.settings.language) {
      saved = AppState.db.settings.language;
    }
    setLang(saved);
  }

  return {
    t: t,
    apply: apply,
    setLang: setLang,
    getLang: function () { return currentLang; },
    init: init
  };
})();
