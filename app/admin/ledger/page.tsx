"use client";

import { useState } from "react";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { formatMoney } from "@/lib/format";
import { Select } from "@/components/ui/input";

const ACCOUNTS = ["cash", "bank", "receivable", "payable", "sales", "purchases", "expenses", "income"];

export default function LedgerPage() {
  const { locale, t } = useI18n();
  const { accounting } = useCatalog();
  const [account, setAccount] = useState("");

  const filtered = accounting.filter((e) => !account || e.account === account);
  const rows = filtered.reduce<Array<(typeof filtered)[number] & { running: number }>>(
    (acc, e) => {
      const running = (acc.length ? acc[acc.length - 1].running : 0) + e.amountMinor;
      return [...acc, { ...e, running }];
    },
    [],
  );
  const balance = rows.length ? rows[rows.length - 1].running : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select className="w-52" value={account} onChange={(e) => setAccount(e.target.value)}>
          <option value="">All accounts</option>
          {ACCOUNTS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
        <span className="text-sm font-semibold">
          Balance: {formatMoney(balance, locale)}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Account</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Running</th>
              <th className="px-4 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-4 py-2">{e.date}</td>
                <td className="px-4 py-2">{e.type}</td>
                <td className="px-4 py-2">{e.account}</td>
                <td className={`px-4 py-2 ${e.amountMinor < 0 ? "text-destructive" : "text-success"}`}>
                  {formatMoney(e.amountMinor, locale)}
                </td>
                <td className="px-4 py-2">{formatMoney(e.running, locale)}</td>
                <td className="px-4 py-2 text-muted-foreground">{e.description}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

