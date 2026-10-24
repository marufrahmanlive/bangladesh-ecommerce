"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { OrderStatus } from "@/types";
import { ORDER_STATUSES } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney } from "@/lib/format";
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from "@/lib/labels";
import { cancelOrder, markPaymentCollected, transitionStatus } from "@/services/order";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

export function OrdersAdmin() {
  const { locale, t } = useI18n();
  const { orders, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.fullName.toLowerCase().includes(q) ||
      o.customer.phone.includes(q);
    return matchesQuery && (!statusFilter || o.status === statusFilter);
  });

  const updateStatus = (id: string, next: OrderStatus) => {
    if (!repos) return;
    const res = transitionStatus(repos, id, next);
    refresh();
    addToast(res.ok ? t("toast.saved") : t("toast.error"), res.ok ? "success" : "error");
  };

  const collect = (id: string) => {
    if (!repos) return;
    markPaymentCollected(repos, id);
    refresh();
    addToast(t("toast.saved"), "success");
  };

  const cancel = () => {
    if (!repos || !cancelId) return;
    const res = cancelOrder(repos, cancelId, "Cancelled by admin");
    refresh();
    setCancelId(null);
    addToast(res.ok ? t("toast.saved") : t("toast.error"), res.ok ? "success" : "error");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search order, customer, phone..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select className="w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{orderStatusLabel(locale, s)}</option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Payment</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-2">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-primary">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-2">{o.customer.fullName}<p className="text-xs text-muted-foreground">{o.customer.phone}</p></td>
                <td className="px-4 py-2 font-semibold">{formatMoney(o.totalMinor, locale)}</td>
                <td className="px-4 py-2">
                  {paymentMethodLabel(locale, o.paymentMethod)}
                  <p className="text-xs text-muted-foreground">{paymentStatusLabel(locale, o.paymentStatus)}</p>
                </td>
                <td className="px-4 py-2"><Badge>{orderStatusLabel(locale, o.status)}</Badge></td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Select className="h-8 w-40 text-xs" value={o.status} onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}>
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{orderStatusLabel(locale, s)}</option>
                      ))}
                    </Select>
                    {o.paymentMethod === "cod" && o.paymentStatus === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => collect(o.id)}>Collect</Button>
                    )}
                    {o.status !== "cancelled" && o.status !== "delivered" && (
                      <Button size="sm" variant="destructive" onClick={() => setCancelId(o.id)}>{t("common.cancel")}</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!cancelId} onClose={() => setCancelId(null)} title={t("common.cancel")}>
        <p className="text-sm">Cancel this order? Inventory will be restocked.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCancelId(null)}>{t("common.cancel")}</Button>
          <Button variant="destructive" onClick={cancel}>{t("common.confirm")}</Button>
        </div>
      </Dialog>
    </div>
  );
}
