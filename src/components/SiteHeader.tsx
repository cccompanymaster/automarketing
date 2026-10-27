"use client";

// Left "wing" navigation (replaces the old top bar entirely).
// - Desktop (lg+): a full-height sidebar on the left edge with large labels.
// - Mobile: a floating top-right button opens a slide-in drawer.
// Members also get the right wing dashboard (cash · programs · status).
// Kept as `SiteHeader` so every page keeps working unchanged.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { useOrders } from "@/components/OrdersProvider";
import { useDeliverables } from "@/components/DeliverablesProvider";
import { RightWing } from "@/components/RightWing";
import { isActiveOrder } from "@/lib/orders";
import { isAdminUser } from "@/lib/admin";
import { COMPANY } from "@/lib/company";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

// Public items — visible to everyone.
const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: "🏠", label: "홈" },
  { href: "/#services", icon: "🧩", label: "전체 서비스" },
  { href: "/tools/", icon: "🧮", label: "무료 계산기" },
  { href: "/blog/", icon: "📰", label: "사장님 블로그" },
  { href: "/#reviews", icon: "💬", label: "고객후기" },
  { href: "/#faq", icon: "❓", label: "자주 묻는 질문" },
  { href: "/tools/blog-writer", icon: "📝", label: "AI 원고" },
];

export function SiteHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = isAdminUser(user);
  const { balance } = useWallet();
  const { orders } = useOrders();
  const { pendingCount } = useDeliverables();
  const activeCount = orders.filter(isActiveOrder).length;

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

  // Members-only items, listed first — the full rate card lives behind signup.
  const authItems: NavItem[] = [
    { href: "/pricing", icon: "💰", label: "상품 주문" },
    { href: "/mypage", icon: "👤", label: "마이페이지" },
    ...(isAdmin ? [{ href: "/admin", icon: "🛠️", label: "관리자" }] : []),
  ];
  // Members land on their own home (programs + products), so the landing's
  // story anchors are guest-only.
  const navItems = isAuthenticated
    ? NAV_ITEMS.filter((it) => !["/#reviews", "/#faq", "/#services"].includes(it.href)).map((it) =>
        it.href === "/" ? { ...it, label: "내 홈" } : it,
      )
    : NAV_ITEMS;

  return (
    <>
      {/* ===== Desktop: full-height left wing ===== */}
      <nav
        aria-label="주 메뉴"
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto border-r border-slate-100 bg-white px-3 py-5 lg:flex"
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex h-14 items-center gap-3 rounded-xl px-3 font-extrabold text-slate-900 transition hover:bg-emerald-50"
        >
          <span className="shrink-0 text-2xl" aria-hidden="true">🌱</span>
          <span className="whitespace-nowrap text-xl">{COMPANY.serviceName}</span>
        </Link>

        <div className="mx-3 my-3 h-px bg-slate-100" aria-hidden="true" />

        <div className="flex flex-1 flex-col gap-1">
          {[...(isAuthenticated ? authItems : []), ...navItems].map((item) => {
            const current = item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-[17px] font-semibold transition ${
                  current ? "bg-emerald-50 text-emerald-800" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="w-7 shrink-0 text-center text-xl" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}

          <a
            href={COMPANY.kakaoChatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-[17px] font-semibold text-slate-700 transition hover:bg-[#FEE500]/40"
          >
            <span className="w-7 shrink-0 text-center text-xl" aria-hidden="true">💬</span>
            <span className="whitespace-nowrap">카카오톡 상담</span>
          </a>
        </div>

        <div className="mx-3 my-3 h-px bg-slate-100" aria-hidden="true" />

        {isAuthenticated ? (
          <button
            type="button"
            onClick={logout}
            title={user?.email}
            className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <span className="w-7 shrink-0 text-center text-xl" aria-hidden="true">🚪</span>
            <span className="whitespace-nowrap">로그아웃</span>
          </button>
        ) : (
          <Link
            href="/start"
            className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 text-lg font-bold text-white transition hover:bg-emerald-800"
          >
            <span aria-hidden="true">🚀</span>
            시작하기
          </Link>
        )}
      </nav>

      <RightWing />

      {/* ===== Mobile: floating menu button =====
          Top-RIGHT: every page's heading and back link sit top-left, so a
          left button covered them. Clears the notch via safe-area insets. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        className="fixed right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-40 flex h-12 items-center gap-2 rounded-2xl border border-slate-100 bg-white/90 px-3.5 shadow-lg backdrop-blur transition hover:shadow-xl lg:hidden"
      >
        <span className="text-lg" aria-hidden="true">🌱</span>
        <span className="flex flex-col gap-[5px]" aria-hidden="true">
          <span className="h-0.5 w-5 rounded bg-slate-800" />
          <span className="h-0.5 w-5 rounded bg-slate-800" />
          <span className="h-0.5 w-3.5 rounded bg-slate-800" />
        </span>
      </button>

      {/* ===== Mobile: slide-in drawer (from the right, next to its button) ===== */}
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
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-white p-5 pt-[max(1.25rem,env(safe-area-inset-top))] shadow-2xl">
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

            {isAuthenticated && (
              <Link
                href="/mypage"
                onClick={() => setOpen(false)}
                className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-emerald-50 p-3 text-center"
              >
                <span>
                  <span className="block text-[11px] font-semibold text-emerald-800">내 캐시</span>
                  <span className="block text-base font-extrabold text-slate-900">{balance.toLocaleString("ko-KR")}</span>
                </span>
                <span>
                  <span className="block text-[11px] font-semibold text-emerald-800">진행중</span>
                  <span className="block text-base font-extrabold text-slate-900">{activeCount}건</span>
                </span>
                <span className={pendingCount > 0 ? "rounded-xl bg-amber-200" : ""}>
                  <span className="block text-[11px] font-semibold text-emerald-800">컨펌 대기</span>
                  <span className="block text-base font-extrabold text-slate-900">{pendingCount}건</span>
                </span>
              </Link>
            )}

            <div className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
              {[...(isAuthenticated ? authItems : []), ...navItems].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-[17px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="w-7 text-center text-xl" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <a
                href={COMPANY.kakaoChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-[17px] font-semibold text-slate-700 transition hover:bg-[#FEE500]/40"
              >
                <span className="w-7 text-center text-xl" aria-hidden="true">💬</span>
                카카오톡 상담
              </a>
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
