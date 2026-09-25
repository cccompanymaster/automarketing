// Reference values for the store-cost calculators (임대료 비율, 적정 임대료,
// 창업 생존기간, 대출 이자). Only the loan cap is statutory; the rest are
// rule-of-thumb bands commonly used when talking about rent burden and are
// badged as 가정값 on the pages.

import { sourced } from "./sourced";

const CHECKED = "2026-09-25";

/**
 * 매출 대비 임대료(+관리비) 부담 구간. `max` is the inclusive upper bound of
 * the band as a ratio; the last band has `max: null` (no upper bound).
 */
export const RENT_BURDEN_BANDS = sourced(
  {
    bands: [
      { key: "good", label: "양호", max: 0.1 as number | null, tone: "good" as const, note: "임대료 부담이 낮은 편이에요." },
      { key: "normal", label: "보통", max: 0.15 as number | null, tone: "default" as const, note: "일반적인 범위예요. 매출이 줄면 부담이 커질 수 있어요." },
      { key: "caution", label: "주의", max: 0.2 as number | null, tone: "warn" as const, note: "임대료가 이익을 크게 깎는 수준이에요. 매출 목표를 다시 점검하세요." },
      { key: "danger", label: "위험", max: null as number | null, tone: "bad" as const, note: "매출 대비 임대료가 과도해요. 재협상·이전·매출 확대 검토가 필요해요." },
    ],
  },
  {
    source: "매출 대비 임대료 부담 구간 — 업계에서 흔히 쓰는 참고 기준(10·15·20%)을 정리한 가정값",
    checkedAt: CHECKED,
    basis: "assumed",
    note: "업종(카페·음식점·판매점)과 입지에 따라 적정 비율이 크게 달라요. 절대 기준이 아닌 참고용이에요.",
  },
);

/** Quick-pick 목표 임대료 비율 (%) for the 적정 임대료 calculator. */
export const AFFORDABLE_RENT_PRESETS = sourced(
  { ratiosPct: [10, 12, 15, 18] },
  {
    source: "적정 임대료 비율 빠른 선택값 (매출의 10~18%) — 참고용 가정값",
    checkedAt: CHECKED,
    basis: "assumed",
  },
);

/** Runway shorter than this many months gets a warning. */
export const RUNWAY_WARN_MONTHS = sourced(
  { months: 6 },
  {
    source: "창업 초기 최소 버팀 기간 권장치(6개월) — 참고용 가정값",
    checkedAt: CHECKED,
    basis: "assumed",
  },
);

/** 이자제한법상 최고이자율 — rates above this get a warning. */
export const LEGAL_MAX_INTEREST = sourced(
  { annualRate: 0.2 },
  {
    source: "이자제한법 제2조 제1항의 최고이자율에 관한 규정 (연 20%)",
    url: "https://www.law.go.kr/법령/이자제한법제2조제1항의최고이자율에관한규정",
    checkedAt: CHECKED,
    effective: "2021-07-07 ~",
    basis: "law",
    note: "대부업자·여신금융기관의 최고이자율도 대부업법 시행령에 따라 연 20%예요.",
  },
);
