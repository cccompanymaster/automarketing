// Consultation chatbot client. The model runs server-side (Edge Function
// `chatbot`, Ollama); without a backend the widget falls back to the human
// handoff (카카오톡 1:1) only.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_URL = SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/chatbot` : undefined;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Assistant suggested connecting to a human. */
  handoff?: boolean;
}

export type ChatResult = { reply: string; handoff: boolean } | { unavailable: true };

export const CHAT_SUGGESTIONS = [
  "플레이스 상위노출 비용이 얼마예요?",
  "캐시 충전은 어떻게 하나요?",
  "블로그 배포 상품 차이가 뭐예요?",
  "환불 규정이 궁금해요",
];

export async function askChatbot(history: ChatMessage[]): Promise<ChatResult> {
  if (!API_URL) return { unavailable: true };
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ANON ? { apikey: ANON, Authorization: `Bearer ${ANON}` } : {}),
      },
      body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
    });
    if (res.status === 503 || res.status === 404) return { unavailable: true };
    const data = (await res.json()) as { reply?: string; handoff?: boolean };
    if (!data.reply) return { unavailable: true };
    return { reply: data.reply, handoff: Boolean(data.handoff) };
  } catch {
    return { unavailable: true };
  }
}
