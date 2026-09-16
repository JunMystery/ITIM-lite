export interface SoftwareLicense {
  id: string;
  software: string;
  vendor?: string;
  licenseType: string;
  totalSeats: number;
  assignedSeats: number;
  key?: string;
  expiryDate?: string;
  notes?: string;
}

export interface ConsumableItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  location?: string;
}

export interface Assignment {
  id: string;
  assetId: string;
  assetName: string;
  employeeName: string;
  employeeEmail?: string;
  department?: string;
  checkoutDate: string;
  expectedReturn?: string;
  actualReturn?: string;
  conditionOut?: string;
  conditionIn?: string;
  status: "active" | "returned";
  notes?: string;
}

export interface TransactionItem {
  assetId: string;
  name: string;
  serial?: string;
  category?: string;
  condition?: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  type: string;
  officer?: string;
  employeeName?: string;
  department?: string;
  expectedReturnDate?: string;
  notes?: string;
  itemCount: number;
  items: TransactionItem[];
}

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  required?: boolean;
  options?: string[];
}

export interface Category {
  id: string;
  name: string;
  type: "hardware" | "software" | "consumable";
  description?: string;
  customFields?: CustomField[];
  itemCount?: number;
}

export interface CatalogItem {
  id: string;
  sku?: string;
  name: string;
  type: "hardware" | "software" | "consumable";
  category: string;
  model?: string;
  notes?: string;
  customFields?: Record<string, string | number>;
}

export interface POLineItem {
  name: string;
  category: string;
  type: "hardware" | "software" | "consumable";
  qtyOrdered: number;
  qtyReceived: number;
  unitPrice?: number;
  assetIds?: string[];
}

export interface PurchaseOrder {
  poNumber: string;
  vendor: string;
  orderDate: string;
  receivedDate?: string;
  status: "pending" | "partial" | "received" | "cancelled";
  notes?: string;
  items: POLineItem[];
}
