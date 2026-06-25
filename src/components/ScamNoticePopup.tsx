"use client";

// Scam / impersonation notice — shown as a popup once per browser. After the
// user dismisses it (stored in localStorage), it never shows again.

import { useEffect, useState } from "react";

const SEEN_KEY = "mb_scam_notice_seen";

export function ScamNoticePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time notice check
    if (!seen) setOpen(true);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    // Move the user into the services section after confirming.
    try {
      document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사기·사칭 주의 안내"
      onClick={close}
      className="fixed inset-0 flex items-center justify-center bg-slate-900/50 p-5"
      style={{ zIndex: 150 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-xl"
        style={{ animation: "popIn .35s ease both" }}
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
          style={{ background: "#FFF7ED" }}
          aria-hidden="true"
        >
          ⚠️
        </div>
        <h2 className="mt-4 text-lg font-extrabold text-slate-900">사기·사칭 주의</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          <b className="text-slate-800">마케팅방주</b>는 공식 채널 외 <b>개인 연락처·계좌로 선입금</b>을
          요구하지 않습니다. 유사 상호·사칭 연락에 각별히 유의해 주세요.
        </p>
        <button
          type="button"
          onClick={close}
          className="mt-6 w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          확인했어요
        </button>
      </div>
    </div>
  );
}
