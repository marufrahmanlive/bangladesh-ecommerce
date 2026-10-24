import type { Metadata } from "next";

export const metadata: Metadata = { title: "Delivery Policy" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Delivery Policy</h1>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
        <li>Estimated delivery time is 2-5 working days inside Dhaka and 3-7 days outside Dhaka.</li>
        <li>Delivery charges are calculated by zone and shown at checkout.</li>
        <li>Free delivery is available on qualifying orders as shown at checkout.</li>
      </ul>
    </article>
  );
}
