"use client";

// A product card in the /pricing store (크몽-style): thumbnail (image when
// one is set, else a channel gradient with the product name), badge, option
// chips, starting price and one action. Bundles open their option list.

import Link from "next/link";
import { displayPrice } from "@/lib/pricing";
import { GROUP_THEME, isOrderable, productFrom, type StoreProduct } from "@/lib/store";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const BADGE_STYLE: Record<string, string> = {
  인기: "bg-rose-500 text-white",
  추천: "bg-emerald-500 text-white",
  신규: "bg-sky-500 text-white",
};

export function StoreCard({
  product: p,
  onOpen,
  onInquiry,
}: {
  product: StoreProduct;
  /** Bundle: show options. Single orderable row: order it. */
  onOpen: () => void;
  onInquiry: () => void;
}) {
  const from = productFrom(p);
  const price = displayPrice(from);
  const bundle = p.options.length > 1;
  const isBlogWrite = !bundle && from.name === "블로그용 원고 작성";
  const orderable = isOrderable(p);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-emerald-200">
      {/* Thumbnail (4:3, 크몽 규격과 같은 비율) */}
      <button
        type="button"
        onClick={orderable || bundle ? onOpen : onInquiry}
        aria-label={`${p.title} ${bundle ? "옵션 보기" : "주문"}`}
        className={`relative flex aspect-[4/3] flex-col justify-between overflow-hidden bg-gradient-to-br p-3 text-left text-white sm:p-4 ${
          GROUP_THEME[p.group.key] ?? GROUP_THEME.place
        }`}
      >
        {p.image && (
          <>
            {/* Images carry no text (see docs/STORE_THUMBNAILS.md); a scrim keeps the title readable. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, local asset */}
            <img src={`${BASE}${p.image}`} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent" />
          </>
        )}
        <span className="relative flex items-start justify-between gap-2">
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-bold backdrop-blur">{p.group.title}</span>
          {p.badge && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold shadow ${BADGE_STYLE[p.badge]}`}>{p.badge}</span>
          )}
        </span>
        {!p.image && (
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-3 -right-2 select-none text-6xl opacity-30 transition-transform duration-300 group-hover:scale-110 sm:text-7xl">
            {p.group.icon}
          </span>
        )}
        <span aria-hidden="true" className="relative line-clamp-2 text-base font-extrabold leading-snug drop-shadow-sm sm:text-lg">
          {p.title}
        </span>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 sm:text-[15px]">{p.title}</h3>
        {p.summary && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{p.summary}</p>}

        {bundle && (
          <p className="mt-2 flex flex-wrap gap-1">
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">옵션 {p.options.length}개</span>
          </p>
        )}

        <div className="mt-auto pt-3">
          {price.kind === "order" ? (
            <p className="flex flex-wrap items-baseline gap-x-1">
              <span className="num text-lg font-extrabold text-slate-900 sm:text-xl">{price.main}</span>
              {(bundle || price.from) && <span className="text-xs font-bold text-slate-500">~</span>}
              {price.unit && <span className="text-xs text-slate-400">/ {price.unit}</span>}
            </p>
          ) : (
            <p className={`text-base font-extrabold ${price.kind === "quote" ? "text-amber-700" : "text-slate-300"}`}>
              {price.kind === "quote" ? "견적 문의" : "준비 중"}
            </p>
          )}
          <p className="mt-0.5 text-[11px] text-slate-400">부가세 별도</p>

          <div className="mt-3 flex gap-1.5">
            {isBlogWrite ? (
              <Link
                href="/tools/blog-writer"
                className="flex h-10 flex-1 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                AI로 작성
              </Link>
            ) : bundle || orderable ? (
              <button
                type="button"
                onClick={onOpen}
                className="flex h-10 flex-1 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                {bundle ? "옵션 선택" : "주문하기"}
              </button>
            ) : price.kind === "quote" ? (
              <button
                type="button"
                onClick={onInquiry}
                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
              >
                견적 문의
              </button>
            ) : (
              <span className="flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-400">
                준비 중
              </span>
            )}
            {p.detailHref && (
              <Link
                href={p.detailHref}
                aria-label={`${p.title} 상세 설명`}
                className="flex h-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800"
              >
                상세
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
