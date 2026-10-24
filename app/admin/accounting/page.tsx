"use client";

import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { formatMoney } from "@/lib/format";
import { profitLoss, cashFlow, accountBalance } from "@/services/accounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountingPage() {
  const { locale } = useI18n();
  const { repos } = useCatalog();
  if (!repos) return <div className="min-h-[40vh]" />;
  const pl = profitLoss(repos);
  const cf = cashFlow(repos);
  const cash = accountBalance(repos, "cash");

  const rows = [
    { label: "Gross Sales", value: pl.grossSalesMinor },
    { label: "Discounts", value: -pl.discountMinor },
    { label: "Net Sales", value: pl.netSalesMinor },
    { label: "Cost of Goods Sold", value: -pl.cogsMinor },
    { label: "Gross Profit", value: pl.grossProfitMinor },
    { label: "Other Income", value: pl.otherIncomeMinor },
    { label: "Expenses", value: -pl.expenseMinor },
    { label: "Net Profit", value: pl.netProfitMinor, bold: true },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Profit &amp; Loss</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {rows.map((r) => (
            <div key={r.label} className={`flex justify-between text-sm ${r.bold ? "border-t pt-2 font-bold" : ""}`}>
              <span>{r.label}</span>
              <span className={r.value < 0 ? "text-destructive" : ""}>{formatMoney(r.value, locale)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Cash Balance</CardTitle></CardHeader>
          <CardContent className="text-xl font-bold">{formatMoney(cash, locale)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Cash Inflow</CardTitle></CardHeader>
          <CardContent className="text-xl font-bold text-success">{formatMoney(cf.inflowMinor, locale)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Cash Outflow</CardTitle></CardHeader>
          <CardContent className="text-xl font-bold text-destructive">{formatMoney(cf.outflowMinor, locale)}</CardContent>
        </Card>
      </div>
    </div>
  );
}
