"use client";

// "진행 중인 프로그램" — the first thing a member sees (member home, /mypage).
// Active orders with a progress bar, plus a banner for deliverables waiting
// for the member's approval.

import Link from "next/link";
import { useOrders } from "@/components/OrdersProvider";
import { useDeliverables } from "@/components/DeliverablesProvider";
import { formatCash } from "@/lib/cash";
import { isActiveOrder, ORDER_PROGRESS, ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "@/lib/orders";

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

export function ActivePrograms({ confirmHref = "/mypage#confirm" }: { confirmHref?: string }) {
  const { orders } = useOrders();
  const { pendingCount } = useDeliverables();
  const active = orders.filter(isActiveOrder);

  return (
    <section
      aria-label="진행 중인 프로그램"
      className="rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-900 p-6 text-white shadow-xl sm:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold tracking-widest text-emerald-200">진행 중인 프로그램</p>
          <p className="mt-1 text-3xl font-extrabold sm:text-4xl">
            {active.length}
            <span className="ml-1 text-lg font-bold text-emerald-100">건</span>
          </p>
        </div>
        <Link
          href="/mypage#orders"
          className="inline-flex min-h-11 items-center rounded-xl bg-white/15 px-4 text-sm font-bold transition hover:bg-white/25"
        >
          전체 주문 내역 →
        </Link>
      </div>

      {pendingCount > 0 && (
        <Link
          href={confirmHref}
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-amber-400 px-5 py-4 text-base font-extrabold text-slate-900 shadow-md transition hover:bg-amber-300"
        >
          <span>
            <span aria-hidden="true">📋 </span>
            확인이 필요한 작업물 {pendingCount}건
          </span>
          <span aria-hidden="true">확인하기 →</span>
        </Link>
      )}

      {active.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-white/10 px-5 py-4 text-base text-emerald-50">
          아직 진행 중인 프로그램이 없어요. 아래에서 상품을 골라 바로 시작해 보세요.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {active.map((o) => (
            <li key={o.id} className="rounded-2xl bg-white p-5 text-slate-900 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-base font-bold leading-snug">
                  {o.productName}
                  {o.qty > 1 && <span className="ml-1 text-slate-400">×{o.qty.toLocaleString("ko-KR")}</span>}
                </p>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${ORDER_STATUS_STYLE[o.status]}`}>
                  {ORDER_STATUS_LABEL[o.status]}
                </span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={ORDER_PROGRESS[o.status]}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${ORDER_PROGRESS[o.status]}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {dateLabel(o.createdAt)} 주문 · {formatCash(o.amountCash)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
