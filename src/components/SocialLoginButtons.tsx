"use client";

// Kakao / Naver login buttons (only the providers enabled for this build).
// Real mode redirects away and finishes on /auth/callback; stub mode fakes a
// session and calls onDone right here.

import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { stashPendingConsents, type ConsentChoice } from "@/lib/consents";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  ENABLED_SOCIAL_PROVIDERS,
  stashOAuthReturn,
  type SocialProvider,
} from "@/lib/socialAuth";

export const SOCIAL_LOGIN_AVAILABLE = ENABLED_SOCIAL_PROVIDERS.length > 0;

// Each provider's login-button guide is part of its terms (Naver's review
// rejects deviations): fixed background colors, the official symbol rather
// than a typed letter or emoji, and a label smaller than the symbol.
const STYLE: Record<SocialProvider, { name: string; className: string; mark: React.ReactNode }> = {
  kakao: {
    name: "카카오",
    // Kakao: #FEE500 background, black speech-bubble symbol, 85% black label.
    className: "bg-[#FEE500] text-black/85 focus-visible:ring-yellow-500",
    mark: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="#000">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.84 5.31 4.6 6.72l-.94 3.44c-.08.3.26.54.52.37l4.12-2.72c.56.08 1.13.12 1.7.12 5.52 0 10-3.58 10-8S17.52 3 12 3Z" />
      </svg>
    ),
  },
  naver: {
    name: "네이버",
    // Naver BI: #03A94D background, white N logotype (min 16px), white label.
    className: "bg-[#03A94D] text-white focus-visible:ring-green-600",
    mark: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[16px] w-[16px] shrink-0" fill="#fff">
        <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z" />
      </svg>
    ),
  },
};

export function SocialLoginButtons({
  intent,
  next,
  consents,
  onDone,
}: {
  intent: "signup" | "login";
  /** Site-relative destination after login. */
  next?: string;
  /**
   * Signup only: consents already ticked on the form, parked across the
   * redirect and recorded by ConsentGate. Null (required ones not ticked) is
   * fine — ConsentGate then asks after login instead.
   */
  consents?: () => ConsentChoice | null;
  /** Stub mode only — real mode leaves the page. */
  onDone?: () => void;
}) {
  const { loginWithSocial } = useAuth();

  const start = async (provider: SocialProvider) => {
    const choice = consents?.() ?? null;
    if (isSupabaseConfigured) {
      if (choice) stashPendingConsents(choice);
      stashOAuthReturn({ intent, next });
    }
    try {
      await loginWithSocial(provider);
      if (!isSupabaseConfigured) onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "로그인을 시작하지 못했습니다.");
    }
  };

  const verb = intent === "signup" ? "로 3초만에 시작하기" : "로 로그인";

  return (
    <div className="space-y-2.5">
      {ENABLED_SOCIAL_PROVIDERS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => void start(p)}
          // gap-2 = the 8px logo-to-label spacing both guides specify; the
          // 14px label stays smaller than the 16–18px symbol as Naver requires.
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${STYLE[p].className}`}
        >
          {STYLE[p].mark}
          {STYLE[p].name}
          {verb}
        </button>
      ))}
    </div>
  );
}
