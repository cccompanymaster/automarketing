import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { THIRD_PARTY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "제3자 정보제공 동의",
  description: "마케팅방주 제3자 정보제공 동의 안내 — 제공받는 자, 제공 항목, 이용 목적과 보유 기간, 동의 철회 방법.",
  alternates: { canonical: "/third-party/" },
};

export default function ThirdPartyPage() {
  return <LegalPage doc={THIRD_PARTY} />;
}
