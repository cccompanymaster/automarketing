// Supabase Edge Function: PortOne 결제 웹훅 → 캐시 적립.
// 실제 현금 충전은 "오직 여기"에서만 일어납니다. PortOne이 결제를 검증한 뒤
// 보내는 웹훅을 신뢰 가능한 서버에서 한 번 더 확인하고, service_role 로
// charge_cash(p_amount, p_memo, p_uid) 를 호출해 적립합니다.
//
// 배포:
//   supabase functions deploy payment-webhook --no-verify-jwt
//   supabase secrets set PORTONE_API_SECRET=...        # PortOne 콘솔 > API Keys
//   supabase secrets set PORTONE_WEBHOOK_SECRET=...     # PortOne 콘솔 > 웹훅
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 자동 주입)
// PortOne 콘솔의 웹훅 URL 에 이 함수 주소를 등록하세요.
//
// 흐름: 클라이언트가 PortOne 결제창에서 결제 → PortOne 이 이 웹훅 호출 →
//       PortOne API 로 결제 상태/금액 재조회 → 검증되면 캐시 적립.

import { createClient } from "npm:@supabase/supabase-js@^2.108.2";
import { Webhook, PaymentClient } from "npm:@portone/server-sdk@^0.18.0";

const PORTONE_API_SECRET = Deno.env.get("PORTONE_API_SECRET");
const PORTONE_WEBHOOK_SECRET = Deno.env.get("PORTONE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// 1원 = 1캐시.
const cashFor = (krw: number) => Math.round(krw);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!PORTONE_API_SECRET || !PORTONE_WEBHOOK_SECRET || !SUPABASE_URL || !SERVICE_ROLE) {
    return json({ error: "server is not configured" }, 500);
  }

  const raw = await req.text();

  // 1) 웹훅 서명 검증 — 위조된 적립 요청 차단.
  let payment: { paymentId: string };
  try {
    const verified = await Webhook.verify(PORTONE_WEBHOOK_SECRET, raw, {
      "webhook-id": req.headers.get("webhook-id") ?? "",
      "webhook-signature": req.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
    });
    payment = verified as { paymentId: string };
  } catch {
    return json({ error: "invalid signature" }, 401);
  }

  // 2) PortOne API 로 결제 상태/금액을 서버에서 재조회 (클라이언트 값 신뢰 금지).
  const portone = new PaymentClient({ secret: PORTONE_API_SECRET });
  const detail = await portone.getPayment({ paymentId: payment.paymentId });

  if (detail.status !== "PAID") {
    // 아직 미결제/취소 등 — 적립하지 않음(웹훅은 200으로 수신 확인).
    return json({ ok: true, skipped: detail.status });
  }

  const userId = (detail.customData ? JSON.parse(detail.customData) : {})?.userId as
    | string
    | undefined;
  const amountKrw = detail.amount?.total as number | undefined;
  if (!userId || !amountKrw) return json({ error: "missing user or amount" }, 400);

  // 3) service_role 로 적립. credit_payment 는 payment_id 기준 멱등 처리되므로
  //    동일 웹훅이 재전송돼도 중복 적립되지 않습니다.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { error } = await admin.rpc("credit_payment", {
    p_payment_id: payment.paymentId,
    p_amount: cashFor(amountKrw),
    p_uid: userId,
    p_memo: `충전 (${payment.paymentId})`,
  });
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
});
