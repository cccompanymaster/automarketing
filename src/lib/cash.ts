// Cash / points domain model. The platform uses a 1원 = 1캐시 conversion.
// Pure helpers only — persistence lives in WalletProvider, payment in payments.ts.

/** Conversion rate: 1 KRW == 1 cash. */
export const CASH_PER_KRW = 1;

/** Charge presets, in cash to receive (the payment adds 10% VAT on top). */
export const CHARGE_PRESETS_CASH = [10_000, 30_000, 50_000, 100_000, 300_000];

/** Minimum / maximum single charge, in cash (supply value, VAT excluded). */
export const MIN_CHARGE_CASH = 1_000;
export const MAX_CHARGE_CASH = 10_000_000;

/** Top-ups are paid VAT-inclusive; cash is credited at the supply value. */
export const VAT_RATE = 0.1;

/**
 * VAT on top-ups starts with the revised terms (제7조, 시행 2026-11-06 KST).
 * Before that a top-up credits 1원 = 1캐시. Server-side twins: the
 * request_bank_charge RPC and the payment-webhook function.
 */
export const VAT_START = Date.parse("2026-11-06T00:00:00+09:00");

export function vatApplies(at: number = Date.now()): boolean {
  return at >= VAT_START;
}

/** KRW to pay for a given amount of cash (VAT incl. from VAT_START). Cash is kept to multiples of 10, so this is exact. */
export function paymentForCash(cash: number, at: number = Date.now()): number {
  return vatApplies(at) ? Math.round(cash * (1 + VAT_RATE)) : cash;
}

/** Cash credited for a payment (mirrors the server: floor(krw × 10 / 11) from VAT_START). */
export function cashForPayment(krw: number, at: number = Date.now()): number {
  return vatApplies(at) ? Math.floor((krw * 10) / 11) : krw;
}

export type CashTxnType = "charge" | "use" | "refund" | "bonus";

export interface CashTxn {
  id: string;
  type: CashTxnType;
  /** Signed cash delta: positive for charge/refund/bonus, negative for use. */
  amount: number;
  /** Balance after this transaction. */
  balanceAfter: number;
  memo: string;
  createdAt: string; // ISO
}

export function krwToCash(krw: number): number {
  return Math.round(krw * CASH_PER_KRW);
}

export function cashToKrw(cash: number): number {
  return Math.round(cash / CASH_PER_KRW);
}

export function formatCash(cash: number): string {
  return `${cash.toLocaleString("ko-KR")} C`;
}

export function formatKrw(krw: number): string {
  return `${krw.toLocaleString("ko-KR")}원`;
}

const TXN_LABELS: Record<CashTxnType, string> = {
  charge: "충전",
  use: "사용",
  refund: "환불",
  bonus: "보너스",
};

export function txnLabel(type: CashTxnType): string {
  return TXN_LABELS[type];
}
