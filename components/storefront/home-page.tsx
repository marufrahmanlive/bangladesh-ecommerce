"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useRecentStore } from "@/features/recent/store";
import { useUiStore } from "@/features/ui/store";
import { t } from "@/lib/slug";
import { getChildren, productHasDiscount } from "@/services/catalog";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function SectionHeading({
  title,
  href,
  viewAll,
}: {
  title: string;
  href?: string;
  viewAll: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {viewAll}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function HomePage() {
  const { locale, t: tr } = useI18n();
  const { products, categories, reviews, ready } = useCatalog();
  const recentIds = useRecentStore((s) => s.ids);
  const addToast = useUiStore((s) => s.addToast);
  const [email, setEmail] = useState("");

  const published = products.filter((p) => p.isPublished && !p.isArchived);
  const featured = published.filter((p) => p.isFeatured).slice(0, 8);
  const bestSellers = published.filter((p) => p.isBestSeller).slice(0, 8);
  const newArrivals = published.filter((p) => p.isNew).slice(0, 8);
  const deals = published.filter((p) => productHasDiscount(p)).slice(0, 8);
  const recentlyViewed = recentIds
    .map((id) => published.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 4);
  const topCategories = getChildren(categories, null);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast(tr("home.subscribeSuccess"), "success");
      setEmail("");
    } else {
      addToast(tr("home.subscribeInvalid"), "error");
    }
  };

  return (
    <div>
      <section className="bg-gradient-to-r from-primary to-teal-400 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
            {tr("home.heroTitle")}
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg">
            {tr("home.heroSubtitle")}
          </p>
          <Link href="/products">
            <Button size="lg" className="mt-6 bg-white text-primary hover:bg-white/90">
              {tr("home.heroCta")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10">
        {!ready ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <section>
              <SectionHeading title={tr("home.featuredCategories")} viewAll={tr("common.viewAll")} />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {topCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="flex items-center justify-center rounded-lg border bg-card p-6 text-center font-medium shadow-sm hover:border-primary hover:text-primary"
                  >
                    {t(locale, cat.name)}
                  </Link>
                ))}
              </div>
            </section>

            {featured.length > 0 && (
              <section>
                <SectionHeading
                  title={tr("home.featuredProducts")}
                  href="/products?featured=1"
                  viewAll={tr("common.viewAll")}
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {featured.map((p) => (
                    <ProductCard key={p.id} product={p} reviews={reviews} />
                  ))}
                </div>
              </section>
            )}

            {deals.length > 0 && (
              <section>
                <SectionHeading
                  title={tr("home.deals")}
                  href="/products?sale=1"
                  viewAll={tr("common.viewAll")}
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {deals.map((p) => (
                    <ProductCard key={p.id} product={p} reviews={reviews} />
                  ))}
                </div>
              </section>
            )}

            {bestSellers.length > 0 && (
              <section>
                <SectionHeading
                  title={tr("home.bestSellers")}
                  href="/products?best=1"
                  viewAll={tr("common.viewAll")}
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {bestSellers.map((p) => (
                    <ProductCard key={p.id} product={p} reviews={reviews} />
                  ))}
                </div>
              </section>
            )}

            {newArrivals.length > 0 && (
              <section>
                <SectionHeading
                  title={tr("home.newArrivals")}
                  href="/products?new=1"
                  viewAll={tr("common.viewAll")}
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {newArrivals.map((p) => (
                    <ProductCard key={p.id} product={p} reviews={reviews} />
                  ))}
                </div>
              </section>
            )}

            {recentlyViewed.length > 0 && (
              <section>
                <SectionHeading title={tr("home.recentlyViewed")} viewAll={tr("common.viewAll")} />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {recentlyViewed.map((p) => (
                    <ProductCard key={p!.id} product={p!} reviews={reviews} />
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-lg border bg-accent/40 p-8 text-center">
              <Mail className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-2 text-xl font-bold">{tr("home.newsletterTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr("home.newsletterSubtitle")}
              </p>
              <form onSubmit={subscribe} className="mx-auto mt-4 flex max-w-md gap-2">
                <Input
                  type="email"
                  placeholder={tr("home.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit">{tr("home.subscribe")}</Button>
              </form>
            </section>

          </>
        )}
      </div>
    </div>
  );
}
