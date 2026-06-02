"use client";

// Kakao login/signup button. STUB ONLY — no real OAuth.
// The real flow would redirect to Kakao's authorize endpoint and handle the
// callback server-side.
// TODO(backend): implement Kakao OAuth (authorize redirect + token exchange).

import { useAuth } from "@/components/AuthProvider";

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
    // TODO(backend): redirect to
    // https://kauth.kakao.com/oauth/authorize?client_id=...&redirect_uri=...&response_type=code
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
