"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Supplier } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { nowIso, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

export default function SuppliersPage() {
  const { t } = useI18n();
  const { suppliers, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repos) return;
    const supplier: Supplier = {
      id: uid("sup"),
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      openingBalanceMinor: 0,
      isActive: true,
      isSample: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repos.suppliers.save(supplier);
    refresh();
    setForm({ name: "", phone: "", email: "" });
    addToast(t("toast.saved"), "success");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setForm({ name: "", phone: "", email: "" })}>
          <Plus className="h-4 w-4" /> {t("admin.suppliers")}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Contact</th><th className="px-4 py-2">Phone</th><th className="px-4 py-2">Status</th></tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-2 font-medium">{s.name}</td>
                <td className="px-4 py-2">{s.contactPerson ?? "—"}</td>
                <td className="px-4 py-2">{s.phone ?? "—"}</td>
                <td className="px-4 py-2">{s.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!form} onClose={() => setForm({ name: "", phone: "", email: "" })} title={t("admin.suppliers")}>
        <form onSubmit={save} className="space-y-3">
          <div><Label className="mb-1 block">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label className="mb-1 block">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label className="mb-1 block">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setForm({ name: "", phone: "", email: "" })}>{t("common.cancel")}</Button>
            <Button type="submit">{t("common.save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
