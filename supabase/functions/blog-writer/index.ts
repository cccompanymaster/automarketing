// Supabase Edge Function: AI 블로그 원고 생성 프록시 (Ollama 우선, 없으면 Claude).
// 정적 사이트(클라이언트)에 API 키를 둘 수 없으므로 생성은 이 서버에서 처리합니다.
// 보안: 모든 요청은 Supabase 세션(JWT)으로 인증되어야 하며, 원고(article)
// 생성은 서버에서 use_cash RPC 로 캐시를 차감합니다(클라이언트 차감 신뢰 금지).
//
// 배포:
//   supabase functions deploy blog-writer --no-verify-jwt
//   Ollama (우선): OLLAMA_BASE_URL (필수), OLLAMA_API_KEY (선택), OLLAMA_MODEL (선택, 기본 gemma3:12b)
//   또는 Claude: ANTHROPIC_API_KEY (+ 선택 BLOG_MODEL)
//   둘 다 없으면 503 { code: "not_configured" } → 사이트는 데모 원고(무료)로 동작.
// 사이트는 NEXT_PUBLIC_BLOG_API_URL 이 없으면 <SUPABASE_URL>/functions/v1/blog-writer 를 씁니다.
//
// 요청: { mode: "titles"|"outline"|"article", input: { topic, title?, keywords[], tone, writer?, outline?[] } }

import Anthropic from "npm:@anthropic-ai/sdk@^0.69.0";
import { createClient } from "npm:@supabase/supabase-js@^2.108.2";

const MODEL = Deno.env.get("BLOG_MODEL") ?? "claude-opus-4-8";
const OLLAMA_BASE_URL = Deno.env.get("OLLAMA_BASE_URL")?.replace(/\/$/, "");
const OLLAMA_API_KEY = Deno.env.get("OLLAMA_API_KEY");
const OLLAMA_MODEL = Deno.env.get("OLLAMA_MODEL") ?? "gemma3:12b";

// Cost (cash) to generate one article — must match BLOG_WRITE_COST on the client.
const ARTICLE_COST = 500;

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
  /** Industry preset key (see INDUSTRY_GUIDES). */
  industry?: string;
}

// 업종별 원고 루틴: what to cover and what to avoid, per industry.
const INDUSTRY_GUIDES: Record<string, string> = {
  restaurant: "음식점: 대표 메뉴의 맛·양·가격, 매장 분위기, 주차·웨이팅·예약, 위치(역·랜드마크 기준 거리)를 구체적으로. 메뉴 사진이 들어갈 자리를 [사진: ...]으로 표시.",
  cafe: "카페·디저트: 시그니처 메뉴, 원두·재료, 좌석·콘센트·작업하기 좋은지, 포토존, 영업시간을 구체적으로. [사진: ...] 자리 표시.",
  beauty: "뷰티(헤어·네일·피부관리): 시술 과정, 소요 시간, 가격대, 관리 팁, 예약 방법. 의학적 효능·치료 효과 표현 금지.",
  medical: "병원·의원: 의료법 광고 규정 준수 — 치료 효과 보장, 다른 병원과 비교, 전후 사진·체험담, '최고·유일' 같은 최상급 표현 금지. 진료 과목·진료 시간·위치·주차·예약 방법 등 정보 위주로 객관적으로.",
  academy: "학원·교육: 커리큘럼, 수업 방식, 반 인원, 상담·레벨테스트 절차, 위치·셔틀. 성적 향상 보장 표현 금지.",
  fitness: "헬스·필라테스·PT: 프로그램 구성, 강사 경력, 시설, 이용권 가격 구조, 체험 수업. 감량 수치 보장 금지.",
  shopping: "쇼핑몰·제품: 제품 특징·소재·사이즈·사용법, 구매 전 체크포인트, 배송·교환. 과장된 효능 표현 금지.",
  lodging: "숙박·펜션: 객실 구성, 부대시설, 주변 즐길 거리, 체크인·아웃, 예약 팁, 계절별 추천.",
  service: "생활 서비스(이사·청소·인테리어 등): 작업 과정, 견적 기준, 소요 기간, A/S, 사전 체크리스트.",
};

const industryGuide = (i: BlogInput) =>
  i.industry && INDUSTRY_GUIDES[i.industry] ? `\n업종 가이드 — ${INDUSTRY_GUIDES[i.industry]}` : "";

/** One text completion from whichever provider is configured. */
async function complete(system: string, user: string, maxTokens: number): Promise<string> {
  if (OLLAMA_BASE_URL) {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        options: { temperature: 0.7, num_predict: maxTokens, num_ctx: 8192 },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`AI 서버 응답 오류 (${res.status})`);
    const data = (await res.json()) as { message?: { content?: string } };
    return (data.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  }
  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return textOf(msg);
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
  `주제: ${i.topic}\n제목: ${i.title ?? "(미정)"}\n핵심 키워드: ${(i.keywords ?? []).join(", ") || "(없음)"}\n말투: ${i.tone ?? "~해요"}${industryGuide(i)}`;

async function genTitles(i: BlogInput): Promise<string[]> {
  const raw = await complete(
    "당신은 한국어 SEO 블로그 카피라이터입니다. 검색 노출에 유리하고 클릭을 부르는 제목을 만듭니다.",
    `다음 정보로 블로그 제목 5개를 제안해 주세요. JSON 문자열 배열로만 답하세요.\n\n${ctx(i)}`,
    1024,
  );
  return parseList(raw).slice(0, 5);
}

async function genOutline(i: BlogInput): Promise<string[]> {
  const raw = await complete(
    "당신은 한국어 블로그 구조 설계 전문가입니다.",
    `다음 정보로 블로그 본문 목차(H2 소제목) 5~7개를 제안해 주세요. JSON 문자열 배열로만 답하세요.\n\n${ctx(i)}`,
    1024,
  );
  return parseList(raw).slice(0, 8);
}

async function genArticle(i: BlogInput): Promise<string> {
  const outline = (i.outline ?? []).filter(Boolean);
  const outlineText = outline.length ? `\n다음 목차를 따르세요:\n${outline.map((h, n) => `${n + 1}. ${h}`).join("\n")}` : "";
  return complete(
    "당신은 한국어 정보성 블로그 작가입니다. 네이버 블로그 검색 노출을 고려해 자연스럽고 신뢰감 있는 글을 마크다운으로 작성합니다. 핵심 키워드는 제목과 첫 문단, 소제목에 자연스럽게 넣되 같은 키워드를 억지로 반복하지 않습니다. 과장·허위 표현은 피하고, 업종 가이드가 있으면 반드시 따릅니다. 본문은 1,500자 이상으로 씁니다.",
    `다음 정보로 완성형 블로그 원고를 마크다운으로 작성해 주세요. 제목(#), 소제목(##), 도입부, 본문, 마무리를 포함하세요. 말투를 일관되게 유지하세요.\n\n${ctx(i)}${outlineText}`,
    6000,
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  if (!OLLAMA_BASE_URL && !Deno.env.get("ANTHROPIC_API_KEY")) return json({ code: "not_configured" }, 503);

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

    // titles / outline are free; only a full article costs cash.
    if (mode === "titles") return json({ titles: await genTitles(input) });
    if (mode === "outline") return json({ outline: await genOutline(input) });
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

      const article = await genArticle(input);
      if (!article) return json({ error: "원고를 만들지 못했어요. 다시 시도해 주세요." }, 502);

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
