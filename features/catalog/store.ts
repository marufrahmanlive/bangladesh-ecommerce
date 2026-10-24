"use client";

import { create } from "zustand";
import { buildLocalStorageRepos, type Repos } from "@/repositories";
import type {
  AccountingEntry,
  Brand,
  Category,
  Coupon,
  Customer,
  Expense,
  InventoryMovement,
  Order,
  Product,
  PurchaseOrder,
  Review,
  StoreSettings,
  Supplier,
} from "@/types";

interface CatalogState {
  ready: boolean;
  repos: Repos | null;
  products: Product[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  customers: Customer[];
  orders: Order[];
  inventory: InventoryMovement[];
  purchases: PurchaseOrder[];
  expenses: Expense[];
  accounting: AccountingEntry[];
  coupons: Coupon[];
  reviews: Review[];
  settings: StoreSettings | null;
  init: () => void;
  refresh: () => void;
}

export const useCatalogStore = create<CatalogState>()((set, get) => ({
  ready: false,
  repos: null,
  products: [],
  categories: [],
  brands: [],
  suppliers: [],
  customers: [],
  orders: [],
  inventory: [],
  purchases: [],
  expenses: [],
  accounting: [],
  coupons: [],
  reviews: [],
  settings: null,
  init: () => {
    const existing = get().repos;
    const repos = existing ?? buildLocalStorageRepos();
    if (!existing) set({ repos });
    get().refresh();
  },
  refresh: () => {
    const repos = get().repos;
    if (!repos) return;
    set({
      ready: true,
      products: repos.products.getAll(),
      categories: repos.categories.getAll(),
      brands: repos.brands.getAll(),
      suppliers: repos.suppliers.getAll(),
      customers: repos.customers.getAll(),
      orders: repos.orders.getAll(),
      inventory: repos.inventory.getAll(),
      purchases: repos.purchases.getAll(),
      expenses: repos.expenses.getAll(),
      accounting: repos.accounting.getAll(),
      coupons: repos.coupons.getAll(),
      reviews: repos.reviews.getAll(),
      settings: repos.settings.get(),
    });
  },
}));

export function useCatalog() {
  return useCatalogStore((s) => s);
}
