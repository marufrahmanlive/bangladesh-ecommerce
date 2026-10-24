"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import type { Order } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { formatMoney, formatDateTime } from "@/lib/format";
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export default function InvoicesPage() {
  const { locale, t } = useI18n();
  const { orders, settings } = useCatalog();
  const [selected, setSelected] = useState<Order | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[600px] text-sm">
        <thead className="bg-muted/50 text-left">
          <tr><th className="px-4 py-2">Invoice</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Total</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Actions</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="px-4 py-2 font-medium">{o.orderNumber}</td>
              <td className="px-4 py-2">{o.customer.fullName}</td>
              <td className="px-4 py-2">{formatMoney(o.totalMinor, locale)}</td>
              <td className="px-4 py-2">{orderStatusLabel(locale, o.status)}</td>
              <td className="px-4 py-2 text-muted-foreground">{formatDateTime(o.createdAt, locale)}</td>
              <td className="px-4 py-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(o)}>
                  <Printer className="h-4 w-4" /> View
                </Button>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
          )}
        </tbody>
      </table>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="max-w-2xl" title="Invoice">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <p className="text-lg font-bold text-primary">{settings?.storeName.en ?? "BanglaBazar"}</p>
                <p className="text-muted-foreground">{settings?.phone}</p>
                <p className="text-muted-foreground">{settings?.email}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">INVOICE</p>
                <p className="text-muted-foreground">{selected.orderNumber}</p>
                <p className="text-muted-foreground">{formatDateTime(selected.createdAt, locale)}</p>
              </div>
            </div>

            <div>
              <p className="font-medium">Bill To</p>
              <p>{selected.customer.fullName}</p>
              <p className="text-muted-foreground">{selected.customer.phone}</p>
              <p className="text-muted-foreground">{selected.customer.address}, {selected.customer.city}, {selected.customer.district}</p>
            </div>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1">Product</th>
                  <th className="py-1">SKU</th>
                  <th className="py-1">Qty</th>
                  <th className="py-1">Price</th>
                  <th className="py-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((item) => (
                  <tr key={item.variantId} className="border-b">
                    <td className="py-1">{item.name.en}</td>
                    <td className="py-1 text-muted-foreground">{item.sku}</td>
                    <td className="py-1">{item.quantity}</td>
                    <td className="py-1">{formatMoney(item.priceMinor, locale)}</td>
                    <td className="py-1 text-right">{formatMoney(item.subtotalMinor, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 border-t pt-2 text-right">
              <p><span className="text-muted-foreground">{t("common.subtotal")}:</span> {formatMoney(selected.subtotalMinor, locale)}</p>
              <p><span className="text-muted-foreground">{t("common.shipping")}:</span> {formatMoney(selected.shippingMinor, locale)}</p>
              <p><span className="text-muted-foreground">{t("common.discount")}:</span> -{formatMoney(selected.discountMinor, locale)}</p>
              <p className="text-lg font-bold">{t("common.total")}: {formatMoney(selected.totalMinor, locale)}</p>
            </div>

            <div className="border-t pt-2">
              <p>{paymentMethodLabel(locale, selected.paymentMethod)} — {paymentStatusLabel(locale, selected.paymentStatus)}</p>
              {selected.payments.map((p) => (
                <p key={p.id} className="text-xs text-muted-foreground">
                  {p.reference} ({formatMoney(p.amountMinor, locale)})
                </p>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>{t("common.close")}</Button>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

