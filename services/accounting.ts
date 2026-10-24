import type {
  AccountingEntry,
  EntryType,
  LedgerAccount,
  MoneyMinor,
} from "@/types";
import type { Repos } from "@/repositories";
import { nowIso, uid } from "@/lib/utils";

export type NewAccountingEntry = Omit<
  AccountingEntry,
  "id" | "createdAt" | "updatedAt" | "isSample"
> & { isSample?: boolean };

export function postEntry(repos: Repos, input: NewAccountingEntry): AccountingEntry {
  const entry: AccountingEntry = {
    id: uid("acc"),
    isSample: input.isSample ?? false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...input,
  };
  repos.accounting.save(entry);
  return entry;
}

function inRange(iso: string, from?: string, to?: string): boolean {
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

export function accountBalance(
  repos: Repos,
  account: LedgerAccount,
  from?: string,
  to?: string,
): MoneyMinor {
  return repos.accounting
    .getAll()
    .filter((e) => e.account === account && inRange(e.date, from, to))
    .reduce((acc, e) => acc + e.amountMinor, 0);
}

export function sumByType(
  repos: Repos,
  type: EntryType,
  from?: string,
  to?: string,
): MoneyMinor {
  return repos.accounting
    .getAll()
    .filter((e) => e.type === type && inRange(e.date, from, to))
    .reduce((acc, e) => acc + e.amountMinor, 0);
}

export interface ProfitLossReport {
  grossSalesMinor: MoneyMinor;
  discountMinor: MoneyMinor;
  netSalesMinor: MoneyMinor;
  cogsMinor: MoneyMinor;
  grossProfitMinor: MoneyMinor;
  otherIncomeMinor: MoneyMinor;
  expenseMinor: MoneyMinor;
  netProfitMinor: MoneyMinor;
}

export function profitLoss(repos: Repos, from?: string, to?: string): ProfitLossReport {
  const orders = repos.orders
    .getAll()
    .filter(
      (o) =>
        o.status !== "cancelled" &&
        o.status !== "failed" &&
        o.status !== "refunded" &&
        inRange(o.createdAt.slice(0, 10), from, to),
    );

  const grossSalesMinor = orders.reduce((acc, o) => acc + o.subtotalMinor, 0);
  const discountMinor = orders.reduce((acc, o) => acc + o.discountMinor, 0);
  const netSalesMinor = Math.max(0, grossSalesMinor - discountMinor);

  let cogsMinor = 0;
  const products = new Map(repos.products.getAll().map((p) => [p.id, p]));
  for (const o of orders) {
    for (const item of o.items) {
      const variant = products.get(item.productId)?.variants.find(
        (v) => v.id === item.variantId,
      );
      cogsMinor += (variant?.costMinor ?? 0) * item.quantity;
    }
  }

  const expenseMinor = repos.expenses
    .getAll()
    .filter((e) => inRange(e.date, from, to))
    .reduce((acc, e) => acc + e.amountMinor, 0);

  const otherIncomeMinor = sumByType(repos, "income", from, to);

  const grossProfitMinor = netSalesMinor - cogsMinor;
  const netProfitMinor = grossProfitMinor + otherIncomeMinor - expenseMinor;

  return {
    grossSalesMinor,
    discountMinor,
    netSalesMinor,
    cogsMinor,
    grossProfitMinor,
    otherIncomeMinor,
    expenseMinor,
    netProfitMinor,
  };
}

export interface CashFlowReport {
  inflowMinor: MoneyMinor;
  outflowMinor: MoneyMinor;
  netMinor: MoneyMinor;
}

export function cashFlow(repos: Repos, from?: string, to?: string): CashFlowReport {
  const cash = accountBalance(repos, "cash", from, to);
  const bank = accountBalance(repos, "bank", from, to);
  const inflowMinor = Math.max(0, cash) + Math.max(0, bank);
  const outflowMinor = Math.abs(Math.min(0, cash) + Math.min(0, bank));
  return { inflowMinor, outflowMinor, netMinor: cash + bank };
}
