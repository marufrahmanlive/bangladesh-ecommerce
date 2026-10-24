"use client";

import { Heart } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useWishlistStore } from "@/features/wishlist/store";
import { ProductCard } from "./product-card";
import { EmptyState } from "@/components/ui/empty-state";

export function WishlistPage() {
  const { t } = useI18n();
  const { products, reviews } = useCatalog();
  const ids = useWishlistStore((s) => s.items.map((i) => i.productId));
  const items = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("wishlist.title")}</h1>
      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t("common.emptyWishlist")}
          description={t("wishlist.emptyMessage")}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} reviews={reviews} />
          ))}
        </div>
      )}
    </div>
  );
}
