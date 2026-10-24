"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney, formatDateTime } from "@/lib/format";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/labels";
import { postEntry } from "@/services/accounting";
import { nowIso, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

type Mode = "customer" | "supplier" | "refund";

export default function PaymentsPage() {
  const { locale, t } = useI18n();
  const { orders, suppliers, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [mode, setMode] = useState<Mode | null>(null);
  const [form, setForm] = useState({ orderId: "", supplierId: "", amount: "", method: "cash" });

  const payments = orders.flatMap((o) =>
    o.payments.map((p) => ({ ...p, orderNumber: o.orderNumber })),
  );

  const open = (m: Mode) => {
    setMode(m);
    setForm({ orderId: orders[0]?.id ?? "", supplierId: suppliers[0]?.id ?? "", amount: "", method: "cash" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repos || !mode) return;
    const amount = Math.round(parseFloat(form.amount || "0") * 100);
    if (amount <= 0) {
      addToast(t("toast.error"), "error");
      return;
    }
    if (mode === "customer") {
      const order = repos.orders.getById(form.orderId);
      if (!order) return;
      postEntry(repos, {
        date: nowIso().slice(0, 10),
        type: "customer_payment",
        account: form.method === "bank" ? "bank" : "cash",
        amountMinor: amount,
        referenceType: "order",
        referenceId: order.id,
        description: `Payment for ${order.orderNumber}`,
      });
      order.paymentStatus = "paid";
      order.payments.push({
        id: uid("pay"),
        method: order.paymentMethod,
        status: "paid",
        amountMinor: amount,
        reference: `MANUAL-${Date.now().toString().slice(-6)}`,
        at: nowIso(),
      });
      order.updatedAt = nowIso();
      repos.orders.save(order);
    } else if (mode === "supplier") {
      postEntry(repos, {
        date: nowIso().slice(0, 10),
        type: "supplier_payment",
        account: "cash",
        amountMinor: -amount,
        referenceType: "supplier",
        referenceId: form.supplierId,
        description: "Supplier payment",
      });
    } else {
      const order = repos.orders.getById(form.orderId);
      if (!order) return;
      postEntry(repos, {
        date: nowIso().slice(0, 10),
        type: "refund",
        account: "cash",
        amountMinor: -amount,
        referenceType: "order",
        referenceId: order.id,
        description: `Refund for ${order.orderNumber}`,
      });
      order.paymentStatus = "refunded";
      order.updatedAt = nowIso();
      repos.orders.save(order);
    }
    refresh();
    setMode(null);
    addToast(t("toast.saved"), "success");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => open("customer")}>
          <Plus className="h-4 w-4" /> Customer Payment
        </Button>
        <Button variant="outline" onClick={() => open("supplier")}>
          <Plus className="h-4 w-4" /> Supplier Payment
        </Button>
        <Button variant="outline" onClick={() => open("refund")}>
          <Plus className="h-4 w-4" /> Refund
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="px-4 py-2">Order</th><th className="px-4 py-2">Method</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Reference</th><th className="px-4 py-2">Date</th></tr>
          </thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2 font-medium">{p.orderNumber}</td>
                <td className="px-4 py-2">{paymentMethodLabel(locale, p.method)}</td>
                <td className="px-4 py-2">{formatMoney(p.amountMinor, locale)}</td>
                <td className="px-4 py-2">{paymentStatusLabel(locale, p.status)}</td>
                <td className="px-4 py-2 text-muted-foreground">{p.reference ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{formatDateTime(p.at, locale)}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={mode !== null} onClose={() => setMode(null)} title="Record Payment">
        {mode && (
          <form onSubmit={submit} className="space-y-3">
            {mode !== "supplier" ? (
              <div>
                <Label className="mb-1 block">Order</Label>
                <Select value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>{o.orderNumber}</option>
                  ))}
                </Select>
              </div>
            ) : (
              <div>
                <Label className="mb-1 block">Supplier</Label>
                <Select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label className="mb-1 block">Amount (৳)</Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            {mode === "customer" && (
              <div>
                <Label className="mb-1 block">Account</Label>
                <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMode(null)}>{t("common.cancel")}</Button>
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}

