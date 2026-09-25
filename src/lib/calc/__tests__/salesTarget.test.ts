import { describe, expect, it } from "vitest";
import { calcSalesTarget } from "../salesTarget";

describe("calcSalesTarget", () => {
  it("normal: 목표 300만 + 고정비 700만, 변동비 60% → 2,500만", () => {
    const r = calcSalesTarget({ targetProfit: 3_000_000, fixedCost: 7_000_000, variablePct: 60, avgTicket: 25000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.sales).toBe(25_000_000);
    expect(r.value.breakevenSales).toBe(17_500_000);
    expect(r.value.salesAboveBreakeven).toBe(7_500_000);
    expect(r.value.orders).toBe(1000);
    expect(r.value.dailyOrders).toBe(34); // 33.3
    expect(r.value.variableCost).toBeCloseTo(15_000_000);
    expect(r.value.contribution - r.value.fixedCost).toBeCloseTo(3_000_000);
  });
  it("rounds up", () => {
    const r = calcSalesTarget({ targetProfit: 1_000_000, fixedCost: 1_000_000, variablePct: 35, avgTicket: 17000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.sales).toBe(3_076_924); // 3,076,923.08
    expect(r.value.orders).toBe(181); // 180.99
  });
  it("target 0 → equals breakeven", () => {
    const r = calcSalesTarget({ targetProfit: 0, fixedCost: 7_000_000, variablePct: 30 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.sales).toBe(r.value.breakevenSales);
    expect(r.value.orders).toBeNull();
  });
  it("all zero → 0 with warning", () => {
    const r = calcSalesTarget({ targetProfit: 0, fixedCost: 0, variablePct: 30 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.sales).toBe(0);
    expect(r.warnings.length).toBe(1);
  });
  it("variable ≥ 100% → impossible", () => {
    expect(calcSalesTarget({ targetProfit: 1, fixedCost: 1, variablePct: 100 }).status).toBe("impossible");
  });
  it("empty / invalid", () => {
    expect(calcSalesTarget({ targetProfit: null, fixedCost: 1, variablePct: 30 }).status).toBe("empty");
    expect(calcSalesTarget({ targetProfit: -1, fixedCost: 1, variablePct: 30 }).status).toBe("invalid");
    expect(calcSalesTarget({ targetProfit: 1, fixedCost: 1, variablePct: 30, avgTicket: -5 }).status).toBe("invalid");
  });
  it("huge values finite", () => {
    const r = calcSalesTarget({ targetProfit: 1e12, fixedCost: 1e12, variablePct: 99.9, avgTicket: 1 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(Number.isFinite(r.value.orders!)).toBe(true);
  });
});
