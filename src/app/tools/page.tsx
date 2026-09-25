import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CALCULATORS, CALC_CATEGORIES, CALC_HUB_PATH } from "@/lib/calc/registry";
import { OG_BASE } from "@/lib/seo";

const TITLE = "자영업자 무료 계산기 26종";
const DESCRIPTION =
  "배달앱 수수료, 판매가 역산, 4대보험·주휴수당, 급여명세서·근로계약서, 손익분기점, 임대료, 대출 이자까지 — 사장님에게 필요한 계산을 무료로.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CALC_HUB_PATH },
  openGraph: { ...OG_BASE, title: TITLE, description: DESCRIPTION, url: CALC_HUB_PATH },
};

export default function CalculatorHub() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-5 sm:pt-12">
          <header>
            <p className="text-sm font-bold text-emerald-700">회원가입 없이 무료</p>
            <h1 className="mt-1 pr-16 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:pr-0">{TITLE}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{DESCRIPTION}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
              🔒 입력한 숫자와 직원 정보는 서버로 보내지 않고 이 브라우저에서만 계산해요.
            </p>
          </header>

          <nav aria-label="계산기 분류" className="mt-6 flex flex-wrap gap-2">
            {CALC_CATEGORIES.map((cat) => (
              <a
                key={cat.key}
                href={`#${cat.key}`}
                className="min-h-10 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:text-emerald-800 hover:ring-emerald-300"
              >
                {cat.title}
              </a>
            ))}
          </nav>

          {CALC_CATEGORIES.map((cat) => (
            <section key={cat.key} id={cat.key} aria-labelledby={`h-${cat.key}`} className="mt-10 scroll-mt-20">
              <h2 id={`h-${cat.key}`} className="text-xl font-bold text-slate-900">
                {cat.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{cat.description}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CALCULATORS.filter((c) => c.category === cat.key).map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={c.path}
                      className="flex h-full items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                        {c.icon}
                      </span>
                      <span>
                        <span className="block text-[15px] font-bold text-slate-900">{c.title}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-500">{c.summary}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
