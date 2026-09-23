"use client";

// Kakao login/signup button. With Supabase configured this starts the real
// OAuth redirect (AuthProvider.loginWithKakao); in stub mode it fakes a session.

import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";

// With a real backend the Kakao provider must also be enabled in Supabase Auth,
// otherwise the redirect lands on a raw "provider is not enabled" JSON error.
// Hide the button until NEXT_PUBLIC_KAKAO_LOGIN_ENABLED says it's wired up.
// Stub mode keeps it so the demo flow still works.
export const KAKAO_LOGIN_AVAILABLE =
  !isSupabaseConfigured || process.env.NEXT_PUBLIC_KAKAO_LOGIN_ENABLED === "true";

export function KakaoButton({
  label,
  onDone,
  guard,
}: {
  label: string;
  onDone?: () => void;
  /** Optional pre-auth check; return false to abort before the (stub) login. */
  guard?: () => boolean;
}) {
  const { loginWithKakao } = useAuth();

  const handleClick = async () => {
    if (guard && !guard()) return;
    await loginWithKakao();
    onDone?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-sm font-semibold text-[#191600] transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
    >
      <span aria-hidden="true">💬</span>
      {label}
    </button>
  );
}
