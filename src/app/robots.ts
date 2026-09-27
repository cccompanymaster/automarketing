import type { MetadataRoute } from "next";

// Emit a static robots.txt at build time (required by output: "export").
export const dynamic = "force-static";

// TODO(backend): set NEXT_PUBLIC_SITE_URL to the production domain.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://selfmarketing.example";

// Logged-in skeleton — no value in search indexes.
const PRIVATE = ["/mypage", "/admin", "/pricing", "/auth"];

// AI crawlers, listed explicitly so the policy is a decision, not an accident:
// training, AI-search indexing and live fetch are all allowed because being
// cited (ChatGPT / Claude / Perplexity / AI Overviews) is the goal.
// Review the names quarterly — vendors add new agents.
const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      // Naver (Yeti) and Bing are covered by "*"; AI crawlers get the same rules.
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
