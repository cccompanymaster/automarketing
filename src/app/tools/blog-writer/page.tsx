"use client";

// AI 블로그 원고 작성 도구. Members get the tool; everyone else (including
// crawlers, which see the pre-hydration HTML) gets a public intro with the
// price and a signup CTA — a login wall would leave this page empty in search.

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { BlogWriter } from "@/components/BlogWriter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const STEPS = [
  { t: "주제·키워드 입력", d: "업종, 알리고 싶은 메뉴·서비스, 넣고 싶은 키워드를 적어요." },
  { t: "제목·목차 무료 생성", d: "검색에 맞춘 제목 후보와 목차를 먼저 받아 보고 고를 수 있어요." },
  { t: "완성 원고 받기", d: "본문까지 완성된 원고를 받아 블로그에 바로 올려요. 1건 1,000캐시." },
];

function Intro() {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <p className="text-sm font-bold text-emerald-700">AI 원고 작성</p>
        <h1 className="mt-2 pr-16 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:pr-0">
          AI 블로그 원고 작성 — 1건 1,000원
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-700">
          주제와 키워드만 입력하면 제목·목차·본문까지 블로그 원고를 자동으로 써 드려요. 제목과 목차는 무료로 먼저 확인하고,
          완성 원고는 1건에 1,000캐시(1,000원)입니다.
        </p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs font-bold text-emerald-700">STEP {i + 1}</p>
              <h2 className="mt-1 text-base font-bold text-slate-900">{s.t}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/start?service=blogwrite"
            className="inline-flex min-h-12 items-center rounded-xl bg-emerald-600 px-7 text-base font-bold text-white transition hover:bg-emerald-700"
          >
            무료 가입하고 원고 쓰기 →
          </Link>
          <Link
            href="/services/blogwrite/"
            className="inline-flex min-h-12 items-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            자세히 보기
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function BlogWriterPage() {
  const { isAuthenticated, hydrated } = useAuth();
  return (
    <>
      <SiteHeader />
      {hydrated && isAuthenticated ? <BlogWriter /> : <Intro />}
      <SiteFooter />
    </>
  );
}
