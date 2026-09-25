import { describe, expect, it } from "vitest";
import { calcHourlyWage, weeklyHolidayHours } from "../hourlyWage";

describe("weeklyHolidayHours", () => {
  it("15h boundary, proportional, capped at 40h", () => {
    expect(weeklyHolidayHours(14.99)).toBe(0);
    expect(weeklyHolidayHours(15)).toBe(3);
    expect(weeklyHolidayHours(20)).toBe(4);
    expect(weeklyHolidayHours(40)).toBe(8);
    expect(weeklyHolidayHours(60)).toBe(8);
  });
});

describe("calcHourlyWage", () => {
  it("full time 8h × 5 at 10,320원", () => {
    const r = calcHourlyWage({ hourlyWage: 10_320, hoursPerDay: 8, daysPerWeek: 5, minWageYear: 2026 });
    if (r.status !== "ok") throw new Error(r.status);
    const v = r.value;
    expect(v.dailyPay).toBe(82_560);
    expect(v.weeklyBase).toBe(412_800);
    expect(v.holidayHours).toBe(8);
    expect(v.holidayPay).toBe(82_560);
    expect(v.weeklyTotal).toBe(495_360);
    expect(v.monthlyPay).toBe(2_152_457); // 495,360 × 365/7/12
    expect(v.eligible).toBe(true);
    expect(v.belowMinimum).toBe(false);
    expect(r.warnings).toHaveLength(0);
  });
  it("3h × 5 = 15h → eligible, 3h 주휴", () => {
    const r = calcHourlyWage({ hourlyWage: 10_320, hoursPerDay: 3, daysPerWeek: 5 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.holidayHours).toBe(3);
    expect(r.value.holidayPay).toBe(30_960);
    expect(r.value.weeklyTotal).toBe(154_800 + 30_960);
  });
  it("under 15h → no 주휴 with warning", () => {
    const r = calcHourlyWage({ hourlyWage: 10_320, hoursPerDay: 7, daysPerWeek: 2 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.eligible).toBe(false);
    expect(r.value.holidayPay).toBe(0);
    expect(r.warnings.some((w) => w.includes("주휴수당 지급 대상이 아니"))).toBe(true);
  });
  it("below minimum wage (and 2027 comparison) warns", () => {
    const r = calcHourlyWage({ hourlyWage: 10_320, hoursPerDay: 8, daysPerWeek: 5, minWageYear: 2027 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.minWage).toEqual({ year: 2027, hourly: 10_700 });
    expect(r.value.belowMinimum).toBe(true);
    expect(r.value.minWageShortfall).toBe(380);
    expect(r.warnings[0]).toContain("최저임금");
  });
  it("over 40h caps 주휴 and warns about overtime; rounds half-won", () => {
    const r = calcHourlyWage({ hourlyWage: 10_320.5, hoursPerDay: 10, daysPerWeek: 5 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.holidayHours).toBe(8);
    expect(r.value.dailyPay).toBe(103_205);
    expect(r.warnings.some((w) => w.includes("연장근로"))).toBe(true);
  });
  it("boundaries: 24h and 7 days are allowed", () => {
    expect(calcHourlyWage({ hourlyWage: 10_320, hoursPerDay: 24, daysPerWeek: 7 }).status).toBe("ok");
  });
  it("invalid: > 24h, > 7 days, 0 or negative", () => {
    const a = calcHourlyWage({ hourlyWage: 10_320, hoursPerDay: 25, daysPerWeek: 8 });
    expect(a.status).toBe("invalid");
    if (a.status === "invalid") expect(a.issues.map((i) => i.field).sort()).toEqual(["daysPerWeek", "hoursPerDay"]);
    expect(calcHourlyWage({ hourlyWage: 0, hoursPerDay: 8, daysPerWeek: 5 }).status).toBe("invalid");
    expect(calcHourlyWage({ hourlyWage: 10_000, hoursPerDay: -1, daysPerWeek: 5 }).status).toBe("invalid");
  });
  it("empty", () => {
    const r = calcHourlyWage({ hourlyWage: null, hoursPerDay: 8, daysPerWeek: null });
    expect(r.status).toBe("empty");
    if (r.status === "empty") expect(r.missing).toEqual(["시급", "주 근무일수"]);
  });
  it("huge values stay finite", () => {
    const r = calcHourlyWage({ hourlyWage: 1e9, hoursPerDay: 24, daysPerWeek: 7 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(Number.isFinite(r.value.monthlyPay)).toBe(true);
  });
});
