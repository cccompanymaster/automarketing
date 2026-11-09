// Landing hero. Leads with what an agency can't show up front: the price
// list. Copy on the left, the price board (real catalog prices) on the right.
// Server-rendered and static so the headline is the first paint (no intro
// splash, no looping decoration); the board's rows settle in once (CSS).

import Link from "next/link";
import { CALCULATORS } from "@/lib/calc/registry";
import { TrackedCta } from "@/components/TrackedCta";
import { PriceBoard } from "@/components/PriceBoard";

// Facts a visitor can check on the site itself (no usage/result numbers).
const PROMISES: { label: string; href: string }[] = [
  { label: "가입비·약정 없음", href: "/faq/#order" },
  { label: "작업 시작 전 취소하면 전액 재적립", href: "/terms/" },
  { label: `가입 없이 쓰는 계산기 ${CALCULATORS.length}종`, href: "/tools/" },
];

function Check() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-600">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-mint-50)_0%,#fff_78%)]">
      <div className="mx-auto grid max-w-6xl items-center gap-x-14 gap-y-16 px-5 pb-20 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pb-28 lg:pt-24">
        <div className="min-w-0">
          <h1 className="text-[clamp(2.35rem,5.6vw,4.1rem)] font-black leading-[1.1] tracking-[-0.045em] text-forest-900">
            대행사 없이,
            <br />
            가격표 보고 고르는
            <br />
            우리 가게 마케팅
          </h1>
          <p className="mt-6 max-w-[30rem] text-[17px] leading-relaxed text-slate-600 sm:text-lg">
            플레이스 상위노출부터 블로그·쇼핑·인스타까지, 상품마다 가격이 다 나와 있어요. 견적 상담을 기다릴 필요
            없이 필요한 것만 골라 바로 주문하세요.
          </p>

          <div className="mt-9 flex max-w-md flex-col gap-3 sm:flex-row">
            <TrackedCta
              href="/start"
              authedHref="/mypage"
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-emerald-700 px-7 text-[17px] font-extrabold text-white shadow-[0_12px_24px_-10px_rgba(4,120,87,0.7)] transition-colors hover:bg-emerald-800 focus-visible:outline-offset-4"
            >
              무료로 시작하기
            </TrackedCta>
            <TrackedCta
              href="/pricing/"
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border-2 border-forest-900/15 bg-white px-7 text-[17px] font-bold text-forest-900 transition-colors hover:border-forest-900/40"
            >
              가입 없이 가격표 보기
            </TrackedCta>
          </div>

          <ul className="mt-8 flex flex-col gap-2.5 text-[15px] text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {PROMISES.map((p) => (
              <li key={p.label}>
                <Link href={p.href} className="inline-flex items-center gap-2 underline-offset-4 hover:text-forest-900 hover:underline">
                  <Check />
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 lg:pl-2">
          <PriceBoard />
        </div>
      </div>
    </section>
  );
}
