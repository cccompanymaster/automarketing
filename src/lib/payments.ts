// Payment / billing entry point. Single place to swap in the real PG.
// Roadmap: credit top-up, ad-spend settlement, refund payout (web + mobile).
//
// Charging uses a 1원 = 1캐시 conversion (see cash.ts).
//
// Two modes, gated by env:
//  - STUB (no PortOne keys): a "test" top-up that reports success. The local
//    wallet credits cash immediately. No real money moves.
//  - PORTONE (NEXT_PUBLIC_PORTONE_STORE_ID + CHANNEL_KEY set): launches the
//    PortOne checkout. Crediting is NOT done here — it happens server-side in
//    the payment-webhook function after PortOne verifies the payment, which
//    then calls charge_cash() with the service role. Never credit real money
//    on the client.
// TODO(payment): deploy supabase/functions/payment-webhook + set PortOne keys.

import { krwToCash } from "./cash";

const STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
const CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

/** True when PortOne checkout is wired up (real payment mode). */
export const isPgConfigured = Boolean(STORE_ID && CHANNEL_KEY);

export interface ChargeResult {
  ok: boolean;
  /** Cash credited — authoritative ONLY in stub mode. In PG mode the webhook credits. */
  cashCredited: number;
  /** Payment method label for the ledger memo. */
  method: string;
  /** PortOne payment id (PG mode). */
  paymentId?: string;
  /** Present when ok === false. */
  error?: string;
}

// --- PortOne V2 browser SDK (loaded on demand from CDN) ---------------------

interface PortOneResponse {
  code?: string;
  message?: string;
  paymentId?: string;
  txId?: string;
}
interface PortOneSDK {
  requestPayment(req: Record<string, unknown>): Promise<PortOneResponse>;
}
declare global {
  interface Window {
    PortOne?: PortOneSDK;
  }
}

const PORTONE_SDK_URL = "https://cdn.portone.io/v2/browser-sdk.js";

function loadPortOne(): Promise<PortOneSDK> {
  if (typeof window === "undefined") return Promise.reject(new Error("client only"));
  if (window.PortOne) return Promise.resolve(window.PortOne);
  return new Promise((resolve, reject) => {
    const done = () =>
      window.PortOne ? resolve(window.PortOne) : reject(new Error("PortOne SDK 로드 실패"));
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PORTONE_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", done);
      existing.addEventListener("error", () => reject(new Error("PortOne SDK 로드 실패")));
      return;
    }
    const s = document.createElement("script");
    s.src = PORTONE_SDK_URL;
    s.async = true;
    s.onload = done;
    s.onerror = () => reject(new Error("PortOne SDK 로드 실패"));
    document.head.appendChild(s);
  });
}

function newPaymentId(): string {
  const rnd =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `pay_${rnd}`;
}

/**
 * Request a cash top-up for the given KRW amount.
 * - PG mode: opens PortOne checkout; on success the server webhook credits cash.
 * - Stub mode: resolves as a successful "test" charge (no real money).
 */
export async function requestCharge(
  krw: number,
  opts?: { userId?: string },
): Promise<ChargeResult> {
  if (isPgConfigured) {
    try {
      const PortOne = await loadPortOne();
      const response = await PortOne.requestPayment({
        storeId: STORE_ID,
        channelKey: CHANNEL_KEY,
        paymentId: newPaymentId(),
        orderName: "캐시 충전",
        totalAmount: krw,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        // Carried through to the webhook so the server credits the right user.
        customData: opts?.userId ? { userId: opts.userId } : undefined,
      });
      // PortOne returns a `code` only on failure/cancel.
      if (response?.code != null) {
        return {
          ok: false,
          cashCredited: 0,
          method: "카드",
          error: response.message ?? "결제가 취소되었습니다.",
        };
      }
      return { ok: true, cashCredited: krwToCash(krw), method: "카드", paymentId: response?.paymentId };
    } catch (e) {
      return {
        ok: false,
        cashCredited: 0,
        method: "카드",
        error: e instanceof Error ? e.message : "결제 처리 중 오류가 발생했습니다.",
      };
    }
  }

  // STUB: test top-up. Credited locally by the wallet; no real money moves.
  return { ok: true, cashCredited: krwToCash(krw), method: "테스트 충전" };
}
