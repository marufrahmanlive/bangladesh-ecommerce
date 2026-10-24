import { describe, expect, it } from "vitest";
import { buildMemoryRepos } from "@/repositories";
import type { Product } from "@/types";
import { nowIso, uid } from "@/lib/utils";
import { isValidBangladeshPhone } from "@/lib/validation";
import { evaluateCoupon } from "@/services/checkout";
import { postEntry, accountBalance } from "@/services/accounting";

describe("phone validation", () => {
  it("accepts valid Bangladesh numbers and rejects invalid ones", () => {
    expect(isValidBangladeshPhone("01712345678")).toBe(true);
    expect(isValidBangladeshPhone("+8801712345678")).toBe(true);
    expect(isValidBangladeshPhone("12345")).toBe(false);
    expect(isValidBangladeshPhone("017123456")).toBe(false);
  });
});

describe("product CRUD", () => {
  it("creates, updates and deletes a product", () => {
    const repos = buildMemoryRepos();
    const product: Product = {
      id: uid("prod"),
      name: { en: "Test", bn: "টেস্ট" },
      slug: "test-product",
      sku: "TEST-1",
      shortDescription: { en: "", bn: "" },
      description: { en: "", bn: "" },
      specifications: [],
      categoryId: "cat-clothing",
      images: [],
      variants: [
        {
          id: uid("v"),
          sku: "TEST-1",
          regularPriceMinor: 1000,
          offerPriceMinor: 900,
          costMinor: 500,
          stock: 10,
          lowStockThreshold: 5,
          isActive: true,
        },
      ],
      taxRate: 0,
      isFeatured: false,
      isBestSeller: false,
      isNew: false,
      isPublished: true,
      isArchived: false,
      isSample: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repos.products.save(product);
    expect(repos.products.getById(product.id)?.sku).toBe("TEST-1");
    product.name.en = "Updated";
    repos.products.save(product);
    expect(repos.products.getById(product.id)?.name.en).toBe("Updated");
    repos.products.remove(product.id);
    expect(repos.products.getById(product.id)).toBeUndefined();
  });
});

describe("coupon expiry", () => {
  it("rejects expired coupons", () => {
    const repos = buildMemoryRepos();
    const coupon = repos.coupons.getAll()[0];
    coupon.endDate = "2020-01-01T00:00:00.000Z";
    repos.coupons.save(coupon);
    const res = evaluateCoupon(repos, coupon.code, [], 100000);
    expect(res.ok).toBe(false);
    expect(res.error).toBe("expired");
  });
});

describe("refund accounting", () => {
  it("records a refund as a cash outflow", () => {
    localStorage.clear();
    const repos = buildMemoryRepos();
    const before = accountBalance(repos, "cash");
    postEntry(repos, {
      date: "2026-01-20",
      type: "refund",
      account: "cash",
      amountMinor: -5000,
      referenceType: "order",
      referenceId: "x",
      description: "Refund",
    });
    expect(accountBalance(repos, "cash")).toBe(before - 5000);
  });
});
