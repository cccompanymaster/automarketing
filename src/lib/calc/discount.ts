// 할인 계산기 — pure functions.
//
// Calculation order & rounding:
// 1) 할인가 (mode "rate"): 정가 × (1 − 할인율), rounded to whole won
//    (roundWon, half up). 할인액 and every margin figure are then computed
//    from that rounded 할인가 so the numbers on screen add up.
//    할인율 (mode "price"): (정가 − 할인가) ÷ 정가, no rounding.
// 2) 마진 (원가 입력 시): 할인 전 마진 = 정가 − 원가, 마진율 = 마진 ÷ 정가;
//    할인 후 마진 = 할인가 − 원가, 마진율 = 마진 ÷ 할인가.
// 3) 같은 이익을 위한 판매량 — definition used on the page:
//    "할인 전에 N개(기본 100개) 팔아 남기던 총이익을 할인 후에도 남기려면
//    몇 개를 팔아야 하나?"
//      필요 배수   = 할인 전 개당 이익 ÷ 할인 후 개당 이익
//      필요 판매량 = ⌈N × 필요 배수⌉ (개수는 올림)
//      추가 판매량 = 필요 판매량 − N
//      추가 비율   = 필요 배수 − 1   ("기존보다 X% 더")
//    This part is "impossible" (volume = null + reason) when 할인 후 개당
//    이익 ≤ 0 or when there was no profit to keep in the first place.

import { Check, ok, type CalcResult } from "./types";
import { ceilTo, pct, roundWon, safeDiv } from "./num";

export type DiscountMode = "rate" | "price";

/** Base quantity used when the user leaves 기존 판매량 empty. */
export const DEFAULT_BASE_QTY = 100;

export interface DiscountInput {
  mode: DiscountMode;
  /** 정가 */
  listPrice: number | null;
  /** 할인율 (%) — used in mode "rate". */
  discountPct: number | null;
  /** 할인가 — used in mode "price". */
  salePrice: number | null;
  /** 원가 (선택) */
  cost?: number | null;
  /** 기존 판매량 (선택, 기본 100개) */
  baseQty?: number | null;
}

export interface DiscountVolume {
  baseQty: number;
  /** 할인 전 개당 이익 ÷ 할인 후 개당 이익 */
  multiplier: number;
  requiredQty: number;
  extraQty: number;
  /** multiplier − 1 (0.25 → 25% 더) */
  extraRate: number;
  /** 할인 전 N개 총이익 */
  baseProfit: number;
}

export interface DiscountMargin {
  cost: number;
  marginBefore: number;
  marginRateBefore: number;
  marginAfter: number;
  marginRateAfter: number;
  /** null when the "same profit" part can't be computed — see volumeIssue. */
  volume: DiscountVolume | null;
  volumeIssue: string | null;
}

export interface DiscountResult {
  listPrice: number;
  salePrice: number;
  /** Exact 할인가 before rounding (mode "rate"); equals salePrice otherwise. */
  exactSalePrice: number;
  discountAmount: number;
  /** Ratio (0.2 = 20%). */
  discountRate: number;
  /** null when 원가 is empty. */
  margin: DiscountMargin | null;
}

export function calcDiscount(input: DiscountInput): CalcResult<DiscountResult> {
  const c = new Check();
  const list = c.req("listPrice", "정가", input.listPrice);
  c.positive("listPrice", "정가", input.listPrice);
  if (input.mode === "rate") {
    c.req("discountPct", "할인율", input.discountPct);
    c.percent("discountPct", "할인율", input.discountPct, { below100: true });
  } else {
    c.req("salePrice", "할인가", input.salePrice);
    c.positive("salePrice", "할인가", input.salePrice);
    if (input.salePrice != null && input.listPrice != null && input.salePrice > input.listPrice) {
      c.issues.push({ field: "salePrice", message: "할인가는 정가보다 클 수 없어요." });
    }
  }
  const cost = input.cost ?? null;
  c.min("cost", "원가", cost, 0);
  const baseQtyIn = input.baseQty ?? null;
  c.positive("baseQty", "기존 판매량", baseQtyIn);
  const early = c.result<DiscountResult>();
  if (early) return early;

  let salePrice: number;
  let exactSalePrice: number;
  if (input.mode === "rate") {
    exactSalePrice = list * (1 - pct(input.discountPct as number));
    salePrice = roundWon(exactSalePrice);
  } else {
    salePrice = input.salePrice as number;
    exactSalePrice = salePrice;
  }
  const discountAmount = list - salePrice;
  const discountRate = input.mode === "rate" ? pct(input.discountPct as number) : discountAmount / list;

  const warnings: string[] = [];
  if (input.mode === "rate" && salePrice <= 0) {
    // e.g. 99.99% off a 10원 item rounds to 0원.
    warnings.push("반올림 후 할인가가 0원이에요. 할인율이나 정가를 다시 확인해 주세요.");
  }

  let margin: DiscountMargin | null = null;
  if (cost != null) {
    const marginBefore = list - cost;
    const marginAfter = salePrice - cost;
    const baseQty = baseQtyIn ?? DEFAULT_BASE_QTY;
    let volume: DiscountVolume | null = null;
    let volumeIssue: string | null = null;
    if (marginBefore <= 0) {
      volumeIssue = "할인 전에도 개당 이익이 0원 이하라, 지켜야 할 이익이 없어 필요 판매량을 계산하지 않아요.";
      warnings.push("정가로 팔아도 원가를 못 넘겨요. 할인보다 가격·원가 점검이 먼저예요.");
    } else if (marginAfter <= 0) {
      volumeIssue =
        marginAfter === 0
          ? "할인 후 개당 이익이 0원이라 아무리 많이 팔아도 이익이 늘지 않아요. 같은 이익을 되찾을 판매량은 없어요."
          : "할인가가 원가보다 낮아 팔수록 손해예요. 판매량을 늘려도 기존 이익을 회복할 수 없어요.";
    } else {
      const multiplier = marginBefore / marginAfter;
      const requiredQty = ceilTo(baseQty * multiplier, 1);
      volume = {
        baseQty,
        multiplier,
        requiredQty,
        extraQty: requiredQty - baseQty,
        extraRate: multiplier - 1,
        baseProfit: marginBefore * baseQty,
      };
    }
    margin = {
      cost,
      marginBefore,
      marginRateBefore: marginBefore / list,
      marginAfter,
      marginRateAfter: safeDiv(marginAfter, salePrice) ?? 0,
      volume,
      volumeIssue,
    };
  }

  return ok({ listPrice: list, salePrice, exactSalePrice, discountAmount, discountRate, margin }, warnings);
}
