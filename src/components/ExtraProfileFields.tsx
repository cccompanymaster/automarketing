"use client";

// 휴대폰(필수) · 성별(선택) · 연령대(선택) — shared by the email signup form and
// the post-login ProfileGate (social signups). Phone is needed to run orders
// (작업 진행·입금 확인 연락); gender/age band are optional because they only
// serve 맞춤 안내·마케팅 (PIPA 제16조③ — no refusing service over optional data).

import { AGE_RANGES, ageRangeLabel, type Gender } from "@/lib/profile";

export interface ExtraProfileValue {
  phone: string;
  gender: Gender;
  ageRange: string;
}

const INPUT =
  "mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 aria-invalid:border-red-400";

/** Format digits as 010-1234-5678 while typing. */
export function formatPhoneTyping(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export function ExtraProfileFields({
  value,
  onChange,
  phoneError,
  idPrefix,
}: {
  value: ExtraProfileValue;
  onChange: (v: ExtraProfileValue) => void;
  phoneError?: string;
  idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-phone`} className="block text-sm font-medium text-slate-700">
          휴대폰 번호
        </label>
        <input
          id={`${idPrefix}-phone`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: formatPhoneTyping(e.target.value) })}
          aria-invalid={phoneError ? true : undefined}
          aria-describedby={phoneError ? `${idPrefix}-phone-error` : `${idPrefix}-phone-help`}
          className={INPUT}
          placeholder="010-1234-5678"
        />
        {phoneError ? (
          <p id={`${idPrefix}-phone-error`} className="mt-1.5 text-xs text-red-600">
            {phoneError}
          </p>
        ) : (
          <p id={`${idPrefix}-phone-help`} className="mt-1.5 text-xs text-slate-400">
            주문 진행·작업 안내·입금 확인 연락에 사용해요.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${idPrefix}-gender`} className="block text-sm font-medium text-slate-700">
            성별 <span className="text-slate-400">(선택)</span>
          </label>
          <select
            id={`${idPrefix}-gender`}
            value={value.gender}
            onChange={(e) => onChange({ ...value, gender: e.target.value as Gender })}
            className={INPUT}
          >
            <option value="">선택 안 함</option>
            <option value="female">여성</option>
            <option value="male">남성</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-age`} className="block text-sm font-medium text-slate-700">
            연령대 <span className="text-slate-400">(선택)</span>
          </label>
          <select
            id={`${idPrefix}-age`}
            value={value.ageRange}
            onChange={(e) => onChange({ ...value, ageRange: e.target.value })}
            className={INPUT}
          >
            <option value="">선택 안 함</option>
            {AGE_RANGES.map((r) => (
              <option key={r} value={r}>
                {ageRangeLabel(r)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="-mt-2 text-[11px] text-slate-400">성별·연령대는 맞춤 안내에 쓰이며, 입력하지 않아도 가입할 수 있어요.</p>
    </div>
  );
}
