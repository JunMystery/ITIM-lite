import { Transaction } from "@/types/models";
import { StorageEngine } from "./storage";
import { InventoryService } from "./inventory-service";

const SEED_TXNS: Transaction[] = [
  {
    id: "TXN-5001",
    timestamp: "2023-01-15 10:30",
    type: "CHECKOUT",
    officer: "IT Admin",
    employeeName: "Sarah Jenkins",
    department: "Engineering",
    expectedReturnDate: "2024-01-15",
    notes: "New joiner onboarding setup",
    itemCount: 1,
    items: [
      { assetId: "AST-1001", name: 'MacBook Pro 16"', serial: "C02G1234MD6R", category: "Laptop", condition: "New / Mint" }
    ]
  }
];

export class TransactionsService {
  private static txns: Transaction[] | null = null;

  public static getAll(): Transaction[] {
    if (!this.txns) {
      this.txns = StorageEngine.loadJson<Transaction[]>("transactions", SEED_TXNS);
    }
    return this.txns;
  }

  public static getById(id: string): Transaction | null {
    const all = this.getAll();
    return all.find((t) => t.id === id) || null;
  }

  public static generateNextTxnId(): string {
    const all = this.getAll();
    let max = 5000;
    for (const t of all) {
      const match = t.id.match(/^TXN-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    }
    return `TXN-${max + 1}`;
  }

  public static record(txnData: Omit<Transaction, "id" | "timestamp" | "itemCount">): Transaction {
    const all = this.getAll();
    const newTxn: Transaction = {
      ...txnData,
      id: this.generateNextTxnId(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      itemCount: txnData.items.length
    };

    for (const it of newTxn.items) {
      if (newTxn.type === "CHECKOUT") {
        InventoryService.update(it.assetId, {
          status: "inuse",
          assignedTo: newTxn.employeeName || "",
          department: newTxn.department || ""
        });
      } else if (newTxn.type === "CHECKIN") {
        InventoryService.update(it.assetId, {
          status: "available",
          assignedTo: "",
          department: ""
        });
      } else if (newTxn.type === "repair" || newTxn.type === "retired") {
        InventoryService.update(it.assetId, {
          status: newTxn.type as any
        });
      }
    }

    all.unshift(newTxn);
    StorageEngine.saveJson("transactions", all);
    return newTxn;
  }
}
