import type { Metadata } from "next";
import { OrdersAdmin } from "@/components/admin/orders-admin";

export const metadata: Metadata = { title: "Orders" };

export default function Page() {
  return <OrdersAdmin />;
}
