// A store product's hero visual: one of three text-free illustrations with the
// product's short copy laid over it as real text (sized in container units so
// it scales with the box). Used as the detail-page hero (square) and the store
// card thumbnail (4:3 crop of the same square). Decorative: the page already
// says everything in text, so the whole visual is aria-hidden.

import type { CSSProperties } from "react";
import { GROUP_ICON_PATH, VISUAL_SRC, productVisual } from "@/lib/productVisuals";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Text positions as % of the square — they match the drawn illustrations.
const TILE_LEFT = [16.4, 41.2, 66.0];

const line = (left: number, top: number, size: number, maxWidth: number): CSSProperties => ({
  position: "absolute",
  left: `${left}%`,
  top: `${top}%`,
  transform: "translateY(-50%)",
  maxWidth: `${maxWidth}%`,
  fontSize: `${size}cqw`,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export function ProductVisual({
  id,
  groupKey,
  groupTitle,
  variant = "square",
  className = "",
}: {
  id: string;
  groupKey: string;
  groupTitle: string;
  /** square: detail hero. card: 4:3 crop for store cards and related products. */
  variant?: "square" | "card";
  className?: string;
}) {
  const v = productVisual(id, groupKey);
  const icon = GROUP_ICON_PATH[groupKey];

  return (
    <div
      aria-hidden="true"
      className={`@container relative overflow-hidden bg-emerald-50 ${variant === "card" ? "aspect-[4/3]" : "aspect-square"} ${className}`}
    >
      {/* The square scene; in the card crop it is shifted up so its card sits in the middle. */}
      <div className="@container absolute inset-x-0 aspect-square" style={{ top: variant === "card" ? "-16.667%" : 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, local SVG */}
        <img src={`${BASE}${VISUAL_SRC[v.kind]}`} alt="" className="absolute inset-0 h-full w-full" />
        {v.kind === "rank" && (
          <>
            <span className="font-semibold text-slate-900" style={line(24.6, 30, 3.1, 58)}>{v.query}</span>
            <span className="font-bold text-emerald-700" style={line(28.2, 43, 3.1, 43)}>{v.highlight}</span>
          </>
        )}
        {v.kind === "stats" && (
          <>
            <span className="font-bold text-slate-500" style={line(17.2, 25.8, 2.9, 40)}>{groupTitle} · 반응 늘리기</span>
            {(v.stats ?? []).slice(0, 3).map((s, i) => (
              <span key={s} className="font-extrabold text-emerald-700" style={line(TILE_LEFT[i], 36.2, 2.7, 14)}>
                {s}
              </span>
            ))}
          </>
        )}
        {v.kind === "doc" && (
          <span className="font-extrabold text-slate-900" style={line(28.6, 20.5, 3.2, 48)}>{v.highlight}</span>
        )}
      </div>

      {icon && (
        <span
          className="absolute flex items-center justify-center bg-white shadow-md shadow-slate-900/10"
          style={{ left: "3.5%", top: "4%", width: "9.6cqw", height: "9.6cqw", borderRadius: "2.8cqw" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "52%", height: "52%" }}>
            <path d={icon} />
          </svg>
        </span>
      )}
    </div>
  );
}
