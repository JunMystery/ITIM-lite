/**
 * Active Equipment Custody & Assignments View (Pure Tailwind, Zero Emojis)
 */

import { HardwareAsset } from "../types/inventory";
import { InventoryService } from "../services/inventory-service";
import { TransactionsService } from "../services/transactions-service";
import { FilterBar } from "../components/FilterBar";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";

export class AssignmentView {
  private static container: HTMLElement | null = null;
  private static searchQuery = "";

  public static mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  public static render(): void {
    if (!this.container) return;

    const allAssets: HardwareAsset[] = InventoryService.getAll();
    let assigned = allAssets.filter((a) => a.status === "inuse" || !!a.assignedTo);

    if (this.searchQuery) {
      assigned = assigned.filter(
        (a) =>
          a.id.toLowerCase().includes(this.searchQuery) ||
          a.name.toLowerCase().includes(this.searchQuery) ||
          (a.assignedTo && a.assignedTo.toLowerCase().includes(this.searchQuery))
      );
    }

    this.container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 class="text-xl font-bold text-gray-900 tracking-tight">Active Custody &amp; Assignments</h2>
            <p class="text-xs text-gray-500 mt-0.5">Track hardware deployed to staff, departments, and active custodians</p>
          </div>
          <button type="button" id="btn-new-checkout" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
            + Checkout Asset
          </button>
        </div>

        <div id="assign-filter-host">
          ${FilterBar.render({ searchPlaceholder: "Search employee, asset tag, model..." })}
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th class="py-3 px-4">Asset Tag</th>
                  <th class="py-3 px-4">Item Name / Model</th>
                  <th class="py-3 px-4">Assigned To</th>
                  <th class="py-3 px-4">Serial Number</th>
                  <th class="py-3 px-4">Location</th>
                  <th class="py-3 px-4 text-right">Return Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${
                  assigned.length === 0
                    ? `<tr><td colspan="6" class="py-8 text-center text-gray-400">No active asset assignments.</td></tr>`
                    : assigned
                        .map(
                          (a) => `
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="py-3 px-4 font-mono font-semibold text-blue-700">${a.id}</td>
                      <td class="py-3 px-4 font-medium text-gray-900">
                        ${a.name}
                        ${a.model ? `<span class="text-gray-400 text-[11px] block font-mono">${a.model}</span>` : ""}
                      </td>
                      <td class="py-3 px-4 font-semibold text-gray-800">${a.assignedTo || "-"}</td>
                      <td class="py-3 px-4 font-mono text-gray-600">${a.serial || "-"}</td>
                      <td class="py-3 px-4 text-gray-500">${a.location || "-"}</td>
                      <td class="py-3 px-4 text-right">
                        <button type="button" class="btn-checkin px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors" data-id="${a.id}">
                          Check In
                        </button>
                      </td>
                    </tr>
                  `
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private static bindEvents(): void {
    if (!this.container) return;

    const filterHost = this.container.querySelector<HTMLElement>("#assign-filter-host");
    if (filterHost) {
      FilterBar.bind(filterHost, {
        onSearch: (q) => {
          this.searchQuery = q;
          this.render();
        }
      });
    }

    const checkoutBtn = this.container.querySelector<HTMLButtonElement>("#btn-new-checkout");
    if (checkoutBtn) {
      checkoutBtn.onclick = () => this.showCheckoutModal();
    }

    const checkinBtns = this.container.querySelectorAll<HTMLButtonElement>(".btn-checkin");
    checkinBtns.forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        if (!id) return;
        const asset = InventoryService.getById(id);
        if (!asset) return;

        if (confirm(`Return asset ${asset.id} (${asset.name}) to inventory stock?`)) {
          TransactionsService.record({
            type: "CHECKIN",
            officer: "IT Admin",
            employeeName: asset.assignedTo,
            notes: "Returned to stock",
            items: [{ assetId: asset.id, name: asset.name, serial: asset.serial, category: asset.category, condition: "Good" }]
          });

          InventoryService.update(asset.id, {
            status: "available",
            assignedTo: undefined
          });

          Toast.success(`Asset ${asset.id} returned to stock.`);
          this.render();
        }
      };
    });
  }

  private static showCheckoutModal(): void {
    const modalId = "checkout-modal";
    const available = InventoryService.getAll().filter((a) => a.status === "available");

    if (available.length === 0) {
      Toast.warning("No available assets in inventory to check out.");
      return;
    }

    const bodyHtml = `
      <form id="checkout-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Select Available Asset *</label>
          <select id="checkout-asset" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none">
            ${available.map((a) => `<option value="${a.id}">[${a.id}] ${a.name} (SN: ${a.serial || "-"})</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Employee / User Name *</label>
          <input type="text" id="checkout-user" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" required placeholder="Full Name" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Department</label>
          <input type="text" id="checkout-dept" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" placeholder="e.g. Engineering / HR" />
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="px-4 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" onclick="Modal.close('${modalId}')">
        Cancel
      </button>
      <button type="button" id="btn-confirm-checkout" class="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
        Confirm Checkout
      </button>
    `;

    Modal.show({
      id: modalId,
      title: "Checkout Equipment",
      width: "max-w-md",
      bodyHtml,
      footerHtml
    });

    const confirmBtn = document.getElementById("btn-confirm-checkout");
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        const assetId = (document.getElementById("checkout-asset") as HTMLSelectElement).value;
        const user = (document.getElementById("checkout-user") as HTMLInputElement).value.trim();
        const dept = (document.getElementById("checkout-dept") as HTMLInputElement).value.trim();

        if (!user) {
          Toast.warning("Employee name is required.");
          return;
        }

        const asset = InventoryService.getById(assetId);
        if (!asset) return;

        TransactionsService.record({
          type: "CHECKOUT",
          officer: "IT Admin",
          employeeName: user,
          department: dept,
          items: [{ assetId: asset.id, name: asset.name, serial: asset.serial, category: asset.category, condition: "Good" }]
        });

        InventoryService.update(asset.id, {
          status: "inuse",
          assignedTo: user
        });

        Toast.success(`Asset ${asset.id} checked out to ${user}.`);
        Modal.close(modalId);
        this.render();
      };
    }
  }
}
