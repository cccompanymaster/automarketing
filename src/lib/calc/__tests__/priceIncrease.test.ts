import { describe, expect, it } from "vitest";
import { calcPriceIncrease } from "../priceIncrease";

const base = { currentPrice: 10000, newPrice: 11000, cost: 6000, monthlyQty: 1000 };

describe("calcPriceIncrease", () => {
  it("normal: 10,000 → 11,000, cost 6,000, 1,000개", () => {
    const r = calcPriceIncrease(base);
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.unitProfitBefore).toBe(4000);
    expect(r.value.unitProfitAfter).toBe(5000);
    expect(r.value.monthlyProfitBefore).toBe(4_000_000);
    expect(r.value.requiredQty).toBe(800);
    expect(r.value.allowedDropQty).toBe(200);
    expect(r.value.allowedDropRate).toBeCloseTo(0.2);
    expect(r.value.mustSellMore).toBe(false);
    expect(r.value.monthlyProfitAfterSameQty).toBe(5_000_000);
  });
  it("rounds required quantity up", () => {
    // before 4,000×1,000 = 4,000,000; after 11,500−6,000 = 5,500 → 727.27 → 728
    const r = calcPriceIncrease({ ...base, newPrice: 11500 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.requiredQty).toBe(728);
    expect(r.value.allowedDropQty).toBe(272);
  });
  it("fee %, per-order cost, new cost, extra fixed", () => {
    const r = calcPriceIncrease({ ...base, feePct: 10, perOrderCost: 500, newCost: 6500, extraFixed: 100_000 });
    if (r.status !== "ok") throw new Error(r.status);
    // before: 10,000 − 1,000 − 6,000 − 500 = 2,500; after: 11,000 − 1,100 − 6,500 − 500 = 2,900
    expect(r.value.unitProfitBefore).toBe(2500);
    expect(r.value.unitProfitAfter).toBeCloseTo(2900);
    // (2,500,000 + 100,000) / 2,900 = 896.55 → 897
    expect(r.value.requiredQty).toBe(897);
  });
  it("must sell more when new cost eats the increase", () => {
    const r = calcPriceIncrease({ ...base, newCost: 7500 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.unitProfitAfter).toBe(3500);
    expect(r.value.mustSellMore).toBe(true);
    expect(r.value.requiredQty).toBe(1143); // 1142.86
    expect(r.value.extraQtyNeeded).toBe(143);
    expect(r.value.allowedDropRate).toBeLessThan(0);
    expect(r.warnings.some((w) => w.includes("더 팔아야"))).toBe(true);
  });
  it("must sell more because of extra fixed cost", () => {
    const r = calcPriceIncrease({ ...base, newPrice: 10100, extraFixed: 1_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.mustSellMore).toBe(true);
    expect(r.warnings.some((w) => w.includes("고정비"))).toBe(true);
  });
  it("unit profit after ≤ 0 → impossible with partial", () => {
    const r = calcPriceIncrease({ ...base, newCost: 11000 });
    expect(r.status).toBe("impossible");
    if (r.status === "impossible") expect(r.partial?.unitProfitAfter).toBe(0);
  });
  it("currently losing → required qty clamps at 0", () => {
    const r = calcPriceIncrease({ currentPrice: 5000, newPrice: 9000, cost: 6000, monthlyQty: 100 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.requiredQty).toBe(0);
    expect(r.value.allowedDropRate).toBe(1);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it("empty / invalid", () => {
    expect(calcPriceIncrease({ ...base, monthlyQty: null }).status).toBe("empty");
    expect(calcPriceIncrease({ ...base, monthlyQty: 0 }).status).toBe("invalid");
    expect(calcPriceIncrease({ ...base, feePct: 100 }).status).toBe("invalid");
    expect(calcPriceIncrease({ ...base, cost: -1 }).status).toBe("invalid");
    expect(calcPriceIncrease({ ...base, newPrice: 0 }).status).toBe("invalid");
  });
  it("same price → warning, no change needed", () => {
    const r = calcPriceIncrease({ ...base, newPrice: 10000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.requiredQty).toBe(1000);
    expect(r.value.allowedDropQty).toBe(0);
    expect(r.warnings.length).toBe(1);
  });
});
