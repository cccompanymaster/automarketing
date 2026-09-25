// Delivery-app fee defaults for the 배달 수익 / 배달가격 역산 calculators.
//
// Every value here is a platform's commercial term (basis "platform") or our
// own representative pick (basis "assumed"), so pages badge them as 가정값.
// Values come from news / notice summaries found by web search on the check
// date — none was verified on the platform's own fee page. Rates are ratios
// (0.078 = 7.8%) and VAT-exclusive unless noted; fees are won per order.
//
// Keys:
// - SalesTier: the platform's own sales-percentile band (직전 3개월 일평균
//   매출 기준, 분기 재산정 — the won boundaries are not published).
// - RevenueTier: 연 매출 구간, same bands as the card 우대수수료 tiers in
//   rates/index.ts CARD_FEES (영세 3억 / 중소 5·10·30억) plus 30억 초과.

import { sourced } from "./sourced";

const CHECKED = "2026-09-25";

export type SalesTier = "top35" | "mid35to50" | "mid50to80" | "bottom20";
export type RevenueTier = "t3" | "t5" | "t10" | "t30" | "general";

export const SALES_TIERS: { key: SalesTier; label: string }[] = [
  { key: "top35", label: "매출 상위 35% 이내" },
  { key: "mid35to50", label: "상위 35% 초과 ~ 50%" },
  { key: "mid50to80", label: "상위 50% 초과 ~ 80%" },
  { key: "bottom20", label: "매출 하위 20%" },
];

type ByTier = Record<SalesTier, number>;
type ByRevenue = Record<RevenueTier, number>;

const flatTier = (v: number): ByTier => ({ top35: v, mid35to50: v, mid50to80: v, bottom20: v });
const flatRevenue = (v: number): ByRevenue => ({ t3: v, t5: v, t10: v, t30: v, general: v });

/**
 * 업주 부담 배달비 대표값 (platform delivery). The platforms publish distance
 * bands — 상위 35% 2,400~3,400원 / 35~50% 2,100~3,100원 / 50~100%
 * 1,900~2,900원 — and we use each band's midpoint as the default.
 */
export const DELIVERY_FEE_REPRESENTATIVE = sourced(
  {
    bands: {
      top35: { min: 2_400, max: 3_400 },
      mid35to50: { min: 2_100, max: 3_100 },
      mid50to80: { min: 1_900, max: 2_900 },
      bottom20: { min: 1_900, max: 2_900 },
    } as Record<SalesTier, { min: number; max: number }>,
    representative: { top35: 2_900, mid35to50: 2_600, mid50to80: 2_400, bottom20: 2_400 } as ByTier,
  },
  {
    source: "업주 부담 배달비 대표값 — 배민배달·쿠팡이츠 구간별 거리 요금(2,400~3,400 / 2,100~3,100 / 1,900~2,900원)의 중간값",
    checkedAt: CHECKED,
    basis: "assumed",
    note: "실제 배달비는 거리·할증에 따라 구간 안에서 달라져요. 정산서의 업주 부담 배달비를 입력하면 그 값을 써요.",
  },
);

/** 배민 (배민배달 · 가게배달 · 픽업). 2026-02-26 명칭 변경 반영. */
export const BAEMIN_FEES = sourced(
  {
    /** 배민배달(구 배민1플러스) 중개이용료 */
    delivery: { top35: 0.078, mid35to50: 0.068, mid50to80: 0.068, bottom20: 0.02 } as ByTier,
    /** 가게배달(구 오픈리스트) 중개이용료 — 미검증 */
    store: flatTier(0.068),
    /** 픽업(구 포장) 중개이용료 */
    pickup: flatTier(0.068),
  },
  {
    source: "배달의민족 상생 요금제 보도 요약 — 배민배달 중개이용료 7.8/6.8/2.0%, 픽업 6.8%(2025-04-14~), 가게배달 6.8%(미확인)",
    url: "https://ceo.baemin.com/",
    checkedAt: CHECKED,
    effective: "배민배달 2025-02-26 ~ · 픽업 2025-04-14 ~",
    basis: "platform",
    note: "구간은 직전 3개월 배민배달 일평균 매출로 분기마다 재산정되며 금액 경계는 공개되지 않아요. 1만 원 이하 소액 주문 수수료 면제 발표(2025-06)는 시행 세부가 불명확해 반영하지 않았어요.",
  },
);

/** 배민 결제정산이용료 — 연 매출 구간별 (영세·중소 우대). */
export const BAEMIN_PAYMENT = sourced(
  { byRevenue: { t3: 0.014, t5: 0.02, t10: 0.0215, t30: 0.024, general: 0.03 } as ByRevenue },
  {
    source: "배민 결제정산이용료 0.1%p 인하 보도 — 영세 1.4%, 3~5억 2.0%, 5~10억 2.15%, 10~30억 2.4%, 일반·신규 3.0%",
    url: "https://news.nate.com/view/20250211n25659",
    checkedAt: CHECKED,
    effective: "2025-02-14 ~",
    basis: "platform",
  },
);

/** 쿠팡이츠 상생요금제 (배달) · 포장. */
export const COUPANG_EATS_FEES = sourced(
  {
    delivery: { top35: 0.078, mid35to50: 0.068, mid50to80: 0.068, bottom20: 0.02 } as ByTier,
    pickup: flatTier(0.068),
    /** 포장 수수료 면제 (매출 하위 20% · 전통시장) 종료일 (포함). */
    pickupFreeUntil: "2027-03-31",
    payment: flatRevenue(0.03),
  },
  {
    source: "쿠팡이츠 상생요금제 보도 요약 — 중개 7.8/6.8/6.8/2.0%(2025-04~), 포장 6.8%(2026-04-01~, 하위 20%·전통시장 2027-03-31까지 무료), 결제 약 3%(미확인)",
    url: "https://byline.network/2025/02/18_2918277/",
    checkedAt: CHECKED,
    effective: "배달 2025-04 ~ · 포장 2026-04-01 ~",
    basis: "platform",
    note: "쿠팡이츠는 할인 전 판매가를 기준으로 수수료를 매겨 왔어요. 2025-10 공정위 시정 명령 이후 반영 여부는 확인되지 않아 정밀 모드에서 끌 수 있게 했어요.",
  },
);

/** 요기요 (요기배달 · 포장). */
export const YOGIYO_FEES = sourced(
  {
    /** 9.7 / 8.7 / 7.7 / 4.7% steps (월 주문 수 기준) mapped onto sales tiers. */
    delivery: { top35: 0.097, mid35to50: 0.087, mid50to80: 0.077, bottom20: 0.047 } as ByTier,
    pickup: flatTier(0.077),
    payment: flatRevenue(0.03),
  },
  {
    source: "요기요 수수료 보도 요약 — 요기배달 중개 9.7% 기본(월 주문 수에 따라 9.7/8.7/7.7/4.7%), 포장 7.7%(최저 2.7%), 결제 약 3%(미확인)",
    checkedAt: CHECKED,
    basis: "platform",
    note: "요기요의 단계는 월 주문 수 기준이라 매출 구간에 근사해 대응시켰어요. 요기배달 업주 부담 배달비는 확인되지 않아 배민·쿠팡과 같은 구간 대표값을 가정했어요.",
  },
);

/** 땡겨요 (땡배달 · 포장). */
export const DDANGYO_FEES = sourced(
  {
    delivery: flatTier(0.02),
    pickup: flatTier(0.02),
    /** 결제수수료 0~0.5% → 상한 0.5%를 보수적으로 적용 */
    payment: flatRevenue(0.005),
  },
  {
    source: "땡겨요 수수료 보도 요약 — 중개 2%(서울 공공배달 기준, 지역별 상이 가능), 결제 0~0.5%, 광고비·입점비 없음",
    url: "https://namu.wiki/w/%EB%95%A1%EA%B2%A8%EC%9A%94",
    checkedAt: CHECKED,
    basis: "platform",
    note: "땡배달 업주 부담 배달비와 포장 수수료는 확인되지 않아 배달비는 구간 대표값, 포장 수수료는 중개 수수료와 같은 2%로 가정했어요.",
  },
);

/** Items shown under 가정과 한계 but not modelled. */
export const DELIVERY_POLICY_NOTES = sourced(
  { commissionCapBillPct: 15 },
  {
    source: "배달앱 수수료 상한(15%) 법안 — 국회 계류 중, 계산에 반영하지 않음",
    checkedAt: CHECKED,
    basis: "assumed",
  },
);
