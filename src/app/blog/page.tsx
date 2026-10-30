// Blog hub: direct intro + every published post with its direct answer and
// data date, so the hub itself is a useful, citable page — not a bare list.

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { BLOG_PATH, getPublishedPosts } from "@/lib/blog";
import { OG_BASE, ORG_ID, absoluteUrl, breadcrumbLd } from "@/lib/seo";

const TITLE = "사장님 블로그 — 숫자로 답하는 자영업 질문";
const DESCRIPTION =
  "주휴수당 조건, 4대보험 요율, 배달앱 수수료처럼 사장님들이 자주 찾는 질문에 한 문장 결론과 기준일이 적힌 표로 답해요. 모든 수치는 출처와 확인일을 함께 적고, 바로 계산할 수 있는 계산기로 연결돼요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: BLOG_PATH, types: { "application/rss+xml": "/feed.xml" } },
  openGraph: { ...OG_BASE, title: TITLE, description: DESCRIPTION, url: BLOG_PATH },
};


export default function BlogHub() {
  const posts = getPublishedPosts();
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "사장님 블로그", path: BLOG_PATH },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: TITLE,
            url: absoluteUrl(BLOG_PATH),
            publisher: { "@id": ORG_ID },
            blogPost: posts.map((p) => ({ "@id": `${absoluteUrl(`${BLOG_PATH}${p.slug}/`)}#post` })),
          },
        ]}
      />
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:pt-12">
          <h1 className="pr-16 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:pr-0">사장님 블로그</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
            사장님들이 검색하는 질문 하나에 글 하나로 답해요. 글마다 첫 줄에 결론, 그 아래 기준일이 적힌 표와 출처를 두고, 바로 계산해 볼 수
            있는{" "}
            <Link href="/tools/" className="font-semibold text-emerald-700 underline underline-offset-2">
              무료 계산기
            </Link>
            와{" "}
            <Link href="/tools/rates/" className="font-semibold text-emerald-700 underline underline-offset-2">
              2026년 기준값
            </Link>
            으로 연결해요.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.slug}>
                <PostCard post={p} href={`${BLOG_PATH}${p.slug}/`} />
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-slate-400">
            새 글 알림:{" "}
            <a href="/feed.xml" className="underline underline-offset-2">
              RSS 피드
            </a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
