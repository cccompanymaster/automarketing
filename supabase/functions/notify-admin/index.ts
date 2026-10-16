// Supabase Edge Function: 관리자 알림 — 무통장입금 충전 신청 → 사장님 이메일.
//
// Called by the AFTER INSERT trigger on public.charge_requests (pg_net) with
// { id }. It "claims" the row by setting notified_at only when it's still null,
// so each request emails at most once no matter how often this is called —
// that's why it can run without JWT verification (verify_jwt=false) safely.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY      (필수) Resend API key — same account as the auth SMTP
//   ADMIN_NOTIFY_EMAIL  (선택) default cccompanymaster@gmail.com, comma-separated for several
//   NOTIFY_FROM         (선택) default "마케팅방주 알림 <noreply@selfmarketing.ai.kr>"
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from "npm:@supabase/supabase-js@^2.108.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TO = (Deno.env.get("ADMIN_NOTIFY_EMAIL") ?? "cccompanymaster@gmail.com").split(",").map((s) => s.trim()).filter(Boolean);
const FROM = Deno.env.get("NOTIFY_FROM") ?? "마케팅방주 알림 <noreply@selfmarketing.ai.kr>";
const SITE = "https://selfmarketing.ai.kr";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const won = (n: number) => `${Number(n).toLocaleString("ko-KR")}원`;
const kst = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
const RECEIPT: Record<string, string> = { none: "발행 안 함", cash_receipt: "현금영수증", tax_invoice: "세금계산서" };

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "id required" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Claim: only the first call for a request gets the row back.
  const { data: row, error } = await admin
    .from("charge_requests")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", id)
    .is("notified_at", null)
    .select("id, user_id, amount, depositor, receipt_type, receipt_info, created_at")
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!row) return json({ ok: true, skipped: "already notified or not found" });

  const release = () => admin.from("charge_requests").update({ notified_at: null }).eq("id", id);
  if (!RESEND_API_KEY) {
    await release();
    return json({ error: "RESEND_API_KEY is not set" }, 500);
  }

  const { data: u } = await admin.auth.admin.getUserById(row.user_id);
  const email = u?.user?.email ?? "(이메일 없음)";
  const info = (row.receipt_info ?? {}) as Record<string, string>;
  const receiptDetail =
    row.receipt_type === "tax_invoice"
      ? ` — ${info.company ?? ""} (${info.bizNo ?? ""}) ${info.email ?? ""}`
      : row.receipt_type === "cash_receipt"
        ? ` — ${info.purpose === "expense" ? "지출증빙" : "소득공제"} ${info.number ?? ""}`
        : "";

  const subject = `[마케팅방주] 무통장입금 신청 — ${row.depositor} ${won(row.amount)}`;
  const rows: [string, string][] = [
    ["입금자명", row.depositor],
    ["금액", won(row.amount)],
    ["회원", email],
    ["증빙", `${RECEIPT[row.receipt_type] ?? row.receipt_type}${receiptDetail}`],
    ["신청 시각", kst(row.created_at)],
  ];
  const html = `<div style="font-family:Apple SD Gothic Neo,Malgun Gothic,sans-serif;max-width:480px">
  <h2 style="margin:0 0 12px;font-size:18px">새 무통장입금 충전 신청</h2>
  <table style="border-collapse:collapse;width:100%;font-size:14px">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 10px;color:#64748b;border-bottom:1px solid #e2e8f0;white-space:nowrap">${esc(k)}</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:600">${esc(v)}</td></tr>`)
    .join("")}</table>
  <p style="font-size:14px;margin:16px 0">통장에서 입금을 확인한 뒤 관리자 페이지에서 <b>[입금 확인]</b>을 누르면 캐시가 적립돼요.</p>
  <a href="${SITE}/admin/" style="display:inline-block;background:#047857;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:700">관리자 페이지 열기</a>
</div>`;
  const text = `새 무통장입금 충전 신청\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n입금 확인 후 관리자 페이지에서 [입금 확인]을 눌러 주세요: ${SITE}/admin/`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: TO, subject, html, text }),
  });
  if (!res.ok) {
    await release(); // let a later retry send it
    return json({ error: `resend ${res.status}`, detail: (await res.text()).slice(0, 300) }, 502);
  }
  return json({ ok: true });
});
