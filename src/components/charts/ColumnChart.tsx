"use client";

// Grouped column chart (1–3 series) on one value axis. Each category is one
// hit target (hover or keyboard focus) with a single tooltip listing every
// series; columns are ≤ 12px each, 4px rounded tops, square at the baseline,
// 2px apart; gridlines are solid hairlines. Wrap in <ChartFrame> for the
// title, legend and table view.

import { useState } from "react";
import { BASELINE, GRID, seriesColor } from "@/components/charts/palette";

export interface ColumnSeries {
  name: string;
  values: number[];
}

/** 1-2-5 "nice" tick step for a max value. */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v));
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

export function ColumnChart({
  categories,
  series,
  format,
  axisFormat,
  tickEvery = 1,
  height = 160,
  extra,
  shortLabel = (c) => c,
}: {
  /** Full label per category (shown in the tooltip). */
  categories: string[];
  series: ColumnSeries[];
  format: (n: number) => string;
  /** Compact axis label (e.g. 10만). */
  axisFormat: (n: number) => string;
  /** Show every n-th x label (the rest stay in the tooltip / table). */
  tickEvery?: number;
  height?: number;
  /** Extra tooltip lines per category (e.g. "주문 3건"). */
  extra?: (i: number) => string[];
  /** Short x-axis label for a category (the tooltip keeps the full one). */
  shortLabel?: (c: string) => string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(0, ...series.flatMap((s) => s.values));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const n = categories.length;

  return (
    <div className="relative">
      <div className="flex">
        {/* y axis */}
        <div className="relative w-10 shrink-0" style={{ height }} aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-1.5 text-[10px] leading-none tabular-nums text-slate-400"
              style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}
            >
              {axisFormat(t)}
            </span>
          ))}
        </div>
        {/* plot */}
        <div className="relative flex-1" style={{ height }} onPointerLeave={() => setActive(null)}>
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden="true"
              className="absolute inset-x-0 h-px"
              style={{ bottom: `${(t / top) * 100}%`, background: t === 0 ? BASELINE : GRID }}
            />
          ))}
          <div className="absolute inset-0 flex">
            {categories.map((c, i) => {
              const label = `${c}: ${series.map((s) => `${s.name} ${format(s.values[i] ?? 0)}`).join(", ")}${extra ? `, ${extra(i).join(", ")}` : ""}`;
              return (
                <div
                  key={c}
                  role="img"
                  tabIndex={0}
                  aria-label={label}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className={`flex h-full flex-1 items-end justify-center gap-[2px] rounded-t-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 ${active === i ? "bg-slate-100/70" : ""}`}
                >
                  {series.map((s, si) => {
                    const v = s.values[i] ?? 0;
                    return (
                      <span
                        key={s.name}
                        className="block w-full max-w-3 rounded-t-[4px]"
                        style={{ height: `${(v / top) * 100}%`, minHeight: v > 0 ? 2 : 0, background: seriesColor(si) }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          {active != null && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 w-max min-w-32 rounded-lg bg-white/95 px-3 py-2 text-xs shadow-lg ring-1 ring-slate-200"
              style={{
                left: `${((active + 0.5) / n) * 100}%`,
                transform: `translateX(${active < n / 3 ? "-10%" : active > (2 * n) / 3 ? "-90%" : "-50%"})`,
              }}
            >
              <p className="text-[11px] text-slate-500">{categories[active]}</p>
              {series.map((s, si) => (
                <p key={s.name} className="mt-0.5 flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: seriesColor(si) }} />
                  <b className="tabular-nums text-slate-900">{format(s.values[active] ?? 0)}</b>
                  <span className="text-slate-500">{s.name}</span>
                </p>
              ))}
              {extra?.(active).map((l) => (
                <p key={l} className="mt-0.5 text-slate-500">
                  {l}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* x labels */}
      <div className="ml-10 mt-1 flex" aria-hidden="true">
        {categories.map((c, i) => (
          <span key={c} className="flex-1 truncate text-center text-[10px] text-slate-400">
            {(n - 1 - i) % tickEvery === 0 ? shortLabel(c) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
