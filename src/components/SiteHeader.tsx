"use client";

// Sticky top navigation. Shows login state from AuthProvider.

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { COMPANY } from "@/lib/company";

export function SiteHeader() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="safe-x mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-slate-900">
          <span className="text-xl">🌱</span>
          <span className="text-lg">{COMPANY.serviceName}</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          {/* Discovery links — always visible so visitors can explore before signup */}
          <Link
            href="/#services"
            className="hidden rounded-lg px-3 py-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:block"
          >
            서비스
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg px-3 py-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            상품·요금
          </Link>
          <Link
            href="/#reviews"
            className="hidden rounded-lg px-3 py-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:block"
          >
            고객후기
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                href="/mypage"
                className="rounded-lg px-3 py-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                마이페이지
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-3 py-2.5 text-slate-500 transition hover:text-slate-700"
                title={user?.email}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/start"
              className="rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              시작하기
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
