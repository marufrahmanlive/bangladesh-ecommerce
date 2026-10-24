"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { StockMovementType } from "@/types";
import { STOCK_MOVEMENT_TYPES } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney, formatDateTime } from "@/lib/format";
import {
  adjustVariantStock,
  getLowStockProducts,
  inventoryValuation,
} from "@/services/inventory";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";

export function InventoryAdmin() {
  const { locale, t } = useI18n();
  const { products, inventory, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [dialog, setDialog] = useState<{
    productId: string;
    variantId: string;
    qty: string;
    reason: string;
    type: StockMovementType;
  } | null>(null);

  const lowStock = repos ? getLowStockProducts(repos) : [];
  const valuation = repos
    ? inventoryValuation(repos)
    : { totalCostMinor: 0, totalRetailMinor: 0, unitCount: 0 };
  const selectedProduct = dialog
    ? products.find((p) => p.id === dialog.productId)
    : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repos || !dialog) return;
    const res = adjustVariantStock(repos, {
      productId: dialog.productId,
      variantId: dialog.variantId,
      type: dialog.type,
      quantityChange: parseInt(dialog.qty || "0", 10),
      reason: dialog.reason || "Manual adjustment",
      performedBy: "admin",
    });
    refresh();
    setDialog(null);
    addToast(res.ok ? t("toast.saved") : t("toast.error"), res.ok ? "success" : "error");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Inventory Cost</CardTitle></CardHeader>
          <CardContent className="text-xl font-bold">{formatMoney(valuation.totalCostMinor, locale)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Retail Value</CardTitle></CardHeader>
          <CardContent className="text-xl font-bold">{formatMoney(valuation.totalRetailMinor, locale)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Units</CardTitle></CardHeader>
          <CardContent className="text-xl font-bold">{valuation.unitCount}</CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() =>
            setDialog({
              productId: products[0]?.id ?? "",
              variantId: products[0]?.variants[0]?.id ?? "",
              qty: "1",
              reason: "",
              type: "adjustment",
            })
          }
        >
          Adjust Stock
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> {t("admin.lowStock")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {lowStock.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
              <span className="font-medium">{p.name.en}</span>
              <span className="text-muted-foreground">
                {p.variants.map((v) => (
                  <Badge key={v.id} variant={v.stock <= 0 ? "destructive" : "warning"} className="ml-1">
                    {v.size ?? v.color ?? "Default"}: {v.stock}
                  </Badge>
                ))}
              </span>
            </div>
          ))}
          {lowStock.length === 0 && <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Stock Movements</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground">{formatDateTime(m.createdAt, locale)}</td>
                    <td className="px-3 py-2">{m.type}</td>
                    <td className={`px-3 py-2 ${m.quantityChange < 0 ? "text-destructive" : "text-success"}`}>
                      {m.quantityChange > 0 ? "+" : ""}{m.quantityChange}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{m.reason}</td>
                  </tr>
                ))}
                {inventory.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} title="Adjust Stock">
        {dialog && (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label className="mb-1 block">Product</Label>
              <Select
                value={dialog.productId}
                onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value);
                  setDialog({ ...dialog, productId: e.target.value, variantId: p?.variants[0]?.id ?? "" });
                }}
              >
                {products.map((p) => <option key={p.id} value={p.id}>{p.name.en}</option>)}
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Variant</Label>
              <Select value={dialog.variantId} onChange={(e) => setDialog({ ...dialog, variantId: e.target.value })}>
                {selectedProduct?.variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.sku} ({v.size ?? v.color ?? "Default"})</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Movement Type</Label>
              <Select value={dialog.type} onChange={(e) => setDialog({ ...dialog, type: e.target.value as StockMovementType })}>
                {STOCK_MOVEMENT_TYPES.map((mt) => <option key={mt} value={mt}>{mt}</option>)}
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Quantity (positive adds, negative reduces)</Label>
              <Input type="number" value={dialog.qty} onChange={(e) => setDialog({ ...dialog, qty: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block">Reason</Label>
              <Input value={dialog.reason} onChange={(e) => setDialog({ ...dialog, reason: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>{t("common.cancel")}</Button>
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </form>
        )}
      </Dialog>

    </div>
  );
}
