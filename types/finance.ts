import type { LocalizedText, MoneyMinor, Timestamped } from "./catalog";

export type EntryType =
  | "sale"
  | "purchase"
  | "customer_payment"
  | "supplier_payment"
  | "cod_collection"
  | "refund"
  | "expense"
  | "income"
  | "opening";

export type LedgerAccount =
  | "cash"
  | "bank"
  | "receivable"
  | "payable"
  | "sales"
  | "purchases"
  | "expenses"
  | "income";

export interface AccountingEntry extends Timestamped {
  id: string;
  date: string;
  type: EntryType;
  account: LedgerAccount;
  /** Signed: positive = inflow to the account, negative = outflow. */
  amountMinor: MoneyMinor;
  referenceType?: string;
  referenceId?: string;
  description: string;
  isSample: boolean;
}

export interface Expense extends Timestamped {
  id: string;
  category: string;
  amountMinor: MoneyMinor;
  date: string;
  notes?: string;
  reference?: string;
  isSample: boolean;
}

export interface DeliveryZone {
  id: string;
  name: LocalizedText;
  districts: string[];
  chargeMinor: MoneyMinor;
  freeAboveMinor?: MoneyMinor;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: LocalizedText;
  currency: "BDT";
  phone: string;
  email: string;
  address: LocalizedText;
  codEnabled: boolean;
  codChargeMinor: MoneyMinor;
  deliveryZones: DeliveryZone[];
  isSample: boolean;
}
