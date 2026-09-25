// Calculator comment board — data layer. Comments are the ONLY thing from the
// calculator pages that is stored on a server, and they never include
// calculation inputs. Real mode goes through the calc_comment_* RPCs
// (supabase/schema.sql: bcrypt password hash, honeypot + timing + per-IP rate
// limit, 1-depth replies); stub mode keeps them in localStorage.

import { getSupabase } from "@/lib/supabase";

export interface CommentRow {
  id: string;
  parentId: string | null;
  nickname: string;
  body: string;
  createdAt: string;
  deleted: boolean;
}

export interface CommentThread extends CommentRow {
  replies: CommentRow[];
}

export const COMMENT_LIMITS = {
  nickname: { min: 1, max: 20 },
  password: { min: 4, max: 30 },
  body: { min: 2, max: 1000 },
  maxLinks: 2,
  /** A human can't read the page and type a comment faster than this. */
  minElapsedMs: 3000,
} as const;

export interface CommentDraft {
  nickname: string;
  password: string;
  body: string;
}

/** Client-side mirror of the server checks (server re-validates everything). */
export function validateComment(d: CommentDraft): string | null {
  const nick = d.nickname.trim();
  const body = d.body.trim();
  const L = COMMENT_LIMITS;
  if (nick.length < L.nickname.min || nick.length > L.nickname.max) return `닉네임은 ${L.nickname.min}~${L.nickname.max}자로 입력해 주세요.`;
  if (/[<>\u0000-\u001f]/.test(nick)) return "닉네임에 < > 기호나 제어 문자는 쓸 수 없어요.";
  if (d.password.length < L.password.min || d.password.length > L.password.max) return `비밀번호는 ${L.password.min}~${L.password.max}자로 입력해 주세요.`;
  if (body.length < L.body.min) return `내용을 ${L.body.min}자 이상 입력해 주세요.`;
  if (body.length > L.body.max) return `내용은 ${L.body.max.toLocaleString("ko-KR")}자까지 쓸 수 있어요.`;
  if ((body.toLowerCase().match(/http/g) ?? []).length > L.maxLinks) return `링크는 ${L.maxLinks}개까지만 넣을 수 있어요.`;
  return null;
}

/** Group flat rows into top-level threads (oldest first) with replies. */
export function buildThreads(rows: CommentRow[]): CommentThread[] {
  const tops = rows.filter((r) => !r.parentId).map((r) => ({ ...r, replies: [] as CommentRow[] }));
  const byId = new Map(tops.map((t) => [t.id, t]));
  for (const r of rows) {
    if (r.parentId) byId.get(r.parentId)?.replies.push(r);
  }
  // A deleted parent is only worth showing while it still has live replies.
  return tops.filter((t) => !t.deleted || t.replies.some((r) => !r.deleted));
}

const SERVER_ERRORS: Record<string, string> = {
  spam_detected: "너무 빠르게 등록했어요. 잠시 후 다시 시도해 주세요.",
  rate_limited: "짧은 시간에 너무 많이 시도했어요. 10분 뒤 다시 시도해 주세요.",
  duplicate: "같은 내용의 댓글이 이미 등록돼 있어요.",
  invalid_parent: "답글을 달 수 없는 댓글이에요.",
  invalid_nickname: "닉네임을 확인해 주세요.",
  invalid_password: "비밀번호는 4~30자로 입력해 주세요.",
  invalid_body: "내용을 확인해 주세요.",
  too_many_links: "링크는 2개까지만 넣을 수 있어요.",
};

function friendly(err: { message?: string } | null): string {
  const key = Object.keys(SERVER_ERRORS).find((k) => err?.message?.includes(k));
  return key ? SERVER_ERRORS[key] : "잠시 후 다시 시도해 주세요.";
}

// ---- stub mode (no Supabase): localStorage, same rules -------------------

const STUB_KEY = "selfmarketing.calc.comments";

interface StubRow extends CommentRow {
  slug: string;
  pw: string;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function stubRead(): StubRow[] {
  try {
    return JSON.parse(localStorage.getItem(STUB_KEY) ?? "[]") as StubRow[];
  } catch {
    return [];
  }
}

function stubWrite(rows: StubRow[]) {
  try {
    localStorage.setItem(STUB_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

// ---- API -----------------------------------------------------------------

export async function listComments(slug: string): Promise<CommentRow[]> {
  const sb = getSupabase();
  if (!sb) {
    return stubRead()
      .filter((r) => r.slug === slug)
      .map(({ slug: _s, pw: _p, ...r }) => r);
  }
  const { data, error } = await sb.rpc("calc_comment_list", { p_slug: slug });
  if (error) throw new Error("댓글을 불러오지 못했어요.");
  return ((data ?? []) as { id: string; parent_id: string | null; nickname: string; body: string; created_at: string; deleted: boolean }[]).map(
    (r) => ({ id: r.id, parentId: r.parent_id, nickname: r.nickname, body: r.body, createdAt: r.created_at, deleted: r.deleted }),
  );
}

export async function addComment(
  slug: string,
  draft: CommentDraft,
  opts: { parentId?: string | null; honeypot?: string; elapsedMs: number },
): Promise<void> {
  const problem = validateComment(draft);
  if (problem) throw new Error(problem);
  if (opts.honeypot || opts.elapsedMs < COMMENT_LIMITS.minElapsedMs) throw new Error(SERVER_ERRORS.spam_detected);
  const sb = getSupabase();
  if (!sb) {
    const rows = stubRead();
    rows.push({
      id: crypto.randomUUID(),
      slug,
      parentId: opts.parentId ?? null,
      nickname: draft.nickname.trim(),
      body: draft.body.trim(),
      createdAt: new Date().toISOString(),
      deleted: false,
      pw: await sha256(draft.password),
    });
    stubWrite(rows);
    return;
  }
  const { error } = await sb.rpc("calc_comment_add", {
    p_slug: slug,
    p_parent: opts.parentId ?? null,
    p_nickname: draft.nickname,
    p_password: draft.password,
    p_body: draft.body,
    p_honeypot: opts.honeypot ?? "",
    p_elapsed_ms: Math.round(opts.elapsedMs),
  });
  if (error) throw new Error(friendly(error));
}

/** Resolves false when the password doesn't match. */
export async function deleteComment(id: string, password: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) {
    const rows = stubRead();
    const hit = rows.find((r) => r.id === id && !r.deleted);
    if (!hit || hit.pw !== (await sha256(password))) return false;
    hit.deleted = true;
    hit.body = "";
    hit.nickname = "";
    stubWrite(rows);
    return true;
  }
  const { data, error } = await sb.rpc("calc_comment_delete", { p_id: id, p_password: password });
  if (error) throw new Error(friendly(error));
  return data === true;
}
