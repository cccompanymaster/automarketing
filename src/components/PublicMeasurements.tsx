"use client";

import { usePathname } from "next/navigation";
import { AdPixels } from "./AdPixels";
import { WebVitals } from "./WebVitals";
import { VisitorAnalytics } from "./VisitorAnalytics";

export function PublicMeasurements() {
  if (usePathname().includes("/auth/")) return null;
  return <><VisitorAnalytics /><WebVitals /><AdPixels /></>;
}
