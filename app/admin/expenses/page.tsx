"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Expense } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney } from "@/lib/format";
import { nowIso, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

export default function ExpensesPage() {
  const { locale, t } = useI18n();
  const { expenses, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [form, setForm] = useState<{ category: string; amount: string; date: string } | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repos || !form) return;
    const expense: Expense = {
      id: uid("exp"),
      category: form.category,
      amountMinor: Math.round(parseFloat(form.amount || "0") * 100),
      date: form.date || nowIso().slice(0, 10),
      isSample: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repos.expenses.save(expense);
    refresh();
    setForm(null);
    addToast(t("toast.saved"), "success");
  };

  const remove = (id: string) => {
    if (!repos) return;
    repos.expenses.remove(id);
    refresh();
    addToast(t("toast.deleted"), "success");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setForm({ category: "", amount: "", date: nowIso().slice(0, 10) })}>
          <Plus className="h-4 w-4" /> {t("admin.expenses")}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Category</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-4 py-2">{e.date}</td>
                <td className="px-4 py-2 font-medium">{e.category}</td>
                <td className="px-4 py-2">{formatMoney(e.amountMinor, locale)}</td>
                <td className="px-4 py-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(e.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!form} onClose={() => setForm(null)} title={t("admin.expenses")}>
        {form && (
          <form onSubmit={save} className="space-y-3">
            <div><Label className="mb-1 block">Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></div>
            <div><Label className="mb-1 block">Amount (৳)</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            <div><Label className="mb-1 block">Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
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
