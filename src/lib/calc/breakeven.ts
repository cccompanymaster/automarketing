// 손익분기점 계산기 — pure functions.
//
// Calculation order & rounding:
// 1) 공헌이익률 = 1 − 변동비율 (변동비율 ≥ 100% → impossible: 팔수록 손해라
//    손익분기점이 없음)
// 2) 손익분기 월매출 = 월 고정비 ÷ 공헌이익률, 원 단위 올림 (그 매출이면
//    적자가 아님이 보장되도록)
// 3) 필요 월 주문 수 = ⌈정확한 손익분기 매출 ÷ 객단가⌉ (개수는 올림)
// 4) 일평균 = 월 값 ÷ 영업일수 (기본 30일 — 매일 여는 가게 기준. 주 6일이면
//    26일 정도로 바꿔 입력). 일평균 주문 수는 소수 그대로와 올림을 함께 제공.
//    일평균 매출은 원 단위 올림.

import { Check, impossible, ok, type CalcResult } from "./types";
import { ceilTo, pct } from "./num";

/** Default 영업일수 per month when the user leaves it empty. */
export const DEFAULT_BUSINESS_DAYS = 30;

export interface BreakevenInput {
  fixedCost: number | null;
  /** 변동비율 (%) — 원재료·수수료·포장 등 매출에 비례하는 비용 */
  variablePct: number | null;
  /** 객단가 (선택) */
  avgTicket?: number | null;
  /** 월 영업일수 (선택, 기본 30) */
  businessDays?: number | null;
}

export interface BreakevenResult {
  fixedCost: number;
  variableRate: number;
  contributionRate: number;
  salesExact: number;
  /** 원 단위 올림 */
  sales: number;
  businessDays: number;
  /** 원 단위 올림 */
  dailySales: number;
  avgTicket: number | null;
  orders: number | null;
  dailyOrdersExact: number | null;
  dailyOrders: number | null;
  /** 손익분기 매출에서의 변동비 (= 매출 × 변동비율) */
  variableCostAtBep: number;
}

export function calcBreakeven(input: BreakevenInput): CalcResult<BreakevenResult> {
  const c = new Check();
  const fixedCost = c.req("fixedCost", "월 고정비", input.fixedCost);
  const v = c.req("variablePct", "변동비율", input.variablePct);
  c.positive("fixedCost", "월 고정비", input.fixedCost);
  c.min("variablePct", "변동비율", input.variablePct, 0);
  const avgTicket = input.avgTicket ?? null;
  c.positive("avgTicket", "객단가", avgTicket);
  const daysIn = input.businessDays ?? null;
  if (daysIn != null && (daysIn < 1 || daysIn > 31)) {
    c.issues.push({ field: "businessDays", message: "영업일수는 1~31일 사이로 입력해 주세요." });
  }
  const early = c.result<BreakevenResult>();
  if (early) return early;

  if (v >= 100) {
    return impossible(
      "변동비율이 100% 이상이면 팔 때마다 매출보다 비용이 더 나가서, 매출을 아무리 늘려도 고정비를 메울 수 없어요. 원가·수수료 구조부터 점검해 주세요.",
    );
  }

  const variableRate = pct(v);
  const contributionRate = 1 - variableRate;
  const salesExact = fixedCost / contributionRate;
  const sales = ceilTo(salesExact, 1);
  const businessDays = daysIn ?? DEFAULT_BUSINESS_DAYS;
  const orders = avgTicket != null ? ceilTo(salesExact / avgTicket, 1) : null;
  const dailyOrdersExact = orders != null ? orders / businessDays : null;

  const warnings: string[] = [];
  if (variableRate >= 0.8) warnings.push("변동비율이 80% 이상이라 한 건당 남는 돈이 적어요. 매출이 조금만 줄어도 적자로 돌아설 수 있어요.");

  return ok(
    {
      fixedCost,
      variableRate,
      contributionRate,
      salesExact,
      sales,
      businessDays,
      dailySales: ceilTo(salesExact / businessDays, 1),
      avgTicket,
      orders,
      dailyOrdersExact,
      dailyOrders: dailyOrdersExact != null ? ceilTo(dailyOrdersExact, 1) : null,
      variableCostAtBep: salesExact * variableRate,
    },
    warnings,
  );
}
