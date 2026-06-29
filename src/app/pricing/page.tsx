"use client";

// Logged-in product & price list. Mirrors the internal rate card so members
// can review costs before ordering. Redirects to /start when not authenticated.
// TODO(payment): turn each row into an orderable item via the billing API.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { ChargeModal } from "@/components/ChargeModal";
import { OrderModal } from "@/components/OrderModal";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PRICING, sortedItems, type PricingItem } from "@/lib/pricing";
import { formatCash } from "@/lib/cash";

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();
  const { balance } = useWallet();
  const [orderItem, setOrderItem] = useState<PricingItem | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace("/start");
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">상품 · 요금</h1>
              <p className="mt-2 text-sm text-slate-500">
                가격이 낮은 순으로 정리했어요. <b className="text-slate-600">1원 = 1캐시</b>로 바로 주문할 수 있고,
                표시 금액은 부가세 별도입니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChargeOpen(true)}
              className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              보유 {formatCash(balance)} · 충전
            </button>
          </header>

          {/* Legend — what each action means */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
              캐시로 바로 주문
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
              견적·문의
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden="true" />
              준비 중
            </span>
          </div>

          <div className="mt-8 space-y-6">
            {PRICING.map((group) => (
              <section
                key={group.key}
                id={group.key}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm scroll-mt-24"
              >
                <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                  <span className="text-2xl" aria-hidden="true">
                    {group.icon}
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{group.title}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{group.description}</p>
                  </div>
                </div>

                <ul className="divide-y divide-slate-50">
                  {sortedItems(group).map((item) => {
                    const comingSoon = item.price.includes("준비");
                    const orderable = item.amountKrw != null && !item.inquiry && !comingSoon;
                    const isBlogWrite = item.name === "블로그용 원고 작성";
                    return (
                      <li
                        key={item.name}
                        className="flex items-start justify-between gap-3 px-5 py-4 sm:gap-4 sm:px-6"
                      >
                        {/* Name + badges + note */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                            {item.inquiry && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                견적·문의
                              </span>
                            )}
                            {comingSoon && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                                준비 중
                              </span>
                            )}
                          </div>
                          {item.note && (
                            <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.note}</p>
                          )}
                        </div>

                        {/* Price — fixed-width column so rows line up */}
                        <div className="w-[86px] shrink-0 pt-0.5 text-right sm:w-[120px]">
                          <span className="text-base font-extrabold tabular-nums text-emerald-600">
                            {item.price}
                          </span>
                          {item.unit && (
                            <span className="block text-[11px] font-semibold text-slate-400">
                              / {item.unit}
                            </span>
                          )}
                        </div>

                        {/* Action — fixed-width column so buttons align */}
                        <div className="w-[68px] shrink-0 sm:w-[76px]">
                          {isBlogWrite ? (
                            <Link
                              href="/tools/blog-writer"
                              className="block rounded-lg bg-emerald-600 px-2 py-2 text-center text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >
                              AI 작성
                            </Link>
                          ) : orderable ? (
                            <button
                              type="button"
                              onClick={() => setOrderItem(item)}
                              className="block w-full rounded-lg bg-emerald-600 px-2 py-2 text-center text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >
                              주문
                            </button>
                          ) : comingSoon ? (
                            <span
                              aria-disabled="true"
                              className="block cursor-not-allowed rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-300"
                            >
                              준비 중
                            </span>
                          ) : (
                            <Link
                              href="/mypage"
                              className="block rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                            >
                              문의
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          {/* Inquiry CTA (quote-based items) */}
          <div className="mt-8 rounded-2xl bg-emerald-600 px-6 py-7 text-center">
            <h2 className="text-lg font-bold text-white">키워드 단가·견적이 궁금하신가요?</h2>
            <p className="mt-1.5 text-sm text-emerald-50">
              상위노출 보장형·쿠팡 트래픽 등 견적형 상품은 키워드 문의 후 24시간 내 회신드립니다.
            </p>
            <Link
              href="/mypage"
              className="mt-5 inline-block rounded-xl bg-white px-7 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              견적·문의하기
            </Link>
            {/* TODO(backend): connect to a real inquiry / quote request form. */}
          </div>
        </div>
      </main>
      <SiteFooter />

      <OrderModal
        item={orderItem}
        onClose={() => setOrderItem(null)}
        onNeedCharge={() => setChargeOpen(true)}
      />
      <ChargeModal open={chargeOpen} onClose={() => setChargeOpen(false)} />
    </>
  );
}
