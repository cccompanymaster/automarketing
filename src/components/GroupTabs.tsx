"use client";

// Tabs for a product group's category page. Each member is a tab; selecting one
// swaps in that member's detail body. The active tab is mirrored to the URL hash
// so a specific sub-product is linkable/shareable (e.g. /services/place-map#kakaomap).

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { ProductDetailBody } from "@/components/ProductDetailBody";
import { track } from "@/lib/analytics";
import type { Product } from "@/lib/products";

export function GroupTabs({ members }: { members: Product[] }) {
  const [index, setIndex] = useState(0);

  // On mount, honor a #slug hash so deep links open the right tab.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));
    const i = members.findIndex((m) => m.slug === hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time deep-link sync
    if (i >= 0) setIndex(i);
  }, [members]);

  const select = (i: number) => {
    setIndex(i);
    const member = members[i];
    try {
      history.replaceState(null, "", `#${member.slug}`);
    } catch {
      /* ignore */
    }
    track("cta_click", { product_slug: member.slug });
  };

  const active = members[index];

  return (
    <>
      <div className="border-b border-slate-100 bg-white">
        {/* Right-edge fade hints that more tabs are scrollable on narrow screens */}
        <div
          className="mx-auto flex max-w-4xl snap-x snap-mandatory gap-2 overflow-x-auto px-5 py-3 [mask-image:linear-gradient(90deg,#000_88%,transparent)] sm:[mask-image:none]"
        >
          {members.map((m, i) => (
            <button
              key={m.slug}
              type="button"
              onClick={() => select(i)}
              aria-pressed={i === index}
              className={`flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                i === index
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {m.brand ? (
                <BrandLogo brand={m.brand} className="h-4 w-4 rounded" />
              ) : (
                <span aria-hidden="true">{m.icon}</span>
              )}
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <ProductDetailBody product={active} showHeadline />
    </>
  );
}
