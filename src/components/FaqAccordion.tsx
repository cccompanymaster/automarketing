"use client";

// Simple accessible FAQ accordion (single-open). Reusable across pages.

import { useState } from "react";

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
            >
              <span className="text-sm font-semibold text-slate-800">{item.q}</span>
              <span
                className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                ⌄
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
