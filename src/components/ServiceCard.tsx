"use client";

// A single card on the landing grid. Represents either a standalone product or
// a product group (category). `featured` renders the bigger spotlight variant
// used by the two group cards on the first row. The CTA is a real link
// (crawlable, middle-clickable) that fires `cta_click` before navigation.

import Link from "next/link";
import type { ServiceCardData } from "@/lib/products";
import { isPriceAmount, type ProductSlug } from "@/lib/products";
import { track } from "@/lib/analytics";
import { BrandLogo } from "@/components/BrandLogo";
import { ResultMock } from "@/components/ResultMock";

// One CTA style for every card: the grid is a menu to browse, so no card's
// button competes with the page's primary "무료로 시작하기". Product color
// lives in the tile tint and icon, not in eleven different buttons.
const CARD_CTA =
  "border-2 border-forest-900/15 bg-white text-forest-900 hover:border-emerald-700 hover:bg-emerald-700 hover:text-white";

/** "30원 부터" line — the price anchor shown before the CTA. */
function CardPrice({ price, className = "" }: { price: NonNullable<ServiceCardData["price"]>; className?: string }) {
  return (
    <p className={`flex items-baseline gap-1 text-slate-500 ${className}`}>
      <span className="num text-lg font-extrabold text-slate-900">{price.amount}</span>
      {price.from && <span className="text-sm font-semibold">부터</span>}
    </p>
  );
}

export function ServiceCard({
  card,
  featured = false,
  wide = false,
  ribbon,
  hero = false,
  mock,
}: {
  card: ServiceCardData;
  featured?: boolean;
  /** Full-row banner layout (horizontal on sm+), used by the closing card. */
  wide?: boolean;
  /** Bento lead tile (2×2 on desktop): larger type + oversized icon mark. */
  hero?: boolean;
  /** Corner ribbon label (e.g. "인기 묶음"); omit for no ribbon. */
  ribbon?: string;
  /** Bento lead tile: outcome mock that fills the tile's extra height. */
  mock?: { groupKey: string; productId: string };
}) {
  if (wide) {
    return (
      <div
        className={`group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl bg-gradient-to-r ${card.accent.gradient} p-6 ring-1 ring-slate-100 transition-shadow duration-200 hover:ring-2 ${card.accent.cardRing} sm:flex-row sm:items-center sm:p-7`}
      >
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-sm ${card.accent.iconBg}`}
          aria-hidden="true"
        >
          {card.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-extrabold text-slate-900">{card.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{card.summary.join(" ")}</p>
          {card.price && <CardPrice price={card.price} className="mt-2" />}
        </div>
        <Link
          href={card.href}
          onClick={() => track("cta_click", { product_slug: card.trackId as ProductSlug })}
          className={`flex min-h-12 shrink-0 items-center justify-center rounded-xl px-8 text-sm font-bold transition-colors ${CARD_CTA}`}
        >
          {card.cta}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-b ${card.accent.gradient} ring-1 ring-slate-100 transition-shadow duration-200 hover:ring-2 ${card.accent.cardRing} ${
        featured ? "p-7 sm:p-8" : "p-6"
      }`}
    >
      {/* Corner ribbon */}
      {ribbon && (
        <span className="absolute right-0 top-0 rounded-bl-2xl bg-forest-900 px-4 py-1.5 text-xs font-extrabold tracking-wide text-white">
          {ribbon}
        </span>
      )}

      <div className={`flex items-center ${featured ? "gap-4" : "gap-3"}`}>
        {card.brand ? (
          <BrandLogo
            brand={card.brand}
            className={`shrink-0 rounded-2xl shadow-sm ${
              featured ? "h-16 w-16" : "h-13 w-13"
            }`}
          />
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl shadow-sm ${card.accent.iconBg} ${
              featured ? "h-16 w-16 text-4xl" : "h-13 w-13 text-3xl"
            }`}
            aria-hidden="true"
          >
            {card.icon}
          </div>
        )}
        <h3
          className={`font-extrabold leading-snug text-slate-900 ${
            hero ? "text-2xl sm:text-3xl" : featured ? "text-xl sm:text-2xl" : "text-lg"
          }`}
        >
          {card.name}
        </h3>
      </div>

      <p
        className={`mt-4 leading-relaxed text-slate-600 ${hero && card.includes ? "" : "flex-1"} ${
          featured ? "text-[15px]" : "text-sm"
        }`}
      >
        {card.summary.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </p>

      {/* Lead tile fills its extra height with what the bundle contains */}
      {hero && card.includes && (
        <ul className={`relative mt-6 space-y-2 ${mock ? "" : "flex-1"}`}>
          {card.includes.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                onClick={() => track("cta_click", { product_slug: card.trackId as ProductSlug })}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm ring-1 ring-slate-100 transition hover:bg-white hover:ring-slate-200"
              >
                <span className="font-bold text-slate-800">{it.name}</span>
                {it.price && <span className="num shrink-0 text-xs font-semibold text-slate-500">{it.price}{isPriceAmount(it.price) && " 부터"}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hero && mock && (
        <div className="mt-4 hidden min-h-40 flex-1 overflow-hidden rounded-2xl ring-1 ring-slate-100 @4xl:block">
          <ResultMock groupKey={mock.groupKey} productId={mock.productId} />
        </div>
      )}

      {card.price && <CardPrice price={card.price} className="mt-4" />}

      <Link
        href={card.href}
        onClick={() => track("cta_click", { product_slug: card.trackId as ProductSlug })}
        className={`mt-6 flex w-full items-center justify-center rounded-xl text-center font-bold transition-colors ${CARD_CTA} ${
          featured ? "min-h-13 text-base" : "min-h-12 text-sm"
        }`}
      >
        {card.cta}
      </Link>
    </div>
  );
}
