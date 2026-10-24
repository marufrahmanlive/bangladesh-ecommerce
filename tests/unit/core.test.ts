import { describe, expect, it } from "vitest";
import {
  toMinor,
  toTaka,
  discountPercent,
  discountAmount,
} from "@/lib/money";
import { slugify, localizedSlug, uniqueSlug, textMatches } from "@/lib/slug";
import { cartTotals, cartCount, mergeKey } from "@/services/cart";
import { readValidated, keyFor, writeRaw } from "@/lib/storage";
import { z } from "zod";

describe("money", () => {
  it("converts taka to integer poisha", () => {
    expect(toMinor(12.5)).toBe(1250);
    expect(toTaka(1250)).toBe(12.5);
  });

  it("computes discount percent", () => {
    expect(discountPercent(1000, 800)).toBe(20);
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountAmount(1000, 800)).toBe(200);
  });
});

describe("slug", () => {
  it("slugifies and generates unique slugs", () => {
    expect(slugify("Women's Clothing")).toBe("women-s-clothing");
    expect(slugify("Nakshi Kantha")).toBe("nakshi-kantha");
    expect(localizedSlug({ en: "Soft Silk Saree", bn: "সফট সিল্ক শাড়ি" })).toBe("soft-silk-saree");
    const used = new Set(["shirt"]);
    expect(uniqueSlug("shirt", (s) => used.has(s))).toBe("shirt-2");
  });

  it("matches Bengali and English text case-insensitively", () => {
    expect(textMatches("Nakshi Kantha", "nakshi")).toBe(true);
    expect(textMatches("নকশি কাঁথা", "নকশি")).toBe(true);
  });
});

describe("cart", () => {
  it("computes cart totals and count", () => {
    const items = [
      {
        id: mergeKey("p1", "v1"),
        productId: "p1",
        variantId: "v1",
        name: { en: "A", bn: "এ" },
        slug: "a",
        sku: "S1",
        regularPriceMinor: 1000,
        priceMinor: 800,
        quantity: 2,
        stockAvailable: 10,
        addedAt: "",
      },
    ];
    expect(cartCount(items)).toBe(2);
    const totals = cartTotals(items, { shippingMinor: 60 });
    expect(totals.subtotalMinor).toBe(1600);
    expect(totals.itemDiscountMinor).toBe(400);
    expect(totals.totalMinor).toBe(1660);
  });
});

describe("storage", () => {
  it("returns null for invalid JSON and missing keys", () => {
    expect(readValidated(keyFor("nonexistent"), z.array(z.unknown()))).toBeNull();
    writeRaw(keyFor("bad"), "{not json");
    expect(readValidated(keyFor("bad"), z.array(z.unknown()))).toBeNull();
  });
});
