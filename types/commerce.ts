import type { LocalizedText, MoneyMinor, Timestamped } from "./catalog";

export interface Address {
  id: string;
  label?: string;
  fullName: string;
  phone: string;
  district: string;
  city: string;
  address: string;
  instructions?: string;
}

export type CustomerStatus = "active" | "inactive";

export interface Customer extends Timestamped {
  id: string;
  name: string;
  phone: string;
  email?: string;
  addresses: Address[];
  notes?: string;
  status: CustomerStatus;
  isSample: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: LocalizedText;
  slug: string;
  sku: string;
  image?: string;
  color?: string;
  size?: string;
  regularPriceMinor: MoneyMinor;
  priceMinor: MoneyMinor;
  quantity: number;
  stockAvailable: number;
  addedAt: string;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export type CouponType = "percent" | "fixed" | "free_shipping";

export interface Coupon extends Timestamped {
  id: string;
  code: string;
  type: CouponType;
  /** For "percent": 1-100. For "fixed": unused (see valueMinor). */
  value: number;
  /** For "fixed": integer poisha discount. */
  valueMinor: MoneyMinor;
  minOrderMinor?: MoneyMinor;
  maxDiscountMinor?: MoneyMinor;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  usageCount: number;
  categoryIds?: string[];
  productIds?: string[];
  isActive: boolean;
  isSample: boolean;
}

export interface Review extends Timestamped {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  helpful: number;
  notHelpful: number;
  reported: boolean;
  hidden: boolean;
  isVerified: boolean;
  isSample: boolean;
}
