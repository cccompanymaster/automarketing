"use client";

// Inquiry form modal (컨설팅/견적형 상품). Submits to the sheet+email webhook
// when configured, otherwise falls back to the visitor's mail client.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { submitInquiry, isInquiryWebhookConfigured } from "@/lib/inquiry";
import { track } from "@/lib/analytics";

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
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset per open
    setDone(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async () => {
    if (!name.trim() || !contact.trim() || !message.trim()) {
      toast.error("이름, 연락처, 문의 내용을 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const { via } = await submitInquiry({
        name: name.trim(),
        contact: contact.trim(),
        email: email.trim() || undefined,
        topic,
        message: message.trim(),
      });
      track("cta_click", { product_slug: "consulting" });
      if (via === "webhook") {
        setDone(true);
      } else {
        toast.success("메일 앱이 열렸어요. 전송 버튼만 눌러주시면 접수됩니다.");
        onClose();
      }
    } catch {
      toast.error("접수에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
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
        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl" aria-hidden="true">
              ✅
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">문의가 접수됐어요</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              담당자가 확인 후 <b>24시간 내</b>에 남겨주신 연락처로 회신드릴게요.
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

            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="mt-5 w-full rounded-xl bg-emerald-700 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {busy ? "접수 중…" : "문의 보내기"}
            </button>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              {isInquiryWebhookConfigured
                ? "접수 즉시 담당자에게 메일로 전달되고, 24시간 내 회신드려요."
                : "메일 앱이 열리면 전송 버튼을 눌러 완료해 주세요."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
