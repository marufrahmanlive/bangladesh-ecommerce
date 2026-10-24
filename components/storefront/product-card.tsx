"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import type { Product, Review } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCartStore, toCartItem } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney, formatNumber } from "@/lib/format";
import { discountPercent } from "@/lib/money";
import { t } from "@/lib/slug";
import {
  productHasDiscount,
  productPriceRange,
  productTotalStock,
} from "@/services/catalog";
import { ratingSummary } from "@/services/review";
import { ProductImage } from "./product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

function firstAvailableVariant(product: Product) {
  return product.variants.find((v) => v.stock > 0) ?? product.variants[0];
}

export function ProductCard({
  product,
  reviews,
}: {
  product: Product;
  reviews?: Review[];
}) {
  const { locale, t: tr } = useI18n();
  const add = useCartStore((s) => s.add);
  const wishlist = useWishlistStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addToast = useUiStore((s) => s.addToast);
  const [quickView, setQuickView] = useState(false);

  const range = productPriceRange(product);
  const stock = productTotalStock(product);
  const hasDiscount = productHasDiscount(product);
  const outOfStock = stock <= 0;
  const lowStock =
    stock > 0 && product.variants.some((v) => v.stock > 0 && v.stock <= v.lowStockThreshold);
  const inWishlist = wishlist.some((w) => w.productId === product.id);
  const summary = reviews
    ? ratingSummary(reviews, product.id)
    : { average: 0, count: 0 };

  const handleAdd = () => {
    const variant = firstAvailableVariant(product);
    if (!variant || variant.stock <= 0) {
      addToast(tr("common.outOfStock"), "error");
      return;
    }
    add(toCartItem(product, variant, 1));
    addToast(tr("toast.addedToCart"), "success");
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border bg-card">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square"
        aria-label={t(locale, product.name)}
      >
        <ProductImage
          src={product.images[0]}
          alt={t(locale, product.name)}
          className="h-full w-full"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isFeatured && <Badge variant="secondary">{tr("common.featured")}</Badge>}
          {product.isNew && <Badge variant="success">{tr("common.newArrivals")}</Badge>}
          {hasDiscount && (
            <Badge variant="destructive">
              -{discountPercent(range.minRegular, range.minOffer)}%
            </Badge>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Badge variant="outline">{tr("common.outOfStock")}</Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 min-h-[2.5rem] text-sm font-medium hover:text-primary"
        >
          {t(locale, product.name)}
        </Link>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span>{summary.count > 0 ? formatNumber(summary.average, locale) : "—"}</span>
          <span>({summary.count})</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-primary">
            {formatMoney(range.minOffer, locale)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatMoney(range.minRegular, locale)}
            </span>
          )}
        </div>

        <div className="text-xs">
          {outOfStock ? (
            <span className="text-destructive">{tr("common.outOfStock")}</span>
          ) : lowStock ? (
            <span className="text-warning">{tr("common.lowStock")}</span>
          ) : (
            <span className="text-success">{tr("common.inStock")}</span>
          )}
        </div>

        <div className="mt-auto flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={handleAdd}
            disabled={outOfStock}
          >
            <ShoppingCart className="h-4 w-4" />
            {tr("common.addToCart")}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => toggleWishlist(product.id)}
            aria-label={tr("nav.wishlist")}
          >
            <Heart
              className={
                inWishlist
                  ? "h-4 w-4 fill-destructive text-destructive"
                  : "h-4 w-4"
              }
            />
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="w-full"
          onClick={() => setQuickView(true)}
        >
          {tr("common.viewDetails")}
        </Button>
      </div>

      <Dialog
        open={quickView}
        onClose={() => setQuickView(false)}
        title={t(locale, product.name)}
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative aspect-square w-full sm:w-48">
            <ProductImage
              src={product.images[0]}
              alt={t(locale, product.name)}
              className="h-full w-full"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {t(locale, product.shortDescription)}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">
                {formatMoney(range.minOffer, locale)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatMoney(range.minRegular, locale)}
                </span>
              )}
            </div>
            <div className="mt-auto flex gap-2">
              <Button onClick={handleAdd} disabled={outOfStock} className="flex-1">
                <ShoppingCart className="h-4 w-4" />
                {tr("common.addToCart")}
              </Button>
              <Link href={`/products/${product.slug}`}>
                <Button variant="outline">{tr("common.viewDetails")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

