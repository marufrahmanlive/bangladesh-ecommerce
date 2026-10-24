"use client";

import { useState } from "react";
import Link from "next/link";
import type { OrderStatus } from "@/types";
import { ORDER_STATUSES } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney, formatDateTime } from "@/lib/format";
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from "@/lib/labels";
import { cancelOrder, markPaymentCollected, transitionStatus } from "@/services/order";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";

export function OrderDetail({ orderId }: { orderId: string }) {
  const { locale, t } = useI18n();
  const { orders, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const order = orders.find((o) => o.id === orderId);

  if (!order) return <p className="text-muted-foreground">{t("order.notFound")}</p>;

  const update = (next: OrderStatus) => {
    if (!repos) return;
    const res = transitionStatus(repos, order.id, next);
    refresh();
    addToast(res.ok ? t("toast.saved") : t("toast.error"), res.ok ? "success" : "error");
  };

  const collect = () => {
    if (!repos) return;
    markPaymentCollected(repos, order.id);
    refresh();
    addToast(t("toast.saved"), "success");
  };

  const cancel = () => {
    if (!repos) return;
    cancelOrder(repos, order.id, "Cancelled by admin");
    refresh();
    setConfirmCancel(false);
    addToast(t("toast.saved"), "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt, locale)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select className="w-44" value={order.status} onChange={(e) => update(e.target.value as OrderStatus)}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{orderStatusLabel(locale, s)}</option>
            ))}
          </Select>
          {order.paymentMethod === "cod" && order.paymentStatus === "pending" && (
            <Button variant="outline" onClick={collect}>Collect</Button>
          )}
          {order.status !== "cancelled" && order.status !== "delivered" && (
            <Button variant="destructive" onClick={() => setConfirmCancel(true)}>{t("common.cancel")}</Button>
          )}
          <Link href="/admin/orders"><Button variant="outline">← Back</Button></Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.customer.fullName}</p>
            <p className="text-muted-foreground">{order.customer.phone}</p>
            <p className="text-muted-foreground">{order.customer.address}, {order.customer.city}, {order.customer.district}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Payment</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{paymentMethodLabel(locale, order.paymentMethod)}</p>
            <Badge>{paymentStatusLabel(locale, order.paymentStatus)}</Badge>
            <p className="text-lg font-bold text-primary">{formatMoney(order.totalMinor, locale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Items</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.variantId} className="border-t">
                    <td className="px-3 py-2">{item.name.en}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.sku}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{formatMoney(item.priceMinor, locale)}</td>
                    <td className="px-3 py-2">{formatMoney(item.subtotalMinor, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 space-y-1 border-t pt-2 text-sm">
            <div className="flex justify-between"><span>{t("common.subtotal")}</span><span>{formatMoney(order.subtotalMinor, locale)}</span></div>
            <div className="flex justify-between"><span>{t("common.shipping")}</span><span>{formatMoney(order.shippingMinor, locale)}</span></div>
            <div className="flex justify-between"><span>{t("common.discount")}</span><span>-{formatMoney(order.discountMinor, locale)}</span></div>
            <div className="flex justify-between font-bold"><span>{t("common.total")}</span><span>{formatMoney(order.totalMinor, locale)}</span></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Status History</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {order.statusHistory.map((h, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <Badge>{orderStatusLabel(locale, h.status)}</Badge>
              <span className="text-xs text-muted-foreground">{formatDateTime(h.at, locale)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={confirmCancel} onClose={() => setConfirmCancel(false)} title={t("common.cancel")}>
        <p className="text-sm">Cancel this order? Inventory will be restocked.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmCancel(false)}>{t("common.cancel")}</Button>
          <Button variant="destructive" onClick={cancel}>{t("common.confirm")}</Button>
        </div>
      </Dialog>

    </div>
  );
}
