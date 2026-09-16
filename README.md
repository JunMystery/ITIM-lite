# ITIM-lite - IT Inventory Management System

A zero-backend, lightweight **Windows HTML Application (HTA)** designed for corporate IT departments to manage hardware equipment, software licenses, accessories, and employee handovers.

---

## Key Features

- **No Backend Required**: Runs as a client application directly on Windows via built-in `mshta.exe`. Zero servers, no Node.js runtime, no Python, and no database setup required.
- **Local & SMB/Network Storage Support**: Direct read/write to local folders (`C:\...`, `.\data`) and Network / SMB UNC paths (`\\server\share\IT_Inventory` or mapped network drives like `Z:\...`) using Windows native `ActiveXObject("Scripting.FileSystemObject")` and `ADODB.Stream` (UTF-8).
- **Automated Backup Engine**:
  - Scheduled background snapshots (5m, 15m, 30m, 60m).
  - Snapshot on edit/save.
  - Automatic retention policy (keeps the latest *N* backups and prunes old ones).
  - 1-Click point-in-time restore from any backup snapshot.
- **Hardware Assets**: Computers, laptops, servers, monitors, networking gear, printers, and peripherals with warranty tracking and valuation metrics.
- **Software Licenses**: Seat allocation tracking (allocated vs available), renewal dates, and cost per seat.
- **Consumables & Accessories**: Real-time stock counters with quick `+1` / `-1` adjustments and automatic low-stock alerts.
- **Employee Handovers**: Check-out / check-in workflow with printable Equipment Handover Acknowledgement receipts.
- **Barcode & QR Codes**: Offline SVG Code39 barcode and QR code generator for equipment asset tags.
- **Excel & CSV Import / Export**: Instant two-way CSV export and import.
- **Windows Fluent Design**: Modern Segoe UI interface with Dark / Light theme toggle.

---

## How to Launch on Windows

1. Double-click **`ITIM.hta`** in Windows Explorer.
2. The application will immediately open in its own standalone window (1260x800, centered).
3. By default, it stores data in `.\data\inventory_db.json`.

---

## Configuring Network / SMB Storage

1. Click **Storage & Backup** in the sidebar (or click the storage status pill in the top header).
2. In the **Storage Folder Path** input, enter your local folder or SMB network share path, for example:
   - `C:\IT_Inventory`
   - `Z:\IT_Inventory` (Mapped Network Drive)
   - `\\nas01\it_department\inventory` (Direct UNC path)
3. Click **Test Storage Path** to verify read/write permissions.
4. Click **Save Configuration**. All inventory data and backups will now automatically sync to that directory!

---

## Keyboard Shortcuts

- `Ctrl + S`: Force save and database sync
- `Ctrl + N`: Open Create New Asset dialog
- `Ctrl + B`: Create instant backup snapshot
- `Ctrl + F`: Quick focus search bar
