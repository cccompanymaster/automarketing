import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { TERMS } from "@/lib/legal";
import { NOTICE_PATH } from "@/lib/notices";

export const metadata: Metadata = { title: "이용약관" };

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
