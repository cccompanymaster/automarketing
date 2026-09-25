// Result display building blocks. Every calculator renders: headline number,
// breakdown, formula, assumptions/limits and the date its reference values
// were checked. Nothing here formats raw numbers — callers pass strings from
// lib/calc/num so NaN/Infinity can never reach the screen.

import type { CalcResult } from "@/lib/calc/types";
import { isAssumed, type Sourced } from "@/lib/calc/rates";

type Tone = "default" | "good" | "bad" | "warn";

const TONE: Record<Tone, string> = {
  default: "text-slate-900",
  good: "text-emerald-700",
  bad: "text-rose-600",
  warn: "text-amber-600",
};

/** Renders the right state for a CalcResult; `children` gets the ok value. */
export function ResultPanel<T>({
  result,
  title = "계산 결과",
  emptyHint,
  children,
  impossibleExtra,
}: {
  result: CalcResult<T>;
  title?: string;
  /** Shown before required inputs are filled. */
  emptyHint?: string;
  children: (value: T, warnings: string[]) => React.ReactNode;
  /** Optional extra UI for the impossible state (e.g. partial numbers). */
  impossibleExtra?: (partial: Partial<T> | undefined) => React.ReactNode;
}) {
  return (
    <section aria-live="polite" aria-label={title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <div className="mt-4">
        {result.status === "empty" && (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-slate-600">
              {emptyHint ?? "필수 항목을 입력하면 결과가 바로 계산돼요."}
            </p>
            <p className="mt-1.5 text-xs text-slate-400">입력이 필요한 항목: {result.missing.join(", ")}</p>
          </div>
        )}
        {result.status === "invalid" && (
          <div role="alert" className="rounded-xl bg-rose-50 px-4 py-4 text-sm text-rose-700 ring-1 ring-rose-100">
            <p className="font-semibold">입력값을 확인해 주세요.</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
              {result.issues.map((i) => (
                <li key={i.field + i.message}>{i.message}</li>
              ))}
            </ul>
          </div>
        )}
        {result.status === "impossible" && (
          <div className="space-y-4">
            <div role="alert" className="rounded-xl bg-amber-50 px-4 py-4 text-sm text-amber-800 ring-1 ring-amber-100">
              <p className="font-bold">계산 결과를 낼 수 없는 조건이에요</p>
              <p className="mt-1 leading-relaxed">{result.reason}</p>
            </div>
            {impossibleExtra?.(result.partial)}
          </div>
        )}
        {result.status === "ok" && (
          <div className="space-y-5">
            {children(result.value, result.warnings)}
            <Warnings items={result.warnings} />
          </div>
        )}
      </div>
    </section>
  );
}

export function Headline({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="rounded-xl bg-emerald-50/60 px-4 py-4 ring-1 ring-emerald-100">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className={`num mt-1 text-3xl font-extrabold tracking-tight ${TONE[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function StatGrid({ items }: { items: { label: string; value: string; tone?: Tone; sub?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl bg-slate-50 px-3.5 py-3">
          <dt className="text-xs text-slate-500">{it.label}</dt>
          <dd className={`num mt-0.5 text-base font-bold ${TONE[it.tone ?? "default"]}`}>{it.value}</dd>
          {it.sub && <dd className="mt-0.5 text-[11px] text-slate-400">{it.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

export interface BreakdownRow {
  label: string;
  value: string;
  note?: string;
  /** Emphasize (totals). */
  strong?: boolean;
  /** Indent as a sub-item. */
  sub?: boolean;
  tone?: Tone;
}

export function Breakdown({ title = "세부 계산 내역", rows }: { title?: string; rows: BreakdownRow[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <table className="mt-2 w-full text-sm">
        <caption className="sr-only">{title}</caption>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={`${r.label}-${i}`} className={r.strong ? "font-bold" : ""}>
              <th scope="row" className={`py-2 pr-3 text-left font-normal text-slate-600 ${r.sub ? "pl-4 text-xs" : ""} ${r.strong ? "font-bold text-slate-900" : ""}`}>
                {r.label}
                {r.note && <span className="block text-[11px] font-normal text-slate-400">{r.note}</span>}
              </th>
              <td className={`num py-2 text-right ${TONE[r.tone ?? "default"]} ${r.sub ? "text-xs" : ""}`}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Formula lines — e.g. "필요 판매가 = 원가 ÷ (1 − 목표 마진율)". */
export function Formula({ lines, title = "적용 공식" }: { lines: string[]; title?: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <div className="mt-2 space-y-1 rounded-xl bg-slate-900 px-4 py-3 text-[13px] leading-relaxed text-emerald-100">
        {lines.map((l, i) => (
          <p key={`${i}-${l}`} className="num break-keep">
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Assumptions & limits, plus the reference values' source and check date. */
export function Assumptions({
  items,
  sources = [],
  checkedAt,
}: {
  items: string[];
  sources?: Sourced<unknown>[];
  /** For calculators with no external rates: date the logic was reviewed. */
  checkedAt?: string;
}) {
  const dates = sources.map((s) => s.checkedAt);
  const date = dates.length ? dates.sort()[0] : checkedAt;
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3.5 text-xs leading-relaxed text-slate-500">
      <h3 className="text-sm font-bold text-slate-700">가정과 한계</h3>
      <ul className="mt-1.5 list-disc space-y-1 pl-4">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      {sources.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-slate-200 pt-2.5">
          {sources.map((s) => (
            <li key={s.source}>
              {isAssumed(s) && (
                <span className="mr-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700">가정값</span>
              )}
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-700">
                  {s.source}
                </a>
              ) : (
                s.source
              )}
              {s.effective && <span className="text-slate-400"> · 적용 {s.effective}</span>}
              {s.note && <span className="block text-slate-400">{s.note}</span>}
            </li>
          ))}
        </ul>
      )}
      {date && <p className="mt-2.5 font-semibold text-slate-600">기준값 확인일: {date}</p>}
    </div>
  );
}

export function Warnings({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((w) => (
        <li key={w} className="flex gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-100">
          <span aria-hidden="true">⚠️</span>
          <span>
            <span className="sr-only">주의: </span>
            {w}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Two-column layout: inputs left, sticky result right on desktop. */
export function CalcColumns({ inputs, result }: { inputs: React.ReactNode; result: React.ReactNode }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      {/* min-w-0: let wide tables scroll inside their box instead of widening the page */}
      <div className="min-w-0 space-y-5">{inputs}</div>
      <div className="min-w-0 space-y-5 lg:sticky lg:top-6">{result}</div>
    </div>
  );
}
