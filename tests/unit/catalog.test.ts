import { describe, expect, it } from "vitest";
import { buildMemoryRepos } from "@/repositories";
import {
  searchProducts,
  filterAndSort,
  getBreadcrumbs,
  getCategoryAndDescendantIds,
  productPriceRange,
} from "@/services/catalog";

const repos = buildMemoryRepos();

describe("catalog search", () => {
  it("searches by English name, Bengali name and SKU", () => {
    expect(searchProducts(repos, "kantha").length).toBeGreaterThan(0);
    expect(searchProducts(repos, "নকশি").length).toBeGreaterThan(0);
    expect(searchProducts(repos, "NK-1001").some((p) => p.sku === "NK-1001")).toBe(true);
  });
});

describe("catalog filters and sorting", () => {
  it("filters by in-stock only and sorts by price ascending", () => {
    const published = repos.products.getAll().filter((p) => p.isPublished);
    const inStock = filterAndSort(published, { inStockOnly: true }, "price_asc");
    expect(inStock.every((p) => p.variants.reduce((a, v) => a + v.stock, 0) > 0)).toBe(true);
    for (let i = 1; i < inStock.length; i += 1) {
      expect(productPriceRange(inStock[i - 1]).minOffer).toBeLessThanOrEqual(
        productPriceRange(inStock[i]).minOffer,
      );
    }
  });

  it("filters by category including descendants", () => {
    const categories = repos.categories.getAll();
    const ids = getCategoryAndDescendantIds(categories, "cat-kantha");
    expect(ids).toContain("cat-kantha");
    expect(ids).toContain("cat-nakshi");
    const items = repos.products.getAll().filter((p) => ids.includes(p.categoryId));
    expect(items.length).toBeGreaterThan(0);
  });
});

describe("category breadcrumbs", () => {
  it("builds breadcrumb path", () => {
    const categories = repos.categories.getAll();
    const crumbs = getBreadcrumbs(categories, "cat-saree");
    expect(crumbs.map((c) => c.slug)).toEqual(["clothing", "women-s-clothing", "saree"]);
  });
});
