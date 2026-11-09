"use client";

// Simple accessible FAQ accordion (single-open). Reusable across pages.
// Every answer stays in the HTML (closed ones are `hidden`), so crawlers and
// answer engines read the same Q&A the FAQPage JSON-LD declares.

import { useId, useState } from "react";

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="mx-auto max-w-2xl divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-a${i}`;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:px-6"
            >
              <span className="text-sm font-semibold text-slate-800">{item.q}</span>
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div id={panelId} hidden={!isOpen} className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6">
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
