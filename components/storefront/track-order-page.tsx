"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Order } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { formatMoney, formatDateTime } from "@/lib/format";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function TrackOrderPage() {
  const { locale, t } = useI18n();
  const { orders } = useCatalog();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find(
      (o) => o.orderNumber.toLowerCase() === query.trim().toLowerCase(),
    );
    setFound(order ?? null);
    setSearched(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">{t("order.trackTitle")}</h1>
      <form onSubmit={search} className="flex gap-2">
        <Input
          placeholder={t("order.trackPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit">
          <Search className="h-4 w-4" />
          {t("common.search")}
        </Button>
      </form>

      {searched && !found && (
        <p className="mt-6 text-center text-muted-foreground">{t("order.notFound")}</p>
      )}

      {found && (
        <Card className="mt-6">
          <CardContent className="space-y-2 p-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{found.orderNumber}</span>
              <Badge>{orderStatusLabel(locale, found.status)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("order.date")}: {formatDateTime(found.createdAt, locale)}
            </p>
            <p className="text-sm">
              {t("order.payment")}: {paymentStatusLabel(locale, found.paymentStatus)}
            </p>
            <p className="text-lg font-bold text-primary">
              {formatMoney(found.totalMinor, locale)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
