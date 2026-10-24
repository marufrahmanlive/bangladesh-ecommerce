import type { Metadata } from "next";

export const metadata: Metadata = { title: "Return Policy" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Return Policy</h1>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
        <li>Products can be returned within 7 days of delivery if they are unused and in original condition.</li>
        <li>Refunds are processed only after the returned item is received and inspected.</li>
        <li>Cash on Delivery refunds are recorded as manually processed refunds.</li>
      </ul>
    </article>
  );
}
