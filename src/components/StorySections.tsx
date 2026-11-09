// Story sections for the landing page:
// 1) Compare — what owners hear from agencies → how it works here (each
//    answer is a feature that exists today, linked to where to check it).
// 2) Journey — the order a customer meets a store (find → compare → trust),
//    a real sequence, so the steps are numbered. Visuals are outcome mocks
//    (no numeric claims).
// 3) Closing — the only dark band: 3 steps to start + the two doors.

import Link from "next/link";
import { TrackedCta } from "@/components/TrackedCta";
import { ResultMock } from "@/components/ResultMock";
import { PRICING } from "@/lib/pricing";
import { storeProducts } from "@/lib/store";

const storeCount = storeProducts(PRICING).length;

// --- 1) Compare --------------------------------------------------------------

const PAINS: { quote: string; who: string; answer: string; link: { label: string; href: string } }[] = [
  {
    quote: "견적을 받을 때마다 가격이 달라서 불안해요.",
    who: "온라인 셀러",
    answer: `상품 ${storeCount}종의 단가와 최소 주문금액을 가입 전에도 공개해요.`,
    link: { label: "가격표 보기", href: "/pricing/" },
  },
  {
    quote: "대행사에 맡겼는데, 뭘 해줬는지 모르겠어요.",
    who: "카페 사장님",
    answer: "주문마다 진행 상황과 결과물을 마이페이지에서 직접 확인하고 승인해요.",
    link: { label: "진행 방식 보기", href: "/faq/" },
  },
  {
    quote: "광고비는 매달 나가는데 손님은 그대로예요.",
    who: "음식점 사장님",
    answer: "월 고정비 없이 필요한 만큼만 주문하고, 네이버·카카오에 쓴 광고비 일부는 매월 환급받아요.",
    link: { label: "광고비 환급 보기", href: "/services/refund" },
  },
  {
    quote: "플레이스, 블로그, 인스타… 뭐부터 해야 하죠?",
    who: "네일샵 원장님",
    answer: "무료 상담에서 우리 매장에 맞는 순서를 같이 정해 드려요.",
    link: { label: "무료 상담 받기", href: "/services/consulting" },
  },
];

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M4 12h15m-5-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CompareSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <div className="max-w-2xl">
        <h2 className="text-[clamp(1.75rem,3.6vw,2.6rem)] font-extrabold leading-tight tracking-[-0.035em] text-forest-900">
          대행사에 맡기면 흔히 생기는 고민,
          <br />
          여기서는 이렇게 풀어요
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          장사만 해도 하루가 모자라죠. 사장님들이 가장 많이 털어놓는 이야기부터 정리했어요.
        </p>
      </div>

      <ul className="mt-12 border-t border-mint-200">
        {PAINS.map((p) => (
          <li
            key={p.quote}
            className="grid gap-4 border-b border-mint-200 py-7 md:grid-cols-[minmax(0,24rem)_2.5rem_minmax(0,1fr)] lg:gap-10 md:items-center md:gap-6 md:py-8"
          >
            <figure className="min-w-0">
              <blockquote className="inline-block rounded-2xl rounded-bl-md bg-slate-100 px-5 py-3.5 text-[15px] font-medium leading-relaxed text-slate-600 sm:text-base">
                “{p.quote}”
              </blockquote>
              <figcaption className="mt-2 pl-1 text-sm text-slate-500">{p.who}</figcaption>
            </figure>
            <ArrowRight className="hidden h-6 w-6 text-emerald-600 md:block" />
            <div className="min-w-0">
              <p className="text-lg font-bold leading-snug text-forest-900 sm:text-xl">{p.answer}</p>
              <Link
                href={p.link.href}
                className="mt-2.5 inline-flex min-h-11 items-center text-[15px] font-semibold text-emerald-800 underline decoration-emerald-800/30 underline-offset-4 transition-colors hover:decoration-emerald-800"
              >
                {p.link.label}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- 2) Journey --------------------------------------------------------------

interface Stage {
  moment: string;
  title: string;
  desc: string;
  mock: { groupKey: string; productId: string };
  links: { label: string; href: string }[];
}

const STAGES: Stage[] = [
  {
    moment: "찾을 때",
    title: "지도 검색에서 우리 가게부터 보이게",
    desc: "‘근처 맛집’을 검색한 손님이 가장 먼저 보는 네이버 플레이스와 카카오맵, 그 위쪽에 올려요.",
    mock: { groupKey: "place", productId: "place" },
    links: [
      { label: "플레이스·지도 상위노출", href: "/services/place-map" },
      { label: "카카오맵 평판 굳히기", href: "/services/place-map#kakaomap" },
      { label: "당근 단골 만들기", href: "/services/daangn" },
    ],
  },
  {
    moment: "비교할 때",
    title: "검색 첫 페이지에서 고르게",
    desc: "쇼핑 상위 노출, 블로그 후기, SNS 반응까지. 살까 말까 망설이는 순간에 우리 상품이 보이게 해요.",
    mock: { groupKey: "commerce", productId: "shopping" },
    links: [
      { label: "쇼핑 상위노출", href: "/services/shopping" },
      { label: "블로그 마케팅", href: "/services/blog-pack" },
      { label: "인스타그램", href: "/services/instagram" },
      { label: "유튜브", href: "/services/youtube" },
      { label: "카페 입소문", href: "/services/cafe" },
    ],
  },
  {
    moment: "믿고 고를 때",
    title: "후기와 기사로 믿음을 쌓게",
    desc: "처음 온 손님의 ‘여기 괜찮은 데 맞나?’ 하는 의심을 체험단 후기와 언론 기사로 줄여요. 원고는 AI가 도와요.",
    mock: { groupKey: "press", productId: "press" },
    links: [
      { label: "체험단·후기", href: "/services/experience" },
      { label: "언론보도", href: "/services/press" },
      { label: "AI 원고", href: "/services/blogwrite" },
      { label: "AI 인용·인플루언서", href: "/services/blog-pack#ai-influencer" },
    ],
  },
];

function JourneySection() {
  return (
    <section className="bg-mint-50">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="max-w-2xl">
          <h2 className="text-[clamp(1.75rem,3.6vw,2.6rem)] font-extrabold leading-tight tracking-[-0.035em] text-forest-900">
            손님이 가게를 고르는 순서대로
            <br />
            상품을 나눠 뒀어요
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            지금 우리 가게에 부족한 단계만 골라서 시작하면 돼요.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STAGES.map((s, i) => (
            <li key={s.moment} className="flex flex-col overflow-hidden rounded-3xl border border-mint-200 bg-white">
              <div className="h-44 border-b border-mint-200">
                <ResultMock groupKey={s.mock.groupKey} productId={s.mock.productId} />
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <p className="flex items-center gap-2.5 text-sm font-bold text-emerald-800">
                  <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-forest-900 text-xs text-white">
                    {i + 1}
                  </span>
                  손님이 {s.moment}
                </p>
                <h3 className="mt-3 text-xl font-extrabold leading-snug tracking-tight text-forest-900">{s.title}</h3>
                <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-slate-600">{s.desc}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {s.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-flex min-h-10 items-center rounded-full border border-mint-200 bg-white px-3.5 text-sm font-semibold text-forest-700 transition-colors hover:border-emerald-600 hover:text-emerald-800"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// --- 3) Closing: 3 steps + the two doors -------------------------------------

const STEPS = [
  { title: "3분이면 가입 끝", desc: "카카오·네이버 버튼 하나면 돼요. 이메일로 해도 3분이면 충분해요." },
  { title: "필요한 것만 담기", desc: "가격이 다 공개돼 있으니, 항목이랑 수량만 고르면 돼요." },
  { title: "결과는 내 화면에서", desc: "어디까지 진행됐는지, 잔액이 얼마인지 마이페이지에서 바로 보여요." },
];

export function ClosingSection() {
  return (
    <section className="bg-forest-900 text-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          <div>
            <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-tight tracking-[-0.035em]">
              오늘 저녁 마감하고,
              <br />
              3분이면 시작해요
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
              가격표는 가입 없이 먼저 볼 수 있어요. 주문할 때만 무료로 가입하면 돼요.
            </p>
            <div className="mt-9 flex max-w-md flex-col gap-3 sm:flex-row">
              <TrackedCta
                href="/start"
                authedHref="/mypage"
                className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-white px-7 text-[17px] font-extrabold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-white"
              >
                무료로 시작하기
              </TrackedCta>
              <Link
                href="/pricing/"
                className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border-2 border-white/35 px-7 text-[17px] font-bold text-white transition-colors hover:border-white/70 focus-visible:outline-white"
              >
                가격표 먼저 보기
              </Link>
            </div>
          </div>

          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-5 rounded-2xl bg-white/[0.06] p-5 sm:p-6">
                <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-base font-extrabold text-forest-900">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-white/70">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// --- Composition -------------------------------------------------------------

export function StoryIntro() {
  return (
    <>
      <CompareSection />
      <JourneySection />
    </>
  );
}
