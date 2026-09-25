import { describe, expect, it } from "vitest";
import {
  calcPayslip,
  holidayWeeksFrom,
  localIncomeTax,
  monthlyStandardHours,
  premiumMultipliers,
  type PayslipInput,
} from "../payslip";
import { computeSocialInsurance } from "../socialInsurance";

const base = (over: Partial<PayslipInput> = {}): PayslipInput => ({
  payType: "hourly",
  hourlyWage: 10_320,
  monthlySalary: null,
  workDays: 20,
  workHours: 160,
  weeklyScheduledHours: 40,
  weeklyWorkDays: 5,
  holidayWeeks: null,
  overtimeHours: null,
  nightHours: null,
  holidayHours: null,
  holidayOver8Hours: null,
  allowances: [],
  under5: false,
  insurance: { pension: true, health: true, longTermCare: true, employment: true },
  incomeTax: null,
  otherDeductions: [],
  wageDate: "2026-10-01",
  ...over,
});

const okOf = (i: PayslipInput) => {
  const r = calcPayslip(i);
  if (r.status !== "ok") throw new Error(`${r.status}: ${JSON.stringify(r)}`);
  return r;
};
const line = (lines: { key: string; amount: number; method: string }[], key: string) => lines.find((l) => l.key === key);

describe("premiumMultipliers", () => {
  it("5인 이상: 연장 1.5, 야간 0.5 가산, 휴일 1.5 / 8h 초과 2.0", () => {
    expect(premiumMultipliers(false)).toEqual({ overtime: 1.5, night: 0.5, holidayUpTo8: 1.5, holidayOver8: 2 });
  });
  it("5인 미만: 가산 없음 (1배, 야간 0)", () => {
    expect(premiumMultipliers(true)).toEqual({ overtime: 1, night: 0, holidayUpTo8: 1, holidayOver8: 1 });
  });
});

describe("monthlyStandardHours", () => {
  it("empty or 40h+ → 209h", () => {
    expect(monthlyStandardHours(null)).toBe(209);
    expect(monthlyStandardHours(40)).toBe(209);
    expect(monthlyStandardHours(48)).toBe(209);
  });
  it("part-time: (주 + 주휴) × 4.345, rounded", () => {
    expect(monthlyStandardHours(20)).toBe(104); // (20 + 4) × 4.345 = 104.28
    expect(monthlyStandardHours(15)).toBe(78); // (15 + 3) × 4.345 = 78.21
    expect(monthlyStandardHours(14)).toBe(61); // no 주휴: 14 × 4.345 = 60.83
  });
});

describe("holidayWeeksFrom", () => {
  it("explicit value wins", () => {
    expect(holidayWeeksFrom({ holidayWeeks: 5, workDays: 20, weeklyWorkDays: 5 })).toBe(5);
    expect(holidayWeeksFrom({ holidayWeeks: 0, workDays: 20, weeklyWorkDays: 5 })).toBe(0);
  });
  it("⌊근로일수 ÷ 주 근무일수⌋ — only complete weeks", () => {
    expect(holidayWeeksFrom({ holidayWeeks: null, workDays: 22, weeklyWorkDays: 5 })).toBe(4);
    expect(holidayWeeksFrom({ holidayWeeks: null, workDays: 15, weeklyWorkDays: 3 })).toBe(5);
    expect(holidayWeeksFrom({ holidayWeeks: null, workDays: 4, weeklyWorkDays: 5 })).toBe(0);
  });
  it("unknown → null", () => {
    expect(holidayWeeksFrom({ holidayWeeks: null, workDays: null, weeklyWorkDays: 5 })).toBeNull();
    expect(holidayWeeksFrom({ holidayWeeks: null, workDays: 20, weeklyWorkDays: 0 })).toBeNull();
  });
});

describe("localIncomeTax", () => {
  it("소득세 × 10%, 10원 미만 절사", () => {
    expect(localIncomeTax(12_345)).toBe(1_230);
    expect(localIncomeTax(20_000)).toBe(2_000);
    expect(localIncomeTax(99)).toBe(0);
    expect(localIncomeTax(0)).toBe(0);
  });
});

describe("calcPayslip — hourly", () => {
  it("full-time month: 기본급 + 주휴 4주, 4대보험, 세금, totals", () => {
    const r = okOf(base({ incomeTax: 20_000 }));
    const v = r.value;
    expect(line(v.earnings, "base")).toMatchObject({ amount: 1_651_200, method: "10,320원 × 160시간" });
    expect(line(v.earnings, "weeklyHoliday")).toMatchObject({ amount: 330_240, method: "10,320원 × 8시간 × 4주" });
    expect(v.grossPay).toBe(1_981_440);
    const ins = computeSocialInsurance({ monthlyWage: 1_981_440 });
    expect(line(v.deductions, "pension")?.amount).toBe(ins.byKey.pension.employee);
    expect(line(v.deductions, "pension")?.amount).toBe(94_090);
    expect(line(v.deductions, "health")?.amount).toBe(71_230);
    expect(line(v.deductions, "longTermCare")?.amount).toBe(9_350);
    expect(line(v.deductions, "employment")?.amount).toBe(17_830);
    expect(line(v.deductions, "localTax")?.amount).toBe(2_000);
    expect(v.totalDeductions).toBe(94_090 + 71_230 + 9_350 + 17_830 + 20_000 + 2_000);
    expect(v.netPay).toBe(v.grossPay - v.totalDeductions);
    expect(v.belowMinimumWage).toBe(false);
    expect(r.warnings).toEqual([]);
    expect(line(v.deductions, "industrial")).toBeUndefined();
  });

  it("part-time 주휴: 주 20h → 4h/주", () => {
    const v = okOf(base({ workHours: 80, weeklyScheduledHours: 20, weeklyWorkDays: 4, workDays: 16 })).value;
    expect(v.weeklyHolidayHours).toBe(4);
    expect(v.holidayWeeks).toBe(4);
    expect(line(v.earnings, "weeklyHoliday")?.amount).toBe(10_320 * 4 * 4);
    expect(line(v.earnings, "weeklyHoliday")?.method).toContain("주 20시간 ÷ 40 × 8");
  });

  it("주 15h 미만 → 주휴 없음", () => {
    const v = okOf(base({ weeklyScheduledHours: 14.9 })).value;
    expect(v.weeklyHolidayEligible).toBe(false);
    expect(line(v.earnings, "weeklyHoliday")).toBeUndefined();
  });

  it("exactly 15h → 주휴 3h", () => {
    const v = okOf(base({ weeklyScheduledHours: 15, holidayWeeks: 1 })).value;
    expect(v.weeklyHolidayHours).toBe(3);
    expect(line(v.earnings, "weeklyHoliday")?.amount).toBe(10_320 * 3);
  });

  it("주휴 대상인데 주 수를 모르면 경고", () => {
    const r = okOf(base({ workDays: null, holidayWeeks: null }));
    expect(line(r.value.earnings, "weeklyHoliday")).toBeUndefined();
    expect(r.warnings.some((w) => w.includes("주휴"))).toBe(true);
  });

  it("5인 이상 가산수당", () => {
    const v = okOf(
      base({ hourlyWage: 10_320, workHours: 100, overtimeHours: 10, nightHours: 4, holidayHours: 8, holidayOver8Hours: 2 }),
    ).value;
    expect(line(v.earnings, "overtime")).toMatchObject({ amount: 154_800, method: "10,320원 × 10시간 × 1.5" });
    expect(line(v.earnings, "night")?.amount).toBe(20_640);
    expect(line(v.earnings, "holiday")?.amount).toBe(10_320 * (8 * 1.5 + 2 * 2));
    expect(line(v.earnings, "holiday")?.method).toBe("10,320원 × 8시간 × 1.5 + 10,320원 × 2시간 × 2");
  });

  it("5인 미만: 가산 없이 1배, 야간 줄 없음", () => {
    const v = okOf(
      base({ under5: true, workHours: 100, overtimeHours: 10, nightHours: 4, holidayHours: 8, holidayOver8Hours: 2 }),
    ).value;
    expect(line(v.earnings, "overtime")?.amount).toBe(103_200);
    expect(line(v.earnings, "night")).toBeUndefined();
    expect(line(v.earnings, "holiday")?.amount).toBe(103_200);
    expect(v.notes.some((n) => n.includes("5인 미만"))).toBe(true);
  });

  it("최저임금 미달 경고 (연도는 wageDate 기준)", () => {
    const r = okOf(base({ hourlyWage: 10_000 }));
    expect(r.value.belowMinimumWage).toBe(true);
    expect(r.warnings[0]).toContain("2026년 최저임금");
    const r27 = okOf(base({ hourlyWage: 10_500, wageDate: "2027-02-01" }));
    expect(r27.value.minimumWage.hourly).toBe(10_700);
    expect(r27.value.belowMinimumWage).toBe(true);
    expect(okOf(base({ hourlyWage: 10_320 })).value.belowMinimumWage).toBe(false);
  });

  it("비과세 수당은 보험료 기준에서 빠짐", () => {
    const v = okOf(
      base({
        allowances: [
          { name: "식대", amount: 200_000, nonTaxable: true },
          { name: "직책수당", amount: 50_000 },
          { name: "", amount: null },
        ],
      }),
    ).value;
    expect(v.grossPay).toBe(1_981_440 + 250_000);
    expect(v.nonTaxableTotal).toBe(200_000);
    expect(v.insuranceBase).toBe(1_981_440 + 50_000);
    expect(line(v.earnings, "allowance-0")).toMatchObject({ amount: 200_000, method: "정액 (비과세)" });
    expect(line(v.earnings, "allowance-2")).toBeUndefined();
  });

  it("보험 미가입 → 공제 없음; 기타 공제 반영; 마이너스 실지급 경고", () => {
    const r = okOf(
      base({
        insurance: { pension: false, health: false, longTermCare: false, employment: false },
        otherDeductions: [{ name: "가불금", amount: 2_500_000 }],
      }),
    );
    expect(r.value.deductions.map((d) => d.key)).toEqual(["deduction-0"]);
    expect(r.value.netPay).toBe(1_981_440 - 2_500_000);
    expect(r.warnings.some((w) => w.includes("마이너스"))).toBe(true);
  });

  it("zero hours → 0원 기본급 (boundary)", () => {
    const v = okOf(base({ workHours: 0, weeklyScheduledHours: null })).value;
    expect(v.grossPay).toBe(0);
    expect(v.deductions).toEqual([]);
    expect(v.netPay).toBe(0);
  });
});

describe("calcPayslip — monthly", () => {
  it("통상시급 = 월급 ÷ 209 (반올림) → 연장수당", () => {
    const v = okOf(base({ payType: "monthly", monthlySalary: 2_500_000, overtimeHours: 10 })).value;
    expect(v.monthlyStdHours).toBe(209);
    expect(v.ordinaryHourly).toBe(11_962); // 11,961.72…
    expect(line(v.earnings, "base")?.amount).toBe(2_500_000);
    expect(line(v.earnings, "overtime")?.amount).toBe(11_962 * 15);
    expect(line(v.earnings, "weeklyHoliday")).toBeUndefined();
  });
  it("단시간 월급제: 주 20h → 104h", () => {
    const v = okOf(base({ payType: "monthly", monthlySalary: 1_100_000, weeklyScheduledHours: 20 })).value;
    expect(v.monthlyStdHours).toBe(104);
    expect(v.ordinaryHourly).toBe(10_577);
  });
  it("월급 환산 시급 최저임금 미달", () => {
    const r = okOf(base({ payType: "monthly", monthlySalary: 2_000_000 }));
    expect(r.value.belowMinimumWage).toBe(true);
    expect(r.warnings[0]).toContain("209시간");
    expect(okOf(base({ payType: "monthly", monthlySalary: 10_320 * 209 })).value.belowMinimumWage).toBe(false);
  });
});

describe("calcPayslip — states", () => {
  it("empty required inputs", () => {
    expect(calcPayslip(base({ hourlyWage: null })).status).toBe("empty");
    expect(calcPayslip(base({ workHours: null })).status).toBe("empty");
    expect(calcPayslip(base({ payType: "monthly", monthlySalary: null })).status).toBe("empty");
  });
  it("monthly does not need 시급·근로시간", () => {
    expect(calcPayslip(base({ payType: "monthly", monthlySalary: 2_500_000, hourlyWage: null, workHours: null })).status).toBe("ok");
  });
  it("invalid values carry field keys", () => {
    const r = calcPayslip(
      base({
        hourlyWage: 0,
        overtimeHours: -1,
        weeklyWorkDays: 8,
        weeklyScheduledHours: 200,
        allowances: [{ name: "식대", amount: -1 }],
        otherDeductions: [{ name: "x", amount: -5 }],
        incomeTax: -10,
      }),
    );
    if (r.status !== "invalid") throw new Error(r.status);
    const fields = r.issues.map((i) => i.field);
    expect(fields).toEqual(
      expect.arrayContaining(["hourlyWage", "overtimeHours", "weeklyWorkDays", "weeklyScheduledHours", "allowance-0", "deduction-0", "incomeTax"]),
    );
  });
  it("huge values stay finite", () => {
    const v = okOf(base({ hourlyWage: 1_000_000, workHours: 10_000 })).value;
    expect(Number.isFinite(v.netPay)).toBe(true);
    expect(v.insurance.pensionClamped).toBe("max");
  });
});
