import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { PRIVACY } from "@/lib/legal";

export const metadata: Metadata = { title: "개인정보처리방침" };

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}
