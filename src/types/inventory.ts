export type AssetStatus = "available" | "inuse" | "repair" | "retired";

export interface HardwareAsset {
  id: string;
  name: string;
  category: string;
  status: AssetStatus;
  serial?: string;
  model?: string;
  assignedTo?: string;
  department?: string;
  location?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  notes?: string;
  customFields?: Record<string, string | number>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetMetrics {
  total: number;
  available: number;
  inuse: number;
  repair: number;
  retired: number;
}
