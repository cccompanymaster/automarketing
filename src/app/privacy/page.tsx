import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { PRIVACY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "마케팅방주 개인정보처리방침 — 수집하는 개인정보와 목적, 보유 기간, 처리 위탁, 쿠키·분석 도구와 거부 방법을 안내합니다.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}
