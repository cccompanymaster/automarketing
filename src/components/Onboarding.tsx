"use client";

// Story-driven onboarding shown to new users before signup (4 chapters):
// agency frustration → quote roulette → the reversal (we do it all, at near-
// cost prices, no lock-in) → start. State-driven (no URL change). Fires
// `onboarding_step_view` per step and `onboarding_complete` at the end.
//
// Each step shows a 4-panel comic (/public/onboarding/comic-N.webp, 1000x1404)
// with the step title and dialogue drawn in, so the visible title is hidden
// (kept for screen readers) and the comic bleeds to the card edges. Tapping it
// opens a full-screen view. Steps without an image fall back to the emoji.
// Comic prompts: docs/ONBOARDING_COMIC.md.

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

interface Step {
  icon: string;
  eyebrow: string;
  title: string;
  desc: string;
  /** Optional comic (basePath-relative, e.g. "/onboarding/comic-1.webp"). */
  image?: string;
  /** Screen-reader text for the comic: its dialogue, panel by panel. */
  imageAlt?: string;
  /** Punchy fact chips shown under the copy. */
  chips?: string[];
  /** Next-button label — keeps the conversation going. */
  cta: string;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const STEPS: Step[] = [
  {
    icon: "😮‍💨",
    eyebrow: "혹시 이런 적 있으세요?",
    title: "대행사에 300만 원 냈는데,\n남은 건 캡처 몇 장이었어요",
    desc: "매달 보고서라고 오는 건 뭘 했는지 알 수 없는 표 몇 개. 전화하면 늘 “진행 중입니다”. 해지하려니 약정이 6개월 남았대요. 저희도 사장님들한테 이 얘기 수백 번 들었어요.",
    image: "/onboarding/comic-1.webp",
    imageAlt:
      "4컷 만화. 1컷: 영업맨 “무조건 대박 납니다!”, 사장님 “정말요?!” 2컷: 사장님 “한 달이 지났는데…”, 전화 속 영업맨 “진행 중입니다~” 3컷: 서류 더미 앞에서 사장님 “…이게 300만 원어치라고?” 4컷: 사장님 “그냥 해지할게요.”, 영업맨 “약정 6개월 남으셨는데요^^”",
    cta: "어… 이거 완전 제 얘기인데요",
  },
  {
    icon: "🎰",
    eyebrow: "짜증나는 건 또 있죠",
    title: "견적은 부르는 게 값,\n같은 작업인데 가격이 다 달라요",
    desc: "A업체 80만 원, B업체 150만 원, 지인 소개는 50만 원. 뭐가 맞는 건지 알 수가 없으니 늘 ‘호구 잡히는 건 아닌가’ 불안하고요. 원가가 얼마인지 아무도 안 알려주니까요.",
    image: "/onboarding/comic-2.webp",
    imageAlt:
      "4컷 만화. 1컷: 지인 소개 50만 원, A업체 80만 원, B업체 150만 원 견적 앞에서 사장님 “같은 작업인데요…?” 2컷: 사장님 “같은 일인데, 왜 이렇게 다르지?” 3컷: 룰렛 위에서 어지러운 사장님 “뭐가 맞는 거야…” 4컷: 밤에 침대에서 사장님 속마음 “혹시 나… 호구 잡힌 건가?”",
    cta: "맞아요, 그래서요?",
  },
  {
    icon: "💚",
    eyebrow: "그래서 저희는 반대로 해요",
    title: "할 수 있는 건 다 있고,\n가격은 원가에 딱 붙였어요",
    desc: "플레이스·블로그·인스타·유튜브·카페·언론보도·AI까지 대행사가 하는 건 전부 있어요. 대신 영업비·중간 마진 거품을 빼고 단가를 전부 공개했어요. 약정도 없어요 — 1건부터 필요한 만큼만.",
    chips: ["영수증 리뷰 1,000원", "트래픽 1타 30원", "AI 원고 1,000원", "약정 0개월"],
    image: "/onboarding/comic-3.webp",
    imageAlt:
      "4컷 만화. 1컷: 새싹이 “사장님, 이제 이렇게 해보세요!” 2컷: 새싹이 “대행사가 하는 건 전부 있어요.” 3컷: 새싹이 “영업비·중간 마진 거품은 싹 뺐어요.” 4컷: 사장님 “1건부터? 약정도 없다고요?!”, 새싹이 “필요한 만큼만!”",
    cta: "진짜예요? 가격 보여주세요",
  },
  {
    icon: "🚢",
    eyebrow: "이제 사장님 차례예요",
    title: "가입하면 가격표 전체가 열리고,\n클릭 한 번으로 주문돼요",
    desc: "모든 단가가 그대로 보이고, 필요한 것만 골라 캐시로 주문하면 진행 상황이 내 화면에 실시간으로 떠요. 가입은 3분, 가입비는 0원이에요.",
    image: "/onboarding/comic-4.webp",
    imageAlt:
      "4컷 만화. 1컷: 노트북으로 가입하며 사장님 “가입 3분, 가입비 0원이라고?” 2컷: 사장님 “가격 보고, 필요한 것만 골라서!” 3컷: 사장님 “클릭 한 번으로 주문하고, 진행 상황까지!” 4컷: 초록 배의 키를 잡고 사장님 “이제 내 가게 마케팅은 내가 직접!”",
    cta: "좋아요, 시작할게요!",
  },
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Track every step view (including the first).
  useEffect(() => {
    track("onboarding_step_view", { step: index + 1 });
  }, [index]);

  // Comics are tall: bring each new step back to its top, and fetch the next
  // comic ahead of time so it appears instantly.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
    } else {
      rootRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    const next = STEPS[index + 1]?.image;
    if (next) new Image().src = `${BASE}${next}`;
  }, [index]);

  // Close the full-screen comic with Escape.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoomed(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoomed]);

  const isLast = index === STEPS.length - 1;
  const step = STEPS[index];

  const handleNext = () => {
    if (isLast) {
      track("onboarding_complete");
      onComplete();
      return;
    }
    setIndex((i) => i + 1);
  };

  return (
    <div ref={rootRef} className="flex scroll-mt-4 flex-col">
      {/* Progress */}
      <div className="flex items-center gap-2" aria-hidden="true">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= index ? "bg-emerald-500" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className="mt-3 text-xs font-medium text-slate-400" aria-live="polite">
        {STEPS.length}단계 중 {index + 1}단계
      </p>

      <div className="mt-6 text-center" aria-live="polite">
        {step.image ? (
          <>
            <p className="text-xs font-bold tracking-widest text-emerald-700">{step.eyebrow}</p>
            {/* The comic carries the title itself; keep it for screen readers. */}
            <h2 className="sr-only">{step.title}</h2>
            <button
              type="button"
              onClick={() => setZoomed(true)}
              aria-label="만화 크게 보기"
              // Bleed to the card edges (card padding is p-6 / sm:p-8) so the
              // four panels get every pixel of width on a phone.
              className="-mx-6 mt-4 block w-[calc(100%+3rem)] sm:-mx-8 sm:w-[calc(100%+4rem)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, local asset */}
              <img
                src={`${BASE}${step.image}`}
                alt={step.imageAlt ?? ""}
                width={1000}
                height={1404}
                className="h-auto w-full"
              />
            </button>
            <p className="mt-1.5 text-[11px] text-slate-400">만화를 누르면 크게 볼 수 있어요</p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
              {step.icon}
            </div>
            <p className="mt-5 text-xs font-bold tracking-widest text-emerald-700">{step.eyebrow}</p>
            <h2 className="mt-2 whitespace-pre-line text-xl font-bold leading-snug text-slate-900">
              {step.title}
            </h2>
          </>
        )}
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
          {step.desc}
        </p>

        {step.chips && (
          <div className="mx-auto mt-4 flex max-w-sm flex-wrap justify-center gap-2">
            {step.chips.map((c) => (
              <span
                key={c}
                className="num rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {index > 0 && (
          <button
            type="button"
            onClick={() => setIndex((i) => i - 1)}
            className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            이전
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {step.cta}
        </button>
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-400">
        * 표시 단가는 대표 상품 기준이며, 전체 단가표는 가입 후 바로 확인할 수 있어요.
      </p>

      {zoomed && step.image && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="만화 크게 보기"
          onClick={() => setZoomed(false)}
          className="fixed inset-0 overflow-y-auto bg-slate-950/90 p-3 sm:p-6"
          // Above the site header/wing nav (z-50) and the hero splash (200).
          style={{ zIndex: 250 }}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="fixed right-3 top-3 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-slate-800 shadow-lg"
          >
            닫기 ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, local asset */}
          <img
            src={`${BASE}${step.image}`}
            alt={step.imageAlt ?? ""}
            width={1000}
            height={1404}
            className="mx-auto h-auto w-full max-w-2xl rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
