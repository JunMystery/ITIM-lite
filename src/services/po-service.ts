import { PurchaseOrder } from "@/types/models";
import { StorageEngine } from "./storage";
import { InventoryService } from "./inventory-service";

const SEED_POS: PurchaseOrder[] = [
  {
    poNumber: "PO-2023-001",
    vendor: "Dell Direct",
    orderDate: "2023-10-15",
    status: "partial",
    items: [
      { name: "Dell Latitude 5530", category: "Laptop", type: "hardware", qtyOrdered: 5, qtyReceived: 3, unitPrice: 1250.0 }
    ]
  },
  {
    poNumber: "PO-2023-002",
    vendor: "Apple Store Enterprise",
    orderDate: "2023-11-01",
    status: "pending",
    items: [
      { name: 'MacBook Pro 16"', category: "Laptop", type: "hardware", qtyOrdered: 2, qtyReceived: 0, unitPrice: 2499.0 }
    ]
  }
];

export class POService {
  private static orders: PurchaseOrder[] | null = null;

  public static getAll(): PurchaseOrder[] {
    if (!this.orders) {
      this.orders = StorageEngine.loadJson<PurchaseOrder[]>("purchase_orders", SEED_POS);
    }
    return this.orders;
  }

  public static getById(poNumber: string): PurchaseOrder | null {
    return this.getAll().find((p) => p.poNumber === poNumber) || null;
  }

  public static create(poData: Omit<PurchaseOrder, "status">): PurchaseOrder {
    const all = this.getAll();
    const newPo: PurchaseOrder = {
      ...poData,
      status: "pending"
    };
    all.unshift(newPo);
    StorageEngine.saveJson("purchase_orders", all);
    return newPo;
  }

  public static receiveItems(poNumber: string, lineIndex: number, serials: string[], receivedDate?: string): PurchaseOrder | null {
    const po = this.getById(poNumber);
    if (!po || !po.items[lineIndex]) return null;

    const item = po.items[lineIndex];
    item.qtyReceived += serials.length;
    if (!item.assetIds) item.assetIds = [];

    for (const serial of serials) {
      const asset = InventoryService.addInboundAsset({
        name: item.name,
        category: item.category,
        serial,
        poNumber: po.poNumber,
        unitPrice: item.unitPrice
      });
      item.assetIds.push(asset.id);
    }

    const allReceived = po.items.every((it) => it.qtyReceived >= it.qtyOrdered);
    const anyReceived = po.items.some((it) => it.qtyReceived > 0);
    po.status = allReceived ? "received" : anyReceived ? "partial" : "pending";
    if (receivedDate) po.receivedDate = receivedDate;

    const all = this.getAll();
    StorageEngine.saveJson("purchase_orders", all);
    return po;
  }
}
