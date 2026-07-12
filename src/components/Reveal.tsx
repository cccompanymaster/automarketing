"use client";

// Scroll-triggered reveal wrapper for the storytelling landing. Children start
// slightly translated + transparent and animate in the first time they enter
// the viewport. Motion styles live in globals.css (.reveal / .is-visible) and
// are disabled under prefers-reduced-motion.

import { useEffect, useRef, type ReactNode } from "react";

export function Reveal({
  children,
  delayMs = 0,
  className = "",
}: {
  children: ReactNode;
  /** Stagger offset for grouped items. */
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delayMs}ms` }}>
      {children}
    </div>
  );
}
