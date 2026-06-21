"use client";

// Minimal logged-in skeleton. Redirects to /start when not authenticated.
// Waits for auth hydration to avoid bouncing a logged-in user on refresh.
// TODO(backend): populate with real account data, campaigns, refunds, etc.
// TODO(payment): wire credits/payment methods to the real billing backend.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PRODUCT_LIST } from "@/lib/products";
import { WALLET_STUB } from "@/lib/payments";

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated } = useAuth();

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

          {/* Wallet / billing summary — payment backend is upcoming. */}
          <section
            aria-label="크레딧 및 결제"
            className="mt-8 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">내 크레딧</h2>
                <p className="mt-1 text-2xl font-extrabold text-emerald-600">
                  {WALLET_STUB.credits.toLocaleString("ko-KR")}
                  <span className="ml-1 text-sm font-semibold text-slate-400">크레딧</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  이번 달 예상 환급액 {WALLET_STUB.expectedRefund.toLocaleString("ko-KR")}원
                </p>
              </div>
              <button
                type="button"
                disabled
                className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400"
                title="결제 기능 준비 중"
              >
                충전하기 (준비 중)
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              결제·충전 기능은 곧 제공될 예정입니다. 표시된 값은 예시입니다.
            </p>
          </section>

          {/* Quick link to the full product & price list. */}
          <Link
            href="/pricing"
            className="mt-6 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
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
    </>
  );
}
