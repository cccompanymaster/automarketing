import { describe, expect, it } from "vitest";
import { annuityPayment, annuitySchedule, equalPrincipalSchedule, loan, monthlyInterest } from "../loan";

const sumP = (rows: { principal: number }[]) => rows.reduce((s, r) => s + r.principal, 0);

describe("monthlyInterest", () => {
  it("floors below 1원 and has no float undershoot", () => {
    expect(monthlyInterest(1_000_000, 4.5)).toBe(3_750);
    expect(monthlyInterest(1_000_001, 5)).toBe(4_166); // 4,166.67 → 절사
    expect(monthlyInterest(0, 5)).toBe(0);
    expect(monthlyInterest(1_000, 0)).toBe(0);
  });
});

describe("annuity (원리금균등)", () => {
  it("10,000,000 · 5% · 12개월", () => {
    const s = annuitySchedule(10_000_000, 5, 12);
    expect(Math.round(annuityPayment(10_000_000, 5, 12))).toBe(856_075);
    expect(s.rows).toHaveLength(12);
    expect(s.rows[0].interest).toBe(41_666);
    expect(s.rows[0].payment).toBe(856_075);
    expect(sumP(s.rows)).toBe(10_000_000);
    expect(s.totalPrincipal).toBe(10_000_000);
    expect(s.rows[11].balance).toBe(0);
    expect(s.totalPayment).toBe(s.totalPrincipal + s.totalInterest);
    // last month within a few won of the regular payment
    expect(Math.abs(s.lastPayment - 856_075)).toBeLessThan(20);
  });
  it("0% → principal / n, last month absorbs remainder", () => {
    const s = annuitySchedule(1_000_000, 0, 3);
    expect(s.rows.map((r) => r.payment)).toEqual([333_333, 333_333, 333_334]);
    expect(s.totalInterest).toBe(0);
    expect(sumP(s.rows)).toBe(1_000_000);
  });
  it("600 months, odd principal: 원금 합계 exact", () => {
    const s = annuitySchedule(123_456_789, 4.35, 600);
    expect(sumP(s.rows)).toBe(123_456_789);
    expect(s.rows[599].balance).toBe(0);
    expect(s.rows.every((r) => r.principal >= 0 && Number.isFinite(r.payment))).toBe(true);
  });
  it("tiny loan with long term stays sane", () => {
    const s = annuitySchedule(100, 3, 600);
    expect(sumP(s.rows)).toBe(100);
    expect(s.rows.every((r) => r.principal >= 0)).toBe(true);
  });
  it("single month", () => {
    const s = annuitySchedule(1_000_000, 12, 1);
    expect(s.rows).toEqual([{ month: 1, payment: 1_010_000, principal: 1_000_000, interest: 10_000, balance: 0 }]);
  });
});

describe("equalPrincipal (원금균등)", () => {
  it("10,000,000 · 5% · 12개월", () => {
    const s = equalPrincipalSchedule(10_000_000, 5, 12);
    expect(s.rows[0].principal).toBe(833_333);
    expect(s.rows[0].interest).toBe(41_666);
    expect(s.rows[11].principal).toBe(10_000_000 - 833_333 * 11);
    expect(sumP(s.rows)).toBe(10_000_000);
    expect(s.firstPayment).toBeGreaterThan(s.lastPayment);
  });
  it("0%", () => {
    const s = equalPrincipalSchedule(1_000_000, 0, 3);
    expect(s.rows.map((r) => r.payment)).toEqual([333_333, 333_333, 333_334]);
  });
  it("600 months exact principal", () => {
    const s = equalPrincipalSchedule(987_654_321, 6.9, 600);
    expect(sumP(s.rows)).toBe(987_654_321);
  });
});

describe("loan", () => {
  it("computes both and the interest gap", () => {
    const r = loan({ principal: 50_000_000, annualRatePct: 6, months: 60 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.annuity.rows).toHaveLength(60);
    expect(r.value.equalPrincipal.rows).toHaveLength(60);
    expect(r.value.interestGap).toBeGreaterThan(0);
    expect(r.value.annuity.totalPrincipal).toBe(50_000_000);
    expect(r.value.equalPrincipal.totalPrincipal).toBe(50_000_000);
    expect(r.warnings).toHaveLength(0);
  });
  it("0% → equal totals, warning", () => {
    const r = loan({ principal: 1_200_000, annualRatePct: 0, months: 12 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.annuity.totalInterest).toBe(0);
    expect(r.value.interestGap).toBe(0);
    expect(r.value.annuity.rows[0].payment).toBe(100_000);
    expect(r.warnings).toHaveLength(1);
  });
  it("rate above legal max → warning", () => {
    const r = loan({ principal: 1_000_000, annualRatePct: 24, months: 12 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.warnings.some((w) => w.includes("최고이자율"))).toBe(true);
    const r2 = loan({ principal: 1_000_000, annualRatePct: 20, months: 12 });
    if (r2.status !== "ok") throw new Error(r2.status);
    expect(r2.warnings).toHaveLength(0);
  });
  it("months must be an integer in 1..600", () => {
    for (const m of [0, -1, 1.5, 601]) {
      const r = loan({ principal: 1_000_000, annualRatePct: 5, months: m });
      expect(r.status).toBe("invalid");
      if (r.status === "invalid") expect(r.issues[0].field).toBe("months");
    }
    expect(loan({ principal: 1_000_000, annualRatePct: 5, months: 600 }).status).toBe("ok");
    expect(loan({ principal: 1_000_000, annualRatePct: 5, months: 1 }).status).toBe("ok");
  });
  it("invalid principal / rate", () => {
    expect(loan({ principal: 0, annualRatePct: 5, months: 12 }).status).toBe("invalid");
    expect(loan({ principal: 100.5, annualRatePct: 5, months: 12 }).status).toBe("invalid");
    expect(loan({ principal: 1_000, annualRatePct: -1, months: 12 }).status).toBe("invalid");
    expect(loan({ principal: 1_000, annualRatePct: 101, months: 12 }).status).toBe("invalid");
  });
  it("empty", () => {
    expect(loan({ principal: null, annualRatePct: 5, months: 12 }).status).toBe("empty");
    expect(loan({ principal: 1, annualRatePct: null, months: 12 }).status).toBe("empty");
    expect(loan({ principal: 1, annualRatePct: 5, months: null }).status).toBe("empty");
  });
});
