import type { Metadata } from "next";
import { OG_BASE } from "@/lib/seo";

// /start is a client page, so its metadata lives here.
export const metadata: Metadata = {
  title: "무료 가입하고 시작하기",
  description:
    "가입비 0원, 3분이면 끝. 플레이스·블로그·인스타·카페 마케팅 단가를 전부 공개하고 1건부터 주문할 수 있어요. 카카오·네이버로 간편가입.",
  alternates: { canonical: "/start/" },
  openGraph: { ...OG_BASE, url: "/start/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
