import type { MetadataRoute } from "next";
import { PRODUCT_SLUGS, GROUP_KEYS } from "@/lib/products";
import { CALCULATORS, CALC_HUB_PATH, CALC_REVIEWED_AT } from "@/lib/calc/registry";
import { PRIVACY, TERMS } from "@/lib/legal";

// Emit a static sitemap.xml at build time (required by output: "export").
export const dynamic = "force-static";

// TODO(backend): set NEXT_PUBLIC_SITE_URL to the production domain.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://selfmarketing.example";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/start/`, priority: 0.9 },
    ...GROUP_KEYS.map((key) => ({
      url: `${SITE_URL}/services/${key}/`,
      priority: 0.85,
    })),
    ...PRODUCT_SLUGS.map((slug) => ({
      url: `${SITE_URL}/services/${slug}/`,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/tools/blog-writer/`, priority: 0.7 },
    // lastmod only where we know the real change date (no fake freshness).
    { url: `${SITE_URL}${CALC_HUB_PATH}`, priority: 0.8, lastModified: CALC_REVIEWED_AT },
    ...CALCULATORS.map((c) => ({ url: `${SITE_URL}${c.path}`, priority: 0.7, lastModified: CALC_REVIEWED_AT })),
    { url: `${SITE_URL}/terms/`, priority: 0.2, lastModified: TERMS.updatedAt },
    { url: `${SITE_URL}/privacy/`, priority: 0.2, lastModified: PRIVACY.updatedAt },
  ];
}
