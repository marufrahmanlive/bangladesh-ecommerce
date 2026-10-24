import { beforeEach, describe, expect, it } from "vitest";
import { buildMemoryRepos, type Repos } from "@/repositories";
import type { CartItem, Product, ProductVariant } from "@/types";
import {
  computeShippingMinor,
  evaluateCoupon,
  placeOrder,
} from "@/services/checkout";
import { cartSubtotalMinor } from "@/services/cart";

function makeItem(product: Product, variant: ProductVariant, quantity: number): CartItem {
  return {
    id: `${product.id}:${variant.id}`,
    productId: product.id,
    variantId: variant.id,
    name: product.name,
    slug: product.slug,
    sku: variant.sku,
    regularPriceMinor: variant.regularPriceMinor,
    priceMinor: variant.offerPriceMinor,
    quantity,
    stockAvailable: variant.stock,
    addedAt: "",
  };
}

describe("coupons", () => {
  it("applies percent discount with a cap", () => {
    const repos = buildMemoryRepos();
    const item = makeItem(
      repos.products.getById("prod-nakshi-bedcover")!,
      repos.products.getById("prod-nakshi-bedcover")!.variants[0],
      1,
    );
    const subtotal = cartSubtotalMinor([item]);
    const result = evaluateCoupon(repos, "WELCOME10", [item], subtotal);
    expect(result.ok).toBe(true);
    expect(result.discountMinor).toBe(Math.round(subtotal * 0.1));
  });

  it("rejects unknown coupons", () => {
    const repos = buildMemoryRepos();
    const result = evaluateCoupon(repos, "NOPE", [], 10000);
    expect(result.ok).toBe(false);
  });
});

describe("placeOrder", () => {
  let repos: Repos;
  beforeEach(() => {
    localStorage.clear();
    repos = buildMemoryRepos();
  });

  it("creates an order, deducts stock, and prevents duplicate submissions", () => {
    const product = repos.products.getById("prod-nakshi-bedcover")!;
    const variant = product.variants.find((v) => v.stock > 5)!;
    const before = variant.stock;
    const item = makeItem(product, variant, 2);

    const res = placeOrder(repos, {
      customer: {
        fullName: "Test User",
        phone: "01712345678",
        district: "Dhaka",
        city: "Dhanmondi",
        address: "Test address",
      },
      items: [item],
      deliveryMethod: "standard",
      paymentMethod: "cod",
      idempotencyKey: "key-1",
    });

    expect(res.ok).toBe(true);
    expect(res.order!.orderNumber).toMatch(/^ORD-/);
    expect(res.order!.paymentStatus).toBe("pending");

    const afterFirst = repos.products.getById("prod-nakshi-bedcover")!.variants.find((v) => v.id === variant.id)!.stock;
    expect(afterFirst).toBe(before - 2);

    // Duplicate submission with the same idempotency key must not double-deduct.
    const dup = placeOrder(repos, {
      customer: {
        fullName: "Test User",
        phone: "01712345678",
        district: "Dhaka",
        city: "Dhanmondi",
        address: "Test address",
      },
      items: [item],
      deliveryMethod: "standard",
      paymentMethod: "cod",
      idempotencyKey: "key-1",
    });
    expect(dup.duplicate).toBe(true);
    const afterDup = repos.products.getById("prod-nakshi-bedcover")!.variants.find((v) => v.id === variant.id)!.stock;
    expect(afterDup).toBe(afterFirst);
  });

  it("rejects insufficient stock", () => {
    const product = repos.products.getById("prod-mens-shirt")!;
    const variant = product.variants.find((v) => v.stock === 0)!;
    const res = placeOrder(repos, {
      customer: { fullName: "T", phone: "01712345678", district: "Dhaka", city: "X", address: "X" },
      items: [makeItem(product, variant, 1)],
      deliveryMethod: "standard",
      paymentMethod: "cod",
      idempotencyKey: "key-2",
    });
    expect(res.ok).toBe(false);
  });
});

describe("shipping", () => {
  it("applies zone charge and free shipping threshold", () => {
    const repos = buildMemoryRepos();
    const settings = repos.settings.get();
    expect(computeShippingMinor(settings, "Dhaka", 100000)).toBe(6000);
    expect(computeShippingMinor(settings, "Dhaka", 400000)).toBe(0);
    expect(computeShippingMinor(settings, "Chattogram", 100000)).toBe(12000);
  });
});
