import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPage } from "@/components/storefront/search-page";

export const metadata: Metadata = {
  title: "Search",
  description: "Search products by name, SKU, brand or category.",
};

export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}


