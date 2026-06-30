import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RefundLanding } from "@/components/RefundLanding";
import { PressLanding } from "@/components/PressLanding";
import { BrandLogo } from "@/components/BrandLogo";
import { GroupTabs } from "@/components/GroupTabs";
import { ProductDetailBody } from "@/components/ProductDetailBody";
import {
  getProduct,
  getGroup,
  groupMembers,
  PRODUCT_SLUGS,
  GROUP_KEYS,
} from "@/lib/products";

// Titles/descriptions for search & social sharing — products and groups.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const group = getGroup(slug);
  if (group) {
    return { title: group.name, description: group.summary.join(" ") };
  }
  const product = getProduct(slug);
  if (!product) return {};
  return { title: product.name, description: product.detail.subhead };
}

// Pre-render every product detail page and every group category page.
export function generateStaticParams() {
  return [...PRODUCT_SLUGS, ...GROUP_KEYS].map((slug) => ({ slug }));
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Group (category) page: shared hero + member tabs.
  const group = getGroup(slug);
  if (group) {
    const members = groupMembers(group);
    return (
      <>
        <SiteHeader />
        <main className="flex-1">
          <section className={`bg-gradient-to-b ${group.accent.gradient}`}>
            <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
              <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-800">
                ← 전체 서비스
              </Link>
              <div className="mt-6 flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${group.accent.iconBg}`}
                  aria-hidden="true"
                >
                  {group.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                    {group.name}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                    {group.summary.join(" ")}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    아래 탭에서 세부 상품을 골라 확인하세요.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <GroupTabs members={members} />
        </main>
        <SiteFooter />
      </>
    );
  }

  const product = getProduct(slug);
  if (!product) notFound();

  // Products with dedicated landings.
  if (product.slug === "refund") {
    return (
      <>
        <SiteHeader />
        <RefundLanding />
        <SiteFooter />
      </>
    );
  }
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
              {product.brand ? (
                <BrandLogo brand={product.brand} className="h-14 w-14 shrink-0 rounded-2xl shadow-sm" />
              ) : (
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${accent.iconBg}`}
                  aria-hidden="true"
                >
                  {product.icon}
                </div>
              )}
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
                {detail.fromPrice && (
                  <p className="mt-4 inline-flex items-baseline gap-1.5 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                    최소
                    <span className="num text-lg font-extrabold text-emerald-600">{detail.fromPrice}</span>
                    부터 ~
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <ProductDetailBody product={product} />
      </main>
      <SiteFooter />
    </>
  );
}
