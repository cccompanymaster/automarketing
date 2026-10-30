// RSS 2.0 feed of published blog posts and 마케팅 칼럼 — input for feed readers, crawlers and
// the IndexNow ping. Rendered to out/feed.xml at build time (static export).

import { BLOG, COLUMN, getPublishedPosts } from "@/lib/blog";
import { COMPANY } from "@/lib/company";

export const dynamic = "force-static";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://selfmarketing.example").replace(/\/$/, "");
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rfc822 = (d: string) => new Date(`${d}T00:00:00+09:00`).toUTCString();

export function GET() {
  const posts = [BLOG, COLUMN]
    .flatMap((c) => getPublishedPosts(c).map((p) => ({ ...p, base: c.path })))
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished));
  const items = posts
    .map((p) => {
      const url = `${SITE}${p.base}${p.slug}/`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(p.datePublished)}</pubDate>
      <description>${esc(`${p.answer} ${p.description}`)}</description>
    </item>`;
    })
    .join("\n");
  const last = posts.map((p) => p.dateModified).sort().pop();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${COMPANY.serviceName} 사장님 블로그`)}</title>
    <link>${SITE}${BLOG.path}</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>숫자로 답하는 자영업 질문과 마케팅 칼럼 — 주휴수당, 4대보험, 배달앱 수수료, 플레이스·블로그 마케팅 비용 등</description>
    <language>ko</language>
${last ? `    <lastBuildDate>${rfc822(last)}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
