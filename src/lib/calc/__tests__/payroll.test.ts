import { describe, expect, it } from "vitest";
import { calcPayroll, minimumMonthlyWage } from "../payroll";

describe("minimumMonthlyWage", () => {
  it("최저시급 × 209h", () => {
    expect(minimumMonthlyWage(2026)).toEqual({ year: 2026, amount: 2_156_880 });
    expect(minimumMonthlyWage(2027).amount).toBe(10_700 * 209);
  });
});

describe("calcPayroll", () => {
  it("normal 3,000,000원", () => {
    const r = calcPayroll({ monthlyWage: 3_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.insurance.employeeTotal).toBe(291_520);
    expect(r.value.netPay).toBe(3_000_000 - 291_520);
    expect(r.value.totalCost).toBe(3_000_000 + 324_820);
    expect(r.value.employeeShareRate).toBeCloseTo(291_520 / 3_000_000);
    expect(r.warnings).toHaveLength(0);
  });
  it("비과세 금액 is excluded from the premium base but not from pay", () => {
    const r = calcPayroll({ monthlyWage: 3_200_000, nonTaxable: 200_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.insuredWage).toBe(3_000_000);
    expect(r.value.insurance.employeeTotal).toBe(291_520);
    expect(r.value.netPay).toBe(3_200_000 - 291_520);
  });
  it("wage below 최저 월급 and pension clamp warn", () => {
    const r = calcPayroll({ monthlyWage: 300_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.warnings.some((w) => w.includes("최저 월급"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("하한"))).toBe(true);
    const hi = calcPayroll({ monthlyWage: 8_000_000 });
    if (hi.status !== "ok") throw new Error(hi.status);
    expect(hi.warnings.some((w) => w.includes("상한"))).toBe(true);
  });
  it("비과세 = 월급 → all premiums 0", () => {
    const r = calcPayroll({ monthlyWage: 200_000, nonTaxable: 200_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.insurance.total).toBe(0);
    expect(r.value.netPay).toBe(200_000);
  });
  it("empty / invalid", () => {
    expect(calcPayroll({ monthlyWage: null }).status).toBe("empty");
    expect(calcPayroll({ monthlyWage: 0 }).status).toBe("invalid");
    expect(calcPayroll({ monthlyWage: -1 }).status).toBe("invalid");
    expect(calcPayroll({ monthlyWage: 100, nonTaxable: 200 }).status).toBe("invalid");
    expect(calcPayroll({ monthlyWage: 100, nonTaxable: -1 }).status).toBe("invalid");
  });
});
