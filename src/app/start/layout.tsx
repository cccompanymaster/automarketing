import type { Metadata } from "next";
import { OG_BASE } from "@/lib/seo";

// /start is a client page, so its metadata lives here.
export const metadata: Metadata = {
  title: "무료 가입하고 시작하기",
  description:
    "마케팅방주에 무료로 가입하고 플레이스·블로그·인스타그램·카페 마케팅 상품의 단가를 확인하세요. 필요한 상품을 1건부터 주문할 수 있어요.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/start/" },
  openGraph: { ...OG_BASE, url: "/start/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
