// Inquiry (컨설팅/견적 문의) submission.
//
// 1. Supabase configured → submit_inquiry RPC. The row lands in
//    public.inquiries, the owner gets an email (notify-admin), and the visitor
//    gets a receipt code (Q1104-AB12) right away.
// 2. Else NEXT_PUBLIC_INQUIRY_WEBHOOK_URL (Google Apps Script → 문의 sheet +
//    email, docs/SHEET_INTEGRATION.md).
// 3. Else nothing is sent from the site: the modal offers "이메일 앱에서 작성"
//    (mailto), 카카오톡 상담, phone, or copying the text.

import { COMPANY } from "@/lib/company";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { currentSourceText } from "@/lib/attribution";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_INQUIRY_WEBHOOK_URL;

/** True when the site can take an inquiry itself (no mail app needed). */
export const canSubmitInquiry = isSupabaseConfigured || Boolean(WEBHOOK_URL);

export interface InquiryInput {
  name: string;
  contact: string;
  email?: string;
  /** What the inquiry is about (product/row name or "컨설팅"). */
  topic: string;
  message: string;
}

export type InquiryResult = { via: "server"; code: string } | { via: "webhook" };

/** Thrown with a message that can be shown as-is. */
export class InquiryError extends Error {}

const SERVER_ERRORS: Record<string, string> = {
  invalid_name: "이름을 1~40자로 입력해 주세요.",
  invalid_contact: "연락처를 다시 확인해 주세요. (4~60자)",
  invalid_message: "문의 내용을 2~2,000자로 입력해 주세요.",
  too_many: "같은 연락처로 짧은 시간에 여러 번 접수됐어요. 10분 뒤에 다시 시도하거나 카카오톡으로 문의해 주세요.",
};

/** Submit through the site. Throws InquiryError when nothing could be sent. */
export async function submitInquiry(input: InquiryInput): Promise<InquiryResult> {
  const page = typeof window !== "undefined" ? window.location.href : "";
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc("submit_inquiry", {
      p_name: input.name,
      p_contact: input.contact,
      p_email: input.email ?? "",
      p_topic: input.topic,
      p_message: input.message,
      p_page: page,
    });
    if (error || typeof data !== "string") {
      const key = Object.keys(SERVER_ERRORS).find((k) => error?.message?.includes(k));
      throw new InquiryError(key ? SERVER_ERRORS[key] : "접수에 실패했어요. 네트워크를 확인하고 다시 시도해 주세요.");
    }
    return { via: "server", code: data };
  }
  if (WEBHOOK_URL) {
    try {
      // Apps Script has no CORS headers → no-cors; an opaque response counts as sent.
      await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          name: input.name,
          contact: input.contact,
          email: input.email ?? "",
          topic: input.topic,
          message: input.message,
          page,
          source: currentSourceText(),
        }).toString(),
      });
    } catch {
      throw new InquiryError("접수에 실패했어요. 네트워크를 확인하고 다시 시도해 주세요.");
    }
    return { via: "webhook" };
  }
  throw new InquiryError("사이트에서 바로 접수할 수 없어요. 아래 방법으로 보내 주세요.");
}

/** Plain-text version of the inquiry (copy / email body). */
export function inquiryText(input: InquiryInput): string {
  return [
    `문의 주제: ${input.topic}`,
    `이름: ${input.name}`,
    `연락처: ${input.contact}`,
    input.email ? `이메일: ${input.email}` : "",
    "",
    input.message,
  ]
    .filter((l, i) => l || i === 4)
    .join("\n");
}

/** mailto: link that opens the visitor's email app pre-filled. */
export function inquiryMailto(input: InquiryInput): string {
  const subject = `[문의] ${input.topic} — ${input.name}`;
  return `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(inquiryText(input))}`;
}

// --- Admin -------------------------------------------------------------------

export type InquiryStatus = "new" | "answered";

export interface AdminInquiry {
  id: string;
  code: string;
  name: string;
  contact: string;
  email: string | null;
  topic: string;
  message: string;
  page: string | null;
  status: InquiryStatus;
  createdAt: string;
}

/** Last 120 days of site inquiries, newest first (admin-only RPC). */
export async function adminListInquiries(): Promise<AdminInquiry[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc("admin_inquiries");
  if (error) throw new Error(error.message.includes("forbidden") ? "관리자 권한이 없어요." : error.message);
  return (data ?? []) as AdminInquiry[];
}

export async function adminMarkInquiry(id: string, status: InquiryStatus): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.rpc("admin_mark_inquiry", { p_id: id, p_status: status });
  if (error) throw new Error(error.message);
}
