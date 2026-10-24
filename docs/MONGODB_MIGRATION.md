# MongoDB Migration Plan

This app's business logic depends only on the `Repos` interface in
`repositories/index.ts`. To move from single-browser localStorage to shared
MongoDB persistence, implement a `MongoRepos` factory that satisfies the same
interface and swap it in server components / route handlers.

## Data models (collections)

Each collection maps 1:1 to the types in `types/`. Use string `_id` values
matching the existing `id` fields.

- `products` — Product (+ embedded `variants`, `specifications`)
- `categories` — Category (parent/child via `parentId`)
- `customers` — Customer (+ embedded `addresses`)
- `suppliers` — Supplier
- `orders` — Order (+ embedded `items`, `statusHistory`, `payments`)
- `inventory_movements` — InventoryMovement
- `purchases` — PurchaseOrder (+ embedded `items`)
- `expenses` — Expense
- `accounting_entries` — AccountingEntry
- `coupons` — Coupon
- `reviews` — Review
- `users` — staff accounts (never in localStorage)
- `settings` — StoreSettings (singleton)

## Suggested indexes

- `products`: unique `sku`; unique `slug`; `categoryId`; `isPublished`;
  text index on `name.en`, `name.bn`, `sku`.
- `categories`: unique `slug`; `parentId`.
- `orders`: unique `orderNumber`; `customer.phone`; `status`;
  `paymentStatus`; `createdAt`.
- `inventory_movements`: `{referenceType, referenceId, type}` (dedup);
  `{productId, variantId}`.
- `accounting_entries`: `{account, date}`; `{referenceType, referenceId}`.
- `reviews`: `productId`; `hidden`.

## MongoDB connection module

Implemented in `lib/db.ts` (server-only):

```ts
import "server-only";
import { MongoClient } from "mongodb";
// lazy connect, reads MONGODB_URI / MONGODB_DB
export async function getDb() { ... }
```

## Server repository implementations

Implemented in `repositories/mongo.ts` — `buildMongoRepos()` returns an async
`MongoRepos` object whose collections implement the same CRUD shape as the
localStorage repositories (`AsyncRepository<T>`). Because MongoDB is async,
these are consumed from server actions / route handlers rather than the
synchronous client-side `Repos` interface. Business logic in `services/`
remains unchanged.

## API / server action contracts

- Public reads: `/api/products`, `/api/categories`, `/api/products/[slug]`.
- Auth-protected mutations: server actions or `/api/admin/*` route handlers
  that call the same services used today, passing `MongoRepos`.
- Checkout: a single server action that re-validates prices, deducts stock,
  posts accounting entries and creates the order **in one MongoDB transaction**.

## Transactions

Order placement, stock deduction, payment capture and financial postings must
run in a multi-document transaction:

```ts
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    // validate + deduct stock + create order + post entries
  });
} finally {
  await session.endSession();
}
```

Multi-document transactions require a **replica set** (MongoDB Atlas satisfies
this; a standalone local instance does not). Configure a single-node replica
set for local development.

## Migration scripts

Implemented:
- `scripts/migrate-import.mjs` — imports a browser export (from
  `exportAllData()`) into MongoDB, validating shape and mapping
  `be.v1.*` keys to collection names.
- `scripts/migrate-export.mjs` — exports MongoDB collections back to JSON for
  backup/migration.

Usage:
```bash
MONGODB_URI=... MONGODB_DB=... node scripts/migrate-import.mjs data-export.json
MONGODB_URI=... MONGODB_DB=... node scripts/migrate-export.mjs mongo-export.json
```

## Migration checklist

1. Provision MongoDB (Atlas or replica-set local).
2. Set `MONGODB_URI` / `MONGODB_DB` env vars.
3. Run migration import; verify counts.
4. Create indexes.
5. Replace `buildLocalStorageRepos()` calls with `buildMongoRepos()` on the
   server; keep localStorage only for cart/wishlist if desired.
6. Add authentication + authorization (see `types/user.ts` roles).
7. Move checkout/payment/admin logic to server actions.
8. Remove `isSample` demo data from production.
9. Run the full test suite and a manual end-to-end order flow.
