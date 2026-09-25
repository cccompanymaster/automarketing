// 카드 수수료 계산기 — pure functions.
//
// Calculation order & rounding:
// 1) 요율: 연 매출 구간이 우대 구간(CARD_FEES.tiers)이면 고시 요율, "general"
//    (30억 원 초과 일반가맹점)이면 사용자가 입력한 요율 — 비워 두면
//    CARD_FEES_GENERAL_DEFAULT (가정값).
// 2) 카드별 수수료 = 카드 매출 × 요율, 원 단위 반올림 (실제 정산은 건별·카드사별
//    이라 몇 원~몇십 원 차이가 날 수 있음). 실입금액 = 매출 − 수수료.
// 3) 합계 = 신용 + 체크; 실효 수수료율 = 수수료 합계 ÷ 카드 매출 합계.
// 카드 수수료는 금융용역이라 부가세가 붙지 않아요 (면세).

import { Check, ok, type CalcResult } from "./types";
import { pct, roundWon } from "./num";
import { CARD_FEES, CARD_FEES_GENERAL_DEFAULT } from "./rates";

export const GENERAL_TIER_KEY = "general";
export const GENERAL_TIER_LABEL = "30억 원 초과 (일반가맹점)";

export interface CardTierOption {
  key: string;
  label: string;
  /** null for the general (non-preferential) merchant — user-editable. */
  credit: number | null;
  check: number | null;
}

export function cardTierOptions(): CardTierOption[] {
  return [
    ...CARD_FEES.value.tiers.map((t) => ({ key: t.key, label: t.label, credit: t.credit, check: t.check })),
    { key: GENERAL_TIER_KEY, label: GENERAL_TIER_LABEL, credit: null, check: null },
  ];
}

export interface CardFeeInput {
  tierKey: string;
  creditSales: number | null;
  checkSales: number | null;
  /** 일반가맹점 신용카드 요율 (%). null → default. */
  generalCreditPct?: number | null;
  /** 일반가맹점 체크카드 요율 (%). null → default. */
  generalCheckPct?: number | null;
}

export interface CardLine {
  sales: number;
  rate: number;
  fee: number;
  deposit: number;
}

export interface CardFeeResult {
  tier: { key: string; label: string; general: boolean; usedDefaultRates: boolean };
  credit: CardLine;
  check: CardLine;
  totalSales: number;
  totalFee: number;
  totalDeposit: number;
  /** 수수료 합계 ÷ 카드 매출 합계 (매출 0 → 0) */
  effectiveRate: number;
  /** 월 수수료 × 12 */
  annualFee: number;
}

export function calcCardFee(input: CardFeeInput): CalcResult<CardFeeResult> {
  const c = new Check();
  const general = input.tierKey === GENERAL_TIER_KEY;
  const tier = CARD_FEES.value.tiers.find((t) => t.key === input.tierKey);
  if (!general && !tier) c.issues.push({ field: "tierKey", message: "연 매출 구간을 선택해 주세요." });
  if (input.creditSales == null && input.checkSales == null) c.missing.push("신용카드 또는 체크카드 월 매출");
  c.min("creditSales", "신용카드 월 매출", input.creditSales, 0);
  c.min("checkSales", "체크카드 월 매출", input.checkSales, 0);
  if (general) {
    c.percent("generalCreditPct", "신용카드 수수료율", input.generalCreditPct ?? null, { below100: true });
    c.percent("generalCheckPct", "체크카드 수수료율", input.generalCheckPct ?? null, { below100: true });
  }
  const early = c.result<CardFeeResult>();
  if (early) return early;

  const def = CARD_FEES_GENERAL_DEFAULT.value;
  const creditRate = general ? (input.generalCreditPct != null ? pct(input.generalCreditPct) : def.credit) : tier!.credit;
  const checkRate = general ? (input.generalCheckPct != null ? pct(input.generalCheckPct) : def.check) : tier!.check;
  const usedDefaultRates = general && (input.generalCreditPct == null || input.generalCheckPct == null);

  const line = (sales: number, rate: number): CardLine => {
    const fee = roundWon(sales * rate);
    return { sales, rate, fee, deposit: sales - fee };
  };
  const credit = line(input.creditSales ?? 0, creditRate);
  const check = line(input.checkSales ?? 0, checkRate);
  const totalSales = credit.sales + check.sales;
  const totalFee = credit.fee + check.fee;

  const warnings: string[] = [];
  if (usedDefaultRates) warnings.push("일반가맹점 요율을 비워 둔 항목은 가정값으로 계산했어요. 카드사 가맹점 계약 요율을 입력하면 더 정확해요.");
  if (totalSales === 0) warnings.push("카드 매출이 0원이라 수수료도 0원이에요.");

  return ok(
    {
      tier: { key: input.tierKey, label: general ? GENERAL_TIER_LABEL : tier!.label, general, usedDefaultRates },
      credit,
      check,
      totalSales,
      totalFee,
      totalDeposit: totalSales - totalFee,
      effectiveRate: totalSales > 0 ? totalFee / totalSales : 0,
      annualFee: totalFee * 12,
    },
    warnings,
  );
}
