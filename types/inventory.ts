import type { MoneyMinor, Timestamped } from "./catalog";

export const STOCK_MOVEMENT_TYPES = [
  "opening",
  "purchase",
  "sale",
  "return_in",
  "return_out",
  "damage",
  "adjustment",
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export interface InventoryMovement extends Timestamped {
  id: string;
  productId: string;
  variantId: string;
  type: StockMovementType;
  /** Signed quantity: positive adds stock, negative removes stock. */
  quantityChange: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  unitCostMinor?: MoneyMinor;
  performedBy?: string;
  isSample: boolean;
}

export type PurchaseStatus =
  | "draft"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled";

export interface PurchaseItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  quantity: number;
  receivedQuantity: number;
  unitCostMinor: MoneyMinor;
}

export interface PurchaseOrder extends Timestamped {
  id: string;
  poNumber: string;
  supplierId: string;
  items: PurchaseItem[];
  status: PurchaseStatus;
  note?: string;
  isSample: boolean;
}

export interface SupplierPayment extends Timestamped {
  id: string;
  supplierId: string;
  amountMinor: MoneyMinor;
  date: string;
  method: string;
  reference?: string;
  note?: string;
  isSample: boolean;
}
