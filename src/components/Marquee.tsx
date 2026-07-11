"use client";

// Auto-scrolling horizontal banner (CSS-only). Renders children twice for a
// seamless loop; pauses on hover; respects prefers-reduced-motion
// (globals.css). Touch users get an explicit pause/play toggle.

import { useState, type CSSProperties, type ReactNode } from "react";

export function Marquee({
  children,
  durationSec = 22,
  className = "",
}: {
  children: ReactNode;
  /** Seconds for one full loop — smaller = faster. */
  durationSec?: number;
  className?: string;
}) {
  const [paused, setPaused] = useState(false);
  const style = { "--marquee-duration": `${durationSec}s` } as CSSProperties;

  return (
    <div className="relative">
      <div className={`marquee ${paused ? "marquee--paused" : ""} ${className}`} style={style}>
        <div className="marquee__track">
          <div className="marquee__group">{children}</div>
          <div className="marquee__group" aria-hidden="true">
            {children}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? "자동 스크롤 재생" : "자동 스크롤 일시정지"}
        className="absolute -bottom-3 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-600 shadow-sm transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <span aria-hidden="true">{paused ? "▶" : "⏸"}</span>
      </button>
    </div>
  );
}
