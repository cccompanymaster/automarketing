"use client";

// Public product & price list, organized by channel. A summary grid shows every
// channel at a glance (item count · lowest price · what it does); picking one
// filters the tables below. "전체" keeps the full list. Ordering/charging stays
// member-only: guests' order/inquiry actions route into the signup funnel.
// TODO(payment): turn each row into an orderable item via the billing API.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { ChargeModal } from "@/components/ChargeModal";
import { OrderModal } from "@/components/OrderModal";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  PRICING,
  sortedItems,
  priceSortValue,
  type PricingGroup,
  type PricingItem,
} from "@/lib/pricing";
import { fetchLivePricing, isSheetPricingConfigured } from "@/lib/sheetPricing";
import { InquiryModal } from "@/components/InquiryModal";
import { formatCash } from "@/lib/cash";

/** Cheapest orderable price in a group, for the summary card. */
function fromPrice(group: PricingGroup): string {
  const priced = group.items
    .filter((i) => i.amountKrw != null)
    .sort((a, b) => priceSortValue(a) - priceSortValue(b));
  if (priced.length === 0) return "견적 문의";
  const cheapest = priced[0];
  return `${cheapest.amountKrw!.toLocaleString("ko-KR")}원${cheapest.unit ? ` / ${cheapest.unit}` : ""}`;
}

export default function PricingPage() {
  const { isAuthenticated, hydrated } = useAuth();
  const { balance } = useWallet();
  const [orderItem, setOrderItem] = useState<PricingItem | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [inquiryTopic, setInquiryTopic] = useState<string | null>(null);
  // Built-in catalog first; live sheet prices override once fetched.
  const [groups, setGroups] = useState<PricingGroup[]>(PRICING);
  const [live, setLive] = useState(false);
  /** null = 전체 채널 */
  const [channel, setChannel] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchLivePricing().then((merged) => {
      if (active && merged) {
        setGroups(merged);
        setLive(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const authed = hydrated && isAuthenticated;
  const shown = useMemo(
    () => (channel ? groups.filter((g) => g.key === channel) : groups),
    [groups, channel],
  );
  const totalItems = groups.reduce((n, g) => n + g.items.length, 0);

  // A hash (e.g. /pricing#sns) selects that channel and scrolls to it.
  useEffect(() => {
    if (!hydrated) return;
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    if (groups.some((g) => g.key === hash)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time deep-link sync
      setChannel(hash);
    }
    requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
  }, [hydrated, groups]);

  const selectChannel = (key: string | null) => {
    setChannel(key);
    if (key) {
      requestAnimationFrame(() => document.getElementById(key)?.scrollIntoView());
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 py-12">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">상품 · 요금</h1>
              <p className="mt-2 text-sm text-slate-500">
                채널별로 정리했어요. <b className="text-slate-600">1원 = 1캐시</b>로 필요한 만큼만
                주문할 수 있고, 표시 금액은 부가세 별도입니다.
              </p>
            </div>
            {authed ? (
              <button
                type="button"
                onClick={() => setChargeOpen(true)}
                className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                보유 {formatCash(balance)} · 충전
              </button>
            ) : (
              <Link
                href="/start"
                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                3분 가입하고 주문하기
              </Link>
            )}
          </header>

          {/* ===== Channel overview — every channel at a glance ===== */}
          <section aria-label="채널 한눈에 보기" className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900">
                채널 한눈에 보기
                <span className="num ml-2 text-xs font-semibold text-slate-400">
                  {groups.length}개 채널 · {totalItems}개 상품
                </span>
              </h2>
              {isSheetPricingConfigured && live && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
                  실시간 단가 반영 중
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {/* 전체 보기 */}
              <button
                type="button"
                onClick={() => selectChannel(null)}
                aria-pressed={channel === null}
                className={`flex min-h-24 flex-col justify-between rounded-2xl border p-4 text-left transition ${
                  channel === null
                    ? "border-emerald-600 bg-emerald-700 text-white shadow-md"
                    : "border-slate-100 bg-white text-slate-700 hover:border-emerald-200 hover:shadow-sm"
                }`}
              >
                <span className="text-xl" aria-hidden="true">🗂️</span>
                <span className="mt-2 text-sm font-bold">전체 보기</span>
                <span
                  className={`num text-xs ${channel === null ? "text-emerald-50" : "text-slate-400"}`}
                >
                  {totalItems}개 상품
                </span>
              </button>

              {groups.map((g) => {
                const active = channel === g.key;
                const orderableCount = g.items.filter((i) => i.amountKrw != null && !i.inquiry).length;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => selectChannel(g.key)}
                    aria-pressed={active}
                    className={`flex min-h-24 flex-col justify-between rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-emerald-600 bg-emerald-700 text-white shadow-md"
                        : "border-slate-100 bg-white text-slate-700 hover:border-emerald-200 hover:shadow-sm"
                    }`}
                  >
                    <span className="text-xl" aria-hidden="true">{g.icon}</span>
                    <span className="mt-2 text-sm font-bold">{g.title}</span>
                    <span className={`num text-xs ${active ? "text-emerald-50" : "text-slate-400"}`}>
                      {g.items.length}개 · 최저 {fromPrice(g)}
                    </span>
                    {orderableCount > 0 && (
                      <span
                        className={`mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          active ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        즉시 주문 {orderableCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Legend — what each action means */}
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
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
            {channel && (
              <button
                type="button"
                onClick={() => selectChannel(null)}
                className="ml-auto rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:bg-white"
              >
                ← 전체 채널 보기
              </button>
            )}
          </div>

          <div className="mt-4 space-y-6">
            {shown.map((group) => (
              <section
                key={group.key}
                id={group.key}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm scroll-mt-24"
              >
                <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                  <span className="text-2xl" aria-hidden="true">
                    {group.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-slate-900">{group.title}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{group.description}</p>
                  </div>
                  <span className="num shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                    {group.items.length}개
                  </span>
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

                        {/* Action — fixed-width column so buttons align.
                            Guests: everything funnels into signup. */}
                        <div className="w-[68px] shrink-0 sm:w-[76px]">
                          {isBlogWrite ? (
                            <Link
                              href="/tools/blog-writer"
                              className="block rounded-lg bg-emerald-700 px-2 py-2 text-center text-xs font-semibold text-white transition hover:bg-emerald-800"
                            >
                              AI 작성
                            </Link>
                          ) : orderable ? (
                            authed ? (
                              <button
                                type="button"
                                onClick={() => setOrderItem(item)}
                                className="block w-full rounded-lg bg-emerald-700 px-2 py-2 text-center text-xs font-semibold text-white transition hover:bg-emerald-800"
                              >
                                주문
                              </button>
                            ) : (
                              <Link
                                href="/start"
                                className="block rounded-lg bg-emerald-700 px-2 py-2 text-center text-xs font-semibold text-white transition hover:bg-emerald-800"
                              >
                                주문
                              </Link>
                            )
                          ) : comingSoon ? (
                            <span
                              aria-disabled="true"
                              className="block cursor-not-allowed rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-300"
                            >
                              준비 중
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setInquiryTopic(item.name)}
                              className="block w-full rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                            >
                              문의
                            </button>
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
          <div className="mt-8 rounded-2xl bg-emerald-700 px-6 py-7 text-center">
            <h2 className="text-lg font-bold text-white">키워드 단가·견적이 궁금하신가요?</h2>
            <p className="mt-1.5 text-sm text-emerald-50">
              상위노출 보장형·쿠팡 트래픽 등 견적형 상품은 키워드 문의 후 24시간 내 회신드립니다.
            </p>
            <button
              type="button"
              onClick={() => setInquiryTopic("컨설팅·견적 상담")}
              className="mt-5 inline-block rounded-xl bg-white px-7 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              견적·문의하기
            </button>
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
      <InquiryModal
        open={inquiryTopic !== null}
        topic={inquiryTopic ?? ""}
        onClose={() => setInquiryTopic(null)}
      />
    </>
  );
}
