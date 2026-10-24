import type { Metadata } from "next";
import { buildMemoryRepos } from "@/repositories";
import { getPublishedProducts } from "@/services/catalog";
import { ProductDetailPage } from "@/components/storefront/product-detail";

export function generateStaticParams() {
  const repos = buildMemoryRepos();
  return getPublishedProducts(repos).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const repos = buildMemoryRepos();
  const product = getPublishedProducts(repos).find((p) => p.slug === slug);
  return {
    title: product?.name.en,
    description: product?.shortDescription.en,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: product?.name.en,
      description: product?.shortDescription.en,
      type: "website",
      images: product?.images[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function Page(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  return <ProductDetailPage key={slug} slug={slug} />;
}
