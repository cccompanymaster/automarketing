// /chatbot-knowledge.txt — the consultation chatbot's knowledge base, built
// at `next build` from the catalog (see lib/chatKnowledge.ts).

import { buildChatKnowledge } from "@/lib/chatKnowledge";

export const dynamic = "force-static";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://selfmarketing.ai.kr";

export function GET() {
  return new Response(buildChatKnowledge(SITE), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
