// 인건비 비율 계산기 — pure functions.
//
// Calculation order & rounding:
// 1) 사업주 4대보험 부담 (선택) = 직원 급여 합계 × 사업주 합산 요율
//    (employerRateApprox: 국민연금 + 건강 + 장기요양 + 고용(실업급여+고용안정)
//    + 산재(업종+출퇴근)). 급여 합계를 한 사람 급여처럼 요율만 곱하는 근사로,
//    국민연금 상·하한과 10원 절사는 무시해요. 원 단위 반올림.
//    사장님 인건비에는 4대보험을 붙이지 않아요 (대표자는 직장가입 근로자가 아님).
// 2) 총 인건비 = 직원 급여 합계 + 사업주 4대보험 부담 + 사장님 인건비.
// 3) 인건비 비율 = 총 인건비 ÷ 월 매출 (매출 0 → 계산 불가). Not rounded.
// 4) 진단 구간: LABOR_RATIO_BANDS (가정값) — ratio ≤ max of the first band that fits.

import { Check, impossible, ok, type CalcResult } from "./types";
import { roundWon, safeDiv } from "./num";
import { LABOR_RATIO_BANDS } from "./rates/laborTax";
import { employerRateApprox } from "./socialInsurance";

export interface LaborRatioInput {
  monthlySales: number | null;
  staffPayroll: number | null;
  /** 사장님 인건비 (optional, null → 0) */
  ownerPay?: number | null;
  includeEmployerInsurance?: boolean;
  industryKey?: string;
  employerSizeKey?: string;
}

export type LaborBandKey = "good" | "normal" | "caution" | "danger";

export interface LaborRatioResult {
  monthlySales: number;
  staffPayroll: number;
  ownerPay: number;
  employerRate: number;
  employerInsurance: number;
  totalLabor: number;
  ratio: number;
  /** 직원 급여 + 4대보험만 (사장님 인건비 제외) */
  staffRatio: number;
  band: { key: LaborBandKey; label: string; tone: "good" | "default" | "warn" | "bad"; message: string };
  /** 현재 구간의 상한 비율 기준 월 매출 (다음 단계로 내려가려면) — null if already best band */
  salesForBetterBand: { label: string; sales: number } | null;
}

export function laborBand(ratio: number): LaborRatioResult["band"] {
  const bands = LABOR_RATIO_BANDS.value;
  const b = bands.find((x) => ratio <= x.max) ?? bands[bands.length - 1];
  return { key: b.key as LaborBandKey, label: b.label, tone: b.tone, message: b.message };
}

export function calcLaborRatio(input: LaborRatioInput): CalcResult<LaborRatioResult> {
  const c = new Check();
  const sales = c.req("monthlySales", "월 매출", input.monthlySales);
  const payroll = c.req("staffPayroll", "직원 급여 합계", input.staffPayroll);
  c.min("monthlySales", "월 매출", input.monthlySales, 0);
  c.min("staffPayroll", "직원 급여 합계", input.staffPayroll, 0);
  c.min("ownerPay", "사장님 인건비", input.ownerPay ?? null, 0);
  const early = c.result<LaborRatioResult>();
  if (early) return early;

  const ownerPay = input.ownerPay ?? 0;
  const employerRate = input.includeEmployerInsurance ? employerRateApprox({ industryKey: input.industryKey, employerSizeKey: input.employerSizeKey }) : 0;
  const employerInsurance = roundWon(payroll * employerRate);
  const totalLabor = payroll + employerInsurance + ownerPay;

  const ratio = safeDiv(totalLabor, sales);
  if (ratio == null)
    return impossible<LaborRatioResult>("월 매출이 0원이면 매출 대비 비율을 계산할 수 없어요. 매출을 입력해 주세요.", {
      employerInsurance,
      totalLabor,
    });

  const band = laborBand(ratio);
  const bands = LABOR_RATIO_BANDS.value;
  const idx = bands.findIndex((b) => b.key === band.key);
  let salesForBetterBand: LaborRatioResult["salesForBetterBand"] = null;
  if (idx > 0 && totalLabor > 0) {
    const target = bands[idx - 1];
    const need = safeDiv(totalLabor, target.max);
    if (need != null) salesForBetterBand = { label: target.label, sales: Math.ceil(need) };
  }

  const warnings: string[] = [];
  if (ratio > 1) warnings.push("인건비가 매출보다 많아요. 입력한 기간(월)이 서로 맞는지 확인해 주세요.");
  if (totalLabor === 0) warnings.push("인건비가 0원이에요. 직원 급여나 사장님 인건비를 입력해 보세요.");

  return ok(
    {
      monthlySales: sales,
      staffPayroll: payroll,
      ownerPay,
      employerRate,
      employerInsurance,
      totalLabor,
      ratio,
      staffRatio: (payroll + employerInsurance) / sales,
      band,
      salesForBetterBand,
    },
    warnings,
  );
}
