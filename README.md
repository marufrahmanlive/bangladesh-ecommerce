# BanglaBazar — Bilingual Ecommerce for Bangladesh

A production-structured, bilingual (English / বাংলা) ecommerce application for
selling **কাঁথা (Kantha), clothing, cosmetics, home essentials and everyday
products** in Bangladesh. It includes a full customer storefront and a demo
admin dashboard.

> **Prototype persistence mode.** This project currently uses **localStorage**
> as a clearly-labelled demo persistence layer so it runs with no server or
> database. localStorage is browser-specific and cannot share data between
> customers, admins, devices, or browsers. It is **not** a production database.
> The repository/service architecture is designed so localStorage can be
> replaced with MongoDB without rewriting business logic — see
> [`docs/MONGODB_MIGRATION.md`](docs/MONGODB_MIGRATION.md).

## Tech stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict)
- Tailwind CSS 4, `class-variance-authority`, `lucide-react`
- React Hook Form + Zod, Zustand, Recharts
- LocalStorage (versioned, schema-validated) behind repository interfaces

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

Type checks:

```bash
npm run typecheck
```

## Demo data

On first launch in a fresh browser profile, realistic sample data is seeded
into localStorage (products, categories, customers, suppliers, orders, reviews,
coupons, expenses, accounting entries). Seeding is idempotent and **never
overwrites existing user data**.

- **Reset demo data:** clear the namespaced keys with `resetDemoData()` from
  `@/lib/seed` (a confirmation is required in the UI).
- **Export/import:** `exportAllData` / `importAllData` from `@/lib/seed` with
  validation.

All sample records are flagged `isSample: true` and must not be mistaken for
real orders, payments, or financial records.

## Routes

- Storefront: `/`, `/products`, `/products/[slug]`, `/categories/[slug]`,
  `/search`, `/cart`, `/checkout`, `/checkout/success`, `/wishlist`,
  `/orders/track`, `/account`, `/about`, `/contact`, and policy pages.
- Admin: `/admin` and `/admin/{products,categories,inventory,orders,customers,
  suppliers,purchases,coupons,reviews,expenses,payments,invoices,ledger,
  accounting,reports,settings}` plus detail pages.

## Language & currency

- Language switcher in the header and mobile menu; preference persists across
  sessions (versioned localStorage key + `document.documentElement.lang`).
- All monetary values are stored as **integer minor units (poisha)**. 1 BDT =
  100 poisha. Currency is BDT (৳).

## Payment methods (demo/sandbox)

COD, bKash, Nagad and Card are implemented behind a `PaymentProvider`
interface. Until real merchant credentials are configured, online methods run
in a clearly-labelled **sandbox/demo mode** — no real money moves and no fake
success is fabricated. See [`docs/PAYMENTS.md`](docs/PAYMENTS.md).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — structure and storage swap
- [`docs/MONGODB_MIGRATION.md`](docs/MONGODB_MIGRATION.md) — data models,
  indexes, migration scripts and checklist
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md) — payment gateway configuration
- [`docs/ACCOUNTING.md`](docs/ACCOUNTING.md) — accounting model & assumptions
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment & security checklist
- [`docs/FEATURE_STATUS.md`](docs/FEATURE_STATUS.md) — implemented / demo-only /
  awaiting credentials

## Testing

```bash
npm run test       # Vitest unit/component tests
npm run test:e2e   # Playwright end-to-end tests
npm run lint
```

## Security note

Do not use localStorage as an authoritative production database. Real customer
authentication, shared inventory, and live payments require the server-side
(MongoDB) implementations and credentials described in the docs. No passwords,
payment credentials, secret keys, or sensitive data are stored in localStorage.

