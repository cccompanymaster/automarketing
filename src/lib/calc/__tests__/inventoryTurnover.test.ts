import { describe, expect, it } from "vitest";
import { calcInventoryTurnover } from "../inventoryTurnover";

describe("calcInventoryTurnover", () => {
  it("normal month", () => {
    const r = calcInventoryTurnover({ period: "month", cogs: 6_000_000, beginInventory: 2_000_000, endInventory: 1_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.avgInventory).toBe(1_500_000);
    expect(r.value.turnover).toBeCloseTo(4);
    expect(r.value.days).toBeCloseTo(7.5);
    expect(r.value.annualTurnover).toBeCloseTo(48);
  });
  it("quarter uses 91 days, year 365", () => {
    const q = calcInventoryTurnover({ period: "quarter", cogs: 1000, beginInventory: 1000, endInventory: 1000 });
    if (q.status !== "ok") throw new Error(q.status);
    expect(q.value.days).toBeCloseTo(91);
    expect(q.value.annualTurnover).toBeCloseTo(4);
    const y = calcInventoryTurnover({ period: "year", cogs: 3650, beginInventory: 500, endInventory: 500 });
    if (y.status !== "ok") throw new Error(y.status);
    expect(y.value.turnover).toBeCloseTo(7.3);
    expect(y.value.days).toBeCloseTo(50);
  });
  it("one side 0 → warning", () => {
    const r = calcInventoryTurnover({ period: "month", cogs: 100, beginInventory: 0, endInventory: 200 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.turnover).toBe(1);
    expect(r.warnings.length).toBe(1);
  });
  it("slow stock → warning", () => {
    const r = calcInventoryTurnover({ period: "month", cogs: 100, beginInventory: 1000, endInventory: 1000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.days).toBeCloseTo(300);
    expect(r.warnings.some((w) => w.includes("3배"))).toBe(true);
  });
  it("average 0 → impossible", () => {
    expect(calcInventoryTurnover({ period: "month", cogs: 100, beginInventory: 0, endInventory: 0 }).status).toBe("impossible");
  });
  it("empty / invalid", () => {
    expect(calcInventoryTurnover({ period: "month", cogs: null, beginInventory: 1, endInventory: 1 }).status).toBe("empty");
    expect(calcInventoryTurnover({ period: "month", cogs: 0, beginInventory: 1, endInventory: 1 }).status).toBe("invalid");
    expect(calcInventoryTurnover({ period: "month", cogs: 1, beginInventory: -1, endInventory: 1 }).status).toBe("invalid");
  });
  it("tiny / huge values finite", () => {
    const r = calcInventoryTurnover({ period: "year", cogs: 1e13, beginInventory: 1, endInventory: 0 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(Number.isFinite(r.value.days)).toBe(true);
  });
});
