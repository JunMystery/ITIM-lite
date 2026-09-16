/**
 * Application Settings & Storage Diagnostics View (Pure Tailwind, Zero Emojis)
 */

import { StorageEngine } from "../services/storage";
import { Toast } from "../components/Toast";

export class SettingsView {
  private static container: HTMLElement | null = null;

  public static mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  public static render(): void {
    if (!this.container) return;

    const isHta = typeof window !== "undefined" && "ActiveXObject" in window;

    this.container.innerHTML = `
      <div class="space-y-6 max-w-4xl">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">System Settings &amp; Diagnostics</h2>
          <p class="text-xs text-gray-500 mt-0.5">Application environment, storage engines, and backup snapshots</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Runtime Diagnostics -->
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 class="text-sm font-semibold text-gray-900">Runtime Environment</h3>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between py-1.5 border-b border-gray-100">
                <span class="text-gray-500">Host Engine</span>
                <span class="font-mono font-semibold text-gray-900">${isHta ? "Microsoft MSHTA (IE11 / ActiveX)" : "Modern Browser (Vite Bundle)"}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-gray-100">
                <span class="text-gray-500">Storage Driver</span>
                <span class="font-semibold text-blue-700">${isHta ? "Scripting.FileSystemObject (FSO)" : "HTML5 Web Storage (localStorage)"}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-gray-100">
                <span class="text-gray-500">Styling Engine</span>
                <span class="font-semibold text-emerald-700">Tailwind CSS v3 (Compiled Static Fallbacks)</span>
              </div>
              <div class="flex justify-between py-1.5">
                <span class="text-gray-500">Application Version</span>
                <span class="font-mono text-gray-700">ITIM-lite 2.0-TS</span>
              </div>
            </div>
          </div>

          <!-- Data Management -->
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 class="text-sm font-semibold text-gray-900">Data Backup &amp; Reset</h3>
            <p class="text-xs text-gray-500">Export complete database or purge local cache for fresh deployment.</p>
            <div class="space-y-2 pt-2">
              <button type="button" id="btn-export-backup" class="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 text-left flex justify-between items-center transition-colors">
                <span>Export System Data Backup</span>
                <span class="text-gray-400 font-mono text-[11px]">&darr; JSON</span>
              </button>
              <button type="button" id="btn-purge-data" class="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800 text-left flex justify-between items-center transition-colors">
                <span>Reset to Demonstration Defaults</span>
                <span class="text-rose-500 font-mono text-[11px]">&times; Purge</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private static bindEvents(): void {
    if (!this.container) return;

    const exportBtn = this.container.querySelector<HTMLButtonElement>("#btn-export-backup");
    if (exportBtn) {
      exportBtn.onclick = () => {
        const backup = {
          exportDate: new Date().toISOString(),
          hardware: StorageEngine.loadJson("assets", []),
          transactions: StorageEngine.loadJson("transactions", []),
          pos: StorageEngine.loadJson("purchase_orders", []),
          licenses: StorageEngine.loadJson("licenses", []),
          consumables: StorageEngine.loadJson("consumables", []),
          catalog: StorageEngine.loadJson("catalog", []),
          categories: StorageEngine.loadJson("categories", [])
        };

        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `itim-backup-${new Date().toISOString().substring(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Toast.success("Backup downloaded successfully.");
      };
    }

    const purgeBtn = this.container.querySelector<HTMLButtonElement>("#btn-purge-data");
    if (purgeBtn) {
      purgeBtn.onclick = () => {
        if (confirm("Reset all inventory, purchase orders, and audit transactions to factory defaults?")) {
          localStorage.clear();
          Toast.warning("Data purged. Reloading application...");
          setTimeout(() => window.location.reload(), 1000);
        }
      };
    }
  }
}
