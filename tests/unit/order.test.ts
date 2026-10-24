import { describe, expect, it } from "vitest";
import { buildMemoryRepos, type Repos } from "@/repositories";
import { canTransition, cancelOrder, markPaymentCollected } from "@/services/order";
import { placeOrder } from "@/services/checkout";
import type { CartItem } from "@/types";

function item(productId: string, variantId: string, qty: number, priceMinor: number): CartItem {
  return {
    id: `${productId}:${variantId}`,
    productId,
    variantId,
    name: { en: "x", bn: "x" },
    slug: "x",
    sku: "S",
    regularPriceMinor: priceMinor,
    priceMinor,
    quantity: qty,
    stockAvailable: 100,
    addedAt: "",
  };
}

describe("order status transitions", () => {
  it("allows valid transitions and rejects invalid ones", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("pending", "delivered")).toBe(false);
    expect(canTransition("cancelled", "shipped")).toBe(false);
  });

  it("cancelling restocks inventory", () => {
    localStorage.clear();
    const repos: Repos = buildMemoryRepos();
    const product = repos.products.getById("prod-nakshi-bedcover")!;
    const variant = product.variants.find((v) => v.stock > 5)!;
    const before = variant.stock;

    const res = placeOrder(repos, {
      customer: { fullName: "T", phone: "01712345678", district: "Dhaka", city: "X", address: "X" },
      items: [item(product.id, variant.id, 2, variant.offerPriceMinor)],
      deliveryMethod: "standard",
      paymentMethod: "cod",
      idempotencyKey: "cancel-test",
    });
    expect(res.ok).toBe(true);

    const cancelled = cancelOrder(repos, res.order!.id, "Test cancel");
    expect(cancelled.ok).toBe(true);
    expect(cancelled.order!.status).toBe("cancelled");

    const after = repos.products.getById("prod-nakshi-bedcover")!.variants.find((v) => v.id === variant.id)!.stock;
    expect(after).toBe(before);
  });

  it("marks COD payment collected", () => {
    localStorage.clear();
    const repos: Repos = buildMemoryRepos();
    const product = repos.products.getById("prod-face-wash")!;
    const variant = product.variants[0];
    const res = placeOrder(repos, {
      customer: { fullName: "T", phone: "01712345678", district: "Dhaka", city: "X", address: "X" },
      items: [item(product.id, variant.id, 1, variant.offerPriceMinor)],
      deliveryMethod: "standard",
      paymentMethod: "cod",
      idempotencyKey: "collect-test",
    });
    const collected = markPaymentCollected(repos, res.order!.id, "COD-1");
    expect(collected.ok).toBe(true);
    expect(collected.order!.paymentStatus).toBe("collected");
  });
});
