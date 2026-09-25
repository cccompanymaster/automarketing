import { describe, expect, it } from "vitest";
import { promotion, type PromotionInput } from "../promotion";

const base: PromotionInput = {
  profitPerOrder: 3000,
  monthlyOrders: 1000,
  couponAmount: 3000,
  couponOwnerPct: 100,
  couponUsagePct: 30,
  reviewCost: 2000,
  reviewPct: 20,
  monthlyFixed: 200000,
};

function okValue(input: PromotionInput) {
  const r = promotion(input);
  if (r.status !== "ok") throw new Error(`${r.status}: ${JSON.stringify(r)}`);
  return r;
}

describe("promotion", () => {
  it("normal: averages, break-even orders (rounded up) and growth", () => {
    const v = okValue(base).value;
    expect(v.avgCoupon).toBeCloseTo(900);
    expect(v.avgReview).toBeCloseTo(400);
    expect(v.afterProfitPerOrder).toBeCloseTo(1700);
    expect(v.baseMonthlyProfit).toBe(3_000_000);
    expect(v.breakEvenOrders).toBe(1883); // 3,200,000 ÷ 1,700 = 1,882.35…
    expect(v.extraOrders).toBe(883);
    expect(v.extraRate).toBeCloseTo(0.883);
    expect(v.monthlyProfitIfFlat).toBeCloseTo(1700 * 1000 - 200000);
  });
  it("exact division is not bumped up", () => {
    const v = okValue({ profitPerOrder: 2000, monthlyOrders: 100, couponAmount: 1000, couponOwnerPct: 100, couponUsagePct: 100 }).value;
    expect(v.breakEvenOrders).toBe(200);
  });
  it("no event cost → break-even at current orders with warning", () => {
    const r = okValue({ profitPerOrder: 3000, monthlyOrders: 500 });
    expect(r.value.breakEvenOrders).toBe(500);
    expect(r.value.extraOrders).toBe(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it("blank rates count as 100%", () => {
    const v = okValue({ profitPerOrder: 5000, monthlyOrders: 100, couponAmount: 1000, reviewCost: 500 }).value;
    expect(v.avgCoupon).toBe(1000);
    expect(v.avgReview).toBe(500);
  });
  it("0% owner share → coupon costs nothing", () => {
    expect(okValue({ ...base, couponOwnerPct: 0 }).value.avgCoupon).toBe(0);
  });
  it("after-event profit exactly 0 → impossible (본전 불가)", () => {
    const r = promotion({ profitPerOrder: 1000, monthlyOrders: 100, couponAmount: 1000, couponOwnerPct: 100, couponUsagePct: 100 });
    expect(r.status).toBe("impossible");
    if (r.status === "impossible") {
      expect(r.reason).toContain("본전 불가");
      expect(r.partial?.afterProfitPerOrder).toBe(0);
    }
  });
  it("current profit ≤ 0 → impossible", () => {
    expect(promotion({ ...base, profitPerOrder: 0 }).status).toBe("impossible");
    expect(promotion({ ...base, profitPerOrder: -500 }).status).toBe("impossible");
  });
  it("large growth → warning", () => {
    expect(okValue(base).warnings.some((w) => w.includes("88%"))).toBe(true);
  });
  it("huge values stay finite", () => {
    const v = okValue({ ...base, monthlyOrders: 1e9, monthlyFixed: 1e12 }).value;
    expect(Number.isFinite(v.breakEvenOrders)).toBe(true);
  });
  it("empty / invalid", () => {
    expect(promotion({ ...base, profitPerOrder: null }).status).toBe("empty");
    expect(promotion({ ...base, monthlyOrders: null }).status).toBe("empty");
    expect(promotion({ ...base, monthlyOrders: 0 }).status).toBe("invalid");
    expect(promotion({ ...base, couponUsagePct: 101 }).status).toBe("invalid");
    expect(promotion({ ...base, couponOwnerPct: -1 }).status).toBe("invalid");
    expect(promotion({ ...base, reviewCost: -1 }).status).toBe("invalid");
    expect(promotion({ ...base, couponAmount: 1000, couponUsagePct: 100 }).status).toBe("ok");
  });
});
