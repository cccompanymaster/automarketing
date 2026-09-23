"use client";

// Where the password-reset email link lands. supabase-js turns the link's
// recovery token into a session on its own; once it's there the member picks
// a new password. An expired or reused link never produces a session.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

const PASSWORD_MIN_LENGTH = 8;
// How long to wait for the recovery session before calling the link dead.
const SESSION_WAIT_MS = 5000;

function linkError(): string | null {
  const params = new URLSearchParams(
    `${window.location.search.slice(1)}&${window.location.hash.slice(1)}`,
  );
  if (!params.get("error")) return null;
  return params.get("error_code") === "otp_expired"
    ? "링크가 만료됐어요."
    : "링크를 확인하지 못했어요.";
}

export default function PasswordResetPage() {
  const router = useRouter();
  const { user, hydrated, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const settled = useRef(false);

  useEffect(() => {
    if (!hydrated || user || settled.current) return;
    const err = linkError();
    const timer = setTimeout(
      () => {
        if (settled.current) return;
        settled.current = true;
        setFailure(err ?? "링크가 만료됐거나 이미 사용됐어요.");
      },
      err ? 0 : SESSION_WAIT_MS,
    );
    return () => clearTimeout(timer);
  }, [hydrated, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN_LENGTH) {
      toast.error(`비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 입력해 주세요.`);
      return;
    }
    if (password !== confirm) {
      toast.error("두 비밀번호가 서로 달라요.");
      return;
    }
    setSaving(true);
    try {
      await updatePassword(password);
      toast.success("비밀번호를 바꿨어요.");
      router.replace("/mypage");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "비밀번호를 바꾸지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {user ? (
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">새 비밀번호 설정</h1>
            <p className="text-sm text-slate-500">앞으로 로그인할 때 쓸 비밀번호를 정해 주세요.</p>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
                새 비밀번호
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="8자 이상 입력"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
                새 비밀번호 확인
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
                placeholder="한 번 더 입력"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? "저장 중…" : "비밀번호 바꾸기"}
            </button>
          </form>
        ) : failure ? (
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">{failure}</h1>
            <p className="mt-2 text-sm text-slate-500">
              로그인 화면의 &lsquo;비밀번호를 잊으셨나요?&rsquo;에서 링크를 다시 받아 주세요.
            </p>
            <Link
              href="/start"
              className="mt-6 inline-block w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              로그인 화면으로
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <div
              aria-hidden="true"
              className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"
            />
            <p className="mt-4 text-sm text-slate-500" role="status">
              링크를 확인하는 중이에요…
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
