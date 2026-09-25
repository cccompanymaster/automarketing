import { describe, expect, it } from "vitest";
import { calcCardFee, cardTierOptions, GENERAL_TIER_KEY } from "../cardFee";

describe("cardTierOptions", () => {
  it("4 preferential tiers + general", () => {
    const o = cardTierOptions();
    expect(o).toHaveLength(5);
    expect(o[o.length - 1].key).toBe(GENERAL_TIER_KEY);
  });
});

describe("calcCardFee", () => {
  it("영세 (3억 이하): 0.4% / 0.15%", () => {
    const r = calcCardFee({ tierKey: "t3", creditSales: 10_000_000, checkSales: 5_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.credit.fee).toBe(40_000);
    expect(r.value.check.fee).toBe(7_500);
    expect(r.value.totalFee).toBe(47_500);
    expect(r.value.totalDeposit).toBe(15_000_000 - 47_500);
    expect(r.value.effectiveRate).toBeCloseTo(47_500 / 15_000_000);
    expect(r.value.annualFee).toBe(570_000);
  });
  it("one card type blank → treated as 0", () => {
    const r = calcCardFee({ tierKey: "t30", creditSales: 1_000_000, checkSales: null });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.credit.fee).toBe(14_500);
    expect(r.value.check.sales).toBe(0);
  });
  it("rounds fee to whole won", () => {
    const r = calcCardFee({ tierKey: "t3", creditSales: 1_001, checkSales: 0 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.credit.fee).toBe(4); // 4.004
  });
  it("general: default (가정값) vs user rates", () => {
    const d = calcCardFee({ tierKey: GENERAL_TIER_KEY, creditSales: 10_000_000, checkSales: 0 });
    if (d.status !== "ok") throw new Error(d.status);
    expect(d.value.credit.fee).toBe(200_000);
    expect(d.value.tier.usedDefaultRates).toBe(true);
    expect(d.warnings.length).toBe(1);
    const u = calcCardFee({ tierKey: GENERAL_TIER_KEY, creditSales: 10_000_000, checkSales: 1_000_000, generalCreditPct: 1.8, generalCheckPct: 1.3 });
    if (u.status !== "ok") throw new Error(u.status);
    expect(u.value.credit.fee).toBe(180_000);
    expect(u.value.check.fee).toBe(13_000);
    expect(u.value.tier.usedDefaultRates).toBe(false);
  });
  it("zero sales → ok with 0 fees and warning", () => {
    const r = calcCardFee({ tierKey: "t5", creditSales: 0, checkSales: 0 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.totalFee).toBe(0);
    expect(r.value.effectiveRate).toBe(0);
  });
  it("empty / invalid", () => {
    expect(calcCardFee({ tierKey: "t3", creditSales: null, checkSales: null }).status).toBe("empty");
    expect(calcCardFee({ tierKey: "t3", creditSales: -1, checkSales: 0 }).status).toBe("invalid");
    expect(calcCardFee({ tierKey: "zzz", creditSales: 1, checkSales: 0 }).status).toBe("invalid");
    expect(calcCardFee({ tierKey: GENERAL_TIER_KEY, creditSales: 1, checkSales: 0, generalCreditPct: 100 }).status).toBe("invalid");
  });
});
