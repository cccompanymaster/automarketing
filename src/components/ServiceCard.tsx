"use client";

// A single card on the landing grid. Represents either a standalone product or
// a product group (category). The CTA is a real link (crawlable, middle-
// clickable) that fires `cta_click` before navigation.

import Link from "next/link";
import type { ServiceCardData } from "@/lib/products";
import type { ProductSlug } from "@/lib/products";
import { track } from "@/lib/analytics";
import { BrandLogo } from "@/components/BrandLogo";

export function ServiceCard({ card }: { card: ServiceCardData }) {
  return (
    <div
      className={`group flex h-full flex-col rounded-2xl bg-gradient-to-b ${card.accent.gradient} p-6 shadow-sm ring-1 ring-slate-100 transition duration-200 hover:-translate-y-1 hover:shadow-lg ${card.accent.cardRing}`}
    >
      {card.brand ? (
        <BrandLogo brand={card.brand} className="mx-auto h-12 w-12 rounded-xl shadow-sm" />
      ) : (
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${card.accent.iconBg}`}
          aria-hidden="true"
        >
          {card.icon}
        </div>
      )}

      <h3 className="mt-4 text-lg font-bold text-slate-900">{card.name}</h3>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
        {card.summary.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </p>

      <Link
        href={card.href}
        onClick={() => track("cta_click", { product_slug: card.trackId as ProductSlug })}
        className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${card.accent.button}`}
      >
        {card.cta}
      </Link>
    </div>
  );
}
