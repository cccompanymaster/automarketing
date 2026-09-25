// Result pieces shared by the delivery calculators: ranking cards and the
// platform-by-platform comparison table. Values are formatted with lib/calc/num
// so NaN/Infinity never reach the screen.

import type { PlatformOrder } from "@/lib/calc/delivery";
import { formatPercent, formatWon } from "@/lib/calc/num";

export function DeliveryRankList({ orders, monthlyOrders }: { orders: PlatformOrder[]; monthlyOrders: number | null }) {
  const max = Math.max(...orders.map((o) => Math.abs(o.profit)), 1);
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800">수익 순위</h3>
      <ol className="mt-2 space-y-2">
        {orders.map((o, i) => (
          <li key={o.key} className={`rounded-xl px-3.5 py-3 ring-1 ${i === 0 ? "bg-emerald-50/70 ring-emerald-200" : "bg-white ring-slate-100"}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900">
                <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${i === 0 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {i + 1}
                </span>
                <span className="truncate">{o.label}</span>
                {o.agencyMissing && <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700">대행료 미입력</span>}
              </p>
              <p className={`num shrink-0 text-base font-extrabold ${o.profit < 0 ? "text-rose-600" : "text-slate-900"}`}>{formatWon(o.profit)}</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <div
                className={`h-full rounded-full ${o.profit < 0 ? "bg-rose-400" : i === 0 ? "bg-emerald-500" : "bg-slate-400"}`}
                style={{ width: `${Math.max(2, (Math.abs(o.profit) / max) * 100)}%` }}
              />
            </div>
            <p className="num mt-1.5 text-xs text-slate-500">
              수익률 {formatPercent(o.margin)} · 입금 {formatWon(o.deposit)} · 수수료·배달비 {formatWon(o.platformCost)}
              {monthlyOrders != null && ` · 월 ${formatWon(o.profit * monthlyOrders)}`}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

type Row = { label: string; get: (o: PlatformOrder) => string; strong?: boolean; show?: (os: PlatformOrder[]) => boolean };

const ROWS: Row[] = [
  { label: "정산 기준 매출", get: (o) => formatWon(o.settlementBase) },
  { label: "중개수수료", get: (o) => `${formatWon(o.commission)} (${formatPercent(o.commissionRate, 2)})` },
  { label: "결제수수료", get: (o) => `${formatWon(o.payment)} (${formatPercent(o.paymentRate, 2)})` },
  { label: "업주 배달비", get: (o) => (o.kind === "platformDelivery" ? formatWon(o.ownerDeliveryFee) : "—"), show: (os) => os.some((o) => o.kind === "platformDelivery") },
  { label: "수수료 부가세", get: (o) => formatWon(o.feeVat) },
  { label: "통장 입금액", get: (o) => formatWon(o.deposit), strong: true },
  { label: "원가", get: (o) => formatWon(o.cost) },
  { label: "포장비", get: (o) => formatWon(o.packaging) },
  { label: "광고비 (주문당)", get: (o) => formatWon(o.adPerOrder) },
  { label: "외부 대행료", get: (o) => (o.kind === "storeDelivery" ? formatWon(o.agencyFee) : "—"), show: (os) => os.some((o) => o.kind === "storeDelivery") },
  { label: "주문당 이익", get: (o) => formatWon(o.profit), strong: true },
  { label: "수익률", get: (o) => formatPercent(o.margin) },
];

export function DeliveryCompareTable({ orders, monthlyOrders }: { orders: PlatformOrder[]; monthlyOrders: number | null }) {
  const rows = ROWS.filter((r) => !r.show || r.show(orders));
  if (monthlyOrders != null) rows.push({ label: "월 이익", get: (o) => formatWon(o.profit * monthlyOrders), strong: true });
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800">상세 비교표 (주문 1건)</h3>
      <div className="mt-2 overflow-x-auto rounded-xl ring-1 ring-slate-100">
        <table className="w-full min-w-[520px] text-xs">
          <caption className="sr-only">앱별 주문 1건 정산 비교</caption>
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="sticky left-0 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">
                항목
              </th>
              {orders.map((o) => (
                <th key={o.key} scope="col" className="px-3 py-2 text-right font-bold text-slate-800">
                  {o.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.label} className={r.strong ? "font-bold text-slate-900" : "text-slate-600"}>
                <th scope="row" className="sticky left-0 bg-white px-3 py-2 text-left font-normal">
                  {r.label}
                </th>
                {orders.map((o) => (
                  <td key={o.key} className="num whitespace-nowrap px-3 py-2 text-right">
                    {r.get(o)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
