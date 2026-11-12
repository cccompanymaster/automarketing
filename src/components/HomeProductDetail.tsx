"use client";

// Home: the flagship products as an on-page "상세페이지" — tabs, then a long
// vertical detail for the picked product (고민 → 해결 → 이럴 땐 이렇게 → 단가표
// → 진행 순서 → 가입/주문), built from the same data as /services/<slug>/ so
// prices and copy never drift. Guests are sent to signup with the product kept.

import { useState } from "react";
import Link from "next/link";
import { getProduct, type ProductSlug } from "@/lib/products";
import { PRODUCT_STORIES } from "@/lib/productStories";
import { displayPrice, minOrderLabel, productPricingItems } from "@/lib/pricing";
import { track } from "@/lib/analytics";

const FLAGSHIP: ProductSlug[] = ["place", "blog", "daangn", "blogwrite"];

const TAB_LABEL: Partial<Record<ProductSlug, string>> = {
  place: "📍 플레이스",
  blog: "✍️ 블로그",
  daangn: "🥕 당근",
  blogwrite: "📝 AI 원고",
};

export function HomeProductDetail() {
  const [slug, setSlug] = useState<ProductSlug>(FLAGSHIP[0]);
  const p = getProduct(slug);
  if (!p) return null;
  const story = PRODUCT_STORIES[slug];
  const rows = productPricingItems(slug)
    .filter((i) => displayPrice(i).kind !== "soon")
    .slice(0, 6);

  return (
    <section id="product-detail" aria-labelledby="pd-h" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-5">
        <div className="text-center">
          <p className="text-sm font-bold tracking-widest text-emerald-700">대표 상품 상세</p>
          <h2 id="pd-h" className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            무엇을, 얼마에, 어떻게 하는지
            <br className="sm:hidden" /> 먼저 다 보여드려요
          </h2>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="대표 상품" className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FLAGSHIP.map((s) => {
            const on = s === slug;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="pd-panel"
                onClick={() => {
                  setSlug(s);
                  track("select_item", { item_id: s, item_list_name: "home_detail_tabs" });
                }}
                className={`min-h-12 rounded-2xl px-3 text-sm font-extrabold transition ${
                  on ? "bg-emerald-700 text-white shadow-lg" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300"
                }`}
              >
                {TAB_LABEL[s] ?? getProduct(s)?.name}
              </button>
            );
          })}
        </div>

        <div id="pd-panel" role="tabpanel" aria-label={p.name} className="mt-8 overflow-hidden rounded-3xl ring-1 ring-slate-200">
          {/* Hero band */}
          <div className={`bg-gradient-to-br ${p.accent.gradient} px-6 py-10 text-center sm:px-10 sm:py-14`}>
            <span aria-hidden="true" className="text-5xl">
              {p.icon}
            </span>
            <p className="mt-3 text-sm font-bold text-slate-600">{p.name}</p>
            <h3 className="mx-auto mt-2 max-w-2xl text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl">{p.detail.headline}</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">{p.detail.subhead}</p>
            {p.detail.fromPrice && (
              <p className="mt-5 inline-flex items-baseline gap-1.5 rounded-full bg-white px-5 py-2 shadow-sm ring-1 ring-slate-200">
                <span className="text-xs font-bold text-slate-500">시작가</span>
                <span className="text-xl font-extrabold text-emerald-700">{p.detail.fromPrice}</span>
                <span className="text-xs font-bold text-slate-500">부터</span>
              </p>
            )}
          </div>

          {/* Pains */}
          {story && (
            <div className="bg-slate-50 px-6 py-10 sm:px-10">
              <h4 className="text-center text-lg font-extrabold text-slate-900 sm:text-xl">이런 고민, 해 보셨죠?</h4>
              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                {story.pains.map((pain) => (
                  <li key={pain.quote} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <p className="text-sm font-semibold leading-relaxed text-slate-800">“{pain.quote}”</p>
                    <p className="mt-2 text-xs text-slate-400">— {pain.who}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Solution */}
          {story && (
            <div className="px-6 py-10 sm:px-10">
              <p className="text-center text-xs font-bold tracking-widest text-emerald-700">마케팅방주는 이렇게 해결해요</p>
              <h4 className="mt-2 text-center text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl">{story.solution.title}</h4>
              <ol className="mx-auto mt-6 max-w-2xl space-y-3">
                {story.solution.points.map((pt, i) => (
                  <li key={pt} className="flex gap-3 rounded-2xl bg-emerald-50/60 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-extrabold text-white">{i + 1}</span>
                    <span className="text-sm leading-relaxed text-slate-800 sm:text-base">{pt}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Scenarios */}
          {story && story.scenarios.length > 0 && (
            <div className="bg-slate-900 px-6 py-10 text-white sm:px-10">
              <h4 className="text-center text-lg font-extrabold sm:text-xl">이럴 땐, 이렇게</h4>
              <ul className="mx-auto mt-5 max-w-2xl space-y-3">
                {story.scenarios.map((sc) => (
                  <li key={sc.when} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <p className="text-sm font-bold text-emerald-300">{sc.when}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-200">{sc.then}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prices */}
          {rows.length > 0 && (
            <div className="px-6 py-10 sm:px-10">
              <h4 className="text-center text-lg font-extrabold text-slate-900 sm:text-xl">공개 단가</h4>
              <p className="mt-1 text-center text-xs text-slate-500">부가세 별도 · 회원가입 후 이 가격 그대로 직접 주문해요</p>
              <div className="mx-auto mt-5 max-w-2xl overflow-hidden rounded-2xl ring-1 ring-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-semibold">상품</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-semibold">단가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const d = displayPrice(r);
                      const min = minOrderLabel(r);
                      return (
                        <tr key={r.name} className="border-t border-slate-100 align-top">
                          <th scope="row" className="px-4 py-3 font-semibold text-slate-800">
                            {r.name}
                            {min && <span className="mt-0.5 block text-[11px] font-normal text-slate-400">{min}</span>}
                          </th>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-900">
                            <b>{d.main}</b>
                            {d.from && <span className="text-xs text-slate-500"> 부터</span>}
                            {d.unit && <span className="block text-[11px] text-slate-400">/ {d.unit}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Steps */}
          {p.detail.steps.length > 0 && (
            <div className="bg-slate-50 px-6 py-10 sm:px-10">
              <h4 className="text-center text-lg font-extrabold text-slate-900 sm:text-xl">진행 순서</h4>
              <ol className="mx-auto mt-5 grid max-w-3xl gap-3 sm:grid-cols-3">
                {p.detail.steps.slice(0, 3).map((st) => (
                  <li key={st.title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <p className="text-sm font-extrabold text-slate-900">{st.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{st.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center sm:flex-row sm:justify-center">
            <Link
              href={`/start?service=${p.slug}`}
              onClick={() => track("cta_click", { product_slug: p.slug })}
              className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 px-8 text-base font-extrabold text-white shadow-lg hover:bg-emerald-700 sm:w-auto"
            >
              회원가입하고 실행가로 시작하기 →
            </Link>
            <Link
              href={`/services/${p.slug}/`}
              className="flex min-h-12 w-full items-center justify-center rounded-2xl px-6 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 sm:w-auto"
            >
              {p.name} 전체 상세 보기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
