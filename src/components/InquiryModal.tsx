"use client";

// Inquiry form modal (컨설팅/견적형 상품). Submits inside the site (Supabase
// RPC → receipt code, or the sheet webhook). On failure — or when the site
// can't take inquiries itself — it keeps what was typed and offers 다시 시도,
// 카카오톡 상담, 전화, "이메일 앱에서 작성" and 내용 복사.

import { useEffect, useRef, useState } from "react";
import { useModal } from "@/components/useModal";
import { toast } from "sonner";
import { submitInquiry, canSubmitInquiry, inquiryMailto, inquiryText, InquiryError, type InquiryInput } from "@/lib/inquiry";
import { track } from "@/lib/analytics";
import { COMPANY } from "@/lib/company";

export function InquiryModal({
  open,
  topic,
  onClose,
}: {
  open: boolean;
  /** Prefilled subject (product/row name or "컨설팅 상담"). */
  topic: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  /** Receipt: code when the server issued one, "" for the webhook path. */
  const [done, setDone] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset per open
    setDone(null);
    setFailure(null);
  }, [open]);
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(panelRef, open, onClose);

  if (!open) return null;

  const input = (): InquiryInput => ({
    name: name.trim(),
    contact: contact.trim(),
    email: email.trim() || undefined,
    topic,
    message: message.trim(),
  });

  const submit = async () => {
    if (!name.trim() || !contact.trim() || !message.trim()) {
      toast.error("이름, 연락처, 문의 내용을 입력해 주세요.");
      return;
    }
    if (!canSubmitInquiry) {
      setFailure("사이트에서 바로 접수할 수 없어요. 아래 방법 중 편한 것으로 보내 주세요.");
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      const res = await submitInquiry(input());
      track("generate_lead", { topic });
      setDone(res.via === "server" ? res.code : "");
    } catch (e) {
      setFailure(e instanceof InquiryError ? e.message : "접수에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inquiryText(input()));
      toast.success("문의 내용을 복사했어요. 카카오톡이나 메일에 붙여 넣어 주세요.");
    } catch {
      toast.error("복사하지 못했어요. 내용을 직접 선택해 복사해 주세요.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="견적·문의"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done !== null ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl" aria-hidden="true">
              ✅
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">문의가 접수됐어요</h2>
            {done && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
                접수번호 <b className="num text-base text-slate-900">{done}</b>
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              담당자가 확인한 뒤 남겨 주신 연락처로 회신드릴게요.
              {done && <><br />카카오톡으로 문의할 때 접수번호를 알려 주시면 더 빨라요.</>}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">견적·문의하기</h2>
                <p className="mt-1 text-sm text-slate-500">
                  주제: <b className="text-slate-700">{topic}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3.5">
              <div>
                <label htmlFor="inq-name" className="block text-sm font-medium text-slate-700">
                  이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  id="inq-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label htmlFor="inq-contact" className="block text-sm font-medium text-slate-700">
                  연락처 <span className="text-rose-500">*</span>
                </label>
                <input
                  id="inq-contact"
                  type="tel"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="010-0000-0000 또는 카카오톡 ID"
                />
              </div>
              <div>
                <label htmlFor="inq-email" className="block text-sm font-medium text-slate-700">
                  이메일 <span className="text-slate-400">(선택)</span>
                </label>
                <input
                  id="inq-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label htmlFor="inq-message" className="block text-sm font-medium text-slate-700">
                  문의 내용 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="inq-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="업종, 지역, 원하는 키워드나 목표를 적어주시면 견적이 빨라져요."
                />
              </div>
            </div>

            {failure && (
              <div role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-100">
                <p className="font-semibold">{failure}</p>
                <p className="mt-1 text-xs text-rose-700">입력한 내용은 그대로 남아 있어요.</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs font-bold">
                  <a
                    href={COMPANY.kakaoChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-10 items-center justify-center rounded-lg bg-[#FEE500] text-slate-900"
                  >
                    카카오톡 상담
                  </a>
                  <a href={`tel:${COMPANY.phone}`} className="flex min-h-10 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200">
                    전화 {COMPANY.phone}
                  </a>
                  <a href={inquiryMailto(input())} className="flex min-h-10 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200">
                    이메일 앱에서 작성
                  </a>
                  <button type="button" onClick={copy} className="min-h-10 rounded-lg bg-white text-slate-700 ring-1 ring-slate-200">
                    내용 복사
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="mt-5 w-full rounded-xl bg-emerald-700 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {busy ? "접수 중…" : failure && canSubmitInquiry ? "다시 시도" : "문의 보내기"}
            </button>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              {canSubmitInquiry
                ? "사이트에서 바로 접수되고 접수번호를 알려 드려요."
                : "보내기를 누르면 카카오톡·전화·이메일 앱 중에서 고를 수 있어요."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
