"use client";

import { Eye, EyeOff, Star } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { nowIso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReviewsPage() {
  const { t } = useI18n();
  const { reviews, products, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);

  const toggleHidden = (id: string) => {
    if (!repos) return;
    const review = repos.reviews.getById(id);
    if (!review) return;
    review.hidden = !review.hidden;
    review.updatedAt = nowIso();
    repos.reviews.save(review);
    refresh();
    addToast(t("toast.saved"), "success");
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="px-4 py-2">Product</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Rating</th><th className="px-4 py-2">Comment</th><th className="px-4 py-2">Actions</th></tr>
          </thead>
          <tbody>
            {reviews.map((r) => {
              const product = products.find((p) => p.id === r.productId);
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{product?.name.en ?? r.productId}</td>
                  <td className="px-4 py-2">{r.customerName}</td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" /> {r.rating}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{r.comment.slice(0, 60)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {r.hidden && <Badge variant="secondary">Hidden</Badge>}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleHidden(r.id)}>
                        {r.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {reviews.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
