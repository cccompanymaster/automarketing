// Payment / billing domain — STUB ONLY.
// The product roadmap includes real payments (credit top-up, ad spend
// settlement, refund payout) on both web and the upcoming mobile app, so this
// module centralizes the shapes the UI consumes today. Keep all billing reads
// going through here so swapping in the real API is a single-file change.
// TODO(payment): replace with real billing API client (PG integration,
// credit ledger, refund payouts). Mobile app will consume the same API.

export interface WalletSummary {
  /** Prepaid credit balance used to fund campaigns. */
  credits: number;
  /** Expected refund payout for the current settlement cycle (KRW). */
  expectedRefund: number;
}

/** Dummy wallet shown on /mypage until the billing backend exists. */
export const WALLET_STUB: WalletSummary = {
  credits: 0,
  expectedRefund: 0,
};
