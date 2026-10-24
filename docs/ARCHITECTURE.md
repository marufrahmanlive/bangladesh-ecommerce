# Architecture

## Directory layout

- `app/` — App Router routes (storefront route group + `/admin`).
- `components/` — reusable UI (`ui/`) and feature UI (`storefront/`, `admin/`).
- `features/` — client modules: `catalog`, `cart`, `wishlist`, `i18n`, `auth`,
  `ui`, `recent` (Zustand stores + hooks).
- `lib/` — utilities, validation, formatting, storage, seed data.
- `services/` — storage-agnostic business logic.
- `repositories/` — data-access interfaces + localStorage/memory implementations.
- `types/` — shared TypeScript types + Zod schemas.
- `messages/` — English and Bengali translation catalogs.
- `scripts/` — dev scripts (image generation).

## Persistence model

`repositories/index.ts` defines a generic `Repository<T>` interface plus
`MemoryRepository` and `LocalStorageRepository` implementations, and a `Repos`
registry (`buildMemoryRepos`, `buildLocalStorageRepos`).

- **Memory repositories** are seeded with the same demo catalog and are used by
  server components for SSR metadata, `generateStaticParams`, the sitemap and
  `robots.txt`.
- **LocalStorage repositories** are used by client mutations (admin CRUD, cart,
  checkout). They validate stored JSON with Zod, seed only on first launch, and
  never overwrite existing data.

All business logic in `services/` depends only on the `Repos` interface, never
on a specific storage implementation. Swapping localStorage for MongoDB means
providing `MongoRepos` implementing the same interface — no service changes.

## Money

`MoneyMinor` is an integer number of poisha (1 BDT = 100 poisha). See
`lib/money.ts`. Formatting is locale-aware (`lib/format.ts`).

## i18n

`messages/{en,bn}.json` + a lightweight `useI18n()` hook (`features/i18n`).
Language is stored in a versioned localStorage key and applied to
`document.documentElement.lang`.

## State

Zustand stores hydrate from localStorage on mount (`components/providers.tsx`).
Cart and wishlist are persisted with versioned, schema-validated keys.
