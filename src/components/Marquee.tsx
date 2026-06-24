// Auto-scrolling horizontal banner (CSS-only). Renders children twice for a
// seamless loop; pauses on hover; respects prefers-reduced-motion (globals.css).

import type { CSSProperties, ReactNode } from "react";

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
  const style = { "--marquee-duration": `${durationSec}s` } as CSSProperties;
  return (
    <div className={`marquee ${className}`} style={style}>
      <div className="marquee__track">
        <div className="marquee__group">{children}</div>
        <div className="marquee__group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
