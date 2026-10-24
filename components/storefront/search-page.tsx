"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { searchProducts } from "@/services/catalog";
import { t } from "@/lib/slug";
import { keyFor, readJson, writeJson } from "@/lib/storage";
import { ProductListing } from "./product-listing";
import { Input } from "@/components/ui/input";

const RECENT_KEY = keyFor("recent_searches");

export function SearchPage() {
  const { locale, t: tr } = useI18n();
  const { repos, reviews } = useCatalog();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const [recentSearches] = useState<string[]>(() => {
    const stored = readJson<unknown>(RECENT_KEY);
    return Array.isArray(stored) ? stored.filter((s) => typeof s === "string") : [];
  });

  useEffect(() => {
    if (initial.trim()) {
      const next = [initial, ...recentSearches.filter((s) => s !== initial)].slice(0, 8);
      writeJson(RECENT_KEY, next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  const results = useMemo(() => {
    if (!repos || !debounced.trim()) return [];
    return searchProducts(repos, debounced);
  }, [repos, debounced]);

  const suggestions = useMemo(() => {
    if (!repos || !debounced.trim()) return [];
    return searchProducts(repos, debounced).slice(0, 5);
  }, [repos, debounced]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9 pr-9"
          placeholder={tr("common.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onClick={() => {
              setQuery("");
              setDebounced("");
            }}
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {!query && recentSearches.length > 0 && (
        <div className="mt-4 max-w-xl">
          <p className="text-sm font-medium">Recent searches</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  setDebounced(s);
                }}
                className="rounded-full border px-3 py-1 text-sm hover:bg-accent"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-2 max-w-xl rounded-md border bg-background p-2 shadow">
          {suggestions.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="block rounded px-3 py-2 text-sm hover:bg-accent"
            >
              {t(locale, p.name)}
            </Link>
          ))}
        </div>
      )}

      {debounced.trim() ? (
        <div className="mt-6">
          <ProductListing
            baseProducts={results}
            reviews={reviews}
            initialQuery={debounced}
          />
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          {tr("common.searchPlaceholder")}
        </p>
      )}
    </div>
  );
}
