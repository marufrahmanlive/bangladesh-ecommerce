"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PurchaseItem, PurchaseOrder } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney } from "@/lib/format";
import { nowIso, uid } from "@/lib/utils";
import { adjustVariantStock } from "@/services/inventory";
import { postEntry } from "@/services/accounting";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

interface LineItem {
  productId: string;
  variantId: string;
  qty: string;
  cost: string;
}

const emptyLine = (productId: string, variantId: string): LineItem => ({
  productId,
  variantId,
  qty: "1",
  cost: "",
});

export default function PurchasesPage() {
  const { locale, t } = useI18n();
  const { purchases, suppliers, products, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    emptyLine(products[0]?.id ?? "", products[0]?.variants[0]?.id ?? ""),
  ]);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repos || !supplierId) return;
    const items: PurchaseItem[] = lines
      .map((it) => {
        const product = products.find((p) => p.id === it.productId);
        const variant = product?.variants.find((v) => v.id === it.variantId);
        const quantity = parseInt(it.qty || "0", 10);
        if (!product || !variant || quantity <= 0) return null;
        return {
          productId: product.id,
          variantId: variant.id,
          sku: variant.sku,
          name: product.name.en,
          quantity,
          receivedQuantity: 0,
          unitCostMinor: Math.round(parseFloat(it.cost || "0") * 100),
        };
      })
      .filter((x): x is PurchaseItem => x !== null);

    if (items.length === 0) {
      addToast(t("toast.error"), "error");
      return;
    }

    const po: PurchaseOrder = {
      id: uid("po"),
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      supplierId,
      items,
      status: "ordered",
      isSample: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repos.purchases.save(po);
    refresh();
    setOpen(false);
    setSupplierId("");
    setLines([emptyLine(products[0]?.id ?? "", products[0]?.variants[0]?.id ?? "")]);
    addToast(t("toast.saved"), "success");
  };

  const receive = (po: PurchaseOrder) => {
    if (!repos) return;
    if (po.status === "received") return;
    let totalCost = 0;
    for (const item of po.items) {
      const remaining = item.quantity - item.receivedQuantity;
      if (remaining <= 0) continue;
      const res = adjustVariantStock(repos, {
        productId: item.productId,
        variantId: item.variantId,
        type: "purchase",
        quantityChange: remaining,
        reason: `Purchase ${po.poNumber}`,
        referenceType: "purchase",
        referenceId: po.id,
        unitCostMinor: item.unitCostMinor,
        performedBy: "admin",
      });
      if (!res.ok && !res.deduplicated) {
        addToast(t("toast.error"), "error");
        return;
      }
      totalCost += item.unitCostMinor * remaining;
    }
    po.items.forEach((i) => {
      i.receivedQuantity = i.quantity;
    });
    po.status = "received";
    po.updatedAt = nowIso();
    repos.purchases.save(po);
    postEntry(repos, {
      date: nowIso().slice(0, 10),
      type: "purchase",
      account: "payable",
      amountMinor: -totalCost,
      referenceType: "purchase",
      referenceId: po.id,
      description: `Purchase ${po.poNumber}`,
    });
    refresh();
    addToast(t("toast.saved"), "success");
  };

  const setLine = (index: number, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setSupplierId(suppliers[0]?.id ?? "");
            setLines([emptyLine(products[0]?.id ?? "", products[0]?.variants[0]?.id ?? "")]);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New PO
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2">PO Number</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Items</th>
              <th className="px-4 py-2">Total Cost</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => {
              const totalCost = p.items.reduce(
                (acc, i) => acc + i.unitCostMinor * i.quantity,
                0,
              );
              return (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{p.poNumber}</td>
                  <td className="px-4 py-2">
                    {suppliers.find((s) => s.id === p.supplierId)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2">{p.items.length}</td>
                  <td className="px-4 py-2">{formatMoney(totalCost, locale)}</td>
                  <td className="px-4 py-2"><Badge>{p.status}</Badge></td>
                  <td className="px-4 py-2">
                    {p.status !== "received" && (
                      <Button size="sm" variant="outline" onClick={() => receive(p)}>
                        Receive
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t("common.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="New PO">
        <form onSubmit={create} className="space-y-3">
          <div>
            <Label className="mb-1 block">Supplier</Label>
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLines((prev) => [
                    ...prev,
                    emptyLine(products[0]?.id ?? "", products[0]?.variants[0]?.id ?? ""),
                  ])
                }
              >
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>
            {lines.map((line, i) => {
              const product = products.find((p) => p.id === line.productId);
              return (
                <div key={i} className="grid grid-cols-[1fr_1fr_80px_100px_32px] gap-2">
                  <Select
                    value={line.productId}
                    onChange={(e) => {
                      const p = products.find((x) => x.id === e.target.value);
                      setLine(i, {
                        productId: e.target.value,
                        variantId: p?.variants[0]?.id ?? "",
                        cost: p?.variants[0] ? String(p.variants[0].costMinor / 100) : "",
                      });
                    }}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name.en}</option>
                    ))}
                  </Select>
                  <Select
                    value={line.variantId}
                    onChange={(e) => setLine(i, { variantId: e.target.value })}
                  >
                    {product?.variants.map((v) => (
                      <option key={v.id} value={v.id}>{v.sku}</option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={line.qty}
                    onChange={(e) => setLine(i, { qty: e.target.value })}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Cost"
                    value={line.cost}
                    onChange={(e) => setLine(i, { cost: e.target.value })}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setLines((prev) => prev.filter((_, x) => x !== i))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">{t("common.save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

