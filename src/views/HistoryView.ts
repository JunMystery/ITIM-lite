/**
 * Transaction History and Audit Trail View (Pure Tailwind, Zero Emojis)
 */

import { Transaction } from "../types/models";
import { TransactionsService } from "../services/transactions-service";
import { Badge } from "../components/Badge";
import { FilterBar } from "../components/FilterBar";
import { Modal } from "../components/Modal";

export class HistoryView {
  private static container: HTMLElement | null = null;
  private static searchQuery = "";

  public static mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  public static render(): void {
    if (!this.container) return;

    let txns = TransactionsService.getAll();
    if (this.searchQuery) {
      txns = txns.filter(
        (t) =>
          t.id.toLowerCase().includes(this.searchQuery) ||
          (t.employeeName && t.employeeName.toLowerCase().includes(this.searchQuery)) ||
          (t.officer && t.officer.toLowerCase().includes(this.searchQuery)) ||
          t.type.toLowerCase().includes(this.searchQuery)
      );
    }

    this.container.innerHTML = `
      <div class="space-y-4">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">Audit Trail &amp; Transaction History</h2>
          <p class="text-xs text-gray-500 mt-0.5">Chronological record of checkouts, returns, maintenance, and disposals</p>
        </div>

        <div id="history-filter-host">
          ${FilterBar.render({ searchPlaceholder: "Search transaction ID, employee, officer, type..." })}
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th class="py-3 px-4">Txn ID</th>
                  <th class="py-3 px-4">Date &amp; Time</th>
                  <th class="py-3 px-4">Action Type</th>
                  <th class="py-3 px-4">Recipient / Custodian</th>
                  <th class="py-3 px-4">Officer</th>
                  <th class="py-3 px-4">Items</th>
                  <th class="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${
                  txns.length === 0
                    ? `<tr><td colspan="7" class="py-8 text-center text-gray-400">No transactions recorded.</td></tr>`
                    : txns
                        .map(
                          (t) => `
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="py-3 px-4 font-mono font-semibold text-blue-700">${t.id}</td>
                      <td class="py-3 px-4 text-gray-600 font-mono">${t.timestamp}</td>
                      <td class="py-3 px-4">${Badge.status(t.type)}</td>
                      <td class="py-3 px-4 font-medium text-gray-900">${t.employeeName || "-"}</td>
                      <td class="py-3 px-4 text-gray-600">${t.officer}</td>
                      <td class="py-3 px-4 font-semibold text-gray-800">${t.items.length} item(s)</td>
                      <td class="py-3 px-4 text-right">
                        <button type="button" class="btn-view-txn px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200" data-id="${t.id}">
                          View Details
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

    const filterHost = this.container.querySelector<HTMLElement>("#history-filter-host");
    if (filterHost) {
      FilterBar.bind(filterHost, {
        onSearch: (q) => {
          this.searchQuery = q;
          this.render();
        }
      });
    }

    const viewBtns = this.container.querySelectorAll<HTMLButtonElement>(".btn-view-txn");
    viewBtns.forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        if (id) {
          const t = TransactionsService.getById(id);
          if (t) this.showReceiptModal(t);
        }
      };
    });
  }

  private static showReceiptModal(t: Transaction): void {
    const modalId = "receipt-modal";
    const bodyHtml = `
      <div class="space-y-4 text-xs">
        <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 grid grid-cols-2 gap-2">
          <div><span class="text-gray-500">Transaction:</span> <span class="font-mono font-bold text-gray-900">${t.id}</span></div>
          <div><span class="text-gray-500">Timestamp:</span> <span class="font-mono text-gray-700">${t.timestamp}</span></div>
          <div><span class="text-gray-500">Action:</span> <span class="font-semibold text-blue-700">${t.type}</span></div>
          <div><span class="text-gray-500">Authorized By:</span> <span class="text-gray-900">${t.officer}</span></div>
          <div><span class="text-gray-500">Recipient:</span> <span class="font-semibold text-gray-900">${t.employeeName || "-"}</span></div>
          <div><span class="text-gray-500">Department:</span> <span class="text-gray-700">${t.department || "-"}</span></div>
        </div>

        <div>
          <span class="block font-semibold text-gray-900 mb-2">Itemized Equipment</span>
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th class="py-2 px-3">Asset Tag</th>
                  <th class="py-2 px-3">Model</th>
                  <th class="py-2 px-3">Serial No.</th>
                  <th class="py-2 px-3">Condition</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${t.items
                  .map(
                    (it) => `
                  <tr>
                    <td class="py-2 px-3 font-mono font-semibold text-blue-700">${it.assetId}</td>
                    <td class="py-2 px-3 text-gray-900">${it.name}</td>
                    <td class="py-2 px-3 font-mono text-gray-600">${it.serial}</td>
                    <td class="py-2 px-3 text-gray-600">${it.condition || "Good"}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        ${t.notes ? `<div class="text-[11px] text-gray-500 italic">Notes: ${t.notes}</div>` : ""}
      </div>
    `;

    Modal.show({
      id: modalId,
      title: `Transaction Receipt: ${t.id}`,
      width: "max-w-md",
      bodyHtml,
      footerHtml: `
        <button type="button" class="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700" onclick="Modal.close('${modalId}')">
          Close
        </button>
      `
    });
  }
}
