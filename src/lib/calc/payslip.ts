// 급여명세서 만들기 — pure functions (no React/DOM).
//
// Calculation order & rounding:
// 1) 통상시급
//    - 시급제: 입력한 시급 그대로.
//    - 월급제: 월급 ÷ 월 소정근로시간, 원 단위 반올림(roundWon) — the rounded
//      value is what the 계산방법 text shows, so every line is reproducible.
//      월 소정근로시간 = LABOR_LAW.monthlyStandardHours (209h) when 주 소정근로시간
//      is empty or ≥ 40h; for 단시간 근로자 = (주 소정 + 주휴시간) × 4.345주,
//      rounded to whole hours (주 20h → 104h). 주 40h gives the same 209h.
// 2) 기본급: 시급제 = 시급 × 기본 근로시간; 월급제 = 월급 (주휴 포함).
// 3) 주휴수당 (시급제만): 주 소정근로시간 ≥ 15h이면 주휴시간
//    = min(주 소정, 40) ÷ 40 × 8 (hourlyWage.weeklyHolidayHours).
//    주휴 발생 주 수 = 직접 입력값, 없으면 ⌊근로일수 ÷ 주 근무일수⌋ — only
//    complete weeks count (주휴는 그 주 소정근로일을 개근한 주에만 생기므로
//    남는 일수는 버림). 금액 = 시급 × 주휴시간 × 주 수.
// 4) 가산수당 (LABOR_LAW, 근로기준법 제56조):
//    - 5인 이상: 연장 × 1.5, 야간 × 0.5 (가산분만 — 야간시간은 기본·연장·휴일
//      시간 안에 이미 포함돼 있다고 봄), 휴일 8h 이내 × 1.5, 8h 초과분 × 2.0.
//    - 5인 미만: 가산 없음 → 연장 × 1, 휴일 × 1 (일한 시간만큼 통상임금),
//      야간 가산 0 (줄 생략).
// 5) 기타 수당: 입력 금액 그대로. 비과세 표시한 수당은 보험료 기준에서 제외.
// 6) 4대보험 (근로자 부담): computeSocialInsurance(지급총액 − 비과세 수당) —
//    각 10원 미만 절사 (socialInsurance.ts). 산재보험은 사업주 부담이라 공제 없음.
// 7) 소득세 = 사용자 입력 (간이세액표는 부양가족 수에 따라 달라 자동 계산하지
//    않음). 지방소득세 = 소득세 × WITHHOLDING.localRatio(10%), 10원 미만 절사
//    (TAX_TRUNCATION).
// Every pay line is rounded to whole won (roundWon, 반올림) on its own; totals
// are sums of the rounded lines, so 지급총액 − 공제총액 = 실지급액 exactly.

import { Check, ok, type CalcResult, type FieldIssue } from "./types";
import { floorTo, formatNumber, formatPercent, formatWon, roundWon } from "./num";
import { LABOR_LAW, WITHHOLDING, minimumWageFor } from "./rates";
import { TAX_TRUNCATION } from "./rates/laborTax";
import { weeklyHolidayHours } from "./hourlyWage";
import { computeSocialInsurance, type InsuranceEnabled, type SocialInsuranceResult } from "./socialInsurance";

export type PayType = "hourly" | "monthly";

export interface PayslipAllowanceRow {
  name: string;
  amount: number | null;
  /** 비과세 (식대 등) — excluded from the 4대보험 base. */
  nonTaxable?: boolean;
}

export interface PayslipDeductionRow {
  name: string;
  amount: number | null;
}

export interface PayslipInput {
  payType: PayType;
  hourlyWage: number | null;
  monthlySalary: number | null;
  /** 급여 기간 근로일수 */
  workDays: number | null;
  /** 기본(소정) 근로시간 합계 — 시급제 필수, 연장·휴일 시간 제외 */
  workHours: number | null;
  weeklyScheduledHours: number | null;
  /** 주 근무일수 (주휴 주 수 산정용) */
  weeklyWorkDays: number | null;
  /** 주휴 발생 주 수 — 직접 입력 시 우선 */
  holidayWeeks: number | null;
  overtimeHours: number | null;
  nightHours: number | null;
  /** 휴일근로 중 8시간 이내분 */
  holidayHours: number | null;
  /** 휴일근로 중 8시간 초과분 */
  holidayOver8Hours: number | null;
  allowances: PayslipAllowanceRow[];
  /** 상시 근로자 5인 미만 사업장 */
  under5: boolean;
  /** Employee-side insurances to deduct (산재 is ignored). Omitted → all on. */
  insurance?: Partial<InsuranceEnabled>;
  incomeTax: number | null;
  otherDeductions: PayslipDeductionRow[];
  /** YYYY-MM-DD for the 최저임금 year (근로기간 시작일 → 종료일 → 지급일). */
  wageDate?: string | null;
}

export interface PayslipLine {
  key: string;
  label: string;
  amount: number;
  /** 계산방법 text shown on the document. */
  method: string;
}

export interface PayslipResult {
  payType: PayType;
  /** 통상시급 used for 수당 (월급제는 반올림된 값). */
  ordinaryHourly: number;
  /** 월급제 월 소정근로시간 (시급제 null). */
  monthlyStdHours: number | null;
  weeklyHolidayEligible: boolean | null;
  weeklyHolidayHours: number;
  holidayWeeks: number | null;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  nonTaxableTotal: number;
  /** 4대보험 부과 기준 (지급총액 − 비과세). */
  insuranceBase: number;
  insurance: SocialInsuranceResult;
  minimumWage: { year: number; hourly: number };
  belowMinimumWage: boolean;
  multipliers: PremiumMultipliers;
  /** Informational notes (not problems) for the document / result panel. */
  notes: string[];
}

export interface PremiumMultipliers {
  overtime: number;
  night: number;
  holidayUpTo8: number;
  holidayOver8: number;
}

/** 가산 배율. 5인 미만은 가산 없이 일한 시간만큼(1배), 야간 가산은 0. */
export function premiumMultipliers(under5: boolean): PremiumMultipliers {
  const law = LABOR_LAW.value;
  if (under5) return { overtime: 1, night: 0, holidayUpTo8: 1, holidayOver8: 1 };
  return {
    overtime: 1 + law.overtimePremium,
    night: law.nightPremium,
    holidayUpTo8: 1 + law.holidayPremiumUpTo8h,
    holidayOver8: 1 + law.holidayPremiumOver8h,
  };
}

/** 월급제 월 소정근로시간 (see header). */
export function monthlyStandardHours(weeklyScheduledHours: number | null): number {
  const law = LABOR_LAW.value;
  if (weeklyScheduledHours == null || !(weeklyScheduledHours > 0) || weeklyScheduledHours >= law.fullTimeWeeklyHours) {
    return law.monthlyStandardHours;
  }
  return Math.round((weeklyScheduledHours + weeklyHolidayHours(weeklyScheduledHours)) * law.weeksPerMonth);
}

/** 주휴 발생 주 수: explicit value wins, else ⌊근로일수 ÷ 주 근무일수⌋, else null. */
export function holidayWeeksFrom(opts: {
  holidayWeeks: number | null;
  workDays: number | null;
  weeklyWorkDays: number | null;
}): number | null {
  if (opts.holidayWeeks != null && opts.holidayWeeks >= 0) return opts.holidayWeeks;
  if (opts.workDays == null || opts.weeklyWorkDays == null || !(opts.weeklyWorkDays > 0)) return null;
  return Math.floor(opts.workDays / opts.weeklyWorkDays + 1e-9);
}

/** 지방소득세 = 소득세 × 10%, 10원 미만 절사. */
export function localIncomeTax(incomeTax: number): number {
  if (!(incomeTax > 0)) return 0;
  return floorTo(incomeTax * WITHHOLDING.value.localRatio, TAX_TRUNCATION.value.unit);
}

const h = (n: number) => `${formatNumber(n, 2)}시간`;
const mult = (n: number) => formatNumber(n, 2);

export function calcPayslip(input: PayslipInput): CalcResult<PayslipResult> {
  const c = new Check();
  const hourly = input.payType === "hourly";
  if (hourly) {
    c.req("hourlyWage", "시급", input.hourlyWage);
    c.req("workHours", "기본 근로시간", input.workHours);
    c.positive("hourlyWage", "시급", input.hourlyWage);
  } else {
    c.req("monthlySalary", "월급", input.monthlySalary);
    c.positive("monthlySalary", "월급", input.monthlySalary);
  }
  c.min("workHours", "기본 근로시간", input.workHours, 0);
  c.min("workDays", "근로일수", input.workDays, 0);
  c.min("holidayWeeks", "주휴 발생 주 수", input.holidayWeeks, 0);
  c.min("overtimeHours", "연장근로 시간", input.overtimeHours, 0);
  c.min("nightHours", "야간근로 시간", input.nightHours, 0);
  c.min("holidayHours", "휴일근로(8시간 이내) 시간", input.holidayHours, 0);
  c.min("holidayOver8Hours", "휴일근로(8시간 초과) 시간", input.holidayOver8Hours, 0);
  c.min("incomeTax", "소득세", input.incomeTax, 0);
  c.positive("weeklyScheduledHours", "주 소정근로시간", input.weeklyScheduledHours);
  const extra: FieldIssue[] = [];
  if (input.weeklyScheduledHours != null && input.weeklyScheduledHours > 168)
    extra.push({ field: "weeklyScheduledHours", message: "주 소정근로시간은 168시간(7일 × 24시간)을 넘을 수 없어요." });
  if (input.weeklyWorkDays != null && (input.weeklyWorkDays < 1 || input.weeklyWorkDays > 7))
    extra.push({ field: "weeklyWorkDays", message: "주 근무일수는 1~7일 사이로 입력해 주세요." });
  input.allowances.forEach((r, i) => {
    if (r.amount != null && r.amount < 0) extra.push({ field: `allowance-${i}`, message: `${r.name || "기타 수당"} 금액은 0 이상이어야 해요.` });
  });
  input.otherDeductions.forEach((r, i) => {
    if (r.amount != null && r.amount < 0) extra.push({ field: `deduction-${i}`, message: `${r.name || "기타 공제"} 금액은 0 이상이어야 해요.` });
  });
  c.issues.push(...extra);
  const early = c.result<PayslipResult>();
  if (early) return early;

  const law = LABOR_LAW.value;
  const m = premiumMultipliers(input.under5);
  const notes: string[] = [];
  const warnings: string[] = [];
  const earnings: PayslipLine[] = [];

  // 1) 통상시급
  let ordinaryHourly: number;
  let monthlyStdHours: number | null = null;
  let exactHourly: number;
  if (hourly) {
    ordinaryHourly = input.hourlyWage!;
    exactHourly = ordinaryHourly;
  } else {
    monthlyStdHours = monthlyStandardHours(input.weeklyScheduledHours);
    exactHourly = input.monthlySalary! / monthlyStdHours;
    ordinaryHourly = roundWon(exactHourly);
  }
  const ord = formatWon(ordinaryHourly);

  // 2) 기본급
  if (hourly) {
    const wh = input.workHours!;
    earnings.push({ key: "base", label: "기본급", amount: roundWon(ordinaryHourly * wh), method: `${ord} × ${h(wh)}` });
  } else {
    earnings.push({
      key: "base",
      label: "기본급",
      amount: roundWon(input.monthlySalary!),
      method: `월 고정급 (주휴수당 포함, 통상시급 ${formatWon(input.monthlySalary!)} ÷ ${formatNumber(monthlyStdHours)}시간 ≈ ${ord})`,
    });
  }

  // 3) 주휴수당 (시급제)
  let weeklyHolidayEligible: boolean | null = null;
  let whHours = 0;
  let weeks: number | null = null;
  if (hourly) {
    const w = input.weeklyScheduledHours;
    if (w == null) {
      notes.push("주 소정근로시간을 입력하면 주휴수당을 함께 계산해요.");
    } else if (w < law.weeklyHolidayMinHours) {
      weeklyHolidayEligible = false;
      notes.push(`주 소정근로시간이 ${law.weeklyHolidayMinHours}시간 미만이라 주휴수당 대상이 아니에요.`);
    } else {
      weeklyHolidayEligible = true;
      whHours = weeklyHolidayHours(w);
      weeks = holidayWeeksFrom(input);
      if (weeks == null) {
        warnings.push("주휴수당 대상이지만 주휴 발생 주 수를 알 수 없어요. 근로일수와 주 근무일수(또는 주휴 발생 주 수)를 입력해 주세요.");
      } else if (weeks > 0) {
        const hoursNote = w < law.fullTimeWeeklyHours ? ` (주 ${formatNumber(w, 2)}시간 ÷ ${law.fullTimeWeeklyHours} × ${law.dailyStandardHours})` : "";
        earnings.push({
          key: "weeklyHoliday",
          label: "주휴수당",
          amount: roundWon(ordinaryHourly * whHours * weeks),
          method: `${ord} × ${h(whHours)}${hoursNote} × ${formatNumber(weeks, 2)}주`,
        });
      }
    }
  } else {
    notes.push("월급제는 기본급에 주휴수당이 포함돼 있어 따로 적지 않아요.");
  }

  // 4) 가산수당
  const ot = input.overtimeHours ?? 0;
  if (ot > 0) {
    earnings.push({
      key: "overtime",
      label: "연장근로수당",
      amount: roundWon(ordinaryHourly * ot * m.overtime),
      method: `${ord} × ${h(ot)} × ${mult(m.overtime)}`,
    });
  }
  const night = input.nightHours ?? 0;
  if (night > 0 && m.night > 0) {
    earnings.push({
      key: "night",
      label: "야간근로수당",
      amount: roundWon(ordinaryHourly * night * m.night),
      method: `${ord} × ${h(night)} × ${mult(m.night)} (가산분)`,
    });
  }
  const hol = input.holidayHours ?? 0;
  const hol8 = input.holidayOver8Hours ?? 0;
  if (hol > 0 || hol8 > 0) {
    const parts: string[] = [];
    if (hol > 0) parts.push(`${ord} × ${h(hol)} × ${mult(m.holidayUpTo8)}`);
    if (hol8 > 0) parts.push(`${ord} × ${h(hol8)} × ${mult(m.holidayOver8)}`);
    earnings.push({
      key: "holiday",
      label: "휴일근로수당",
      amount: roundWon(ordinaryHourly * (hol * m.holidayUpTo8 + hol8 * m.holidayOver8)),
      method: parts.join(" + "),
    });
  }
  if (input.under5 && (ot > 0 || night > 0 || hol > 0 || hol8 > 0)) {
    notes.push("상시 5인 미만 사업장이라 연장·야간·휴일 가산수당(50%)은 적용하지 않고, 일한 시간만큼만 통상임금으로 계산했어요.");
  }
  if (hourly && night > (input.workHours ?? 0) + ot + hol + hol8) {
    warnings.push("야간근로 시간이 전체 근로시간보다 많아요. 야간시간은 기본·연장·휴일 시간 중 22시~6시에 일한 시간이에요.");
  }

  // 5) 기타 수당
  let nonTaxableTotal = 0;
  input.allowances.forEach((r, i) => {
    if (r.amount == null || r.amount === 0) return;
    if (r.nonTaxable) nonTaxableTotal += r.amount;
    earnings.push({
      key: `allowance-${i}`,
      label: r.name.trim() || "기타 수당",
      amount: roundWon(r.amount),
      method: r.nonTaxable ? "정액 (비과세)" : "정액",
    });
  });

  const grossPay = earnings.reduce((s, l) => s + l.amount, 0);

  // 6) 4대보험
  const insuranceBase = Math.max(0, grossPay - nonTaxableTotal);
  const insurance = computeSocialInsurance({
    monthlyWage: insuranceBase,
    enabled: { ...(input.insurance ?? {}), industrial: false },
  });
  const deductions: PayslipLine[] = [];
  const bi = insurance.byKey;
  if (bi.pension.enabled && bi.pension.employee > 0)
    deductions.push({
      key: "pension",
      label: "국민연금",
      amount: bi.pension.employee,
      method: `기준소득월액 ${formatWon(bi.pension.base)} × ${formatPercent(bi.pension.employeeRate, 3)}`,
    });
  if (bi.health.enabled && bi.health.employee > 0)
    deductions.push({
      key: "health",
      label: "건강보험",
      amount: bi.health.employee,
      method: `${formatWon(bi.health.base)} × ${formatPercent(bi.health.employeeRate, 3)}`,
    });
  if (bi.longTermCare.enabled && bi.longTermCare.employee > 0)
    deductions.push({
      key: "longTermCare",
      label: "장기요양보험",
      amount: bi.longTermCare.employee,
      method: `건강보험료 ${formatWon(bi.longTermCare.base)} × ${formatPercent(bi.longTermCare.employeeRate, 2)}`,
    });
  if (bi.employment.enabled && bi.employment.employee > 0)
    deductions.push({
      key: "employment",
      label: "고용보험",
      amount: bi.employment.employee,
      method: `${formatWon(bi.employment.base)} × ${formatPercent(bi.employment.employeeRate, 2)}`,
    });

  // 7) 세금
  const tax = input.incomeTax ?? 0;
  if (tax > 0) {
    const local = localIncomeTax(tax);
    deductions.push({ key: "incomeTax", label: "소득세", amount: roundWon(tax), method: "근로소득 간이세액표 기준 (직접 입력)" });
    deductions.push({
      key: "localTax",
      label: "지방소득세",
      amount: local,
      method: `소득세 ${formatWon(tax)} × ${formatPercent(WITHHOLDING.value.localRatio, 0)} (10원 미만 절사)`,
    });
  }
  input.otherDeductions.forEach((r, i) => {
    if (r.amount == null || r.amount === 0) return;
    deductions.push({ key: `deduction-${i}`, label: r.name.trim() || "기타 공제", amount: roundWon(r.amount), method: "정액" });
  });

  const totalDeductions = deductions.reduce((s, l) => s + l.amount, 0);
  const netPay = grossPay - totalDeductions;

  // Checks
  const minimumWage = minimumWageFor(input.wageDate || null);
  const belowMinimumWage = exactHourly < minimumWage.hourly;
  if (belowMinimumWage) {
    warnings.push(
      hourly
        ? `시급 ${formatWon(exactHourly)}이 ${minimumWage.year}년 최저임금(${formatWon(minimumWage.hourly)})보다 낮아요. 최저임금 미달은 최저임금법 위반이에요.`
        : `월급을 시간당으로 바꾸면 약 ${formatWon(exactHourly)}(월 ${formatNumber(monthlyStdHours)}시간 기준)으로 ${minimumWage.year}년 최저임금(${formatWon(minimumWage.hourly)})보다 낮아요.`,
    );
  }
  if (netPay < 0) warnings.push("공제액이 지급액보다 많아 실지급액이 마이너스예요. 공제 항목을 확인해 주세요.");
  if (insurance.pensionClamped === "min" && bi.pension.enabled)
    notes.push("국민연금은 기준소득월액 하한이 적용돼 실제 보수보다 높은 금액 기준으로 계산됐어요.");

  return ok(
    {
      payType: input.payType,
      ordinaryHourly,
      monthlyStdHours,
      weeklyHolidayEligible,
      weeklyHolidayHours: whHours,
      holidayWeeks: weeks,
      earnings,
      deductions,
      grossPay,
      totalDeductions,
      netPay,
      nonTaxableTotal,
      insuranceBase,
      insurance,
      minimumWage,
      belowMinimumWage,
      multipliers: m,
      notes,
    },
    warnings,
  );
}
