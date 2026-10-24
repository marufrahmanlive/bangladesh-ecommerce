export type Locale = "en" | "bn";

/** Bilingual text used for product names, descriptions, categories, etc. */
export type LocalizedText = { en: string; bn: string };

/**
 * Monetary values are stored as integer minor units (poisha).
 * 1 BDT (৳) = 100 poisha. Never use floating point for money.
 */
export type MoneyMinor = number;

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

export interface Category extends Timestamped {
  id: string;
  name: LocalizedText;
  slug: string;
  parentId: string | null;
  description?: LocalizedText;
  image?: string;
  order: number;
  isActive: boolean;
  isSample: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isSample: boolean;
}

export interface Supplier extends Timestamped {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalanceMinor: MoneyMinor;
  notes?: string;
  isActive: boolean;
  isSample: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  color?: string;
  size?: string;
  attributes?: Record<string, string>;
  image?: string;
  regularPriceMinor: MoneyMinor;
  offerPriceMinor: MoneyMinor;
  costMinor: MoneyMinor;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
}

export interface ProductSpec {
  label: LocalizedText;
  value: LocalizedText;
}

export interface Product extends Timestamped {
  id: string;
  name: LocalizedText;
  slug: string;
  sku: string;
  barcode?: string;
  shortDescription: LocalizedText;
  description: LocalizedText;
  specifications: ProductSpec[];
  categoryId: string;
  brandId?: string;
  supplierId?: string;
  images: string[];
  variants: ProductVariant[];
  taxRate: number;
  weightGrams?: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  isPublished: boolean;
  isArchived: boolean;
  seoTitle?: string;
  seoDescription?: string;
  isSample: boolean;
}
