// Page frame for every calculator: site nav, back-to-hub link, title,
// privacy note, the calculator itself, FAQ (native <details> — keyboard and
// screen-reader friendly) and the per-calculator comment board.

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { CalcComments } from "@/components/calc/CalcComments";
import { CALC_HUB_PATH, getCalc, CALC_CATEGORIES } from "@/lib/calc/registry";
import { OG_BASE, breadcrumbLd, faqLd } from "@/lib/seo";

export interface FaqItem {
  q: string;
  a: string;
}

export function calcMetadata(slug: string): Metadata {
  const c = getCalc(slug);
  const title = `${c.title} — 자영업자 무료 계산기`;
  return {
    title,
    description: c.summary,
    alternates: { canonical: c.path },
    openGraph: { ...OG_BASE, title, description: c.summary, url: c.path },
  };
}

export function CalcShell({
  slug,
  faq,
  children,
  wide,
}: {
  slug: string;
  faq: FaqItem[];
  children: React.ReactNode;
  /** Wider container for document builders (payslip / contract). */
  wide?: boolean;
}) {
  const c = getCalc(slug);
  const category = CALC_CATEGORIES.find((k) => k.key === c.category);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "무료 계산기", path: CALC_HUB_PATH },
            { name: c.title, path: c.path },
          ]),
          faqLd(faq),
        ]}
      />
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        <div className={`mx-auto px-4 pb-16 pt-6 sm:px-5 sm:pt-10 ${wide ? "max-w-6xl" : "max-w-5xl"}`}>
          <nav aria-label="이동 경로" className="print:hidden">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
              <li>
                <Link href={CALC_HUB_PATH} className="-my-2 inline-flex min-h-10 items-center font-semibold text-emerald-700 hover:text-emerald-900">
                  ← 계산기 홈
                </Link>
              </li>
              {category && (
                <li aria-hidden="true" className="text-slate-300">
                  /
                </li>
              )}
              {category && <li>{category.title}</li>}
            </ol>
          </nav>

          <header className="mt-3 print:hidden">
            <h1 className="flex items-center gap-2.5 pr-16 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl lg:pr-0">
              <span aria-hidden="true">{c.icon}</span>
              {c.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{c.summary}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
              🔒 입력값은 이 브라우저 안에서만 계산되고 서버에 저장되지 않아요.
            </p>
          </header>

          <div className="mt-6">{children}</div>

          {faq.length > 0 && (
            <section aria-labelledby="calc-faq" className="mt-10 print:hidden">
              <h2 id="calc-faq" className="text-lg font-bold text-slate-900">
                자주 묻는 질문
              </h2>
              <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
                {faq.map((f) => (
                  <details key={f.q} className="group">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span aria-hidden="true" className="shrink-0 text-slate-400 transition group-open:rotate-180">
                        ▾
                      </span>
                    </summary>
                    <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <div className="print:hidden">
            <CalcComments slug={slug} />
          </div>

          <p className="mt-8 text-center text-xs text-slate-400 print:hidden">
            계산 결과는 참고용이며 실제 정산·세금·법적 판단과 다를 수 있어요. ·{" "}
            <Link href="/privacy/" className="underline underline-offset-2 hover:text-slate-600">
              개인정보처리방침
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
