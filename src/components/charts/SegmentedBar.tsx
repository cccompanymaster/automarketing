"use client";

// One whole split into parts (≤ 3 colored parts here; fold the rest).
// Tall: 28px, each part its own block with 4px corners and a 2px gap, its
// share printed inside only when it fits. Thin: 8px, no text — for table
// rows where the figures sit beside it. Hover/focus shows the part's name,
// amount and share; the legend lists names only.

import { useState } from "react";
import { seriesColor } from "@/components/charts/palette";

export interface Part {
  label: string;
  value: number;
  /** Override the slot color (e.g. de-emphasis gray). */
  color?: string;
}

const pct = (r: number) => `${Math.round(r * 100)}%`;

export function SegmentedBar({
  parts,
  format,
  variant = "tall",
  label,
}: {
  parts: Part[];
  format: (n: number) => string;
  variant?: "tall" | "thin";
  /** Accessible name prefix, e.g. "총 고용비용 구성". */
  label: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const shown = parts.filter((p) => p.value > 0);
  const total = shown.reduce((s, p) => s + p.value, 0);
  if (!(total > 0)) return null;
  const tall = variant === "tall";
  const color = (p: Part) => p.color ?? seriesColor(parts.indexOf(p));
  const aria = `${label}: ${shown.map((p) => `${p.label} ${format(p.value)} (${pct(p.value / total)})`).join(", ")}`;

  return (
    <div className="relative" onPointerLeave={() => setActive(null)}>
      <div role="img" aria-label={aria} className={`flex w-full gap-[2px] ${tall ? "h-7" : "h-2"}`}>
        {shown.map((p, i) => {
          const share = p.value / total;
          const fits = tall && share >= 0.12;
          return (
            <span
              key={p.label}
              tabIndex={tall ? 0 : -1}
              aria-label={`${p.label} ${format(p.value)} (${pct(share)})`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className={`flex items-center overflow-visible text-[11px] font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                tall ? "rounded-[4px] px-2" : "rounded-full"
              } ${active === i ? "brightness-110" : ""}`}
              style={{ width: `${share * 100}%`, minWidth: 2, background: color(p) }}
            >
              {fits ? pct(share) : ""}
            </span>
          );
        })}
      </div>
      {active != null && shown[active] && (
        <div role="status" className="pointer-events-none absolute left-0 top-full z-10 mt-1.5 rounded-lg bg-white px-3 py-1.5 text-xs shadow-lg ring-1 ring-slate-200">
          <b className="tabular-nums text-slate-900">{format(shown[active].value)}</b>
          <span className="ml-1.5 text-slate-500">
            {shown[active].label} · {pct(shown[active].value / total)}
          </span>
        </div>
      )}
    </div>
  );
}
