"use client";

// A product card in the /pricing store: gradient thumbnail (channel icon +
// product name), badges, price and one action (주문 · 문의 · AI 작성).

import Link from "next/link";
import { displayPrice } from "@/lib/pricing";
import { GROUP_THEME, type StoreItem } from "@/lib/store";

const BADGE_STYLE: Record<string, string> = {
  인기: "bg-rose-500 text-white",
  추천: "bg-emerald-500 text-white",
  신규: "bg-sky-500 text-white",
};

export function StoreCard({
  entry: { item, group, detailHref },
  onOrder,
  onInquiry,
}: {
  entry: StoreItem;
  onOrder: () => void;
  onInquiry: () => void;
}) {
  const price = displayPrice(item);
  const isBlogWrite = item.name === "블로그용 원고 작성";
  const minQty = item.minQty && item.minQty > 1 ? `최소 ${item.minQty.toLocaleString("ko-KR")}${item.unit?.replace(/^1/, "") ?? ""}` : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-emerald-200">
      {/* Thumbnail */}
      <div
        className={`relative flex aspect-[4/3] flex-col justify-between overflow-hidden bg-gradient-to-br p-3 text-white sm:p-4 ${
          GROUP_THEME[group.key] ?? GROUP_THEME.place
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] font-bold backdrop-blur">{group.title}</span>
          {item.badge && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold shadow ${BADGE_STYLE[item.badge]}`}>
              {item.badge}
            </span>
          )}
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-3 -right-2 select-none text-6xl opacity-30 transition-transform duration-300 group-hover:scale-110 sm:text-7xl">
          {group.icon}
        </span>
        <p aria-hidden="true" className="relative line-clamp-2 text-base font-extrabold leading-snug drop-shadow-sm sm:text-lg">
          {item.name}
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 sm:text-[15px]">{item.name}</h3>
        {item.note && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.note}</p>}

        <div className="mt-auto pt-3">
          {price.kind === "order" ? (
            <p className="flex flex-wrap items-baseline gap-x-1">
              <span className="num text-lg font-extrabold text-slate-900 sm:text-xl">{price.main}</span>
              {price.from && <span className="text-xs font-bold text-slate-500">~</span>}
              {price.unit && <span className="text-xs text-slate-400">/ {price.unit}</span>}
            </p>
          ) : (
            <p className={`text-base font-extrabold ${price.kind === "quote" ? "text-amber-700" : "text-slate-300"}`}>
              {price.kind === "quote" ? "견적 문의" : "준비 중"}
            </p>
          )}
          <p className="mt-0.5 text-[11px] text-slate-400">
            부가세 별도{minQty ? ` · ${minQty}` : ""}
          </p>

          <div className="mt-3 flex gap-1.5">
            {isBlogWrite ? (
              <Link
                href="/tools/blog-writer"
                className="flex h-10 flex-1 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                AI로 작성
              </Link>
            ) : price.kind === "order" ? (
              <button
                type="button"
                onClick={onOrder}
                className="flex h-10 flex-1 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                주문하기
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
            {detailHref && (
              <Link
                href={detailHref}
                aria-label={`${item.name} 상세 설명`}
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
