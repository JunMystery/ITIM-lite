import { HardwareAsset, AssetMetrics } from "@/types/inventory";
import { StorageEngine } from "./storage";

const SEED_ASSETS: HardwareAsset[] = [
  { id: "AST-1001", name: 'MacBook Pro 16"', category: "Laptop", status: "inuse", serial: "C02G1234MD6R", model: "M1 Max 32GB", assignedTo: "Sarah Jenkins", department: "Engineering", location: "Building A - Floor 3" },
  { id: "AST-1002", name: "ThinkPad T14 Gen 3", category: "Laptop", status: "available", serial: "PF3A892K", model: "Core i7 16GB", location: "Stock Room A" },
  { id: "AST-1003", name: 'Dell UltraSharp 27" 4K', category: "Monitor", status: "inuse", serial: "CN-098K2L", model: "U2723QE", assignedTo: "Alex Rivera", department: "Design", location: "Building B - Studio 2" },
  { id: "AST-1004", name: "HP LaserJet Pro MFP", category: "Printer", status: "repair", serial: "VNB3K90123", model: "M428fdw", location: "IT Service Desk" },
  { id: "AST-1005", name: "Cisco Catalyst 2960X", category: "Network", status: "retired", serial: "FOC2134L0AB", model: "WS-C2960X-48TD-L", notes: "Decommissioned 2023-11" }
];

export class InventoryService {
  private static assets: HardwareAsset[] | null = null;

  public static getAll(): HardwareAsset[] {
    if (!this.assets) {
      this.assets = StorageEngine.loadJson<HardwareAsset[]>("assets", SEED_ASSETS);
    }
    return this.assets;
  }

  public static getById(id: string): HardwareAsset | null {
    const all = this.getAll();
    return all.find((a) => a.id === id) || null;
  }

  public static generateNextId(): string {
    const all = this.getAll();
    let maxNum = 1000;
    for (const a of all) {
      const match = a.id.match(/^AST-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `AST-${maxNum + 1}`;
  }

  public static create(asset: HardwareAsset): HardwareAsset {
    const all = this.getAll();
    all.push(asset);
    StorageEngine.saveJson("assets", all);
    return asset;
  }

  public static addInboundAsset(item: { name: string; category: string; serial: string; poNumber: string; unitPrice?: number; location?: string }): HardwareAsset {
    const all = this.getAll();
    const newAsset: HardwareAsset = {
      id: this.generateNextId(),
      name: item.name,
      category: item.category || "General",
      status: "available",
      serial: item.serial,
      location: item.location || "Stock Room A",
      purchaseDate: new Date().toISOString().substring(0, 10),
      notes: `Received via ${item.poNumber}`
    };
    all.push(newAsset);
    StorageEngine.saveJson("assets", all);
    return newAsset;
  }

  public static update(id: string, updates: Partial<HardwareAsset>): HardwareAsset | null {
    const all = this.getAll();
    const asset = all.find((a) => a.id === id);
    if (!asset) return null;
    Object.assign(asset, updates, { updatedAt: new Date().toISOString() });
    StorageEngine.saveJson("assets", all);
    return asset;
  }

  public static delete(id: string): boolean {
    const all = this.getAll();
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    StorageEngine.saveJson("assets", all);
    return true;
  }

  public static getMetrics(): AssetMetrics {
    const all = this.getAll();
    const metrics: AssetMetrics = { total: all.length, available: 0, inuse: 0, repair: 0, retired: 0 };
    for (const a of all) {
      if (a.status === "available") metrics.available++;
      else if (a.status === "inuse") metrics.inuse++;
      else if (a.status === "repair") metrics.repair++;
      else if (a.status === "retired") metrics.retired++;
    }
    return metrics;
  }
}
