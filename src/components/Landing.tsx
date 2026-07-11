// Landing page composition: hero + service cards + success stories.
// Header/footer are provided by the page layout.

import { LANDING_CARDS } from "@/lib/products";
import { SUCCESS_STORIES } from "@/lib/successStories";
import { TrackedCta } from "@/components/TrackedCta";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { Channels } from "@/components/Channels";
import { ServicesGrid } from "@/components/ServicesGrid";
import { SuccessStory } from "@/components/SuccessStory";
import { Marquee } from "@/components/Marquee";
import { ScamNoticePopup } from "@/components/ScamNoticePopup";

export function Landing() {
  return (
    <main className="flex-1">
      {/* One-time scam / impersonation notice popup */}
      <ScamNoticePopup />

      {/* Intro loading splash -> animated hero */}
      <Hero />

      {/* Service cards */}
      <section id="services" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            혼자 하는 마케팅, 어렵지 않습니다
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            우리 매장에 필요한 것부터 골라 바로 시작할 수 있습니다.
          </p>
        </div>

        <ServicesGrid cards={LANDING_CARDS} />
      </section>

      {/* Trust stats band */}
      <Stats />

      {/* Supported channels */}
      <Channels />

      {/* Success stories — auto-scrolling banner */}
      <section id="reviews" className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            마케팅방주와 함께한 고객 후기
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            업종·기간·수치로 살펴보는 기대 효과 예시입니다.
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
