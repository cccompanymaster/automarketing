// Extra reference values for the labor / tax calculators (hourly-wage,
// payroll, labor-ratio, withholding, card-fee, vat) that are not in
// rates/index.ts. Same `sourced` convention: official rules are "law",
// rules-of-thumb are "assumed" (shown as 가정값).

import { sourced } from "./sourced";

const CHECKED = "2026-09-25";

/**
 * 4대보험 rounding. Each person's premium share is cut below 10원; 국민연금
 * 기준소득월액 is cut below 1,000원 before the 상·하한 clamp.
 */
export const INSURANCE_ROUNDING = sourced(
  { premiumUnit: 10, pensionBaseUnit: 1_000 },
  {
    source: "4대보험 실무 계산 관행 (보험료 10원 미만 절사, 국민연금 기준소득월액 천원 미만 절사)",
    checkedAt: CHECKED,
    basis: "assumed",
    note: "공단 고지액은 보수총액 신고·정산 방식에 따라 수십 원 차이가 날 수 있어요.",
  },
);

/** 원천징수 세액 끝수 처리: 국고금 10원 미만 절사. */
export const TAX_TRUNCATION = sourced(
  { unit: 10 },
  {
    source: "국고금 관리법 제47조 (국고금 수입·지출 시 10원 미만 끝수 절사)",
    url: "https://www.law.go.kr/법령/국고금관리법",
    checkedAt: CHECKED,
    basis: "law",
    note: "급여 프로그램에 따라 원 미만만 절사하기도 해서 몇 원 차이가 날 수 있어요.",
  },
);

/** 매출 대비 인건비 비율 진단 구간 (업종 평균이 아닌 일반적 참고 기준). */
export const LABOR_RATIO_BANDS = sourced(
  [
    { key: "good", label: "양호", max: 0.2, tone: "good" as const, message: "매출 대비 인건비 부담이 낮은 편이에요." },
    { key: "normal", label: "보통", max: 0.3, tone: "default" as const, message: "외식·서비스업에서 흔한 수준이에요. 매출이 줄면 부담이 커질 수 있어요." },
    { key: "caution", label: "주의", max: 0.35, tone: "warn" as const, message: "재료비·임대료까지 더하면 이익이 빠듯해질 수 있어요. 근무표를 점검해 보세요." },
    { key: "danger", label: "위험", max: Infinity, tone: "bad" as const, message: "인건비가 이익을 크게 잠식하는 수준이에요. 매출 확대나 인력 운영 조정이 필요해요." },
  ],
  {
    source: "자영업 인건비 비율 일반 참고 구간 (≤20% 양호 · 30% 보통 · 35% 주의 · 초과 위험)",
    checkedAt: CHECKED,
    basis: "assumed",
    note: "업종·운영 방식(셀프·풀서비스)에 따라 적정 비율이 크게 달라요.",
  },
);
