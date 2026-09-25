// 매출 목표 계산기 — pure functions.
//
// Calculation order & rounding:
// 1) 공헌이익률 = 1 − 변동비율 (변동비율 ≥ 100% → impossible)
// 2) 필요 월매출 = (월 고정비 + 목표 월 순이익) ÷ 공헌이익률, 원 단위 올림
//    (목표 이익 이상이 보장되도록)
// 3) 필요 월 주문 수 = ⌈정확한 필요 매출 ÷ 객단가⌉ (객단가 입력 시, 올림)
// 4) 일평균 = 월 값 ÷ 영업일수 (기본 30일). 일평균 매출은 원 단위 올림,
//    일평균 주문 수는 소수 그대로 + 올림.
// 5) 참고용 손익분기 매출 = 고정비 ÷ 공헌이익률 (올림).
// "순이익" here means 영업이익 before 소득세 — taxes are not modelled.

import { Check, impossible, ok, type CalcResult } from "./types";
import { ceilTo, pct } from "./num";

export const DEFAULT_BUSINESS_DAYS = 30;

export interface SalesTargetInput {
  targetProfit: number | null;
  fixedCost: number | null;
  variablePct: number | null;
  avgTicket?: number | null;
  businessDays?: number | null;
}

export interface SalesTargetResult {
  targetProfit: number;
  fixedCost: number;
  variableRate: number;
  contributionRate: number;
  salesExact: number;
  sales: number;
  breakevenSales: number;
  /** 필요 매출 중 목표 이익을 위해 더 필요한 부분 = sales − breakeven */
  salesAboveBreakeven: number;
  variableCost: number;
  contribution: number;
  businessDays: number;
  dailySales: number;
  avgTicket: number | null;
  orders: number | null;
  dailyOrdersExact: number | null;
  dailyOrders: number | null;
}

export function calcSalesTarget(input: SalesTargetInput): CalcResult<SalesTargetResult> {
  const c = new Check();
  const targetProfit = c.req("targetProfit", "목표 월 순이익", input.targetProfit);
  const fixedCost = c.req("fixedCost", "월 고정비", input.fixedCost);
  const v = c.req("variablePct", "변동비율", input.variablePct);
  c.min("targetProfit", "목표 월 순이익", input.targetProfit, 0);
  c.min("fixedCost", "월 고정비", input.fixedCost, 0);
  c.min("variablePct", "변동비율", input.variablePct, 0);
  const avgTicket = input.avgTicket ?? null;
  c.positive("avgTicket", "객단가", avgTicket);
  const daysIn = input.businessDays ?? null;
  if (daysIn != null && (daysIn < 1 || daysIn > 31)) {
    c.issues.push({ field: "businessDays", message: "영업일수는 1~31일 사이로 입력해 주세요." });
  }
  const early = c.result<SalesTargetResult>();
  if (early) return early;

  if (v >= 100) {
    return impossible(
      "변동비율이 100% 이상이면 매출이 늘수록 손해도 커져서 어떤 매출로도 목표 이익에 닿을 수 없어요. 원가·수수료 비중을 먼저 낮춰야 해요.",
    );
  }

  const variableRate = pct(v);
  const contributionRate = 1 - variableRate;
  const salesExact = (fixedCost + targetProfit) / contributionRate;
  const sales = ceilTo(salesExact, 1);
  const breakevenSales = ceilTo(fixedCost / contributionRate, 1);
  const businessDays = daysIn ?? DEFAULT_BUSINESS_DAYS;
  const orders = avgTicket != null ? ceilTo(salesExact / avgTicket, 1) : null;
  const dailyOrdersExact = orders != null ? orders / businessDays : null;

  const warnings: string[] = [];
  if (fixedCost + targetProfit === 0) warnings.push("고정비와 목표 이익이 모두 0원이라 필요한 매출도 0원이에요.");
  if (variableRate >= 0.8) warnings.push("변동비율이 80% 이상이라 목표 이익 대비 필요한 매출이 매우 커져요.");

  return ok(
    {
      targetProfit,
      fixedCost,
      variableRate,
      contributionRate,
      salesExact,
      sales,
      breakevenSales,
      salesAboveBreakeven: sales - breakevenSales,
      variableCost: salesExact * variableRate,
      contribution: salesExact * contributionRate,
      businessDays,
      dailySales: ceilTo(salesExact / businessDays, 1),
      avgTicket,
      orders,
      dailyOrdersExact,
      dailyOrders: dailyOrdersExact != null ? ceilTo(dailyOrdersExact, 1) : null,
    },
    warnings,
  );
}
