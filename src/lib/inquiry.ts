// Inquiry (컨설팅/견적 문의) submission. When NEXT_PUBLIC_INQUIRY_WEBHOOK_URL
// is set (a Google Apps Script Web App), submissions are POSTed there — the
// script appends a row to the 문의 sheet AND emails the owner (see
// docs/SHEET_INTEGRATION.md for the ready-to-paste script). Without the
// webhook we fall back to opening the user's mail client (mailto).

import { COMPANY } from "@/lib/company";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_INQUIRY_WEBHOOK_URL;

export const isInquiryWebhookConfigured = Boolean(WEBHOOK_URL);

export interface InquiryInput {
  name: string;
  contact: string;
  email?: string;
  /** What the inquiry is about (product/row name or "컨설팅"). */
  topic: string;
  message: string;
}

/**
 * Submit an inquiry. Resolves { via: "webhook" | "mailto" }.
 * Webhook posts as x-www-form-urlencoded with mode "no-cors" (Apps Script has
 * no CORS headers); an opaque response counts as success — the script itself
 * mails + records, and failures surface on the owner's side.
 */
export async function submitInquiry(input: InquiryInput): Promise<{ via: "webhook" | "mailto" }> {
  if (WEBHOOK_URL) {
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
        page: typeof window !== "undefined" ? window.location.href : "",
      }).toString(),
    });
    return { via: "webhook" };
  }

  // Fallback: open the visitor's mail client pre-filled.
  const subject = `[문의] ${input.topic} — ${input.name}`;
  const body = [
    `이름: ${input.name}`,
    `연락처: ${input.contact}`,
    input.email ? `이메일: ${input.email}` : "",
    `문의 주제: ${input.topic}`,
    "",
    input.message,
  ]
    .filter(Boolean)
    .join("\n");
  window.location.href = `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { via: "mailto" };
}
