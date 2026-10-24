"use client";

import { useCatalog } from "@/features/catalog/store";
import { ProductListing } from "./product-listing";

export function ProductsPage() {
  const { products, reviews, ready } = useCatalog();
  if (!ready) return <ProductListing baseProducts={[]} reviews={[]} />;
  const published = products.filter((p) => p.isPublished && !p.isArchived);
  return <ProductListing baseProducts={published} reviews={reviews} />;
}
