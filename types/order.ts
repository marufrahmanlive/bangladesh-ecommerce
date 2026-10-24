import type { LocalizedText, MoneyMinor, Timestamped } from "./catalog";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancellation_requested",
  "cancelled",
  "return_requested",
  "returned",
  "refund_pending",
  "refunded",
  "failed",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["cod", "bkash", "nagad", "card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "collected",
  "failed",
  "refunded",
  "partially_refunded",
  "cancelled",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface OrderItem {
  productId: string;
  variantId: string;
  name: LocalizedText;
  slug: string;
  sku: string;
  color?: string;
  size?: string;
  image?: string;
  regularPriceMinor: MoneyMinor;
  priceMinor: MoneyMinor;
  quantity: number;
  subtotalMinor: MoneyMinor;
}

export interface ShippingInfo {
  fullName: string;
  phone: string;
  email?: string;
  district: string;
  city: string;
  address: string;
  instructions?: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
  by?: string;
}

export interface PaymentTransaction {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountMinor: MoneyMinor;
  reference?: string;
  at: string;
}

export type DeliveryMethod = "standard" | "express";

export interface Order extends Timestamped {
  id: string;
  orderNumber: string;
  customerId?: string;
  customer: ShippingInfo;
  items: OrderItem[];
  subtotalMinor: MoneyMinor;
  discountMinor: MoneyMinor;
  couponCode?: string;
  shippingMinor: MoneyMinor;
  totalMinor: MoneyMinor;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  notes?: string;
  internalNotes?: string;
  statusHistory: OrderStatusEvent[];
  payments: PaymentTransaction[];
  isSample: boolean;
}
