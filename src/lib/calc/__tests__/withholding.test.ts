import { describe, expect, it } from "vitest";
import { calcDaily, calcFreelancer, dailyExemptCeiling } from "../withholding";

describe("calcFreelancer", () => {
  it("1,000,000원 → 30,000 + 3,000", () => {
    const r = calcFreelancer({ gross: 1_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.incomeTax).toBe(30_000);
    expect(r.value.localTax).toBe(3_000);
    expect(r.value.net).toBe(967_000);
    expect(r.value.effectiveRate).toBeCloseTo(0.033);
  });
  it("10원 미만 절사", () => {
    const r = calcFreelancer({ gross: 1_234_567 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.incomeTax).toBe(37_030); // 37,037.01
    expect(r.value.localTax).toBe(3_700); // 3,703
    expect(r.value.net).toBe(1_234_567 - 40_730);
  });
  it("small amounts are still withheld (no 소액부징수)", () => {
    const r = calcFreelancer({ gross: 30_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.incomeTax).toBe(900);
    expect(r.value.localTax).toBe(90);
  });
  it("tiny amount → 0 tax with warning", () => {
    const r = calcFreelancer({ gross: 100 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.totalTax).toBe(0);
    expect(r.warnings.length).toBe(1);
  });
  it("empty / invalid", () => {
    expect(calcFreelancer({ gross: null }).status).toBe("empty");
    expect(calcFreelancer({ gross: 0 }).status).toBe("invalid");
    expect(calcFreelancer({ gross: -5 }).status).toBe("invalid");
  });
});

describe("calcDaily", () => {
  it("일당 200,000 × 10일", () => {
    const r = calcDaily({ dailyWage: 200_000, days: 10 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.taxablePerDay).toBe(50_000);
    expect(r.value.incomeTaxPerDay).toBe(1_350); // float 1349.99… must not cut to 1,340
    expect(r.value.localTaxPerDay).toBe(130); // 135 → 10원 절사
    expect(r.value.netPerDay).toBe(198_520);
    expect(r.value.incomeTax).toBe(13_500);
    expect(r.value.localTax).toBe(1_300);
    expect(r.value.net).toBe(2_000_000 - 14_800);
  });
  it("소액부징수 boundary", () => {
    const ceiling = dailyExemptCeiling();
    expect(ceiling).toBe(187_037);
    const a = calcDaily({ dailyWage: ceiling, days: 1 });
    if (a.status !== "ok") throw new Error(a.status);
    expect(a.value.smallAmountExempt).toBe(true);
    expect(a.value.incomeTaxPerDayBeforeExempt).toBe(990);
    expect(a.value.totalTax).toBe(0);
    const b = calcDaily({ dailyWage: ceiling + 1, days: 1 });
    if (b.status !== "ok") throw new Error(b.status);
    expect(b.value.smallAmountExempt).toBe(false);
    expect(b.value.incomeTaxPerDay).toBe(1_000);
    expect(b.value.localTaxPerDay).toBe(100);
  });
  it("일당 ≤ 150,000 → no tax", () => {
    const r = calcDaily({ dailyWage: 150_000, days: 5 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.taxablePerDay).toBe(0);
    expect(r.value.totalTax).toBe(0);
    expect(r.value.net).toBe(750_000);
  });
  it("empty / invalid (non-integer days, 0)", () => {
    expect(calcDaily({ dailyWage: null, days: 1 }).status).toBe("empty");
    expect(calcDaily({ dailyWage: 200_000, days: 1.5 }).status).toBe("invalid");
    expect(calcDaily({ dailyWage: 200_000, days: 0 }).status).toBe("invalid");
    expect(calcDaily({ dailyWage: 0, days: 1 }).status).toBe("invalid");
  });
  it("more than 31 days warns", () => {
    const r = calcDaily({ dailyWage: 200_000, days: 40 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.warnings.length).toBe(1);
  });
});
