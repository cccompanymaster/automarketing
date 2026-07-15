// Deliverables (산출물 컨펌) domain — admin uploads work output (e.g. a
// ghost-written press draft) for a member; the member reviews it on /mypage
// and either approves it or requests a revision with feedback.
//
// Stub mode (no Supabase): rows are stored in localStorage keyed by the
// member's email, so the demo works end-to-end in one browser (upload to your
// own email → review it on your mypage).
// Real mode: `deliverables` table + RPCs (see supabase/schema.sql) —
//   admin_upload_deliverable(email, title, content)  [is_admin() only]
//   review_deliverable(id, approve, feedback)        [owner only]

import { getSupabase } from "@/lib/supabase";

export type DeliverableStatus = "pending_review" | "approved" | "revision_requested";

export interface Deliverable {
  id: string;
  userEmail: string;
  title: string;
  content: string;
  status: DeliverableStatus;
  feedback: string | null;
  createdAt: string; // ISO
  reviewedAt: string | null; // ISO
}

export const DELIVERABLE_STATUS_LABEL: Record<DeliverableStatus, string> = {
  pending_review: "컨펌 대기",
  approved: "승인 완료",
  revision_requested: "수정 요청",
};

export const DELIVERABLE_STATUS_STYLE: Record<DeliverableStatus, string> = {
  pending_review: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  revision_requested: "bg-rose-50 text-rose-700",
};

// --- Stub storage (localStorage, keyed by member email) ---------------------

const STUB_PREFIX = "selfmarketing.deliverables.";

const stubKey = (email: string) => `${STUB_PREFIX}${email.trim().toLowerCase()}`;

export function loadStubDeliverables(email: string): Deliverable[] {
  try {
    const raw = localStorage.getItem(stubKey(email));
    if (raw) return JSON.parse(raw) as Deliverable[];
  } catch {
    /* ignore */
  }
  return [];
}

export function saveStubDeliverables(email: string, rows: Deliverable[]) {
  try {
    localStorage.setItem(stubKey(email), JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// --- Admin operations (upload + list) ---------------------------------------

export interface UploadDeliverableInput {
  userEmail: string;
  title: string;
  content: string;
}

/** Admin: upload a deliverable for a member (goes to 컨펌 대기). */
export async function adminUploadDeliverable(input: UploadDeliverableInput): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.rpc("admin_upload_deliverable", {
      p_email: input.userEmail.trim().toLowerCase(),
      p_title: input.title,
      p_content: input.content,
    });
    if (error) throw new Error(error.message);
    return;
  }
  // Stub: push into the member's local list.
  const row: Deliverable = {
    id: newId(),
    userEmail: input.userEmail.trim().toLowerCase(),
    title: input.title,
    content: input.content,
    status: "pending_review",
    feedback: null,
    createdAt: new Date().toISOString(),
    reviewedAt: null,
  };
  const rows = [row, ...loadStubDeliverables(row.userEmail)].slice(0, 100);
  saveStubDeliverables(row.userEmail, rows);
}

/** Admin: list every deliverable (RLS lets is_admin() read all rows). */
export async function adminListDeliverables(): Promise<Deliverable[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("deliverables")
      .select("id,user_email,title,content,status,feedback,created_at,reviewed_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRow);
  }
  // Stub: scan all local member lists.
  const all: Deliverable[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STUB_PREFIX)) {
        all.push(...(JSON.parse(localStorage.getItem(key) ?? "[]") as Deliverable[]));
      }
    }
  } catch {
    /* ignore */
  }
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRow(r: Record<string, any>): Deliverable {
  return {
    id: r.id as string,
    userEmail: (r.user_email as string) ?? "",
    title: (r.title as string) ?? "",
    content: (r.content as string) ?? "",
    status: r.status as DeliverableStatus,
    feedback: (r.feedback as string | null) ?? null,
    createdAt: r.created_at as string,
    reviewedAt: (r.reviewed_at as string | null) ?? null,
  };
}
