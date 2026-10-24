import type { Metadata } from "next";
import { OrderDetail } from "@/components/admin/order-detail";

export const instant = false;

export const metadata: Metadata = { title: "Order Details" };

export default async function Page(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  return <OrderDetail orderId={id} />;
}
