"use client";

// Starts the ad pixels (lib/adPixels), counts client-side page changes for
// them, and records where this visit came from (lib/attribution) — an AI
// answer visit also goes to GA4 as `ai_referral`. Renders nothing.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { sendPageView, startAdPixels } from "@/lib/adPixels";
import { track } from "@/lib/analytics";
import { captureVisit } from "@/lib/attribution";

export function AdPixels() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    startAdPixels();
    const ai = captureVisit();
    if (ai) track("ai_referral", { ai_source: ai, landing_page: window.location.pathname });
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    sendPageView();
  }, [pathname]);

  return null;
}
