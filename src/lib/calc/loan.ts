// 대출 이자 계산기 — pure functions.
//
// Both repayment methods are always computed so the page can compare them.
// 월 이율 r = 연이율 ÷ 12 (interest computed as balance × 연이율% ÷ 1200).
//
// Rounding (whole won, documented choice):
// - 월 이자 = 잔액 × r, 원 미만 절사 (floor, with a 1e-7 guard for float noise).
// - 원리금균등: 월 상환액 = P·r·(1+r)^n ÷ ((1+r)^n − 1), 원 단위 반올림
//   (r = 0 → P ÷ n, 반올림). 매월 원금 = 상환액 − 이자 (never below 0).
// - 원금균등: 매월 원금 = floor(P ÷ n).
// - Last month (both methods) pays the whole remaining balance, so the sum of
//   원금 is exactly the loan amount; its payment = 남은 원금 + 그 달 이자.
// 개월 수 must be an integer in [1, LOAN_MAX_MONTHS].

import { Check, ok, type CalcResult } from "./types";
import { LEGAL_MAX_INTEREST } from "./rates/storeCosts";

export const LOAN_MAX_MONTHS = 600;

export type LoanMethod = "annuity" | "equalPrincipal";

export const LOAN_METHOD_LABELS: Record<LoanMethod, string> = {
  annuity: "원리금균등",
  equalPrincipal: "원금균등",
};

export interface LoanInput {
  principal: number | null;
  /** 연이율 (%) */
  annualRatePct: number | null;
  months: number | null;
}

export interface LoanRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  /** 상환 후 잔액 */
  balance: number;
}

export interface LoanSchedule {
  method: LoanMethod;
  rows: LoanRow[];
  totalInterest: number;
  totalPayment: number;
  totalPrincipal: number;
  firstPayment: number;
  lastPayment: number;
  maxPayment: number;
  minPayment: number;
}

export interface LoanResult {
  principal: number;
  annualRatePct: number;
  months: number;
  annuity: LoanSchedule;
  equalPrincipal: LoanSchedule;
  /** 원리금균등 계산상 월 상환액 (반올림 전) */
  annuityExactPayment: number;
  /** 원리금균등 총 이자 − 원금균등 총 이자 (≥ 0 normally) */
  interestGap: number;
}

/** 월 이자: 잔액 × 연이율% ÷ 1200, 원 미만 절사. */
export function monthlyInterest(balance: number, annualRatePct: number): number {
  if (balance <= 0 || annualRatePct <= 0) return 0;
  const r = Math.floor((balance * annualRatePct) / 1200 + 1e-7);
  return r === 0 ? 0 : r;
}

/** 원리금균등 exact monthly payment (unrounded). */
export function annuityPayment(principal: number, annualRatePct: number, months: number): number {
  if (annualRatePct === 0) return principal / months;
  const r = annualRatePct / 1200;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

function summarize(method: LoanMethod, rows: LoanRow[]): LoanSchedule {
  let totalInterest = 0;
  let totalPayment = 0;
  let totalPrincipal = 0;
  let maxPayment = -Infinity;
  let minPayment = Infinity;
  for (const r of rows) {
    totalInterest += r.interest;
    totalPayment += r.payment;
    totalPrincipal += r.principal;
    if (r.payment > maxPayment) maxPayment = r.payment;
    if (r.payment < minPayment) minPayment = r.payment;
  }
  return {
    method,
    rows,
    totalInterest,
    totalPayment,
    totalPrincipal,
    firstPayment: rows[0]?.payment ?? 0,
    lastPayment: rows[rows.length - 1]?.payment ?? 0,
    maxPayment: rows.length ? maxPayment : 0,
    minPayment: rows.length ? minPayment : 0,
  };
}

export function annuitySchedule(principal: number, annualRatePct: number, months: number): LoanSchedule {
  const payment = Math.round(annuityPayment(principal, annualRatePct, months));
  const rows: LoanRow[] = [];
  let balance = principal;
  for (let m = 1; m <= months; m++) {
    const interest = monthlyInterest(balance, annualRatePct);
    const principalPart = m === months ? balance : Math.min(balance, Math.max(0, payment - interest));
    balance -= principalPart;
    rows.push({ month: m, payment: principalPart + interest, principal: principalPart, interest, balance });
  }
  return summarize("annuity", rows);
}

export function equalPrincipalSchedule(principal: number, annualRatePct: number, months: number): LoanSchedule {
  const base = Math.floor(principal / months);
  const rows: LoanRow[] = [];
  let balance = principal;
  for (let m = 1; m <= months; m++) {
    const interest = monthlyInterest(balance, annualRatePct);
    const principalPart = m === months ? balance : Math.min(balance, base);
    balance -= principalPart;
    rows.push({ month: m, payment: principalPart + interest, principal: principalPart, interest, balance });
  }
  return summarize("equalPrincipal", rows);
}

export function loan(input: LoanInput): CalcResult<LoanResult> {
  const c = new Check();
  const principal = c.req("principal", "대출 원금", input.principal);
  const rate = c.req("annualRatePct", "연 이율", input.annualRatePct);
  const months = c.req("months", "상환 기간", input.months);
  c.positive("principal", "대출 원금", input.principal);
  if (input.principal != null && input.principal > 0 && !Number.isInteger(input.principal)) {
    c.issues.push({ field: "principal", message: "대출 원금은 원 단위 정수로 입력해 주세요." });
  }
  c.percent("annualRatePct", "연 이율", input.annualRatePct);
  if (input.months != null) {
    if (!Number.isInteger(input.months) || input.months < 1 || input.months > LOAN_MAX_MONTHS) {
      c.issues.push({ field: "months", message: `상환 기간은 1~${LOAN_MAX_MONTHS}개월 사이의 정수로 입력해 주세요.` });
    }
  }
  const early = c.result<LoanResult>();
  if (early) return early;

  const annuity = annuitySchedule(principal, rate, months);
  const equalPrincipal = equalPrincipalSchedule(principal, rate, months);

  const warnings: string[] = [];
  const cap = LEGAL_MAX_INTEREST.value.annualRate;
  if (rate / 100 > cap + 1e-12) {
    warnings.push(`연 이율이 법정 최고이자율(연 ${Math.round(cap * 100)}%)을 넘어요. 초과 부분 이자는 무효일 수 있으니 계약을 확인하세요.`);
  }
  if (rate === 0) warnings.push("금리 0%라 이자 없이 원금만 나눠 갚는 것으로 계산했어요.");

  return ok(
    {
      principal,
      annualRatePct: rate,
      months,
      annuity,
      equalPrincipal,
      annuityExactPayment: annuityPayment(principal, rate, months),
      interestGap: annuity.totalInterest - equalPrincipal.totalInterest,
    },
    warnings,
  );
}
