"use client";

// "One whole, split into parts" figure for result panels: title, tall
// segmented bar, a names-only legend, and the table view with amounts and
// shares. Up to three parts (validated palette); fold anything else first.

import { ChartFrame } from "@/components/charts/ChartFrame";
import { SegmentedBar, type Part } from "@/components/charts/SegmentedBar";
import { seriesColor } from "@/components/charts/palette";

export function PartsChart({
  title,
  subtitle,
  parts,
  format,
}: {
  title: string;
  subtitle?: React.ReactNode;
  parts: Part[];
  format: (n: number) => string;
}) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  if (!(total > 0)) return null;
  const colored = parts.map((p, i) => ({ ...p, color: p.color ?? seriesColor(i) }));
  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      className="rounded-2xl bg-white p-4 ring-1 ring-slate-100"
      legend={colored.length >= 2 ? colored.map((p) => ({ label: p.label, color: p.color! })) : undefined}
      table={{
        head: ["항목", "금액", "비중"],
        rows: colored.map((p) => [p.label, format(p.value), `${Math.round((Math.max(0, p.value) / total) * 1000) / 10}%`]),
      }}
    >
      <SegmentedBar parts={colored} format={format} label={title} />
    </ChartFrame>
  );
}
