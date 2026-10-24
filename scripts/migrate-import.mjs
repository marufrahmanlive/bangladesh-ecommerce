// Imports a browser data export (from exportAllData()) into MongoDB.
// Usage: MONGODB_URI=... MONGODB_DB=... node scripts/migrate-import.mjs [data-export.json]
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const inputPath = process.argv[2] ?? "data-export.json";
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "banglajbazar";

const KEY_TO_COLLECTION = {
  "be.v1.products": "products",
  "be.v1.categories": "categories",
  "be.v1.brands": "brands",
  "be.v1.suppliers": "suppliers",
  "be.v1.customers": "customers",
  "be.v1.orders": "orders",
  "be.v1.inventory": "inventory_movements",
  "be.v1.purchases": "purchases",
  "be.v1.expenses": "expenses",
  "be.v1.accounting": "accounting_entries",
  "be.v1.coupons": "coupons",
  "be.v1.reviews": "reviews",
  "be.v1.settings": "settings",
};

if (!uri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

const raw = readFileSync(inputPath, "utf8");
const data = JSON.parse(raw);

if (!data || typeof data.collections !== "object") {
  console.error("Invalid export file: expected { version, collections }");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

let total = 0;
for (const [key, collection] of Object.entries(KEY_TO_COLLECTION)) {
  const records = data.collections[key];
  if (!Array.isArray(records)) continue;
  if (collection === "settings") {
    await db.collection(collection).replaceOne(
      { _id: "settings" },
      { _id: "settings", ...records[0] },
      { upsert: true },
    );
    total += 1;
    continue;
  }
  if (records.length) {
    await db.collection(collection).deleteMany({});
    await db.collection(collection).insertMany(
      records.map((r) => ({ _id: r.id, ...r })),
    );
    total += records.length;
  }
}

console.log(`Imported ${total} records into ${dbName}`);
await client.close();
