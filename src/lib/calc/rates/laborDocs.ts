// Extra labor-law values for the document builders (급여명세서·근로계약서)
// that are not in rates/index.ts. Same `sourced` convention.

import { sourced } from "./sourced";

const CHECKED = "2026-09-25";

export const LABOR_DOCS = sourced(
  {
    /** 야간근로: 22시 ~ 다음 날 6시 (근로기준법 제56조 제3항) */
    nightStartHour: 22,
    nightEndHour: 6,
    /** 1주 연장근로 한도 12시간 → 주 52시간 (제53조, 5인 이상) */
    weeklyOvertimeMax: 12,
    /** 기간제 사용기간 한도 2년 (기간제법 제4조) */
    fixedTermMaxYears: 2,
  },
  {
    source: "근로기준법 제53·56조, 기간제 및 단시간근로자 보호 등에 관한 법률 제4조",
    url: "https://www.law.go.kr/법령/근로기준법",
    checkedAt: CHECKED,
    basis: "law",
  },
);
