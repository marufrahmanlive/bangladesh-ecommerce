"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { formatMoney, formatDateTime } from "@/lib/format";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/labels";
import { getLowStockProducts } from "@/services/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Dashboard() {
  const { locale, t } = useI18n();
  const { orders, customers, repos, ready } = useCatalog();

  if (!ready || !repos) return <div className="min-h-[50vh]" />;

  const lowStock = getLowStockProducts(repos);
  const validOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "failed");
  const revenue = validOrders.reduce((acc, o) => acc + o.totalMinor, 0);
  const pendingPayments = orders.filter((o) => o.paymentStatus === "pending");

  const chartData = (() => {
    const byDate = new Map<string, number>();
    validOrders.forEach((o) => {
      const d = o.createdAt.slice(0, 10);
      byDate.set(d, (byDate.get(d) ?? 0) + o.totalMinor / 100);
    });
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date, total }));
  })();

  const cards = [
    { label: t("admin.revenue"), value: formatMoney(revenue, locale), icon: DollarSign },
    { label: t("admin.orders"), value: String(orders.length), icon: ShoppingCart },
    { label: t("admin.customers"), value: String(customers.length), icon: Users },
    { label: t("admin.lowStock"), value: String(lowStock.length), icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <c.icon className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.overview")}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.recentOrders")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orders.slice(0, 5).map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent"
              >
                <div>
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(o.createdAt, locale)}
                  </p>
                </div>
                <Badge>{orderStatusLabel(locale, o.status)}</Badge>
              </Link>
            ))}
            {orders.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.pendingPayments")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingPayments.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span className="font-medium">{o.orderNumber}</span>
                <span>{paymentStatusLabel(locale, o.paymentStatus)}</span>
              </div>
            ))}
            {pendingPayments.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.lowStock")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {lowStock.slice(0, 10).map((p) => (
            <Link
              key={p.id}
              href={`/admin/products/${p.id}`}
              className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4 text-warning" />
                {p.name.en}
              </span>
              <span className="text-muted-foreground">
                {p.variants.map((v) => `${v.size ?? v.color ?? ""}(${v.stock})`).join(", ")}
              </span>
            </Link>
          ))}
          {lowStock.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

