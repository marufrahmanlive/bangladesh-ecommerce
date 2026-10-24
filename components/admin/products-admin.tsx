"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Product } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney } from "@/lib/format";
import { localizedSlug, uniqueSlug, textMatches } from "@/lib/slug";
import { nowIso, uid } from "@/lib/utils";
import { productTotalStock } from "@/services/catalog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

interface FormState {
  id: string;
  nameEn: string;
  nameBn: string;
  sku: string;
  categoryId: string;
  regular: string;
  offer: string;
  cost: string;
  stock: string;
}

const emptyForm = (categoryId: string): FormState => ({
  id: "",
  nameEn: "",
  nameBn: "",
  sku: "",
  categoryId,
  regular: "",
  offer: "",
  cost: "",
  stock: "10",
});

export function ProductsAdmin() {
  const { locale, t: tr } = useI18n();
  const { products, categories, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = products.filter(
    (p) =>
      !query.trim() ||
      textMatches(p.name.en, query) ||
      textMatches(p.name.bn, query) ||
      textMatches(p.sku, query),
  );

  const openNew = () =>
    setForm(emptyForm(categories[0]?.id ?? ""));

  const openEdit = (p: Product) => {
    const v = p.variants[0];
    setForm({
      id: p.id,
      nameEn: p.name.en,
      nameBn: p.name.bn,
      sku: p.sku,
      categoryId: p.categoryId,
      regular: v ? String(v.regularPriceMinor / 100) : "",
      offer: v ? String(v.offerPriceMinor / 100) : "",
      cost: v ? String(v.costMinor / 100) : "",
      stock: v ? String(v.stock) : "0",
    });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repos || !form) return;
    const categoryId = form.categoryId || categories[0]?.id || "";
    const regular = Math.round(parseFloat(form.regular || "0") * 100);
    const offer = Math.round(parseFloat(form.offer || "0") * 100);
    const cost = Math.round(parseFloat(form.cost || "0") * 100);
    const stock = parseInt(form.stock || "0", 10);

    if (regular <= 0) {
      addToast("Invalid price", "error");
      return;
    }
    if (offer > regular) {
      addToast("Sale price cannot exceed regular price", "error");
      return;
    }
    const exists = repos.products
      .getAll()
      .some((p) => p.sku.toLowerCase() === form.sku.trim().toLowerCase() && p.id !== form.id);
    if (exists) {
      addToast("Duplicate SKU", "error");
      return;
    }

    if (form.id) {
      const existing = repos.products.getById(form.id);
      if (existing) {
        const base = uniqueSlug(
          localizedSlug({ en: form.nameEn, bn: form.nameBn }),
          (s) => repos.products.getAll().some((p) => p.slug === s && p.id !== form.id),
        );
        existing.name = { en: form.nameEn, bn: form.nameBn };
        existing.slug = base;
        existing.sku = form.sku.trim();
        existing.categoryId = categoryId;
        existing.updatedAt = nowIso();
        if (existing.variants[0]) {
          existing.variants[0].sku = form.sku.trim();
          existing.variants[0].regularPriceMinor = regular;
          existing.variants[0].offerPriceMinor = offer;
          existing.variants[0].costMinor = cost;
          existing.variants[0].stock = stock;
        }
        repos.products.save(existing);
      }
    } else {
      const product: Product = {
        id: uid("prod"),
        name: { en: form.nameEn, bn: form.nameBn },
        slug: uniqueSlug(
          localizedSlug({ en: form.nameEn, bn: form.nameBn }),
          (s) => repos.products.getAll().some((p) => p.slug === s),
        ),
        sku: form.sku.trim(),
        shortDescription: { en: form.nameEn, bn: form.nameBn },
        description: { en: form.nameEn, bn: form.nameBn },
        specifications: [],
        categoryId,
        images: [],
        variants: [
          {
            id: uid("v"),
            sku: form.sku.trim(),
            regularPriceMinor: regular,
            offerPriceMinor: offer,
            costMinor: cost,
            stock,
            lowStockThreshold: 5,
            isActive: true,
          },
        ],
        taxRate: 0,
        isFeatured: false,
        isBestSeller: false,
        isNew: true,
        isPublished: true,
        isArchived: false,
        isSample: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      repos.products.save(product);
    }
    refresh();
    setForm(null);
    addToast(tr("toast.saved"), "success");
  };

  const togglePublish = (p: Product) => {
    if (!repos) return;
    p.isPublished = !p.isPublished;
    p.updatedAt = nowIso();
    repos.products.save(p);
    refresh();
  };

  const remove = () => {
    if (!repos || !deleteId) return;
    repos.products.remove(deleteId);
    refresh();
    setDeleteId(null);
    addToast(tr("toast.deleted"), "success");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          {tr("admin.products")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const category = categories.find((c) => c.id === p.categoryId);
              return (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">
                    <Link href={`/products/${p.slug}`} className="font-medium hover:text-primary">
                      {p.name.en}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-2 text-muted-foreground">{category?.name.en ?? "—"}</td>
                  <td className="px-4 py-2">
                    {formatMoney(p.variants[0]?.offerPriceMinor ?? 0, locale)}
                  </td>
                  <td className="px-4 py-2">{productTotalStock(p)}</td>
                  <td className="px-4 py-2">
                    <Badge variant={p.isPublished ? "success" : "secondary"}>
                      {p.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => togglePublish(p)}>
                        {p.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  {tr("common.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit Product" : "New Product"}>
        {form && (
          <form onSubmit={save} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block">Name (English)</Label>
                <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
              </div>
              <div>
                <Label className="mb-1 block">Name (বাংলা)</Label>
                <Input value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block">SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
              </div>
              <div>
                <Label className="mb-1 block">Category</Label>
                <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name.en}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block">Regular Price (৳)</Label>
                <Input type="number" min="0" step="0.01" value={form.regular} onChange={(e) => setForm({ ...form, regular: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1 block">Offer Price (৳)</Label>
                <Input type="number" min="0" step="0.01" value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block">Cost (৳)</Label>
                <Input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1 block">Stock</Label>
                <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setForm(null)}>
                {tr("common.cancel")}
              </Button>
              <Button type="submit">{tr("common.save")}</Button>
            </div>
          </form>
        )}
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title={tr("common.delete")}>
        <p className="text-sm">Delete this product? This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            {tr("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={remove}>
            {tr("common.confirm")}
          </Button>
        </div>
      </Dialog>

    </div>
  );
}

