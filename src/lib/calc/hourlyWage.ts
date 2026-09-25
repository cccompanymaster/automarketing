// 시급·주휴수당 계산기 — pure functions.
//
// Calculation order & rounding:
// 1) 주 소정근로시간 = 하루 근무시간 × 주 근무일수 (no rounding).
// 2) 주휴시간 = min(주 소정근로시간, 40) ÷ 40 × 8 when 주 소정근로시간 ≥ 15,
//    else 0 (LABOR_LAW.weeklyHolidayMinHours / fullTimeWeeklyHours /
//    dailyStandardHours). Not rounded (shown to 2 decimals).
// 3) 일급 = 시급 × 하루 근무시간; 기본 주급 = 시급 × 주 소정근로시간;
//    주휴수당 = 시급 × 주휴시간 — each 원 단위 반올림 (roundWon).
// 4) 주급 합계 = 기본 주급 + 주휴수당 (already whole won).
// 5) 월 환산 급여 = 주급 합계 × LABOR_LAW.weeksPerMonth (365 ÷ 7 ÷ 12 ≈ 4.345주),
//    원 단위 반올림. (고용노동부의 "209시간" 월급은 같은 계수를 시간 단위에서
//    올림한 값이라 주 40시간이면 몇 천 원 차이가 나요.)
// 6) 최저임금 check uses minimumWageFor(year) — compares 시급 only.
// 연장·야간·휴일 가산수당은 포함하지 않아요.

import { Check, ok, type CalcResult } from "./types";
import { roundWon } from "./num";
import { LABOR_LAW, MINIMUM_WAGE, minimumWageFor } from "./rates";

export interface HourlyWageInput {
  hourlyWage: number | null;
  hoursPerDay: number | null;
  daysPerWeek: number | null;
  /** 최저임금 비교 연도 (default: MINIMUM_WAGE.currentYear). */
  minWageYear?: number;
}

export interface HourlyWageResult {
  hourlyWage: number;
  hoursPerDay: number;
  daysPerWeek: number;
  weeklyHours: number;
  /** 주휴수당 요건 (주 15시간 이상) 충족 여부 */
  eligible: boolean;
  holidayHours: number;
  dailyPay: number;
  weeklyBase: number;
  holidayPay: number;
  weeklyTotal: number;
  /** 주급 합계 × 4.345주 */
  monthlyPay: number;
  /** (주 소정근로시간 + 주휴시간) × 4.345주 */
  monthlyHours: number;
  minWage: { year: number; hourly: number };
  belowMinimum: boolean;
  /** 최저임금 기준으로 부족한 시급 (0 이상) */
  minWageShortfall: number;
}

/** 주휴시간 for a weekly contracted hours value (0 if under the 15h rule). */
export function weeklyHolidayHours(weeklyHours: number): number {
  const law = LABOR_LAW.value;
  if (!(weeklyHours >= law.weeklyHolidayMinHours)) return 0;
  return (Math.min(weeklyHours, law.fullTimeWeeklyHours) / law.fullTimeWeeklyHours) * law.dailyStandardHours;
}

export function calcHourlyWage(input: HourlyWageInput): CalcResult<HourlyWageResult> {
  const c = new Check();
  const hourly = c.req("hourlyWage", "시급", input.hourlyWage);
  const hours = c.req("hoursPerDay", "하루 근무시간", input.hoursPerDay);
  const days = c.req("daysPerWeek", "주 근무일수", input.daysPerWeek);
  c.positive("hourlyWage", "시급", input.hourlyWage);
  c.positive("hoursPerDay", "하루 근무시간", input.hoursPerDay);
  c.positive("daysPerWeek", "주 근무일수", input.daysPerWeek);
  if (input.hoursPerDay != null && input.hoursPerDay > 24)
    c.issues.push({ field: "hoursPerDay", message: "하루 근무시간은 24시간을 넘을 수 없어요." });
  if (input.daysPerWeek != null && input.daysPerWeek > 7)
    c.issues.push({ field: "daysPerWeek", message: "주 근무일수는 7일을 넘을 수 없어요." });
  const early = c.result<HourlyWageResult>();
  if (early) return early;

  const law = LABOR_LAW.value;
  const weeklyHours = hours * days;
  const holidayHours = weeklyHolidayHours(weeklyHours);
  const eligible = holidayHours > 0;
  const dailyPay = roundWon(hourly * hours);
  const weeklyBase = roundWon(hourly * weeklyHours);
  const holidayPay = roundWon(hourly * holidayHours);
  const weeklyTotal = weeklyBase + holidayPay;
  const monthlyPay = roundWon(weeklyTotal * law.weeksPerMonth);
  const monthlyHours = (weeklyHours + holidayHours) * law.weeksPerMonth;

  const minWage = minimumWageFor(input.minWageYear != null ? `${input.minWageYear}-06-30` : null);
  const belowMinimum = hourly < minWage.hourly;

  const warnings: string[] = [];
  if (belowMinimum)
    warnings.push(
      `입력한 시급이 ${minWage.year}년 최저임금(${minWage.hourly.toLocaleString("ko-KR")}원)보다 ${(minWage.hourly - hourly).toLocaleString("ko-KR")}원 낮아요. 최저임금 미달은 법 위반이에요.`,
    );
  if (!eligible)
    warnings.push(`주 소정근로시간이 ${law.weeklyHolidayMinHours}시간 미만이라 주휴수당 지급 대상이 아니에요.`);
  if (hours > law.dailyStandardHours || weeklyHours > law.fullTimeWeeklyHours)
    warnings.push(
      `하루 ${law.dailyStandardHours}시간 또는 주 ${law.fullTimeWeeklyHours}시간을 넘는 시간은 연장근로예요. 5인 이상 사업장이면 가산수당(${Math.round(law.overtimePremium * 100)}%)이 붙지만 이 계산에는 포함하지 않았어요.`,
    );

  return ok(
    {
      hourlyWage: hourly,
      hoursPerDay: hours,
      daysPerWeek: days,
      weeklyHours,
      eligible,
      holidayHours,
      dailyPay,
      weeklyBase,
      holidayPay,
      weeklyTotal,
      monthlyPay,
      monthlyHours,
      minWage,
      belowMinimum,
      minWageShortfall: Math.max(0, minWage.hourly - hourly),
    },
    warnings,
  );
}

/** Years with a configured 최저임금 (for quick-input presets). */
export function minimumWageYears(): number[] {
  return Object.keys(MINIMUM_WAGE.value.byYear)
    .map(Number)
    .sort((a, b) => a - b);
}
