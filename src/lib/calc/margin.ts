// 마진 계산기 — pure functions.
//
// Calculation order & rounding:
// 1) priceForMargin: 필요 판매가 = 원가 ÷ (1 − 목표 마진율), then rounded UP to
//    whole won so the realised margin never falls below the target. Margin
//    amount / rates are recomputed from the rounded price.
// 2) marginOfPrice: 마진액 = 판매가 − 원가; 마진율 = 마진액 ÷ 판매가;
//    원가율 = 원가 ÷ 판매가; 마크업률 = 마진액 ÷ 원가 (원가 0이면 계산 불가 → null).
// Rates are ratios (0.3 = 30%). No intermediate rounding.

import { Check, impossible, ok, type CalcResult } from "./types";
import { pct, safeDiv } from "./num";

export interface PriceForMarginInput {
  cost: number | null;
  /** 목표 마진율 (%) */
  targetMarginPct: number | null;
}

export interface MarginFigures {
  price: number;
  cost: number;
  marginAmount: number;
  marginRate: number;
  costRate: number;
  /** null when cost is 0 (markup undefined). */
  markupRate: number | null;
}

export function priceForMargin(input: PriceForMarginInput): CalcResult<MarginFigures & { exactPrice: number }> {
  const c = new Check();
  const cost = c.req("cost", "원가", input.cost);
  const m = c.req("targetMarginPct", "목표 마진율", input.targetMarginPct);
  c.positive("cost", "원가", input.cost);
  if (input.targetMarginPct != null && input.targetMarginPct >= 100) {
    return impossible("마진율 100% 이상은 원가가 0원일 때만 가능해서 판매가를 정할 수 없어요. 100% 미만으로 입력해 주세요.");
  }
  c.percent("targetMarginPct", "목표 마진율", input.targetMarginPct, { below100: true });
  const early = c.result<MarginFigures & { exactPrice: number }>();
  if (early) return early;

  const exactPrice = cost / (1 - pct(m));
  const price = Math.ceil(exactPrice - 1e-9);
  const marginAmount = price - cost;
  return ok({
    exactPrice,
    price,
    cost,
    marginAmount,
    marginRate: safeDiv(marginAmount, price) ?? 0,
    costRate: safeDiv(cost, price) ?? 0,
    markupRate: safeDiv(marginAmount, cost),
  });
}

export interface MarginOfPriceInput {
  cost: number | null;
  price: number | null;
}

export function marginOfPrice(input: MarginOfPriceInput): CalcResult<MarginFigures> {
  const c = new Check();
  const cost = c.req("cost", "원가", input.cost);
  const price = c.req("price", "판매가", input.price);
  c.min("cost", "원가", input.cost, 0);
  c.positive("price", "판매가", input.price);
  const early = c.result<MarginFigures>();
  if (early) return early;

  const marginAmount = price - cost;
  const warnings: string[] = [];
  if (marginAmount < 0) warnings.push("판매가가 원가보다 낮아 팔수록 손해예요.");
  if (cost === 0) warnings.push("원가가 0원이라 마크업률은 계산할 수 없어요.");
  return ok(
    {
      price,
      cost,
      marginAmount,
      marginRate: marginAmount / price,
      costRate: cost / price,
      markupRate: safeDiv(marginAmount, cost),
    },
    warnings,
  );
}
