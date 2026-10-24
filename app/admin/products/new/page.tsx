import type { Metadata } from "next";
import { ProductsAdmin } from "@/components/admin/products-admin";

export const metadata: Metadata = { title: "New Product" };

export default function Page() {
  return <ProductsAdmin autoOpenNew />;
}
