// Supabase Edge Function: AI 블로그 원고 생성 프록시 (Claude).
// 정적 사이트(클라이언트)에 API 키를 둘 수 없으므로 생성은 이 서버에서 처리합니다.
// 보안: 모든 요청은 Supabase 세션(JWT)으로 인증되어야 하며, 원고(article)
// 생성은 서버에서 use_cash RPC 로 캐시를 차감합니다(클라이언트 차감 신뢰 금지).
//
// 배포:
//   supabase functions deploy blog-writer --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   # 서버 전용, 노출 금지
//   (선택) supabase secrets set BLOG_MODEL=claude-sonnet-4-6   # 기본 claude-opus-4-8
// 그리고 .env.local 에:
//   NEXT_PUBLIC_BLOG_API_URL=https://<project>.supabase.co/functions/v1/blog-writer
//
// 요청: { mode: "titles"|"outline"|"article", input: { topic, title?, keywords[], tone, writer?, outline?[] } }

import Anthropic from "npm:@anthropic-ai/sdk@^0.69.0";
import { createClient } from "npm:@supabase/supabase-js@^2.108.2";

const MODEL = Deno.env.get("BLOG_MODEL") ?? "claude-opus-4-8";

// Cost (cash) to generate one article — must match BLOG_WRITE_COST on the client.
const ARTICLE_COST = 1000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

interface BlogInput {
  writer?: string;
  topic: string;
  title?: string;
  keywords?: string[];
  tone?: string;
  outline?: string[];
  useWeb?: boolean;
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** Tolerant JSON-array extraction from a model response. */
function parseList(raw: string): string[] {
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(match ? match[0] : raw);
    if (Array.isArray(arr)) return arr.map((x) => String(x)).filter(Boolean);
  } catch {
    /* fall through */
  }
  // Fallback: split lines, strip bullets/numbering.
  return raw
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*\d.]+)\s*/, "").trim())
    .filter(Boolean);
}

const ctx = (i: BlogInput) =>
  `주제: ${i.topic}\n제목: ${i.title ?? "(미정)"}\n핵심 키워드: ${(i.keywords ?? []).join(", ") || "(없음)"}\n말투: ${i.tone ?? "~해요"}`;

async function genTitles(client: Anthropic, i: BlogInput): Promise<string[]> {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "당신은 한국어 SEO 블로그 카피라이터입니다. 검색 노출에 유리하고 클릭을 부르는 제목을 만듭니다.",
    messages: [
      {
        role: "user",
        content: `다음 정보로 블로그 제목 5개를 제안해 주세요. JSON 문자열 배열로만 답하세요.\n\n${ctx(i)}`,
      },
    ],
  });
  return parseList(textOf(msg)).slice(0, 5);
}

async function genOutline(client: Anthropic, i: BlogInput): Promise<string[]> {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: "당신은 한국어 블로그 구조 설계 전문가입니다.",
    messages: [
      {
        role: "user",
        content: `다음 정보로 블로그 본문 목차(H2 소제목) 5~7개를 제안해 주세요. JSON 문자열 배열로만 답하세요.\n\n${ctx(i)}`,
      },
    ],
  });
  return parseList(textOf(msg)).slice(0, 8);
}

async function genArticle(client: Anthropic, i: BlogInput): Promise<string> {
  const outline = (i.outline ?? []).filter(Boolean);
  const outlineText = outline.length ? `\n다음 목차를 따르세요:\n${outline.map((h, n) => `${n + 1}. ${h}`).join("\n")}` : "";
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system:
      "당신은 한국어 정보성 블로그 작가입니다. 검색엔진 최적화(SEO)를 고려해, 자연스럽고 신뢰감 있는 글을 마크다운으로 작성합니다. 핵심 키워드를 본문에 자연스럽게 녹이고, 과장·허위 표현은 피합니다.",
    messages: [
      {
        role: "user",
        content: `다음 정보로 완성형 블로그 원고를 마크다운으로 작성해 주세요. 제목(#), 소제목(##), 도입부, 본문, 마무리를 포함하세요. 말투를 일관되게 유지하세요.\n\n${ctx(i)}${outlineText}`,
      },
    ],
  });
  return textOf(msg).trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "ANTHROPIC_API_KEY is not set" }, 500);

  // --- Auth: require a valid Supabase session ------------------------------
  // The function is public, so without this anyone could burn the API key.
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnon) {
    return json({ error: "Supabase env is not configured" }, 500);
  }
  // User-scoped client: RLS + auth.uid() apply to its queries/RPCs.
  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "로그인이 필요합니다." }, 401);

  try {
    const { mode, input } = (await req.json()) as { mode: string; input: BlogInput };
    if (!input?.topic) return json({ error: "topic is required" }, 400);

    const client = new Anthropic({ apiKey });

    // titles / outline are free; only a full article costs cash.
    if (mode === "titles") return json({ titles: await genTitles(client, input) });
    if (mode === "outline") return json({ outline: await genOutline(client, input) });
    if (mode === "article") {
      // Cost enforced server-side (client cannot be trusted to charge itself):
      // pre-check the balance to avoid spending API budget on a user who can't
      // pay, generate, then deduct atomically via the use_cash RPC.
      const { data: balance } = await supabase
        .from("cash_transactions")
        .select("balance_after")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const current = (balance?.balance_after as number | undefined) ?? 0;
      if (current < ARTICLE_COST) return json({ error: "캐시가 부족합니다." }, 402);

      const article = await genArticle(client, input);

      const { error: spendError } = await supabase.rpc("use_cash", {
        p_amount: ARTICLE_COST,
        p_memo: `블로그 원고 - ${input.title ?? input.topic}`,
      });
      if (spendError) return json({ error: spendError.message }, 402);

      return json({ article });
    }
    return json({ error: `unknown mode: ${mode}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
