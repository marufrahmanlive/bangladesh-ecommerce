import type {
  CartItem,
  Coupon,
  DeliveryMethod,
  MoneyMinor,
  Order,
  PaymentMethod,
  ShippingInfo,
  StoreSettings,
} from "@/types";
import type { Repos } from "@/repositories";
import { formatOrderNumber } from "@/lib/money";
import { keyFor, readJson, writeJson } from "@/lib/storage";
import { nowIso, uid } from "@/lib/utils";
import { adjustVariantStock } from "./inventory";
import { postEntry } from "./accounting";

export function computeShippingMinor(
  settings: StoreSettings,
  district: string,
  subtotalMinor: MoneyMinor,
): MoneyMinor {
  const zone = settings.deliveryZones.find(
    (z) => z.isActive && z.districts.includes(district),
  );
  const fallback = settings.deliveryZones.reduce(
    (max, z) => Math.max(max, z.chargeMinor),
    0,
  );
  const charge = zone?.chargeMinor ?? fallback;
  if (zone?.freeAboveMinor && subtotalMinor >= zone.freeAboveMinor) return 0;
  return charge;
}

export interface CouponResult {
  ok: boolean;
  error?: string;
  discountMinor?: MoneyMinor;
  freeShipping?: boolean;
  coupon?: Coupon;
}

export function evaluateCoupon(
  repos: Repos,
  code: string,
  items: CartItem[],
  subtotalMinor: MoneyMinor,
): CouponResult {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "empty" };
  const coupon = repos.coupons
    .getAll()
    .find((c) => c.code.toUpperCase() === normalized);
  if (!coupon) return { ok: false, error: "not-found" };
  if (!coupon.isActive) return { ok: false, error: "inactive" };

  const now = Date.now();
  if (coupon.startDate && now < new Date(coupon.startDate).getTime())
    return { ok: false, error: "not-started" };
  if (coupon.endDate && now > new Date(coupon.endDate).getTime())
    return { ok: false, error: "expired" };
  if (coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit)
    return { ok: false, error: "usage-limit" };
  if (coupon.minOrderMinor && subtotalMinor < coupon.minOrderMinor)
    return { ok: false, error: "min-order" };

  if (coupon.categoryIds?.length || coupon.productIds?.length) {
    const products = new Map(repos.products.getAll().map((p) => [p.id, p]));
    const eligible = items.some((item) => {
      const product = products.get(item.productId);
      if (coupon.productIds?.length && coupon.productIds.includes(item.productId))
        return true;
      if (
        coupon.categoryIds?.length &&
        product &&
        coupon.categoryIds.includes(product.categoryId)
      )
        return true;
      return false;
    });
    if (!eligible) return { ok: false, error: "not-applicable" };
  }

  let discountMinor: MoneyMinor = 0;
  let freeShipping = false;
  if (coupon.type === "percent") {
    discountMinor = Math.round((subtotalMinor * coupon.value) / 100);
  } else if (coupon.type === "fixed") {
    discountMinor = coupon.valueMinor;
  } else {
    freeShipping = true;
  }
  if (coupon.maxDiscountMinor)
    discountMinor = Math.min(discountMinor, coupon.maxDiscountMinor);
  discountMinor = Math.min(discountMinor, subtotalMinor);
  return { ok: true, discountMinor, freeShipping, coupon };
}

export interface PlaceOrderInput {
  customer: ShippingInfo;
  items: CartItem[];
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
  idempotencyKey: string;
}

export interface PlaceOrderResult {
  ok: boolean;
  error?: string;
  order?: Order;
  duplicate?: boolean;
}

function getProcessedKeys(): Record<string, string> {
  return readJson<Record<string, string>>(keyFor("order_idempotency")) ?? {};
}

function markProcessed(key: string, orderId: string): void {
  const map = getProcessedKeys();
  map[key] = orderId;
  writeJson(keyFor("order_idempotency"), map);
}

function nextOrderCounter(): number {
  const current = readJson<number>(keyFor("order_counter")) ?? 1000;
  const next = current + 1;
  writeJson(keyFor("order_counter"), next);
  return next;
}

export function placeOrder(repos: Repos, input: PlaceOrderInput): PlaceOrderResult {
  const processed = getProcessedKeys();
  const existingId = processed[input.idempotencyKey];
  if (existingId) {
    const existing = repos.orders.getById(existingId);
    if (existing) return { ok: true, order: existing, duplicate: true };
  }

  if (input.items.length === 0) return { ok: false, error: "empty-cart" };

  const products = new Map(repos.products.getAll().map((p) => [p.id, p]));
  const validatedItems: Order["items"] = [];
  for (const item of input.items) {
    const product = products.get(item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!product || !variant)
      return { ok: false, error: `item-not-found:${item.sku}` };
    if (variant.stock < item.quantity)
      return { ok: false, error: `insufficient-stock:${item.sku}` };
    validatedItems.push({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      slug: product.slug,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      image: variant.image ?? product.images[0],
      regularPriceMinor: variant.regularPriceMinor,
      priceMinor: variant.offerPriceMinor,
      quantity: item.quantity,
      subtotalMinor: variant.offerPriceMinor * item.quantity,
    });
  }

  const subtotalMinor = validatedItems.reduce((a, i) => a + i.subtotalMinor, 0);
  const couponResult = input.couponCode
    ? evaluateCoupon(repos, input.couponCode, input.items, subtotalMinor)
    : { ok: false as const };
  const discountMinor = couponResult.ok ? (couponResult.discountMinor ?? 0) : 0;

  const settings = repos.settings.get();
  let shippingMinor = computeShippingMinor(
    settings,
    input.customer.district,
    subtotalMinor,
  );
  if (couponResult.ok && couponResult.freeShipping) shippingMinor = 0;

  const totalMinor = Math.max(0, subtotalMinor - discountMinor + shippingMinor);

  const orderId = uid("ord");
  for (const item of validatedItems) {
    const res = adjustVariantStock(repos, {
      productId: item.productId,
      variantId: item.variantId,
      type: "sale",
      quantityChange: -item.quantity,
      reason: "Order placement",
      referenceType: "order",
      referenceId: orderId,
      unitCostMinor: products
        .get(item.productId)
        ?.variants.find((v) => v.id === item.variantId)?.costMinor,
      performedBy: "customer",
    });
    if (!res.ok && !res.deduplicated)
      return { ok: false, error: res.error ?? "stock-adjust-failed" };
  }

  const orderNumber = formatOrderNumber(nextOrderCounter());
  const order: Order = {
    id: orderId,
    orderNumber,
    customer: input.customer,
    items: validatedItems,
    subtotalMinor,
    discountMinor,
    couponCode: couponResult.ok ? input.couponCode : undefined,
    shippingMinor,
    totalMinor,
    deliveryMethod: input.deliveryMethod,
    paymentMethod: input.paymentMethod,
    paymentStatus: "pending",
    status: "pending",
    notes: input.notes,
    statusHistory: [{ status: "pending", at: nowIso(), by: "customer" }],
    payments: [],
    isSample: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  repos.orders.save(order);

  if (couponResult.ok && couponResult.coupon) {
    const coupon = couponResult.coupon;
    coupon.usageCount += 1;
    coupon.updatedAt = nowIso();
    repos.coupons.save(coupon);
  }

  postEntry(repos, {
    date: nowIso().slice(0, 10),
    type: "sale",
    account: "sales",
    amountMinor: totalMinor,
    referenceType: "order",
    referenceId: order.id,
    description: `Sale ${orderNumber}`,
  });

  markProcessed(input.idempotencyKey, order.id);
  return { ok: true, order };
}

