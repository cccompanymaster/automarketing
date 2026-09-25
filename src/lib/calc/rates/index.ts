// General rates / legal standards used by the calculators. Update values here
// only — no calculator hard-codes a rate. `checkedAt` is the date each value
// was last confirmed; see docs/CALCULATORS.md for the check method.

import { sourced } from "./sourced";

export type { Sourced, Basis } from "./sourced";
export { isAssumed } from "./sourced";

const CHECKED = "2026-09-25";

/** 최저임금 (시급) by calendar year. */
export const MINIMUM_WAGE = sourced(
  {
    byYear: { 2026: 10_320, 2027: 10_700 } as Record<number, number>,
    /** Year used for "최저임금" quick inputs today. */
    currentYear: 2026,
  },
  {
    source: "고용노동부 최저임금 고시 (2026년 10,320원, 2027년 10,700원)",
    url: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19744",
    checkedAt: CHECKED,
    effective: "2026년 10,320원 · 2027-01-01부터 10,700원",
    basis: "official",
  },
);

/** 최저임금 for a date (falls back to the nearest known year). */
export function minimumWageFor(date?: Date | string | null): { year: number; hourly: number } {
  const years = Object.keys(MINIMUM_WAGE.value.byYear).map(Number).sort((a, b) => a - b);
  let y = MINIMUM_WAGE.value.currentYear;
  if (date) {
    const d = typeof date === "string" ? new Date(date) : date;
    if (!Number.isNaN(d.getTime())) y = d.getFullYear();
  }
  const known = years.filter((k) => k <= y);
  const year = known.length ? known[known.length - 1] : years[0];
  return { year, hourly: MINIMUM_WAGE.value.byYear[year] };
}

/** 국민연금. 기준소득월액 상·하한 적용 (2026-07 ~ 2027-06). */
export const NATIONAL_PENSION = sourced(
  { total: 0.095, employee: 0.0475, employer: 0.0475, baseMin: 410_000, baseMax: 6_590_000 },
  {
    source: "보건복지부·국민연금공단 — 연금보험료율 9.5%(2026), 기준소득월액 상·하한",
    url: "https://www.nps.or.kr/",
    checkedAt: CHECKED,
    effective: "요율 2026-01 ~ 2026-12 · 상한 659만 원/하한 41만 원 2026-07 ~ 2027-06",
    basis: "official",
    note: "2027년 1월부터 10.0%(각 5.0%)로 인상 예정 — 연 0.5%p씩 13%까지.",
  },
);

/** 건강보험 (보수월액 × 요율, 근로자·사업주 반씩). */
export const HEALTH_INSURANCE = sourced(
  { total: 0.0719, employee: 0.03595, employer: 0.03595 },
  {
    source: "보건복지부·국민건강보험공단 — 2026년 직장가입자 건강보험료율 7.19%",
    url: "https://www.nhis.or.kr/",
    checkedAt: CHECKED,
    effective: "2026-01-01 ~",
    basis: "official",
    note: "2027년 동결(7.19%) 결정 보도가 있으나 고시 전입니다.",
  },
);

/** 장기요양보험 (건강보험료 × 비율, 근로자·사업주 반씩). */
export const LONG_TERM_CARE = sourced(
  { ratioOfHealth: 0.1314 },
  {
    source: "보건복지부 — 2026년 장기요양보험료율 (건강보험료의 13.14%, 소득 대비 0.9448%)",
    url: "https://www.mohw.go.kr/",
    checkedAt: CHECKED,
    effective: "2026-01-01 ~",
    basis: "official",
  },
);

/** 고용보험. 사업주 고용안정·직업능력개발 요율은 사업장 규모별. */
export const EMPLOYMENT_INSURANCE = sourced(
  {
    employee: 0.009,
    employerUnemployment: 0.009,
    employerStability: [
      { key: "under150", label: "150인 미만", rate: 0.0025 },
      { key: "priority", label: "150인 이상 우선지원대상기업", rate: 0.0045 },
      { key: "150to1000", label: "150인 이상 ~ 1,000인 미만", rate: 0.0065 },
      { key: "over1000", label: "1,000인 이상·국가기관 등", rate: 0.0085 },
    ],
  },
  {
    source: "고용노동부·근로복지공단 — 고용보험료율 (실업급여 1.8%, 고용안정·직능 0.25~0.85%)",
    url: "https://www.moel.go.kr/",
    checkedAt: CHECKED,
    effective: "2026년",
    basis: "official",
    note: "2027년 실업급여 요율 2.0%(각 1.0%) 인상안이 심의됐으나 시행령 개정 전입니다.",
  },
);

/** 산재보험 (사업주 전액 부담). 업종별 요율 + 출퇴근재해 요율. */
export const INDUSTRIAL_ACCIDENT = sourced(
  {
    commute: 0.0006,
    byIndustry: [
      { key: "food", label: "음식·숙박업", rate: 0.008 },
      { key: "retail", label: "도소매·소비자용품수리업", rate: 0.008 },
      { key: "other", label: "기타의 각종사업(일반 서비스)", rate: 0.008 },
      { key: "professional", label: "전문·보건·교육·여가 서비스업", rate: 0.006 },
      { key: "realestate", label: "부동산·임대업", rate: 0.007 },
      { key: "food-mfg", label: "식료품 제조업", rate: 0.016 },
      { key: "printing", label: "출판·인쇄 제조업", rate: 0.009 },
      { key: "construction", label: "건설업", rate: 0.035 },
    ],
  },
  {
    source: "고용노동부 고시 — 2026년 사업종류별 산재보험료율 (평균 1.47%, 출퇴근재해 0.6‰)",
    url: "https://www.moel.go.kr/",
    checkedAt: CHECKED,
    effective: "2026-01-01 ~ 2026-12-31",
    basis: "official",
    note: "사업장의 세부 사업종류에 따라 요율이 다르므로 근로복지공단 고지 요율을 우선하세요.",
  },
);

/** 원천징수. */
export const WITHHOLDING = sourced(
  {
    /** 사업소득 (인적용역) 소득세율. 지방소득세는 소득세의 10%. */
    businessRate: 0.03,
    localRatio: 0.1,
    daily: {
      /** 일용근로소득 1일 근로소득공제 */
      deductionPerDay: 150_000,
      rate: 0.06,
      /** 근로소득세액공제 (산출세액의) */
      taxCreditRatio: 0.55,
      /** 소액부징수: 1일 원천징수 소득세가 이 금액 미만이면 징수하지 않음 */
      smallAmountThreshold: 1_000,
    },
  },
  {
    source: "국세청 — 사업소득·일용근로소득 원천징수 안내 (소득세법 제47·59·86·129조)",
    url: "https://www.nts.go.kr/",
    checkedAt: CHECKED,
    basis: "official",
    note: "인적용역 사업소득(3.3%)은 2024-07-01 지급분부터 소액부징수 적용이 제외됐습니다.",
  },
);

/** 신용카드 우대수수료율 (영세·중소가맹점). */
export const CARD_FEES = sourced(
  {
    tiers: [
      { key: "t3", label: "연 매출 3억 원 이하", credit: 0.004, check: 0.0015 },
      { key: "t5", label: "3억 초과 ~ 5억 원 이하", credit: 0.01, check: 0.0075 },
      { key: "t10", label: "5억 초과 ~ 10억 원 이하", credit: 0.0115, check: 0.009 },
      { key: "t30", label: "10억 초과 ~ 30억 원 이하", credit: 0.0145, check: 0.0115 },
    ],
  },
  {
    source: "금융위원회 — 영세·중소가맹점 우대수수료율 (2025-02-14 적용, 2026년 상반기 재지정 동일)",
    url: "https://www.fsc.go.kr/no010101/83642",
    checkedAt: CHECKED,
    effective: "2025-02-14 ~",
    basis: "official",
  },
);

/** 30억 초과 일반가맹점: 카드사별 개별 계약 — 사용자가 직접 입력하는 기본값. */
export const CARD_FEES_GENERAL_DEFAULT = sourced(
  { credit: 0.02, check: 0.015 },
  {
    source: "일반가맹점 대표 가정값 (카드사 개별 계약 요율 — 가맹점 계약서 확인 필요)",
    checkedAt: CHECKED,
    basis: "assumed",
  },
);

/** 부가가치세. */
export const VAT = sourced(
  { rate: 0.1, simplifiedThreshold: 104_000_000 },
  {
    source: "부가가치세법 제30조(세율 10%), 제61조(간이과세 기준 1억 400만 원)",
    url: "https://www.nts.go.kr/",
    checkedAt: CHECKED,
    basis: "law",
  },
);

/** 면적 단위. */
export const AREA = sourced(
  { m2PerPyeong: 3.3058 },
  {
    source: "통상 환산값 (1평 = 400/121㎡ ≈ 3.3058㎡, 법정 단위는 ㎡)",
    checkedAt: CHECKED,
    basis: "law",
  },
);

/** Labor-law constants used by wage tools. */
export const LABOR_LAW = sourced(
  {
    /** 주휴수당 요건: 1주 소정근로시간 15시간 이상 */
    weeklyHolidayMinHours: 15,
    /** 주휴시간 산정 기준 (주 40시간 → 8시간) */
    fullTimeWeeklyHours: 40,
    dailyStandardHours: 8,
    /** 월 환산 계수 (365 ÷ 7 ÷ 12 ≈ 4.345주) */
    weeksPerMonth: 365 / 7 / 12,
    /** 월 소정근로시간 기준 (주 40h + 주휴 8h) × 4.345 ≈ 209h */
    monthlyStandardHours: 209,
    /** 5인 이상 사업장 가산수당 비율 (근로기준법 제56조) */
    overtimePremium: 0.5,
    nightPremium: 0.5,
    holidayPremiumUpTo8h: 0.5,
    holidayPremiumOver8h: 1.0,
    /** 휴게시간: 4시간 이상 30분, 8시간 이상 1시간 (제54조) */
    breakRules: [
      { minWorkMinutes: 240, minBreakMinutes: 30 },
      { minWorkMinutes: 480, minBreakMinutes: 60 },
    ],
    /** 연소근로자 (18세 미만) 1일 7시간·1주 35시간 (제69조) */
    minorAge: 18,
    minorDailyMax: 7,
    minorWeeklyMax: 35,
    /** 취직인허증 필요 연령 (15세 미만, 제64조) */
    workPermitAge: 15,
  },
  {
    source: "근로기준법 제50·54·55·56·64·69조, 시행령 제30조",
    url: "https://www.law.go.kr/법령/근로기준법",
    checkedAt: CHECKED,
    basis: "law",
  },
);
