"use client";

// First-screen popup banner for guests on the home page: the flagship
// products with their starting price, a link to each detail and one signup
// CTA. Waits for the intro splash and the one-time scam notice, and can be
// hidden for the day ("오늘 하루 보지 않기").

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getProduct, type ProductSlug } from "@/lib/products";
import { useModal } from "@/components/useModal";
import { track } from "@/lib/analytics";

export const FLAGSHIP: ProductSlug[] = ["place", "blog", "daangn", "blogwrite"];
const HIDE_KEY = "mb_product_popup_hidden_until";
const SCAM_KEY = "mb_scam_notice_seen";
export const SCAM_CLOSED_EVENT = "mb:scam-notice-closed";

const todayEndKst = () => {
  const now = new Date(Date.now() + 9 * 3600_000);
  now.setUTCHours(23, 59, 59, 999);
  return now.getTime() - 9 * 3600_000;
};

export function ProductPopup() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(panelRef, open, () => setOpen(false));

  useEffect(() => {
    let hiddenUntil = 0;
    let scamSeen = false;
    try {
      hiddenUntil = Number(localStorage.getItem(HIDE_KEY) || 0);
      scamSeen = localStorage.getItem(SCAM_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (hiddenUntil > Date.now()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (delay: number) => {
      timer = setTimeout(() => setOpen(true), delay);
    };
    // After the intro splash; after the scam notice if it is still to come.
    if (scamSeen) show(2400);
    const onScamClosed = () => show(500);
    window.addEventListener(SCAM_CLOSED_EVENT, onScamClosed);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SCAM_CLOSED_EVENT, onScamClosed);
    };
  }, []);

  useEffect(() => {
    if (open) track("view_item", { item_id: "home_popup", item_name: "메인 상품 팝업" });
  }, [open]);

  if (!open) return null;

  const hideToday = () => {
    try {
      localStorage.setItem(HIDE_KEY, String(todayEndKst()));
    } catch {
      /* ignore */
    }
    setOpen(false);
  };
  const products = FLAGSHIP.map((s) => getProduct(s)).filter((p): p is NonNullable<ReturnType<typeof getProduct>> => !!p);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="마케팅방주 대표 상품"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-900/55 p-0 sm:items-center sm:p-5"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        style={{ animation: "popIn .35s ease both" }}
      >
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-6 pb-5 pt-6 text-white sm:pb-6 sm:pt-7">
          <p className="text-xs font-bold text-emerald-200">마케팅방주 대표 상품</p>
          <h2 className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">
            대행사 견적 없이,
            <br />
            실행가 그대로 바로 시작하세요
          </h2>
          <p className="mt-2 text-sm text-emerald-100">모든 단가를 공개하고, 필요한 만큼만 직접 주문해요.</p>
        </div>
        <ul className="grid grid-cols-2 gap-2.5 p-4 sm:gap-3 sm:p-5">
          {products.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/services/${p.slug}/`}
                onClick={() => {
                  track("select_item", { item_id: p.slug, item_name: p.name, item_list_name: "home_popup" });
                  setOpen(false);
                }}
                className="flex h-full flex-col rounded-2xl p-3.5 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-emerald-300"
              >
                <span aria-hidden="true" className="text-2xl">
                  {p.icon}
                </span>
                <span className="mt-1.5 text-sm font-extrabold leading-snug text-slate-900">{p.name}</span>
                <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">{p.summary[0]}</span>
                <span className="mt-auto pt-2 text-sm font-extrabold text-emerald-700">
                  {p.detail.fromPrice ? `${p.detail.fromPrice}부터` : p.priceTag?.amount ?? "견적 문의"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="px-4 pb-2 sm:px-5">
          <Link
            href="/start"
            onClick={() => track("cta_click", { product_slug: "home_popup" })}
            className="flex min-h-12 items-center justify-center rounded-2xl bg-emerald-600 text-base font-extrabold text-white hover:bg-emerald-700"
          >
            무료 회원가입하고 시작하기 →
          </Link>
          <Link
            href="/pricing/"
            onClick={() => setOpen(false)}
            className="mt-2 flex min-h-11 items-center justify-center rounded-2xl text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            전체 상품·단가 먼저 보기
          </Link>
        </div>
        <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-100 bg-white px-4 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] text-sm text-slate-500 sm:px-5 sm:py-2">
          <button type="button" onClick={hideToday} className="min-h-11 px-1 hover:text-slate-800">
            오늘 하루 보지 않기
          </button>
          <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-1 font-semibold hover:text-slate-800">
            닫기 ✕
          </button>
        </div>
      </div>
    </div>
  );
}
