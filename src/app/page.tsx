import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Landing } from "@/components/Landing";
import { JsonLd } from "@/components/JsonLd";
import { organizationLd, webSiteLd, faqLd } from "@/lib/seo";
import { SITE_FAQS } from "@/lib/faq";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={[organizationLd(), webSiteLd(), faqLd(SITE_FAQS)]} />
      <SiteHeader />
      <Landing />
      <SiteFooter />
    </>
  );
}
