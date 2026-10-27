"use client";

// Right "wing" for members (xl+): my cash, programs in progress and an order
// status summary, always one glance away. Mirrors the left wing nav; the body
// reserves room for it via .has-right-wing (globals.css).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { useOrders } from "@/components/OrdersProvider";
import { useDeliverables } from "@/components/DeliverablesProvider";
import { ChargeModal } from "@/components/ChargeModal";
import { isActiveOrder, ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "@/lib/orders";

export function RightWing() {
  const { hydrated, isAuthenticated } = useAuth();
  const { balance, loading } = useWallet();
  const { orders } = useOrders();
  const { pendingCount } = useDeliverables();
  const [chargeOpen, setChargeOpen] = useState(false);
  const show = hydrated && isAuthenticated;

  useEffect(() => {
    if (!show) return;
    document.body.classList.add("has-right-wing");
    return () => document.body.classList.remove("has-right-wing");
  }, [show]);

  if (!show) return null;

  const active = orders.filter(isActiveOrder);
  const count = (s: "received" | "in_progress" | "done") => orders.filter((o) => o.status === s).length;
  const stats = [
    { label: "접수", value: count("received") },
    { label: "진행중", value: count("in_progress") },
    { label: "컨펌 대기", value: pendingCount, alert: pendingCount > 0 },
    { label: "완료", value: count("done") },
  ];

  return (
    <>
      <aside
        aria-label="내 대시보드"
        className="fixed inset-y-0 right-0 z-30 hidden w-72 flex-col gap-4 overflow-y-auto border-l border-slate-100 bg-white p-5 xl:flex"
      >
        {/* My cash */}
        <section className="rounded-2xl bg-emerald-50 p-5">
          <h2 className="text-sm font-bold text-emerald-800">내 캐시</h2>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">
            {loading && balance === 0 ? "—" : balance.toLocaleString("ko-KR")}
            <span className="ml-1 text-base font-semibold text-slate-400">캐시</span>
          </p>
          <button
            type="button"
            onClick={() => setChargeOpen(true)}
            className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 text-base font-bold text-white transition hover:bg-emerald-700"
          >
            충전하기
          </button>
        </section>

        {/* Status summary */}
        <section>
          <h2 className="text-sm font-bold text-slate-500">진행 현황</h2>
          <dl className="mt-2 grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`rounded-xl p-3 ${s.alert ? "bg-amber-100 text-amber-900" : "bg-slate-50 text-slate-900"}`}
              >
                <dt className="text-xs font-semibold opacity-70">{s.label}</dt>
                <dd className="text-2xl font-extrabold">{s.value}</dd>
              </div>
            ))}
          </dl>
          {pendingCount > 0 && (
            <Link
              href="/mypage#confirm"
              className="mt-2 flex min-h-11 items-center justify-center rounded-xl bg-amber-400 text-sm font-bold text-slate-900 transition hover:bg-amber-300"
            >
              작업물 확인하기 →
            </Link>
          )}
        </section>

        {/* Programs in progress */}
        <section className="flex-1">
          <h2 className="text-sm font-bold text-slate-500">진행 중인 상품</h2>
          {active.length === 0 ? (
            <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">진행 중인 상품이 없어요.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {active.slice(0, 5).map((o) => (
                <li key={o.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="text-sm font-bold leading-snug text-slate-800">{o.productName}</p>
                  <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${ORDER_STATUS_STYLE[o.status]}`}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/mypage#orders"
            className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-emerald-700 hover:underline"
          >
            전체 주문 내역 →
          </Link>
        </section>

        <Link
          href="/pricing"
          className="flex min-h-12 items-center justify-center rounded-xl border-2 border-emerald-600 text-base font-bold text-emerald-700 transition hover:bg-emerald-50"
        >
          상품 주문하기
        </Link>
      </aside>
      <ChargeModal open={chargeOpen} onClose={() => setChargeOpen(false)} />
    </>
  );
}
