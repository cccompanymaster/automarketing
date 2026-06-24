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
import { PRICING, type PricingItem } from "@/lib/pricing";
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
                캐시로 바로 주문하세요. 표시 금액은 부가세 별도, 견적형은 키워드·조건에 따라 달라집니다.
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

          <div className="mt-8 space-y-6">
            {PRICING.map((group) => (
              <section
                key={group.key}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
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
                  {group.items.map((item) => (
                    <li
                      key={item.name}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4 sm:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                          {item.inquiry && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                              견적·문의
                            </span>
                          )}
                        </div>
                        {item.note && (
                          <p className="mt-1 text-xs text-slate-400">{item.note}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <span className="text-base font-extrabold text-emerald-600">{item.price}</span>
                          {item.unit && (
                            <span className="ml-1 text-xs font-semibold text-slate-400">/ {item.unit}</span>
                          )}
                        </div>
                        {item.name === "블로그용 원고 작성" ? (
                          <Link
                            href="/tools/blog-writer"
                            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          >
                            AI 작성
                          </Link>
                        ) : item.amountKrw != null && !item.inquiry ? (
                          <button
                            type="button"
                            onClick={() => setOrderItem(item)}
                            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          >
                            주문
                          </button>
                        ) : (
                          <Link
                            href="/mypage"
                            className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                          >
                            문의
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
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
