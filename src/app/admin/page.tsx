"use client";

// Admin-only dashboard. Visible only to users in the NEXT_PUBLIC_ADMIN_EMAILS
// allowlist; everyone else is redirected. The allowlist check here only hides
// the UI — real data protection must be enforced server-side (see lib/admin.ts).
// TODO(backend): wire getAdminOverview() to Supabase admin queries.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatCash } from "@/lib/cash";
import {
  getAdminOverview,
  isAdminUser,
  isAdminBackendConfigured,
  ORDER_STATUS_LABEL,
  type AdminOverview,
  type OrderStatus,
} from "@/lib/admin";

const STATUS_STYLE: Record<OrderStatus, string> = {
  received: "bg-sky-50 text-sky-700",
  in_progress: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
  canceled: "bg-slate-100 text-slate-500",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated } = useAuth();
  const isAdmin = isAdminUser(user);
  const [data, setData] = useState<AdminOverview | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace("/start");
      return;
    }
    if (!isAdmin) {
      router.replace("/mypage");
    }
  }, [hydrated, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (hydrated && isAuthenticated && isAdmin) {
      void getAdminOverview().then(setData);
    }
  }, [hydrated, isAuthenticated, isAdmin]);

  if (!hydrated || !isAuthenticated || !isAdmin) return null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 py-12">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">관리자 대시보드</h1>
              <p className="mt-2 text-sm text-slate-500">
                회원·주문·충전 현황을 한눈에 확인합니다. ({user?.email})
              </p>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              ADMIN
            </span>
          </header>

          {!isAdminBackendConfigured && (
            <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-center text-xs text-amber-700">
              현재 <b>데모 데이터</b>입니다. 백엔드(Supabase) 연결 시 실제 회원·주문·충전 데이터로 자동 전환됩니다.
            </div>
          )}

          {!data ? (
            <p className="mt-10 text-center text-sm text-slate-400">불러오는 중…</p>
          ) : (
            <>
              {/* Summary metrics */}
              <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Metric label="전체 회원" value={data.metrics.members.toLocaleString("ko-KR")} unit="명" />
                <Metric label="오늘 주문" value={data.metrics.ordersToday.toLocaleString("ko-KR")} unit="건" />
                <Metric label="오늘 충전" value={formatCash(data.metrics.chargeCashToday)} />
                <Metric
                  label="처리 대기"
                  value={data.metrics.pendingOrders.toLocaleString("ko-KR")}
                  unit="건"
                  highlight
                />
              </section>

              {/* Recent orders */}
              <Panel title="최근 주문">
                <Table head={["주문", "회원", "금액", "상태", "시각"]}>
                  {data.recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-slate-50">
                      <td className="px-3 py-3 font-medium text-slate-800">{o.productName}</td>
                      <td className="px-3 py-3 text-slate-500">{o.userEmail}</td>
                      <td className="px-3 py-3 font-semibold tabular-nums text-slate-700">
                        {formatCash(o.amountCash)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[o.status]}`}
                        >
                          {ORDER_STATUS_LABEL[o.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{fmtDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </Table>
              </Panel>

              {/* Recent charges */}
              <Panel title="최근 충전">
                <Table head={["회원", "금액", "수단", "시각"]}>
                  {data.recentCharges.map((c) => (
                    <tr key={c.id} className="border-t border-slate-50">
                      <td className="px-3 py-3 text-slate-500">{c.userEmail}</td>
                      <td className="px-3 py-3 font-semibold tabular-nums text-emerald-600">
                        +{formatCash(c.amountCash)}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{c.method}</td>
                      <td className="px-3 py-3 text-xs text-slate-400">{fmtDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </Table>
              </Panel>

              {/* Members */}
              <Panel title="회원">
                <Table head={["이메일", "가입수단", "보유 캐시", "가입일"]}>
                  {data.members.map((m) => (
                    <tr key={m.id} className="border-t border-slate-50">
                      <td className="px-3 py-3 font-medium text-slate-800">{m.email}</td>
                      <td className="px-3 py-3 text-slate-500">
                        {m.provider === "kakao" ? "카카오" : "이메일"}
                      </td>
                      <td className="px-3 py-3 font-semibold tabular-nums text-slate-700">
                        {formatCash(m.balance)}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{fmtDate(m.joinedAt)}</td>
                    </tr>
                  ))}
                </Table>
              </Panel>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Metric({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${highlight ? "text-amber-600" : "text-slate-900"}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-slate-400">{unit}</span>}
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-5 py-4 text-base font-bold text-slate-900">
        {title}
      </h2>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full min-w-[34rem] text-left text-sm">
      <thead>
        <tr className="text-xs text-slate-400">
          {head.map((h) => (
            <th key={h} className="px-3 py-2.5 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
