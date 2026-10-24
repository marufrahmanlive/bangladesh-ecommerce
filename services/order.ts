import type { Order, OrderStatus } from "@/types";
import type { Repos } from "@/repositories";
import { nowIso } from "@/lib/utils";
import { adjustVariantStock } from "./inventory";
import { postEntry } from "./accounting";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled", "failed"],
  confirmed: ["processing", "cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "return_requested"],
  delivered: ["return_requested"],
  cancellation_requested: ["cancelled", "processing"],
  cancelled: [],
  return_requested: ["returned", "shipped"],
  returned: ["refund_pending", "refunded"],
  refund_pending: ["refunded"],
  refunded: [],
  failed: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface OrderResult {
  ok: boolean;
  error?: string;
  order?: Order;
}

export function transitionStatus(
  repos: Repos,
  orderId: string,
  to: OrderStatus,
  opts: { note?: string; by?: string } = {},
): OrderResult {
  const order = repos.orders.getById(orderId);
  if (!order) return { ok: false, error: "order-not-found" };
  if (!canTransition(order.status, to)) {
    return { ok: false, error: `invalid-transition:${order.status}:${to}` };
  }
  order.status = to;
  order.statusHistory.push({ status: to, at: nowIso(), note: opts.note, by: opts.by });
  order.updatedAt = nowIso();
  repos.orders.save(order);
  return { ok: true, order };
}

/** Cancel an order, restocking inventory where appropriate. */
export function cancelOrder(
  repos: Repos,
  orderId: string,
  reason: string,
  by = "demo",
): OrderResult {
  const order = repos.orders.getById(orderId);
  if (!order) return { ok: false, error: "order-not-found" };
  if (order.status === "cancelled" || order.status === "delivered") {
    return { ok: false, error: "order-cannot-be-cancelled" };
  }

  // Restock items that were deducted at placement.
  for (const item of order.items) {
    adjustVariantStock(repos, {
      productId: item.productId,
      variantId: item.variantId,
      type: "return_in",
      quantityChange: item.quantity,
      reason: `Order ${order.orderNumber} cancelled: ${reason}`,
      referenceType: "order",
      referenceId: order.id,
      performedBy: by,
    });
  }

  const wasPaid = order.paymentStatus === "paid" || order.paymentStatus === "collected";
  order.status = wasPaid ? "refund_pending" : "cancelled";
  order.statusHistory.push({ status: order.status, at: nowIso(), note: reason, by });
  order.updatedAt = nowIso();
  repos.orders.save(order);
  return { ok: true, order };
}

/** Mark a COD order's payment as collected (authorized confirmation only). */
export function markPaymentCollected(
  repos: Repos,
  orderId: string,
  reference?: string,
  by = "demo",
): OrderResult {
  const order = repos.orders.getById(orderId);
  if (!order) return { ok: false, error: "order-not-found" };
  if (order.paymentStatus === "collected") return { ok: true, order };
  order.paymentStatus = "collected";
  order.payments.push({
    id: `pay_${nowIso()}`,
    method: order.paymentMethod,
    status: "collected",
    amountMinor: order.totalMinor,
    reference: reference ?? `COD-${order.orderNumber}`,
    at: nowIso(),
  });
  order.updatedAt = nowIso();
  repos.orders.save(order);

  postEntry(repos, {
    date: new Date().toISOString().slice(0, 10),
    type: "cod_collection",
    account: "cash",
    amountMinor: order.totalMinor,
    referenceType: "order",
    referenceId: order.id,
    description: `COD collection for ${order.orderNumber}`,
  });
  return { ok: true, order };
}
