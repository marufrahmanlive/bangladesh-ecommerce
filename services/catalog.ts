import type { Category, MoneyMinor, Product } from "@/types";
import type { Repos } from "@/repositories";
import { normalizeText, textMatches } from "@/lib/slug";
import { discountAmount } from "@/lib/money";

export type SortOption =
  | "popularity"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating";

export interface ProductFilters {
  categoryIds?: string[];
  priceMinMinor?: MoneyMinor;
  priceMaxMinor?: MoneyMinor;
  colors?: string[];
  sizes?: string[];
  brands?: string[];
  inStockOnly?: boolean;
  minRating?: number;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  onSale?: boolean;
}

export interface ProductPriceRange {
  minOffer: MoneyMinor;
  maxOffer: MoneyMinor;
  minRegular: MoneyMinor;
  maxRegular: MoneyMinor;
}

export function productPriceRange(product: Product): ProductPriceRange {
  const offers = product.variants.map((v) => v.offerPriceMinor);
  const regulars = product.variants.map((v) => v.regularPriceMinor);
  return {
    minOffer: Math.min(...offers),
    maxOffer: Math.max(...offers),
    minRegular: Math.min(...regulars),
    maxRegular: Math.max(...regulars),
  };
}

export function productHasDiscount(product: Product): boolean {
  return product.variants.some((v) => v.offerPriceMinor < v.regularPriceMinor);
}

export function productTotalStock(product: Product): number {
  return product.variants.reduce((acc, v) => acc + v.stock, 0);
}

export function getPublishedProducts(repos: Repos): Product[] {
  return repos.products.getAll().filter((p) => p.isPublished && !p.isArchived);
}

export function getProductBySlug(
  repos: Repos,
  slug: string,
): Product | undefined {
  return repos.products
    .getAll()
    .find((p) => p.slug === slug && p.isPublished && !p.isArchived);
}

export function getProductById(repos: Repos, id: string): Product | undefined {
  return repos.products.getById(id);
}

/** Children (and descendants) of a category, including the category itself. */
export function getCategoryAndDescendantIds(
  categories: Category[],
  categoryId: string,
): string[] {
  const result = new Set<string>([categoryId]);
  let added = true;
  while (added) {
    added = false;
    for (const c of categories) {
      if (c.parentId && result.has(c.parentId) && !result.has(c.id)) {
        result.add(c.id);
        added = true;
      }
    }
  }
  return Array.from(result);
}

export function getChildren(
  categories: Category[],
  parentId: string | null,
): Category[] {
  return categories
    .filter((c) => c.parentId === parentId && c.isActive)
    .sort((a, b) => a.order - b.order);
}

export function getBreadcrumbs(
  categories: Category[],
  categoryId: string,
): Category[] {
  const crumbs: Category[] = [];
  let current = categories.find((c) => c.id === categoryId);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    crumbs.unshift(current);
    current = current.parentId
      ? categories.find((c) => c.id === current!.parentId)
      : undefined;
  }
  return crumbs;
}

export function searchProducts(repos: Repos, query: string): Product[] {
  const q = normalizeText(query);
  if (!q) return [];
  const brands = repos.brands.getAll();
  const categories = repos.categories.getAll();
  return getPublishedProducts(repos).filter((p) => {
    const brand = brands.find((b) => b.id === p.brandId);
    const category = categories.find((c) => c.id === p.categoryId);
    const haystacks = [
      p.name.en,
      p.name.bn,
      p.sku,
      p.slug,
      brand?.name ?? "",
      category?.name.en ?? "",
      category?.name.bn ?? "",
      ...p.variants.map((v) => v.sku),
    ];
    return haystacks.some((h) => textMatches(h, q));
  });
}

export function filterAndSort(
  products: Product[],
  filters: ProductFilters,
  sort: SortOption,
  ratings?: Map<string, { average: number; count: number }>,
): Product[] {
  const filtered = products.filter((p) => {
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      if (!filters.categoryIds.includes(p.categoryId)) return false;
    }
    const range = productPriceRange(p);
    if (filters.priceMinMinor !== undefined && range.minOffer < filters.priceMinMinor)
      return false;
    if (filters.priceMaxMinor !== undefined && range.minOffer > filters.priceMaxMinor)
      return false;
    if (filters.colors && filters.colors.length > 0) {
      const colors = new Set(p.variants.map((v) => v.color).filter(Boolean) as string[]);
      if (!filters.colors.some((c) => colors.has(c))) return false;
    }
    if (filters.sizes && filters.sizes.length > 0) {
      const sizes = new Set(p.variants.map((v) => v.size).filter(Boolean) as string[]);
      if (!filters.sizes.some((s) => sizes.has(s))) return false;
    }
    if (filters.brands && filters.brands.length > 0) {
      if (!p.brandId || !filters.brands.includes(p.brandId)) return false;
    }
    if (filters.inStockOnly && productTotalStock(p) <= 0) return false;
    if (filters.minRating !== undefined && ratings) {
      const r = ratings.get(p.id);
      if (!r || r.average < filters.minRating) return false;
    }
    if (filters.featured && !p.isFeatured) return false;
    if (filters.bestSeller && !p.isBestSeller) return false;
    if (filters.newArrival && !p.isNew) return false;
    if (filters.onSale && !productHasDiscount(p)) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return productPriceRange(a).minOffer - productPriceRange(b).minOffer;
      case "price_desc":
        return productPriceRange(b).minOffer - productPriceRange(a).minOffer;
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "rating":
        return (
          (ratings?.get(b.id)?.average ?? 0) - (ratings?.get(a.id)?.average ?? 0)
        );
      case "popularity":
      default:
        return (
          Number(b.isBestSeller) - Number(a.isBestSeller) ||
          productTotalStock(b) - productTotalStock(a)
        );
    }
  });
}

export function relatedProducts(
  repos: Repos,
  product: Product,
  limit = 4,
): Product[] {
  return getPublishedProducts(repos)
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .slice(0, limit);
}

export function getSavingsMinor(product: Product): MoneyMinor {
  return product.variants.reduce(
    (acc, v) => acc + discountAmount(v.regularPriceMinor, v.offerPriceMinor),
    0,
  );
}

