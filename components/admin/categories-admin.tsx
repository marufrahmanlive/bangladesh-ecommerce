"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Category } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { slugify, uniqueSlug } from "@/lib/slug";
import { nowIso, uid } from "@/lib/utils";
import { getChildren } from "@/services/catalog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

export function CategoriesAdmin() {
  const { t } = useI18n();
  const { categories, products, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [form, setForm] = useState<{ nameEn: string; nameBn: string; parentId: string } | null>(null);

  const productCount = (id: string) => products.filter((p) => p.categoryId === id).length;
  const childCount = (id: string) => getChildren(categories, id).length;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repos || !form) return;
    const slug = uniqueSlug(
      slugify(form.nameEn || form.nameBn),
      (s) => categories.some((c) => c.slug === s),
    );
    const category: Category = {
      id: uid("cat"),
      name: { en: form.nameEn, bn: form.nameBn },
      slug,
      parentId: form.parentId || null,
      order: 0,
      isActive: true,
      isSample: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repos.categories.save(category);
    refresh();
    setForm(null);
    addToast(t("toast.saved"), "success");
  };

  const remove = (id: string) => {
    if (!repos) return;
    if (childCount(id) > 0) {
      addToast("Category has child categories", "error");
      return;
    }
    if (productCount(id) > 0) {
      addToast("Category has products", "error");
      return;
    }
    repos.categories.remove(id);
    refresh();
    addToast(t("toast.deleted"), "success");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setForm({ nameEn: "", nameBn: "", parentId: "" })}>
          <Plus className="h-4 w-4" />
          {t("admin.categories")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Parent</th>
              <th className="px-4 py-2">Products</th>
              <th className="px-4 py-2">Children</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2 font-medium">{c.name.en}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {c.parentId ? categories.find((x) => x.id === c.parentId)?.name.en ?? "—" : "—"}
                </td>
                <td className="px-4 py-2">{productCount(c.id)}</td>
                <td className="px-4 py-2">{childCount(c.id)}</td>
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

      <Dialog open={!!form} onClose={() => setForm(null)} title={t("admin.categories")}>
        {form && (
          <form onSubmit={save} className="space-y-3">
            <div>
              <Label className="mb-1 block">Name (English)</Label>
              <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
            </div>
            <div>
              <Label className="mb-1 block">Name (বাংলা)</Label>
              <Input value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block">Parent</Label>
              <Select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">None (top-level)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name.en}</option>
                ))}
              </Select>
            </div>
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
