/**
 * Asset Edit & Create Modal Dialog (Pure Tailwind, Zero Emojis)
 */

import { HardwareAsset, AssetStatus } from "../types/inventory";
import { InventoryService } from "../services/inventory-service";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";

export class AssetModal {
  private static modalId = "asset-editor-modal";

  public static show(asset?: HardwareAsset, onSaved?: () => void): void {
    const isNew = !asset;
    const a: HardwareAsset = asset || {
      id: InventoryService.generateNextId(),
      name: "",
      model: "",
      category: "Laptop",
      serial: "",
      status: "available",
      assignedTo: "",
      location: "Stock Room A"
    };

    const statuses: { value: AssetStatus; label: string }[] = [
      { value: "available", label: "Available" },
      { value: "inuse", label: "In Use" },
      { value: "repair", label: "In Repair" },
      { value: "retired", label: "Retired" }
    ];
    const categories = ["Laptop", "Desktop", "Monitor", "Printer", "Network", "Server", "Mobile", "Other"];

    const bodyHtml = `
      <form id="asset-form" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Asset Tag</label>
            <input type="text" id="asset-id" class="w-full px-3 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded font-mono text-gray-800" value="${a.id}" readonly />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select id="asset-status" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none">
              ${statuses.map((s) => `<option value="${s.value}" ${a.status === s.value ? "selected" : ""}>${s.label}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Category</label>
            <select id="asset-category" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none">
              ${categories.map((c) => `<option value="${c}" ${a.category === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Item Name / Title *</label>
            <input type="text" id="asset-name" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" value="${a.name || ""}" required placeholder="e.g. ThinkPad T14 Gen 3" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Model Description</label>
            <input type="text" id="asset-model" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" value="${a.model || ""}" placeholder="e.g. 21AH002EUS" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Serial Number *</label>
            <input type="text" id="asset-serial" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none font-mono" value="${a.serial || ""}" required placeholder="SN123456789" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Assigned User</label>
            <input type="text" id="asset-assigned" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" value="${a.assignedTo || ""}" placeholder="Unassigned" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Physical Location</label>
            <input type="text" id="asset-location" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" value="${a.location || ""}" placeholder="e.g. Stock Room A / Floor 3" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Notes / Specifications</label>
          <input type="text" id="asset-notes" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" value="${a.notes || ""}" placeholder="e.g. i7-12700 / 32GB RAM / 1TB SSD" />
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="px-4 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" onclick="Modal.close('${this.modalId}')">
        Cancel
      </button>
      <button type="button" id="btn-save-asset" class="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
        ${isNew ? "Create Asset" : "Save Changes"}
      </button>
    `;

    Modal.show({
      id: this.modalId,
      title: isNew ? "Add Hardware Asset" : `Edit Asset: ${a.id}`,
      width: "max-w-xl",
      bodyHtml,
      footerHtml
    });

    const saveBtn = document.getElementById("btn-save-asset");
    if (saveBtn) {
      saveBtn.onclick = () => {
        const name = (document.getElementById("asset-name") as HTMLInputElement).value.trim();
        const serial = (document.getElementById("asset-serial") as HTMLInputElement).value.trim();
        if (!name || !serial) {
          Toast.warning("Item name and serial number are required.");
          return;
        }

        const data: HardwareAsset = {
          id: a.id,
          name,
          model: (document.getElementById("asset-model") as HTMLInputElement).value.trim() || undefined,
          category: (document.getElementById("asset-category") as HTMLSelectElement).value,
          serial,
          status: (document.getElementById("asset-status") as HTMLSelectElement).value as AssetStatus,
          assignedTo: (document.getElementById("asset-assigned") as HTMLInputElement).value.trim() || undefined,
          location: (document.getElementById("asset-location") as HTMLInputElement).value.trim() || undefined,
          notes: (document.getElementById("asset-notes") as HTMLInputElement).value.trim() || undefined
        };

        if (isNew) {
          InventoryService.create(data);
        } else {
          InventoryService.update(data.id, data);
        }

        Toast.success(`Asset ${data.id} saved successfully.`);
        Modal.close(this.modalId);
        if (onSaved) onSaved();
      };
    }
  }
}
