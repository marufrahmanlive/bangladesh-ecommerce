import type { Metadata } from "next";
import { buildMemoryRepos } from "@/repositories";
import { CategoryPage } from "@/components/storefront/category-page";

export function generateStaticParams() {
  const repos = buildMemoryRepos();
  return repos.categories.getAll().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  props: PageProps<"/categories/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const repos = buildMemoryRepos();
  const category = repos.categories.getAll().find((c) => c.slug === slug);
  return {
    title: category?.name.en ?? "Category",
    description: `Browse ${category?.name.en ?? "products"} at BanglaBazar.`,
    alternates: { canonical: `/categories/${slug}` },
  };
}

export default async function Page(props: PageProps<"/categories/[slug]">) {
  const { slug } = await props.params;
  return <CategoryPage slug={slug} />;
}
