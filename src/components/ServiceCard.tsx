"use client";

// A single service card on the landing page. Each card has its own icon,
// title, two-line summary, and a product-specific CTA. Clicking the CTA fires
// a `cta_click` event then navigates to the product detail page.

import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import { track } from "@/lib/analytics";

export function ServiceCard({ product }: { product: Product }) {
  const router = useRouter();

  const handleCta = () => {
    track("cta_click", { product_slug: product.slug });
    router.push(`/services/${product.slug}`);
  };

  return (
    <div
      className={`group flex h-full flex-col rounded-2xl bg-gradient-to-b ${product.accent.gradient} p-6 shadow-sm ring-1 ring-slate-100 transition duration-200 hover:-translate-y-1 hover:shadow-lg ${product.accent.cardRing}`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${product.accent.iconBg}`}
        aria-hidden="true"
      >
        {product.icon}
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-900">{product.name}</h3>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {product.summary.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </p>

      <button
        type="button"
        onClick={handleCta}
        className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${product.accent.button}`}
      >
        {product.cta}
      </button>
    </div>
  );
}
