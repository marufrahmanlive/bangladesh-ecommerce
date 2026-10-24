import { z } from "zod";
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
import {
  accountingEntrySchema,
  categorySchema,
  couponSchema,
  customerSchema,
  expenseSchema,
  inventoryMovementSchema,
  orderSchema,
  productSchema,
  purchaseOrderSchema,
  reviewSchema,
  storeSettingsSchema,
  supplierSchema,
  collection,
} from "@/types/schemas";
import { hasKey, keyFor, readValidated, writeJson } from "@/lib/storage";
import {
  seedAccountingEntries,
  seedBrands,
  seedCategories,
  seedCoupons,
  seedCustomers,
  seedExpenses,
  seedInventoryMovements,
  seedOrders,
  seedProducts,
  seedPurchases,
  seedReviews,
  seedSettings,
  seedSuppliers,
} from "@/lib/seed-data";

export interface Repository<T extends { id: string }> {
  getAll(): T[];
  getById(id: string): T | undefined;
  save(entity: T): T;
  saveMany(entities: T[]): void;
  remove(id: string): void;
  replaceAll(entities: T[]): void;
}

export function createMemoryRepository<T extends { id: string }>(
  seed: T[] = [],
): Repository<T> {
  let items: T[] = [...seed];
  return {
    getAll: () => [...items],
    getById: (id) => items.find((x) => x.id === id),
    save: (entity) => {
      const idx = items.findIndex((x) => x.id === entity.id);
      if (idx >= 0) items[idx] = entity;
      else items.push(entity);
      return entity;
    },
    saveMany: (entities) => {
      items = [...entities];
    },
    remove: (id) => {
      items = items.filter((x) => x.id !== id);
    },
    replaceAll: (entities) => {
      items = [...entities];
    },
  };
}

export function createLocalStorageRepository<T extends { id: string }>(
  key: string,
  schema: z.ZodType<T[]>,
  seed: T[] = [],
): Repository<T> {
  const storageKey = keyFor(key);
  const read = (): T[] => {
    const parsed = readValidated<T[]>(storageKey, schema);
    if (parsed) return parsed;
    // Seed only when the key is missing (first launch). Never overwrite
    // existing user data, even if it failed validation.
    if (!hasKey(storageKey)) {
      writeJson(storageKey, seed);
    }
    return [...seed];
  };
  const write = (items: T[]): boolean => writeJson(storageKey, items);
  return {
    getAll: () => read(),
    getById: (id) => read().find((x) => x.id === id),
    save: (entity) => {
      const items = read();
      const idx = items.findIndex((x) => x.id === entity.id);
      if (idx >= 0) items[idx] = entity;
      else items.push(entity);
      write(items);
      return entity;
    },
    saveMany: (entities) => {
      write([...entities]);
    },
    remove: (id) => {
      write(read().filter((x) => x.id !== id));
    },
    replaceAll: (entities) => {
      write([...entities]);
    },
  };
}

export type ProductRepository = Repository<Product>;
export type CategoryRepository = Repository<Category>;
export type BrandRepository = Repository<Brand>;
export type SupplierRepository = Repository<Supplier>;
export type CustomerRepository = Repository<Customer>;
export type OrderRepository = Repository<Order>;
export type InventoryRepository = Repository<InventoryMovement>;
export type PurchaseRepository = Repository<PurchaseOrder>;
export type ExpenseRepository = Repository<Expense>;
export type AccountingRepository = Repository<AccountingEntry>;
export type CouponRepository = Repository<Coupon>;
export type ReviewRepository = Repository<Review>;

export interface SettingsRepository {
  get(): StoreSettings;
  save(settings: StoreSettings): void;
}

export interface Repos {
  products: ProductRepository;
  categories: CategoryRepository;
  brands: BrandRepository;
  suppliers: SupplierRepository;
  customers: CustomerRepository;
  orders: OrderRepository;
  inventory: InventoryRepository;
  purchases: PurchaseRepository;
  expenses: ExpenseRepository;
  accounting: AccountingRepository;
  coupons: CouponRepository;
  reviews: ReviewRepository;
  settings: SettingsRepository;
}

const brandSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    isActive: z.boolean(),
    isSample: z.boolean(),
  })
  .passthrough();

export function buildMemoryRepos(): Repos {
  return {
    products: createMemoryRepository<Product>(seedProducts),
    categories: createMemoryRepository<Category>(seedCategories),
    brands: createMemoryRepository<Brand>(seedBrands),
    suppliers: createMemoryRepository<Supplier>(seedSuppliers),
    customers: createMemoryRepository<Customer>(seedCustomers),
    orders: createMemoryRepository<Order>(seedOrders),
    inventory: createMemoryRepository<InventoryMovement>(seedInventoryMovements),
    purchases: createMemoryRepository<PurchaseOrder>(seedPurchases),
    expenses: createMemoryRepository<Expense>(seedExpenses),
    accounting: createMemoryRepository<AccountingEntry>(seedAccountingEntries),
    coupons: createMemoryRepository<Coupon>(seedCoupons),
    reviews: createMemoryRepository<Review>(seedReviews),
    settings: createMemorySettings(seedSettings),
  };
}

export function buildLocalStorageRepos(): Repos {
  return {
    products: createLocalStorageRepository<Product>(
      "products",
      collection(productSchema),
      seedProducts,
    ),
    categories: createLocalStorageRepository<Category>(
      "categories",
      collection(categorySchema),
      seedCategories,
    ),
    brands: createLocalStorageRepository<Brand>("brands", collection(brandSchema), seedBrands),
    suppliers: createLocalStorageRepository<Supplier>(
      "suppliers",
      collection(supplierSchema),
      seedSuppliers,
    ),
    customers: createLocalStorageRepository<Customer>(
      "customers",
      collection(customerSchema),
      seedCustomers,
    ),
    orders: createLocalStorageRepository<Order>("orders", collection(orderSchema), seedOrders),
    inventory: createLocalStorageRepository<InventoryMovement>(
      "inventory",
      collection(inventoryMovementSchema),
      seedInventoryMovements,
    ),
    purchases: createLocalStorageRepository<PurchaseOrder>(
      "purchases",
      collection(purchaseOrderSchema),
      seedPurchases,
    ),
    expenses: createLocalStorageRepository<Expense>(
      "expenses",
      collection(expenseSchema),
      seedExpenses,
    ),
    accounting: createLocalStorageRepository<AccountingEntry>(
      "accounting",
      collection(accountingEntrySchema),
      seedAccountingEntries,
    ),
    coupons: createLocalStorageRepository<Coupon>(
      "coupons",
      collection(couponSchema),
      seedCoupons,
    ),
    reviews: createLocalStorageRepository<Review>(
      "reviews",
      collection(reviewSchema),
      seedReviews,
    ),
    settings: createLocalStorageSettings(seedSettings),
  };
}

function createMemorySettings(seed: StoreSettings): SettingsRepository {
  let value = { ...seed };
  return {
    get: () => value,
    save: (settings) => {
      value = settings;
    },
  };
}

function createLocalStorageSettings(seed: StoreSettings): SettingsRepository {
  const storageKey = keyFor("settings");
  return {
    get: () => {
      const parsed = readValidated<StoreSettings>(storageKey, storeSettingsSchema);
      if (parsed) return parsed;
      if (!hasKey(storageKey)) writeJson(storageKey, seed);
      return { ...seed };
    },
    save: (settings) => {
      writeJson(storageKey, settings);
    },
  };
}

