// Landing page composition: hero + 4 service cards + success stories.
// Header/footer are provided by the page layout.

import Link from "next/link";
import { PRODUCT_LIST } from "@/lib/products";
import { SUCCESS_STORIES } from "@/lib/successStories";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { Channels } from "@/components/Channels";
import { ServiceCard } from "@/components/ServiceCard";
import { SuccessStory } from "@/components/SuccessStory";

export function Landing() {
  return (
    <main className="flex-1">
      {/* Intro loading splash -> animated hero */}
      <Hero />

      {/* Service cards */}
      <section id="services" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            무엇을 해결하고 싶으신가요?
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            우리 매장에 필요한 것부터 골라 바로 시작할 수 있습니다.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_LIST.map((product) => (
            <ServiceCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      {/* Trust stats band */}
      <Stats />

      {/* Supported channels */}
      <Channels />

      {/* Success stories */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              마케팅방주와 함께한 고객 후기
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              업종과 기간, 그리고 수치로 확인하는 실제 변화입니다.
            </p>
          </div>

          {/* 2x2 on md+ so the 4 stories never leave an orphan card. */}
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {SUCCESS_STORIES.map((story) => (
              <SuccessStory key={story.industry} story={story} />
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="rounded-3xl bg-emerald-600 px-6 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            지금 바로 우리 매장 마케팅을 시작하세요
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-emerald-50 sm:text-base">
            가입 전에 진행 방식과 예상 비용, 환급 조건을 먼저 확인할 수 있습니다.
          </p>
          <Link
            href="/start"
            className="mt-7 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>
    </main>
  );
}
