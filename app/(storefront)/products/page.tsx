import type { Metadata } from "next";
import { ProductsPage } from "@/components/storefront/products-page";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse all products — kantha, clothing, cosmetics and home essentials.",
};

export default function Page() {
  return <ProductsPage />;
}
