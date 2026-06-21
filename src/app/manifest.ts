import type { MetadataRoute } from "next";

// Emit a static manifest.webmanifest at build time (required by output: "export").
export const dynamic = "force-static";

// On GitHub Pages the app is served under /<repo>, so manifest URLs (which are
// plain strings, not auto-prefixed by Next) must include the base path.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// PWA manifest — makes the site an installable, app-like experience on both
// mobile and desktop (standalone window, home-screen icon, theme color).
// Served at /manifest.webmanifest.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "셀프마케팅 — 대행사 없이 시작하는 우리 매장 마케팅",
    short_name: "셀프마케팅",
    description:
      "소상공인·온라인 셀러·매장 운영자를 위한 셀프 마케팅 플랫폼. 플레이스·쇼핑·블로그 광고와 광고비 환급을 직접 시작하세요.",
    start_url: `${BASE}/`,
    scope: `${BASE}/`,
    display: "standalone",
    orientation: "portrait",
    lang: "ko",
    background_color: "#ffffff",
    theme_color: "#059669",
    categories: ["business", "marketing", "productivity"],
    icons: [
      { src: `${BASE}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: `${BASE}/icon-maskable.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
