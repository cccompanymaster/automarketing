import type { MetadataRoute } from "next";

// Emit a static robots.txt at build time (required by output: "export").
export const dynamic = "force-static";

// TODO(backend): set NEXT_PUBLIC_SITE_URL to the production domain.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://selfmarketing.example";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Logged-in skeleton — no value in search indexes.
      disallow: ["/mypage", "/admin", "/tools", "/pricing"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
