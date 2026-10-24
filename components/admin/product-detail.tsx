"use client";

import Link from "next/link";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { formatMoney } from "@/lib/format";
import { ProductImage } from "@/components/storefront/product-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductDetailAdmin({ productId }: { productId: string }) {
  const { locale } = useI18n();
  const { products, categories } = useCatalog();
  const product = products.find((p) => p.id === productId);
  const category = product ? categories.find((c) => c.id === product.categoryId) : undefined;

  if (!product)
    return (
      <div>
        <p className="text-muted-foreground">Product not found</p>
        <Link href="/admin/products"><Button variant="outline" className="mt-4">← Back</Button></Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{product.name.en}</h1>
        <Link href="/admin/products"><Button variant="outline">← Back</Button></Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-lg border">
          <ProductImage src={product.images[0]} alt={product.name.en} className="h-full w-full" />
        </div>
        <Card>
          <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">SKU:</span> {product.sku}</p>
            <p><span className="font-medium">Category:</span> {category?.name.en ?? "—"}</p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <Badge variant={product.isPublished ? "success" : "secondary"}>
                {product.isPublished ? "Published" : "Draft"}
              </Badge>
            </p>
            <div className="border-t pt-2">
              {product.variants.map((v) => (
                <div key={v.id} className="flex justify-between py-1">
                  <span className="text-muted-foreground">{v.sku} ({v.size ?? v.color ?? "Default"})</span>
                  <span>{formatMoney(v.offerPriceMinor, locale)} · Stock: {v.stock}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
