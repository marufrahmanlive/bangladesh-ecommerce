// Exports MongoDB collections to a JSON file for backup/migration.
// Usage: MONGODB_URI=... MONGODB_DB=... node scripts/migrate-export.mjs [out.json]
import { writeFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const outPath = process.argv[2] ?? "mongo-export.json";
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "banglajbazar";

if (!uri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

const COLLECTIONS = [
  "products",
  "categories",
  "brands",
  "suppliers",
  "customers",
  "orders",
  "inventory_movements",
  "purchases",
  "expenses",
  "accounting_entries",
  "coupons",
  "reviews",
  "settings",
];

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const collections = {};
for (const name of COLLECTIONS) {
  const docs = await db.collection(name).find({}).toArray();
  collections[name] = docs.map(({ _id, ...rest }) =>
    name === "settings" ? rest : { id: String(_id), ...rest },
  );
}

writeFileSync(outPath, JSON.stringify({ version: 1, collections }, null, 2), "utf8");
console.log(`Exported ${COLLECTIONS.length} collections to ${outPath}`);
await client.close();
