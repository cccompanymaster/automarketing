// Store product page (/store/<id>/): one card of the store, with what the
// customer gets, an option comparison table, how it runs, what to prepare,
// conditions and ordering — so a product chosen in the store keeps its own
// title, options and prices. Channel overviews stay at /services/<slug>/.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { QuickOrder } from "@/components/QuickOrder";
import { ResultMock } from "@/components/ResultMock";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, OG_BASE } from "@/lib/seo";
import { PRICING, displayPrice, minOrderKrw } from "@/lib/pricing";
import { getProduct } from "@/lib/products";
import { productFrom, storeProducts, type StoreProduct } from "@/lib/store";
import { orderFormFor } from "@/lib/orderForms";

export const dynamicParams = false;

const PRODUCTS = storeProducts(PRICING);
const find = (id: string) => PRODUCTS.find((p) => p.id === id);
const serviceOf = (p: StoreProduct) => (p.detailHref ? getProduct(p.detailHref.split("/").filter(Boolean)[1] ?? "") : undefined);
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = find(id);
  if (!p) return {};
  const desc = `${p.summary ?? p.title} — ${p.group.title} 상품의 옵션별 단가·최소 주문금액·진행 방식을 비교하고 바로 주문하세요.`;
  return {
    title: `${p.title} — 가격·옵션 비교`,
    description: desc,
    alternates: { canonical: `/store/${p.id}/` },
    openGraph: { ...OG_BASE, title: p.title, description: desc, url: `/store/${p.id}/` },
  };
}

export default async function StoreProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = find(id);
  if (!p) notFound();
  const service = serviceOf(p);
  const from = productFrom(p);
  const fromPrice = displayPrice(from);
  const minFrom = Math.min(...p.options.map((o) => minOrderKrw(o) ?? Infinity));
  const related = PRODUCTS.filter((x) => x.group.key === p.group.key && x.id !== p.id).slice(0, 3);
  const materials = [...new Set(p.options.flatMap((o) => orderFormFor(o.name)?.fields.map((f) => f.label.replace(/ \(선택\)$/, "")) ?? []))];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "상품 스토어", path: "/pricing/" },
            { name: p.title, path: `/store/${p.id}/` },
          ]),
        ]}
      />
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-16 lg:pt-10">
          <nav aria-label="이동 경로" className="text-sm text-slate-500">
            <Link href="/pricing/" className="font-semibold text-emerald-700 hover:underline">
              ← 상품 스토어
            </Link>
            <span className="mx-1.5 text-slate-300">/</span>
            <Link href={`/pricing/?cat=${p.group.key}`} className="hover:underline">
              {p.group.title}
            </Link>
          </nav>

          {/* Hero: thumbnail + summary box */}
          <section className="mt-4 grid gap-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-slate-100">
              <ResultMock groupKey={p.group.key} productId={p.id} />
            </div>
            <div>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                {p.group.icon} {p.group.title}
              </span>
              <h1 className="mt-2 text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl">{p.title}</h1>
              {p.summary && <p className="mt-2 text-base leading-relaxed text-slate-600">{p.summary}</p>}
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">시작 단가</dt>
                  <dd className="mt-0.5 font-extrabold text-slate-900">
                    {fromPrice.kind === "order" ? (
                      <>
                        {fromPrice.main}
                        {fromPrice.unit ? <span className="text-xs font-semibold text-slate-500"> / {fromPrice.unit}</span> : null}
                      </>
                    ) : (
                      "견적 문의"
                    )}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">최소 주문금액</dt>
                  <dd className="mt-0.5 font-extrabold text-slate-900">{Number.isFinite(minFrom) ? `${won(minFrom)}부터` : "견적 문의"}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">옵션</dt>
                  <dd className="mt-0.5 font-extrabold text-slate-900">{p.options.length}개</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">환불</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">작업 시작 전 전액</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-400">표시 금액은 부가세 별도 · 1캐시 = 1원</p>
              <a
                href="#order"
                className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 text-base font-bold text-white transition hover:bg-emerald-700"
              >
                옵션 고르고 주문하기
              </a>
            </div>
          </section>

          {/* Option comparison */}
          <section className="mt-10">
            <h2 className="text-xl font-extrabold text-slate-900">옵션 비교</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">옵션</th>
                    <th scope="col" className="px-4 py-3 font-semibold">단가</th>
                    <th scope="col" className="px-4 py-3 font-semibold">최소 주문</th>
                    <th scope="col" className="px-4 py-3 font-semibold">비고</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {p.options.map((o) => {
                    const pr = displayPrice(o);
                    const min = minOrderKrw(o);
                    return (
                      <tr key={o.name} className="align-top">
                        <th scope="row" className="px-4 py-3 font-bold text-slate-900">
                          {o.name}
                          {o.badge && <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">{o.badge}</span>}
                        </th>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                          {pr.kind === "order" ? (
                            <>
                              <b>{pr.main}</b>
                              {pr.from ? " ~" : ""}
                              {pr.unit ? <span className="text-xs text-slate-500"> / {pr.unit}</span> : null}
                            </>
                          ) : (
                            <span className="font-semibold text-amber-700">{pr.kind === "quote" ? "견적 문의" : "준비 중"}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                          {min == null ? "—" : o.minQty && o.minQty > 1 ? `${o.minQty.toLocaleString("ko-KR")}${o.unit?.replace(/^1/, "") ?? ""} · ${won(min)}` : won(min)}
                        </td>
                        <td className="px-4 py-3 text-xs leading-relaxed text-slate-500">{o.note ?? ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {service && (
            <>
              <section className="mt-10 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <h2 className="text-lg font-extrabold text-slate-900">이런 결과를 기대할 수 있어요</h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {service.detail.benefits.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="text-emerald-600" aria-hidden="true">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <h2 className="text-lg font-extrabold text-slate-900">진행 방식</h2>
                  <ol className="mt-3 space-y-2.5 text-sm">
                    {service.detail.steps.map((st) => (
                      <li key={st.title}>
                        <b className="text-slate-900">{st.title}</b>
                        <p className="text-slate-600">{st.desc}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              <section className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <h2 className="text-lg font-extrabold text-slate-900">📎 주문할 때 받는 정보</h2>
                  <p className="mt-1 text-xs text-slate-500">주문 창에서 입력해요. 준비가 안 된 건 주문 후 카카오톡으로 보내도 돼요.</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {(materials.length ? materials : service.detail.materials ?? ["요청사항·전달 자료"]).map((m) => (
                      <li key={m} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-100">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <h2 className="text-lg font-extrabold text-slate-900">조건·환불</h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {service.detail.conditions.map((c) => (
                      <li key={c} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        {c}
                      </li>
                    ))}
                    <li className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      노출·순위 같은 성과는 검색·플랫폼 환경에 따라 달라질 수 있어요. 보장 조건이 적힌 옵션이 아니면 성과 미달을 이유로 한 환불은 제한될 수 있어요(이용약관 제9조).
                    </li>
                  </ul>
                </div>
              </section>

              <QuickOrder
                product={service}
                rowNames={p.options.map((o) => o.name)}
                label={p.title}
                fromLabel={Number.isFinite(minFrom) ? won(minFrom) : undefined}
              />

              <p className="mt-6 text-sm text-slate-500">
                채널 전체 안내는{" "}
                <Link href={p.detailHref!} className="font-semibold text-emerald-700 underline underline-offset-2">
                  {service.name}
                </Link>
                에서 볼 수 있어요.
              </p>
            </>
          )}

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-lg font-extrabold text-slate-900">같은 채널의 다른 상품</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/store/${r.id}/`}
                      className="block h-full rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:ring-emerald-300"
                    >
                      <span className="block text-sm font-bold text-slate-900">{r.title}</span>
                      {r.summary && <span className="mt-1 block text-xs text-slate-500">{r.summary}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
