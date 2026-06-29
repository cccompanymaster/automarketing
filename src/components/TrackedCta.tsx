"use client";

// A link that fires a conversion event before navigating, and can pick a
// different destination once the visitor is logged in. Used by the landing
// closing CTA and the service detail page (both otherwise server-rendered).
//
// - Guests go to `href` (typically /start to enter the funnel).
// - Authenticated users go to `authedHref` when provided (e.g. /pricing or
//   /mypage) so an interested member lands somewhere they can act, instead of
//   being bounced through the signup screen again.

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import type { ProductSlug } from "@/lib/products";
import { track, type AnalyticsEvent } from "@/lib/analytics";

export function TrackedCta({
  href,
  authedHref,
  slug,
  event,
  className,
  children,
}: {
  href: string;
  /** Destination for logged-in visitors (falls back to `href`). */
  authedHref?: string;
  /** Product slug — when set, fires `cta_click` with it. */
  slug?: ProductSlug;
  /** Optional explicit event to fire instead of `cta_click`. */
  event?: AnalyticsEvent;
  className?: string;
  children: React.ReactNode;
}) {
  const { isAuthenticated, hydrated } = useAuth();
  const target = authedHref && hydrated && isAuthenticated ? authedHref : href;

  const handleClick = () => {
    if (slug) track("cta_click", { product_slug: slug });
    else if (event) track(event);
  };

  return (
    <Link href={target} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
