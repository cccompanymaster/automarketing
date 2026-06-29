"use client";

// Email + Kakao signup with terms/privacy consent (opens LegalModal).
// Fires `signup_start` on mount and `signup_complete` on success, then routes
// to /mypage. Provides a switch to the login view (same screen, no URL change).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth, EmailConfirmationRequiredError } from "@/components/AuthProvider";
import { KakaoButton } from "@/components/KakaoButton";
import { LegalModal } from "@/components/LegalModal";
import { track } from "@/lib/analytics";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

export function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const router = useRouter();
  const { signupWithEmail } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalDoc, setModalDoc] = useState<"terms" | "privacy" | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  // The signup view has been reached — mark the start of the signup funnel.
  useEffect(() => {
    track("signup_start");
  }, []);

  const finish = () => {
    track("signup_complete");
    toast.success("가입이 완료되었습니다. 환영합니다!");
    router.push("/mypage");
  };

  const guardConsent = (): boolean => {
    if (!agreed) {
      toast.error("약관 및 개인정보 처리방침에 동의해 주세요.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      toast.error("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      toast.error(`비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 입력해 주세요.`);
      return;
    }
    if (!agreed) {
      toast.error("약관 및 개인정보 처리방침에 동의해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await signupWithEmail(email, password, name || undefined);
      finish();
    } catch (err) {
      if (err instanceof EmailConfirmationRequiredError) {
        // Not a failure — the account was created and needs email verification.
        setConfirmSent(true);
      } else {
        toast.error(err instanceof Error ? err.message : "가입에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmSent) {
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
          <b className="text-slate-800">{email}</b> 으로 인증 메일을 보냈어요.
          <br />
          메일의 링크를 눌러 인증을 완료하면 로그인할 수 있습니다.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          메일이 보이지 않으면 스팸함을 확인하거나 잠시 후 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          로그인 화면으로
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">회원가입</h1>
      <p className="mt-2 text-sm text-slate-500">
        몇 가지 정보만 입력하면 바로 시작할 수 있습니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-slate-700">
            이름 <span className="text-slate-400">(선택)</span>
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="홍길동"
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700">
            이메일
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700">
            비밀번호
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="8자 이상 입력"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>
            <button
              type="button"
              onClick={() => setModalDoc("terms")}
              className="font-semibold text-emerald-600 hover:underline"
            >
              이용약관
            </button>{" "}
            및{" "}
            <button
              type="button"
              onClick={() => setModalDoc("privacy")}
              className="font-semibold text-emerald-600 hover:underline"
            >
              개인정보처리방침
            </button>
            에 동의합니다.
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {submitting ? "가입 중…" : "이메일로 가입하기"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-100" />
        또는
        <span className="h-px flex-1 bg-slate-100" />
      </div>

      <KakaoButton label="카카오로 시작하기" guard={guardConsent} onDone={finish} />

      <p className="mt-6 text-center text-sm text-slate-500">
        이미 계정이 있으신가요?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-emerald-600 hover:underline"
        >
          로그인
        </button>
      </p>

      <LegalModal open={modalDoc !== null} docKey={modalDoc} onClose={() => setModalDoc(null)} />
    </div>
  );
}
