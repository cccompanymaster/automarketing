"use client";

// Floating consultation chat (guests and members). The bot answers from the
// site's knowledge base; "상담원 연결" (카카오톡 1:1) is always one tap away and
// is offered inline whenever the bot can't help.

import { useEffect, useRef, useState } from "react";
import { COMPANY } from "@/lib/company";
import { askChatbot, CHAT_SUGGESTIONS, type ChatMessage } from "@/lib/chatbot";

const GREETING: ChatMessage = {
  role: "assistant",
  content: "안녕하세요, 마케팅방주 상담 챗봇이에요. 상품·가격·충전·환불 무엇이든 물어보세요. 사람이 필요하면 언제든 [상담원 연결]을 눌러 주세요.",
};

function HandoffLink({ className = "" }: { className?: string }) {
  return (
    <a
      href={COMPANY.kakaoChatUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#FEE500] px-4 text-sm font-bold text-slate-900 transition hover:brightness-95 ${className}`}
    >
      💬 상담원 연결
    </a>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: q.slice(0, 1000) }];
    setMessages(next);
    setInput("");
    setBusy(true);
    const result = await askChatbot(next.filter((m) => m !== GREETING));
    setBusy(false);
    if ("unavailable" in result) {
      setUnavailable(true);
      setMessages([
        ...next,
        { role: "assistant", content: "지금은 자동 답변을 준비 중이에요. 상담원이 카카오톡으로 바로 답해 드릴게요.", handoff: true },
      ]);
      return;
    }
    setMessages([...next, { role: "assistant", content: result.reply, handoff: result.handoff }]);
  };

  return (
    <>
      {/* Launcher — sits above the service pages' sticky order bar on phones */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "상담 창 닫기" : "상담 챗봇 열기"}
        className="chat-fab fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-emerald-700 px-5 text-base font-bold text-white shadow-xl transition hover:bg-emerald-800 lg:bottom-6 lg:right-6"
      >
        <span aria-hidden="true">{open ? "✕" : "💬"}</span>
        <span className="hidden sm:inline">{open ? "닫기" : "상담하기"}</span>
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="마케팅방주 상담"
          className="chat-panel fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+9.5rem)] z-40 flex max-h-[min(36rem,calc(100dvh-12rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 sm:inset-x-auto sm:right-4 sm:w-[24rem] lg:bottom-24 lg:right-6"
        >
          <header className="flex items-center justify-between gap-3 bg-emerald-700 px-4 py-3 text-white">
            <div>
              <h2 className="text-base font-bold">마케팅방주 상담</h2>
              <p className="text-xs text-emerald-100">AI가 먼저 답하고, 필요하면 상담원이 이어받아요</p>
            </div>
            <HandoffLink className="shrink-0 px-3 text-xs" />
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start gap-2"}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
                    m.role === "user" ? "bg-emerald-600 text-white" : "bg-white text-slate-800 ring-1 ring-slate-100"
                  }`}
                >
                  {m.content}
                </p>
                {m.role === "assistant" && m.handoff && <HandoffLink />}
              </div>
            ))}
            {busy && <p className="text-sm text-slate-400">답변을 준비하고 있어요…</p>}
            {messages.length === 1 && !unavailable && (
              <div className="flex flex-wrap gap-2 pt-1">
                {CHAT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2 border-t border-slate-100 p-3"
          >
            <label htmlFor="chat-input" className="sr-only">
              질문 입력
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={1000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="궁금한 점을 입력하세요"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="h-11 shrink-0 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              보내기
            </button>
          </form>
          <p className="px-3 pb-2 text-center text-[11px] text-slate-400">
            AI 답변은 참고용이에요. 비밀번호·카드번호 같은 개인정보는 입력하지 마세요.
          </p>
        </section>
      )}
    </>
  );
}
