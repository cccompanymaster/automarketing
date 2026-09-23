"use client";

// Where Kakao/Naver login returns (via Supabase). supabase-js restores the
// session from the URL on its own; this page waits for it, then forwards to
// the destination stashed before the redirect (e.g. the product's pricing
// rows). Missing consents are handled globally by ConsentGate.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { track } from "@/lib/analytics";
import { takeOAuthReturn } from "@/lib/socialAuth";

// How long to wait for the session after hydration before giving up.
const SESSION_WAIT_MS = 5000;

function providerError(): string | null {
  const params = new URLSearchParams(
    `${window.location.search.slice(1)}&${window.location.hash.slice(1)}`,
  );
  const code = params.get("error");
  if (!code) return null;
  if (code === "access_denied") return "로그인을 취소하셨어요.";
  return params.get("error_description") ?? "로그인 중 문제가 생겼어요.";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const [failure, setFailure] = useState<string | null>(null);
  const settled = useRef(false);

  useEffect(() => {
    if (!hydrated || settled.current) return;
    if (user) {
      settled.current = true;
      const ret = takeOAuthReturn();
      track(ret?.intent === "signup" ? "signup_complete" : "login_success");
      router.replace(ret?.next ?? "/mypage");
      return;
    }
    // Provider errors come back immediately; otherwise give the session a
    // moment to land via onAuthStateChange before calling it a failure.
    const err = providerError();
    const timer = setTimeout(
      () => {
        if (settled.current) return;
        settled.current = true;
        setFailure(err ?? "로그인 정보를 확인하지 못했어요.");
      },
      err ? 0 : SESSION_WAIT_MS,
    );
    return () => clearTimeout(timer);
  }, [hydrated, user, router]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {failure ? (
          <>
            <h1 className="text-xl font-bold text-slate-900">{failure}</h1>
            <p className="mt-2 text-sm text-slate-500">다시 시도하거나 이메일로 로그인해 주세요.</p>
            <Link
              href="/start"
              className="mt-6 inline-block w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              로그인 화면으로
            </Link>
          </>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"
            />
            <p className="mt-4 text-sm text-slate-500" role="status">
              로그인하는 중이에요…
            </p>
          </>
        )}
      </div>
    </main>
  );
}
