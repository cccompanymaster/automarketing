// Tracking container / property ids. Public values (they ship in page HTML), so
// the live ids are the defaults and env vars only override them. Tags load in
// production builds only, so local dev never pollutes the real reports.

const isProd = process.env.NODE_ENV === "production";

/** Google Tag Manager container (Meta Pixel and other tags live here). */
export const GTM_ID = isProd ? process.env.NEXT_PUBLIC_GTM_ID || "GTM-NF44W8RR" : "";

/**
 * GA4 property, loaded directly with gtag.js. Don't also add a GA4 tag inside
 * GTM — page views would be counted twice.
 */
export const GA4_ID = isProd
  ? process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "G-V2W8DGXT7W"
  : "";
