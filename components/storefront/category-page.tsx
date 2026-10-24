"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import {
  getBreadcrumbs,
  getCategoryAndDescendantIds,
} from "@/services/catalog";
import { t } from "@/lib/slug";
import { ProductListing } from "./product-listing";

export function CategoryPage({ slug }: { slug: string }) {
  const { locale } = useI18n();
  const { products, categories, reviews, ready } = useCatalog();
  const category = categories.find((c) => c.slug === slug);

  const categoryIds = useMemo(
    () => (category ? getCategoryAndDescendantIds(categories, category.id) : []),
    [categories, category],
  );
  const items = products.filter(
    (p) =>
      p.isPublished &&
      !p.isArchived &&
      categoryIds.includes(p.categoryId),
  );
  const crumbs = category ? getBreadcrumbs(categories, category.id) : [];

  if (!ready) return <ProductListing baseProducts={[]} reviews={[]} />;
  if (!category)
    return <div className="p-10 text-center text-muted-foreground">Category not found</div>;

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
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
      </div>
      <ProductListing
        baseProducts={items}
        reviews={reviews}
        categoryLabel={t(locale, category.name)}
      />
    </div>
  );
}
