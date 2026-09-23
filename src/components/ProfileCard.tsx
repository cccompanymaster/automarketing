"use client";

// 내 정보 card on /mypage: shows and edits the member profile. Kakao/Naver
// sign-in prefills it; email members fill it in themselves.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import {
  AGE_RANGES,
  EMPTY_PROFILE,
  GENDER_LABEL,
  ageRangeLabel,
  fetchProfile,
  saveProfile,
  type Gender,
  type MemberProfile,
} from "@/lib/profile";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export function ProfileCard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [draft, setDraft] = useState<MemberProfile>(EMPTY_PROFILE);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchProfile().then((p) => {
      if (active) setProfile(p);
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (!profile) return null;

  const rows: [string, string][] = [
    ["이름", profile.name],
    ["이메일", user?.email ?? ""],
    ["휴대전화번호", profile.phone],
    ["출생연도", profile.birthYear && `${profile.birthYear}년`],
    ["생일", profile.birthday && profile.birthday.replace(/^(\d{2})-(\d{2})$/, "$1월 $2일")],
    ["연령대", profile.ageRange && ageRangeLabel(profile.ageRange)],
    ["성별", GENDER_LABEL[profile.gender]],
  ];

  const set = (k: keyof MemberProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft({ ...draft, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.birthday && !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(draft.birthday)) {
      toast.error("생일은 월-일 형식(예: 05-17)으로 입력해 주세요.");
      return;
    }
    if (draft.birthYear && !/^(19|20)\d{2}$/.test(draft.birthYear)) {
      toast.error("출생연도는 4자리 숫자(예: 1990)로 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      await saveProfile(draft);
      setProfile(draft);
      setEditing(false);
      toast.success("내 정보를 저장했어요.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label="내 정보" className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">내 정보</h2>
          <p className="mt-1 text-xs text-slate-400">
            회원 정보를 확인하고 수정할 수 있어요. 네이버·카카오로 가입하면 자동으로 채워져요.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(profile);
              setEditing(true);
            }}
            className="flex min-h-9 shrink-0 items-center rounded-lg border border-slate-200 px-3.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            수정
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            이름
            <input value={draft.name} onChange={set("name")} autoComplete="name" className={inputClass} />
          </label>
          <label className="text-xs font-medium text-slate-600">
            휴대전화번호
            <input
              value={draft.phone}
              onChange={set("phone")}
              type="tel"
              autoComplete="tel"
              placeholder="010-0000-0000"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            출생연도
            <input
              value={draft.birthYear}
              onChange={set("birthYear")}
              inputMode="numeric"
              maxLength={4}
              placeholder="1990"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            생일 (월-일)
            <input
              value={draft.birthday}
              onChange={set("birthday")}
              inputMode="numeric"
              maxLength={5}
              placeholder="05-17"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            연령대
            <select value={draft.ageRange} onChange={set("ageRange")} className={inputClass}>
              <option value="">선택 안 함</option>
              {AGE_RANGES.map((r) => (
                <option key={r} value={r}>
                  {ageRangeLabel(r)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            성별
            <select value={draft.gender} onChange={set("gender")} className={inputClass}>
              <option value="">선택 안 함</option>
              {(["female", "male"] as Gender[]).map((g) => (
                <option key={g} value={g}>
                  {GENDER_LABEL[g]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
            >
              취소
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-4 divide-y divide-slate-50 rounded-xl border border-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
              <dt className="w-24 shrink-0 text-slate-400">{label}</dt>
              <dd className={`min-w-0 break-all ${value ? "font-medium text-slate-800" : "text-slate-300"}`}>
                {value || "미입력"}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
