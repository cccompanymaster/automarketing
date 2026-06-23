// Supabase Edge Function: AI 블로그 원고 생성 프록시 (Claude).
// 정적 사이트(클라이언트)에 API 키를 둘 수 없으므로 생성은 이 서버에서 처리합니다.
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

const MODEL = Deno.env.get("BLOG_MODEL") ?? "claude-opus-4-8";

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

  // TODO(auth): verify the Supabase JWT in the Authorization header and apply
  // per-user rate limits / credit checks before generating.

  try {
    const { mode, input } = (await req.json()) as { mode: string; input: BlogInput };
    if (!input?.topic) return json({ error: "topic is required" }, 400);

    const client = new Anthropic({ apiKey });

    if (mode === "titles") return json({ titles: await genTitles(client, input) });
    if (mode === "outline") return json({ outline: await genOutline(client, input) });
    if (mode === "article") return json({ article: await genArticle(client, input) });
    return json({ error: `unknown mode: ${mode}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
