"use client";

// 업종별 송출 단가 + 언론사 아코디언. 카테고리 행을 클릭하면 해당 언론사 목록이
// 펼쳐지고, "전체 언론사 보기"로 한 번에 펼칠 수 있습니다. 히어로의 "매체·단가
// 보기"(#press-rates)로 진입하면 전체가 자동으로 펼쳐집니다.

import { useEffect, useState } from "react";
import { PRESS_CATEGORIES } from "@/lib/press";

const krw = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function PressRates() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const allOpen = PRESS_CATEGORIES.every((c) => open[c.key]);

  const setAll = (v: boolean) =>
    setOpen(Object.fromEntries(PRESS_CATEGORIES.map((c) => [c.key, v])));
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  // Arriving via "매체·단가 보기" (#press-rates) expands everything.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#press-rates") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- expand all when deep-linked
      setAll(true);
    }
  }, []);

  return (
    <section id="press-rates" className="scroll-mt-20 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">업종별 송출 단가</h2>
          <p className="mt-2 text-sm text-slate-600">
            카테고리를 클릭하면 해당 언론사 목록이 펼쳐집니다. 매체별 단가·포털 노출은 상이하며 VAT 별도입니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAll(!allOpen)}
          className="rounded-lg border border-indigo-200 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
        >
          {allOpen ? "전체 접기" : "전체 언론사 보기"}
        </button>
      </div>

      <ul className="mt-6 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
        {PRESS_CATEGORIES.map((c) => {
          const isOpen = !!open[c.key];
          const more = c.mediaCount - c.samples.length;
          return (
            <li key={c.key} className="border-b border-slate-50 last:border-b-0">
              <button
                type="button"
                onClick={() => toggle(c.key)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 bg-white px-4 py-3.5 text-left transition hover:bg-slate-50 sm:px-5"
              >
                <span
                  className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  aria-hidden="true"
                >
                  ▸
                </span>
                <span className="flex-1 text-sm font-bold text-slate-800">{c.name}</span>
                <span className="shrink-0 text-xs text-slate-500">{c.mediaCount}개</span>
                <span className="w-32 shrink-0 text-right text-sm font-semibold text-indigo-600 sm:w-40">
                  {krw(c.priceMin)} ~ {krw(c.priceMax)}
                </span>
              </button>

              {isOpen && (
                <div className="bg-slate-50/60 px-4 pb-4 pt-1 sm:px-5">
                  {c.samples.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {c.samples.map((m) => (
                        <span
                          key={m}
                          className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                        >
                          {m}
                        </span>
                      ))}
                      {more > 0 && (
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          외 {more}개
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      매체 목록은 신청 시 안내드립니다. (총 {c.mediaCount}개 매체)
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-slate-400">
        ※ 표시 매체는 대표 예시이며, 실제 가능 매체·단가는 업종·시점에 따라 달라질 수 있습니다.
      </p>
    </section>
  );
}
