import type { MetadataRoute } from "next";
import { buildMemoryRepos } from "@/repositories";

const BASE_URL = "https://banglajbazar.example.test";

export default function sitemap(): MetadataRoute.Sitemap {
  const repos = buildMemoryRepos();
  const products = repos.products
    .getAll()
    .filter((p) => p.isPublished && !p.isArchived);
  const categories = repos.categories.getAll();

  const staticPages = [
    "",
    "products",
    "about",
    "contact",
    "shipping-policy",
    "return-policy",
    "privacy-policy",
    "terms",
  ];

  return [
    ...staticPages.map((path) => ({
      url: `${BASE_URL}/${path}`,
      lastModified: new Date(),
    })),
    ...products.map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt),
    })),
    ...categories.map((c) => ({
      url: `${BASE_URL}/categories/${c.slug}`,
      lastModified: new Date(c.updatedAt),
    })),
  ];
}
