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

// Brand colors per each provider's login button guidelines.
const STYLE: Record<SocialProvider, { name: string; className: string; mark: React.ReactNode }> = {
  kakao: {
    name: "카카오",
    className: "bg-[#FEE500] text-[#191600] focus-visible:ring-yellow-500",
    mark: <span aria-hidden="true">💬</span>,
  },
  naver: {
    name: "네이버",
    className: "bg-[#03C75A] text-white focus-visible:ring-green-600",
    mark: (
      <span aria-hidden="true" className="text-base font-black leading-none">
        N
      </span>
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
