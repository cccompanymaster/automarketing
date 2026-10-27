// Supabase Edge Function: 상담 챗봇 (Ollama).
// Answers visitors and members from the site's own knowledge base
// (/chatbot-knowledge.txt, built from the catalog) and hands off to a human
// (카카오톡 1:1) when it can't answer or the visitor asks for one.
//
// Deploy: supabase functions deploy chatbot --no-verify-jwt   (guests use it too)
// Secrets (Supabase → Edge Functions → Secrets):
//   OLLAMA_BASE_URL   (필수) e.g. https://ollama.example.com  or  https://ollama.com (Ollama Cloud)
//   OLLAMA_API_KEY    (선택) Bearer token for Ollama Cloud or a protected proxy
//   OLLAMA_MODEL      (선택) default "gemma3:12b"
//   SITE_URL          (선택) default https://selfmarketing.ai.kr — where the knowledge file lives
//
// Request:  { messages: [{ role: "user"|"assistant", content: string }] }
// Response: { reply: string, handoff: boolean }   |   503 { code: "not_configured" }

const OLLAMA_BASE_URL = Deno.env.get("OLLAMA_BASE_URL")?.replace(/\/$/, "");
const OLLAMA_API_KEY = Deno.env.get("OLLAMA_API_KEY");
const OLLAMA_MODEL = Deno.env.get("OLLAMA_MODEL") ?? "gemma3:12b";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://selfmarketing.ai.kr").replace(/\/$/, "");

const ALLOWED_ORIGINS = [SITE_URL, "http://localhost:3000", "http://localhost:4180"];
const HANDOFF = "[[상담원]]";

const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : SITE_URL,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

// Knowledge file, cached per instance for 10 minutes.
let knowledge = { text: "", at: 0 };
async function getKnowledge(): Promise<string> {
  if (knowledge.text && Date.now() - knowledge.at < 10 * 60_000) return knowledge.text;
  const res = await fetch(`${SITE_URL}/chatbot-knowledge.txt`);
  if (!res.ok) throw new Error(`knowledge ${res.status}`);
  knowledge = { text: (await res.text()).slice(0, 60_000), at: Date.now() };
  return knowledge.text;
}

// Per-instance rate limit: 20 messages / 10 min per client IP.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 20;
}

const SYSTEM = (kb: string) => `당신은 소상공인 셀프 마케팅 플랫폼 "마케팅방주"의 상담 챗봇입니다.
규칙:
- 아래 [상담 지식]에 있는 내용만으로 답합니다. 없는 가격·조건·효과·일정은 절대 지어내지 않습니다.
- 한국어 존댓말(~해요체)로 3~6문장 이내로 짧고 친절하게 답합니다. 금액은 지식에 적힌 그대로 씁니다(부가세 별도 표기 유지).
- 순위·성과를 보장한다고 말하지 않습니다. 상품 상세에 적힌 보장 조건만 그대로 안내합니다.
- 상품을 물으면 맞는 상품명·단가·상세 페이지 주소를 알려 주고, 주문은 상세 페이지의 [바로 주문하기]에서 할 수 있다고 안내합니다.
- 다음 경우에는 답변 끝에 정확히 ${HANDOFF} 를 붙입니다: 지식에 답이 없을 때, 견적·키워드 난이도 확인이 필요할 때, 결제·입금 확인·환불 등 개인 계정 처리가 필요할 때, 사용자가 사람/상담원을 원할 때.
- 개인정보(비밀번호, 카드번호 등)를 묻지 않으며, 받더라도 다시 말하지 않습니다.

[상담 지식]
${kb}`;

type Msg = { role: "user" | "assistant"; content: string };

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: "forbidden" }, 403);
  if (!OLLAMA_BASE_URL) return json({ code: "not_configured" }, 503);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return json({ reply: "질문이 많아 잠시 쉬어 갈게요. 급하시면 상담원에게 바로 물어봐 주세요.", handoff: true }, 429);

  let messages: Msg[];
  try {
    const body = (await req.json()) as { messages?: Msg[] };
    messages = (body.messages ?? [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") throw new Error();
  } catch {
    return json({ error: "messages required" }, 400);
  }

  try {
    const kb = await getKnowledge();
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        // The knowledge base is ~10k tokens; Ollama's default context would truncate it.
        options: { temperature: 0.2, num_predict: 600, num_ctx: 16384 },
        messages: [{ role: "system", content: SYSTEM(kb) }, ...messages],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) throw new Error(`ollama ${res.status}`);
    const data = (await res.json()) as { message?: { content?: string } };
    let reply = (data.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const handoff = reply.includes(HANDOFF) || !reply;
    reply = reply.replaceAll(HANDOFF, "").trim() || "이 부분은 상담원이 정확히 안내해 드릴게요.";
    return json({ reply, handoff });
  } catch (e) {
    console.error(e);
    return json({ reply: "지금은 답변이 어려워요. 상담원에게 바로 연결해 드릴게요.", handoff: true }, 502);
  }
});
