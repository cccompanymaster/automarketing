// Landing page — storytelling composition (noahgroup-style narrative):
// hero → empathy (owner's pains) → bridge (why we exist) → journey chapters
// (get found → get sales → build trust & save) → proof numbers → full service
// grid → channels → reviews → 3-step process → closing CTA.
// Header/footer are provided by the page layout.

import Link from "next/link";
import { LANDING_CARDS } from "@/lib/products";
import { CALCULATORS } from "@/lib/calc/registry";
import { SUCCESS_STORIES } from "@/lib/successStories";
import { TrackedCta } from "@/components/TrackedCta";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { Channels } from "@/components/Channels";
import { ServicesGrid } from "@/components/ServicesGrid";
import { SuccessStory } from "@/components/SuccessStory";
import { Marquee } from "@/components/Marquee";
import { Reveal } from "@/components/Reveal";
import { StoryIntro, ProcessSection } from "@/components/StorySections";
import { ScamNoticePopup } from "@/components/ScamNoticePopup";
import { FaqAccordion } from "@/components/FaqAccordion";
import { SITE_FAQS } from "@/lib/faq";

export function Landing() {
  return (
    <main className="flex-1">
      {/* One-time scam / impersonation notice popup */}
      <ScamNoticePopup />

      {/* Chapter 0 — intro loading splash -> animated hero */}
      <Hero />

      {/* Story: empathy → bridge → journey chapters (01 발견 → 02 판매 → 03 신뢰·절감) */}
      <StoryIntro />

      {/* Proof — numbers count up on scroll */}
      <Stats />

      {/* Full catalog for visitors who want to browse everything */}
      <section id="services" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-widest text-emerald-700">전체 서비스</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            필요한 것만 골라 담으세요
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            상품마다 절차와 예상 비용을 미리 확인할 수 있어요. 전체 단가표는 가입하면 바로 열려요.
          </p>
        </Reveal>

        <ServicesGrid cards={LANDING_CARDS} />
      </section>

      {/* Free calculators — no signup, a reason to come back */}
      <section id="calculators" className="mx-auto max-w-6xl px-5 pb-16 sm:pb-20">
        <div className="rounded-3xl bg-slate-900 px-6 py-8 sm:px-10 sm:py-10">
          <p className="text-sm font-bold tracking-widest text-emerald-400">가입 없이 무료</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">사장님 계산기 {CALCULATORS.length}종</h2>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">
            배달앱 수수료부터 주휴수당·급여명세서·손익분기점까지, 매일 고민하는 숫자를 바로 계산해 보세요.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {["delivery", "delivery-price", "hourly-wage", "payslip", "labor-contract", "breakeven"].map((slug) => {
              const c = CALCULATORS.find((x) => x.slug === slug)!;
              return (
                <li key={slug}>
                  <Link
                    href={c.path}
                    className="flex min-h-12 items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <span aria-hidden="true">{c.icon}</span>
                    {c.title}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/tools/"
            className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-emerald-500 px-6 text-sm font-bold text-white transition hover:bg-emerald-400"
          >
            전체 계산기 보기 →
          </Link>
        </div>
      </section>

      {/* Supported channels */}
      <Channels />

      {/* Success stories — auto-scrolling banner */}
      <section id="reviews" className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            마케팅방주와 함께한 고객 후기
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            업종별로 어떤 변화를 기대할 수 있는지, 예시로 보여드릴게요.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            * 정식 오픈 준비 중의 예시 사례이며, 검증된 실제 사례로 순차 교체됩니다.
          </p>
        </div>

        <Marquee durationSec={24} className="mt-10 [--marquee-gap:1.25rem]">
          {SUCCESS_STORIES.map((story) => (
            <div key={story.industry} className="flex w-[300px] sm:w-[340px]">
              <SuccessStory story={story} />
            </div>
          ))}
        </Marquee>
      </section>

      {/* FAQ — self-contained Q&A, mirrored as FAQPage structured data so
          search snippets and answer engines can quote a single item. */}
      <section id="faq" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-widest text-emerald-700">자주 묻는 질문</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            궁금한 건 여기서 먼저 확인하세요
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            가격·진행 방식·계정 보안까지, 가장 많이 받는 질문만 모았어요.
          </p>
        </Reveal>
        <div className="mt-10">
          <FaqAccordion items={SITE_FAQS} />
        </div>
      </section>

      {/* How it starts — 3 steps, 3 minutes */}
      <ProcessSection />

      {/* Closing CTA — board the ship into the operating screen */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="impact rounded-hero px-6 py-14 text-center sm:px-12 sm:py-20">
          <h2 className="text-2xl font-bold text-white sm:text-4xl">
            이제, 마케팅방주에 승선할 시간이에요
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-slate-300 sm:text-base">
            가입하면 바로 내 운영 화면에서 진단·주문·원고 작성까지 시작할 수 있어요.
          </p>
          <TrackedCta
            href="/start"
            authedHref="/mypage"
            className="mt-9 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-10 py-5 text-lg font-extrabold text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-14 sm:py-6 sm:text-xl"
          >
            🚢 마케팅방주 승선하기!
          </TrackedCta>
        </div>
      </section>
    </main>
  );
}
