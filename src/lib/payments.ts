// Payment / billing entry point. Single place to swap in the real PG.
// Roadmap: credit top-up, ad-spend settlement, refund payout (web + mobile).
//
// Charging uses a 1원 = 1캐시 conversion (see cash.ts). Today this is a STUB
// "test" top-up that credits cash immediately. When a PG (e.g. PortOne) is
// connected, replace requestCharge() with: open PG checkout -> on success,
// verify server-side (webhook) -> credit cash. Never credit on the client for
// real money.
// TODO(payment): integrate PortOne checkout + server-side verification.

import { krwToCash } from "./cash";

export interface ChargeResult {
  ok: boolean;
  /** Cash credited on success. */
  cashCredited: number;
  /** Payment method label for the ledger memo. */
  method: string;
  /** Present when ok === false. */
  error?: string;
}

/**
 * Request a cash top-up for the given KRW amount.
 * STUB: resolves as a successful "test" charge. No real money moves.
 */
export async function requestCharge(krw: number): Promise<ChargeResult> {
  // TODO(payment): launch PG checkout and confirm server-side before crediting.
  return {
    ok: true,
    cashCredited: krwToCash(krw),
    method: "테스트 충전",
  };
}
