"use client";

// Trust stats band. Numbers count up when the band scrolls into view
// (storytelling landing). Demo placeholder numbers.
// TODO(backend): replace with real aggregate metrics.

import { useEffect, useRef } from "react";

interface Stat {
  /** Count-up target (numeric part). */
  target: number;
  suffix: string;
  label: string;
}

const STATS: Stat[] = [
  { target: 240, suffix: "억+", label: "누적 광고 집행비" },
  { target: 500, suffix: "+", label: "연동 매체" },
  { target: 11, suffix: "만+", label: "누적 광고 캠페인" },
  { target: 12800, suffix: "+", label: "함께하는 사장님" },
];

export function Stats() {
  const rootRef = useRef<HTMLDListElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-target]"));
    const finish = (el: HTMLElement) => {
      el.textContent = Number(el.dataset.target).toLocaleString("ko-KR");
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach(finish);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        for (const el of els) {
          const target = Number(el.dataset.target);
          const start = performance.now();
          const dur = 1400;
          const step = (now: number) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased).toLocaleString("ko-KR");
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            대행사 없이, 광고를 시작하세요
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            대행사 직원 없이도 광고비 거품 없이 셀프 마케팅으로 효율적으로 운영하세요.
          </p>
        </div>

        <dl ref={rootRef} className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm"
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="num block text-2xl font-extrabold text-emerald-700 sm:text-3xl">
                  <span data-target={s.target}>0</span>
                  {s.suffix}
                </span>
                <span className="mt-1 block text-xs font-medium text-slate-500 sm:text-sm">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-center text-xs text-slate-400">
          * 정식 오픈 준비 중의 예시 수치이며, 실측 지표로 순차 교체됩니다.
        </p>
      </div>
    </section>
  );
}
