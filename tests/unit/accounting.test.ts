import { describe, expect, it } from "vitest";
import { buildMemoryRepos } from "@/repositories";
import { profitLoss, cashFlow } from "@/services/accounting";

describe("accounting", () => {
  it("computes profit and loss from seeded data", () => {
    const repos = buildMemoryRepos();
    const pl = profitLoss(repos);
    expect(pl.grossSalesMinor).toBeGreaterThan(0);
    expect(pl.netSalesMinor).toBeGreaterThanOrEqual(0);
    expect(pl.expenseMinor).toBeGreaterThan(0);
  });

  it("computes cash flow without double-counting", () => {
    const repos = buildMemoryRepos();
    const cf = cashFlow(repos);
    // Seeded data has one COD collection to cash (inflow) and no cash outflows.
    expect(cf.inflowMinor).toBeGreaterThan(0);
    expect(cf.netMinor).toBe(cf.inflowMinor);
  });
});
