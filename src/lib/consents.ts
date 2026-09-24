// Consent state (제3자 제공 · 마케팅 수신) read/write.
//
// The privacy policy promises members can withdraw the optional consents at any
// time, so this is the single entry point for both reading the current state
// and recording a change. Records are append-only: every change inserts a new
// consent_logs row, so "what did the user agree to, and when" stays provable —
// which is what makes third-party provision defensible (개인정보 보호법 제17조).
//
// Stub mode keeps the same shape in localStorage so the flow is testable
// without a backend.

import { getSupabase } from "@/lib/supabase";
import type { ConsentRecord } from "@/components/AuthProvider";

/**
 * Version of the consent documents the user agreed to (see lib/legal.ts).
 * 2026-09-23: third-party provision excludes Naver-login data.
 * 2026-09-24: marketing consent now also covers follow-up sales, new product
 *   proposals and portfolio use by the company itself. Marketing consents
 *   recorded under an earlier version only cover the old, narrower wording.
 */
export const CONSENT_DOC_VERSION = "2026-09-24";

/**
 * Third-party provision consent. Off: there is no named outside recipient
 * (the operator's own use is covered by the marketing consent, not this), and
 * PIPA 제17조 needs the recipient named for the consent to hold. Existing
 * records stay; turn back on once THIRD_PARTY names a real recipient.
 */
export const THIRD_PARTY_CONSENT_ENABLED = false;

const STUB_KEY = "selfmarketing.auth.user.consents";

export type ConsentSource = "signup" | "mypage";

export interface ConsentState {
  terms: boolean;
  privacy: boolean;
  thirdParty: boolean;
  marketing: boolean;
  /** ISO timestamp of the most recent record. */
  agreedAt: string | null;
}

const EMPTY: ConsentState = {
  terms: false,
  privacy: false,
  thirdParty: false,
  marketing: false,
  agreedAt: null,
};

/** Current consent state for the signed-in member (null when unknown). */
export async function fetchConsents(): Promise<ConsentState | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("consent_logs")
      .select("terms,privacy,third_party,marketing,created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) return null;
    const row = data?.[0];
    if (!row) return EMPTY;
    return {
      terms: !!row.terms,
      privacy: !!row.privacy,
      thirdParty: !!row.third_party,
      marketing: !!row.marketing,
      agreedAt: (row.created_at as string) ?? null,
    };
  }
  try {
    const raw = localStorage.getItem(STUB_KEY);
    if (!raw) return EMPTY;
    const c = JSON.parse(raw) as ConsentRecord;
    return {
      terms: !!c.terms,
      privacy: !!c.privacy,
      thirdParty: !!c.thirdParty,
      marketing: !!c.marketing,
      agreedAt: c.agreedAt ?? null,
    };
  } catch {
    return EMPTY;
  }
}

/**
 * Append a consent record. `userId` is required in real mode (RLS checks that
 * the row belongs to the caller). Never updates an existing row.
 */
export async function recordConsents(
  consents: Omit<ConsentState, "agreedAt">,
  source: ConsentSource,
  userId?: string,
): Promise<void> {
  const supabase = getSupabase();
  if (supabase && userId) {
    const { error } = await supabase.from("consent_logs").insert({
      user_id: userId,
      terms: consents.terms,
      privacy: consents.privacy,
      third_party: consents.thirdParty,
      marketing: consents.marketing,
      doc_version: CONSENT_DOC_VERSION,
      source,
    });
    if (error) throw new Error(error.message);
    return;
  }
  const record: ConsentRecord = { ...consents, agreedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STUB_KEY, JSON.stringify(record));
  } catch {
    /* ignore */
  }
}

// Social signups: the checkboxes are ticked before the OAuth redirect, but the
// account (and therefore the user id RLS needs) only exists after it. The
// choice is parked here and recorded by ConsentGate once the session is back.
const PENDING_KEY = "selfmarketing.oauth.consents";
const PENDING_MAX_AGE_MS = 30 * 60 * 1000;

export type ConsentChoice = Omit<ConsentState, "agreedAt">;

export function stashPendingConsents(c: ConsentChoice): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ ...c, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

/** Read and clear the parked choice (null if absent or stale). */
export function takePendingConsents(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as ConsentChoice & { at?: number };
    if (!c.at || Date.now() - c.at > PENDING_MAX_AGE_MS) return null;
    return {
      terms: !!c.terms,
      privacy: !!c.privacy,
      thirdParty: !!c.thirdParty,
      marketing: !!c.marketing,
    };
  } catch {
    return null;
  }
}
