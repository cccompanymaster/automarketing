// Landing page — built around one idea: the price list comes first.
// hero (copy + price board) → compare (agency worries → how it works here) →
// journey (find → compare → trust, real sequence) → full service bento +
// channels → FAQ → free calculators → closing (3 steps + two doors, the only
// dark band).
// Header/footer are provided by the page layout.

import Link from "next/link";
import { LANDING_CARDS } from "@/lib/products";
import { CALCULATORS } from "@/lib/calc/registry";
import { Hero } from "@/components/Hero";
import { Channels } from "@/components/Channels";
import { ServicesGrid } from "@/components/ServicesGrid";
import { StoryIntro, ClosingSection } from "@/components/StorySections";
import { ScamNoticePopup } from "@/components/ScamNoticePopup";
import { FaqAccordion } from "@/components/FaqAccordion";
import { SITE_FAQS } from "@/lib/faq";

const H2 = "text-[clamp(1.75rem,3.6vw,2.6rem)] font-extrabold leading-tight tracking-[-0.035em] text-forest-900";

const FEATURED_CALCULATORS = ["delivery", "delivery-price", "hourly-wage", "payslip", "labor-contract", "breakeven"];

export function Landing() {
  return (
    <main className="flex-1">
      {/* One-time scam / impersonation notice popup */}
      <ScamNoticePopup />

      <Hero />

      <StoryIntro />

      {/* Full catalog for visitors who want to browse everything */}
      <section id="services" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-20 sm:py-28">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className={H2}>필요한 것만 골라 담으세요</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              상품마다 진행 절차와 시작 가격을 미리 확인할 수 있어요.
            </p>
          </div>
          <Link
            href="/pricing/"
            className="inline-flex min-h-11 shrink-0 items-center text-[15px] font-bold text-emerald-800 underline decoration-emerald-800/30 underline-offset-4 transition-colors hover:decoration-emerald-800"
          >
            전체 가격표에서 비교하기
          </Link>
        </div>

        <ServicesGrid cards={LANDING_CARDS} />

        <Channels />
      </section>

      {/* FAQ — self-contained Q&A, mirrored as FAQPage structured data so
          search snippets and answer engines can quote a single item. */}
      <section id="faq" className="scroll-mt-6 border-t border-mint-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <div>
            <h2 className={H2}>
              자주 묻는 질문
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              가격·진행 방식·계정 보안까지, 가장 많이 받는 질문만 모았어요.
            </p>
            <Link
              href="/faq/"
              className="mt-5 inline-flex min-h-11 items-center text-[15px] font-bold text-emerald-800 underline decoration-emerald-800/30 underline-offset-4 transition-colors hover:decoration-emerald-800"
            >
              주문·캐시·환불 질문까지 전체 보기
            </Link>
          </div>
          <div className="[&>div]:max-w-none">
            <FaqAccordion items={SITE_FAQS} />
          </div>
        </div>
      </section>

      {/* Free calculators — no signup, a reason to come back */}
      <section id="calculators" className="mx-auto max-w-6xl scroll-mt-6 px-5 pb-20 sm:pb-28">
        <div className="rounded-[1.75rem] border border-mint-200 bg-mint-50 px-6 py-9 sm:px-10 sm:py-11">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-forest-900 sm:text-3xl">
                가입 없이 쓰는 사장님 계산기 {CALCULATORS.length}종
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600 sm:text-base">
                배달앱 수수료부터 주휴수당·급여명세서·손익분기점까지, 매일 고민하는 숫자를 바로 계산해 보세요.
              </p>
            </div>
            <Link
              href="/tools/"
              className="inline-flex min-h-11 shrink-0 items-center text-[15px] font-bold text-emerald-800 underline decoration-emerald-800/30 underline-offset-4 transition-colors hover:decoration-emerald-800"
            >
              전체 계산기 보기
            </Link>
          </div>
          <ul className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_CALCULATORS.flatMap((slug) => {
              const c = CALCULATORS.find((x) => x.slug === slug);
              return c ? [c] : [];
            }).map((c) => (
              <li key={c.slug}>
                <Link
                  href={c.path}
                  className="flex min-h-14 items-center gap-3 rounded-2xl border border-mint-200 bg-white px-4 text-[15px] font-semibold text-forest-900 transition-colors hover:border-emerald-600"
                >
                  <span aria-hidden="true" className="text-lg">
                    {c.icon}
                  </span>
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ClosingSection />
    </main>
  );
}
