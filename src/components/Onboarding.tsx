"use client";

// 3-step onboarding shown to new users before signup. State-driven (no URL
// change). Fires `onboarding_step_view` on each step and `onboarding_complete`
// when the last step is finished.

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

interface Step {
  icon: string;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    icon: "📍",
    title: "플레이스 상위노출",
    desc: "지역 검색에서 우리 매장을 상위에 노출해 방문 고객을 늘립니다. 복잡한 설정 없이 진단부터 시작합니다.",
  },
  {
    icon: "💸",
    title: "광고비 환급",
    desc: "이미 집행 중인 네이버·카카오 광고비의 일부를 매월 환급받습니다. 기존 광고는 그대로 두면 됩니다.",
  },
  {
    icon: "✍️",
    title: "블로그/리뷰 자동화",
    desc: "신뢰감 있는 콘텐츠와 리뷰를 자동으로 발행해 브랜드 신뢰도를 꾸준히 쌓습니다.",
  },
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);

  // Track every step view (including the first).
  useEffect(() => {
    track("onboarding_step_view", { step: index + 1 });
  }, [index]);

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
    <div className="flex flex-col">
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
      <p className="mt-3 text-xs font-medium text-slate-400">
        {index + 1} / {STEPS.length}
      </p>

      <div className="mt-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
          {step.icon}
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-900">{step.title}</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
          {step.desc}
        </p>
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
          className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {isLast ? "가입하고 시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
