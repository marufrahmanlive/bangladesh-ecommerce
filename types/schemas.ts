import { z } from "zod";
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  STOCK_MOVEMENT_TYPES,
  ROLES,
} from "./index";

const localizedText = z.object({ en: z.string(), bn: z.string() });

export const categorySchema = z
  .object({
    id: z.string(),
    name: localizedText,
    slug: z.string(),
    parentId: z.string().nullable(),
    description: localizedText.optional(),
    image: z.string().optional(),
    order: z.number(),
    isActive: z.boolean(),
    isSample: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const supplierSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    openingBalanceMinor: z.number(),
    notes: z.string().optional(),
    isActive: z.boolean(),
    isSample: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const productVariantSchema = z
  .object({
    id: z.string(),
    sku: z.string(),
    barcode: z.string().optional(),
    color: z.string().optional(),
    size: z.string().optional(),
    attributes: z.record(z.string(), z.string()).optional(),
    image: z.string().optional(),
    regularPriceMinor: z.number(),
    offerPriceMinor: z.number(),
    costMinor: z.number(),
    stock: z.number(),
    lowStockThreshold: z.number(),
    isActive: z.boolean(),
  })
  .passthrough();

export const productSchema = z
  .object({
    id: z.string(),
    name: localizedText,
    slug: z.string(),
    sku: z.string(),
    barcode: z.string().optional(),
    shortDescription: localizedText,
    description: localizedText,
    specifications: z.array(
      z.object({ label: localizedText, value: localizedText }),
    ),
    categoryId: z.string(),
    brandId: z.string().optional(),
    supplierId: z.string().optional(),
    images: z.array(z.string()),
    variants: z.array(productVariantSchema),
    taxRate: z.number(),
    weightGrams: z.number().optional(),
    isFeatured: z.boolean(),
    isBestSeller: z.boolean(),
    isNew: z.boolean(),
    isPublished: z.boolean(),
    isArchived: z.boolean(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    isSample: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const addressSchema = z
  .object({
    id: z.string(),
    label: z.string().optional(),
    fullName: z.string(),
    phone: z.string(),
    district: z.string(),
    city: z.string(),
    address: z.string(),
    instructions: z.string().optional(),
  })
  .passthrough();

export const customerSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    addresses: z.array(addressSchema),
    notes: z.string().optional(),
    status: z.enum(["active", "inactive"]),
    isSample: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const cartItemSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    variantId: z.string(),
    name: localizedText,
    slug: z.string(),
    sku: z.string(),
    image: z.string().optional(),
    color: z.string().optional(),
    size: z.string().optional(),
    regularPriceMinor: z.number(),
    priceMinor: z.number(),
    quantity: z.number(),
    stockAvailable: z.number(),
    addedAt: z.string(),
  })
  .passthrough();

export const wishlistItemSchema = z
  .object({ productId: z.string(), addedAt: z.string() })
  .passthrough();

export const couponSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    type: z.enum(["percent", "fixed", "free_shipping"]),
    value: z.number(),
    valueMinor: z.number(),
    minOrderMinor: z.number().optional(),
    maxDiscountMinor: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    usageLimit: z.number().optional(),
    perCustomerLimit: z.number().optional(),
    usageCount: z.number(),
    categoryIds: z.array(z.string()).optional(),
    productIds: z.array(z.string()).optional(),
    isActive: z.boolean(),
    isSample: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const reviewSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    customerName: z.string(),
    rating: z.number(),
    title: z.string().optional(),
    comment: z.string(),
    helpful: z.number(),
    notHelpful: z.number(),
    reported: z.boolean(),
    hidden: z.boolean(),
    isVerified: z.boolean(),
    isSample: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const orderItemSchema = z
  .object({
    productId: z.string(),
    variantId: z.string(),
    name: localizedText,
    slug: z.string(),
    sku: z.string(),
    color: z.string().optional(),
    size: z.string().optional(),
    image: z.string().optional(),
    regularPriceMinor: z.number(),
    priceMinor: z.number(),
    quantity: z.number(),
    subtotalMinor: z.number(),
  })
  .passthrough();

export const shippingInfoSchema = z
  .object({
    fullName: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    district: z.string(),
    city: z.string(),
    address: z.string(),
    instructions: z.string().optional(),
  })
  .passthrough();

export const paymentTransactionSchema = z
  .object({
    id: z.string(),
    method: z.enum(PAYMENT_METHODS),
    status: z.enum(PAYMENT_STATUSES),
    amountMinor: z.number(),
    reference: z.string().optional(),
    at: z.string(),
  })
  .passthrough();

export const orderSchema = z
  .object({
    id: z.string(),
    orderNumber: z.string(),
    customerId: z.string().optional(),
    customer: shippingInfoSchema,
    items: z.array(orderItemSchema),
    subtotalMinor: z.number(),
    discountMinor: z.number(),
    couponCode: z.string().optional(),
    shippingMinor: z.number(),
    totalMinor: z.number(),
    deliveryMethod: z.enum(["standard", "express"]),
    paymentMethod: z.enum(PAYMENT_METHODS),
    paymentStatus: z.enum(PAYMENT_STATUSES),
    status: z.enum(ORDER_STATUSES),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
    statusHistory: z.array(
      z.object({
        status: z.enum(ORDER_STATUSES),
        at: z.string(),
        note: z.string().optional(),
        by: z.string().optional(),
      }),
    ),
    payments: z.array(paymentTransactionSchema),
    isSample: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const inventoryMovementSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    variantId: z.string(),
    type: z.enum(STOCK_MOVEMENT_TYPES),
    quantityChange: z.number(),
    reason: z.string(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    unitCostMinor: z.number().optional(),
    performedBy: z.string().optional(),
    isSample: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const purchaseOrderSchema = z
  .object({
    id: z.string(),
    poNumber: z.string(),
    supplierId: z.string(),
    items: z.array(
      z.object({
        productId: z.string(),
        variantId: z.string(),
        sku: z.string(),
        name: z.string(),
        quantity: z.number(),
        receivedQuantity: z.number(),
        unitCostMinor: z.number(),
      }),
    ),
    status: z.enum([
      "draft",
      "ordered",
      "partially_received",
      "received",
      "cancelled",
    ]),
    note: z.string().optional(),
    isSample: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const accountingEntrySchema = z
  .object({
    id: z.string(),
    date: z.string(),
    type: z.enum([
      "sale",
      "purchase",
      "customer_payment",
      "supplier_payment",
      "cod_collection",
      "refund",
      "expense",
      "income",
      "opening",
    ]),
    account: z.enum([
      "cash",
      "bank",
      "receivable",
      "payable",
      "sales",
      "purchases",
      "expenses",
      "income",
    ]),
    amountMinor: z.number(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    description: z.string(),
    isSample: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const expenseSchema = z
  .object({
    id: z.string(),
    category: z.string(),
    amountMinor: z.number(),
    date: z.string(),
    notes: z.string().optional(),
    reference: z.string().optional(),
    isSample: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const storeSettingsSchema = z
  .object({
    storeName: localizedText,
    currency: z.enum(["BDT"]),
    phone: z.string(),
    email: z.string(),
    address: localizedText,
    codEnabled: z.boolean(),
    codChargeMinor: z.number(),
    deliveryZones: z.array(
      z.object({
        id: z.string(),
        name: localizedText,
        districts: z.array(z.string()),
        chargeMinor: z.number(),
        freeAboveMinor: z.number().optional(),
        isActive: z.boolean(),
      }),
    ),
    isSample: z.boolean(),
  })
  .passthrough();

export const demoUserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(ROLES),
    isDemo: z.boolean(),
  })
  .passthrough();

/** Helper: parse a stored JSON value against a schema, returning null on failure. */
export function safeParse<T>(schema: z.ZodType<T>, value: unknown): T | null {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function collection<T>(schema: z.ZodType<T>): z.ZodType<T[]> {
  return z.array(schema);
}

