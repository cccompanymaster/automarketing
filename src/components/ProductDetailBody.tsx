// Shared detail body for a single product: optional headline block + benefits +
// steps + CTA. Reused by the standalone service page and by the grouped
// category page's tabs, so the two never drift apart.

import { TrackedCta } from "@/components/TrackedCta";
import { TrendRankingMock } from "@/components/TrendRankingMock";
import type { Product, ProductSlug } from "@/lib/products";
import { PRODUCT_STORIES } from "@/lib/productStories";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Map a product to the matching /pricing group anchor so a logged-in member's
// CTA lands on the rows they can order. Products without a dedicated price
// group just open the full list.
const PRICING_ANCHOR: Partial<Record<ProductSlug, string>> = {
  place: "place",
  blog: "blog",
  "blog-neighbor": "blog",
  "place-traffic": "reward",
  cafe: "cafe",
  "ai-influencer": "ai",
  press: "press",
  instagram: "sns",
  youtube: "sns",
  kakaomap: "kakaomap",
  daangn: "daangn",
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

      {/* Story arc: pains → our fix → "이럴 땐 이렇게" */}
      {(() => {
        const story = PRODUCT_STORIES[product.slug];
        if (!story) return null;
        return (
          <>
            {/* ① 기존에 불편했던 부분 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-slate-900">이런 것 때문에 힘드셨죠</h2>
              {story.image && (
                // eslint-disable-next-line @next/next/no-img-element -- static export, local asset
                <img
                  src={`${BASE}${story.image}`}
                  alt=""
                  className="mt-4 h-44 w-full rounded-2xl object-cover shadow-sm sm:h-56"
                />
              )}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {story.pains.map((p) => (
                  <figure
                    key={p.quote}
                    className="flex h-full flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-5"
                  >
                    <blockquote className="text-sm font-semibold leading-relaxed text-slate-800">
                      “{p.quote}”
                    </blockquote>
                    <figcaption className="mt-3 text-xs text-slate-400">{p.who}</figcaption>
                  </figure>
                ))}
              </div>
            </section>

            {/* ② 마케팅방주의 차별점·해결책 */}
            <section className="mb-12 rounded-3xl bg-slate-900 p-7 sm:p-9">
              <p className="text-xs font-bold tracking-widest text-emerald-400">
                마케팅방주는 다르게 해요
              </p>
              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                {story.solution.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {story.solution.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-3 text-sm leading-relaxed text-slate-200">
                    <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true">
                      ✓
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
            </section>

            {/* ③ 이럴 땐 이렇게 하세요 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-slate-900">이럴 땐 이렇게 하세요</h2>
              <div className="mt-5 space-y-3">
                {story.scenarios.map((sc) => (
                  <div
                    key={sc.when}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:gap-5"
                  >
                    <p className="text-sm font-bold text-slate-800 sm:w-2/5">
                      <span className="mr-1.5" aria-hidden="true">🙋</span>
                      {sc.when}
                    </p>
                    <p className="text-sm leading-relaxed text-emerald-900 sm:flex-1">
                      <span className="mr-1.5" aria-hidden="true">👉</span>
                      {sc.then}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        );
      })()}

      {/* KakaoMap only: where the trend-ranking guarantee shows up */}
      {product.slug === "kakaomap" && <TrendRankingMock />}

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

      {/* Materials to prepare (자료 요청) */}
      {detail.materials && detail.materials.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900">📎 신청 시 준비해 주세요</h2>
          <p className="mt-2 text-sm text-slate-500">
            아래 자료를 주문 시 요청사항에 적어 주시면 작업이 빨라져요. 준비가 안 된 항목은 신청 후 함께 채워도 됩니다.
          </p>
          <ul className="mt-4 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
            {detail.materials.map((m) => (
              <li key={m} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 text-slate-400" aria-hidden="true">
                  •
                </span>
                {m}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CTA — guests enter the funnel (/start); logged-in members go straight
          to the orderable price list (deep-linked to the matching group). */}
      <section className="mt-12 text-center">
        <TrackedCta
          href={
            product.slug === "blogwrite"
              ? "/tools/blog-writer"
              : `/start?service=${product.slug}`
          }
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
