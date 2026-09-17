/* ==========================================================================
   ITIM-lite - Configuration & Default Schema
   ========================================================================== */

var ITIM_CONFIG = {
  APP_NAME: "ITIM-lite",
  VERSION: "1.0.0",
  DB_FILENAME: "inventory_db.json",
  DEFAULT_STORAGE_PATH: ".\\data",
  DEFAULT_BACKUP_INTERVAL_MIN: 360,
  DEFAULT_BACKUPS_PER_DAY: 4,
  DEFAULT_BACKUP_RETENTION: 20,
  DEFAULT_CLEAN_MODE: "both",
  DEFAULT_CLEAN_DAYS: 7,

  ASSET_CATEGORIES: [
    "Laptop", "Desktop", "Server", "Monitor", "Networking", "Printer", "Mobile Device", "Peripheral"
  ],

  ASSET_STATUSES: [
    { id: "available", label: "Available", badgeClass: "badge-available" },
    { id: "inuse", label: "In Use", badgeClass: "badge-inuse" },
    { id: "repair", label: "In Repair", badgeClass: "badge-repair" },
    { id: "retired", label: "Retired", badgeClass: "badge-retired" }
  ],

  LICENSE_TYPES: ["Perpetual", "Annual Subscription", "Monthly Subscription", "OEM"],

  CONSUMABLE_CATEGORIES: [
    "Cables & Adapters", "Toner & Cartridge", "Keyboards & Mice", "RAM & Storage", "Cleaning & Maintenance"
  ],

  DEFAULT_SEED_DATA: {
    categories: [
      {
        id: "cat-laptop", name: "Laptop", type: "hardware", description: "Portable workstations",
        customFields: [
          { id: "cpu", label: "CPU Processor", type: "text" },
          { id: "ram_gb", label: "RAM (GB)", type: "number" },
          { id: "os", label: "Operating System", type: "select", options: ["Windows 11 Pro", "macOS Sonoma", "Ubuntu 24.04"] }
        ]
      },
      {
        id: "cat-monitor", name: "Monitor", type: "hardware", description: "Display monitors",
        customFields: [
          { id: "resolution", label: "Resolution", type: "select", options: ["1080p", "1440p", "4K UHD"] },
          { id: "panel", label: "Panel Type", type: "text" }
        ]
      },
      {
        id: "cat-network", name: "Networking", type: "hardware", description: "Switches, routers & APs",
        customFields: [
          { id: "ports", label: "Port Count", type: "number" },
          { id: "poe", label: "PoE Supported", type: "select", options: ["Yes", "No"] }
        ]
      },
      {
        id: "cat-software", name: "Office Suite", type: "software", description: "Cloud productivity",
        customFields: [
          { id: "tier", label: "License Tier", type: "text" },
          { id: "cloud_tenant", label: "Cloud Tenant", type: "text" }
        ]
      },
      {
        id: "cat-cables", name: "Cables & Adapters", type: "consumable", description: "Peripherals & cords",
        customFields: [
          { id: "length_m", label: "Length (Meters)", type: "number" },
          { id: "shielded", label: "Shielded", type: "select", options: ["Yes", "No"] }
        ]
      }
    ],
    catalog: [
      {
        id: "SKU-1001", sku: "SKU-1001", name: "Dell Latitude 5530", type: "hardware", category: "Laptop",
        model: "Latitude 5530 i7-1265U 16GB 512GB", vendor: "Dell Direct", notes: "Standard engineering laptop",
        customFields: { cpu: "Intel Core i7-1265U", ram_gb: 16, os: "Windows 11 Pro" }
      },
      {
        id: "SKU-1002", sku: "SKU-1002", name: "Dell UltraSharp U2723QE", type: "hardware", category: "Monitor",
        model: "27-inch 4K USB-C Hub Monitor", vendor: "Dell Direct", notes: "4K IPS Black",
        customFields: { resolution: "4K UHD", panel: "IPS Black" }
      },
      {
        id: "SKU-1003", sku: "SKU-1003", name: "Cisco Catalyst 1000-24P", type: "hardware", category: "Networking",
        model: "24-Port Gigabit PoE+ Switch", vendor: "Cisco Commercial", notes: "Office switch",
        customFields: { ports: 24, poe: "Yes" }
      },
      {
        id: "SKU-1004", sku: "SKU-1004", name: "Microsoft 365 Business Premium", type: "software", category: "Office Suite",
        model: "Cloud SaaS", vendor: "Microsoft CSP", notes: "Standard productivity",
        customFields: { tier: "Business Premium", cloud_tenant: "corp.onmicrosoft.com" }
      },
      {
        id: "SKU-1005", sku: "SKU-1005", name: "Cat6 Ethernet Cable (2m / 6ft)", type: "consumable", category: "Cables & Adapters",
        model: "2m Snagless RJ45", vendor: "CableMatters", notes: "Patch cords",
        customFields: { length_m: 2, shielded: "No" }
      }
    ],
    assets: [
      {
        id: "AST-1001", name: "Dell Latitude 5530", category: "Laptop", serial: "8HG3F42",
        model: "Latitude 5530 i7-1265U 16GB 512GB", status: "inuse", assignedTo: "Sarah Jenkins",
        department: "Engineering", location: "Floor 3 - Desk 312", purchaseDate: "2024-03-15",
        warrantyExpiry: "2027-03-15", poNumber: "PO-8001", source: "PO_INBOUND",
        notes: "Assigned with charger.", customFields: { cpu: "Intel Core i7-1265U", ram_gb: 16, os: "Windows 11 Pro" }
      },
      {
        id: "AST-1002", name: "Dell Latitude 5530", category: "Laptop", serial: "PF3K81L9",
        model: "Latitude 5530 i7-1265U 16GB 512GB", status: "available", assignedTo: "",
        department: "IT Stock", location: "Server Room Shelf B", purchaseDate: "2024-06-10",
        warrantyExpiry: "2027-06-10", poNumber: "PO-8001", source: "PO_INBOUND",
        notes: "Fresh Windows 11 Enterprise.", customFields: { cpu: "Intel Core i7-1265U", ram_gb: 16, os: "Windows 11 Pro" }
      },
      {
        id: "AST-1003", name: "Dell UltraSharp U2723QE", category: "Monitor", serial: "CN-0K9821-728",
        model: "27-inch 4K USB-C Hub Monitor", status: "inuse", assignedTo: "Sarah Jenkins",
        department: "Engineering", location: "Floor 3 - Desk 312", purchaseDate: "2024-03-15",
        warrantyExpiry: "2027-03-15", poNumber: "PO-8001", source: "PO_INBOUND", notes: "",
        customFields: { resolution: "4K UHD", panel: "IPS Black" }
      },
      {
        id: "AST-1004", name: "Cisco Catalyst 1000-24P", category: "Networking", serial: "FOC2419U0X8",
        model: "24-Port Gigabit PoE+ Managed Switch", status: "inuse", assignedTo: "Network Infrastructure",
        department: "IT Operations", location: "Rack A2 - Patch Panel", purchaseDate: "2023-11-20",
        warrantyExpiry: "2028-11-20", poNumber: "PO-8002", source: "PO_INBOUND",
        notes: "Main office distribution switch.", customFields: { ports: 24, poe: "Yes" }
      }
    ],
    licenses: [
      {
        id: "LIC-2001", software: "Microsoft 365 Business Premium", vendor: "Microsoft CSP",
        type: "Annual Subscription", totalSeats: 50, assignedSeats: 42, key: "CSP-TENANT-AUTO",
        expiryDate: "2026-12-31", notes: "Cloud tenant renewal handled via CSP."
      },
      {
        id: "LIC-2002", software: "Adobe Creative Cloud All Apps", vendor: "Adobe",
        type: "Annual Subscription", totalSeats: 10, assignedSeats: 9, key: "ADOBE-VIP-88129",
        expiryDate: "2026-10-15", notes: "Marketing & design team."
      }
    ],
    consumables: [
      { id: "CON-3001", name: "Cat6 Ethernet Cable (2m / 6ft)", category: "Cables & Adapters", quantity: 34, minQuantity: 10, location: "Storage Bin C1" },
      { id: "CON-3002", name: "HP 89A Black Toner Cartridge", category: "Toner & Cartridge", quantity: 2, minQuantity: 3, location: "Cabinet 2 - Shelf 1" },
      { id: "CON-3003", name: "Logitech MK270 Wireless Combo", category: "Keyboards & Mice", quantity: 8, minQuantity: 5, location: "Storage Bin A4" },
      {
        id: "CON-3004", name: "Zebra DS2208 Handheld Barcode Gun", category: "Peripherals & Tools",
        quantity: 3, minQuantity: 1, location: "IT Tool Cabinet A", isSerialized: true,
        serials: [
          { sn: "BG-2208-001", status: "available", location: "Shelf A1" },
          { sn: "BG-2208-002", status: "available", location: "Shelf A2" },
          { sn: "BG-2208-003", status: "assigned", assignedTo: "Logistics Dept", location: "Dock Station" }
        ]
      }
    ],
    assignments: [
      {
        id: "ASG-4001", assetId: "AST-1001", assetName: "Dell Latitude 5530", employeeName: "Sarah Jenkins",
        employeeEmail: "sarah.j@company.local", department: "Engineering", checkoutDate: "2024-03-20",
        expectedReturnDate: "", returnDate: "", status: "active", conditionOut: "Brand New in Box",
        conditionIn: "", notes: "Issued upon employee onboarding."
      }
    ],
    transactions: [
      {
        id: "TXN-5001", type: "CHECKOUT", status: "active", timestamp: "2024-03-20 09:30:00", employeeName: "Sarah Jenkins",
        department: "Engineering", expectedReturnDate: "", officer: "IT Admin", itemCount: 1,
        notes: "Issued upon employee onboarding.",
        items: [{ assetId: "AST-1001", name: "Dell Latitude 5530", category: "Laptop", serial: "8HG3F42", condition: "Brand New in Box" }]
      }
    ],
    purchaseOrders: [
      {
        id: "PO-8001", poNumber: "PO-8001", vendor: "Dell Direct", orderDate: "2024-03-01", receivedDate: "2024-03-15",
        status: "received", notes: "Engineering laptops and 4K displays",
        items: [
          { masterId: "SKU-1001", name: "Dell Latitude 5530", category: "Laptop", model: "Latitude 5530 i7-1265U", qtyOrdered: 2, qtyReceived: 2, assetIds: ["AST-1001", "AST-1002"] },
          { masterId: "SKU-1002", name: "Dell UltraSharp U2723QE", category: "Monitor", model: "27-inch 4K USB-C Hub Monitor", qtyOrdered: 1, qtyReceived: 1, assetIds: ["AST-1003"] }
        ]
      },
      {
        id: "PO-8002", poNumber: "PO-8002", vendor: "Cisco Commercial", orderDate: "2023-11-10", receivedDate: "2023-11-20",
        status: "received", notes: "Core office switch infrastructure",
        items: [
          { masterId: "SKU-1003", name: "Cisco Catalyst 1000-24P", category: "Networking", model: "24-Port Gigabit PoE+ Switch", qtyOrdered: 1, qtyReceived: 1, assetIds: ["AST-1004"] }
        ]
      },
      {
        id: "PO-8003", poNumber: "PO-8003", vendor: "Lenovo Partner", orderDate: "2026-09-10", receivedDate: "",
        status: "pending", notes: "Developer workstation batch",
        items: [
          { masterId: "SKU-1001", name: "Dell Latitude 5530", category: "Laptop", model: "Latitude 5530 i7-1265U", qtyOrdered: 2, qtyReceived: 0, assetIds: [] }
        ]
      }
    ],
    auditLogs: [
      { timestamp: "2024-03-20 09:30:00", action: "CHECKOUT", detail: "Asset AST-1001 checked out to Sarah Jenkins (Engineering)" },
      { timestamp: "2024-06-10 14:15:00", action: "ASSET_CREATE", detail: "New asset AST-1002 (Dell Latitude 5530) added to inventory" }
    ],
    stocktakeSessions: [
      {
        id: "STK-7001",
        name: "Q1 Initial Fleet Stocktake",
        scope: { type: "all", value: "All Assets" },
        status: "completed",
        createdAt: "2024-03-01 08:00:00",
        closedAt: "2024-03-01 11:30:00",
        auditor: "IT Admin",
        notes: "Baseline physical audit before Q2 onboarding.",
        expectedAssets: [
          { assetId: "AST-1001", name: "Dell Latitude 5530", category: "Laptop", serial: "8HG3F42", status: "inuse", location: "Floor 3 - Desk 312" },
          { assetId: "AST-1004", name: "Cisco Catalyst 1000-24P", category: "Networking", serial: "FOC2419U0X8", status: "inuse", location: "Rack A2 - Patch Panel" }
        ],
        scannedAssets: [
          { assetId: "AST-1001", serial: "8HG3F42", name: "Dell Latitude 5530", category: "Laptop", timestamp: "2024-03-01 09:15:00", actualLocation: "Floor 3 - Desk 312", actualCondition: "Good / Functional", isSurplus: false },
          { assetId: "AST-1004", serial: "FOC2419U0X8", name: "Cisco Catalyst 1000-24P", category: "Networking", timestamp: "2024-03-01 10:00:00", actualLocation: "Rack A2 - Patch Panel", actualCondition: "Good / Functional", isSurplus: false }
        ]
      }
    ],
    settings: {
      storagePath: ".\\data", storageType: "local", backupsPerDay: 4, autoBackupIntervalMin: 360,
      maxBackupCount: 20, backupRetentionCount: 20, autoCleanMode: "both", autoCleanDays: 7,
      orgName: "Corporate IT Services", lastBackupTime: ""
    }
  }
};
