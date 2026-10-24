import type { InventoryMovement, Product, StockMovementType } from "@/types";
import type { Repos } from "@/repositories";
import { nowIso, uid } from "@/lib/utils";

export interface StockChange {
  productId: string;
  variantId: string;
  type: StockMovementType;
  quantityChange: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  unitCostMinor?: number;
  performedBy?: string;
}

export interface StockResult {
  ok: boolean;
  error?: string;
  deduplicated?: boolean;
}

export function recordMovement(repos: Repos, movement: InventoryMovement): void {
  repos.inventory.save(movement);
}

/**
 * Adjust a variant's stock, recording an inventory movement. Never allows
 * negative stock. Deduplicates by (referenceType, referenceId, type) so the
 * same order event cannot deduct stock twice.
 */
export function adjustVariantStock(repos: Repos, change: StockChange): StockResult {
  const product = repos.products.getById(change.productId);
  if (!product) return { ok: false, error: "product-not-found" };
  const variant = product.variants.find((v) => v.id === change.variantId);
  if (!variant) return { ok: false, error: "variant-not-found" };

  if (change.referenceType && change.referenceId) {
    const duplicate = repos.inventory
      .getAll()
      .find(
        (m) =>
          m.referenceType === change.referenceType &&
          m.referenceId === change.referenceId &&
          m.type === change.type,
      );
    if (duplicate) return { ok: true, deduplicated: true };
  }

  const nextStock = variant.stock + change.quantityChange;
  if (nextStock < 0) return { ok: false, error: "insufficient-stock" };

  variant.stock = nextStock;
  product.updatedAt = nowIso();
  repos.products.save(product);

  const movement: InventoryMovement = {
    id: uid("mv"),
    productId: change.productId,
    variantId: change.variantId,
    type: change.type,
    quantityChange: change.quantityChange,
    reason: change.reason,
    referenceType: change.referenceType,
    referenceId: change.referenceId,
    unitCostMinor: change.unitCostMinor,
    performedBy: change.performedBy,
    isSample: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  repos.inventory.save(movement);
  return { ok: true };
}

export function getLowStockProducts(repos: Repos): Product[] {
  return repos.products
    .getAll()
    .filter((p) => p.variants.some((v) => v.stock <= v.lowStockThreshold));
}

export function getOutOfStockVariants(repos: Repos): { product: Product; variantId: string; sku: string; stock: number }[] {
  const result: { product: Product; variantId: string; sku: string; stock: number }[] = [];
  for (const p of repos.products.getAll()) {
    for (const v of p.variants) {
      if (v.stock <= 0) result.push({ product: p, variantId: v.id, sku: v.sku, stock: v.stock });
    }
  }
  return result;
}

export function inventoryValuation(repos: Repos): {
  totalCostMinor: number;
  totalRetailMinor: number;
  unitCount: number;
} {
  let totalCostMinor = 0;
  let totalRetailMinor = 0;
  let unitCount = 0;
  for (const p of repos.products.getAll()) {
    for (const v of p.variants) {
      totalCostMinor += v.costMinor * v.stock;
      totalRetailMinor += v.offerPriceMinor * v.stock;
      unitCount += v.stock;
    }
  }
  return { totalCostMinor, totalRetailMinor, unitCount };
}
