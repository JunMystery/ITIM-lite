/**
 * Purchase Order Creation and Intake Modal (Pure Tailwind, Zero Emojis)
 */

import { PurchaseOrder } from "../types/models";
import { POService } from "../services/po-service";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";

export class PoModal {
  private static modalId = "po-modal";

  public static showCreate(onSaved?: () => void): void {
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const bodyHtml = `
      <form id="create-po-form" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">PO Number</label>
            <input type="text" id="po-num" class="w-full px-3 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded font-mono text-gray-800" value="${poNumber}" readonly />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Vendor *</label>
            <input type="text" id="po-vendor" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" required placeholder="e.g. Dell Direct / CDW" />
          </div>
        </div>

        <div class="border-t border-gray-200 pt-3">
          <span class="block text-xs font-semibold text-gray-700 mb-2">Initial Item to Order</span>
          <div class="space-y-2">
            <div>
              <label class="block text-[11px] text-gray-600 mb-0.5">Item Name / Model *</label>
              <input type="text" id="po-item-desc" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" required placeholder="e.g. Latitude 5530 Laptop" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] text-gray-600 mb-0.5">Quantity Ordered *</label>
                <input type="number" id="po-item-qty" min="1" max="100" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" value="1" />
              </div>
              <div>
                <label class="block text-[11px] text-gray-600 mb-0.5">Unit Price ($)</label>
                <input type="number" id="po-item-price" min="0" step="0.01" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" value="1200.00" />
              </div>
            </div>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="px-4 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" onclick="Modal.close('${this.modalId}')">
        Cancel
      </button>
      <button type="button" id="btn-submit-po" class="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
        Create Purchase Order
      </button>
    `;

    Modal.show({
      id: this.modalId,
      title: "New Purchase Order",
      width: "max-w-md",
      bodyHtml,
      footerHtml
    });

    const submitBtn = document.getElementById("btn-submit-po");
    if (submitBtn) {
      submitBtn.onclick = () => {
        const vendor = (document.getElementById("po-vendor") as HTMLInputElement).value.trim();
        const desc = (document.getElementById("po-item-desc") as HTMLInputElement).value.trim();
        const qty = parseInt((document.getElementById("po-item-qty") as HTMLInputElement).value || "1", 10);
        const price = parseFloat((document.getElementById("po-item-price") as HTMLInputElement).value || "0");

        if (!vendor || !desc || isNaN(qty) || qty <= 0) {
          Toast.warning("Vendor, description, and valid quantity required.");
          return;
        }

        POService.create({
          poNumber,
          vendor,
          orderDate: new Date().toISOString().substring(0, 10),
          items: [{ name: desc, category: "Laptop", type: "hardware", qtyOrdered: qty, qtyReceived: 0, unitPrice: price }]
        });

        Toast.success(`Purchase Order ${poNumber} created.`);
        Modal.close(this.modalId);
        if (onSaved) onSaved();
      };
    }
  }

  public static showReceive(po: PurchaseOrder, lineIdx: number, onSaved?: () => void): void {
    const item = po.items[lineIdx];
    if (!item) return;
    const remaining = item.qtyOrdered - item.qtyReceived;

    const bodyHtml = `
      <div class="space-y-4">
        <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
          <div class="font-semibold text-gray-900">${item.name}</div>
          <div class="text-gray-500 mt-1">Ordered: ${item.qtyOrdered} | Already Received: ${item.qtyReceived} | <span class="text-blue-700 font-semibold">Remaining: ${remaining}</span></div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Enter Serial Numbers (one per line) *</label>
          <textarea
            id="receive-serials"
            rows="${Math.min(6, Math.max(3, remaining))}"
            class="w-full px-3 py-2 text-xs font-mono bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            placeholder="SN-1001&#10;SN-1002"
          ></textarea>
          <p class="text-[11px] text-gray-500 mt-1">Each serial will be registered as an active hardware asset.</p>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" class="px-4 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" onclick="Modal.close('${this.modalId}')">
        Cancel
      </button>
      <button type="button" id="btn-confirm-receive" class="px-4 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm">
        Confirm Intake
      </button>
    `;

    Modal.show({
      id: this.modalId,
      title: `Receive Shipment: ${po.poNumber}`,
      width: "max-w-md",
      bodyHtml,
      footerHtml
    });

    const confirmBtn = document.getElementById("btn-confirm-receive");
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        const text = (document.getElementById("receive-serials") as HTMLTextAreaElement).value.trim();
        const serials = text.split("\n").map((s) => s.trim()).filter(Boolean);
        if (serials.length === 0) {
          Toast.warning("Please enter at least one serial number.");
          return;
        }

        POService.receiveItems(po.poNumber, lineIdx, serials);
        Toast.success(`Received ${serials.length} item(s) into inventory.`);
        Modal.close(this.modalId);
        if (onSaved) onSaved();
      };
    }
  }
}
