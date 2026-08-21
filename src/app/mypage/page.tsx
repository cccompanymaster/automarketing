"use client";

// Minimal logged-in skeleton. Redirects to /start when not authenticated.
// Waits for auth hydration to avoid bouncing a logged-in user on refresh.
// TODO(backend): populate with real account data, campaigns, refunds, etc.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { useOrders } from "@/components/OrdersProvider";
import { useDeliverables } from "@/components/DeliverablesProvider";
import { DeliverableModal } from "@/components/DeliverableModal";
import { ConsentSettings } from "@/components/ConsentSettings";
import { ChargeModal } from "@/components/ChargeModal";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PRODUCT_LIST } from "@/lib/products";
import { formatCash, txnLabel } from "@/lib/cash";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "@/lib/orders";
import {
  DELIVERABLE_STATUS_LABEL,
  DELIVERABLE_STATUS_STYLE,
  type Deliverable,
} from "@/lib/deliverables";
import { isAdminUser } from "@/lib/admin";

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated } = useAuth();
  const { balance, transactions } = useWallet();
  const { orders } = useOrders();
  const { deliverables, pendingCount } = useDeliverables();
  const [chargeOpen, setChargeOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Deliverable | null>(null);
  const isAdmin = isAdminUser(user);

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

          {/* Optional-consent management (제3자 제공 철회 창구) */}
          <ConsentSettings />

          {isAdmin && (
            <Link
              href="/admin"
              className="mt-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm transition hover:bg-slate-800"
            >
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-white">
                  <span aria-hidden="true">🛠️</span> 관리자 대시보드
                </h2>
                <p className="mt-1 text-sm text-slate-300">회원·주문·충전 현황을 관리합니다.</p>
              </div>
              <span className="text-slate-300" aria-hidden="true">
                →
              </span>
            </Link>
          )}

          {/* Deliverables waiting for my confirmation */}
          {deliverables.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">컨펌 요청</h2>
                {pendingCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    {pendingCount}건 대기
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                작업한 원고·자료를 확인하고 승인하거나 수정을 요청하세요. 승인 후 진행됩니다.
              </p>
              <ul className="mt-4 space-y-2.5">
                {deliverables.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setReviewTarget(d)}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
                        d.status === "pending_review"
                          ? "border-amber-200 ring-1 ring-amber-100"
                          : "border-slate-100"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{d.title}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {new Date(d.createdAt).toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {d.content.slice(0, 40)}…
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${DELIVERABLE_STATUS_STYLE[d.status]}`}
                      >
                        {DELIVERABLE_STATUS_LABEL[d.status]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* My orders */}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">내 주문</h2>
              <Link href="/pricing" className="text-sm font-semibold text-emerald-600 hover:underline">
                상품 주문하기 →
              </Link>
            </div>
            {orders.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-500">아직 주문한 내역이 없습니다.</p>
                <Link
                  href="/pricing"
                  className="mt-3 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  상품 둘러보기
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {o.productName}
                        {o.qty > 1 && <span className="ml-1 text-slate-400">×{o.qty}</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(o.createdAt).toLocaleString("ko-KR", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {formatCash(o.amountCash)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${ORDER_STATUS_STYLE[o.status]}`}
                    >
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

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
      <DeliverableModal deliverable={reviewTarget} onClose={() => setReviewTarget(null)} />
    </>
  );
}
