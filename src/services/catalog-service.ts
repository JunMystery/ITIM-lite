import { CatalogItem, Category } from "@/types/models";
import { StorageEngine } from "./storage";

const SEED_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Laptop", type: "hardware", description: "Portable laptops", itemCount: 3 },
  { id: "cat-2", name: "Monitor", type: "hardware", description: "Displays", itemCount: 1 },
  { id: "cat-3", name: "Office Suite", type: "software", description: "Productivity software", itemCount: 1 },
  { id: "cat-4", name: "Cables & Adapters", type: "consumable", description: "HDMI, USB-C cables", itemCount: 2 }
];

const SEED_CATALOG: CatalogItem[] = [
  { id: "cat-item-1", sku: "SKU-1001", name: 'MacBook Pro 16"', type: "hardware", category: "Laptop", model: "M1 Max 32GB" },
  { id: "cat-item-2", sku: "SKU-1002", name: "Dell Latitude 5530", type: "hardware", category: "Laptop", model: "Core i7 16GB" },
  { id: "cat-item-3", sku: "SKU-1003", name: 'Dell UltraSharp 27" 4K', type: "hardware", category: "Monitor", model: "U2723QE" }
];

export class CatalogService {
  private static catalog: CatalogItem[] | null = null;
  private static categories: Category[] | null = null;

  public static getCategories(): Category[] {
    if (!this.categories) {
      this.categories = StorageEngine.loadJson<Category[]>("categories", SEED_CATEGORIES);
    }
    return this.categories;
  }

  public static addCategory(category: Omit<Category, "id">): Category {
    const all = this.getCategories();
    const newCat: Category = {
      ...category,
      id: `cat-${Date.now()}`
    };
    all.push(newCat);
    StorageEngine.saveJson("categories", all);
    return newCat;
  }

  public static getCatalog(): CatalogItem[] {
    if (!this.catalog) {
      this.catalog = StorageEngine.loadJson<CatalogItem[]>("catalog", SEED_CATALOG);
    }
    return this.catalog;
  }

  public static getCatalogById(id: string): CatalogItem | null {
    return this.getCatalog().find((c) => c.id === id) || null;
  }

  public static addCatalogItem(item: Omit<CatalogItem, "id">): CatalogItem {
    const all = this.getCatalog();
    const newItem: CatalogItem = {
      ...item,
      id: `item-${Date.now()}`
    };
    all.push(newItem);
    StorageEngine.saveJson("catalog", all);
    return newItem;
  }
}
