// Structured data (JSON-LD) — the same 상위노출 logic we sell, applied to our
// own site. Two audiences:
//   1) 검색엔진: Organization / WebSite / Service / BreadcrumbList so listings
//      can show rich results instead of a bare blue link.
//   2) 생성형 AI(AEO): FAQPage + explicit prices/areaServed give answer engines
//      quotable, attributable facts — the thing our AI 인용 product is about.
//
// Everything is derived from the existing catalog so the markup can never
// drift from what the page actually says.

import { COMPANY } from "@/lib/company";
import { PRICING, priceSortValue } from "@/lib/pricing";
import type { Product } from "@/lib/products";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://selfmarketing.example").replace(
  /\/$/,
  "",
);

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Parse "30,000원" / "30원" → 30000 / 30. Returns null for 견적-only copy. */
export function parseKrw(text: string | undefined): number | null {
  if (!text) return null;
  const m = text.replace(/,/g, "").match(/\d+/);
  return m ? Number(m[0]) : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

/** Publisher identity — reused by every other node via @id. */
export function organizationLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: COMPANY.serviceName,
    legalName: COMPANY.companyName,
    url: SITE_URL,
    email: COMPANY.email,
    founder: { "@type": "Person", name: COMPANY.ceo },
    taxID: COMPANY.businessRegistrationNumber,
    address: {
      "@type": "PostalAddress",
      addressCountry: "KR",
      addressLocality: "인천광역시 연수구",
      streetAddress: COMPANY.address,
    },
    areaServed: { "@type": "Country", name: "대한민국" },
    knowsAbout: [
      "네이버 플레이스 상위노출",
      "네이버 블로그 상위노출",
      "쇼핑 검색 광고",
      "카카오맵 트렌드 랭킹",
      "당근 비즈프로필 마케팅",
      "AI 검색 최적화(AEO)",
      "광고비 환급",
    ],
  };
}

/** Site node — enables sitelinks/search box eligibility. */
export function webSiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: COMPANY.serviceName,
    inLanguage: "ko-KR",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** Q&A block — the format answer engines quote most readily. */
export function faqLd(items: readonly { q: string; a: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbLd(trail: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absoluteUrl(t.path),
    })),
  };
}

/**
 * A product page as a Service with a concrete price — the detail that makes a
 * result quotable ("최소 30원부터") instead of a generic listing.
 */
export function serviceLd(product: Product, pricingKey?: string): Json {
  const from = parseKrw(product.detail.fromPrice);
  const group = pricingKey ? PRICING.find((g) => g.key === pricingKey) : undefined;
  const orderable = (group?.items ?? [])
    .filter((i) => i.amountKrw != null && !i.inquiry)
    .sort((a, b) => priceSortValue(a) - priceSortValue(b));

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": absoluteUrl(`/services/${product.slug}/#service`),
    name: product.name,
    serviceType: product.detail.headline,
    description: product.detail.subhead,
    url: absoluteUrl(`/services/${product.slug}/`),
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "Country", name: "대한민국" },
    ...(orderable.length > 0
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "KRW",
            lowPrice: orderable[0].amountKrw,
            highPrice: orderable[orderable.length - 1].amountKrw,
            offerCount: orderable.length,
            availability: "https://schema.org/InStock",
          },
        }
      : from != null
        ? {
            offers: {
              "@type": "Offer",
              priceCurrency: "KRW",
              price: from,
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
  };
}
