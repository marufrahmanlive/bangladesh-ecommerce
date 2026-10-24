"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Coupon, CouponType } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { nowIso, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

export default function CouponsPage() {
  const { t } = useI18n();
  const { coupons, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [form, setForm] = useState<{ code: string; type: CouponType; value: string } | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repos || !form) return;
    const value = parseFloat(form.value || "0");
    const coupon: Coupon = {
      id: uid("cpn"),
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: form.type === "percent" ? value : 0,
      valueMinor: form.type === "fixed" ? Math.round(value * 100) : 0,
      usageCount: 0,
      isActive: true,
      isSample: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repos.coupons.save(coupon);
    refresh();
    setForm(null);
    addToast(t("toast.saved"), "success");
  };

  const remove = (id: string) => {
    if (!repos) return;
    repos.coupons.remove(id);
    refresh();
    addToast(t("toast.deleted"), "success");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setForm({ code: "", type: "percent", value: "" })}>
          <Plus className="h-4 w-4" /> {t("admin.coupons")}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="px-4 py-2">Code</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Value</th><th className="px-4 py-2">Used</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2 font-medium">{c.code}</td>
                <td className="px-4 py-2">{c.type}</td>
                <td className="px-4 py-2">{c.type === "percent" ? `${c.value}%` : `৳${c.valueMinor / 100}`}</td>
                <td className="px-4 py-2">{c.usageCount}</td>
                <td className="px-4 py-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!form} onClose={() => setForm(null)} title={t("admin.coupons")}>
        {form && (
          <form onSubmit={save} className="space-y-3">
            <div><Label className="mb-1 block">Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
            <div><Label className="mb-1 block">Type</Label><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })}>
              <option value="percent">Percent</option><option value="fixed">Fixed</option><option value="free_shipping">Free Shipping</option>
            </Select></div>
            {form.type !== "free_shipping" && (
              <div><Label className="mb-1 block">Value ({form.type === "percent" ? "%" : "৳"})</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setForm(null)}>{t("common.cancel")}</Button>
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
