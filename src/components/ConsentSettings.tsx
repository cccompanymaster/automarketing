"use client";

// Consent management card on /mypage. The privacy policy promises members can
// withdraw the optional consents (제3자 정보제공 · 마케팅 수신) at any time, so
// this is where that actually happens: toggling records a new append-only
// consent row rather than editing the old one.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { LegalModal } from "@/components/LegalModal";
import { fetchConsents, recordConsents, type ConsentState } from "@/lib/consents";
import type { LegalDocKey } from "@/lib/legal";

export function ConsentSettings() {
  const { user } = useAuth();
  const [state, setState] = useState<ConsentState | null>(null);
  const [busy, setBusy] = useState<"thirdParty" | "marketing" | null>(null);
  const [modalDoc, setModalDoc] = useState<LegalDocKey | null>(null);

  useEffect(() => {
    let active = true;
    void fetchConsents().then((c) => {
      if (active) setState(c);
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (!state) return null;

  const toggle = async (key: "thirdParty" | "marketing") => {
    const next: ConsentState = { ...state, [key]: !state[key] };
    setBusy(key);
    try {
      await recordConsents(
        {
          terms: next.terms,
          privacy: next.privacy,
          thirdParty: next.thirdParty,
          marketing: next.marketing,
        },
        "mypage",
        user?.id,
      );
      setState({ ...next, agreedAt: new Date().toISOString() });
      toast.success(next[key] ? "동의가 저장됐어요." : "동의를 철회했어요.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "처리에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  };

  const rows = [
    {
      key: "thirdParty" as const,
      doc: "thirdParty" as LegalDocKey,
      label: "제3자 정보제공 동의",
      desc: "제휴사에 이름·연락처 등을 제공해 맞춤 상품을 안내받아요.",
    },
    {
      key: "marketing" as const,
      doc: "marketing" as LegalDocKey,
      label: "마케팅 정보 수신 동의",
      desc: "신규 상품·할인 혜택 소식을 이메일·문자로 받아요.",
    },
  ];

  return (
    <section
      aria-label="동의 관리"
      className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <h2 className="text-base font-bold text-slate-900">선택 동의 관리</h2>
      <p className="mt-1 text-xs text-slate-400">
        언제든지 켜고 끌 수 있어요. 끄더라도 서비스 이용에는 아무런 제한이 없습니다.
      </p>

      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li
            key={r.key}
            className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                {r.label}
                <button
                  type="button"
                  onClick={() => setModalDoc(r.doc)}
                  className="text-xs font-medium text-slate-400 underline underline-offset-2 hover:text-emerald-700"
                >
                  내용 보기
                </button>
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{r.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state[r.key]}
              aria-label={r.label}
              disabled={busy !== null}
              onClick={() => toggle(r.key)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
                state[r.key] ? "bg-emerald-600" : "bg-slate-200"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  state[r.key] ? "left-6" : "left-1"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      {state.agreedAt && (
        <p className="num mt-3 text-[11px] text-slate-400">
          마지막 변경: {new Date(state.agreedAt).toLocaleString("ko-KR")}
        </p>
      )}

      <LegalModal open={modalDoc !== null} docKey={modalDoc} onClose={() => setModalDoc(null)} />
    </section>
  );
}
