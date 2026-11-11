"use client";

// Admin main dashboard: what needs doing now, today's and this month's
// numbers (with estimated profit from the cost table), a 14-day trend,
// this month's sales by product, and the content schedule.

import { useCallback, useEffect, useState } from "react";
import { getAdminDashboard, monthProfit, type AdminDashboard } from "@/lib/adminDashboard";
import type { AdminTab } from "@/components/admin/tabs";
import type { ContentSummary } from "@/components/admin/AdminContent";
import { ChartFrame, ColumnChart, DEEMPH, Legend, SegmentedBar, seriesColor } from "@/components/charts";

export const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
export const wonRange = (a: number, b: number) => (a === b ? won(a) : `${won(a)} ~ ${won(b)}`);

function Card({ label, value, sub, tone = "slate" }: { label: string; value: string; sub?: React.ReactNode; tone?: "slate" | "emerald" | "amber" }) {
  const color = tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-slate-900";
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`num mt-1 font-extrabold ${value.includes("~") ? "text-base sm:text-lg" : "text-xl sm:text-2xl"} ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] leading-snug text-slate-400">{sub}</p>}
    </div>
  );
}

function Todo({ icon, label, count, onClick, urgent }: { icon: string; label: string; count: number; onClick: () => void; urgent?: boolean }) {
  const active = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm transition ${
        active
          ? urgent
            ? "bg-rose-50 text-rose-900 ring-1 ring-rose-200 hover:bg-rose-100"
            : "bg-amber-50 text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
          : "bg-white text-slate-400 ring-1 ring-slate-100 hover:bg-slate-50"
      }`}
    >
      <span className="flex items-center gap-2 font-semibold">
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>
      <span className="num text-lg font-extrabold">{count}</span>
    </button>
  );
}

/** Compact won for axis ticks: 0 / 5만 / 10만 / 1.5백만… */
const axisWon = (n: number) => (n >= 10_000 ? `${(n / 10_000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만` : n.toLocaleString("ko-KR"));

/** 14-day columns: order revenue and cash top-ups (same unit, one axis). */
function TrendChart({ days }: { days: AdminDashboard["daily"] }) {
  const total = days.reduce((s, d) => s + d.revenue, 0);
  return (
    <ChartFrame
      title="최근 14일 매출·충전"
      subtitle={`14일 주문 매출 합계 ${won(total)}`}
      legend={[
        { label: "주문 매출", color: seriesColor(0) },
        { label: "캐시 충전", color: seriesColor(1) },
      ]}
      table={{
        head: ["날짜", "주문 매출", "주문", "캐시 충전", "가입"],
        rows: days.map((d) => [d.date, won(d.revenue), `${d.orders}건`, won(d.charges), `${d.signups}명`]),
      }}
    >
      <ColumnChart
        categories={days.map((d) => d.date)}
        series={[
          { name: "주문 매출", values: days.map((d) => d.revenue) },
          { name: "캐시 충전", values: days.map((d) => d.charges) },
        ]}
        format={won}
        axisFormat={axisWon}
        tickEvery={2}
        shortLabel={(c) => c.slice(5).replace("-", "/")}
        extra={(i) => [`주문 ${days[i].orders}건 · 가입 ${days[i].signups}명`]}
      />
    </ChartFrame>
  );
}

export function AdminHome({ content, onGo }: { content: ContentSummary; onGo: (t: AdminTab) => void }) {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getAdminDashboard()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error)
    return (
      <div className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
        <b>대시보드를 불러오지 못했어요.</b> {error}{" "}
        <button type="button" onClick={load} className="font-semibold underline">
          다시 시도
        </button>
      </div>
    );
  if (!data) return <p className="mt-10 text-center text-sm text-slate-400">불러오는 중…</p>;

  const k = data.kpi;
  const profit = monthProfit(data.productsMonth);
  const uncosted = profit.revenue - profit.costedRevenue;
  const vsPrev = k.revenuePrevMonth > 0 ? Math.round(((k.revenueMonth - k.revenuePrevMonth) / k.revenuePrevMonth) * 100) : null;
  const todoTotal = k.ordersReceived + k.depositsPending + k.receiptsToIssue + k.inquiriesNew + k.deliverablesRevision;

  return (
    <div className="mt-6 space-y-6">
      {/* What needs doing now */}
      <section aria-labelledby="todo-h" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
        <h2 id="todo-h" className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          지금 처리할 일
          <span className={`rounded-full px-2 py-0.5 text-xs ${todoTotal ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
            {todoTotal ? `${todoTotal}건` : "모두 처리됨"}
          </span>
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Todo icon="🧾" label="새로 접수된 주문" count={k.ordersReceived} onClick={() => onGo("orders")} urgent />
          <Todo icon="🏦" label="입금 확인 대기" count={k.depositsPending} onClick={() => onGo("charges")} urgent />
          <Todo icon="💬" label="답변 대기 문의" count={k.inquiriesNew} onClick={() => onGo("inquiries")} urgent />
          <Todo icon="🧮" label="증빙(영수증·계산서) 발행" count={k.receiptsToIssue} onClick={() => onGo("charges")} />
          <Todo icon="⏳" label="진행 중 주문" count={k.ordersInProgress} onClick={() => onGo("orders")} />
          <Todo icon="✏️" label="산출물 수정 요청" count={k.deliverablesRevision} onClick={() => onGo("deliverables")} />
          <Todo icon="📦" label="산출물 고객 컨펌 대기" count={k.deliverablesWaiting} onClick={() => onGo("deliverables")} />
          <Todo icon="🔑" label="보관 중인 계정 비밀번호" count={k.secretsHeld} onClick={() => onGo("orders")} />
        </div>
        {k.secretsHeld > 0 && (
          <p className="mt-2 text-[11px] text-slate-400">계정 비밀번호는 해당 주문을 &lsquo;완료&rsquo; 또는 &lsquo;취소&rsquo;로 바꾸면 자동으로 지워져요.</p>
        )}
      </section>

      {/* Numbers */}
      <section aria-label="매출·회원 현황" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card label="오늘 주문 매출" value={won(k.revenueToday)} sub={`${k.ordersToday}건 · 충전 ${won(k.chargesToday)}`} />
        <Card
          label="이번 달 주문 매출"
          value={won(k.revenueMonth)}
          sub={`${k.ordersMonth}건${vsPrev == null ? "" : ` · 지난달 대비 ${vsPrev >= 0 ? "+" : ""}${vsPrev}%`}`}
        />
        <Card
          label="이번 달 예상 순이익"
          tone="emerald"
          value={profit.costedRevenue ? wonRange(profit.profitMin, profit.profitMax) : "-"}
          sub={
            <>
              실비 입력 상품 매출 {won(profit.costedRevenue)} 기준
              {uncosted > 0 && (
                <>
                  {" · "}
                  <button type="button" onClick={() => onGo("margins")} className="font-semibold text-amber-700 underline">
                    실비 미입력 {won(uncosted)}
                  </button>
                </>
              )}
            </>
          }
        />
        <Card label="이번 달 캐시 충전" value={won(k.chargesMonth)} sub="부가세 제외 적립 캐시 기준" />
        <Card label="회원" value={`${k.membersTotal.toLocaleString("ko-KR")}명`} sub={`오늘 +${k.membersToday} · 이번 달 +${k.membersMonth}`} />
        <Card label="고객 보유 캐시" tone="amber" value={won(k.cashOutstanding)} sub="아직 주문에 쓰지 않은 캐시 (환불 대상)" />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5 lg:col-span-3">
          <TrendChart days={data.daily} />
        </section>

        <section aria-labelledby="content-h" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5 lg:col-span-2">
          <h2 id="content-h" className="text-sm font-extrabold text-slate-900">콘텐츠 발행</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-center">
            {content.collections.map((c) => (
              <div key={c.name} className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold text-slate-500">{c.name}</dt>
                <dd className="num mt-1 text-lg font-extrabold text-slate-900">{c.published}편</dd>
                <dd className="text-[11px] text-slate-400">예약 {c.scheduled}편</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            {content.nextDate ? `다음 공개: ${content.nextDate} (${content.nextCount}편)` : "예약된 글이 없어요."}
          </p>
          <button type="button" onClick={() => onGo("content")} className="tap mt-2 text-xs font-semibold text-emerald-700 hover:underline">
            글 목록 보기 →
          </button>
        </section>
      </div>

      {/* This month by product */}
      <section aria-labelledby="prod-h" className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="prod-h" className="text-sm font-extrabold text-slate-900">이번 달 상품별 매출·예상 순이익</h2>
            <div className="mt-1.5">
              <Legend
                items={[
                  { label: "순이익", color: seriesColor(0) },
                  { label: "실비", color: DEEMPH },
                ]}
              />
            </div>
          </div>
          <button type="button" onClick={() => onGo("margins")} className="tap text-xs font-semibold text-emerald-700 hover:underline">
            실비 관리 →
          </button>
        </div>
        {data.productsMonth.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">이번 달 주문이 아직 없어요.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  {["상품", "주문", "수량", "매출", "매출 구성", "예상 순이익"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.productsMonth.slice(0, 12).map((p) => (
                  <tr key={p.name} className="border-t border-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                    <td className="num px-4 py-2.5 text-slate-600">{p.orders}건</td>
                    <td className="num px-4 py-2.5 text-slate-600">{p.qty.toLocaleString("ko-KR")}</td>
                    <td className="num px-4 py-2.5 font-semibold text-slate-800">{won(p.revenue)}</td>
                    <td className="w-32 px-4 py-2.5">
                      {p.hasCost ? (
                        <SegmentedBar
                          variant="thin"
                          label={`${p.name} 매출 구성 (실비는 범위의 중간값)`}
                          format={won}
                          parts={[
                            { label: "순이익", value: Math.max(0, p.revenue - ((p.costMin ?? 0) + (p.costMax ?? 0)) / 2), color: seriesColor(0) },
                            { label: "실비", value: ((p.costMin ?? 0) + (p.costMax ?? 0)) / 2, color: DEEMPH },
                          ]}
                        />
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td className="num px-4 py-2.5">
                      {p.hasCost ? (
                        <span className="font-semibold text-emerald-700">{wonRange(p.revenue - (p.costMax ?? 0), p.revenue - (p.costMin ?? 0))}</span>
                      ) : (
                        <span className="text-xs text-amber-700">실비 미입력</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-slate-50 px-5 py-2.5 text-[11px] text-slate-400">
          매출은 취소 제외 주문 금액(부가세 별도)이고, 순이익은 매출 − 실비(상품·마진 탭)로 계산한 추정치예요. 결제 수수료·인건비는 빠져 있어요.
        </p>
      </section>
    </div>
  );
}
