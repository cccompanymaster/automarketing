"use client";

// Review modal for a deliverable: shows the uploaded content; while pending
// the member can approve it or request a revision with feedback.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDeliverables } from "@/components/DeliverablesProvider";
import {
  DELIVERABLE_STATUS_LABEL,
  DELIVERABLE_STATUS_STYLE,
  type Deliverable,
} from "@/lib/deliverables";

export function DeliverableModal({
  deliverable,
  onClose,
}: {
  deliverable: Deliverable | null;
  onClose: () => void;
}) {
  const { review } = useDeliverables();
  const [feedback, setFeedback] = useState("");
  const [asking, setAsking] = useState(false); // revision form open
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Reset per-item state whenever a different deliverable opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFeedback("");
    setAsking(false);
  }, [deliverable]);

  useEffect(() => {
    if (!deliverable) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [deliverable, onClose]);

  if (!deliverable) return null;
  const d = deliverable;
  const pending = d.status === "pending_review";

  const approve = async () => {
    setBusy(true);
    try {
      await review(d.id, true);
      toast.success("승인했어요. 확정된 내용으로 진행할게요!");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const requestRevision = async () => {
    if (!feedback.trim()) {
      toast.error("어떤 부분을 고칠지 간단히 적어 주세요.");
      return;
    }
    setBusy(true);
    try {
      await review(d.id, false, feedback.trim());
      toast.success("수정 요청을 보냈어요. 반영해서 다시 올려드릴게요.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="산출물 컨펌"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${DELIVERABLE_STATUS_STYLE[d.status]}`}
            >
              {DELIVERABLE_STATUS_LABEL[d.status]}
            </span>
            <h2 className="mt-2 text-lg font-bold text-slate-900">{d.title}</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {new Date(d.createdAt).toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              업로드
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

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
            {d.content}
          </div>

          {d.status === "revision_requested" && d.feedback && (
            <div className="mt-4 rounded-xl bg-rose-50 p-4">
              <p className="text-xs font-bold text-rose-700">내가 보낸 수정 요청</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-rose-900">{d.feedback}</p>
            </div>
          )}
          {d.status === "approved" && d.reviewedAt && (
            <p className="mt-4 text-xs text-emerald-700">
              ✓ {new Date(d.reviewedAt).toLocaleDateString("ko-KR")} 에 승인했어요.
            </p>
          )}

          {pending && asking && (
            <div className="mt-4">
              <label htmlFor="deliverable-feedback" className="text-sm font-semibold text-slate-700">
                수정이 필요한 부분을 알려주세요
              </label>
              <textarea
                id="deliverable-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder="예) 두 번째 문단의 가격 표기를 빼 주시고, 매장 이름을 정확히 '○○점'으로 바꿔 주세요."
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {pending && (
          <div className="flex gap-2 border-t border-slate-100 p-5">
            {asking ? (
              <>
                <button
                  type="button"
                  onClick={() => setAsking(false)}
                  disabled={busy}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  뒤로
                </button>
                <button
                  type="button"
                  onClick={requestRevision}
                  disabled={busy}
                  className="min-h-11 flex-1 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
                >
                  {busy ? "보내는 중…" : "수정 요청 보내기"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAsking(true)}
                  disabled={busy}
                  className="min-h-11 flex-1 rounded-xl border border-rose-200 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                >
                  수정 요청
                </button>
                <button
                  type="button"
                  onClick={approve}
                  disabled={busy}
                  className="min-h-11 flex-1 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {busy ? "처리 중…" : "이대로 승인하기 ✓"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
