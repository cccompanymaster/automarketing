// Storytelling sections for the landing page (noahgroup-style narrative):
// empathy (owner's pains) → bridge (why we built this) → three chapters that
// follow the customer journey (get found → get sales → build trust & save) →
// "3 minutes to start" process. Scroll-reveal via <Reveal>; copy is Korean.

import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { TrackedCta } from "@/components/TrackedCta";

// --- 1) Empathy: the owner's day -------------------------------------------

const PAINS = [
  {
    quote: "대행사에 맡겼는데, 뭘 해줬는지 모르겠어요.",
    who: "카페 사장님",
    emoji: "☕",
  },
  {
    quote: "광고비는 매달 나가는데 손님은 그대로예요.",
    who: "음식점 사장님",
    emoji: "🍜",
  },
  {
    quote: "플레이스, 블로그, 인스타… 뭐부터 해야 하죠?",
    who: "네일샵 원장님",
    emoji: "💅",
  },
  {
    quote: "견적을 받을 때마다 가격이 달라서 불안해요.",
    who: "온라인 셀러",
    emoji: "📦",
  },
];

function PainSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold tracking-widest text-emerald-700">사장님의 하루</p>
        <h2 className="mt-3 text-2xl font-extrabold leading-snug text-slate-900 sm:text-4xl">
          장사만 해도 하루가 모자란데,
          <br />
          마케팅까지 직접 하라고요?
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
          그래서 다들 대행사부터 찾아가죠. 그런데 막상 맡겨 보면… 이런 얘기, 한 번쯤 들어보셨을 거예요.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {PAINS.map((p, i) => (
          <Reveal key={p.quote} delayMs={i * 90}>
            <figure className="flex h-full items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-50 text-xl"
                aria-hidden="true"
              >
                {p.emoji}
              </span>
              <div>
                <blockquote className="text-[15px] font-semibold leading-relaxed text-slate-800">
                  “{p.quote}”
                </blockquote>
                <figcaption className="mt-2 text-xs text-slate-400">{p.who}</figcaption>
              </div>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// --- 2) Bridge: why we built this (dark full-bleed statement) ---------------

function BridgeSection() {
  return (
    <section className="impact">
      <div className="mx-auto max-w-4xl px-5 py-24 text-center sm:py-32">
        <Reveal>
          <p className="text-sm font-bold tracking-widest text-emerald-400">그래서 저희가 만들었어요</p>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            대행사 없이도,
            <br />
            사장님 손으로 직접.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-lg">
            마케팅방주는 필요한 것만 골라 쓰는 셀프 마케팅 플랫폼이에요.
            <br className="hidden sm:block" />
            가격은 가입 전에 전부 보여드리고, 주문이 어떻게 되고 있는지도 내 화면에서 바로 확인할 수 있어요.
          </p>
        </Reveal>
        <Reveal delayMs={150}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-200">
            <span className="flex items-center gap-2">
              <span className="text-emerald-400" aria-hidden="true">✓</span> 가격, 먼저 보여드려요
            </span>
            <span className="flex items-center gap-2">
              <span className="text-emerald-400" aria-hidden="true">✓</span> 필요한 만큼만 주문해요
            </span>
            <span className="flex items-center gap-2">
              <span className="text-emerald-400" aria-hidden="true">✓</span> 진행 상황은 실시간으로 보여요
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// --- 3) Chapters: the customer journey --------------------------------------
// A real sequence (how a customer meets a store), so the numbering carries
// meaning: get found → get sales → build trust & stop wasting budget.

interface Chapter {
  no: string;
  eyebrow: string;
  title: string;
  desc: string;
  links: { label: string; href: string }[];
  emoji: string;
  metric: { label: string; value: string };
  panelClass: string;
}

const CHAPTERS: Chapter[] = [
  {
    no: "01",
    eyebrow: "첫 번째, 일단 눈에 띄어야죠",
    title: "‘근처 맛집’ 검색한 손님한테\n우리 가게부터 보이게 해요",
    desc: "요즘 손님들, 열에 아홉은 지도부터 켜요. 네이버 플레이스랑 카카오맵에서 우리 매장이 위쪽에 보이게 — 무료 진단부터 트래픽까지 한 번에 챙겨드릴게요.",
    links: [
      { label: "플레이스·지도 상위노출", href: "/services/place-map" },
      { label: "리워드 트래픽", href: "/services/place-map#place-traffic" },
    ],
    emoji: "📍",
    metric: { label: "지도에서 매장을 찾는 손님", value: "10명 중 8명*" },
    panelClass: "from-emerald-100 via-emerald-50 to-white",
  },
  {
    no: "02",
    eyebrow: "두 번째, 보이면 팔려야죠",
    title: "손님은 검색 첫 페이지에서\n살지 말지 정해요",
    desc: "쇼핑 검색 상위 노출에 블로그 후기, SNS 반응까지. 손님이 ‘살까 말까’ 망설이는 그 순간마다 우리 상품이 눈에 들어오게 해드려요.",
    links: [
      { label: "쇼핑 상위노출", href: "/services/shopping" },
      { label: "블로그 마케팅", href: "/services/blog-pack" },
      { label: "인스타그램", href: "/services/instagram" },
      { label: "유튜브", href: "/services/youtube" },
    ],
    emoji: "🛒",
    metric: { label: "첫 페이지에서 멈추는 검색", value: "대부분*" },
    panelClass: "from-orange-100 via-orange-50 to-white",
  },
  {
    no: "03",
    eyebrow: "세 번째, 믿음은 쌓고 낭비는 줄이고",
    title: "후기랑 기사로 믿음을 쌓고,\n새는 광고비는 돌려받아요",
    desc: "처음 온 손님 마음속 ‘여기 괜찮은 데 맞나?’ 하는 의심, 체험단 후기랑 언론 기사가 지워줘요. 원고는 AI가 대신 써주고요. 이미 쓰고 있는 광고비는 환급으로 돌려받으세요.",
    links: [
      { label: "체험단·후기", href: "/services/experience" },
      { label: "언론보도", href: "/services/press" },
      { label: "AI 원고", href: "/services/blogwrite" },
      { label: "광고비 환급", href: "/services/refund" },
    ],
    emoji: "🤝",
    metric: { label: "가입비 0원 광고비 환급", value: "매월 정산" },
    panelClass: "from-sky-100 via-sky-50 to-white",
  },
];

function ChapterSection({ chapter, flip }: { chapter: Chapter; flip: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <div
        className={`flex flex-col items-center gap-10 lg:gap-16 ${
          flip ? "lg:flex-row-reverse" : "lg:flex-row"
        }`}
      >
        {/* Copy */}
        <Reveal className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <span className="num text-4xl font-extrabold text-slate-200 sm:text-6xl" aria-hidden="true">
              {chapter.no}
            </span>
            <p className="text-sm font-bold tracking-widest text-emerald-700">{chapter.eyebrow}</p>
          </div>
          <h2 className="mt-4 whitespace-pre-line text-2xl font-extrabold leading-snug text-slate-900 sm:text-4xl">
            {chapter.title}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {chapter.desc}
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {chapter.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {l.label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* Visual panel */}
        <Reveal delayMs={120} className="w-full max-w-md flex-1">
          <div
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${chapter.panelClass} p-10 shadow-sm ring-1 ring-slate-100`}
          >
            <span className="block text-7xl sm:text-8xl" aria-hidden="true">
              {chapter.emoji}
            </span>
            <div className="mt-8 inline-flex flex-col gap-1 rounded-2xl bg-white/90 px-5 py-4 shadow-sm ring-1 ring-slate-100">
              <span className="text-xs font-semibold text-slate-500">{chapter.metric.label}</span>
              <span className="text-xl font-extrabold text-slate-900">{chapter.metric.value}</span>
            </div>
            <span
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/50 blur-2xl"
              aria-hidden="true"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// --- 4) Process: 3 minutes to start -----------------------------------------

const STEPS = [
  { no: "1", title: "3분이면 가입 끝", desc: "카카오 버튼 하나면 끝나요. 이메일로 해도 3분이면 충분해요." },
  { no: "2", title: "필요한 것만 담기", desc: "가격이 다 공개돼 있으니까, 필요한 항목이랑 수량만 고르면 돼요." },
  { no: "3", title: "결과를 눈으로 확인", desc: "어디까지 진행됐는지, 잔액이 얼마인지 마이페이지에서 바로 보여요." },
];

function ProcessSection() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-widest text-emerald-700">시작은 진짜 간단해요</p>
          <h2 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-4xl">
            오늘 저녁, 마감하고 3분이면 충분해요
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.no} delayMs={i * 110}>
              <li className="h-full rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
                <span className="num flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-base font-extrabold text-white">
                  {s.no}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-10 text-center">
          <TrackedCta
            href="/start"
            authedHref="/mypage"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-10 py-4 text-base font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            무료로 시작하기
          </TrackedCta>
        </Reveal>
      </div>
    </section>
  );
}

// --- Composition -------------------------------------------------------------

export function StoryIntro() {
  return (
    <>
      <PainSection />
      <BridgeSection />
      {CHAPTERS.map((c, i) => (
        <ChapterSection key={c.no} chapter={c} flip={i % 2 === 1} />
      ))}
      <p className="mx-auto max-w-6xl px-5 pb-4 text-xs text-slate-400">
        * 일반적인 소비자 행동 경향을 표현한 문구로, 특정 조사 수치가 아닙니다.
      </p>
    </>
  );
}

export { ProcessSection };
