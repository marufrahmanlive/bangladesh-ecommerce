"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Customer } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { nowIso, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

export default function CustomersPage() {
  const { t } = useI18n();
  const { customers, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repos) return;
    const customer: Customer = {
      id: uid("cus"),
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      addresses: form.address ? [{ id: uid("addr"), fullName: form.name, phone: form.phone, district: "Dhaka", city: "", address: form.address }] : [],
      status: "active",
      isSample: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repos.customers.save(customer);
    refresh();
    setForm({ name: "", phone: "", email: "", address: "" });
    addToast(t("toast.saved"), "success");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setForm({ name: "", phone: "", email: "", address: "" })}>
          <Plus className="h-4 w-4" /> {t("admin.customers")}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Phone</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Status</th></tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2">{c.phone}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.email ?? "—"}</td>
                <td className="px-4 py-2">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!form} onClose={() => setForm({ name: "", phone: "", email: "", address: "" })} title={t("admin.customers")}>
        <form onSubmit={save} className="space-y-3">
          <div><Label className="mb-1 block">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label className="mb-1 block">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
          <div><Label className="mb-1 block">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="mb-1 block">Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setForm({ name: "", phone: "", email: "", address: "" })}>{t("common.cancel")}</Button>
            <Button type="submit">{t("common.save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
