// Shared detail body for a single product: optional headline block + benefits +
// steps + CTA. Reused by the standalone service page and by the grouped
// category page's tabs, so the two never drift apart.

import { TrackedCta } from "@/components/TrackedCta";
import type { Product, ProductSlug } from "@/lib/products";

// Map a product to the matching /pricing group anchor so a logged-in member's
// CTA lands on the rows they can order. Products without a dedicated price
// group just open the full list.
const PRICING_ANCHOR: Partial<Record<ProductSlug, string>> = {
  place: "place",
  blog: "blog",
  "blog-neighbor": "blog",
  "place-traffic": "reward",
};

export function pricingHref(slug: ProductSlug): string {
  const anchor = PRICING_ANCHOR[slug];
  return anchor ? `/pricing#${anchor}` : "/pricing";
}

export function ProductDetailBody({
  product,
  showHeadline = false,
}: {
  product: Product;
  showHeadline?: boolean;
}) {
  const { detail, accent } = product;

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      {showHeadline && (
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
            {detail.headline}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {detail.subhead}
          </p>
          {detail.fromPrice && (
            <p className="mt-4 inline-flex items-baseline gap-1.5 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
              최소
              <span className="num text-lg font-extrabold text-emerald-600">{detail.fromPrice}</span>
              부터 ~
            </p>
          )}
        </section>
      )}

      {/* Benefits */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">이런 결과를 기대할 수 있어요</h2>
        <ul className="mt-5 space-y-3">
          {detail.benefits.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm text-slate-700">
              <span className="mt-0.5 text-emerald-600" aria-hidden="true">
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
      </section>

      {/* Steps */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">진행 방식</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {detail.steps.map((step) => (
            <li key={step.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA — guests enter the funnel (/start); logged-in members go straight
          to the orderable price list (deep-linked to the matching group). */}
      <section className="mt-12 text-center">
        <TrackedCta
          href={product.slug === "blogwrite" ? "/tools/blog-writer" : "/start"}
          authedHref={
            product.slug === "blogwrite" ? "/tools/blog-writer" : pricingHref(product.slug)
          }
          slug={product.slug}
          className={`inline-block w-full rounded-xl py-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto sm:px-12 ${accent.button}`}
        >
          {product.cta}
        </TrackedCta>
        <p className="mt-3 text-xs text-slate-400">가입 후 더 자세한 진단과 견적을 받아볼 수 있습니다.</p>
      </section>
    </div>
  );
}
