// 가격 인상 손익 계산기 — pure functions.
//
// Calculation order & rounding (no intermediate rounding; money is shown
// rounded to whole won by the page):
// 1) 개당 이익 = 판매가 × (1 − 수수료율) − 원가 − 주문당 고정 비용
//    · 인상 전: 현재 가격, 현재 원가
//    · 인상 후: 인상 가격, 인상 후 원가 (비워 두면 현재 원가)
//    "주문당 고정 비용" is charged once per unit sold (1 주문 = 1개 가정).
// 2) 현재 월 이익 = 인상 전 개당 이익 × 월 판매량
//    (함께 늘어나는 고정비는 인상 후에만 빼요 — 인상 전 비교 기준은 0.)
// 3) 동일 이익 판매량 = ⌈(현재 월 이익 + 추가 월 고정비) ÷ 인상 후 개당 이익⌉
//    (개수는 올림, 최소 0개)
// 4) 허용 판매량 감소 = 월 판매량 − 동일 이익 판매량 (올림된 개수 기준),
//    감소율 = 감소 개수 ÷ 월 판매량. 음수이면 "더 팔아야 함"으로 따로 표시.
// 5) 인상 후 개당 이익 ≤ 0 → impossible.

import { Check, impossible, ok, type CalcResult } from "./types";
import { ceilTo, pct } from "./num";

export interface PriceIncreaseInput {
  currentPrice: number | null;
  newPrice: number | null;
  cost: number | null;
  monthlyQty: number | null;
  /** 판매가 비례 수수료 (%, 선택) */
  feePct?: number | null;
  /** 주문(개)당 고정 비용 (선택) */
  perOrderCost?: number | null;
  /** 인상 후 원가 (선택, 비우면 현재 원가) */
  newCost?: number | null;
  /** 함께 늘어나는 월 고정비 (선택) */
  extraFixed?: number | null;
}

export interface PriceIncreaseResult {
  currentPrice: number;
  newPrice: number;
  cost: number;
  newCost: number;
  feeRate: number;
  perOrderCost: number;
  extraFixed: number;
  monthlyQty: number;
  feeBefore: number;
  feeAfter: number;
  unitProfitBefore: number;
  unitProfitAfter: number;
  monthlyProfitBefore: number;
  /** Monthly profit if 판매량 stays the same after the increase. */
  monthlyProfitAfterSameQty: number;
  /** Exact (before ceil). */
  requiredQtyExact: number;
  requiredQty: number;
  /** 월 판매량 − 동일 이익 판매량 (negative = must sell more). */
  allowedDropQty: number;
  /** allowedDropQty ÷ 월 판매량 (negative = must sell more). */
  allowedDropRate: number;
  mustSellMore: boolean;
  /** Units to add when mustSellMore (else 0). */
  extraQtyNeeded: number;
  priceChangeRate: number;
}

export function calcPriceIncrease(input: PriceIncreaseInput): CalcResult<PriceIncreaseResult> {
  const c = new Check();
  const currentPrice = c.req("currentPrice", "현재 가격", input.currentPrice);
  const newPrice = c.req("newPrice", "인상 가격", input.newPrice);
  const cost = c.req("cost", "원가", input.cost);
  const monthlyQty = c.req("monthlyQty", "월 판매량", input.monthlyQty);
  c.positive("currentPrice", "현재 가격", input.currentPrice);
  c.positive("newPrice", "인상 가격", input.newPrice);
  c.min("cost", "원가", input.cost, 0);
  c.positive("monthlyQty", "월 판매량", input.monthlyQty);
  c.percent("feePct", "수수료율", input.feePct ?? null, { below100: true });
  c.min("perOrderCost", "주문당 고정 비용", input.perOrderCost ?? null, 0);
  c.min("newCost", "인상 후 원가", input.newCost ?? null, 0);
  c.min("extraFixed", "추가 월 고정비", input.extraFixed ?? null, 0);
  const early = c.result<PriceIncreaseResult>();
  if (early) return early;

  const feeRate = pct(input.feePct ?? 0);
  const perOrderCost = input.perOrderCost ?? 0;
  const newCost = input.newCost ?? cost;
  const extraFixed = input.extraFixed ?? 0;

  const feeBefore = currentPrice * feeRate;
  const feeAfter = newPrice * feeRate;
  const unitProfitBefore = currentPrice - feeBefore - cost - perOrderCost;
  const unitProfitAfter = newPrice - feeAfter - newCost - perOrderCost;
  const monthlyProfitBefore = unitProfitBefore * monthlyQty;
  const monthlyProfitAfterSameQty = unitProfitAfter * monthlyQty - extraFixed;
  const priceChangeRate = (newPrice - currentPrice) / currentPrice;

  const base = {
    currentPrice,
    newPrice,
    cost,
    newCost,
    feeRate,
    perOrderCost,
    extraFixed,
    monthlyQty,
    feeBefore,
    feeAfter,
    unitProfitBefore,
    unitProfitAfter,
    monthlyProfitBefore,
    monthlyProfitAfterSameQty,
    priceChangeRate,
  };

  if (unitProfitAfter <= 0) {
    return impossible<PriceIncreaseResult>(
      "인상 후에도 한 개 팔 때마다 남는 돈이 0원 이하예요. 판매량과 상관없이 이익을 낼 수 없으니 가격·원가·수수료를 다시 확인해 주세요.",
      base,
    );
  }

  const warnings: string[] = [];
  if (newPrice <= currentPrice) warnings.push("인상 가격이 현재 가격보다 높지 않아요. 가격을 내리는 경우라면 판매량이 더 필요할 수 있어요.");
  if (monthlyProfitBefore <= 0) warnings.push("현재 월 이익이 0원 이하예요. 결과는 '지금보다 손해가 커지지 않는' 판매량 기준이에요.");

  const target = monthlyProfitBefore + extraFixed;
  const requiredQtyExact = Math.max(0, target / unitProfitAfter);
  const requiredQty = Math.max(0, ceilTo(requiredQtyExact, 1));
  const allowedDropQty = monthlyQty - requiredQty;
  const allowedDropRate = allowedDropQty / monthlyQty;
  const mustSellMore = allowedDropQty < 0;
  if (mustSellMore) {
    warnings.push(
      unitProfitAfter < unitProfitBefore
        ? "인상 후 개당 이익이 지금보다 적어요(원가·수수료 상승 등). 지금보다 더 팔아야 같은 이익이 나와요."
        : "추가 고정비 때문에 가격을 올려도 지금보다 더 팔아야 같은 이익이 나와요.",
    );
  }

  return ok(
    {
      ...base,
      requiredQtyExact,
      requiredQty,
      allowedDropQty,
      allowedDropRate,
      mustSellMore,
      extraQtyNeeded: mustSellMore ? -allowedDropQty : 0,
    },
    warnings,
  );
}
