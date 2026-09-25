// 배달 수익 계산기 — pure functions.
//
// One order on one app is modelled as (all amounts per order, full precision,
// no intermediate rounding — pages round to whole won only for display):
//
//   업주 부담 할인      = 할인액 × 업주 분담 비율 (업주 100% / 플랫폼 0% / 공동 50%)
//   정산 기준 매출      = 판매가 − 업주 부담 할인 (+ 고객 배달팁: 가게배달만)
//   중개수수료          = 중개수수료 기준액 × 중개수수료율
//                         (기준액 = 판매가 − 업주 부담 할인, 쿠팡이츠는 할인 전 판매가)
//   결제수수료          = 고객 결제액 × 결제수수료율 (고객 결제액 = 판매가 − 할인액 (+ 배달팁: 가게배달))
//   업주 배달비         = 플랫폼 배달(배민배달·쿠팡이츠·요기배달·땡배달)만. 정밀 모드의 앱별
//                         직접 입력 > '실제 플랫폼 배달비' 입력 > 매출 구간 대표값 순으로 사용
//   수수료 부가세       = (중개수수료 + 결제수수료 + 업주 배달비) × 부가세율
//   통장 입금액         = 정산 기준 매출 − 중개수수료 − 결제수수료 − 업주 배달비 − 수수료 부가세
//   주문당 이익         = 입금액 − 원가 − 포장비 − 주문당 광고비 − 외부 대행료(가게배달만)
//   주문당 광고비       = 월 광고비 ÷ 월 주문 수
//   수익률              = 주문당 이익 ÷ 판매가 (할인 전 메뉴 가격 — 모든 앱을 같은 분모로 비교)
//
// Decision on the owner-borne delivery fee: since the 2025 상생 요금제 the
// platform-delivery apps charge the owner a fixed fee by sales tier that does
// not depend on what the customer pays (the customer's delivery fee goes to
// the platform). So the '고객 부담 배달팁' input only matters for 가게배달,
// where the tip is settled to the owner and the owner pays the external
// agency. '실제 플랫폼 배달비' means the 업주 부담 배달비 printed on the
// settlement statement and replaces the tier representative as-is.
//
// Platform differences are independent rules (small pure functions) listed per
// platform in PLATFORMS, applied in order, then 정밀 모드 overrides win last.
// Profit is linear and increasing in 판매가 whenever
// (중개 + 결제수수료율) × (1 + 부가세율) < 1 — deliveryPrice relies on that.

import { CARD_FEES, VAT, type Sourced } from "./rates";
import {
  BAEMIN_FEES,
  BAEMIN_PAYMENT,
  COUPANG_EATS_FEES,
  DDANGYO_FEES,
  DELIVERY_FEE_REPRESENTATIVE,
  YOGIYO_FEES,
  SALES_TIERS,
  type RevenueTier,
  type SalesTier,
} from "./rates/delivery";
import { Check, ok, type CalcResult, type FieldIssue, invalid } from "./types";
import { pct, safeDiv } from "./num";

export type { RevenueTier, SalesTier } from "./rates/delivery";
export { SALES_TIERS } from "./rates/delivery";

export type Channel = "delivery" | "pickup";
export type PlatformKind = "platformDelivery" | "storeDelivery" | "pickup";
export type DiscountBearer = "owner" | "platform" | "split";
export type PlatformKey =
  | "baemin"
  | "baeminStore"
  | "coupang"
  | "yogiyo"
  | "ddangyo"
  | "baeminPickup"
  | "coupangPickup"
  | "yogiyoPickup"
  | "ddangyoPickup";

/** 연 매출 구간 options — card 우대수수료 tiers + 30억 초과. */
export const REVENUE_TIERS: { key: RevenueTier; label: string }[] = [
  ...CARD_FEES.value.tiers.map((t) => ({ key: t.key as RevenueTier, label: t.label })),
  { key: "general", label: "30억 원 초과 (일반)" },
];

export const DISCOUNT_BEARERS: { key: DiscountBearer; label: string; ownerShare: number }[] = [
  { key: "owner", label: "업주 부담", ownerShare: 1 },
  { key: "platform", label: "플랫폼 부담", ownerShare: 0 },
  { key: "split", label: "공동 (50:50)", ownerShare: 0.5 },
];

/** 정밀 모드 per-platform overrides (null/undefined = use default). */
export interface PlatformOverride {
  commissionPct?: number | null;
  paymentPct?: number | null;
  deliveryFee?: number | null;
  vatPct?: number | null;
}

/** Fully resolved inputs for one order (no nulls except where meaningful). */
export interface OrderContext {
  /** 판매가 (할인 전 메뉴 가격) */
  price: number;
  cost: number;
  packaging: number;
  adPerOrder: number;
  customerTip: number;
  /** 외부 배달대행료; null = 미입력 (0으로 계산 + 경고) */
  agencyFee: number | null;
  /** 정산서의 업주 부담 배달비; null = 구간 대표값 */
  actualDeliveryFee: number | null;
  discount: number;
  discountBearer: DiscountBearer;
  salesTier: SalesTier;
  revenueTier: RevenueTier;
  traditionalMarket: boolean;
  /** YYYY-MM-DD — date-limited promos (쿠팡이츠 포장 면제). */
  asOf: string;
  /** 쿠팡이츠 할인 전 판매가 기준 수수료 적용 여부 */
  listPriceBasis: boolean;
  overrides?: Partial<Record<PlatformKey, PlatformOverride>>;
}

/** Working state a rule transforms. */
export interface OrderDraft {
  settlementBase: number;
  commissionBase: number;
  paymentBase: number;
  commissionRate: number;
  paymentRate: number;
  vatRate: number;
  ownerDeliveryFee: number;
  agencyFee: number;
  agencyMissing: boolean;
  /** Korean one-liners describing the platform-specific rules applied. */
  applied: string[];
  /** Values still coming from defaults (가정값) — for the 오차 안내. */
  defaults: string[];
}

export interface PlatformRule {
  id: string;
  apply: (d: OrderDraft, ctx: OrderContext) => OrderDraft;
}

// ---- Rules -----------------------------------------------------------------

/** 쿠팡이츠: 중개수수료를 할인 전 판매가에 매김 (정밀 모드에서 끌 수 있음). */
export const ruleListPriceCommission: PlatformRule = {
  id: "listPriceCommission",
  apply: (d, ctx) =>
    ctx.listPriceBasis
      ? { ...d, commissionBase: ctx.price, applied: [...d.applied, "중개수수료를 할인 전 판매가 기준으로 계산"] }
      : d,
};

/** 가게배달: 고객 배달팁은 업주에게 정산되고 결제수수료도 팁을 포함해 부과. */
export const ruleTipToOwner: PlatformRule = {
  id: "tipToOwner",
  apply: (d, ctx) => ({
    ...d,
    settlementBase: d.settlementBase + ctx.customerTip,
    paymentBase: d.paymentBase + ctx.customerTip,
    applied: [...d.applied, "고객 배달팁은 업주에게 정산 (결제수수료는 팁 포함 금액에 부과)"],
  }),
};

/** 가게배달: 배달은 업주가 외부 대행으로 — 대행료를 업주가 부담. */
export const ruleOwnerPaysAgency: PlatformRule = {
  id: "ownerPaysAgency",
  apply: (d, ctx) => ({
    ...d,
    agencyFee: ctx.agencyFee ?? 0,
    agencyMissing: ctx.agencyFee == null,
    applied: [...d.applied, "배달은 외부 대행 — 대행료를 업주가 부담"],
  }),
};

/** 플랫폼 배달: 업주 부담 배달비 = 실제 입력값 또는 매출 구간 대표값. */
export const rulePlatformDeliveryFee: PlatformRule = {
  id: "platformDeliveryFee",
  apply: (d, ctx) => {
    if (ctx.actualDeliveryFee != null) {
      return { ...d, ownerDeliveryFee: ctx.actualDeliveryFee, applied: [...d.applied, "업주 부담 배달비: 입력한 실제 배달비"] };
    }
    const band = DELIVERY_FEE_REPRESENTATIVE.value.bands[ctx.salesTier];
    return {
      ...d,
      ownerDeliveryFee: DELIVERY_FEE_REPRESENTATIVE.value.representative[ctx.salesTier],
      applied: [...d.applied, `업주 부담 배달비: 구간 대표값 (${band.min.toLocaleString("ko-KR")}~${band.max.toLocaleString("ko-KR")}원의 중간)`],
      defaults: [...d.defaults, "업주 부담 배달비"],
    };
  },
};

/** 쿠팡이츠 포장: 매출 하위 20%·전통시장은 면제 기간 동안 수수료 0%. */
export const ruleCoupangPickupFree: PlatformRule = {
  id: "coupangPickupFree",
  apply: (d, ctx) => {
    const eligible = ctx.salesTier === "bottom20" || ctx.traditionalMarket;
    const until = COUPANG_EATS_FEES.value.pickupFreeUntil;
    if (!eligible || ctx.asOf > until) return d;
    return {
      ...d,
      commissionRate: 0,
      applied: [...d.applied, `포장 수수료 면제 (하위 20%·전통시장, ${until}까지)`],
    };
  },
};

// ---- Platform catalogue ----------------------------------------------------

export interface PlatformDef {
  key: PlatformKey;
  label: string;
  channel: Channel;
  kind: PlatformKind;
  commission: Record<SalesTier, number>;
  payment: Record<RevenueTier, number>;
  rules: PlatformRule[];
  sources: Sourced<unknown>[];
}

const BAEMIN_PAY = BAEMIN_PAYMENT.value.byRevenue;

export const PLATFORMS: PlatformDef[] = [
  {
    key: "baemin",
    label: "배민배달",
    channel: "delivery",
    kind: "platformDelivery",
    commission: BAEMIN_FEES.value.delivery,
    payment: BAEMIN_PAY,
    rules: [rulePlatformDeliveryFee],
    sources: [BAEMIN_FEES, BAEMIN_PAYMENT, DELIVERY_FEE_REPRESENTATIVE],
  },
  {
    key: "baeminStore",
    label: "배민 가게배달",
    channel: "delivery",
    kind: "storeDelivery",
    commission: BAEMIN_FEES.value.store,
    payment: BAEMIN_PAY,
    rules: [ruleTipToOwner, ruleOwnerPaysAgency],
    sources: [BAEMIN_FEES, BAEMIN_PAYMENT],
  },
  {
    key: "coupang",
    label: "쿠팡이츠",
    channel: "delivery",
    kind: "platformDelivery",
    commission: COUPANG_EATS_FEES.value.delivery,
    payment: COUPANG_EATS_FEES.value.payment,
    rules: [ruleListPriceCommission, rulePlatformDeliveryFee],
    sources: [COUPANG_EATS_FEES, DELIVERY_FEE_REPRESENTATIVE],
  },
  {
    key: "yogiyo",
    label: "요기배달",
    channel: "delivery",
    kind: "platformDelivery",
    commission: YOGIYO_FEES.value.delivery,
    payment: YOGIYO_FEES.value.payment,
    rules: [rulePlatformDeliveryFee],
    sources: [YOGIYO_FEES, DELIVERY_FEE_REPRESENTATIVE],
  },
  {
    key: "ddangyo",
    label: "땡겨요",
    channel: "delivery",
    kind: "platformDelivery",
    commission: DDANGYO_FEES.value.delivery,
    payment: DDANGYO_FEES.value.payment,
    rules: [rulePlatformDeliveryFee],
    sources: [DDANGYO_FEES, DELIVERY_FEE_REPRESENTATIVE],
  },
  {
    key: "baeminPickup",
    label: "배민 픽업",
    channel: "pickup",
    kind: "pickup",
    commission: BAEMIN_FEES.value.pickup,
    payment: BAEMIN_PAY,
    rules: [],
    sources: [BAEMIN_FEES, BAEMIN_PAYMENT],
  },
  {
    key: "coupangPickup",
    label: "쿠팡이츠 포장",
    channel: "pickup",
    kind: "pickup",
    commission: COUPANG_EATS_FEES.value.pickup,
    payment: COUPANG_EATS_FEES.value.payment,
    rules: [ruleListPriceCommission, ruleCoupangPickupFree],
    sources: [COUPANG_EATS_FEES],
  },
  {
    key: "yogiyoPickup",
    label: "요기요 포장",
    channel: "pickup",
    kind: "pickup",
    commission: YOGIYO_FEES.value.pickup,
    payment: YOGIYO_FEES.value.payment,
    rules: [],
    sources: [YOGIYO_FEES],
  },
  {
    key: "ddangyoPickup",
    label: "땡겨요 포장",
    channel: "pickup",
    kind: "pickup",
    commission: DDANGYO_FEES.value.pickup,
    payment: DDANGYO_FEES.value.payment,
    rules: [],
    sources: [DDANGYO_FEES],
  },
];

export const platformsFor = (channel: Channel) => PLATFORMS.filter((p) => p.channel === channel);
export const getPlatform = (key: PlatformKey): PlatformDef => {
  const p = PLATFORMS.find((x) => x.key === key);
  if (!p) throw new Error(`Unknown platform: ${key}`);
  return p;
};

/** All sources the delivery pages cite (deduplicated). */
export const DELIVERY_SOURCES: Sourced<unknown>[] = [
  ...new Set<Sourced<unknown>>(PLATFORMS.flatMap((p) => p.sources)),
  VAT,
  CARD_FEES,
];

// ---- Shared per-order profit function ---------------------------------------

export interface PlatformOrder {
  key: PlatformKey;
  label: string;
  kind: PlatformKind;
  price: number;
  /** 업주 부담 할인 / 플랫폼 부담 할인 */
  ownerDiscount: number;
  platformDiscount: number;
  settlementBase: number;
  commissionBase: number;
  commissionRate: number;
  commission: number;
  paymentBase: number;
  paymentRate: number;
  payment: number;
  ownerDeliveryFee: number;
  vatRate: number;
  feeVat: number;
  /** 통장 입금액 */
  deposit: number;
  cost: number;
  packaging: number;
  adPerOrder: number;
  agencyFee: number;
  agencyMissing: boolean;
  profit: number;
  /** 이익 ÷ 판매가 */
  margin: number;
  /** 수수료·부가세 합계 (중개 + 결제 + 업주 배달비 + 부가세) */
  platformCost: number;
  applied: string[];
  defaults: string[];
  /** Profit change per 1%p of 중개수수료율 (for the 오차 안내). */
  perCommissionPoint: number;
}

/**
 * The single per-order profit function used by /delivery and
 * /tools/delivery-price. No validation — callers validate inputs first.
 */
export function orderProfit(key: PlatformKey, ctx: OrderContext): PlatformOrder {
  const def = getPlatform(key);
  const ownerShare = DISCOUNT_BEARERS.find((b) => b.key === ctx.discountBearer)?.ownerShare ?? 1;
  const ownerDiscount = ctx.discount * ownerShare;
  const platformDiscount = ctx.discount - ownerDiscount;

  let d: OrderDraft = {
    settlementBase: ctx.price - ownerDiscount,
    commissionBase: ctx.price - ownerDiscount,
    paymentBase: ctx.price - ctx.discount,
    commissionRate: def.commission[ctx.salesTier],
    paymentRate: def.payment[ctx.revenueTier],
    vatRate: VAT.value.rate,
    ownerDeliveryFee: 0,
    agencyFee: 0,
    agencyMissing: false,
    applied: [],
    defaults: ["중개수수료율", "결제수수료율"],
  };
  for (const r of def.rules) d = r.apply(d, ctx);

  // 정밀 모드 overrides win over defaults and rules.
  const ov = ctx.overrides?.[key];
  if (ov) {
    const drop = (label: string) => d.defaults.filter((x) => x !== label);
    if (ov.commissionPct != null) d = { ...d, commissionRate: pct(ov.commissionPct), defaults: drop("중개수수료율") };
    if (ov.paymentPct != null) d = { ...d, paymentRate: pct(ov.paymentPct), defaults: drop("결제수수료율") };
    if (ov.vatPct != null) d = { ...d, vatRate: pct(ov.vatPct) };
    if (ov.deliveryFee != null && def.kind === "platformDelivery")
      d = { ...d, ownerDeliveryFee: ov.deliveryFee, defaults: drop("업주 부담 배달비") };
  }

  const commission = d.commissionBase * d.commissionRate;
  const payment = d.paymentBase * d.paymentRate;
  const feeVat = (commission + payment + d.ownerDeliveryFee) * d.vatRate;
  const deposit = d.settlementBase - commission - payment - d.ownerDeliveryFee - feeVat;
  const profit = deposit - ctx.cost - ctx.packaging - ctx.adPerOrder - d.agencyFee;

  return {
    key,
    label: def.label,
    kind: def.kind,
    price: ctx.price,
    ownerDiscount,
    platformDiscount,
    settlementBase: d.settlementBase,
    commissionBase: d.commissionBase,
    commissionRate: d.commissionRate,
    commission,
    paymentBase: d.paymentBase,
    paymentRate: d.paymentRate,
    payment,
    ownerDeliveryFee: d.ownerDeliveryFee,
    vatRate: d.vatRate,
    feeVat,
    deposit,
    cost: ctx.cost,
    packaging: ctx.packaging,
    adPerOrder: ctx.adPerOrder,
    agencyFee: d.agencyFee,
    agencyMissing: d.agencyMissing,
    profit,
    margin: safeDiv(profit, ctx.price) ?? 0,
    platformCost: commission + payment + d.ownerDeliveryFee + feeVat,
    applied: d.applied,
    defaults: d.defaults,
    perCommissionPoint: d.commissionBase * 0.01 * (1 + d.vatRate),
  };
}

// ---- Calculator ---------------------------------------------------------------

export type Mode = "simple" | "precise";

export interface DeliveryInput {
  mode: Mode;
  channel: Channel;
  price: number | null;
  cost: number | null;
  packaging?: number | null;
  customerTip?: number | null;
  actualDeliveryFee?: number | null;
  agencyFee?: number | null;
  monthlyAd?: number | null;
  monthlyOrders?: number | null;
  salesTier: SalesTier;
  revenueTier: RevenueTier;
  traditionalMarket?: boolean;
  /** Defaults to today. */
  asOf?: string;
  // 정밀 모드 only (ignored in simple mode):
  discount?: number | null;
  discountBearer?: DiscountBearer;
  listPriceBasis?: boolean;
  overrides?: Partial<Record<PlatformKey, PlatformOverride>>;
}

export interface DeliveryResult {
  channel: Channel;
  mode: Mode;
  /** Sorted by profit, highest first. */
  ranked: PlatformOrder[];
  best: PlatformOrder;
  worst: PlatformOrder;
  gapPerOrder: number;
  /** null when 월 주문 수 is empty. */
  gapMonthly: number | null;
  monthlyOrders: number | null;
  adPerOrder: number;
}

/** Local (not UTC) date as YYYY-MM-DD — Korean users near midnight get their own day. */
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** 주문당 광고비 = 월 광고비 ÷ 월 주문 수 (주문 수가 없으면 0). Shared with deliveryPrice. */
export function adPerOrderOf(monthlyAd: number | null | undefined, monthlyOrders: number | null | undefined): number {
  if (!monthlyAd || !monthlyOrders) return 0;
  return safeDiv(monthlyAd, monthlyOrders) ?? 0;
}

/** Validates the override block; field keys are `ov-<platform>-<field>`. */
export function overrideIssues(overrides: DeliveryInput["overrides"]): FieldIssue[] {
  const c = new Check();
  for (const [key, ov] of Object.entries(overrides ?? {})) {
    if (!ov) continue;
    const label = PLATFORMS.find((p) => p.key === key)?.label ?? key;
    c.percent(`ov-${key}-commission`, `${label} 중개수수료율`, ov.commissionPct ?? null);
    c.percent(`ov-${key}-payment`, `${label} 결제수수료율`, ov.paymentPct ?? null);
    c.percent(`ov-${key}-vat`, `${label} 부가세율`, ov.vatPct ?? null);
    c.min(`ov-${key}-deliveryFee`, `${label} 배달비`, ov.deliveryFee ?? null, 0);
  }
  return c.issues;
}

export function delivery(input: DeliveryInput): CalcResult<DeliveryResult> {
  const precise = input.mode === "precise";
  const c = new Check();
  const price = c.req("price", "판매가", input.price);
  const cost = c.req("cost", "원가", input.cost);
  c.positive("price", "판매가", input.price);
  c.min("cost", "원가", input.cost, 0);
  c.min("packaging", "포장비", input.packaging ?? null, 0);
  c.min("customerTip", "고객 부담 배달팁", input.customerTip ?? null, 0);
  c.min("actualDeliveryFee", "실제 플랫폼 배달비", input.actualDeliveryFee ?? null, 0);
  c.min("agencyFee", "외부 배달대행료", input.agencyFee ?? null, 0);
  c.min("monthlyAd", "월 광고비", input.monthlyAd ?? null, 0);
  c.positive("monthlyOrders", "월 주문 수", input.monthlyOrders ?? null);
  const monthlyAd = input.monthlyAd ?? 0;
  const monthlyOrders = input.monthlyOrders ?? null;
  if (monthlyAd > 0 && monthlyOrders == null) {
    c.issues.push({ field: "monthlyOrders", message: "월 광고비를 주문당으로 나누려면 월 주문 수를 입력해 주세요." });
  }
  const discount = precise ? (input.discount ?? 0) : 0;
  if (precise) {
    c.min("discount", "음식값 할인액", input.discount ?? null, 0);
    if (input.price != null && input.price > 0 && discount >= input.price) {
      c.issues.push({ field: "discount", message: "음식값 할인액은 판매가보다 작아야 해요." });
    }
  }
  const early = c.result<DeliveryResult>();
  if (early) return early;
  if (precise) {
    const ovIssues = overrideIssues(input.overrides);
    if (ovIssues.length) return invalid(ovIssues);
  }

  const adPerOrder = adPerOrderOf(monthlyAd, monthlyOrders);
  const ctx: OrderContext = {
    price,
    cost,
    packaging: input.packaging ?? 0,
    adPerOrder,
    customerTip: input.customerTip ?? 0,
    agencyFee: input.agencyFee ?? null,
    actualDeliveryFee: input.actualDeliveryFee ?? null,
    discount,
    discountBearer: precise ? (input.discountBearer ?? "owner") : "owner",
    salesTier: input.salesTier,
    revenueTier: input.revenueTier,
    traditionalMarket: !!input.traditionalMarket,
    asOf: input.asOf ?? todayIso(),
    listPriceBasis: precise ? input.listPriceBasis ?? true : true,
    overrides: precise ? input.overrides : undefined,
  };

  const orders = platformsFor(input.channel).map((p) => orderProfit(p.key, ctx));
  // Stable sort: ties keep catalogue order.
  const ranked = [...orders].sort((a, b) => b.profit - a.profit);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const gapPerOrder = best.profit - worst.profit;

  const warnings: string[] = [];
  const store = ranked.find((o) => o.kind === "storeDelivery");
  if (store?.agencyMissing) {
    warnings.push("배민 가게배달은 외부 배달대행료를 입력하지 않아 대행료 0원으로 계산했어요. 실제로는 대행료만큼 이익이 줄어드니 꼭 입력해 주세요.");
  }
  if (ranked.every((o) => o.profit < 0)) {
    warnings.push("모든 앱에서 주문당 손해예요. 판매가·원가·광고비를 다시 확인해 보세요.");
  }
  if (input.channel === "pickup" && (input.salesTier === "bottom20" || input.traditionalMarket) && ctx.asOf > COUPANG_EATS_FEES.value.pickupFreeUntil) {
    warnings.push(`쿠팡이츠 포장 수수료 면제 기간(${COUPANG_EATS_FEES.value.pickupFreeUntil}까지)이 지나 기본 수수료로 계산했어요.`);
  }
  if (monthlyAd > 0 && monthlyOrders != null && adPerOrder > price) {
    warnings.push("주문당 광고비가 판매가보다 커요. 월 광고비와 월 주문 수를 확인해 주세요.");
  }

  return ok(
    {
      channel: input.channel,
      mode: input.mode,
      ranked,
      best,
      worst,
      gapPerOrder,
      gapMonthly: monthlyOrders != null ? gapPerOrder * monthlyOrders : null,
      monthlyOrders,
      adPerOrder,
    },
    warnings,
  );
}

/** Labels for the sales-tier select (re-exported for pages). */
export const salesTierLabel = (k: SalesTier) => SALES_TIERS.find((t) => t.key === k)?.label ?? k;
export const revenueTierLabel = (k: RevenueTier) => REVENUE_TIERS.find((t) => t.key === k)?.label ?? k;

/** Parse a tier key coming from a URL / select; unknown → fallback. */
export function parseSalesTier(v: string | null | undefined, fallback: SalesTier = "mid35to50"): SalesTier {
  return SALES_TIERS.some((t) => t.key === v) ? (v as SalesTier) : fallback;
}
export function parseRevenueTier(v: string | null | undefined, fallback: RevenueTier = "t3"): RevenueTier {
  return REVENUE_TIERS.some((t) => t.key === v) ? (v as RevenueTier) : fallback;
}
