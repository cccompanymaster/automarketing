import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackedCta } from "@/components/TrackedCta";
import { RefundLanding } from "@/components/RefundLanding";
import { PressLanding } from "@/components/PressLanding";
import { getProduct, PRODUCT_SLUGS } from "@/lib/products";

// Per-product page titles/descriptions for search & social sharing.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.detail.subhead,
  };
}

// Pre-render all known product detail pages.
export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  // The refund product gets a richer, dedicated landing.
  if (product.slug === "refund") {
    return (
      <>
        <SiteHeader />
        <RefundLanding />
        <SiteFooter />
      </>
    );
  }

  // The press product also has a dedicated landing (media list, options, caveats).
  if (product.slug === "press") {
    return (
      <>
        <SiteHeader />
        <PressLanding />
        <SiteFooter />
      </>
    );
  }

  const { detail, accent } = product;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className={`bg-gradient-to-b ${accent.gradient}`}>
          <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
            <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-800">
              ← 전체 서비스
            </Link>
            <div className="mt-6 flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${accent.iconBg}`}
                aria-hidden="true"
              >
                {product.icon}
              </div>
              <div>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${accent.chip}`}>
                  {product.name}
                </span>
                <h1 className="mt-3 text-2xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                  {detail.headline}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  {detail.subhead}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-5 py-14">
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
                <li
                  key={step.title}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Cost & conditions (exposed BEFORE signup) */}
          <section className="mt-12 rounded-2xl bg-slate-50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">예상 비용 및 조건</h2>
            <div className="mt-5 rounded-xl bg-white p-5 ring-1 ring-slate-100">
              <p className="text-xs font-medium text-slate-400">예상 비용 범위</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{detail.costRange}</p>
              <p className="mt-2 text-sm text-slate-500">{detail.costNote}</p>
            </div>
            <ul className="mt-5 space-y-2">
              {detail.conditions.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 text-slate-400" aria-hidden="true">
                    •
                  </span>
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              {/* TODO(backend): replace with live pricing & refund terms. */}
              실제 비용·환급 조건은 진단 및 상담 후 확정됩니다.
            </p>
          </section>

          {/* CTA */}
          <section className="mt-12 text-center">
            <TrackedCta
              href="/start"
              slug={product.slug}
              className={`inline-block w-full rounded-xl py-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto sm:px-12 ${accent.button}`}
            >
              {product.cta}
            </TrackedCta>
            <p className="mt-3 text-xs text-slate-400">
              가입 후 더 자세한 진단과 견적을 받아볼 수 있습니다.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
