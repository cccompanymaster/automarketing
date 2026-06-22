// Cash / points domain model. The platform uses a 1원 = 1캐시 conversion.
// Pure helpers only — persistence lives in WalletProvider, payment in payments.ts.

/** Conversion rate: 1 KRW == 1 cash. */
export const CASH_PER_KRW = 1;

/** Charge amount presets (KRW). */
export const CHARGE_PRESETS_KRW = [10_000, 30_000, 50_000, 100_000, 300_000];

/** Minimum / maximum single charge (KRW). */
export const MIN_CHARGE_KRW = 1_000;
export const MAX_CHARGE_KRW = 10_000_000;

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
