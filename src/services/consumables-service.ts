import { ConsumableItem } from "@/types/models";
import { StorageEngine } from "./storage";

const SEED_CONSUMABLES: ConsumableItem[] = [
  { id: "CON-3001", name: "Cat6 Ethernet Cable 2m", category: "Cables & Adapters", quantity: 24, minQuantity: 10, location: "Bin C-12" },
  { id: "CON-3002", name: "USB-C to HDMI Adapter", category: "Cables & Adapters", quantity: 5, minQuantity: 8, location: "Bin A-04" },
  { id: "CON-3003", name: "HP LaserJet Toner 58A", category: "Toner & Cartridge", quantity: 2, minQuantity: 3, location: "Shelf T-2" }
];

export class ConsumablesService {
  private static items: ConsumableItem[] | null = null;

  public static getAll(): ConsumableItem[] {
    if (!this.items) {
      this.items = StorageEngine.loadJson<ConsumableItem[]>("consumables", SEED_CONSUMABLES);
    }
    return this.items;
  }

  public static getById(id: string): ConsumableItem | null {
    return this.getAll().find((c) => c.id === id) || null;
  }

  public static adjustStock(id: string, delta: number): ConsumableItem | null {
    const all = this.getAll();
    const item = all.find((c) => c.id === id);
    if (!item) return null;
    item.quantity = Math.max(0, item.quantity + delta);
    StorageEngine.saveJson("consumables", all);
    return item;
  }

  public static isLowStock(item: ConsumableItem): boolean {
    return item.quantity <= item.minQuantity;
  }
}
