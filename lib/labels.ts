import type {
  Locale,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types";

const ORDER_STATUS: Record<OrderStatus, { en: string; bn: string }> = {
  pending: { en: "Pending", bn: "পেন্ডিং" },
  confirmed: { en: "Confirmed", bn: "নিশ্চিত" },
  processing: { en: "Processing", bn: "প্রক্রিয়াধীন" },
  packed: { en: "Packed", bn: "প্যাক করা হয়েছে" },
  shipped: { en: "Shipped", bn: "প্রেরিত" },
  delivered: { en: "Delivered", bn: "বিতরণ হয়েছে" },
  cancellation_requested: { en: "Cancellation Requested", bn: "বাতিলের অনুরোধ" },
  cancelled: { en: "Cancelled", bn: "বাতিল" },
  return_requested: { en: "Return Requested", bn: "রিটার্নের অনুরোধ" },
  returned: { en: "Returned", bn: "ফেরত" },
  refund_pending: { en: "Refund Pending", bn: "ফেরত প্রক্রিয়াধীন" },
  refunded: { en: "Refunded", bn: "ফেরত সম্পন্ন" },
  failed: { en: "Failed", bn: "ব্যর্থ" },
};

const PAYMENT_STATUS: Record<PaymentStatus, { en: string; bn: string }> = {
  pending: { en: "Pending", bn: "পেন্ডিং" },
  paid: { en: "Paid", bn: "পরিশোধিত" },
  collected: { en: "Collected", bn: "সংগ্রহকৃত" },
  failed: { en: "Failed", bn: "ব্যর্থ" },
  refunded: { en: "Refunded", bn: "ফেরত সম্পন্ন" },
  partially_refunded: { en: "Partially Refunded", bn: "আংশিক ফেরত" },
  cancelled: { en: "Cancelled", bn: "বাতিল" },
};

const PAYMENT_METHOD: Record<PaymentMethod, { en: string; bn: string }> = {
  cod: { en: "Cash on Delivery", bn: "ক্যাশ অন ডেলিভারি" },
  bkash: { en: "bKash", bn: "বিকাশ" },
  nagad: { en: "Nagad", bn: "নগদ" },
  card: { en: "Card", bn: "কার্ড" },
};

export function orderStatusLabel(locale: Locale, status: OrderStatus): string {
  return ORDER_STATUS[status]?.[locale] ?? status;
}

export function paymentStatusLabel(locale: Locale, status: PaymentStatus): string {
  return PAYMENT_STATUS[status]?.[locale] ?? status;
}

export function paymentMethodLabel(locale: Locale, method: PaymentMethod): string {
  return PAYMENT_METHOD[method]?.[locale] ?? method;
}
