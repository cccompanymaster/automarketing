import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { TERMS } from "@/lib/legal";
import { NOTICE_PATH } from "@/lib/notices";

export const metadata: Metadata = {
  title: "이용약관",
  description: "마케팅방주 서비스 이용약관 — 회원가입, 캐시 충전·사용·환불, 주문과 산출물 확인, 책임과 분쟁 해결 기준을 안내합니다.",
  alternates: { canonical: "/terms/" },
};

export default function TermsPage() {
  return (
    <LegalPage
      doc={TERMS}
      notice={{
        href: `${NOTICE_PATH}terms-revision-2026-11/`,
        label: "개정 약관은 2026년 11월 6일부터 시행돼요 — 개정 안내 보기",
      }}
    />
  );
}
