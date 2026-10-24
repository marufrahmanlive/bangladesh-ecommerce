import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">About BanglaBazar</h1>
      <p className="mt-4 text-muted-foreground">
        BanglaBazar is a demonstration bilingual ecommerce storefront showcasing
        authentic Bangladeshi products — handmade kantha, clothing, cosmetics and
        everyday home essentials. This prototype runs entirely in your browser and
        is intended to demonstrate the full shopping and administration workflow.
      </p>
    </article>
  );
}
