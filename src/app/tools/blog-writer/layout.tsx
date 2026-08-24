import type { Metadata } from "next";

// The AI writer is a public tool page — give it its own searchable identity.
export const metadata: Metadata = {
  title: "AI 블로그 원고 작성 — 1건 1,000원",
  description:
    "주제와 키워드만 입력하면 제목·목차·본문까지 자동으로 생성합니다. 제목·목차 생성은 무료, 완성 원고는 1건 1,000캐시입니다.",
  alternates: { canonical: "/tools/blog-writer/" },
  openGraph: { url: "/tools/blog-writer/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
