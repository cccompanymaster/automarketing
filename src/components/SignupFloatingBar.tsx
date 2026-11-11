"use client";

// Guest home: a horizontal bar fixed to the bottom once the visitor scrolls
// past the hero — "회원가입 후 실행가로 셀프마케팅 진행하기" + signup. Closable
// for the rest of the visit; lifts the chat launcher while it shows.

import { useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";

const CLOSED_KEY = "mb_signup_bar_closed";

export function SignupFloatingBar() {
  const [show, setShow] = useState(false);
  const [closed, setClosed] = useState(true);

  useEffect(() => {
    let c = false;
    try {
      c = sessionStorage.getItem(CLOSED_KEY) === "1";
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once per visit
    setClosed(c);
    const onScroll = () => setShow(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visible = show && !closed;
  useEffect(() => {
    document.body.classList.toggle("has-bottom-bar", visible);
    return () => document.body.classList.remove("has-bottom-bar");
  }, [visible]);

  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(CLOSED_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 lg:left-64 ${visible ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
    >
      <div className="safe-bottom border-t border-emerald-800 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-white shadow-[0_-8px_24px_rgba(6,78,59,0.25)]">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <p className="min-w-0 flex-1 text-sm font-bold leading-snug sm:text-base">
            <span className="hidden sm:inline">🚀 </span>
            회원가입 후 <span className="text-amber-300">실행가 그대로</span> 셀프마케팅 진행하기
            <span className="hidden text-xs font-semibold text-emerald-100 md:inline"> · 가입비 0원 · 단가 공개</span>
          </p>
          <Link
            href="/start"
            tabIndex={visible ? 0 : -1}
            onClick={() => track("cta_click", { product_slug: "signup_bar" })}
            className="flex min-h-11 shrink-0 items-center rounded-xl bg-white px-4 text-sm font-extrabold text-emerald-800 shadow hover:bg-emerald-50 sm:px-5"
          >
            무료 가입 →
          </Link>
          <button
            type="button"
            tabIndex={visible ? 0 : -1}
            onClick={close}
            aria-label="가입 안내 배너 닫기"
            className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-emerald-100 hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
