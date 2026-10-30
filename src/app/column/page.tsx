// 마케팅 칼럼 게시판: questions owners ask before buying marketing (비용,
// 용어, 고르는 법), each answered in one post with prices dated and sourced.

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { COLUMN, getPublishedPosts } from "@/lib/blog";
import { OG_BASE, ORG_ID, absoluteUrl, breadcrumbLd } from "@/lib/seo";

const TITLE = "마케팅 칼럼 — 사장님이 묻는 마케팅 비용과 용어";
const DESCRIPTION =
  "플레이스 상위노출 비용, 준최적 블로그 뜻, 맘카페 홍보 방법처럼 마케팅을 맡기기 전에 궁금한 질문에 한 문장 결론과 기준일이 적힌 단가표로 답해요. 대행사 견적을 비교할 때 확인할 점도 함께 정리했어요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: COLUMN.path, types: { "application/rss+xml": "/feed.xml" } },
  openGraph: { ...OG_BASE, title: TITLE, description: DESCRIPTION, url: COLUMN.path },
};

const fmt = (d: string) => d.replace(/-/g, ".");

export default function ColumnHub() {
  const posts = getPublishedPosts(COLUMN);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: COLUMN.name, path: COLUMN.path },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: TITLE,
            url: absoluteUrl(COLUMN.path),
            publisher: { "@id": ORG_ID },
            blogPost: posts.map((p) => ({ "@id": `${absoluteUrl(`${COLUMN.path}${p.slug}/`)}#post` })),
          },
        ]}
      />
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-5 pb-16 pt-8 sm:pt-12">
          <p className="text-sm font-bold tracking-widest text-emerald-700">게시판</p>
          <h1 className="mt-1 pr-16 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:pr-0">마케팅 칼럼</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            마케팅을 맡기기 전에 궁금한 비용·용어·고르는 법을 질문 하나에 글 하나로 정리해요. 단가는 기준일과 함께 적고, 바로 주문할 수 있는{" "}
            <Link href="/#services" className="font-semibold text-emerald-700 underline underline-offset-2">
              상품 페이지
            </Link>
            로 연결해요. 장사 숫자는{" "}
            <Link href="/blog/" className="font-semibold text-emerald-700 underline underline-offset-2">
              사장님 블로그
            </Link>
            에 있어요.
          </p>
          <ul className="mt-8 space-y-3">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`${COLUMN.path}${p.slug}/`}
                  className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:ring-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <h2 className="text-lg font-bold text-slate-900">{p.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{p.answer}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    <time dateTime={p.datePublished}>{fmt(p.datePublished)}</time> · 단가 기준일 {fmt(p.data_asof)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
