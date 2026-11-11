"use client";

// Chart container: title, legend (for ≥ 2 series), the chart, and a
// "표로 보기" toggle that swaps in the table twin — every value stays
// reachable without hovering.

import { useId, useState } from "react";

export interface LegendItem {
  label: string;
  color: string;
  /** Mirrors the mark: rect for bars/segments, line for lines. */
  shape?: "rect" | "line";
}

export function Legend({ items }: { items: LegendItem[] }) {
  if (items.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600" aria-label="범례">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={it.shape === "line" ? "h-0.5 w-3 rounded-full" : "h-2.5 w-2.5 rounded-[3px]"}
            style={{ background: it.color }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartFrame({
  title,
  subtitle,
  legend,
  table,
  children,
  className = "",
}: {
  title: string;
  subtitle?: React.ReactNode;
  legend?: LegendItem[];
  /** Header row + body rows of the table view (already formatted). */
  table: { head: string[]; rows: (string | number)[][] };
  children: React.ReactNode;
  className?: string;
}) {
  const [asTable, setAsTable] = useState(false);
  const id = useId();
  return (
    <figure className={className} aria-labelledby={`${id}-t`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <figcaption id={`${id}-t`} className="text-sm font-extrabold text-slate-900">
            {title}
          </figcaption>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
          className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 hover:text-emerald-700 hover:ring-emerald-200"
        >
          {asTable ? "차트로 보기" : "표로 보기"}
        </button>
      </div>
      {legend && !asTable && (
        <div className="mt-2">
          <Legend items={legend} />
        </div>
      )}
      <div className="mt-3">
        {asTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500">
                  {table.head.map((h, i) => (
                    <th key={h} scope="col" className={`border-b border-slate-200 px-2 py-1.5 font-semibold ${i > 0 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, ri) => (
                  <tr key={ri} className="border-b border-slate-100 last:border-0">
                    {r.map((c, ci) => (
                      <td key={ci} className={`px-2 py-1.5 ${ci > 0 ? "text-right tabular-nums text-slate-800" : "text-slate-600"}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </figure>
  );
}
