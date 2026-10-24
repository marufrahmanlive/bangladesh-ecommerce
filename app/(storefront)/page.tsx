import type { Metadata } from "next";
import { HomePage } from "@/components/storefront/home-page";

export const metadata: Metadata = {
  title: "BanglaBazar — Authentic Bangladeshi Products",
  description:
    "Shop handmade kantha, clothing, cosmetics and everyday essentials. Bilingual English & Bengali storefront.",
};

export default function Page() {
  return <HomePage />;
}
