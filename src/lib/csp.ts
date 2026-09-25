// Content-Security-Policy for the static site.
//
// GitHub Pages can't set response headers, so the policy ships as a <meta> tag
// from the root layout. Keeping it in code means a new third-party integration
// and its CSP entry land in the same commit instead of drifting apart in a
// dashboard. Every origin below maps to a fetch/script load in src/ or a
// deploy-time env URL (see docs/SECURITY_HEADERS.md).
//
// Meta-delivered CSP ignores frame-ancestors, so clickjacking protection still
// needs the X-Frame-Options header at the edge (Cloudflare).

const DIRECTIVES: Record<string, string[]> = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "form-action": ["'self'"],
  // GTM bootstraps inline and injects tags at runtime, so nonces aren't viable.
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    // Google's CSP guide for GTM + GA4 (+ GTM preview mode).
    "https://*.googletagmanager.com",
    "https://tagmanager.google.com",
    "https://connect.facebook.net",
    "https://cdn.portone.io",
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'",
    "https://cdn.jsdelivr.net",
    "https://tagmanager.google.com",
    "https://fonts.googleapis.com",
  ],
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
    "https://www.facebook.com",
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
    "https://www.facebook.com",
  ],
  "frame-src": [
    "https://www.googletagmanager.com",
    "https://td.doubleclick.net",
    "https://*.portone.io",
    "https://*.iamport.co",
  ],
  "upgrade-insecure-requests": [],
};

export const CONTENT_SECURITY_POLICY = Object.entries(DIRECTIVES)
  .map(([name, sources]) => [name, ...sources].join(" "))
  .join("; ");
