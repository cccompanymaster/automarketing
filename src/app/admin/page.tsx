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
  updateOrderStatus,
  type AdminOverview,
} from "@/lib/admin";
import { ORDER_STATUS_LABEL, ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { toast } from "sonner";
import {
  adminListDeliverables,
  adminUploadDeliverable,
  DELIVERABLE_STATUS_LABEL,
  DELIVERABLE_STATUS_STYLE,
  type Deliverable,
} from "@/lib/deliverables";

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

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    // Optimistic local update; persistence is a backend TODO (see lib/admin.ts).
    setData(
      (prev) =>
        prev && {
          ...prev,
          recentOrders: prev.recentOrders.map((o) =>
            o.id === orderId ? { ...o, status } : o,
          ),
        },
    );
    try {
      await updateOrderStatus(orderId, status);
    } catch {
      /* demo no-op */
    }
  };

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

              {/* Deliverable upload + confirmation status */}
              <DeliverablesPanel />

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
                        <select
                          value={o.status}
                          onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                          aria-label="주문 상태 변경"
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {ORDER_STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
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

// Upload work output (e.g. a ghost-written draft) to a member for confirmation,
// and track review states. Stub mode stores rows in this browser's localStorage
// (upload to your own email to demo the member view on /mypage).
function DeliverablesPanel() {
  const [rows, setRows] = useState<Deliverable[]>([]);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => adminListDeliverables().then(setRows).catch(() => {});

  useEffect(() => {
    void load();
  }, []);

  const upload = async () => {
    if (!email.trim() || !title.trim() || !content.trim()) {
      toast.error("고객 이메일, 제목, 내용을 모두 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      await adminUploadDeliverable({ userEmail: email, title, content });
      toast.success("업로드 완료 — 고객에게 컨펌 요청이 전달됐어요.");
      setTitle("");
      setContent("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "업로드에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-5 py-4 text-base font-bold text-slate-900">
        자료 업로드 · 고객 컨펌
      </h2>
      <div className="grid gap-6 p-5 lg:grid-cols-2">
        {/* Upload form */}
        <div>
          <p className="text-xs text-slate-500">
            원고 대필 등 작업 결과를 올리면 해당 고객의 마이페이지에 <b>컨펌 요청</b>으로 표시됩니다.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="dlv-email" className="text-xs font-semibold text-slate-500">
                고객 이메일
              </label>
              <input
                id="dlv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              />
            </div>
            <div>
              <label htmlFor="dlv-title" className="text-xs font-semibold text-slate-500">
                제목
              </label>
              <input
                id="dlv-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) [원고 대필] ○○카페 보도자료 초안 v1"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              />
            </div>
            <div>
              <label htmlFor="dlv-content" className="text-xs font-semibold text-slate-500">
                내용 (원고 본문)
              </label>
              <textarea
                id="dlv-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={7}
                placeholder="고객이 확인할 원고/자료 내용을 붙여넣으세요."
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              />
            </div>
            <button
              type="button"
              onClick={upload}
              disabled={busy}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? "업로드 중…" : "업로드하고 컨펌 요청 보내기"}
            </button>
          </div>
        </div>

        {/* Review status list */}
        <div>
          <p className="text-xs font-semibold text-slate-500">컨펌 현황 ({rows.length})</p>
          {rows.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              아직 업로드한 자료가 없습니다.
            </p>
          ) : (
            <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
              {rows.map((d) => (
                <li key={d.id} className="rounded-xl border border-slate-100 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold text-slate-800">{d.title}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${DELIVERABLE_STATUS_STYLE[d.status]}`}
                    >
                      {DELIVERABLE_STATUS_LABEL[d.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {d.userEmail} · {fmtDate(d.createdAt)}
                  </p>
                  {d.status === "revision_requested" && d.feedback && (
                    <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
                      요청: {d.feedback}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
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
