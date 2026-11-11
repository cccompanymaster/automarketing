// Ranked horizontal bars on one baseline: name and figure as text (the
// numbers never depend on the bar), bar ≤ 10px, square at the baseline with
// a 4px rounded end. One hue; `highlight` turns it into emphasis (the story
// in brand green, the rest in de-emphasis gray). Negative values draw from
// the same baseline in the critical tone, with the sign in the text.

import { DEEMPH, seriesColor } from "@/components/charts/palette";

export interface RankedRow {
  key: string;
  label: React.ReactNode;
  value: number;
  /** Text shown on the right (formatted value). */
  figure: React.ReactNode;
  /** Small text under the row. */
  sub?: React.ReactNode;
}

export function RankedBars({ rows, highlight, ariaLabel }: { rows: RankedRow[]; highlight?: string; ariaLabel: string }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  return (
    <ul className="space-y-2.5" aria-label={ariaLabel}>
      {rows.map((r) => {
        const color = r.value < 0 ? "#d03b3b" : highlight == null || highlight === r.key ? seriesColor(0) : DEEMPH;
        return (
          <li key={r.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 text-slate-700">{r.label}</span>
              <span className="num shrink-0 text-slate-900">{r.figure}</span>
            </div>
            <div aria-hidden="true" className="mt-1 h-2.5">
              <div className="h-full rounded-r-[4px]" style={{ width: `${Math.max(1, (Math.abs(r.value) / max) * 100)}%`, background: color }} />
            </div>
            {r.sub && <div className="mt-1 text-xs text-slate-500">{r.sub}</div>}
          </li>
        );
      })}
    </ul>
  );
}
