import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { TERMS } from "@/lib/legal";

export const metadata: Metadata = { title: "이용약관 — 셀프마케팅" };

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}
