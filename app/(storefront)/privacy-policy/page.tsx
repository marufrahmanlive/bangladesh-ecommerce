import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">
        This demo stores all data locally in your browser and does not transmit
        personal information to any server. No payment credentials or sensitive
        information are collected or stored.
      </p>
    </article>
  );
}
