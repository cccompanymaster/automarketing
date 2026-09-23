"use client";

// Email + social (Kakao/Naver) login. On success fires `login_success` and routes to /mypage.
// Provides a switch to the signup view (same screen, no URL change).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { SocialLoginButtons, SOCIAL_LOGIN_AVAILABLE } from "@/components/SocialLoginButtons";
import { track } from "@/lib/analytics";

export function LoginForm({
  onSwitchToSignup,
  afterHref,
}: {
  onSwitchToSignup: () => void;
  /** Post-login destination (e.g. the chosen product's pricing rows). */
  afterHref?: string;
}) {
  const router = useRouter();
  const { loginWithEmail, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // "reset" swaps the form for a send-reset-link form; "sent" confirms it.
  const [mode, setMode] = useState<"login" | "reset" | "sent">("login");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("가입하신 이메일을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setMode("sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "메일을 보내지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const finish = () => {
    track("login_success");
    toast.success("로그인되었습니다.");
    router.push(afterHref ?? "/mypage");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      finish();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "sent") {
    return (
      <div className="text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl"
          aria-hidden="true"
        >
          📩
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">메일함을 확인해 주세요</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          <b className="text-slate-800">{email}</b> 로 비밀번호 재설정 링크를 보냈어요.
          <br />
          링크를 누르면 새 비밀번호를 정할 수 있습니다.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          가입된 이메일이 아니면 메일이 가지 않아요. 스팸함도 확인해 주세요.
        </p>
        <button
          type="button"
          onClick={() => setMode("login")}
          className="mt-6 w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          로그인 화면으로
        </button>
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">비밀번호 찾기</h1>
        <p className="mt-2 text-sm text-slate-500">
          가입하신 이메일로 비밀번호 재설정 링크를 보내드려요.
        </p>
        <form onSubmit={handleReset} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700">
              이메일
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="name@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            {submitting ? "보내는 중…" : "재설정 링크 보내기"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode("login")}
          className="mt-4 w-full text-center text-sm font-semibold text-slate-500 hover:text-emerald-700"
        >
          ← 로그인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">로그인</h1>
      <p className="mt-2 text-sm text-slate-500">
        다시 오셨네요. 계정으로 로그인해 주세요.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="비밀번호"
          />
          <button
            type="button"
            onClick={() => setMode("reset")}
            className="mt-1 py-2 text-xs font-medium text-slate-400 underline underline-offset-2 transition hover:text-emerald-700"
          >
            비밀번호를 잊으셨나요?
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {submitting ? "로그인 중…" : "이메일로 로그인"}
        </button>
      </form>

      {SOCIAL_LOGIN_AVAILABLE && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-100" />
            또는
            <span className="h-px flex-1 bg-slate-100" />
          </div>

          <SocialLoginButtons intent="login" next={afterHref} onDone={finish} />
        </>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        아직 계정이 없으신가요?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="-my-2 px-1 py-2 font-semibold text-emerald-600 hover:underline"
        >
          가입하기
        </button>
      </p>
    </div>
  );
}
