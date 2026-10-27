"use client";

// Member home ("/" after login): programs in progress first, then the full
// product list. The storytelling landing is for guests only.

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { ActivePrograms } from "@/components/ActivePrograms";
import { ServicesGrid } from "@/components/ServicesGrid";
import { LANDING_CARDS } from "@/lib/products";

export function MemberHome() {
  const { user } = useAuth();
  const { balance } = useWallet();

  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 lg:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {user?.name ? `${user.name} 사장님` : "사장님"}, 오늘도 힘내세요
          </h1>
          {/* The right wing shows cash on xl; smaller screens get it here. */}
          <Link
            href="/mypage"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-100 xl:hidden"
          >
            내 캐시 <span className="text-emerald-700">{balance.toLocaleString("ko-KR")}</span>
          </Link>
        </div>

        <div className="mt-6">
          <ActivePrograms />
        </div>

        <section id="services" className="mt-14 scroll-mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">전체 상품</h2>
              <p className="mt-2 text-base text-slate-600">상품을 눌러 설명을 보고, 그 자리에서 바로 주문하세요.</p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex min-h-12 items-center rounded-xl bg-emerald-700 px-6 text-base font-bold text-white shadow-md transition hover:bg-emerald-800"
            >
              전체 단가표에서 주문 →
            </Link>
          </div>
          <ServicesGrid cards={LANDING_CARDS} />
        </section>
      </div>
    </main>
  );
}
