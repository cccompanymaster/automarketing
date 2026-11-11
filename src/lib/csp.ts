// Content-Security-Policy for the static site.
//
// GitHub Pages can't set response headers, so the policy ships as a <meta> tag
// from the root layout. Keeping it in code means a new third-party integration
// and its CSP entry land in the same commit instead of drifting apart in a
// dashboard. Every origin below maps to a fetch/script load in src/ or a
// deploy-time env URL (see docs/SECURITY_HEADERS.md).
//
// Analytics and ad tools add their origins only when their id is set
// (lib/trackingIds), so an unused tool never widens the policy.
//
// Meta-delivered CSP ignores frame-ancestors, so clickjacking protection still
// needs the X-Frame-Options header at the edge (Cloudflare).

import { CLARITY_ID, GTM_ID, KAKAO_PIXEL_ID, KARROT_PIXEL_ID, META_PIXEL_ID, NAVER_ANALYTICS_ID } from "@/lib/trackingIds";

type Directives = Record<string, string[]>;

const BASE: Directives = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "form-action": ["'self'"],
  // GA4 bootstraps inline (and GTM injects tags at runtime), so nonces aren't viable.
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    // GA4 gtag.js
    "https://*.googletagmanager.com",
    "https://cdn.portone.io",
    // Kakao JS SDK (calculator share)
    "https://t1.kakaocdn.net",
  ],
  "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "data:"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://*.supabase.co",
    "https://*.googletagmanager.com",
    "https://*.google-analytics.com",
    "https://ssl.gstatic.com",
    "https://www.gstatic.com",
    "https://*.g.doubleclick.net",
  ],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    // Price sheet CSV and inquiry Apps Script both redirect to googleusercontent.
    "https://docs.google.com",
    "https://script.google.com",
    "https://*.googleusercontent.com",
    "https://*.portone.io",
    // GA4 beacons go to regional hosts (e.g. region1.google-analytics.com).
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://*.googletagmanager.com",
    "https://stats.g.doubleclick.net",
    // Calculator image export re-fetches the webfont CSS to embed it.
    "https://cdn.jsdelivr.net",
    "https://*.kakao.com",
  ],
  "frame-src": ["https://td.doubleclick.net", "https://*.portone.io", "https://*.iamport.co"],
  "upgrade-insecure-requests": [],
};

// Origins each optional tool loads from or reports to.
export const TOOL_ORIGINS: Record<string, { id: string; add: Directives }> = {
  gtm: {
    id: GTM_ID,
    add: { "script-src": ["https://tagmanager.google.com"], "style-src": ["https://tagmanager.google.com"], "frame-src": ["https://www.googletagmanager.com"] },
  },
  naver: {
    id: NAVER_ANALYTICS_ID,
    add: { "script-src": ["https://wcs.naver.net"], "img-src": ["https://wcs.naver.com", "https://wcs.naver.net"], "connect-src": ["https://wcs.naver.net", "https://wcs.naver.com"] },
  },
  meta: {
    id: META_PIXEL_ID,
    add: { "script-src": ["https://connect.facebook.net"], "img-src": ["https://www.facebook.com"], "connect-src": ["https://www.facebook.com", "https://connect.facebook.net"] },
  },
  kakao: {
    id: KAKAO_PIXEL_ID,
    add: { "script-src": ["https://t1.daumcdn.net"], "img-src": ["https://*.ds.kakao.com"], "connect-src": ["https://*.ds.kakao.com"] },
  },
  karrot: {
    id: KARROT_PIXEL_ID,
    add: { "script-src": ["https://karrot-pixel.business.daangn.com"], "img-src": ["https://collect.daangn.com"], "connect-src": ["https://collect.daangn.com"] },
  },
  clarity: {
    id: CLARITY_ID,
    add: { "script-src": ["https://www.clarity.ms", "https://*.clarity.ms"], "img-src": ["https://*.clarity.ms", "https://c.bing.com"], "connect-src": ["https://*.clarity.ms"] },
  },
};

export function buildCsp(tools: { id: string; add: Directives }[]): string {
  const out: Directives = Object.fromEntries(Object.entries(BASE).map(([k, v]) => [k, [...v]]));
  for (const tool of tools) {
    if (!tool.id) continue;
    for (const [name, origins] of Object.entries(tool.add)) {
      out[name] = [...new Set([...(out[name] ?? []), ...origins])];
    }
  }
  return Object.entries(out)
    .map(([name, sources]) => [name, ...sources].join(" "))
    .join("; ");
}

export const CONTENT_SECURITY_POLICY = buildCsp(Object.values(TOOL_ORIGINS));
