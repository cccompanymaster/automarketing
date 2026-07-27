"use client";

// A single card on the landing grid. Represents either a standalone product or
// a product group (category). `featured` renders the bigger spotlight variant
// used by the two group cards on the first row. The CTA is a real link
// (crawlable, middle-clickable) that fires `cta_click` before navigation.

import Link from "next/link";
import type { ServiceCardData } from "@/lib/products";
import type { ProductSlug } from "@/lib/products";
import { track } from "@/lib/analytics";
import { BrandLogo } from "@/components/BrandLogo";

export function ServiceCard({
  card,
  featured = false,
  wide = false,
  ribbon,
}: {
  card: ServiceCardData;
  featured?: boolean;
  /** Full-row banner layout (horizontal on sm+), used by the closing card. */
  wide?: boolean;
  /** Corner ribbon label (e.g. "인기 묶음 ⭐"); omit for no ribbon. */
  ribbon?: string;
}) {
  if (wide) {
    return (
      <div
        className={`group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl bg-gradient-to-r ${card.accent.gradient} p-6 ring-1 ring-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-2 ${card.accent.cardRing} sm:flex-row sm:items-center sm:p-7`}
      >
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-md ${card.accent.iconBg} transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
          aria-hidden="true"
        >
          {card.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-extrabold text-slate-900">{card.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{card.summary.join(" ")}</p>
        </div>
        <Link
          href={card.href}
          onClick={() => track("cta_click", { product_slug: card.trackId as ProductSlug })}
          className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${card.accent.button}`}
        >
          {card.cta}
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-b ${card.accent.gradient} ring-1 ring-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 ${card.accent.cardRing} ${
        featured ? "p-7 sm:p-8" : "p-6"
      }`}
    >
      {/* Corner ribbon */}
      {ribbon && (
        <span className="absolute right-0 top-0 rounded-bl-2xl bg-slate-900 px-4 py-1.5 text-xs font-extrabold tracking-wide text-white">
          {ribbon}
        </span>
      )}

      {/* Decorative glow that wakes up on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/60 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className={`flex items-center ${featured ? "gap-4" : "gap-3"}`}>
        {card.brand ? (
          <BrandLogo
            brand={card.brand}
            className={`shrink-0 rounded-2xl shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${
              featured ? "h-16 w-16" : "h-13 w-13"
            }`}
          />
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl shadow-md ${card.accent.iconBg} transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${
              featured ? "h-16 w-16 text-4xl" : "h-13 w-13 text-3xl"
            }`}
            aria-hidden="true"
          >
            {card.icon}
          </div>
        )}
        <h3
          className={`font-extrabold leading-snug text-slate-900 ${
            featured ? "text-xl sm:text-2xl" : "text-lg"
          }`}
        >
          {card.name}
        </h3>
      </div>

      <p
        className={`mt-4 flex-1 leading-relaxed text-slate-600 ${
          featured ? "text-[15px]" : "text-sm"
        }`}
      >
        {card.summary.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </p>

      <Link
        href={card.href}
        onClick={() => track("cta_click", { product_slug: card.trackId as ProductSlug })}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl text-center font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group-hover:gap-3.5 ${card.accent.button} ${
          featured ? "py-4 text-base" : "py-3 text-sm"
        }`}
      >
        {card.cta}
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </Link>
    </div>
  );
}
