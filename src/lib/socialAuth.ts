// Social login (Kakao / Naver) configuration and the post-redirect handoff.
//
// OAuth leaves the site and comes back to /auth/callback, so anything the page
// knew before the redirect (where to land afterwards, whether this was a
// signup) is parked in localStorage here and picked up on return.

import { isSupabaseConfigured } from "@/lib/supabase";

export type SocialProvider = "kakao" | "naver";

interface ProviderConfig {
  /** Provider id passed to supabase.auth.signInWithOAuth. */
  supabaseId: string;
  /**
   * With a real backend the provider must also be enabled in Supabase Auth,
   * otherwise the redirect lands on a raw "provider is not enabled" JSON page.
   * Stub mode always shows the buttons so the demo flow works.
   */
  enabled: boolean;
}

export const SOCIAL_PROVIDERS: Record<SocialProvider, ProviderConfig> = {
  kakao: {
    supabaseId: "kakao",
    enabled: !isSupabaseConfigured || process.env.NEXT_PUBLIC_KAKAO_LOGIN_ENABLED === "true",
  },
  // Naver isn't a built-in Supabase provider; it's registered as a Custom
  // OAuth provider under this id (see docs/SOCIAL_LOGIN.md).
  naver: {
    supabaseId: "custom:naver",
    enabled: !isSupabaseConfigured || process.env.NEXT_PUBLIC_NAVER_LOGIN_ENABLED === "true",
  },
};

export const ENABLED_SOCIAL_PROVIDERS = (Object.keys(SOCIAL_PROVIDERS) as SocialProvider[]).filter(
  (p) => SOCIAL_PROVIDERS[p].enabled,
);

/** Map Supabase's app_metadata.provider back to our provider key. */
export function socialProviderFromSupabase(id: string | undefined): SocialProvider | null {
  if (!id) return null;
  const hit = (Object.keys(SOCIAL_PROVIDERS) as SocialProvider[]).find(
    (p) => SOCIAL_PROVIDERS[p].supabaseId === id,
  );
  return hit ?? null;
}

const RETURN_KEY = "selfmarketing.oauth.return";
// A handoff older than this belongs to an abandoned attempt, not this return.
const MAX_AGE_MS = 30 * 60 * 1000;

export interface OAuthReturn {
  intent: "signup" | "login";
  /** Site-relative path to land on after login. */
  next?: string;
}

export function stashOAuthReturn(r: OAuthReturn): void {
  try {
    localStorage.setItem(RETURN_KEY, JSON.stringify({ ...r, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

/** Read and clear the handoff. Only site-relative paths are honored. */
export function takeOAuthReturn(): OAuthReturn | null {
  try {
    const raw = localStorage.getItem(RETURN_KEY);
    localStorage.removeItem(RETURN_KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as OAuthReturn & { at?: number };
    if (!r.at || Date.now() - r.at > MAX_AGE_MS) return null;
    // Never redirect off-site (e.g. "//evil.example") from stored state.
    const next = r.next && r.next.startsWith("/") && !r.next.startsWith("//") ? r.next : undefined;
    return { intent: r.intent === "signup" ? "signup" : "login", next };
  } catch {
    return null;
  }
}

// Owner test mode. Opening any page with ?social_preview=on shows every
// provider's button in this browser only (?social_preview=off clears it), so
// the owner can try Kakao/Naver on the live site — e.g. while Naver's app is
// still in review and only registered testers can sign in — without exposing
// the buttons to customers.
const PREVIEW_KEY = "selfmarketing.social.preview";
export const ALL_SOCIAL_PROVIDERS = Object.keys(SOCIAL_PROVIDERS) as SocialProvider[];

export function readSocialPreview(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get("social_preview");
    if (q === "on") localStorage.setItem(PREVIEW_KEY, "1");
    if (q === "off") localStorage.removeItem(PREVIEW_KEY);
    return localStorage.getItem(PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}
