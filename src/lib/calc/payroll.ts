// 4대보험 공제 계산기 — pure functions (wraps socialInsurance.ts).
//
// Calculation order & rounding:
// 1) 보험료 부과 기준 = 세전 월급 − 비과세 금액 (식대 등, optional).
// 2) computeSocialInsurance(기준 금액) — every share 10원 미만 절사, 국민연금은
//    기준소득월액(천원 미만 절사 + 상·하한) 기준, 장기요양 = 절사된 건강보험료
//    × 비율 → 10원 미만 절사. See socialInsurance.ts.
// 3) 공제 후 금액 = 세전 월급 − 근로자 4대보험 합계. 소득세·지방소득세는
//    제외 (간이세액표·부양가족 수에 따라 달라져서 계산하지 않음).
// 4) 총 고용비용 = 세전 월급 + 사업주 부담 합계 (산재 포함).

import { Check, ok, type CalcResult } from "./types";
import { LABOR_LAW, minimumWageFor } from "./rates";
import { computeSocialInsurance, type InsuranceEnabled, type SocialInsuranceResult } from "./socialInsurance";

export interface PayrollInput {
  monthlyWage: number | null;
  /** 비과세 금액 (식대 등). null → 0. */
  nonTaxable?: number | null;
  industryKey?: string;
  employerSizeKey?: string;
  enabled?: Partial<InsuranceEnabled>;
}

export interface PayrollResult {
  monthlyWage: number;
  nonTaxable: number;
  /** 보험료 부과 기준 금액 */
  insuredWage: number;
  insurance: SocialInsuranceResult;
  /** 세전 월급 − 근로자 부담 (소득세 제외) */
  netPay: number;
  /** 세전 월급 + 사업주 부담 */
  totalCost: number;
  /** 근로자 부담 ÷ 세전 월급 */
  employeeShareRate: number;
  /** 사업주 부담 ÷ 세전 월급 */
  employerShareRate: number;
}

/** 주 40시간 기준 최저 월급 (최저시급 × 월 소정근로시간 209h). */
export function minimumMonthlyWage(year?: number): { year: number; amount: number } {
  const mw = minimumWageFor(year != null ? `${year}-06-30` : null);
  return { year: mw.year, amount: mw.hourly * LABOR_LAW.value.monthlyStandardHours };
}

export function calcPayroll(input: PayrollInput): CalcResult<PayrollResult> {
  const c = new Check();
  const wage = c.req("monthlyWage", "세전 월급", input.monthlyWage);
  c.positive("monthlyWage", "세전 월급", input.monthlyWage);
  c.min("nonTaxable", "비과세 금액", input.nonTaxable ?? null, 0);
  if (input.monthlyWage != null && input.nonTaxable != null && input.nonTaxable > input.monthlyWage)
    c.issues.push({ field: "nonTaxable", message: "비과세 금액은 세전 월급보다 클 수 없어요." });
  const early = c.result<PayrollResult>();
  if (early) return early;

  const nonTaxable = input.nonTaxable ?? 0;
  const insuredWage = wage - nonTaxable;
  const insurance = computeSocialInsurance({
    monthlyWage: insuredWage,
    enabled: input.enabled,
    industryKey: input.industryKey,
    employerSizeKey: input.employerSizeKey,
  });

  const warnings: string[] = [];
  const min = minimumMonthlyWage();
  if (wage < min.amount)
    warnings.push(
      `주 40시간 기준 ${min.year}년 최저 월급(${min.amount.toLocaleString("ko-KR")}원)보다 적어요. 단시간 근로자라면 괜찮지만, 풀타임이라면 최저임금을 확인하세요.`,
    );
  if (insurance.pensionClamped === "min" && insurance.byKey.pension.enabled)
    warnings.push(`국민연금은 기준소득월액 하한(${insurance.pensionBase.toLocaleString("ko-KR")}원)을 적용해 계산했어요.`);
  if (insurance.pensionClamped === "max" && insurance.byKey.pension.enabled)
    warnings.push(`국민연금은 기준소득월액 상한(${insurance.pensionBase.toLocaleString("ko-KR")}원)까지만 부과돼요.`);

  return ok(
    {
      monthlyWage: wage,
      nonTaxable,
      insuredWage,
      insurance,
      netPay: wage - insurance.employeeTotal,
      totalCost: wage + insurance.employerTotal,
      employeeShareRate: insurance.employeeTotal / wage,
      employerShareRate: insurance.employerTotal / wage,
    },
    warnings,
  );
}
