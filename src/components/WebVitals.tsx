"use client";

// Real-visitor page speed (Core Web Vitals) → GA4, the way Google's
// web-vitals guide sends them: one event per metric, named after it, value in
// ms (CLS × 1000), plus the rating. Read them in GA4 → 보고서 → 이벤트
// (LCP, INP, CLS, FCP, TTFB) or build a Looker Studio page on top.

import { useReportWebVitals } from "next/web-vitals";
import { GA4_ID } from "@/lib/trackingIds";

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (!GA4_ID || typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", metric.name, {
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      page_path: window.location.pathname,
      non_interaction: true,
    });
  });
  return null;
}
