// Rich "광고비 환급" detail landing (our version of the reference design).
// Rendered by /services/refund. Uses the violet refund accent.

import Link from "next/link";
import { TrackedCta } from "@/components/TrackedCta";
import { FaqAccordion } from "@/components/FaqAccordion";
import { RefundMedia } from "@/components/RefundMedia";
import { REFUND } from "@/lib/refund";

export function RefundLanding() {
  return (
    <main className="flex-1">
      {/* Hero card */}
      <section className="bg-gradient-to-b from-violet-50 to-white">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-800">
            ← 전체 서비스
          </Link>
          <div className="mt-6 rounded-3xl bg-violet-600 px-6 py-10 sm:px-10 sm:py-12">
            <div className="flex items-start gap-4">
              <span className="text-4xl" aria-hidden="true">💸</span>
              <div>
                <h1 className="text-2xl font-extrabold text-white sm:text-4xl">광고비 환급</h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-violet-50 sm:text-base">
                  네이버·카카오·토스·당근·구글·메타·틱톡·DV360 등 직접 운영 중인 광고비의 일부를 {REFUND.payoutDay} 환급해 드립니다. (환급율 확인 중)
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <TrackedCta
                    href="/start?service=refund"
                    authedHref="/mypage"
                    slug="refund"
                    className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                  >
                    상담받기
                  </TrackedCta>
                  <Link
                    href="/mypage"
                    className="rounded-xl bg-violet-500/40 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 transition hover:bg-violet-500/60"
                  >
                    광고 관리
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5">
        {/* Intro */}
        <section className="pt-12 text-center">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            대행사 없이 직접 광고를 운영 중이신가요?
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            직접 운영 중인 광고비의 일부를 매월 환급받으세요.
          </p>
        </section>

        {/* 환급 가능 매체 (로고 줄) */}
        <RefundMedia />

        {/* Pre-application checklist */}
        <section className="py-6">
          <div className="rounded-3xl bg-violet-600 p-6 sm:p-10">
            <h2 className="text-center text-xl font-bold text-white sm:text-2xl">
              Q. 환급 신청 전 반드시 확인해 주세요!
            </h2>
            <div className="mt-8 space-y-4">
              {REFUND.checks.map((check) => (
                <div key={check.no} className="rounded-2xl bg-white p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-sm font-bold text-violet-700">
                      {check.no}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{check.title}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {check.items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-0.5 text-violet-500" aria-hidden="true">✓</span>
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-violet-500/40 px-5 py-4 text-center text-sm font-semibold text-white ring-1 ring-white/30">
              직접 운영 중인 광고, 지금 환급 받으세요!
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-12">
          <p className="text-center text-sm font-semibold text-slate-500">
            한 번 신청해두면 {REFUND.payoutDay}에 환급액이 지급됩니다.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {REFUND.steps.map((step) => (
              <div
                key={step.no}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <span className="text-xs font-bold text-violet-600">STEP {step.no}</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12">
          <h2 className="text-center text-xl font-bold text-slate-900 sm:text-2xl">
            자주 묻는 질문
          </h2>
          <div className="mt-8">
            <FaqAccordion items={REFUND.faqs} />
          </div>
        </section>

        {/* Closing CTA */}
        <section className="pb-16">
          <div className="rounded-3xl bg-violet-600 px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              광고비 환급, 지금 시작하세요
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-violet-50 sm:text-base">
              기존 광고는 그대로 두고 계정만 연결하면 매월 환급액이 지급됩니다.
            </p>
            <TrackedCta
              href="/start?service=refund"
              authedHref="/mypage"
              slug="refund"
              className="mt-7 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              광고비 환급 확인하기
            </TrackedCta>
          </div>
        </section>
      </div>
    </main>
  );
}
