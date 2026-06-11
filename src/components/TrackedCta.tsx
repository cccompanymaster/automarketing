"use client";

// A link that fires `cta_click` (with product_slug) before navigating.
// Used by the service detail page, which is a server component.

import Link from "next/link";
import type { ProductSlug } from "@/lib/products";
import { track } from "@/lib/analytics";

export function TrackedCta({
  href,
  slug,
  className,
  children,
}: {
  href: string;
  slug: ProductSlug;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={() => track("cta_click", { product_slug: slug })}
      className={className}
    >
      {children}
    </Link>
  );
}
