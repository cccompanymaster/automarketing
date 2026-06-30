import type { MetadataRoute } from "next";
import { PRODUCT_SLUGS, GROUP_KEYS } from "@/lib/products";

// Emit a static sitemap.xml at build time (required by output: "export").
export const dynamic = "force-static";

// TODO(backend): set NEXT_PUBLIC_SITE_URL to the production domain.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://selfmarketing.example";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/start`, priority: 0.9 },
    ...GROUP_KEYS.map((key) => ({
      url: `${SITE_URL}/services/${key}`,
      priority: 0.85,
    })),
    ...PRODUCT_SLUGS.map((slug) => ({
      url: `${SITE_URL}/services/${slug}`,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/terms`, priority: 0.2 },
    { url: `${SITE_URL}/privacy`, priority: 0.2 },
  ];
}
