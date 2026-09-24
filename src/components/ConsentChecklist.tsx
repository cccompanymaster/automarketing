"use client";

// Signup consent checklist: agree-to-all banner + 2 required + 2 optional rows,
// each with a 보기 link into LegalModal. Shared by the email signup form and the
// post-login ConsentGate (social signups never see the signup form's fields).
// Required and optional are kept separate per PIPA 제22조.

import { useState } from "react";
import { LegalModal } from "@/components/LegalModal";
import type { LegalDocKey } from "@/lib/legal";
import { THIRD_PARTY_CONSENT_ENABLED } from "@/lib/consents";

export interface ConsentValue {
  terms: boolean;
  privacy: boolean;
  thirdParty: boolean;
  marketing: boolean;
}

export const NO_CONSENT: ConsentValue = {
  terms: false,
  privacy: false,
  thirdParty: false,
  marketing: false,
};

export const requiredConsentsOk = (v: ConsentValue) => v.terms && v.privacy;

const ROWS: { key: keyof ConsentValue; doc: LegalDocKey; label: string; required: boolean }[] = [
  { key: "terms", doc: "terms", label: "이용약관 동의", required: true },
  { key: "privacy", doc: "privacy", label: "개인정보 수집·이용 동의", required: true },
  { key: "thirdParty", doc: "thirdParty", label: "제3자 정보제공 동의", required: false },
  { key: "marketing", doc: "marketing", label: "마케팅 활용 및 정보 수신 동의", required: false },
].filter((r) => r.key !== "thirdParty" || THIRD_PARTY_CONSENT_ENABLED) as {
  key: keyof ConsentValue;
  doc: LegalDocKey;
  label: string;
  required: boolean;
}[];

export function ConsentChecklist({
  value,
  onChange,
}: {
  value: ConsentValue;
  onChange: (next: ConsentValue) => void;
}) {
  const [modalDoc, setModalDoc] = useState<LegalDocKey | null>(null);
  const allChecked = ROWS.every((r) => value[r.key]);

  return (
    <fieldset className="overflow-hidden rounded-2xl border border-slate-200">
      <legend className="sr-only">약관 동의</legend>

      {/* Agree-to-all — a full-width tap target, not a small checkbox */}
      <button
        type="button"
        onClick={() => {
          const next = !allChecked;
          onChange({
            terms: next,
            privacy: next,
            thirdParty: next && THIRD_PARTY_CONSENT_ENABLED,
            marketing: next,
          });
        }}
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
        {ROWS.map((r) => (
          <div key={r.key} className="flex items-center gap-1 text-sm">
            {/* Whole row toggles the consent — bigger, easier target */}
            <label
              htmlFor={`consent-${r.doc}`}
              className="flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-1 transition hover:bg-slate-50"
            >
              <input
                id={`consent-${r.doc}`}
                type="checkbox"
                checked={value[r.key]}
                onChange={(e) => onChange({ ...value, [r.key]: e.target.checked })}
                className="h-[18px] w-[18px] shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-600">
                <span className={r.required ? "font-semibold text-slate-500" : "text-slate-400"}>
                  [{r.required ? "필수" : "선택"}]
                </span>{" "}
                {r.label}
              </span>
            </label>
            <button
              type="button"
              onClick={() => setModalDoc(r.doc)}
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

      <LegalModal open={modalDoc !== null} docKey={modalDoc} onClose={() => setModalDoc(null)} />
    </fieldset>
  );
}
