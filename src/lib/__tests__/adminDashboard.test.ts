import { describe, expect, it } from "vitest";
import { marginRows, monthProfit } from "@/lib/adminDashboard";
import { catalogRows } from "@/lib/catalogSql";

// Made-up costs: the real ones live only in the admin-only DB table.
describe("admin margins", () => {
  it("profit and margin ranges come from price − cost", () => {
    const rows = marginRows([{ name: "고품질 준최적 블로그 배포", costMin: 4_000, costMax: 6_000 }]);
    const r = rows.find((x) => x.name === "고품질 준최적 블로그 배포")!;
    expect(r.price).toBe(10_000);
    expect([r.profitMin, r.profitMax]).toEqual([4_000, 6_000]);
    expect(r.marginMin).toBeCloseTo(0.4);
  });

  it("lists every orderable row plus 견적 rows", () => {
    const names = marginRows([]).map((r) => r.name);
    for (const c of catalogRows()) expect(names).toContain(c.name);
    expect(marginRows([]).some((r) => r.price == null)).toBe(true);
  });

  it("month profit counts only products with a cost", () => {
    const p = monthProfit([
      { name: "a", orders: 1, qty: 2, revenue: 20_000, hasCost: true, costMin: 8_000, costMax: 12_000 },
      { name: "b", orders: 1, qty: 1, revenue: 5_000, hasCost: false, costMin: null, costMax: null },
    ]);
    expect(p).toEqual({ revenue: 25_000, costedRevenue: 20_000, profitMin: 8_000, profitMax: 12_000 });
  });
});
