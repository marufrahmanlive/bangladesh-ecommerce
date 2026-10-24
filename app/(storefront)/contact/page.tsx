import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Us" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <div className="mt-4 space-y-2 text-muted-foreground">
        <p>Phone: +880 1700-000000</p>
        <p>Email: support@banglajbazar.example.test</p>
        <p>Address: Dhaka, Bangladesh</p>
      </div>
    </article>
  );
}
