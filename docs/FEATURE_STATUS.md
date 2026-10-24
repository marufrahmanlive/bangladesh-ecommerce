# Feature Status

## Fully implemented (demo, localStorage-backed)

- Bilingual storefront (English / বাংলা) with persistent language switcher.
- Product catalog: listing, search (name/SKU/brand/category, both languages),
  sorting, filters, pagination, quick view.
- Product detail: gallery, lightbox, hover zoom, color/size variants with
  image/price/SKU/stock sync, quantity limits, buy now, wishlist, reviews,
  related + recently viewed products, JSON-LD.
- Nested categories with breadcrumbs and category pages.
- Persistent cart & wishlist (versioned, schema-validated keys; survive
  refresh and restart; never cleared on refresh or failed checkout).
- Guest checkout with React Hook Form + Zod, Bangladesh phone validation,
  delivery zones, coupons, idempotent order creation, order number, success
  page, order tracking.
- Admin dashboard: overview cards, Recharts revenue chart, recent orders,
  pending payments, low-stock alerts.
- Admin CRUD: products, categories, inventory (stock movements/valuation),
  orders (status transitions, cancel + restock, COD collection), customers,
  suppliers, coupons, reviews (moderation), expenses.
- Accounting: P&L, cash flow, cash balance, ledger, sales/payment reports.
- Seed data, export/import, reset helpers; safe storage utilities.
- Sitemap, robots.txt, 404, policy pages.

## Demo-only / prototype

- localStorage persistence (single browser, not shared).
- Admin "role simulation" (no real authentication or server authorization).
- Sandbox/demo payment mode (bKash, Nagad, Card).

## Awaiting external credentials / server implementation

- MongoDB-backed shared persistence (see `docs/MONGODB_MIGRATION.md`).
- Real customer authentication and server-side authorization.
- Live payment gateways (bKash, Nagad, card aggregator).
- Server-side inventory, checkout and accounting transactions.
- Real product photography (currently generated SVG placeholders).
