"use client";

// Landing service grid with progressive disclosure: the first rows show at
// once; the rest expand on demand. Keeps the mobile page (10 cards in one
// column) from pushing reviews/CTA thousands of pixels down.

import { useState } from "react";
import { ServiceCard } from "@/components/ServiceCard";
import type { ServiceCardData } from "@/lib/products";

const INITIAL_COUNT = 6;

export function ServicesGrid({ cards }: { cards: ServiceCardData[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? cards : cards.slice(0, INITIAL_COUNT);
  const hiddenCount = cards.length - INITIAL_COUNT;

  return (
    <>
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((card) => (
          <ServiceCard key={card.href} card={card} />
        ))}
      </div>

      {!expanded && hiddenCount > 0 && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            전체 서비스 {cards.length}개 모두 보기
            <span aria-hidden="true">↓</span>
          </button>
        </div>
      )}
    </>
  );
}
