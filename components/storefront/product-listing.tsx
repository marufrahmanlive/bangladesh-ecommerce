"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Product, Review } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import {
  filterAndSort,
  type ProductFilters,
  type SortOption,
} from "@/services/catalog";
import { ratingSummary } from "@/services/review";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

interface ProductListingProps {
  baseProducts: Product[];
  reviews: Review[];
  initialQuery?: string;
  categoryLabel?: string;
}

export function ProductListing({
  baseProducts,
  reviews,
  initialQuery,
  categoryLabel,
}: ProductListingProps) {
  const { t } = useI18n();
  const { brands } = useCatalog();
  const [sort, setSort] = useState<SortOption>("popularity");
  const [filters, setFilters] = useState<ProductFilters>({});
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const ratings = useMemo(() => {
    const map = new Map<string, { average: number; count: number }>();
    for (const p of baseProducts) map.set(p.id, ratingSummary(reviews, p.id));
    return map;
  }, [reviews, baseProducts]);

  const available = useMemo(() => {
    const colors = new Set<string>();
    const sizes = new Set<string>();
    const brandIds = new Set<string>();
    for (const p of baseProducts) {
      if (p.brandId) brandIds.add(p.brandId);
      for (const v of p.variants) {
        if (v.color) colors.add(v.color);
        if (v.size) sizes.add(v.size);
      }
    }
    return {
      colors: Array.from(colors).sort(),
      sizes: Array.from(sizes).sort(),
      brandIds: Array.from(brandIds),
    };
  }, [baseProducts]);

  const appliedFilters = useMemo<ProductFilters>(() => {
    const f: ProductFilters = { ...filters };
    if (priceMin) f.priceMinMinor = Math.round(parseFloat(priceMin) * 100);
    if (priceMax) f.priceMaxMinor = Math.round(parseFloat(priceMax) * 100);
    return f;
  }, [filters, priceMin, priceMax]);

  const filtered = useMemo(
    () => filterAndSort(baseProducts, appliedFilters, sort, ratings),
    [baseProducts, appliedFilters, sort, ratings],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasActiveFilters =
    Object.values(filters).some((v) => {
      if (v === undefined || v === false) return false;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    }) ||
    priceMin !== "" ||
    priceMax !== "";

  const clearAll = () => {
    setFilters({});
    setPriceMin("");
    setPriceMax("");
    setPage(1);
  };

  const toggleArray = (key: "colors" | "sizes" | "brands", value: string) => {
    setFilters((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
    setPage(1);
  };

  const filterPanel = (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-sm font-semibold">{t("common.price")}</h4>
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={priceMin}
            onChange={(e) => {
              setPriceMin(e.target.value);
              setPage(1);
            }}
          />
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={priceMax}
            onChange={(e) => {
              setPriceMax(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">Rating</h4>
        <Select
          className="w-full"
          value={filters.minRating?.toString() ?? ""}
          onChange={(e) => {
            setFilters((p) => ({
              ...p,
              minRating: e.target.value ? Number(e.target.value) : undefined,
            }));
            setPage(1);
          }}
        >
          <option value="">Any rating</option>
          <option value="4">4+ ★</option>
          <option value="3">3+ ★</option>
          <option value="2">2+ ★</option>
        </Select>
      </div>

      {available.brandIds.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">Brand</h4>
          <div className="space-y-1">
            {available.brandIds.map((id) => {
              const brand = brands.find((b) => b.id === id);
              return (
                <label key={id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.brands?.includes(id) ?? false}
                    onChange={() => toggleArray("brands", id)}
                  />
                  {brand?.name ?? id}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {available.colors.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">{t("product.color")}</h4>
          <div className="flex flex-wrap gap-2">
            {available.colors.map((c) => (
              <Badge
                key={c}
                variant={filters.colors?.includes(c) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArray("colors", c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {available.sizes.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">{t("product.size")}</h4>
          <div className="flex flex-wrap gap-2">
            {available.sizes.map((s) => (
              <Badge
                key={s}
                variant={filters.sizes?.includes(s) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArray("sizes", s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.inStockOnly ?? false}
          onChange={(e) => {
            setFilters((p) => ({ ...p, inStockOnly: e.target.checked }));
            setPage(1);
          }}
        />
        {t("common.inStock")}
      </label>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearAll}>
          {t("common.clear")}
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {categoryLabel && <h1 className="mb-4 text-2xl font-bold">{categoryLabel}</h1>}
      {initialQuery && (
        <p className="mb-4 text-sm text-muted-foreground">
          {t("common.search")}: “{initialQuery}”
        </p>
      )}

      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {filtered.length} {t("cart.items").toLowerCase()}
        </span>
        <Select
          className="w-44"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortOption);
            setPage(1);
          }}
        >
          <option value="popularity">Popularity</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Rating</option>
        </Select>
      </div>

      <div className="flex gap-6">
        <aside className={cn("hidden w-56 shrink-0 lg:block")}>{filterPanel}</aside>
        {showFilters && (
          <div className="mb-4 w-full rounded-lg border p-4 lg:hidden">{filterPanel}</div>
        )}

        <div className="flex-1">
          {pageItems.length === 0 ? (
            <EmptyState
              title={t("common.noResults")}
              action={
                <Button variant="outline" onClick={clearAll}>
                  {t("common.clear")}
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {pageItems.map((p) => (
                  <ProductCard key={p.id} product={p} reviews={reviews} />
                ))}
              </div>

              {pageCount > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    ←
                  </Button>
                  <span className="text-sm">
                    {currentPage} / {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


