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
import type { LegalDocKey } from "@/lib/legal";
import { track } from "@/lib/analytics";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

export function SignupForm({
  onSwitchToLogin,
  afterHref,
}: {
  onSwitchToLogin: () => void;
  /** Post-signup destination (e.g. the chosen product's pricing rows). */
  afterHref?: string;
}) {
  const router = useRouter();
  const { signupWithEmail } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Consents are split per PIPA: required ones gate signup, optional ones are
  // recorded but never block it (제22조 — 선택 동의 거부 시 서비스 제한 금지).
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalDoc, setModalDoc] = useState<LegalDocKey | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [fieldError, setFieldError] = useState<{ field: "email" | "password"; message: string } | null>(null);

  const failField = (field: "email" | "password", message: string) => {
    setFieldError({ field, message });
    toast.error(message);
    document.getElementById(`signup-${field}`)?.focus();
  };

  // The signup view has been reached — mark the start of the signup funnel.
  useEffect(() => {
    track("signup_start");
  }, []);

  const finish = () => {
    track("signup_complete");
    toast.success("가입이 완료되었습니다. 환영합니다!");
    router.push(afterHref ?? "/mypage");
  };

  const requiredOk = agreeTerms && agreePrivacy;
  const allChecked = agreeTerms && agreePrivacy && agreeThirdParty && agreeMarketing;

  const toggleAll = (checked: boolean) => {
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeThirdParty(checked);
    setAgreeMarketing(checked);
  };

  /** Consent snapshot recorded with the account (audit trail for 제3자 제공). */
  const consents = () => ({
    terms: agreeTerms,
    privacy: agreePrivacy,
    thirdParty: agreeThirdParty,
    marketing: agreeMarketing,
    agreedAt: new Date().toISOString(),
  });

  const guardConsent = (): boolean => {
    if (!requiredOk) {
      toast.error("필수 항목(이용약관·개인정보 수집·이용)에 동의해 주세요.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    if (!email) {
      failField("email", "이메일을 입력해 주세요.");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      failField("email", "올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    if (!password) {
      failField("password", "비밀번호를 입력해 주세요.");
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      failField("password", `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 입력해 주세요.`);
      return;
    }
    if (!guardConsent()) return;
    setSubmitting(true);
    try {
      await signupWithEmail(email, password, name || undefined, consents());
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
          className="mt-6 w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
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

      {/* One-tap signup first — fewer fields, less mobile drop-off */}
      <div className="mt-6">
        <KakaoButton label="카카오로 3초만에 시작하기" guard={guardConsent} onDone={finish} />
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-100" />
        또는 이메일로 가입
        <span className="h-px flex-1 bg-slate-100" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={fieldError?.field === "email" || undefined}
            aria-describedby={fieldError?.field === "email" ? "signup-email-error" : undefined}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 aria-invalid:border-red-400"
            placeholder="name@example.com"
          />
          {fieldError?.field === "email" && (
            <p id="signup-email-error" className="mt-1.5 text-xs text-red-600">
              {fieldError.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700">
            비밀번호
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={fieldError?.field === "password" || undefined}
            aria-describedby={fieldError?.field === "password" ? "signup-password-error" : undefined}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 aria-invalid:border-red-400"
            placeholder="8자 이상 입력"
          />
          {fieldError?.field === "password" && (
            <p id="signup-password-error" className="mt-1.5 text-xs text-red-600">
              {fieldError.message}
            </p>
          )}
        </div>

        {/* Consents — required and optional are separated (PIPA 제22조) */}
        <fieldset className="overflow-hidden rounded-2xl border border-slate-200">
          <legend className="sr-only">약관 동의</legend>

          {/* Agree-to-all — a full-width tap target, not a small checkbox */}
          <button
            type="button"
            onClick={() => toggleAll(!allChecked)}
            aria-pressed={allChecked}
            className={`flex w-full items-center gap-3 px-4 py-4 text-left transition ${
              allChecked ? "bg-emerald-700 text-white" : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black transition ${
                allChecked
                  ? "bg-white text-emerald-700"
                  : "border-2 border-slate-300 bg-white text-transparent"
              }`}
            >
              ✓
            </span>
            <span className="flex-1">
              <span className={`block text-[15px] font-bold ${allChecked ? "text-white" : "text-slate-800"}`}>
                전체 동의하기
              </span>
              <span className={`block text-xs ${allChecked ? "text-emerald-50" : "text-slate-400"}`}>
                필수·선택 항목에 모두 동의합니다
              </span>
            </span>
          </button>

          <div className="space-y-1 p-4">
            {[
              {
                checked: agreeTerms,
                set: setAgreeTerms,
                required: true,
                label: "이용약관 동의",
                doc: "terms" as LegalDocKey,
              },
              {
                checked: agreePrivacy,
                set: setAgreePrivacy,
                required: true,
                label: "개인정보 수집·이용 동의",
                doc: "privacy" as LegalDocKey,
              },
              {
                checked: agreeThirdParty,
                set: setAgreeThirdParty,
                required: false,
                label: "제3자 정보제공 동의",
                doc: "thirdParty" as LegalDocKey,
              },
              {
                checked: agreeMarketing,
                set: setAgreeMarketing,
                required: false,
                label: "마케팅 정보 수신 동의",
                doc: "marketing" as LegalDocKey,
              },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-1 text-sm">
                {/* Whole row toggles the consent — bigger, easier target */}
                <label
                  htmlFor={`consent-${c.doc}`}
                  className="flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-1 transition hover:bg-slate-50"
                >
                  <input
                    id={`consent-${c.doc}`}
                    type="checkbox"
                    checked={c.checked}
                    onChange={(e) => c.set(e.target.checked)}
                    className="h-[18px] w-[18px] shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-600">
                    <span className={c.required ? "font-semibold text-slate-500" : "text-slate-400"}>
                      [{c.required ? "필수" : "선택"}]
                    </span>{" "}
                    {c.label}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setModalDoc(c.doc)}
                  className="flex min-h-11 shrink-0 items-center px-2 text-xs font-semibold text-slate-400 underline underline-offset-2 transition hover:text-emerald-700"
                >
                  보기
                </button>
              </div>
            ))}
          </div>

          <p className="border-t border-slate-100 px-4 pb-4 pt-3 text-[11px] leading-relaxed text-slate-400">
            선택 항목에 동의하지 않아도 회원가입과 모든 서비스 이용에 제한이 없어요. 동의 후에도
            언제든지 철회할 수 있습니다.
          </p>
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {submitting ? "가입 중…" : "이메일로 가입하기"}
        </button>
      </form>

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
