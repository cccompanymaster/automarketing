"use client";

// Store: a floating "더 많은 서비스 보기 ↓" pill at the bottom of the screen
// while channel sections are still below the fold. The first section (blog)
// fills a phone screen on its own, so without this the list can look finished.
// Clicking scrolls to the next section that starts below the viewport; the
// pill hides once the last section is on screen.

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

export interface SectionRef {
  key: string;
  icon: string;
  title: string;
}

/** DOM id of a channel section heading (shared with the pricing page). */
export const sectionHeadingId = (key: string) => `sec-${key}`;

export function MoreSectionsButton({ sections }: { sections: SectionRef[] }) {
  const [next, setNext] = useState<{ index: number; remaining: number } | null>(null);

  useEffect(() => {
    if (sections.length < 2) return;
    const update = () => {
      const fold = window.innerHeight - 80;
      const i = sections.findIndex((s) => {
        const el = document.getElementById(sectionHeadingId(s.key));
        return !!el && el.getBoundingClientRect().top > fold;
      });
      setNext(i <= 0 ? null : { index: i, remaining: sections.length - i });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  if (!next) return null;
  const target = sections[next.index];

  const go = () => {
    track("select_item", { item_list_name: "store_more_sections", item_id: target.key });
    document.getElementById(sectionHeadingId(target.key))?.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-16 sm:px-24 lg:left-64">
      <button
        type="button"
        onClick={go}
        className="pointer-events-auto flex min-h-11 max-w-full items-center gap-2 rounded-full bg-slate-900/90 px-4 text-sm font-bold text-white shadow-lg shadow-slate-900/20 backdrop-blur transition hover:bg-slate-900"
      >
        <span className="truncate">
          더 많은 서비스 보기
          <span className="ml-1.5 hidden font-semibold text-emerald-300 sm:inline">
            {target.icon} {target.title}
            {next.remaining > 1 && ` 외 ${next.remaining - 1}개 채널`}
          </span>
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 animate-bounce">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </button>
    </div>
  );
}
