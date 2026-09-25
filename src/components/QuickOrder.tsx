"use client";

// "바로 주문하기" on a service detail page: this product's price rows with an
// order button each, so a visitor can go from reading about a service to
// paying for it without detouring through the full /pricing list.
//
// - Members: the button opens OrderModal right here; when cash runs short it
//   hands over to ChargeModal (PG payment), then they come back to order.
// - Guests: sent to /start with the chosen row (?buy=), skipping the story
//   onboarding; after signup/login they land back here with that row's order
//   window already open.
//
// A sticky bottom bar keeps the order entry visible until the visitor reaches
// the section.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { OrderModal, type OrderDraft } from "@/components/OrderModal";
import { ChargeModal } from "@/components/ChargeModal";
import { InquiryModal } from "@/components/InquiryModal";
import { track } from "@/lib/analytics";
import { displayPrice, PRICING, productPricingItems, type PricingItem } from "@/lib/pricing";
import { fetchLivePricing } from "@/lib/sheetPricing";
import { isPriceAmount, type Product } from "@/lib/products";

export const BUY_PARAM = "buy";

export function QuickOrder({ product }: { product: Product }) {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();
  const authed = hydrated && isAuthenticated;
  const [groups, setGroups] = useState(PRICING);
  const [orderItem, setOrderItem] = useState<PricingItem | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);
  // Row whose order was interrupted by a top-up; reopened after charging.
  const [pending, setPending] = useState<{ item: PricingItem; draft: OrderDraft } | null>(null);
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [shortfall, setShortfall] = useState(0);
  const [inquiryTopic, setInquiryTopic] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [barVisible, setBarVisible] = useState(false);

  const isBlogWrite = product.slug === "blogwrite";
  const items = productPricingItems(product.slug, groups);

  // Orders must use the live (sheet) price when one is configured.
  useEffect(() => {
    let active = true;
    void fetchLivePricing().then((merged) => {
      if (active && merged) setGroups(merged);
    });
    return () => {
      active = false;
    };
  }, []);

  // Back from signup/login with ?buy=<row name>: open that row's order window.
  useEffect(() => {
    if (!authed) return;
    const url = new URL(window.location.href);
    const name = url.searchParams.get(BUY_PARAM);
    if (!name) return;
    url.searchParams.delete(BUY_PARAM);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    const hit = items.find((it) => it.name === name && it.amountKrw != null && !it.inquiry);
    sectionRef.current?.scrollIntoView({ block: "start" });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time deep-link sync
    if (hit) setOrderItem(hit);
    // items only changes when live prices arrive; the param is consumed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  // Show the sticky bar until the order section scrolls into view.
  useEffect(() => {
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      setBarVisible(window.scrollY > 240 && el.getBoundingClientRect().top > window.innerHeight - 80);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const order = (item: PricingItem) => {
    track("cta_click", { product_slug: product.slug });
    if (!authed) {
      router.push(`/start?service=${product.slug}&${BUY_PARAM}=${encodeURIComponent(item.name)}`);
      return;
    }
    setOrderItem(item);
  };

  const scrollToOrder = () => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const from = product.detail.fromPrice;
  const orderable = items.some((it) => it.amountKrw != null && !it.inquiry);

  return (
    <>
      <section
        id="order"
        ref={sectionRef}
        className="mt-12 scroll-mt-20 overflow-hidden lg:scroll-mt-6 rounded-3xl bg-white ring-2 ring-emerald-600/80 shadow-lg"
      >
        <div className="bg-emerald-700 px-6 py-5 sm:px-8">
          <h2 className="text-xl font-extrabold text-white">바로 주문하기</h2>
          <p className="mt-1 text-sm text-emerald-50">
            {isBlogWrite
              ? "주제만 입력하면 바로 원고가 나와요. 1건 1,000캐시."
              : orderable
                ? "원하는 상품을 골라 수량만 정하면 끝. 1원 = 1캐시, 부족하면 주문 창에서 바로 충전돼요."
                : "상품 특성상 맞춤 견적으로 진행돼요. 문의 남겨 주시면 24시간 안에 연락드려요."}
          </p>
        </div>

        {isBlogWrite ? (
          <div className="p-6 text-center sm:p-8">
            <Link
              href="/tools/blog-writer"
              onClick={() => track("cta_click", { product_slug: product.slug })}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-10 text-base font-bold text-white transition hover:bg-emerald-700 sm:w-auto"
            >
              AI 원고 바로 쓰기 →
            </Link>
          </div>
        ) : items.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const price = displayPrice(item);
              return (
                <li key={item.name} className="flex items-center gap-3 px-5 py-4 sm:px-8">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      <span className="num font-extrabold text-slate-900">{price.main}</span>
                      {price.from && " 부터"}
                      {price.unit && <span className="num text-xs text-slate-400"> / {price.unit}</span>}
                    </p>
                    {item.note && <p className="mt-0.5 text-xs text-slate-400">{item.note}</p>}
                  </div>
                  {price.kind === "order" ? (
                    <button
                      type="button"
                      onClick={() => order(item)}
                      className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      주문하기
                    </button>
                  ) : price.kind === "soon" ? (
                    <span className="flex h-11 shrink-0 items-center px-3 text-xs font-semibold text-slate-300">
                      준비 중
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setInquiryTopic(item.name)}
                      className="flex h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800"
                    >
                      견적 문의
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-6 text-center sm:p-8">
            <button
              type="button"
              onClick={() => setInquiryTopic(product.name)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-10 text-base font-bold text-white transition hover:bg-emerald-700 sm:w-auto"
            >
              견적·상담 신청하기
            </button>
          </div>
        )}

        {!authed && (orderable || isBlogWrite) && (
          <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center text-xs text-slate-500 sm:px-8">
            처음이면 1분 가입 후, 고른 상품의 주문 화면으로 바로 돌아와요.
          </p>
        )}
      </section>

      {/* Sticky order bar (hidden once the section itself is on screen) */}
      <div
        aria-hidden={!barVisible}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur transition-transform duration-300 ${
          barVisible ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-slate-500">{product.name}</p>
            {from && (
              <p className="text-sm text-slate-600">
                {isPriceAmount(from) && "최소 "}
                <span className="num font-extrabold text-slate-900">{from}</span>
                {isPriceAmount(from) && " 부터"}
              </p>
            )}
          </div>
          <button
            type="button"
            tabIndex={barVisible ? 0 : -1}
            onClick={scrollToOrder}
            className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 sm:px-10"
          >
            {orderable || isBlogWrite ? "바로 주문하기" : "견적 문의하기"}
          </button>
        </div>
      </div>

      <OrderModal
        item={orderItem}
        draft={draft}
        onClose={() => {
          setOrderItem(null);
          setDraft(null);
        }}
        onNeedCharge={(missing, d) => {
          if (orderItem) setPending({ item: orderItem, draft: d });
          setShortfall(missing);
          setChargeOpen(true);
        }}
      />
      <ChargeModal
        open={chargeOpen}
        shortfallCash={shortfall}
        onClose={() => {
          setChargeOpen(false);
          if (pending) {
            setDraft(pending.draft);
            setOrderItem(pending.item);
          }
          setPending(null);
        }}
      />
      <InquiryModal
        open={inquiryTopic !== null}
        topic={inquiryTopic ?? ""}
        onClose={() => setInquiryTopic(null)}
      />
    </>
  );
}
