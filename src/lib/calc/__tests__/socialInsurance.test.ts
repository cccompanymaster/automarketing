import { describe, expect, it } from "vitest";
import { computeSocialInsurance, employerRateApprox } from "../socialInsurance";

describe("computeSocialInsurance", () => {
  it("normal: 3,000,000원, 기타 업종, 150인 미만", () => {
    const r = computeSocialInsurance({ monthlyWage: 3_000_000 });
    expect(r.byKey.pension.employee).toBe(142_500);
    expect(r.byKey.pension.employer).toBe(142_500);
    expect(r.byKey.health.employee).toBe(107_850);
    expect(r.byKey.longTermCare.employee).toBe(14_170); // 107,850 × 13.14% = 14,171.49 → 10원 절사
    expect(r.byKey.employment.employee).toBe(27_000); // float 26,999.99… must not cut to 26,990
    expect(r.byKey.employment.employer).toBe(34_500); // 0.9% + 0.25%
    expect(r.byKey.industrial.employee).toBe(0);
    expect(r.byKey.industrial.employer).toBe(25_800); // 0.8% + 0.06%
    expect(r.employeeTotal).toBe(291_520);
    expect(r.employerTotal).toBe(324_820);
    expect(r.total).toBe(291_520 + 324_820);
    expect(r.pensionClamped).toBeNull();
  });
  it("10원 미만 절사 and 천원 절사 of pension base (최저임금 월 환산)", () => {
    const r = computeSocialInsurance({ monthlyWage: 2_156_880 });
    expect(r.pensionBase).toBe(2_156_000);
    expect(r.byKey.pension.employee).toBe(102_410);
    expect(r.byKey.health.employee).toBe(77_530); // 77,539.836
    expect(r.byKey.longTermCare.employee).toBe(10_180); // 77,530 × 0.1314 = 10,187.4
    expect(r.byKey.employment.employee).toBe(19_410);
  });
  it("pension 하한 / 상한 clamp", () => {
    const low = computeSocialInsurance({ monthlyWage: 300_000 });
    expect(low.pensionClamped).toBe("min");
    expect(low.byKey.pension.employee).toBe(19_470); // 410,000 × 4.75%
    const high = computeSocialInsurance({ monthlyWage: 10_000_000 });
    expect(high.pensionClamped).toBe("max");
    expect(high.byKey.pension.employee).toBe(313_020); // 6,590,000 × 4.75%
    expect(high.byKey.health.employee).toBe(359_500); // no cap on health here
  });
  it("wage 0 / negative / NaN → all zero (no pension floor)", () => {
    for (const w of [0, -100, Number.NaN]) {
      const r = computeSocialInsurance({ monthlyWage: w });
      expect(r.total).toBe(0);
      expect(r.pensionBase).toBe(0);
    }
  });
  it("disabled items stay listed with 0", () => {
    const r = computeSocialInsurance({ monthlyWage: 3_000_000, enabled: { pension: false, industrial: false } });
    expect(r.items).toHaveLength(5);
    expect(r.byKey.pension.enabled).toBe(false);
    expect(r.byKey.pension.employee).toBe(0);
    expect(r.byKey.industrial.employer).toBe(0);
    expect(r.employeeTotal).toBe(107_850 + 14_170 + 27_000);
  });
  it("industry and employer size keys; unknown keys fall back to defaults", () => {
    const r = computeSocialInsurance({ monthlyWage: 1_000_000, industryKey: "construction", employerSizeKey: "over1000" });
    expect(r.byKey.industrial.employer).toBe(35_600); // 3.5% + 0.06%
    expect(r.byKey.employment.employer).toBe(17_500); // 0.9% + 0.85%
    const d = computeSocialInsurance({ monthlyWage: 1_000_000, industryKey: "nope", employerSizeKey: "nope" });
    expect(d.industry.key).toBe("other");
    expect(d.employerSize.key).toBe("under150");
  });
  it("employerRateApprox sums employer rates", () => {
    expect(employerRateApprox()).toBeCloseTo(0.0475 + 0.03595 + 0.03595 * 0.1314 + 0.0115 + 0.0086, 10);
    expect(employerRateApprox({ enabled: { pension: false, health: false, longTermCare: false, employment: false, industrial: false } })).toBe(0);
  });
});
