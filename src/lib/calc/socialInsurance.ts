// 4대보험 (국민연금·건강보험·장기요양보험·고용보험) + 산재보험 amounts for one
// employee's monthly wage. Pure, shared by the payroll / labor-ratio / payslip
// calculators — keep the exported signature stable.
//
// Calculation order and rounding (each person's share is computed on its own):
// 1. 국민연금: 기준소득월액 = 월 보수 천원 미만 절사, then clamped to
//    NATIONAL_PENSION.baseMin ~ baseMax. Share = 기준소득월액 × 4.75%,
//    10원 미만 절사 (floorTo 10). A wage of 0 → 0 (no 하한 applied).
// 2. 건강보험: 월 보수 × 3.595% per side, 10원 미만 절사. (보수월액 상·하한 is
//    ignored — it only bites far above typical small-business wages.)
// 3. 장기요양보험: that side's *절사된* 건강보험료 × LONG_TERM_CARE.ratioOfHealth,
//    10원 미만 절사.
// 4. 고용보험: 근로자 = 월 보수 × 0.9%; 사업주 = 월 보수 × (실업급여 0.9% +
//    고용안정·직업능력개발 요율 by employerSizeKey). Each side 10원 미만 절사.
// 5. 산재보험: 사업주 only = 월 보수 × (업종 요율 + 출퇴근재해 요율), 10원 미만 절사.
// Disabled items stay in the list with 0 amounts (enabled: false).
// Negative / non-finite wages are treated as 0.

import { floorTo, isNum } from "./num";
import {
  EMPLOYMENT_INSURANCE,
  HEALTH_INSURANCE,
  INDUSTRIAL_ACCIDENT,
  LONG_TERM_CARE,
  NATIONAL_PENSION,
} from "./rates";
import { INSURANCE_ROUNDING } from "./rates/laborTax";

export type InsuranceKey = "pension" | "health" | "longTermCare" | "employment" | "industrial";

export const INSURANCE_KEYS: InsuranceKey[] = ["pension", "health", "longTermCare", "employment", "industrial"];

export const INSURANCE_LABELS: Record<InsuranceKey, string> = {
  pension: "국민연금",
  health: "건강보험",
  longTermCare: "장기요양보험",
  employment: "고용보험",
  industrial: "산재보험",
};

export type InsuranceEnabled = Record<InsuranceKey, boolean>;

export const ALL_INSURANCE_ENABLED: InsuranceEnabled = {
  pension: true,
  health: true,
  longTermCare: true,
  employment: true,
  industrial: true,
};

export const DEFAULT_INDUSTRY_KEY = "other";
export const DEFAULT_EMPLOYER_SIZE_KEY = "under150";

export interface SocialInsuranceInput {
  /** 월 보수 (비과세 제외 과세 대상 급여), 원. */
  monthlyWage: number;
  /** Per-insurance switches; omitted keys default to true. */
  enabled?: Partial<InsuranceEnabled>;
  /** INDUSTRIAL_ACCIDENT.byIndustry key (default "other"). */
  industryKey?: string;
  /** EMPLOYMENT_INSURANCE.employerStability key (default "under150"). */
  employerSizeKey?: string;
}

export interface InsuranceItem {
  key: InsuranceKey;
  label: string;
  enabled: boolean;
  /** Amount the rate is applied to (국민연금: clamped 기준소득월액, 장기요양: 건강보험료). */
  base: number;
  employeeRate: number;
  employerRate: number;
  employee: number;
  employer: number;
}

export interface SocialInsuranceResult {
  monthlyWage: number;
  items: InsuranceItem[];
  byKey: Record<InsuranceKey, InsuranceItem>;
  employeeTotal: number;
  employerTotal: number;
  /** employeeTotal + employerTotal */
  total: number;
  /** 국민연금 기준소득월액 after 천원 절사 + 상·하한 (0 when wage is 0). */
  pensionBase: number;
  pensionClamped: "min" | "max" | null;
  industry: { key: string; label: string; rate: number; commute: number };
  employerSize: { key: string; label: string; rate: number };
}

export function findIndustry(key?: string) {
  const list = INDUSTRIAL_ACCIDENT.value.byIndustry;
  return list.find((i) => i.key === key) ?? list.find((i) => i.key === DEFAULT_INDUSTRY_KEY) ?? list[0];
}

export function findEmployerSize(key?: string) {
  const list = EMPLOYMENT_INSURANCE.value.employerStability;
  return list.find((s) => s.key === key) ?? list.find((s) => s.key === DEFAULT_EMPLOYER_SIZE_KEY) ?? list[0];
}

/** 10원 미만 절사 applied to every premium share. */
// +1e-6 guards float noise (1349.9999999998 is really 1,350).
const cut = (n: number) => floorTo(n + 1e-6, INSURANCE_ROUNDING.value.premiumUnit);

export function computeSocialInsurance(input: SocialInsuranceInput): SocialInsuranceResult {
  const wage = isNum(input.monthlyWage) && input.monthlyWage > 0 ? input.monthlyWage : 0;
  const on: InsuranceEnabled = { ...ALL_INSURANCE_ENABLED, ...(input.enabled ?? {}) };
  const industry = findIndustry(input.industryKey);
  const size = findEmployerSize(input.employerSizeKey);

  const np = NATIONAL_PENSION.value;
  const hi = HEALTH_INSURANCE.value;
  const ltc = LONG_TERM_CARE.value;
  const ei = EMPLOYMENT_INSURANCE.value;
  const ia = INDUSTRIAL_ACCIDENT.value;

  // 1. 국민연금
  let pensionBase = 0;
  let pensionClamped: SocialInsuranceResult["pensionClamped"] = null;
  if (wage > 0) {
    const floored = floorTo(wage, INSURANCE_ROUNDING.value.pensionBaseUnit);
    if (floored < np.baseMin) {
      pensionBase = np.baseMin;
      pensionClamped = "min";
    } else if (floored > np.baseMax) {
      pensionBase = np.baseMax;
      pensionClamped = "max";
    } else pensionBase = floored;
  }
  const pension: InsuranceItem = {
    key: "pension",
    label: INSURANCE_LABELS.pension,
    enabled: on.pension,
    base: pensionBase,
    employeeRate: np.employee,
    employerRate: np.employer,
    employee: on.pension ? cut(pensionBase * np.employee) : 0,
    employer: on.pension ? cut(pensionBase * np.employer) : 0,
  };

  // 2. 건강보험
  const health: InsuranceItem = {
    key: "health",
    label: INSURANCE_LABELS.health,
    enabled: on.health,
    base: wage,
    employeeRate: hi.employee,
    employerRate: hi.employer,
    employee: on.health ? cut(wage * hi.employee) : 0,
    employer: on.health ? cut(wage * hi.employer) : 0,
  };

  // 3. 장기요양 — based on each side's 절사된 건강보험료 (computed even if health is off,
  //    since 장기요양 is levied together with 건강보험 in practice).
  const healthEmpRaw = cut(wage * hi.employee);
  const healthErRaw = cut(wage * hi.employer);
  const longTermCare: InsuranceItem = {
    key: "longTermCare",
    label: INSURANCE_LABELS.longTermCare,
    enabled: on.longTermCare,
    base: healthEmpRaw,
    employeeRate: ltc.ratioOfHealth,
    employerRate: ltc.ratioOfHealth,
    employee: on.longTermCare ? cut(healthEmpRaw * ltc.ratioOfHealth) : 0,
    employer: on.longTermCare ? cut(healthErRaw * ltc.ratioOfHealth) : 0,
  };

  // 4. 고용보험
  const eiEmployerRate = ei.employerUnemployment + size.rate;
  const employment: InsuranceItem = {
    key: "employment",
    label: INSURANCE_LABELS.employment,
    enabled: on.employment,
    base: wage,
    employeeRate: ei.employee,
    employerRate: eiEmployerRate,
    employee: on.employment ? cut(wage * ei.employee) : 0,
    employer: on.employment ? cut(wage * eiEmployerRate) : 0,
  };

  // 5. 산재보험 (사업주 전액)
  const iaRate = industry.rate + ia.commute;
  const industrial: InsuranceItem = {
    key: "industrial",
    label: INSURANCE_LABELS.industrial,
    enabled: on.industrial,
    base: wage,
    employeeRate: 0,
    employerRate: iaRate,
    employee: 0,
    employer: on.industrial ? cut(wage * iaRate) : 0,
  };

  const items = [pension, health, longTermCare, employment, industrial];
  const employeeTotal = items.reduce((s, i) => s + i.employee, 0);
  const employerTotal = items.reduce((s, i) => s + i.employer, 0);

  return {
    monthlyWage: wage,
    items,
    byKey: { pension, health, longTermCare, employment, industrial },
    employeeTotal,
    employerTotal,
    total: employeeTotal + employerTotal,
    pensionBase,
    pensionClamped,
    industry: { key: industry.key, label: industry.label, rate: industry.rate, commute: ia.commute },
    employerSize: { key: size.key, label: size.label, rate: size.rate },
  };
}

/**
 * Approximate combined 사업주 rate (no floor/clamp) — used where a payroll
 * *total* rather than one person's wage is known (labor-ratio calculator).
 */
export function employerRateApprox(opts: { industryKey?: string; employerSizeKey?: string; enabled?: Partial<InsuranceEnabled> } = {}): number {
  const on: InsuranceEnabled = { ...ALL_INSURANCE_ENABLED, ...(opts.enabled ?? {}) };
  const industry = findIndustry(opts.industryKey);
  const size = findEmployerSize(opts.employerSizeKey);
  const hi = HEALTH_INSURANCE.value.employer;
  return (
    (on.pension ? NATIONAL_PENSION.value.employer : 0) +
    (on.health ? hi : 0) +
    (on.longTermCare ? hi * LONG_TERM_CARE.value.ratioOfHealth : 0) +
    (on.employment ? EMPLOYMENT_INSURANCE.value.employerUnemployment + size.rate : 0) +
    (on.industrial ? industry.rate + INDUSTRIAL_ACCIDENT.value.commute : 0)
  );
}
