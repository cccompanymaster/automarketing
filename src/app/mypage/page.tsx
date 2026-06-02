"use client";

// Minimal logged-in skeleton. Redirects to /start when not authenticated.
// TODO(backend): populate with real account data, campaigns, refunds, etc.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PRODUCT_LIST } from "@/lib/products";

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/start");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <h1 className="text-2xl font-bold text-slate-900">마이페이지</h1>
          <p className="mt-2 text-sm text-slate-500">
            {user?.name ? `${user.name}님, ` : ""}환영합니다. ({user?.email})
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PRODUCT_LIST.map((p) => (
              <div
                key={p.slug}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {p.icon}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{p.name}</h2>
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
