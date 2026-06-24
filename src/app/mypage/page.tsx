"use client";

// Minimal logged-in skeleton. Redirects to /start when not authenticated.
// Waits for auth hydration to avoid bouncing a logged-in user on refresh.
// TODO(backend): populate with real account data, campaigns, refunds, etc.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { ChargeModal } from "@/components/ChargeModal";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PRODUCT_LIST } from "@/lib/products";
import { formatCash, txnLabel } from "@/lib/cash";

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated } = useAuth();
  const { balance, transactions } = useWallet();
  const [chargeOpen, setChargeOpen] = useState(false);

  useEffect(() => {
    // Only redirect once the stored session has been restored — otherwise a
    // logged-in user refreshing /mypage would be bounced to /start.
    if (hydrated && !isAuthenticated) router.replace("/start");
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <h1 className="text-2xl font-bold text-slate-900">마이페이지</h1>
          <p className="mt-2 text-sm text-slate-500">
            {user?.name ? `${user.name}님, ` : ""}환영합니다. ({user?.email})
          </p>

          {/* Cash wallet */}
          <section
            aria-label="캐시 지갑"
            className="mt-8 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">내 캐시</h2>
                <p className="mt-1 text-3xl font-extrabold text-emerald-600">
                  {balance.toLocaleString("ko-KR")}
                  <span className="ml-1 text-sm font-semibold text-slate-400">캐시</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">1원 = 1캐시</p>
              </div>
              <button
                type="button"
                onClick={() => setChargeOpen(true)}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                충전하기
              </button>
            </div>

            {transactions.length > 0 && (
              <div className="mt-5 border-t border-slate-50 pt-4">
                <h3 className="text-xs font-semibold text-slate-400">최근 내역</h3>
                <ul className="mt-2 divide-y divide-slate-50">
                  {transactions.slice(0, 5).map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <span className="font-semibold text-slate-700">{txnLabel(t.type)}</span>
                        <span className="ml-2 text-xs text-slate-400">
                          {new Date(t.createdAt).toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${t.amount >= 0 ? "text-emerald-600" : "text-slate-700"}`}
                      >
                        {t.amount >= 0 ? "+" : ""}
                        {formatCash(t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* AI 블로그 원고 작성 바로가기 */}
          <Link
            href="/tools/blog-writer"
            className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <span aria-hidden="true">📝</span> AI 블로그 원고 작성
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                주제만 입력하면 제목·목차·원고까지 AI가 자동 작성합니다.
              </p>
            </div>
            <span className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" aria-hidden="true">
              작성하기
            </span>
          </Link>

          {/* Quick link to the full product & price list. */}
          <Link
            href="/pricing"
            className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900">상품 · 요금 보기</h2>
              <p className="mt-1 text-sm text-slate-500">
                블로그·리워드·플레이스 상품 단가와 견적형 상품을 확인하세요.
              </p>
            </div>
            <span className="text-emerald-600" aria-hidden="true">
              →
            </span>
          </Link>

          <h2 className="mt-10 text-lg font-bold text-slate-900">서비스 현황</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {PRODUCT_LIST.map((p) => (
              <div
                key={p.slug}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {p.icon}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {/* TODO(backend): show real campaign / refund status. */}
                  아직 신청한 내역이 없습니다.
                </p>
                <Link
                  href={`/services/${p.slug}`}
                  className="mt-3 inline-block text-sm font-semibold text-emerald-600 hover:underline"
                >
                  자세히 보기 →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
      <ChargeModal open={chargeOpen} onClose={() => setChargeOpen(false)} />
    </>
  );
}
