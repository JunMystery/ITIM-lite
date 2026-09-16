/**
 * Inbound Procurement & PO View (Pure Tailwind, Zero Emojis)
 */

import { POService } from "../services/po-service";
import { Badge } from "../components/Badge";
import { PoModal } from "./PoModal";

export class InboundView {
  private static container: HTMLElement | null = null;

  public static mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  public static render(): void {
    if (!this.container) return;

    const orders = POService.getAll();

    this.container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 class="text-xl font-bold text-gray-900 tracking-tight">Purchase Orders &amp; Inbound Intake</h2>
            <p class="text-xs text-gray-500 mt-0.5">Track supplier shipments and receive serial numbers into asset inventory</p>
          </div>
          <button type="button" id="btn-new-po" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
            + New Purchase Order
          </button>
        </div>

        <div class="space-y-3">
          ${
            orders.length === 0
              ? `<div class="bg-white p-8 rounded-xl border border-gray-200 text-center text-xs text-gray-400">No purchase orders found.</div>`
              : orders
                  .map(
                    (po) => `
              <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
                  <div class="flex items-center space-x-3">
                    <span class="font-mono font-bold text-sm text-blue-700">${po.poNumber}</span>
                    <span class="text-xs font-medium text-gray-700">${po.vendor}</span>
                    <span class="text-xs text-gray-400 font-mono">${po.orderDate}</span>
                  </div>
                  <div>${Badge.status(po.status)}</div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200">
                      <tr>
                        <th class="py-2 px-3">Item / Description</th>
                        <th class="py-2 px-3">Ordered</th>
                        <th class="py-2 px-3">Received</th>
                        <th class="py-2 px-3">Unit Price</th>
                        <th class="py-2 px-3 text-right">Intake Action</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      ${po.items
                        .map((item, idx) => {
                          const fullyReceived = item.qtyReceived >= item.qtyOrdered;
                          return `
                        <tr>
                          <td class="py-2.5 px-3 font-medium text-gray-900">${item.name}</td>
                          <td class="py-2.5 px-3 font-semibold text-gray-700">${item.qtyOrdered}</td>
                          <td class="py-2.5 px-3">
                            <span class="${fullyReceived ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}">
                              ${item.qtyReceived} / ${item.qtyOrdered}
                            </span>
                          </td>
                          <td class="py-2.5 px-3 text-gray-600 font-mono">$${(item.unitPrice || 0).toFixed(2)}</td>
                          <td class="py-2.5 px-3 text-right">
                            ${
                              fullyReceived
                                ? `<span class="text-emerald-700 text-[11px] font-semibold">Completed &#10003;</span>`
                                : `<button type="button" class="btn-receive px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors" data-po="${po.poNumber}" data-idx="${idx}">
                                  Receive Items
                                </button>`
                            }
                          </td>
                        </tr>
                      `;
                        })
                        .join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            `
                  )
                  .join("")
          }
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private static bindEvents(): void {
    if (!this.container) return;

    const newBtn = this.container.querySelector<HTMLButtonElement>("#btn-new-po");
    if (newBtn) {
      newBtn.onclick = () => {
        PoModal.showCreate(() => this.render());
      };
    }

    const receiveBtns = this.container.querySelectorAll<HTMLButtonElement>(".btn-receive");
    receiveBtns.forEach((btn) => {
      btn.onclick = () => {
        const poNum = btn.getAttribute("data-po");
        const idx = parseInt(btn.getAttribute("data-idx") || "0", 10);
        if (poNum) {
          const po = POService.getById(poNum);
          if (po) {
            PoModal.showReceive(po, idx, () => this.render());
          }
        }
      };
    });
  }
}
