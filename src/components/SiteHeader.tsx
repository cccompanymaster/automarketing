"use client";

// Left "wing" navigation (replaces the old top bar entirely).
// - Desktop (lg+): a floating vertical dock pinned to the left edge, icons at
//   rest, labels unfold to the right on hover (wing style).
// - Mobile: a floating top-left button opens a slide-in drawer from the left.
// Kept as `SiteHeader` so every page keeps working unchanged.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { isAdminUser } from "@/lib/admin";
import { COMPANY } from "@/lib/company";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: "🏠", label: "홈" },
  { href: "/#services", icon: "🧩", label: "전체 서비스" },
  { href: "/pricing", icon: "💰", label: "상품·요금" },
  { href: "/#reviews", icon: "💬", label: "고객후기" },
  { href: "/tools/blog-writer", icon: "📝", label: "AI 원고" },
];

export function SiteHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = isAdminUser(user);

  // Close the drawer on route change and lock scroll while open.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close on nav
    setOpen(false);
  }, [pathname]);

  // Reserve space for the always-open wing on desktop (pages have no shared
  // wrapper, so the offset lives on <body> — see globals.css .has-wing).
  useEffect(() => {
    document.body.classList.add("has-wing");
    return () => document.body.classList.remove("has-wing");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const authItems: NavItem[] = isAuthenticated
    ? [
        { href: "/mypage", icon: "👤", label: "마이페이지" },
        ...(isAdmin ? [{ href: "/admin", icon: "🛠️", label: "관리자" }] : []),
      ]
    : [];

  return (
    <>
      {/* ===== Desktop: floating left wing dock ===== */}
      <nav
        aria-label="주 메뉴"
        className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
      >
        <div className="flex w-52 flex-col gap-1 rounded-2xl border border-slate-100 bg-white/95 p-2 shadow-xl backdrop-blur">
          {/* Brand */}
          <Link
            href="/"
            className="flex h-10 items-center gap-3 rounded-xl px-2 font-extrabold text-slate-900 transition hover:bg-emerald-50"
          >
            <span className="shrink-0 text-xl" aria-hidden="true">🌱</span>
            <span className="whitespace-nowrap text-sm">
              {COMPANY.serviceName}
            </span>
          </Link>

          <div className="mx-2 my-1 h-px bg-slate-100" aria-hidden="true" />

          {[...NAV_ITEMS, ...authItems].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-10 items-center gap-3 rounded-xl px-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="w-6 shrink-0 text-center text-lg" aria-hidden="true">
                {item.icon}
              </span>
              <span className="whitespace-nowrap text-sm font-semibold">
                {item.label}
              </span>
            </Link>
          ))}

          <div className="mx-2 my-1 h-px bg-slate-100" aria-hidden="true" />

          {isAuthenticated ? (
            <button
              type="button"
              onClick={logout}
              title={user?.email}
              className="flex h-10 items-center gap-3 rounded-xl px-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <span className="w-6 shrink-0 text-center text-lg" aria-hidden="true">🚪</span>
              <span className="whitespace-nowrap text-sm font-semibold">
                로그아웃
              </span>
            </button>
          ) : (
            <Link
              href="/start"
              className="flex h-11 items-center gap-3 rounded-xl bg-emerald-700 px-2 text-white transition hover:bg-emerald-800"
            >
              <span className="w-6 shrink-0 text-center text-lg" aria-hidden="true">🚀</span>
              <span className="whitespace-nowrap text-sm font-bold">
                시작하기
              </span>
            </Link>
          )}
        </div>
      </nav>

      {/* ===== Mobile: floating menu button ===== */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        className="fixed left-4 top-4 z-40 flex h-12 items-center gap-2 rounded-2xl border border-slate-100 bg-white/90 px-3.5 shadow-lg backdrop-blur transition hover:shadow-xl lg:hidden"
      >
        <span className="text-lg" aria-hidden="true">🌱</span>
        <span className="flex flex-col gap-[5px]" aria-hidden="true">
          <span className="h-0.5 w-5 rounded bg-slate-800" />
          <span className="h-0.5 w-5 rounded bg-slate-800" />
          <span className="h-0.5 w-3.5 rounded bg-slate-800" />
        </span>
      </button>

      {/* ===== Mobile: left slide-in drawer ===== */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="메뉴"
        >
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-extrabold text-slate-900">
                <span className="text-xl" aria-hidden="true">🌱</span>
                <span>{COMPANY.serviceName}</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
              {[...NAV_ITEMS, ...authItems].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="w-7 text-center text-xl" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                🚪 로그아웃
              </button>
            ) : (
              <Link
                href="/start"
                onClick={() => setOpen(false)}
                className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                🚀 3분만에 시작하기
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
