// 배달가격 역산기 — pure functions.
//
// Uses the exact per-order profit function of the 배달 수익 계산기
// (delivery.orderProfit), so a price found here gives the same profit there.
//
// Calculation order & rounding, per platform:
// 1) Profit is linear in 판매가 for these rules: profit(P) = a·P + b with
//    b = profit(0) and a = profit(1) − profit(0) = 1 − (중개 + 결제수수료율)×(1 + 부가세율).
//    If a ≤ 0 (rates ≥ 100% incl. VAT) no price can reach the target → impossible.
// 2) 최소 판매가 = (목표 이익 − b) ÷ a, 원 단위 올림 (at least 1원).
// 3) 권장가 = 최소 판매가를 가격 단위(100/500/1,000원)로 올림. We then
//    re-check with the shared function and step up one unit if float noise
//    left the profit a hair under the target.
// 4) 권장가의 예상 이익 = orderProfit(권장가) — full precision, shown rounded.
// 배민 가게배달 without an agency fee is excluded (not guessed) with a warning.

import {
  adPerOrderOf,
  orderProfit,
  platformsFor,
  todayIso,
  type Channel,
  type OrderContext,
  type PlatformKey,
  type PlatformKind,
  type PlatformOrder,
  type RevenueTier,
  type SalesTier,
} from "./delivery";
import { Check, impossible, ok, type CalcResult } from "./types";
import { ceilTo } from "./num";

export const ROUND_UNITS = [100, 500, 1000] as const;

export interface DeliveryPriceInput {
  channel: Channel;
  cost: number | null;
  packaging?: number | null;
  targetProfit: number | null;
  agencyFee?: number | null;
  customerTip?: number | null;
  actualDeliveryFee?: number | null;
  monthlyAd?: number | null;
  monthlyOrders?: number | null;
  salesTier: SalesTier;
  revenueTier: RevenueTier;
  traditionalMarket?: boolean;
  roundUnit: number;
  asOf?: string;
}

export interface PriceRow {
  key: PlatformKey;
  label: string;
  kind: PlatformKind;
  status: "ok" | "impossible" | "excluded";
  reason?: string;
  /** a, b of profit(P) = a·P + b */
  slope?: number;
  intercept?: number;
  /** 최소 판매가 (원 단위 올림) */
  minPrice?: number;
  /** 권장가 (가격 단위 올림) */
  recommendedPrice?: number;
  /** Shared-function breakdown at 권장가. */
  order?: PlatformOrder;
}

export interface DeliveryPriceResult {
  channel: Channel;
  targetProfit: number;
  roundUnit: number;
  /** ok rows by 권장가 ascending, then excluded, then impossible. */
  rows: PriceRow[];
  cheapest: PriceRow;
}

const EPS = 1e-6;

export function deliveryPrice(input: DeliveryPriceInput): CalcResult<DeliveryPriceResult> {
  const c = new Check();
  const cost = c.req("cost", "음식 원가", input.cost);
  const target = c.req("targetProfit", "목표 주문당 이익", input.targetProfit);
  c.min("cost", "음식 원가", input.cost, 0);
  c.min("targetProfit", "목표 주문당 이익", input.targetProfit, 0);
  c.min("packaging", "포장비", input.packaging ?? null, 0);
  c.min("agencyFee", "외부 배달대행료", input.agencyFee ?? null, 0);
  c.min("customerTip", "고객 부담 배달팁", input.customerTip ?? null, 0);
  c.min("actualDeliveryFee", "실제 플랫폼 배달비", input.actualDeliveryFee ?? null, 0);
  c.min("monthlyAd", "월 광고비", input.monthlyAd ?? null, 0);
  c.positive("monthlyOrders", "월 주문 수", input.monthlyOrders ?? null);
  if ((input.monthlyAd ?? 0) > 0 && input.monthlyOrders == null) {
    c.issues.push({ field: "monthlyOrders", message: "월 광고비를 주문당으로 나누려면 월 주문 수를 입력해 주세요." });
  }
  c.positive("roundUnit", "가격 올림 단위", input.roundUnit);
  const early = c.result<DeliveryPriceResult>();
  if (early) return early;

  const unit = input.roundUnit;
  const base: Omit<OrderContext, "price"> = {
    cost,
    packaging: input.packaging ?? 0,
    adPerOrder: adPerOrderOf(input.monthlyAd, input.monthlyOrders),
    customerTip: input.customerTip ?? 0,
    agencyFee: input.agencyFee ?? null,
    actualDeliveryFee: input.actualDeliveryFee ?? null,
    discount: 0,
    discountBearer: "owner",
    salesTier: input.salesTier,
    revenueTier: input.revenueTier,
    traditionalMarket: !!input.traditionalMarket,
    asOf: input.asOf ?? todayIso(),
    listPriceBasis: true,
  };
  const at = (key: PlatformKey, price: number) => orderProfit(key, { ...base, price });

  const rows: PriceRow[] = platformsFor(input.channel).map((p): PriceRow => {
    const row = { key: p.key, label: p.label, kind: p.kind };
    if (p.kind === "storeDelivery" && input.agencyFee == null) {
      return { ...row, status: "excluded", reason: "외부 배달대행료를 입력하면 계산해요." };
    }
    const intercept = at(p.key, 0).profit;
    const slope = at(p.key, 1).profit - intercept;
    if (!(slope > EPS)) {
      return {
        ...row,
        status: "impossible",
        slope,
        intercept,
        reason: "수수료율 합계(부가세 포함)가 100% 이상이라 가격을 올려도 이익이 늘지 않아요.",
      };
    }
    const exact = (target - intercept) / slope;
    const minPrice = Math.max(1, Math.ceil(exact - 1e-9));
    let recommendedPrice = ceilTo(minPrice, unit);
    let order = at(p.key, recommendedPrice);
    // Guard float noise: step up until the shared function confirms the target.
    for (let i = 0; i < 5 && order.profit < target - EPS; i++) {
      recommendedPrice += unit;
      order = at(p.key, recommendedPrice);
    }
    return { ...row, status: "ok", slope, intercept, minPrice, recommendedPrice, order };
  });

  const rank = (r: PriceRow) => (r.status === "ok" ? 0 : r.status === "excluded" ? 1 : 2);
  rows.sort((a, b) => rank(a) - rank(b) || (a.recommendedPrice ?? 0) - (b.recommendedPrice ?? 0));
  const cheapest = rows[0];
  if (cheapest.status !== "ok") {
    return impossible<DeliveryPriceResult>("어떤 앱에서도 목표 이익을 낼 수 있는 판매가를 찾지 못했어요. 수수료율이나 입력값을 확인해 주세요.", { rows });
  }

  const warnings: string[] = [];
  if (rows.some((r) => r.status === "excluded")) {
    warnings.push("배민 가게배달은 외부 배달대행료를 입력하지 않아 '가장 저렴한 곳' 비교에서 뺐어요. 대행료를 넣으면 함께 비교해요.");
  }
  const okRows = rows.filter((r) => r.status === "ok");
  const highest = okRows[okRows.length - 1];
  if (highest?.recommendedPrice && cheapest.recommendedPrice && highest.recommendedPrice - cheapest.recommendedPrice >= 3000) {
    warnings.push(`앱별 권장가 차이가 ${(highest.recommendedPrice - cheapest.recommendedPrice).toLocaleString("ko-KR")}원이나 돼요. 앱마다 가격을 다르게 받을지 검토해 보세요.`);
  }

  return ok({ channel: input.channel, targetProfit: target, roundUnit: unit, rows, cheapest }, warnings);
}
