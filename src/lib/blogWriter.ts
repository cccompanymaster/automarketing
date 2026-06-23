// AI blog-writing domain. Mirrors the 가제트-style flow: 주제 설정 → 아웃라인 → 완성.
//
// Static-export safe: the Claude API key must NOT live in the client. When a
// server proxy is configured (NEXT_PUBLIC_BLOG_API_URL, e.g. a Supabase Edge
// Function that calls Claude), generation goes through it. Otherwise a local
// demo generator produces sample drafts so the UI works without a backend.
// TODO(backend): deploy supabase/functions/blog-writer and set the API URL.

import { getSupabase } from "@/lib/supabase";

export type BlogTone = "~해요" | "~습니다" | "~한다" | "~과거형";

export const BLOG_TONES: BlogTone[] = ["~해요", "~습니다", "~한다", "~과거형"];

/** Cost (cash, 1원=1캐시) to generate one article — matches the 원고 작성 단가. */
export const BLOG_WRITE_COST = 1_000;

/** Max core keywords. */
export const MAX_KEYWORDS = 10;

export interface BlogInput {
  writer?: string;
  /** 주제 (상품/키워드). Required. */
  topic: string;
  /** 블로그 제목. */
  title?: string;
  keywords: string[];
  tone: BlogTone;
  /** 최신 검색정보 활용. */
  useWeb?: boolean;
  /** 이미지 생성. */
  useImage?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_BLOG_API_URL;

/** True when a real generation backend is wired up. */
export const isBlogApiConfigured = Boolean(API_URL);

type Mode = "titles" | "outline" | "article";

async function callApi<T>(mode: Mode, payload: object): Promise<T> {
  // Attach the Supabase access token so the proxy can authorize the user.
  let token: string | undefined;
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  }
  const res = await fetch(API_URL as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ mode, input: payload }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `생성 요청 실패 (${res.status})`);
  }
  return (await res.json()) as T;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Public API -----------------------------------------------------------

export async function generateTitles(input: BlogInput): Promise<string[]> {
  if (isBlogApiConfigured) {
    const { titles } = await callApi<{ titles: string[] }>("titles", input);
    return titles;
  }
  await wait(600);
  return stubTitles(input);
}

export async function generateOutline(input: BlogInput): Promise<string[]> {
  if (isBlogApiConfigured) {
    const { outline } = await callApi<{ outline: string[] }>("outline", input);
    return outline;
  }
  await wait(700);
  return stubOutline(input);
}

export async function generateArticle(input: BlogInput, outline: string[]): Promise<string> {
  if (isBlogApiConfigured) {
    const { article } = await callApi<{ article: string }>("article", { ...input, outline });
    return article;
  }
  await wait(1100);
  return stubArticle(input, outline);
}

// --- Demo (sample) generator — used until the API is configured ------------

const kw = (input: BlogInput) => (input.keywords.length ? input.keywords : [input.topic]);

function stubTitles(input: BlogInput): string[] {
  const t = input.topic.trim() || "주제";
  const k = kw(input)[0];
  return [
    `${t}, 이것만 알면 끝! ${k} 완벽 정리`,
    `${t} 고를 때 꼭 확인해야 할 5가지`,
    `${k} 초보를 위한 ${t} 가이드`,
    `${t}의 모든 것 — 장점부터 주의사항까지`,
    `왜 지금 ${t}일까? ${k} 트렌드 한눈에 보기`,
  ];
}

function stubOutline(input: BlogInput): string[] {
  const t = input.topic.trim() || "주제";
  return [
    `${t}란 무엇인가`,
    `${t}를 선택해야 하는 이유`,
    `핵심 특징과 장점`,
    `구매·이용 전 확인할 점`,
    `자주 묻는 질문(FAQ)`,
    `마무리 — 한 줄 요약`,
  ];
}

const toneOpener: Record<BlogTone, string> = {
  "~해요": "안녕하세요! 오늘은 편하게 이야기 나눠볼게요.",
  "~습니다": "본 글에서는 핵심을 중심으로 체계적으로 살펴봅니다.",
  "~한다": "지금부터 핵심을 간결하게 정리한다.",
  "~과거형": "직접 살펴본 내용을 정리해 보았다.",
};

function stubArticle(input: BlogInput, outline: string[]): string {
  const t = input.topic.trim() || "주제";
  const title = input.title?.trim() || stubTitles(input)[0];
  const keys = kw(input);
  const keyLine = keys.join(", ");

  const sections = outline
    .map((heading) => {
      return [
        `## ${heading}`,
        ``,
        `${t}와 관련해 '${heading}'에 대해 살펴보겠습니다. ${keyLine} 키워드를 중심으로 핵심만 짚어드릴게요.`,
        ``,
        `실제로 ${t}를 고민할 때 가장 중요한 것은 본인의 상황에 맞는 선택입니다. 막연한 정보보다, 직접 적용할 수 있는 기준을 잡는 것이 도움이 됩니다.`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    `# ${title}`,
    ``,
    `${toneOpener[input.tone]} 이번 글의 주제는 **${t}** 입니다.`,
    ``,
    sections,
    ``,
    `---`,
    ``,
    `> ✍️ ${input.writer ? `${input.writer} 작성 · ` : ""}본 콘텐츠는 샘플(데모) 생성 결과입니다. 실제 AI 연결 시 더 풍부한 원고가 생성됩니다.`,
  ].join("\n");
}
