/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { getDb } from "@/lib/db";
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

/**
 * Server-side MongoDB repository implementations (production persistence).
 *
 * These are async because MongoDB is async. The browser demo uses the
 * synchronous `Repos` interface in `repositories/index.ts`; in production,
 * server actions / route handlers call these async methods instead. Business
 * logic in `services/` stays storage-agnostic and can be driven by either.
 *
 * Document IDs use the existing `id` field mapped to Mongo's `_id`.
 */
export interface AsyncRepository<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  save(entity: T): Promise<T>;
  saveMany(entities: T[]): Promise<void>;
  remove(id: string): Promise<void>;
  replaceAll(entities: T[]): Promise<void>;
}

function toDoc<T extends { id: string }>(entity: T): any {
  return { _id: entity.id, ...entity };
}

function fromDoc<T extends { id: string }>(doc: any): T {
  const rest = { ...doc };
  delete rest._id;
  return { ...rest, id: String(doc._id) } as T;
}

function collection<T extends { id: string }>(name: string): AsyncRepository<T> {
  const col = async () => (await getDb()).collection(name);
  return {
    async getAll() {
      const c = await col();
      const docs = await c.find({}).toArray();
      return docs.map((d) => fromDoc<T>(d));
    },
    async getById(id) {
      const c = await col();
      const doc = await c.findOne({ _id: id } as any);
      return doc ? fromDoc<T>(doc) : undefined;
    },
    async save(entity) {
      const c = await col();
      await c.replaceOne({ _id: entity.id } as any, toDoc(entity), { upsert: true });
      return entity;
    },
    async saveMany(entities) {
      const c = await col();
      await c.deleteMany({});
      if (entities.length) await c.insertMany(entities.map(toDoc));
    },
    async remove(id) {
      const c = await col();
      await c.deleteOne({ _id: id } as any);
    },
    async replaceAll(entities) {
      await this.saveMany(entities);
    },
  };
}

export interface AsyncSettingsRepository {
  get(): Promise<StoreSettings>;
  save(settings: StoreSettings): Promise<void>;
}

export interface MongoRepos {
  products: AsyncRepository<Product>;
  categories: AsyncRepository<Category>;
  brands: AsyncRepository<Brand>;
  suppliers: AsyncRepository<Supplier>;
  customers: AsyncRepository<Customer>;
  orders: AsyncRepository<Order>;
  inventory: AsyncRepository<InventoryMovement>;
  purchases: AsyncRepository<PurchaseOrder>;
  expenses: AsyncRepository<Expense>;
  accounting: AsyncRepository<AccountingEntry>;
  coupons: AsyncRepository<Coupon>;
  reviews: AsyncRepository<Review>;
  settings: AsyncSettingsRepository;
}

export function buildMongoRepos(): MongoRepos {
  return {
    products: collection<Product>("products"),
    categories: collection<Category>("categories"),
    brands: collection<Brand>("brands"),
    suppliers: collection<Supplier>("suppliers"),
    customers: collection<Customer>("customers"),
    orders: collection<Order>("orders"),
    inventory: collection<InventoryMovement>("inventory_movements"),
    purchases: collection<PurchaseOrder>("purchases"),
    expenses: collection<Expense>("expenses"),
    accounting: collection<AccountingEntry>("accounting_entries"),
    coupons: collection<Coupon>("coupons"),
    reviews: collection<Review>("reviews"),
    settings: {
      async get() {
        const db = await getDb();
        const doc = await db.collection("settings").findOne({ _id: "settings" } as any);
        if (!doc) return DEFAULT_SETTINGS;
        const rest = { ...doc } as Record<string, unknown>;
        delete rest._id;
        return rest as unknown as StoreSettings;
      },
      async save(settings) {
        const db = await getDb();
        await db
          .collection("settings")
          .replaceOne(
            { _id: "settings" } as any,
            { _id: "settings", ...settings },
            { upsert: true },
          );
      },
    },
  };
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: { en: "BanglaBazar", bn: "বাংলাবাজার" },
  currency: "BDT",
  phone: "",
  email: "",
  address: { en: "", bn: "" },
  codEnabled: true,
  codChargeMinor: 0,
  deliveryZones: [],
  isSample: false,
};

