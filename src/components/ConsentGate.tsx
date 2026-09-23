"use client";

// Makes sure every signed-in member has an auditable consent_logs record.
//
// Some signups can't write the record at signup time because no session exists
// yet: email signups waiting on the confirmation mail, and social signups that
// leave the site for Kakao/Naver. On the first signed-in visit this copies the
// choice they already made (user_metadata for email, the parked choice for
// social) into consent_logs. A member with no choice on file at all — e.g. a
// first Kakao/Naver login straight from the login screen — gets a blocking
// consent screen, since the required consents are a condition of service.

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import {
  ConsentChecklist,
  NO_CONSENT,
  requiredConsentsOk,
  type ConsentValue,
} from "@/components/ConsentChecklist";
import {
  fetchConsents,
  recordConsents,
  takePendingConsents,
  type ConsentChoice,
} from "@/lib/consents";
import { getSupabase } from "@/lib/supabase";

function fromMetadata(raw: unknown): ConsentChoice | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  return {
    terms: c.terms === true,
    privacy: c.privacy === true,
    thirdParty: c.thirdParty === true,
    marketing: c.marketing === true,
  };
}

export function ConsentGate() {
  const { user, hydrated, logout } = useAuth();
  // User id the consent screen is showing for; tying it to the id means a
  // logout (or switching accounts) hides it without extra resets.
  const [neededFor, setNeededFor] = useState<string | null>(null);
  const [value, setValue] = useState<ConsentValue>(NO_CONSENT);
  const [saving, setSaving] = useState(false);
  const checkedFor = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !hydrated || !user) return;
    if (checkedFor.current === user.id) return;
    checkedFor.current = user.id;

    let cancelled = false;
    void (async () => {
      const current = await fetchConsents();
      // null = lookup failed; don't lock people out over a network blip.
      if (cancelled || !current || current.agreedAt) return;

      const pending = takePendingConsents();
      const { data } = await supabase.auth.getUser();
      const prior = pending ?? fromMetadata(data.user?.user_metadata?.consents);
      if (prior && requiredConsentsOk(prior)) {
        try {
          await recordConsents(prior, "signup", user.id);
          return;
        } catch {
          /* fall through to asking — better than an unrecorded member */
        }
      }
      if (!cancelled) {
        setValue(prior ?? NO_CONSENT);
        setNeededFor(user.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, user]);

  if (!user || neededFor !== user.id) return null;

  const submit = async () => {
    if (!requiredConsentsOk(value)) {
      toast.error("필수 항목(이용약관·개인정보 수집·이용)에 동의해 주세요.");
      return;
    }
    setSaving(true);
    try {
      await recordConsents(value, "signup", user.id);
      setNeededFor(null);
      toast.success("가입이 완료되었습니다. 환영합니다!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-gate-title"
      className="fixed inset-0 flex items-end justify-center overflow-y-auto bg-slate-900/60 p-0 sm:items-center sm:p-4"
      // Above the hero splash (200) and scam notice (150): required consent
      // comes before anything else on the page.
      style={{ zIndex: 300 }}
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <h2 id="consent-gate-title" className="text-xl font-bold text-slate-900">
          마지막 단계예요
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          마케팅방주를 이용하시려면 약관에 동의해 주세요.
        </p>

        <div className="mt-5">
          <ConsentChecklist value={value} onChange={setValue} />
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving || !requiredConsentsOk(value)}
          className="mt-5 w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {saving ? "저장 중…" : "동의하고 시작하기"}
        </button>
        <button
          type="button"
          onClick={logout}
          className="mt-2 w-full py-2 text-xs text-slate-400 underline underline-offset-2 transition hover:text-slate-600"
        >
          동의하지 않고 로그아웃
        </button>
      </div>
    </div>
  );
}
