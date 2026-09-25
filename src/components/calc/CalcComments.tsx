"use client";

// Per-calculator comment board: list, post with nickname + password, one level
// of replies, delete your own comment with its password. Text is rendered as
// React text nodes only (auto-escaped; never innerHTML). Anti-spam: hidden
// honeypot field + time-on-page check here, re-checked and rate-limited on the
// server (see lib/calc/comments.ts).

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  COMMENT_LIMITS,
  addComment,
  buildThreads,
  deleteComment,
  listComments,
  validateComment,
  type CommentRow,
  type CommentThread,
} from "@/lib/calc/comments";

const INPUT =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function CommentForm({
  slug,
  parentId,
  onDone,
  onCancel,
  compact,
}: {
  slug: string;
  parentId?: string;
  onDone: () => void;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [body, setBody] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openedAt = useRef<number>(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);
  const idp = parentId ? `r-${parentId.slice(0, 8)}` : "new";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateComment({ nickname, password, body });
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addComment(slug, { nickname, password, body }, { parentId, honeypot: hp, elapsedMs: Date.now() - openedAt.current });
      setBody("");
      toast.success(parentId ? "답글을 등록했어요." : "댓글을 등록했어요.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`space-y-2.5 ${compact ? "" : "rounded-2xl bg-white p-4 ring-1 ring-slate-100"}`} noValidate>
      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          홈페이지
          <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`${idp}-nick`} className="sr-only">닉네임</label>
          <input id={`${idp}-nick`} className={INPUT} placeholder="닉네임" maxLength={COMMENT_LIMITS.nickname.max} value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="nickname" />
        </div>
        <div>
          <label htmlFor={`${idp}-pw`} className="sr-only">삭제용 비밀번호</label>
          <input id={`${idp}-pw`} type="password" className={INPUT} placeholder="비밀번호 (삭제용)" maxLength={COMMENT_LIMITS.password.max} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
      </div>
      <div>
        <label htmlFor={`${idp}-body`} className="sr-only">{parentId ? "답글 내용" : "댓글 내용"}</label>
        <textarea
          id={`${idp}-body`}
          rows={compact ? 2 : 3}
          maxLength={COMMENT_LIMITS.body.max}
          placeholder={parentId ? "답글을 남겨 주세요" : "계산기를 써 본 경험이나 궁금한 점을 남겨 주세요. 개인정보는 적지 마세요."}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400">
          {body.trim().length.toLocaleString("ko-KR")}/{COMMENT_LIMITS.body.max.toLocaleString("ko-KR")}자
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="min-h-10 rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
              취소
            </button>
          )}
          <button type="submit" disabled={busy} className="min-h-10 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60">
            {busy ? "등록 중…" : parentId ? "답글 등록" : "댓글 등록"}
          </button>
        </div>
      </div>
    </form>
  );
}

function DeleteBox({ id, onDone, onCancel }: { id: string; onDone: () => void; onCancel: () => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw) return;
    setBusy(true);
    try {
      const ok = await deleteComment(id, pw);
      if (ok) {
        toast.success("삭제했어요.");
        onDone();
      } else toast.error("비밀번호가 맞지 않아요.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="mt-2 flex gap-2">
      <label htmlFor={`del-${id}`} className="sr-only">삭제 비밀번호</label>
      <input id={`del-${id}`} type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="작성할 때 입력한 비밀번호" className={`${INPUT} h-10 flex-1`} autoComplete="current-password" />
      <button type="submit" disabled={busy} className="min-h-10 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">
        삭제
      </button>
      <button type="button" onClick={onCancel} className="min-h-10 rounded-xl px-3 text-sm text-slate-500 hover:bg-slate-100">
        취소
      </button>
    </form>
  );
}

function CommentItem({
  c,
  slug,
  canReply,
  refresh,
}: {
  c: CommentRow | CommentThread;
  slug: string;
  canReply: boolean;
  refresh: () => void;
}) {
  const [mode, setMode] = useState<"none" | "reply" | "delete">("none");
  if (c.deleted) {
    return <p className="py-3 text-sm italic text-slate-400">삭제된 댓글이에요.</p>;
  }
  return (
    <div className="py-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-bold text-slate-800">{c.nickname}</span>
        <time dateTime={c.createdAt} className="text-[11px] text-slate-400">
          {when(c.createdAt)}
        </time>
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{c.body}</p>
      <div className="mt-1 flex gap-1">
        {canReply && (
          <button type="button" onClick={() => setMode(mode === "reply" ? "none" : "reply")} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">
            답글
          </button>
        )}
        <button type="button" onClick={() => setMode(mode === "delete" ? "none" : "delete")} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-slate-400 hover:bg-slate-100">
          삭제
        </button>
      </div>
      {mode === "delete" && (
        <DeleteBox
          id={c.id}
          onCancel={() => setMode("none")}
          onDone={() => {
            setMode("none");
            refresh();
          }}
        />
      )}
      {mode === "reply" && (
        <div className="mt-2 rounded-xl bg-slate-50 p-3">
          <CommentForm
            slug={slug}
            parentId={c.id}
            compact
            onCancel={() => setMode("none")}
            onDone={() => {
              setMode("none");
              refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}

export function CalcComments({ slug }: { slug: string }) {
  const [threads, setThreads] = useState<CommentThread[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listComments(slug)
      .then((rows) => {
        setThreads(buildThreads(rows));
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const count = threads?.reduce((n, t) => n + (t.deleted ? 0 : 1) + t.replies.filter((r) => !r.deleted).length, 0) ?? 0;

  return (
    <section aria-labelledby="calc-comments" className="mt-10">
      <h2 id="calc-comments" className="text-lg font-bold text-slate-900">
        댓글 <span className="text-emerald-700">{count}</span>
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        닉네임과 비밀번호만으로 남길 수 있어요. 비밀번호는 암호화해 저장하며, 계산에 입력한 값은 댓글과 함께 저장되지 않아요.
      </p>
      <div className="mt-3">
        <CommentForm slug={slug} onDone={refresh} />
      </div>
      <div className="mt-4 rounded-2xl bg-white px-4 ring-1 ring-slate-100">
        {error && <p className="py-4 text-sm text-rose-600">{error}</p>}
        {!error && threads === null && <p className="py-4 text-sm text-slate-400">불러오는 중…</p>}
        {!error && threads?.length === 0 && <p className="py-6 text-center text-sm text-slate-400">첫 댓글을 남겨 주세요.</p>}
        <ul className="divide-y divide-slate-100">
          {threads?.map((t) => (
            <li key={t.id}>
              <CommentItem c={t} slug={slug} canReply refresh={refresh} />
              {t.replies.length > 0 && (
                <ul className="mb-3 ml-4 divide-y divide-slate-100 border-l-2 border-emerald-100 pl-3">
                  {t.replies.map((r) => (
                    <li key={r.id}>
                      <CommentItem c={r} slug={slug} canReply={false} refresh={refresh} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
