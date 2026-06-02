// Centralized conversion tracking helper.
// All events are funneled through a single `dataLayer.push` so that a single
// GTM container can fan them out to GA4 + Meta Pixel.
//
// If no GTM container id is configured (NEXT_PUBLIC_GTM_ID), events fall back
// to console logging so they remain verifiable during development.

export type AnalyticsParams = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: AnalyticsParams[];
  }
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

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

  if (!GTM_ID || process.env.NODE_ENV !== "production") {
    // Fallback / dev visibility — confirms events fire even without a container.
    console.log("[analytics]", event, params);
  }
}
