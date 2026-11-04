"use client";

// A product card in the /pricing store: white card, outcome thumbnail (image
// when one is set, else a CSS mock of the result), channel + badge chips,
// value line, price with unit and minimum, then one primary action and a
// quieter 상세 보기 link. Channel color is only an accent.

import Link from "next/link";
import { ResultMock } from "@/components/ResultMock";
import { displayPrice } from "@/lib/pricing";
import { isOrderable, productFrom, type StoreProduct } from "@/lib/store";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const BADGE_STYLE: Record<string, string> = {
  인기: "bg-rose-500 text-white",
  추천: "bg-emerald-600 text-white",
  신규: "bg-sky-500 text-white",
};

/** Channel accent for the category chip. */
const GROUP_CHIP: Record<string, string> = {
  blog: "bg-sky-50 text-sky-700",
  place: "bg-emerald-50 text-emerald-700",
  commerce: "bg-orange-50 text-orange-700",
  cafe: "bg-amber-50 text-amber-800",
  ai: "bg-violet-50 text-violet-700",
  sns: "bg-pink-50 text-pink-700",
  kakaomap: "bg-yellow-50 text-yellow-800",
  daangn: "bg-orange-50 text-orange-700",
  press: "bg-indigo-50 text-indigo-700",
};

export function StoreCard({
  product: p,
  onOpen,
  onInquiry,
}: {
  product: StoreProduct;
  /** Bundle: show options. Single orderable row: open its order window. */
  onOpen: () => void;
  onInquiry: () => void;
}) {
  const from = productFrom(p);
  const price = displayPrice(from);
  const bundle = p.options.length > 1;
  const isBlogWrite = !bundle && from.name === "블로그용 원고 작성";
  const orderable = isOrderable(p);
  const primary = bundle || orderable ? onOpen : onInquiry;
  const minQty = from.minQty && from.minQty > 1 ? `최소 ${from.minQty.toLocaleString("ko-KR")}${from.unit?.replace(/^1/, "") ?? ""}` : null;
  const meta = [minQty, bundle ? `옵션 ${p.options.length}개` : null].filter(Boolean).join(" · ");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-emerald-300">
      {/* Outcome thumbnail */}
      <button
        type="button"
        onClick={primary}
        aria-label={`${p.title} ${bundle ? "옵션 보기" : orderable ? "주문" : "문의"}`}
        className="relative block aspect-[4/3] overflow-hidden border-b border-slate-100"
      >
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export, local asset
          <img src={`${BASE}${p.image}`} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <span className="block h-full w-full transition-transform duration-300 group-hover:scale-[1.03]">
            <ResultMock groupKey={p.group.key} productId={p.id} />
          </span>
        )}
        {p.badge && (
          <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-extrabold shadow ${BADGE_STYLE[p.badge]}`}>
            {p.badge}
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <span className={`w-fit rounded-md px-1.5 py-0.5 text-[11px] font-bold ${GROUP_CHIP[p.group.key] ?? "bg-slate-100 text-slate-600"}`}>
          {p.group.icon} {p.group.title}
        </span>
        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-extrabold leading-snug text-slate-900 sm:text-base">{p.title}</h3>
        {p.summary && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 sm:text-[13px]">{p.summary}</p>}

        <div className="mt-auto pt-3">
          {price.kind === "order" ? (
            <p className="flex flex-wrap items-baseline gap-x-1">
              <span className="num text-xl font-extrabold text-slate-900">{price.main}</span>
              <span className="text-xs font-bold text-slate-500">{bundle || price.from ? "부터" : ""}</span>
              {price.unit && <span className="text-xs text-slate-400">· {price.unit}</span>}
            </p>
          ) : (
            <p className={`text-lg font-extrabold ${price.kind === "quote" ? "text-amber-700" : "text-slate-300"}`}>
              {price.kind === "quote" ? "견적 문의" : "준비 중"}
            </p>
          )}
          <p className="mt-0.5 min-h-4 text-[11px] text-slate-400">
            부가세 별도{meta ? ` · ${meta}` : ""}
          </p>

          {isBlogWrite ? (
            <Link
              href="/tools/blog-writer"
              className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              AI로 작성하기
            </Link>
          ) : price.kind === "soon" && !bundle ? (
            <span className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-400">준비 중</span>
          ) : (
            <button
              type="button"
              onClick={primary}
              className={`mt-3 flex h-10 w-full items-center justify-center rounded-xl text-sm font-bold transition ${
                bundle || orderable
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              {bundle ? "옵션 선택" : orderable ? "주문하기" : "견적 문의"}
            </button>
          )}
          {p.detailHref && (
            <Link
              href={p.detailHref}
              className="mt-1.5 flex h-8 items-center justify-center text-xs font-semibold text-slate-500 underline-offset-2 transition hover:text-emerald-700 hover:underline"
            >
              상세 보기 →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
