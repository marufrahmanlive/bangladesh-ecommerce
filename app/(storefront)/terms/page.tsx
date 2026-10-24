import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Terms &amp; Conditions</h1>
      <p className="mt-4 text-muted-foreground">
        This is a demonstration storefront. Orders placed here are sample records
        and do not represent real commercial transactions or real payments.
      </p>
    </article>
  );
}
