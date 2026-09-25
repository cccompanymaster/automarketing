// 쿠폰·리뷰이벤트 계산기 — pure functions.
//
// Calculation order (full precision; only 본전 주문 수 is rounded):
//   평균 쿠폰 부담   = 쿠폰액 × 업주 부담률 × 사용률
//   평균 리뷰 부담   = 리뷰 서비스 원가 × 참여율
//   이벤트 후 주문당 이익 = 현재 주문당 이익 − 평균 쿠폰 부담 − 평균 리뷰 부담
//   기존 월 이익     = 현재 주문당 이익 × 월 주문 수
//   본전 주문 수     = (기존 월 이익 + 월 고정 이벤트비) ÷ 이벤트 후 주문당 이익 → 올림
//                      (orders are whole, and rounding up guarantees 이익 ≥ 기존)
//   필요한 증가 건수 = 본전 주문 수 − 월 주문 수; 증가율 = 증가 건수 ÷ 월 주문 수
//
// Blank rate inputs: 업주 부담률 · 사용률 · 참여율 left empty count as 100%
// (the conservative worst case). Impossible cases:
// - 이벤트 후 주문당 이익 ≤ 0 → every extra order loses money → "본전 불가".
// - 현재 주문당 이익 ≤ 0 → there is no existing profit to protect; since the
//   event can only lower per-order profit, this is always 본전 불가 as well
//   (the reason tells the owner to fix the base margin first).

import { Check, impossible, ok, type CalcResult } from "./types";
import { pct, safeDiv } from "./num";

export interface PromotionInput {
  profitPerOrder: number | null;
  monthlyOrders: number | null;
  couponAmount?: number | null;
  /** 업주 부담률 (%) — blank = 100 */
  couponOwnerPct?: number | null;
  /** 쿠폰 사용률 (%) — blank = 100 */
  couponUsagePct?: number | null;
  reviewCost?: number | null;
  /** 리뷰 이벤트 참여율 (%) — blank = 100 */
  reviewPct?: number | null;
  monthlyFixed?: number | null;
}

export interface PromotionResult {
  profitPerOrder: number;
  monthlyOrders: number;
  couponAmount: number;
  couponOwnerRate: number;
  couponUsageRate: number;
  reviewCost: number;
  reviewRate: number;
  monthlyFixed: number;
  avgCoupon: number;
  avgReview: number;
  /** 주문당 이벤트 부담 = 평균 쿠폰 + 평균 리뷰 */
  avgEventCost: number;
  afterProfitPerOrder: number;
  baseMonthlyProfit: number;
  /** 주문 수가 그대로일 때 이벤트 후 월 이익 */
  monthlyProfitIfFlat: number;
  /** 주문 수가 그대로일 때 월 이벤트 비용 */
  monthlyEventCostIfFlat: number;
  breakEvenOrders: number;
  extraOrders: number;
  /** ratio (0.25 = 25%) */
  extraRate: number;
}

export function promotion(input: PromotionInput): CalcResult<PromotionResult> {
  const c = new Check();
  const profitPerOrder = c.req("profitPerOrder", "현재 주문당 이익", input.profitPerOrder);
  const monthlyOrders = c.req("monthlyOrders", "월 주문 수", input.monthlyOrders);
  c.positive("monthlyOrders", "월 주문 수", input.monthlyOrders);
  c.min("couponAmount", "쿠폰액", input.couponAmount ?? null, 0);
  c.percent("couponOwnerPct", "업주 부담률", input.couponOwnerPct ?? null);
  c.percent("couponUsagePct", "쿠폰 사용률", input.couponUsagePct ?? null);
  c.min("reviewCost", "리뷰 서비스 원가", input.reviewCost ?? null, 0);
  c.percent("reviewPct", "리뷰 참여율", input.reviewPct ?? null);
  c.min("monthlyFixed", "월 고정 이벤트비", input.monthlyFixed ?? null, 0);
  const early = c.result<PromotionResult>();
  if (early) return early;

  const couponAmount = input.couponAmount ?? 0;
  const couponOwnerRate = pct(input.couponOwnerPct ?? 100);
  const couponUsageRate = pct(input.couponUsagePct ?? 100);
  const reviewCost = input.reviewCost ?? 0;
  const reviewRate = pct(input.reviewPct ?? 100);
  const monthlyFixed = input.monthlyFixed ?? 0;

  const avgCoupon = couponAmount * couponOwnerRate * couponUsageRate;
  const avgReview = reviewCost * reviewRate;
  const avgEventCost = avgCoupon + avgReview;
  const afterProfitPerOrder = profitPerOrder - avgEventCost;
  const baseMonthlyProfit = profitPerOrder * monthlyOrders;
  const monthlyProfitIfFlat = afterProfitPerOrder * monthlyOrders - monthlyFixed;
  const monthlyEventCostIfFlat = avgEventCost * monthlyOrders + monthlyFixed;

  const partial: Partial<PromotionResult> = {
    profitPerOrder,
    monthlyOrders,
    avgCoupon,
    avgReview,
    avgEventCost,
    afterProfitPerOrder,
    baseMonthlyProfit,
    monthlyProfitIfFlat,
    monthlyEventCostIfFlat,
  };

  if (profitPerOrder <= 0) {
    return impossible(
      "지금도 주문 한 건당 이익이 0원 이하라 이벤트로 주문을 늘려도 손실만 커져요. 먼저 판매가·원가·수수료를 조정해 주문당 이익을 플러스로 만들어 주세요.",
      partial,
    );
  }
  if (afterProfitPerOrder <= 0) {
    return impossible(
      "본전 불가 — 이벤트 비용을 빼면 주문 한 건당 이익이 0원 이하예요. 주문이 늘수록 손해가 커지니 쿠폰액·업주 부담률·리뷰 원가를 낮춰 주세요.",
      partial,
    );
  }

  const exact = safeDiv(baseMonthlyProfit + monthlyFixed, afterProfitPerOrder) ?? 0;
  const breakEvenOrders = Math.ceil(exact - 1e-9);
  const extraOrders = breakEvenOrders - monthlyOrders;
  const extraRate = safeDiv(extraOrders, monthlyOrders) ?? 0;

  const warnings: string[] = [];
  if (avgEventCost === 0 && monthlyFixed === 0) warnings.push("이벤트 비용이 0원이라 주문을 더 받지 않아도 본전이에요.");
  if (extraRate >= 0.5) warnings.push(`본전을 맞추려면 주문이 ${Math.round(extraRate * 100)}% 이상 늘어야 해요. 이벤트 효과를 보수적으로 잡고 조건을 다시 검토해 보세요.`);
  if (couponAmount > 0 && couponAmount * couponOwnerRate > profitPerOrder) {
    warnings.push("쿠폰이 쓰인 주문은 업주 부담액이 주문당 이익보다 커서 그 주문만 보면 손해예요.");
  }

  return ok(
    {
      profitPerOrder,
      monthlyOrders,
      couponAmount,
      couponOwnerRate,
      couponUsageRate,
      reviewCost,
      reviewRate,
      monthlyFixed,
      avgCoupon,
      avgReview,
      avgEventCost,
      afterProfitPerOrder,
      baseMonthlyProfit,
      monthlyProfitIfFlat,
      monthlyEventCostIfFlat,
      breakEvenOrders,
      extraOrders,
      extraRate,
    },
    warnings,
  );
}
