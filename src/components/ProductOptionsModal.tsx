"use client";

// Option picker for a bundled store product: every row with its price and
// its own action (주문 · 견적 문의 · 준비 중).

import { useRef } from "react";
import Link from "next/link";
import { useModal } from "@/components/useModal";
import { displayPrice, type PricingItem } from "@/lib/pricing";
import type { StoreProduct } from "@/lib/store";
import { BADGE_STYLE } from "@/components/StoreCard";

export function ProductOptionsModal({
  product,
  onClose,
  onOrder,
  onInquiry,
}: {
  product: StoreProduct | null;
  onClose: () => void;
  onOrder: (item: PricingItem) => void;
  onInquiry: (item: PricingItem) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(panelRef, Boolean(product), onClose);
  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.title} 옵션`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-emerald-700">
              {product.group.icon} {product.group.title}
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">{product.title}</h2>
            {product.summary && <p className="mt-1 text-sm text-slate-500">{product.summary}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100">
            ✕
          </button>
        </div>

        <ul className="mt-5 space-y-2.5">
          {product.options.map((o) => {
            const price = displayPrice(o);
            return (
              <li key={o.name} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-slate-900">
                    {o.name}
                    {o.badge && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${BADGE_STYLE[o.badge]}`}>{o.badge}</span>
                    )}
                  </p>
                  {o.note && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{o.note}</p>}
                  <p className="mt-1 text-sm">
                    {price.kind === "order" ? (
                      <>
                        <span className="num font-extrabold text-slate-900">{price.main}</span>
                        {price.from && <span className="text-xs font-bold text-slate-500"> ~</span>}
                        {price.unit && <span className="text-xs text-slate-400"> / {price.unit}</span>}
                      </>
                    ) : (
                      <span className={`font-bold ${price.kind === "quote" ? "text-amber-700" : "text-slate-300"}`}>
                        {price.kind === "quote" ? "견적 문의" : "준비 중"}
                      </span>
                    )}
                  </p>
                </div>
                {o.name === "블로그용 원고 작성" ? (
                  <Link href="/tools/blog-writer" className="flex h-10 shrink-0 items-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white">
                    AI로 작성
                  </Link>
                ) : price.kind === "order" ? (
                  <button
                    type="button"
                    onClick={() => onOrder(o)}
                    className="flex h-10 shrink-0 items-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    주문
                  </button>
                ) : price.kind === "quote" ? (
                  <button
                    type="button"
                    onClick={() => onInquiry(o)}
                    className="flex h-10 shrink-0 items-center rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-800"
                  >
                    문의
                  </button>
                ) : (
                  <span className="flex h-10 shrink-0 items-center px-2 text-xs font-semibold text-slate-300">준비 중</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-center text-[11px] text-slate-400">표시 금액은 부가세 별도 · 작업 시작 전 전액 환불</p>
      </div>
    </div>
  );
}
