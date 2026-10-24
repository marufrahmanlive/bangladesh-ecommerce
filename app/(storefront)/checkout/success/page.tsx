import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccessPage } from "@/components/storefront/checkout-success-page";

export const metadata: Metadata = { title: "Order Confirmation" };

export default function Page() {
  return (
    <Suspense>
      <CheckoutSuccessPage />
    </Suspense>
  );
}


