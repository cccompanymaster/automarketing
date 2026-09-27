// Sub-blog content layer (server/build-time only — reads content/blog/*.md).
//
// One Markdown file per question. Its frontmatter is the single source for the
// rendered page AND its JSON-LD (Article + FAQPage), so visible text and
// structured data can't drift apart. `validatePost` is the publish gate; the
// vitest suite runs it over every post and the deploy workflow runs the tests
// before building, so a post that fails the gate never ships.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

export const BLOG_DIR = path.join(process.cwd(), "content", "blog");
export const BLOG_PATH = "/blog/";

export type PostType = "question" | "data" | "glossary" | "buildlog" | "comparison";
export type PostStatus = "draft" | "review" | "published" | "refresh-needed" | "merged";

export interface PostSource {
  name: string;
  url: string;
}

export interface PostFaq {
  q: string;
  a: string;
}

export interface PostMeta {
  title: string;
  slug: string;
  /** The search phrase this post answers, verbatim. */
  question: string;
  /** Direct answer — rendered as the first paragraph. */
  answer: string;
  description: string;
  type: PostType;
  datePublished: string;
  /** Change only when the content really changes. */
  dateModified: string;
  /** Reference date of the numbers in the body. */
  data_asof: string;
  author: string;
  /** Who fact-checked the numbers against the sources. */
  reviewedBy: string;
  sources: PostSource[];
  faq: PostFaq[];
  /** Slugs of related posts (side links). */
  related: string[];
  status: PostStatus;
  /** Change log lines shown under the post, newest first. */
  changelog: string[];
}

export interface Post extends PostMeta {
  /** Markdown body (after the direct answer). */
  body: string;
  html: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const asDate = (v: unknown): string => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? ""));

function toMeta(data: Record<string, unknown>, file: string): PostMeta {
  return {
    title: String(data.title ?? ""),
    slug: String(data.slug ?? path.basename(file, ".md")),
    question: String(data.question ?? ""),
    answer: String(data.answer ?? ""),
    description: String(data.description ?? ""),
    type: (data.type as PostType) ?? "question",
    datePublished: asDate(data.datePublished),
    dateModified: asDate(data.dateModified),
    data_asof: asDate(data.data_asof),
    author: String(data.author ?? ""),
    reviewedBy: String(data.reviewedBy ?? ""),
    sources: (data.sources as PostSource[]) ?? [],
    faq: (data.faq as PostFaq[]) ?? [],
    related: (data.related as string[]) ?? [],
    status: (data.status as PostStatus) ?? "draft",
    changelog: (data.changelog as string[]) ?? [],
  };
}

/**
 * Markdown → HTML. Korean copy uses "~" for ranges (2,400~3,400원), which GFM
 * would turn into strikethrough — escape it so it always renders literally.
 */
export function renderMarkdown(md: string): string {
  return marked.parse(md.replace(/~/g, "\\~"), { async: false }) as string;
}

/** Every post file, any status (for the gate). */
export function readAllPosts(dir = BLOG_DIR): Post[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, content } = matter(raw);
      const meta = toMeta(data, f);
      return { ...meta, body: content.trim(), html: renderMarkdown(content) };
    });
}

/** Published posts, newest first — what the site renders. */
export function getPublishedPosts(): Post[] {
  return readAllPosts()
    .filter((p) => p.status === "published" || p.status === "refresh-needed")
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

export function getPost(slug: string): Post | undefined {
  return getPublishedPosts().find((p) => p.slug === slug);
}

/** Internal links (site-relative) found in the Markdown body. */
export function internalLinks(body: string): string[] {
  return [...body.matchAll(/\]\((\/[^)\s#]*)(?:#[^)]*)?\)/g)].map((m) => m[1]);
}

/**
 * Publish gate (content.md 4-4). Returns problems; empty = may publish.
 * `knownPaths` lets the caller check that internal links resolve.
 */
export function validatePost(p: Post, opts: { knownPaths?: Set<string>; allSlugs?: Set<string> } = {}): string[] {
  const e: string[] = [];
  const len = (s: string) => [...s].length;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) e.push("slug: 영문 소문자·숫자·하이픈만 (날짜 없이)");
  if (!p.title || len(p.title) > 60) e.push("title: 1~60자");
  if (!p.question) e.push("question: 비어 있으면 발행 불가");
  if (!p.answer || len(p.answer) > 80) e.push("answer: 1~80자 직답");
  if (len(p.description) < 70 || len(p.description) > 160) e.push("description: 70~160자");
  for (const k of ["datePublished", "dateModified", "data_asof"] as const) {
    if (!DATE.test(p[k])) e.push(`${k}: YYYY-MM-DD`);
  }
  if (p.dateModified < p.datePublished) e.push("dateModified < datePublished");
  if (p.data_asof > p.dateModified) e.push("data_asof가 dateModified보다 늦음");
  if (!p.author) e.push("author: 저자 서명 필요");
  if (!p.reviewedBy) e.push("reviewedBy: 수치 검수자 필요 (AI 초안 정책)");
  if (p.sources.length === 0 || p.sources.some((s) => !s.name || !/^https:\/\//.test(s.url)))
    e.push("sources: 1개 이상, https URL");
  if (p.faq.length < 2 || p.faq.some((f) => !f.q || !f.a)) e.push("faq: 2개 이상");
  const links = internalLinks(p.body);
  if (!links.some((l) => l === "/blog/" || l.startsWith("/tools/"))) e.push("내부 링크: 상향(허브) 1개 필요");
  if (new Set(links).size < 3) e.push("내부 링크: 3개 이상 (허브 1 + 관련 2)");
  if (opts.knownPaths) {
    for (const l of links) {
      const norm = l.endsWith("/") ? l : `${l}/`;
      if (!opts.knownPaths.has(norm)) e.push(`끊긴 내부 링크: ${l}`);
    }
  }
  if (opts.allSlugs) for (const r of p.related) if (!opts.allSlugs.has(r)) e.push(`related 없는 글: ${r}`);
  if (!p.body.includes(p.data_asof)) e.push("본문에 data_asof(기준일) 표기 필요");
  if (/^#\s/m.test(p.body)) e.push("본문에 H1(#) 금지 — h1은 title");
  return e;
}
