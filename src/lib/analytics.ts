// Centralized conversion tracking helper.
// All events are funneled through a single `dataLayer.push` so the GTM
// container can fan them out (e.g. Meta Pixel).
//
// GA4 is loaded directly (gtag.js), so each event is also sent there by name.
// Outside production builds no tags load and events are logged to the console.

import { GA4_ID, GTM_ID } from "@/lib/trackingIds";

export type AnalyticsParams = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: AnalyticsParams[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** The set of conversion events emitted across the funnel. */
export type AnalyticsEvent =
  | "cta_click"
  | "onboarding_step_view"
  | "onboarding_complete"
  | "signup_start"
  | "signup_complete"
  | "login_success";

/**
 * Push a conversion event into the dataLayer.
 * Always pushes to `window.dataLayer`; additionally logs to the console when
 * no GTM container is configured (or in development) for easy verification.
 */
export function track(event: AnalyticsEvent, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;

  const payload: AnalyticsParams = { event, ...params };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  if (GA4_ID) window.gtag?.("event", event, params);

  if (!GTM_ID && !GA4_ID) {
    // Fallback / dev visibility — confirms events fire even without a container.
    console.log("[analytics]", event, params);
  }
}
