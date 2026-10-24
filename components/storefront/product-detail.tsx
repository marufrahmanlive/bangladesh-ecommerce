"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, Share2, ShoppingCart, Star, Truck } from "lucide-react";
import type { Product, Review } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useCartStore, toCartItem } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";
import { useRecentStore } from "@/features/recent/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney, formatNumber, formatDate } from "@/lib/format";
import { discountPercent } from "@/lib/money";
import { t } from "@/lib/slug";
import { nowIso, uid } from "@/lib/utils";
import { getBreadcrumbs, productHasDiscount } from "@/services/catalog";
import { ratingSummary, sortReviews } from "@/services/review";
import { ProductImage } from "./product-image";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

function uniqueColors(p: Product): string[] {
  return Array.from(new Set(p.variants.map((v) => v.color).filter(Boolean) as string[]));
}
function uniqueSizes(p: Product): string[] {
  return Array.from(new Set(p.variants.map((v) => v.size).filter(Boolean) as string[]));
}
function findVariant(p: Product, color: string | null, size: string | null) {
  return p.variants.find((v) => {
    const colorOk = color ? v.color === color : true;
    const sizeOk = size ? v.size === size : true;
    return colorOk && sizeOk;
  });
}

export function ProductDetailPage({ slug }: { slug: string }) {
  const { locale, t: tr } = useI18n();
  const router = useRouter();
  const { products, categories, reviews, repos, ready, refresh } = useCatalog();
  const add = useCartStore((s) => s.add);
  const wishlist = useWishlistStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addRecent = useRecentStore((s) => s.add);
  const recentIds = useRecentStore((s) => s.ids);
  const addToast = useUiStore((s) => s.addToast);

  const product = products.find((p) => p.slug === slug && p.isPublished && !p.isArchived);
  const colors = product ? uniqueColors(product) : [];
  const sizes = product ? uniqueSizes(product) : [];

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [reviewSort, setReviewSort] = useState<"newest" | "highest" | "helpful">("newest");
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, comment: "" });
  const [voted, setVoted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (product) addRecent(product.id);
  }, [product?.id, addRecent]);

  const selectedVariant = useMemo(() => {
    if (!product) return undefined;
    return findVariant(product, selectedColor, selectedSize) ?? product.variants[0];
  }, [product, selectedColor, selectedSize]);

  const productReviews = useMemo(
    () => reviews.filter((r) => r.productId === product?.id && !r.hidden),
    [reviews, product?.id],
  );
  const summary = useMemo(
    () =>
      product
        ? ratingSummary(reviews, product.id)
        : { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    [reviews, product],
  );

  if (!ready) return <div className="min-h-[60vh]" />;
  if (!product || !selectedVariant)
    return <div className="p-10 text-center text-muted-foreground">{tr("order.notFound")}</div>;

  const crumbs = getBreadcrumbs(categories, product.categoryId);
  const inWishlist = wishlist.some((w) => w.productId === product.id);
  const related = products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId && p.isPublished)
    .slice(0, 4);
  const recentProducts = recentIds
    .filter((id) => id !== product.id)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 4);
  const variantStock = selectedVariant.stock;
  const lowStock = variantStock > 0 && variantStock <= selectedVariant.lowStockThreshold;

  const selectColor = (c: string) => {
    setSelectedColor(c);
    if (!findVariant(product, c, selectedSize)) {
      setSelectedSize(product.variants.find((v) => v.color === c)?.size ?? null);
    }
  };
  const selectSize = (s: string) => {
    setSelectedSize(s);
    if (!findVariant(product, selectedColor, s)) {
      setSelectedColor(product.variants.find((v) => v.size === s)?.color ?? null);
    }
  };

  const handleAdd = (buyNow = false) => {
    if (!selectedVariant || selectedVariant.stock <= 0 || quantity > selectedVariant.stock) {
      addToast(tr("common.outOfStock"), "error");
      return;
    }
    add(toCartItem(product, selectedVariant, quantity));
    addToast(tr("toast.addedToCart"), "success");
    if (buyNow) router.push("/checkout");
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repos || !product || !reviewForm.comment.trim()) return;
    const review: Review = {
      id: uid("rev"),
      productId: product.id,
      customerName: reviewForm.name.trim() || "Anonymous",
      rating: Math.min(5, Math.max(1, reviewForm.rating)),
      comment: reviewForm.comment.trim(),
      helpful: 0,
      notHelpful: 0,
      reported: false,
      hidden: false,
      isVerified: false,
      isSample: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repos.reviews.save(review);
    refresh();
    setReviewForm({ name: "", rating: 5, comment: "" });
    addToast(tr("toast.saved"), "success");
  };

  const vote = (reviewId: string, dir: "up" | "down") => {
    if (!repos || voted.has(reviewId)) return;
    const review = repos.reviews.getById(reviewId);
    if (!review) return;
    if (dir === "up") review.helpful += 1;
    else review.notHelpful += 1;
    review.updatedAt = nowIso();
    repos.reviews.save(review);
    refresh();
    setVoted((prev) => new Set(prev).add(reviewId));
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name.en,
            sku: product.sku,
            image: product.images[0],
            description: product.shortDescription.en,
            offers: {
              "@type": "Offer",
              priceCurrency: "BDT",
              price: (selectedVariant.offerPriceMinor / 100).toFixed(2),
              availability:
                selectedVariant.stock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }),
        }}
      />

      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        {crumbs.map((c) => (
          <span key={c.id} className="flex items-center gap-1">
            /
            <Link href={`/categories/${c.slug}`} className="hover:text-primary">
              {t(locale, c.name)}
            </Link>
          </span>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <button
            className="group relative block aspect-square w-full overflow-hidden rounded-lg border"
            onClick={() => setLightbox(true)}
            aria-label="Enlarge image"
          >
            <ProductImage
              src={selectedVariant.image ?? product.images[activeImage]}
              alt={t(locale, product.name)}
              className="h-full w-full transition-transform duration-300 group-hover:scale-110"
              priority
            />
          </button>
          {product.images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md border ${
                    activeImage === i ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <ProductImage
                    src={img}
                    alt={`${t(locale, product.name)} ${i + 1}`}
                    className="h-full w-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold">{t(locale, product.name)}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="outline">
              {tr("common.sku")}: {selectedVariant.sku}
            </Badge>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span>{formatNumber(summary.average, locale)}</span>
              <span>({summary.count})</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatMoney(selectedVariant.offerPriceMinor, locale)}
            </span>
            {productHasDiscount(product) && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatMoney(selectedVariant.regularPriceMinor, locale)}
                </span>
                <Badge variant="destructive">
                  -
                  {discountPercent(
                    selectedVariant.regularPriceMinor,
                    selectedVariant.offerPriceMinor,
                  )}
                  %
                </Badge>
              </>
            )}
          </div>
          {productHasDiscount(product) && (
            <p className="mt-1 text-sm text-success">
              {tr("product.savings")}:{" "}
              {formatMoney(
                selectedVariant.regularPriceMinor - selectedVariant.offerPriceMinor,
                locale,
              )}
            </p>
          )}

          {colors.length > 0 && (
            <div className="mt-5">
              <Label className="mb-2 block">
                {tr("product.color")}: <span className="font-normal">{selectedColor}</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => selectColor(c)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      selectedColor === c ? "border-primary bg-accent font-medium" : ""
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-4">
              <Label className="mb-2 block">
                {tr("product.size")}: <span className="font-normal">{selectedSize}</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => selectSize(s)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      selectedSize === s ? "border-primary bg-accent font-medium" : ""
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 text-sm">
            {variantStock <= 0 ? (
              <span className="font-medium text-destructive">{tr("common.outOfStock")}</span>
            ) : lowStock ? (
              <span className="font-medium text-warning">
                {tr("product.onlyLeft", { n: variantStock })}
              </span>
            ) : (
              <span className="font-medium text-success">
                {tr("common.inStock")} ({variantStock})
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center rounded-md border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="decrease"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                aria-label="increase"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button className="flex-1" disabled={variantStock <= 0} onClick={() => handleAdd(false)}>
              <ShoppingCart className="h-4 w-4" />
              {tr("common.addToCart")}
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleWishlist(product.id)}
              aria-label={tr("nav.wishlist")}
            >
              <Heart
                className={
                  inWishlist ? "h-5 w-5 fill-destructive text-destructive" : "h-5 w-5"
                }
              />
            </Button>
          </div>

          <Button
            className="mt-3 w-full"
            variant="secondary"
            disabled={variantStock <= 0}
            onClick={() => handleAdd(true)}
          >
            <Truck className="h-4 w-4" />
            {tr("common.buyNow")}
          </Button>

          <div className="mt-6 space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              {tr("product.deliveryInfo")}
            </p>
            <p className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              {tr("product.shippingPolicy")}
            </p>
          </div>
        </div>

      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">{tr("product.description")}</h2>
        <p className="whitespace-pre-line text-muted-foreground">
          {t(locale, product.description)}
        </p>
        {product.specifications.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold">{tr("product.specifications")}</h3>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <tbody>
                  {product.specifications.map((spec, i) => (
                    <tr key={i} className={i % 2 ? "bg-muted/40" : ""}>
                      <td className="w-1/3 border-t px-4 py-2 font-medium">
                        {t(locale, spec.label)}
                      </td>
                      <td className="border-t px-4 py-2">{t(locale, spec.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">{tr("product.reviews")}</h2>
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="rounded-lg border p-4">
            <div className="text-4xl font-bold">{formatNumber(summary.average, locale)}</div>
            <div className="mt-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={
                    s <= Math.round(summary.average)
                      ? "h-4 w-4 fill-warning text-warning"
                      : "h-4 w-4 text-muted"
                  }
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {tr("product.basedOn", { count: summary.count })}
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <Select
                className="w-40"
                value={reviewSort}
                onChange={(e) =>
                  setReviewSort(e.target.value as "newest" | "highest" | "helpful")
                }
              >
                <option value="newest">Newest</option>
                <option value="highest">Highest rated</option>
                <option value="helpful">Most helpful</option>
              </Select>
            </div>

            {productReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tr("common.noResults")}</p>
            ) : (
              <div className="space-y-4">
                {sortReviews(productReviews, reviewSort).map((r) => (
                  <div key={r.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.customerName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(r.createdAt, locale)}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={
                            s <= r.rating
                              ? "h-3.5 w-3.5 fill-warning text-warning"
                              : "h-3.5 w-3.5 text-muted"
                          }
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-sm">{r.comment}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <button
                        className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                        onClick={() => vote(r.id, "up")}
                        disabled={voted.has(r.id)}
                      >
                        Helpful ({r.helpful})
                      </button>
                      <button
                        className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                        onClick={() => vote(r.id, "down")}
                        disabled={voted.has(r.id)}
                      >
                        Not helpful ({r.notHelpful})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={submitReview} className="mt-6 space-y-3 rounded-lg border p-4">
              <h3 className="font-semibold">{tr("product.writeReview")}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="rev-name" className="mb-1 block">Name</Label>
                  <Input
                    id="rev-name"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="rev-rating" className="mb-1 block">Rating</Label>
                  <Select
                    id="rev-rating"
                    value={reviewForm.rating}
                    onChange={(e) =>
                      setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))
                    }
                  >
                    {[5, 4, 3, 2, 1].map((s) => (
                      <option key={s} value={s}>{s} ★</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="rev-comment" className="mb-1 block">Review</Label>
                <Textarea
                  id="rev-comment"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                />
              </div>
              <Button type="submit">{tr("common.save")}</Button>
            </form>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{tr("product.share")}:</span>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          WhatsApp
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Facebook
        </a>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">{tr("product.relatedProducts")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} reviews={reviews} />
            ))}
          </div>
        </section>
      )}

      {recentProducts.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">{tr("home.recentlyViewed")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} reviews={reviews} />
            ))}
          </div>
        </section>
      )}

      <Dialog open={lightbox} onClose={() => setLightbox(false)} maxWidth="max-w-3xl">
        <div className="relative aspect-square w-full">
          <ProductImage
            src={selectedVariant.image ?? product.images[activeImage]}
            alt={t(locale, product.name)}
            className="h-full w-full"
          />
        </div>
      </Dialog>


    </div>
  );
}

