/* ==========================================================================
   ITIM-lite - Internationalization (i18n) Engine & Placeholders
   Languages Supported: EN (English), VI (Tiếng Việt), JP (日本語)
   ========================================================================== */

var I18N = (function () {
  var currentLang = "en";

  var DICT = {
    en: {
      app_title: "ITIM-lite",
      search_placeholder: "Search assets, serials, users, models... (Ctrl+F)",
      ph_asset_name: "e.g. Dell Latitude 5530",
      ph_serial: "Service Tag / Serial Number",
      ph_model: "CPU, RAM, Storage specifications",
      ph_storage_path: "e.g. .\\data or C:\\IT_Inventory or \\\\nas\\share\\ITIM",
      ph_employee_name: "Employee full name",
      ph_department: "Department name",
      ph_location: "Floor / Desk / Server Rack",
      ph_notes: "Additional observations or notes",
      nav_dashboard: "Dashboard",
      nav_assets: "Assets",
      nav_licenses: "Software",
      nav_consumables: "Stock",
      nav_assignments: "Handover",
      nav_history: "Transactions",
      nav_audit: "Audit Log",
      nav_settings: "Storage & Backup",
      dash_title: "IT Operations Dashboard",
      dash_sub: "Live hardware inventory, license quotas, and audit status",
      history_title: "Transaction History & Multi-Item Handover",
      history_sub: "Track bulk operations, unique Transaction IDs, and sign-offs",
      kpi_total: "Total Assets",
      kpi_inuse: "Deployed",
      kpi_avail: "In Stock",
      kpi_repair: "In Repair",
      kpi_value: "Valuation",
      kpi_warranty: "Expiring Warranty",
      kpi_low_stock: "Low Stock",
      kpi_seats: "License Seats",
      recent_activity: "Recent Inventory Activity",
      btn_new_asset: "+ New Asset",
      btn_checkout: "+ Check-out Asset",
      btn_bulk_checkout: "Bulk Check-out",
      btn_bulk_checkin: "Bulk Check-in",
      btn_bulk_status: "Change Status",
      btn_clear: "Clear",
      btn_backup: "Backup",
      btn_export_csv: "Export CSV",
      btn_import_csv: "Import CSV",
      btn_save: "Save",
      btn_cancel: "Cancel",
      btn_return: "Return",
      btn_receipt: "Receipt",
      btn_tag: "Tag",
      btn_new_txn: "+ New Transaction",
      btn_details: "Details",
      txn_detail_title: "Transaction Details & Sign-Off",
      showing_items: "Showing",
      per_page: "per page",
      page: "Page",
      of: "of",
      status_all: "All",
      status_available: "Available",
      status_inuse: "In Use",
      status_repair: "In Repair",
      status_retired: "Retired",
      nav_inbound: "Inbound & PO",
      nav_catalog: "Master Catalog",
      catalog_title: "Master Item Catalog",
      btn_new_po: "+ New PO",
      po_title: "Purchase Orders & Inbound Receiving",
      po_sub: "Authorized intake entrypoint for hardware inventory",
      po_inbound_intake: "+ Inbound Intake",
      storage_connected_local: "Local Storage Connected",
      storage_connected_smb: "SMB Storage Connected"
    },
    vi: {
      app_title: "ITIM-lite",
      search_placeholder: "Tìm kiếm tài sản, số serial, người dùng, model... (Ctrl+F)",
      ph_asset_name: "ví dụ: Dell Latitude 5530",
      ph_serial: "Mã số serial / Service Tag",
      ph_model: "Chi tiết CPU, RAM, ổ cứng",
      ph_storage_path: "ví dụ: .\\data hoặc C:\\IT_Inventory hoặc \\\\nas\\share\\ITIM",
      ph_employee_name: "Họ và tên nhân viên",
      ph_department: "Phòng ban",
      ph_location: "Tầng / Bàn làm việc / Tủ rack",
      ph_notes: "Ghi chú thêm hoặc tình trạng",
      nav_dashboard: "Bảng điều khiển",
      nav_assets: "Tài sản IT",
      nav_licenses: "Bản quyền",
      nav_consumables: "Vật tư phụ",
      nav_assignments: "Bàn giao",
      nav_history: "Lịch sử giao dịch",
      nav_audit: "Nhật ký kiểm toán",
      nav_settings: "Lưu trữ & Sao lưu",
      dash_title: "Bảng Quản Lý Vận Hành IT",
      dash_sub: "Theo dõi phần cứng, hạn mức bản quyền và nhật ký bàn giao",
      history_title: "Lịch Sử Giao Dịch & Bàn Giao Nhiều Thiết Bị",
      history_sub: "Quản lý thao tác hàng loạt, mã giao dịch duy nhất và phiếu ký",
      kpi_total: "Tổng thiết bị",
      kpi_inuse: "Đang cấp phát",
      kpi_avail: "Còn trong kho",
      kpi_repair: "Đang bảo hành",
      kpi_value: "Tổng định giá",
      kpi_warranty: "Sắp hết bảo hành",
      kpi_low_stock: "Vật tư sắp hết",
      kpi_seats: "Chỗ cấp phép",
      recent_activity: "Hoạt Động Gần Đây",
      btn_new_asset: "+ Thêm thiết bị",
      btn_checkout: "+ Xuất bàn giao",
      btn_bulk_checkout: "Cấp phát hàng loạt",
      btn_bulk_checkin: "Thu hồi hàng loạt",
      btn_bulk_status: "Đổi trạng thái",
      btn_clear: "Bỏ chọn",
      btn_backup: "Sao lưu",
      btn_export_csv: "Xuất file CSV",
      btn_import_csv: "Nhập file CSV",
      btn_save: "Lưu lại",
      btn_cancel: "Hủy bỏ",
      btn_return: "Thu hồi",
      btn_receipt: "Phiếu ký",
      btn_tag: "In nhãn",
      btn_new_txn: "+ Tạo giao dịch",
      btn_details: "Chi tiết",
      txn_detail_title: "Chi tiết giao dịch & Biên bản bàn giao",
      showing_items: "Hiển thị",
      per_page: "mỗi trang",
      page: "Trang",
      of: "trên",
      status_all: "Tất cả",
      status_available: "Sẵn sàng",
      status_inuse: "Đang dùng",
      status_repair: "Đang sửa",
      status_retired: "Thanh lý",
      nav_inbound: "Nhập kho & PO",
      nav_catalog: "Danh Mục Gốc",
      catalog_title: "Danh Mục Thiết Bị Gốc",
      btn_new_po: "+ Tạo đơn mua",
      po_title: "Đơn Mua Hàng & Nhập Kho",
      po_sub: "Điểm nhập kho thiết bị phần cứng chính thức",
      po_inbound_intake: "+ Nhập Kho PO",
      storage_connected_local: "Đã kết nối ổ đĩa nội bộ",
      storage_connected_smb: "Đã kết nối thư mục mạng SMB"
    },
    jp: {
      app_title: "ITIM-lite",
      search_placeholder: "資産、シリアル、利用者、モデルを検索... (Ctrl+F)",
      ph_asset_name: "例: Dell Latitude 5530",
      ph_serial: "サービスタグ / シリアル番号",
      ph_model: "CPU、メモリ、ストレージ詳細",
      ph_storage_path: "例: .\\data または C:\\IT_Inventory または \\\\nas\\share\\ITIM",
      ph_employee_name: "社員氏名",
      ph_department: "所属部署",
      ph_location: "フロア / デスク / サーバーラック",
      ph_notes: "特記事項・備考",
      nav_dashboard: "ダッシュボード",
      nav_assets: "IT機器資産",
      nav_licenses: "ライセンス",
      nav_consumables: "消耗品・在庫",
      nav_assignments: "機器受渡",
      nav_history: "取引履歴",
      nav_audit: "監査ログ",
      nav_settings: "保存・バックアップ",
      dash_title: "IT機器運用ダッシュボード",
      dash_sub: "ハードウェア在庫、ライセンス枠、受渡ログのリアルタイム管理",
      history_title: "資産取引・複数機器受渡履歴",
      history_sub: "複数機器の一括操作、一意の取引ID記録、受領書発行",
      kpi_total: "総資産数",
      kpi_inuse: "貸出中",
      kpi_avail: "在庫あり",
      kpi_repair: "修理・点検中",
      kpi_value: "総資産評価額",
      kpi_warranty: "保守期限90日未満",
      kpi_low_stock: "残少消耗品",
      kpi_seats: "割当ライセンス数",
      recent_activity: "最近の運用アクティビティ",
      btn_new_asset: "+ 機器登録",
      btn_checkout: "+ 貸出・受渡",
      btn_bulk_checkout: "一括貸出",
      btn_bulk_checkin: "一括返却",
      btn_bulk_status: "状態一括変更",
      btn_clear: "選択解除",
      btn_backup: "バックアップ",
      btn_export_csv: "CSVエクスポート",
      btn_import_csv: "CSVインポート",
      btn_save: "保存",
      btn_cancel: "キャンセル",
      btn_return: "返却",
      btn_receipt: "受領書",
      btn_tag: "ラベル印刷",
      btn_new_txn: "+ 新規取引登録",
      btn_details: "詳細",
      txn_detail_title: "取引詳細および署名録",
      showing_items: "表示中:",
      per_page: "件/ページ",
      page: "ページ",
      of: "/",
      status_all: "全て",
      status_available: "利用可能",
      status_inuse: "使用中",
      status_repair: "修理中",
      status_retired: "廃棄・除籍",
      nav_inbound: "入庫 & PO",
      nav_catalog: "マスター台帳",
      catalog_title: "マスター品目台帳",
      btn_new_po: "+ 発注作成",
      po_title: "発注管理 & 入庫受入",
      po_sub: "正規ハードウェア在庫受入管理",
      po_inbound_intake: "+ 入庫受入",
      storage_connected_local: "ローカルストレージ接続済",
      storage_connected_smb: "SMBネットワーク共有接続済"
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
