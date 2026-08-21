import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { THIRD_PARTY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "제3자 정보제공 동의",
  alternates: { canonical: "/third-party/" },
};

export default function ThirdPartyPage() {
  return <LegalPage doc={THIRD_PARTY} />;
}
