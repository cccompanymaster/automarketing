// Rich "언론홍보" (press release distribution) detail landing.
// Rendered by /services/press. Uses the indigo press accent.

import Link from "next/link";
import { TrackedCta } from "@/components/TrackedCta";
import { FaqAccordion } from "@/components/FaqAccordion";
import { PressRates } from "@/components/PressRates";
import {
  PRESS_BASE_FROM,
  PRESS_FAQS,
  PRESS_FEATURES,
  PRESS_OPTIONS,
  PRESS_STEPS,
  PRESS_WARNINGS,
} from "@/lib/press";

const krw = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function PressLanding() {
  return (
    <main className="flex-1">
      {/* Hero card */}
      <section className="bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-800">
            ← 전체 서비스
          </Link>
          <div className="mt-6 rounded-3xl bg-indigo-600 px-6 py-10 sm:px-10 sm:py-12">
            <div className="flex items-start gap-4">
              <span className="text-4xl" aria-hidden="true">📰</span>
              <div>
                <h1 className="text-2xl font-extrabold text-white sm:text-4xl">언론보도 셀프 송출</h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-indigo-50 sm:text-base">
                  원하는 매체를 직접 골라 보도자료를 송출하세요. 1건 {krw(PRESS_BASE_FROM)}부터,
                  평균 2~3시간 내 송출됩니다. (VAT 별도)
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {PRESS_FEATURES.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-indigo-500/40 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#press-rates"
                    className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                  >
                    매체·단가 보기
                  </a>
                  <TrackedCta
                    href="/start?service=press"
                    authedHref="/pricing#press"
                    slug="press"
                    className="rounded-xl bg-indigo-500/40 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 transition hover:bg-indigo-500/60"
                    >
                    신청하기
                  </TrackedCta>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5">
        {/* Category rates + media accordion */}
        <PressRates />

        {/* Options */}
        <section className="py-12">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">추가 옵션</h2>
          <p className="mt-2 text-sm text-slate-600">원고나 이미지가 없어도 신청할 수 있습니다.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PRESS_OPTIONS.map((o) => (
              <div key={o.name} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-sm font-extrabold text-indigo-700">
                  +{krw(o.addKrw)}
                </span>
                <h3 className="mt-3 text-sm font-bold text-slate-900">{o.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{o.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="pb-12">
          <p className="text-center text-sm font-semibold text-slate-500">
            매체를 고르면 평균 2~3시간 내 송출됩니다.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PRESS_STEPS.map((step) => (
              <div key={step.no} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <span className="text-xs font-bold text-indigo-600">STEP {step.no}</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Warnings — must show before ordering */}
        <section className="pb-12">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <h2 className="text-base font-bold text-amber-900">신청 전 꼭 확인해 주세요</h2>
            <ul className="mt-4 space-y-2.5">
              {PRESS_WARNINGS.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm leading-relaxed text-amber-900/90">
                  <span className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true">!</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-12">
          <h2 className="text-center text-xl font-bold text-slate-900 sm:text-2xl">자주 묻는 질문</h2>
          <div className="mt-8">
            <FaqAccordion items={PRESS_FAQS} />
          </div>
        </section>

        {/* Closing CTA */}
        <section className="pb-16">
          <div className="rounded-3xl bg-indigo-600 px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              언론보도, 원하는 매체로 직접 송출하세요
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-indigo-50 sm:text-base">
              가입비 무료 · 1건부터 신청 · 평균 2~3시간 내 송출.
            </p>
            <a
              href="#press-rates"
              className="mt-7 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              전체 언론사·단가 보기
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
