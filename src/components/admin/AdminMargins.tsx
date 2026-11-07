"use client";

// 상품·마진: every product row with its price, per-unit cost (실비) and
// profit. Costs are read from / saved to the admin-only product_costs table;
// a range (예: 3,000~5,000원) is kept as min/max.

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listProductCosts, marginRows, setProductCost, type MarginRow, type ProductCost } from "@/lib/adminDashboard";
import { won, wonRange } from "@/components/admin/AdminHome";

const pct = (r: number) => `${Math.round(r * 100)}%`;
const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.round(Number(v.replace(/[^\d]/g, "")))));

function CostEditor({ row, onSaved }: { row: MarginRow; onSaved: () => void }) {
  const [min, setMin] = useState(row.cost ? String(row.cost.costMin) : "");
  const [max, setMax] = useState(row.cost && row.cost.costMax !== row.cost.costMin ? String(row.cost.costMax) : "");
  const [note, setNote] = useState(row.cost?.note ?? "");
  const [busy, setBusy] = useState(false);

  const save = async (clear = false) => {
    const a = clear ? null : num(min);
    const b = clear ? null : (num(max) ?? a);
    if (!clear && a == null) return toast.error("실비를 입력해 주세요.");
    setBusy(true);
    try {
      await setProductCost(row.name, a, b, note);
      toast.success(clear ? "실비를 지웠어요." : "실비를 저장했어요.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  const input = "h-9 w-24 rounded-lg border border-slate-200 px-2 text-right text-sm tabular-nums outline-none focus:border-emerald-500";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input aria-label={`${row.name} 실비 최소`} inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="실비" className={input} />
      <span className="text-slate-400">~</span>
      <input aria-label={`${row.name} 실비 최대`} inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="(최대)" className={input} />
      <input aria-label={`${row.name} 메모`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="메모 (매입처 등)" className="h-9 w-36 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-emerald-500" />
      <button type="button" disabled={busy} onClick={() => void save()} className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
        저장
      </button>
      {row.cost && (
        <button type="button" disabled={busy} onClick={() => void save(true)} className="h-9 rounded-lg px-2 text-xs text-slate-400 hover:text-rose-600 disabled:opacity-60">
          지우기
        </button>
      )}
    </div>
  );
}

export function AdminMargins() {
  const [costs, setCosts] = useState<ProductCost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(() => {
    listProductCosts()
      .then((c) => {
        setCosts(c);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => (costs ? marginRows(costs) : []), [costs]);
  const shown = rows.filter((r) => (!onlyMissing || (!r.cost && r.price != null)) && (!query.trim() || r.name.includes(query.trim()) || r.group.includes(query.trim())));
  const groups = [...new Set(shown.map((r) => r.group))];
  const priced = rows.filter((r) => r.price != null);
  const withCost = priced.filter((r) => r.cost);

  if (error) return <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!costs) return <p className="mt-10 text-center text-sm text-slate-400">불러오는 중…</p>;

  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
        <h2 className="text-sm font-extrabold text-slate-900">상품·단가·실비·순이익</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          판매가는 사이트 단가표(부가세 별도), 실비는 1단위(1건·1명 등)당 매입 비용이에요. 범위로 입력하면 순이익도 범위로 보여요. 실비는 관리자만 볼 수 있게 DB에 저장되고 사이트 코드에는 들어가지 않아요.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            실비 입력 {withCost.length} / {priced.length}개 상품
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상품·분류 검색"
            aria-label="상품 검색"
            className="h-9 w-44 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
          />
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
            실비 미입력만
          </label>
        </div>
      </section>

      {groups.map((g) => (
        <section key={g} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <h3 className="border-b border-slate-100 px-5 py-3 text-sm font-extrabold text-slate-900">{g}</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  {["상품", "판매가", "실비", "순이익", "마진율", ""].map((h, i) => (
                    <th key={i} scope="col" className="px-4 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown
                  .filter((r) => r.group === g)
                  .map((r) => (
                    <tr key={r.name} className="border-t border-slate-50 align-top">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-slate-800">{r.name}</p>
                        {r.cost?.note && <p className="text-[11px] text-slate-400">{r.cost.note}</p>}
                        {editing === r.name && (
                          <div className="mt-2">
                            <CostEditor
                              row={r}
                              onSaved={() => {
                                setEditing(null);
                                load();
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="num whitespace-nowrap px-4 py-2.5 text-slate-700">
                        {r.price == null ? <span className="text-amber-700">견적</span> : won(r.price)}
                        {r.unit && <span className="ml-1 text-[11px] text-slate-400">/ {r.unit}</span>}
                      </td>
                      <td className="num whitespace-nowrap px-4 py-2.5 text-slate-600">
                        {r.cost ? wonRange(r.cost.costMin, r.cost.costMax) : <span className="text-xs text-slate-300">미입력</span>}
                      </td>
                      <td className="num whitespace-nowrap px-4 py-2.5 font-semibold">
                        {r.profitMin != null ? (
                          <span className={r.profitMin < 0 ? "text-rose-600" : "text-emerald-700"}>{wonRange(r.profitMin, r.profitMax!)}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="num whitespace-nowrap px-4 py-2.5 text-slate-600">
                        {r.marginMin != null ? (r.marginMin === r.marginMax ? pct(r.marginMin) : `${pct(r.marginMin)}~${pct(r.marginMax!)}`) : "-"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {r.price != null && (
                          <button
                            type="button"
                            onClick={() => setEditing(editing === r.name ? null : r.name)}
                            className="whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-emerald-300"
                          >
                            {editing === r.name ? "닫기" : r.cost ? "수정" : "실비 입력"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
