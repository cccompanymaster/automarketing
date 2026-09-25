// 원천세 계산기 — pure functions.
//
// Rounding: 국고금 관리법 제47조에 따라 소득세·지방소득세 각각 10원 미만 절사
// (TAX_TRUNCATION.unit). 지방소득세는 절사된 소득세 × 10% 를 다시 10원 미만 절사.
//
// A) 프리랜서 (인적용역 사업소득, 3.3%)
//    소득세 = 지급액 × 3% → 10원 미만 절사; 지방소득세 = 소득세 × 10% → 절사;
//    실지급액 = 지급액 − (소득세 + 지방소득세).
//    소액부징수 없음: 2024-07-01 지급분부터 인적용역 사업소득은 1,000원 미만도 징수.
// B) 일용직 (일용근로소득) — 1일 단위로 계산 후 근무일수를 곱함:
//    1일 과세대상 = max(0, 일당 − 150,000)
//    1일 산출세액 = 과세대상 × 6%;  1일 소득세 = 산출세액 × (1 − 55%) → 10원 미만 절사
//    1일 소득세 < 1,000원이면 소액부징수 → 소득세·지방소득세 0
//    1일 지방소득세 = 1일 소득세 × 10% → 10원 미만 절사
//    합계 = 1일 금액 × 근무일수 (같은 일당이 매일 지급된다고 가정)

import { Check, ok, type CalcResult } from "./types";
import { floorTo } from "./num";
import { WITHHOLDING } from "./rates";
import { TAX_TRUNCATION } from "./rates/laborTax";

// +1e-6 guards float noise (1349.9999999998 is really 1,350).
const cut = (n: number) => floorTo(n + 1e-6, TAX_TRUNCATION.value.unit);

export interface FreelancerInput {
  gross: number | null;
}

export interface FreelancerResult {
  gross: number;
  incomeTax: number;
  localTax: number;
  totalTax: number;
  net: number;
  /** 실제 합계 세율 (절사 반영) */
  effectiveRate: number;
}

export function calcFreelancer(input: FreelancerInput): CalcResult<FreelancerResult> {
  const c = new Check();
  const gross = c.req("gross", "세전 지급액", input.gross);
  c.positive("gross", "세전 지급액", input.gross);
  const early = c.result<FreelancerResult>();
  if (early) return early;

  const w = WITHHOLDING.value;
  const incomeTax = cut(gross * w.businessRate);
  const localTax = cut(incomeTax * w.localRatio);
  const totalTax = incomeTax + localTax;
  const warnings: string[] = [];
  if (incomeTax === 0) warnings.push("지급액이 작아 10원 미만 절사 후 원천징수할 세금이 0원이에요.");
  return ok({ gross, incomeTax, localTax, totalTax, net: gross - totalTax, effectiveRate: totalTax / gross }, warnings);
}

export interface DailyInput {
  dailyWage: number | null;
  days: number | null;
}

export interface DailyResult {
  dailyWage: number;
  days: number;
  taxablePerDay: number;
  /** 1일 산출세액 (6%, 세액공제 전, 절사 전) */
  computedPerDay: number;
  /** 1일 근로소득세액공제 (55%, 절사 전) */
  creditPerDay: number;
  /** 1일 소득세 before 소액부징수 (절사 후) */
  incomeTaxPerDayBeforeExempt: number;
  /** 소액부징수 적용 여부 */
  smallAmountExempt: boolean;
  incomeTaxPerDay: number;
  localTaxPerDay: number;
  netPerDay: number;
  gross: number;
  incomeTax: number;
  localTax: number;
  totalTax: number;
  net: number;
  /** 세금이 0원이 되는 최대 일당 기준 (과세대상 0) */
  deductionPerDay: number;
}

export function calcDaily(input: DailyInput): CalcResult<DailyResult> {
  const c = new Check();
  const dailyWage = c.req("dailyWage", "일당", input.dailyWage);
  const days = c.req("days", "근무일수", input.days);
  c.positive("dailyWage", "일당", input.dailyWage);
  c.positive("days", "근무일수", input.days);
  if (input.days != null && input.days > 0 && !Number.isInteger(input.days))
    c.issues.push({ field: "days", message: "근무일수는 정수(일)로 입력해 주세요." });
  const early = c.result<DailyResult>();
  if (early) return early;

  const w = WITHHOLDING.value;
  const d = w.daily;
  const taxablePerDay = Math.max(0, dailyWage - d.deductionPerDay);
  const computedPerDay = taxablePerDay * d.rate;
  const creditPerDay = computedPerDay * d.taxCreditRatio;
  const incomeTaxPerDayBeforeExempt = cut(taxablePerDay * d.rate * (1 - d.taxCreditRatio));
  const smallAmountExempt = incomeTaxPerDayBeforeExempt < d.smallAmountThreshold;
  const incomeTaxPerDay = smallAmountExempt ? 0 : incomeTaxPerDayBeforeExempt;
  const localTaxPerDay = cut(incomeTaxPerDay * w.localRatio);
  const netPerDay = dailyWage - incomeTaxPerDay - localTaxPerDay;

  const incomeTax = incomeTaxPerDay * days;
  const localTax = localTaxPerDay * days;
  const warnings: string[] = [];
  if (days > 31) warnings.push("근무일수가 한 달(31일)을 넘어요. 일용직 지급명세서는 월(또는 분기) 단위로 제출하니 기간을 확인하세요.");
  return ok(
    {
      dailyWage,
      days,
      taxablePerDay,
      computedPerDay,
      creditPerDay,
      incomeTaxPerDayBeforeExempt,
      smallAmountExempt,
      incomeTaxPerDay,
      localTaxPerDay,
      netPerDay,
      gross: dailyWage * days,
      incomeTax,
      localTax,
      totalTax: incomeTax + localTax,
      net: dailyWage * days - incomeTax - localTax,
      deductionPerDay: d.deductionPerDay,
    },
    warnings,
  );
}

/** Largest 일당 that still falls under 소액부징수 (1일 소득세 < 1,000원), whole won. */
export function dailyExemptCeiling(): number {
  const d = WITHHOLDING.value.daily;
  const effective = d.rate * (1 - d.taxCreditRatio);
  // 1일 소득세 (10원 절사) < threshold ⇔ taxable × effective < threshold.
  return d.deductionPerDay + Math.ceil(d.smallAmountThreshold / effective - 1e-9) - 1;
}
