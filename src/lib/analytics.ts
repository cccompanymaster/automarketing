// Centralized conversion tracking helper.
// Every event goes to GA4 (gtag.js, by name) and `dataLayer` (for a GTM
// container, if one is ever set), and the conversions listed in
// lib/adPixels PIXEL_EVENTS also reach each ad pixel that is on
// (네이버·Meta·카카오·당근) under that pixel's own event name.
// Outside production builds no tags load and events are logged to the console.

import { sendConversion } from "@/lib/adPixels";
import { GA4_ID } from "@/lib/trackingIds";

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
  | "login_success"
  // Store funnel (GA4 recommended e-commerce names): card click → options
  // → order window → order placed; plus top-up starts.
  | "select_item"
  | "view_item"
  | "begin_checkout"
  | "purchase"
  | "charge_start"
  | "search"
  // Inquiry received by the site (not counted for the mail-app fallback).
  | "generate_lead"
  // Arrived from an AI answer (ChatGPT, Perplexity, Claude, Gemini …): ai_source.
  | "ai_referral";

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
  sendConversion(event, params);

  if (!GA4_ID) {
    // Fallback / dev visibility — confirms events fire even without a container.
    console.log("[analytics]", event, params);
  }
}
