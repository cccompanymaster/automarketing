import { describe, expect, it } from "vitest";
import { calcBreakeven } from "../breakeven";

describe("calcBreakeven", () => {
  it("normal: 고정비 700만, 변동비 30% → 1,000만", () => {
    const r = calcBreakeven({ fixedCost: 7_000_000, variablePct: 30, avgTicket: 20000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.contributionRate).toBeCloseTo(0.7);
    expect(r.value.sales).toBe(10_000_000);
    expect(r.value.orders).toBe(500);
    expect(r.value.businessDays).toBe(30);
    expect(r.value.dailyOrdersExact).toBeCloseTo(16.667, 2);
    expect(r.value.dailyOrders).toBe(17);
    expect(r.value.dailySales).toBe(333_334);
  });
  it("rounds sales and orders up", () => {
    const r = calcBreakeven({ fixedCost: 1_000_000, variablePct: 35, avgTicket: 15000, businessDays: 26 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.sales).toBe(1_538_462); // 1,538,461.5…
    expect(r.value.orders).toBe(103); // 102.56
    expect(r.value.dailyOrders).toBe(4);
  });
  it("variable 0% → sales = fixed cost", () => {
    const r = calcBreakeven({ fixedCost: 500_000, variablePct: 0 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.sales).toBe(500_000);
    expect(r.value.orders).toBeNull();
  });
  it("variable ≥ 100% → impossible", () => {
    expect(calcBreakeven({ fixedCost: 1, variablePct: 100 }).status).toBe("impossible");
    expect(calcBreakeven({ fixedCost: 1, variablePct: 150 }).status).toBe("impossible");
  });
  it("high variable rate → warning, still finite", () => {
    const r = calcBreakeven({ fixedCost: 1e10, variablePct: 99.99 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(Number.isFinite(r.value.sales)).toBe(true);
    expect(r.warnings.length).toBe(1);
  });
  it("empty / invalid", () => {
    expect(calcBreakeven({ fixedCost: null, variablePct: 30 }).status).toBe("empty");
    expect(calcBreakeven({ fixedCost: 0, variablePct: 30 }).status).toBe("invalid");
    expect(calcBreakeven({ fixedCost: 100, variablePct: -1 }).status).toBe("invalid");
    expect(calcBreakeven({ fixedCost: 100, variablePct: 30, avgTicket: 0 }).status).toBe("invalid");
    expect(calcBreakeven({ fixedCost: 100, variablePct: 30, businessDays: 0 }).status).toBe("invalid");
    expect(calcBreakeven({ fixedCost: 100, variablePct: 30, businessDays: 32 }).status).toBe("invalid");
  });
});
