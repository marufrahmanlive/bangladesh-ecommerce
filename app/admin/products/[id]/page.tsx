import type { Metadata } from "next";
import { ProductDetailAdmin } from "@/components/admin/product-detail";

export const instant = false;

export const metadata: Metadata = { title: "Product Details" };

export default async function Page(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  return <ProductDetailAdmin productId={id} />;
}
