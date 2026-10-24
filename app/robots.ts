import type { MetadataRoute } from "next";

const BASE_URL = "https://banglajbazar.example.test";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/checkout", "/account", "/cart", "/wishlist"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
