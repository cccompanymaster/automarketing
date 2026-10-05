"use client";

// Makes sure every signed-in member has a reachable mobile number — the one
// required profile item (주문·작업 안내·입금 확인 연락). Email signups enter it
// on the form; Kakao/Naver signups usually bring it from the provider. When it
// is still missing, this asks once after login, together with the optional
// 성별·연령대. Sits just under ConsentGate (300), so required consent comes first.

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { ExtraProfileFields, formatPhoneTyping, type ExtraProfileValue } from "@/components/ExtraProfileFields";
import { fetchProfile, hasRequiredProfile, normalizePhone, saveProfile, type MemberProfile } from "@/lib/profile";
import { getSupabase } from "@/lib/supabase";

export function ProfileGate() {
  const { user, hydrated, logout } = useAuth();
  const [neededFor, setNeededFor] = useState<string | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [extra, setExtra] = useState<ExtraProfileValue>({ phone: "", gender: "", ageRange: "" });
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const checkedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!getSupabase() || !hydrated || !user) return;
    if (checkedFor.current === user.id) return;
    checkedFor.current = user.id;
    let cancelled = false;
    void fetchProfile()
      .then((p) => {
        if (cancelled || hasRequiredProfile(p)) return;
        setProfile(p);
        setExtra({ phone: formatPhoneTyping(p.phone), gender: p.gender, ageRange: p.ageRange });
        setNeededFor(user.id);
      })
      .catch(() => {
        /* don't lock people out over a network blip */
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, user]);

  if (!user || neededFor !== user.id || !profile) return null;

  const submit = async () => {
    const phone = normalizePhone(extra.phone);
    if (!phone) {
      setError("휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)");
      return;
    }
    setSaving(true);
    try {
      await saveProfile({ ...profile, phone, gender: extra.gender, ageRange: extra.ageRange });
      setNeededFor(null);
      toast.success("정보를 저장했어요.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-gate-title"
      className="fixed inset-0 flex items-end justify-center overflow-y-auto bg-slate-900/60 p-0 sm:items-center sm:p-4"
      style={{ zIndex: 290 }}
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl sm:p-7">
        <h2 id="profile-gate-title" className="text-lg font-extrabold text-slate-900">
          연락받을 휴대폰 번호를 알려 주세요
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          주문 진행·작업 안내·입금 확인을 위해 한 번만 입력하면 돼요. 마이페이지 &lsquo;내 정보&rsquo;에서 언제든 바꿀 수 있어요.
        </p>
        <div className="mt-5">
          <ExtraProfileFields idPrefix="gate" value={extra} onChange={(v) => { setExtra(v); setError(undefined); }} phoneError={error} />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="mt-6 w-full rounded-xl bg-emerald-700 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {saving ? "저장 중…" : "저장하고 계속하기"}
        </button>
        <button type="button" onClick={logout} className="mt-3 w-full text-center text-xs text-slate-400 underline underline-offset-2">
          로그아웃
        </button>
      </div>
    </div>
  );
}
