"use client";

import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { formatMoney } from "@/lib/format";
import { profitLoss } from "@/services/accounting";
import { inventoryValuation } from "@/services/inventory";
import { paymentMethodLabel } from "@/lib/labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  const { locale } = useI18n();
  const { repos, orders } = useCatalog();
  if (!repos) return <div className="min-h-[40vh]" />;
  const pl = profitLoss(repos);
  const valuation = inventoryValuation(repos);

  const byMethod = new Map<string, number>();
  let discountTotal = 0;
  orders.forEach((o) => {
    if (o.status === "cancelled" || o.status === "failed") return;
    byMethod.set(o.paymentMethod, (byMethod.get(o.paymentMethod) ?? 0) + o.totalMinor);
    discountTotal += o.discountMinor;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Net Sales</CardTitle></CardHeader><CardContent className="text-xl font-bold">{formatMoney(pl.netSalesMinor, locale)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Gross Profit</CardTitle></CardHeader><CardContent className="text-xl font-bold">{formatMoney(pl.grossProfitMinor, locale)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Net Profit</CardTitle></CardHeader><CardContent className="text-xl font-bold">{formatMoney(pl.netProfitMinor, locale)}</CardContent></Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Total Discounts</CardTitle></CardHeader><CardContent className="text-xl font-bold">{formatMoney(discountTotal, locale)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Tax (0%)</CardTitle></CardHeader><CardContent className="text-xl font-bold">{formatMoney(0, locale)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Orders</CardTitle></CardHeader><CardContent className="text-xl font-bold">{orders.length}</CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Sales by Payment Method</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {Array.from(byMethod.entries()).map(([method, total]) => (
              <div key={method} className="flex justify-between text-sm">
                <span>{paymentMethodLabel(locale, method as never)}</span>
                <span>{formatMoney(total, locale)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Inventory Valuation</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Cost Value</span><span>{formatMoney(valuation.totalCostMinor, locale)}</span></div>
            <div className="flex justify-between"><span>Retail Value</span><span>{formatMoney(valuation.totalRetailMinor, locale)}</span></div>
            <div className="flex justify-between"><span>Units</span><span>{valuation.unitCount}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
