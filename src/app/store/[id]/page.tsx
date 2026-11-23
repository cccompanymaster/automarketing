// Store product page (/store/<id>/): one card of the store, with what the
// customer gets, an option comparison, how it runs, what to prepare,
// conditions, ordering and FAQ — so a product chosen in the store keeps its own
// title, options and prices. Channel overviews stay at /services/<slug>/.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { QuickOrder } from "@/components/QuickOrder";
import { ProductVisual } from "@/components/ProductVisual";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, faqLd, OG_BASE } from "@/lib/seo";
import { PRICING, displayPrice, minOrderKrw } from "@/lib/pricing";
import { getProduct } from "@/lib/products";
import { productFrom, storeProducts, type StoreProduct } from "@/lib/store";
import { orderFormFor } from "@/lib/orderForms";
import { platformChips, productOgImage } from "@/lib/productVisuals";
import { minOrderText, storeFaq } from "@/lib/storeFaq";
import { COMPANY } from "@/lib/company";

export const dynamicParams = false;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const PRODUCTS = storeProducts(PRICING);
const find = (id: string) => PRODUCTS.find((p) => p.id === id);
const serviceOf = (p: StoreProduct) => (p.detailHref ? getProduct(p.detailHref.split("/").filter(Boolean)[1] ?? "") : undefined);
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

const BADGE_STYLE: Record<string, string> = {
  인기: "bg-rose-500 text-white",
  추천: "bg-emerald-600 text-white",
  신규: "bg-sky-500 text-white",
};

/** Navy band with a faint diagonal hatch (info strip, steps, order). */
const NAVY = "bg-[#17283f] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.035)_0_10px,transparent_10px_22px)]";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = find(id);
  if (!p) return {};
  const desc = `${p.summary ?? p.title} — ${p.group.title} 상품의 옵션별 단가·최소 주문금액·진행 방식을 비교하고 바로 주문하세요.`;
  const og = productOgImage(p.id);
  const images = og ? [{ url: `${BASE}${og}`, width: 1200, height: 630, alt: p.title }] : OG_BASE.images;
  return {
    title: `${p.title} — 가격·옵션 비교`,
    description: desc,
    alternates: { canonical: `/store/${p.id}/` },
    openGraph: { ...OG_BASE, title: p.title, description: desc, url: `/store/${p.id}/`, images },
    twitter: { card: "summary_large_image", images: images.map((i) => i.url) },
  };
}

/** Two-line section title; the second line is the green emphasis. */
function SectionTitle({ eyebrow, lines, dark = false, id }: { eyebrow: string; lines: [string, string]; dark?: boolean; id?: string }) {
  return (
    <div>
      <span className={`inline-block rounded-md px-2.5 py-1 text-sm font-bold ${dark ? "bg-emerald-300/15 text-emerald-200" : "bg-emerald-50 text-emerald-700"}`}>
        {eyebrow}
      </span>
      <h2 id={id} className={`mt-3 text-[26px] font-extrabold leading-tight tracking-tight sm:text-[34px] ${dark ? "text-white" : "text-slate-900"}`}>
        {lines[0]}
        <br />
        <span className={dark ? "text-emerald-300" : "text-emerald-600"}>{lines[1]}</span>
      </h2>
    </div>
  );
}

function Band({ children, className = "", labelledBy }: { children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={className}>
      <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">{children}</div>
    </section>
  );
}

export default async function StoreProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = find(id);
  if (!p) notFound();
  const service = serviceOf(p);
  const from = productFrom(p);
  const fromPrice = displayPrice(from);
  const minFrom = Math.min(...p.options.map((o) => minOrderKrw(o) ?? Infinity));
  const orderable = p.options.some((o) => displayPrice(o).kind === "order");
  const related = PRODUCTS.filter((x) => x.group.key === p.group.key && x.id !== p.id).slice(0, 3);
  const formFields = [...new Set(p.options.flatMap((o) => orderFormFor(o.name)?.fields.map((f) => f.label.replace(/ \(선택\)$/, "")) ?? []))];
  const materials = formFields.length ? formFields : service?.detail.materials ?? ["요청사항·전달 자료"];
  const chips = platformChips(p.id, p.group.key, p.group.title);
  const badged = p.options.find((o) => o.badge);
  const badge = badged ? `${badged.badge} · ${badged.name}` : p.badge;
  const badgeKind = badged?.badge ?? p.badge;
  const [titleMain, titleNote] = (() => {
    const m = p.title.match(/^(.*?)\s*(\(.+\))$/);
    return m ? [m[1], m[2]] : [p.title, ""];
  })();
  const faq = service
    ? storeFaq({
        options: p.options,
        materials,
        claims: [p.summary ?? "", ...service.detail.benefits],
        conditions: service.detail.conditions,
        isBlogWrite: service.slug === "blogwrite",
      })
    : [];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "상품 스토어", path: "/pricing/" },
            { name: p.title, path: `/store/${p.id}/` },
          ]),
          ...(faq.length ? [faqLd(faq)] : []),
        ]}
      />
      <SiteHeader />
      <main className="flex-1 bg-white">
        {/* Info strip */}
        <div className={`${NAVY} pt-16 lg:pt-0`}>
          <p className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-[13px] font-semibold text-slate-300">
            <span>
              <b className="text-emerald-300">{p.group.title}</b> · 1캐시 = 1원
            </span>
            <span>표시 금액 부가세 별도</span>
            <span className="hidden sm:inline">{orderable ? "잔액이 부족하면 주문 창에서 바로 충전" : "맞춤 견적 · 24시간 안에 연락"}</span>
          </p>
        </div>

        <div className="mx-auto max-w-5xl px-5 pt-6">
          <nav aria-label="이동 경로" className="text-sm text-slate-500">
            <Link href="/pricing/" className="tap font-semibold text-emerald-700 hover:underline">
              ← 상품 스토어
            </Link>
            <span className="mx-1.5 text-slate-300">/</span>
            <Link href={`/pricing/?cat=${p.group.key}`} className="tap hover:underline">
              {p.group.title}
            </Link>
          </nav>

          {/* Hero */}
          <section className="mt-5 grid gap-7 pb-14 md:grid-cols-2 md:gap-10" aria-labelledby="product-title">
            <ProductVisual
              id={p.id}
              groupKey={p.group.key}
              groupTitle={p.group.title}
              className="rounded-3xl ring-1 ring-emerald-100"
            />
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">{p.group.title}</span>
                {chips.map((c) => (
                  <span key={c} className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                    {c}
                  </span>
                ))}
              </div>
              {badge && (
                <span className={`mt-4 w-fit rounded-full px-3 py-1 text-xs font-extrabold ${BADGE_STYLE[badgeKind ?? ""] ?? "bg-slate-800 text-white"}`}>
                  {badge}
                </span>
              )}
              <h1 id="product-title" className="mt-3 text-[28px] font-extrabold leading-snug tracking-tight text-slate-900 sm:text-[34px]">
                {titleMain}
                {titleNote && <span className="ml-1.5 text-xl font-bold text-slate-400 sm:text-2xl">{titleNote}</span>}
              </h1>
              {p.summary && <p className="mt-2 text-base leading-relaxed text-slate-600">{p.summary}</p>}
              <a href="#compare" className="mt-2 w-fit text-sm font-bold text-emerald-700 underline underline-offset-4 hover:text-emerald-800">
                옵션 {p.options.length}개 한눈에 비교하기 →
              </a>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100">
                <p className="text-sm font-bold text-slate-500">시작 단가</p>
                <p className="mt-1 text-slate-500">
                  {fromPrice.kind === "order" ? (
                    <>
                      <span className="num text-[34px] font-extrabold leading-none tracking-tight text-[#ff3b30]">{fromPrice.main}</span>
                      {fromPrice.unit && <span className="num text-base font-semibold"> / {fromPrice.unit}</span>}
                      {fromPrice.from && <span className="text-base font-semibold"> 부터</span>}
                    </>
                  ) : (
                    <span className="text-[28px] font-extrabold leading-none text-slate-900">{fromPrice.kind === "quote" ? "견적 문의" : "준비 중"}</span>
                  )}
                </p>
                <dl className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                  <div className="flex gap-3">
                    <dt className="w-16 shrink-0 font-semibold text-slate-500">최소 주문</dt>
                    <dd className="font-bold text-slate-900">{Number.isFinite(minFrom) ? `${won(minFrom)}부터` : "견적 문의"}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-16 shrink-0 font-semibold text-slate-500">결제</dt>
                    <dd className="font-bold text-slate-900">{orderable ? "캐시 결제 · 부가세 별도" : "견적 확정 후 결제"}</dd>
                  </div>
                  {service && (
                    <div className="flex gap-3">
                      <dt className="w-16 shrink-0 font-semibold text-slate-500">진행</dt>
                      <dd className="font-bold text-slate-900">{service.detail.steps.length}단계 · 마이페이지에서 진행 확인</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
                <a
                  href={COMPANY.kakaoChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-50"
                >
                  카카오톡 상담
                </a>
                <a
                  href="#order"
                  className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 text-base font-bold text-white transition hover:bg-emerald-700"
                >
                  {orderable ? "옵션 고르고 주문하기" : "견적 문의하기"}
                </a>
              </div>
            </div>
          </section>
        </div>

        {service && (
          <Band className="bg-emerald-50/60" labelledBy="benefits-title">
            <SectionTitle id="benefits-title" eyebrow="기대 효과" lines={["이 상품으로", "이런 결과를 기대할 수 있어요"]} />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {service.detail.benefits.map((b) => (
                <li key={b} className="flex gap-3 rounded-2xl bg-white p-5 text-[15px] font-semibold leading-relaxed text-slate-800 shadow-sm ring-1 ring-emerald-100">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </Band>
        )}

        {/* Option comparison */}
        <Band labelledBy="compare-title">
          <div id="compare" className="scroll-mt-20 lg:scroll-mt-6">
            <SectionTitle id="compare-title" eyebrow="옵션 비교" lines={[`옵션 ${p.options.length}개,`, "단가와 최소 주문을 한눈에"]} />
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-slate-200">
            <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 bg-[#17283f] px-5 py-3 text-sm font-bold text-slate-200 sm:grid">
              <span>옵션</span>
              <span className="text-right">단가</span>
              <span className="text-right">최소 주문</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {p.options.map((o) => {
                const pr = displayPrice(o);
                const min = minOrderText(o);
                return (
                  <li key={o.name} className="grid gap-1 px-5 py-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-4">
                    <div>
                      <p className="flex flex-wrap items-center gap-1.5 font-bold text-slate-900">
                        {o.name}
                        {o.badge && <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${BADGE_STYLE[o.badge]}`}>{o.badge}</span>}
                      </p>
                      {o.note && <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{o.note}</p>}
                    </div>
                    <p className="whitespace-nowrap tabular-nums text-slate-800 sm:text-right">
                      {pr.kind === "order" ? (
                        <>
                          <b className="text-lg">{pr.main}</b>
                          {pr.from ? " ~" : ""}
                          {pr.unit ? <span className="text-sm text-slate-500"> / {pr.unit}</span> : null}
                        </>
                      ) : (
                        <span className="font-bold text-amber-700">{pr.kind === "quote" ? "견적 문의" : "준비 중"}</span>
                      )}
                    </p>
                    <p className="text-sm tabular-nums text-slate-600 sm:text-right">
                      <span className="text-slate-400 sm:hidden">최소 주문 </span>
                      {min ?? "—"}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="mt-3 text-[13px] text-slate-500">표시 금액은 부가세 별도 · 1캐시 = 1원</p>
        </Band>

        {service && (
          <>
            <Band className={NAVY} labelledBy="steps-title">
              <SectionTitle id="steps-title" dark eyebrow="진행 방식" lines={["주문하면", `${service.detail.steps.length}단계로 진행돼요`]} />
              <ol className="mt-8 grid gap-3 md:grid-cols-3">
                {service.detail.steps.map((st, i) => (
                  <li key={st.title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-lg font-extrabold text-white">{i + 1}</span>
                      <span className="text-xs font-bold tracking-widest text-emerald-300">STEP {i + 1}</span>
                    </div>
                    <p className="mt-4 text-lg font-bold text-white">{st.title.replace(/^\d+\.\s*/, "")}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{st.desc}</p>
                  </li>
                ))}
              </ol>
            </Band>

            <Band labelledBy="prep-title">
              <SectionTitle id="prep-title" eyebrow="준비 자료 · 조건" lines={["주문 전에", "이것만 확인하세요"]} />
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                  <h3 className="text-lg font-extrabold text-slate-900">주문할 때 받는 정보</h3>
                  <p className="mt-1 text-sm text-slate-500">주문 창에서 입력해요. 준비가 안 된 건 주문 후 카카오톡으로 보내도 돼요.</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {materials.map((m) => (
                      <li key={m} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
                  <h3 className="text-lg font-extrabold text-slate-900">진행 조건</h3>
                  <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-slate-700">
                    {[...service.detail.conditions, "노출·순위 같은 성과는 검색·플랫폼 환경에 따라 달라질 수 있어요."].map((c) => (
                      <li key={c} className="flex gap-2.5">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Band>

            <div className={NAVY}>
              <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
                <QuickOrder
                  product={service}
                  rowNames={p.options.map((o) => o.name)}
                  label={p.title}
                  fromLabel={Number.isFinite(minFrom) ? won(minFrom) : undefined}
                  tone="dark"
                />
              </div>
            </div>

            <Band className="bg-slate-50" labelledBy="faq-title">
              <div className="text-center">
                <SectionTitle id="faq-title" eyebrow="자주 묻는 질문" lines={["궁금한 점,", "미리 답해 드려요"]} />
              </div>
              <div className="mt-8">
                <FaqAccordion items={faq} />
              </div>
              <p className="mt-6 text-center text-sm text-slate-500">
                채널 전체 안내는{" "}
                <Link href={p.detailHref!} className="font-semibold text-emerald-700 underline underline-offset-2">
                  {service.name}
                </Link>
                에서 볼 수 있어요.
              </p>
            </Band>
          </>
        )}

        {related.length > 0 && (
          <Band labelledBy="related-title">
            <SectionTitle id="related-title" eyebrow={p.group.title} lines={["같은 채널의", "다른 상품도 함께 보세요"]} />
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {related.map((r) => {
                const rp = displayPrice(productFrom(r));
                return (
                  <li key={r.id}>
                    <Link
                      href={`/store/${r.id}/`}
                      className="group block h-full overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:ring-emerald-400"
                    >
                      <ProductVisual id={r.id} groupKey={r.group.key} groupTitle={r.group.title} variant="card" />
                      <span className="block p-4">
                        <span className="block font-bold text-slate-900 group-hover:text-emerald-700">{r.title}</span>
                        {r.summary && <span className="mt-1 block text-sm leading-relaxed text-slate-500">{r.summary}</span>}
                        <span className="mt-2 block text-sm font-extrabold text-slate-900">
                          {rp.kind === "order" ? `${rp.main}${rp.unit ? ` / ${rp.unit}` : ""}부터` : rp.kind === "quote" ? "견적 문의" : "준비 중"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Band>
        )}

        {/* Final CTA */}
        <section className="bg-emerald-600">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-5 px-5 py-12 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-2xl font-extrabold leading-snug text-white sm:text-[28px]">
              고민은 짧게,
              <br className="sm:hidden" /> 시작은 오늘.
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <a
                href={COMPANY.kakaoChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 flex-1 items-center justify-center rounded-xl px-5 text-base font-bold text-white ring-1 ring-white/60 transition hover:bg-white/10 sm:flex-none"
              >
                카카오톡 상담
              </a>
              <a
                href="#order"
                className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-white px-6 text-base font-bold text-emerald-700 transition hover:bg-emerald-50 sm:flex-none"
              >
                {orderable ? "지금 주문하기" : "견적 문의하기"}
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
