"use client";

// Members-only product store (크몽-style): search, channel chips, sort and a
// grid of product cards that order straight from cash. Guests are redirected
// into the signup funnel — public pages show each product's 예상 비용 instead.
// /pricing#<group> preselects that channel (links from service pages).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { ChargeModal } from "@/components/ChargeModal";
import { OrderModal } from "@/components/OrderModal";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StoreCard } from "@/components/StoreCard";
import { ProductOptionsModal } from "@/components/ProductOptionsModal";
import { PRICING, type PricingGroup, type PricingItem } from "@/lib/pricing";
import { GOALS, PACKAGES, isOrderable, searchStore, sortStore, storeProducts, type StoreProduct, type StoreSort } from "@/lib/store";
import { track } from "@/lib/analytics";
import { SUGGESTED_QUERIES, suggest } from "@/lib/storeSearch";
import Link from "next/link";
import { COMPANY } from "@/lib/company";
import { fetchLivePricing, isSheetPricingConfigured } from "@/lib/sheetPricing";
import { InquiryModal } from "@/components/InquiryModal";
import { formatCash } from "@/lib/cash";

const SORTS: { key: StoreSort; label: string }[] = [
  { key: "recommended", label: "추천순" },
  { key: "price-asc", label: "낮은 가격순" },
  { key: "price-desc", label: "높은 가격순" },
];

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();
  const { balance } = useWallet();
  const [orderItem, setOrderItem] = useState<PricingItem | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [inquiryTopic, setInquiryTopic] = useState<string | null>(null);
  // Built-in catalog first; live sheet prices override once fetched.
  const [groups, setGroups] = useState<PricingGroup[]>(PRICING);
  const [live, setLive] = useState(false);
  /** null = 전체 채널 */
  const [channel, setChannel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<StoreSort>("recommended");
  const [orderableOnly, setOrderableOnly] = useState(false);
  const [openProduct, setOpenProduct] = useState<StoreProduct | null>(null);
  /** Goal tab ("노출 올리기"…) or a recommended combo narrows the grid to its products. */
  const [goal, setGoal] = useState<string | null>(null);
  const [pack, setPack] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchLivePricing().then((merged) => {
      if (active && merged) {
        setGroups(merged);
        setLive(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const authed = hydrated && isAuthenticated;

  // Members only: send guests into the funnel once the session is restored.
  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace("/start");
  }, [hydrated, isAuthenticated, router]);

  // A hash (e.g. /pricing#sns) preselects that channel.
  useEffect(() => {
    if (!hydrated) return;
    const hash = decodeURIComponent(window.location.hash.slice(1));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time deep-link sync
    if (hash && groups.some((g) => g.key === hash)) setChannel(hash);
  }, [hydrated, groups]);

  const all = useMemo(() => storeProducts(groups), [groups]);
  const { shown, corrections } = useMemo(() => {
    let list = channel ? all.filter((p) => p.group.key === channel) : all;
    const ids = pack ? PACKAGES.find((x) => x.key === pack)?.ids : goal ? GOALS.find((x) => x.key === goal)?.ids : null;
    if (ids) list = list.filter((p) => ids.includes(p.id)).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    if (orderableOnly) list = list.filter(isOrderable);
    const found = searchStore(list, query);
    // Search results stay in relevance order unless a price sort is chosen;
    // a combo keeps its own order.
    const ordered = pack || (query.trim() && sort === "recommended") ? found.list : sortStore(found.list, sort);
    return { shown: ordered, corrections: found.corrections };
  }, [all, channel, goal, pack, orderableOnly, query, sort]);
  const [searchFocused, setSearchFocused] = useState(false);
  const suggestions = useMemo(() => suggest(all.map((p) => p.title), query), [all, query]);
  const browsing = !query && !goal && !pack && !channel;
  const activePack = PACKAGES.find((x) => x.key === pack);
  const activeGoal = GOALS.find((x) => x.key === goal);

  const openCard = (p: StoreProduct) => {
    track("select_item", { item_id: p.id, item_name: p.title, item_category: p.group.title });
    if (p.options.length > 1) {
      track("view_item", { item_id: p.id, item_name: p.title });
      setOpenProduct(p);
    } else setOrderItem(p.options[0]);
  };

  const selectChannel = (key: string | null) => {
    setChannel(key);
    history.replaceState(null, "", key ? `#${key}` : window.location.pathname);
  };

  if (!authed) return null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        {/* Store banner + search */}
        <section className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-5 pb-8 pt-16 lg:pt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold tracking-widest text-emerald-200">마케팅방주 스토어</p>
                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">필요한 마케팅, 골라서 바로 주문하세요</h1>
                <p className="mt-2 text-sm text-emerald-50/90">
                  모든 단가 공개 · 1캐시 = 1원 (부가세 별도) · 작업 시작 전 전액 환불
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setChargeOpen(true)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold backdrop-blur transition hover:bg-white/25"
                >
                  내 캐시 <span className="num">{formatCash(balance)}</span> · 충전
                </button>
                <Link
                  href="/mypage#orders"
                  className="inline-flex min-h-11 items-center rounded-xl bg-white/15 px-4 text-sm font-bold backdrop-blur transition hover:bg-white/25"
                >
                  주문내역
                </Link>
                <a
                  href={COMPANY.kakaoChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-xl bg-[#FEE500] px-4 text-sm font-bold text-slate-900 transition hover:brightness-95"
                >
                  상담하기
                </a>
              </div>
            </div>
            <label htmlFor="store-search" className="sr-only">
              상품 검색
            </label>
            <div className="mt-6 flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-lg">
              <span aria-hidden="true" className="pl-3 text-lg">🔍</span>
              <input
                id="store-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                autoComplete="off"
                role="combobox"
                aria-expanded={searchFocused && suggestions.length > 0}
                aria-controls="store-suggest"
                placeholder="네이버 지도, 블로그, 맘카페… 편하게 쳐 보세요"
                className="h-12 min-w-0 flex-1 bg-transparent px-1 text-base text-slate-900 outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="h-10 shrink-0 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                >
                  지우기
                </button>
              )}
            </div>
            {searchFocused && suggestions.length > 0 && (
              <ul
                id="store-suggest"
                role="listbox"
                className="relative z-20 -mt-1 overflow-hidden rounded-b-2xl bg-white text-slate-800 shadow-xl ring-1 ring-slate-200"
              >
                {suggestions.map((sg) => (
                  <li key={sg} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setQuery(sg);
                        setSearchFocused(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-emerald-50"
                    >
                      <span aria-hidden="true" className="text-slate-400">🔍</span>
                      {sg}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!query && (
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-emerald-100">많이 찾는 검색어</span>
                {SUGGESTED_QUERIES.map((sq) => (
                  <button
                    key={sq}
                    type="button"
                    onClick={() => setQuery(sq)}
                    className="rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white transition hover:bg-white/20"
                  >
                    {sq}
                  </button>
                ))}
              </p>
            )}

            {/* Goal-first browsing: what do you need? */}
            <p className="mt-6 text-sm font-bold text-emerald-100">무엇이 필요하세요?</p>
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {GOALS.map((g) => {
                const active = goal === g.key;
                return (
                  <li key={g.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setPack(null);
                        setGoal(active ? null : g.key);
                      }}
                      aria-pressed={active}
                      className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-xs font-bold transition sm:text-sm ${
                        active ? "bg-white text-emerald-800 shadow-lg" : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      <span aria-hidden="true" className="text-xl">{g.icon}</span>
                      {g.label}
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  onClick={() => setInquiryTopic("무엇부터 할지 상담")}
                  className="flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-white/40 px-2 py-2 text-center text-xs font-bold text-white transition hover:bg-white/10 sm:text-sm"
                >
                  <span aria-hidden="true" className="text-xl">🙋</span>
                  잘 모르겠어요
                </button>
              </li>
            </ul>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5 pb-14">
          {/* Channel chips */}
          <nav aria-label="카테고리" className="-mx-5 mt-6 overflow-x-auto px-5 pb-2">
            <ul className="flex w-max gap-2">
              {[{ key: null, icon: "🗂️", title: "전체", count: all.length }, ...groups.map((g) => ({ key: g.key, icon: g.icon, title: g.title, count: all.filter((p) => p.group.key === g.key).length }))].map(
                (c) => {
                  const active = channel === c.key;
                  return (
                    <li key={c.key ?? "all"}>
                      <button
                        type="button"
                        onClick={() => selectChannel(c.key)}
                        aria-pressed={active}
                        className={`flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-bold transition ${
                          active
                            ? "bg-slate-900 text-white shadow"
                            : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300"
                        }`}
                      >
                        <span aria-hidden="true">{c.icon}</span>
                        {c.title}
                        <span className={`num text-xs ${active ? "text-white/70" : "text-slate-400"}`}>{c.count}</span>
                      </button>
                    </li>
                  );
                },
              )}
            </ul>
          </nav>

          {/* 목표별 추천 조합 — only while browsing everything */}
          {browsing && (
            <section aria-label="목표별 추천 조합" className="mt-6">
              <h2 className="text-base font-extrabold text-slate-900">목표별 추천 조합</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {PACKAGES.map((k) => (
                  <li key={k.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setGoal(null);
                        setPack(k.key);
                      }}
                      className="flex h-full w-full flex-col rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200/70 transition hover:ring-emerald-300"
                    >
                      <span className="text-sm font-extrabold text-slate-900">{k.title}</span>
                      <span className="mt-0.5 text-xs text-slate-500">{k.who}</span>
                      <span className="mt-2 text-xs font-semibold text-emerald-700">
                        {k.ids.map((id) => all.find((p) => p.id === id)?.title).filter(Boolean).join(" + ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(activePack || activeGoal) && (
            <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-100">
              <span className="font-bold">
                {activePack ? `추천 조합 · ${activePack.title}` : `${activeGoal!.icon} ${activeGoal!.label}`}
              </span>
              {activePack && <span className="text-xs text-emerald-800">{activePack.who} — 상품은 각각 주문해요</span>}
              <button
                type="button"
                onClick={() => {
                  setGoal(null);
                  setPack(null);
                }}
                className="ml-auto rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200"
              >
                ✕ 해제
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <b className="num text-slate-900">{shown.length}</b>개 상품
              {query.trim() && corrections.length > 0 && (
                <span className="ml-2 text-xs text-slate-500">
                  ‘{corrections.join(", ")}’(으)로 찾았어요
                </span>
              )}
              {isSheetPricingConfigured && live && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
                  실시간 단가
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                <input
                  type="checkbox"
                  checked={orderableOnly}
                  onChange={(e) => setOrderableOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                바로 주문 가능
              </label>
              <label htmlFor="store-sort" className="sr-only">
                정렬
              </label>
              <select
                id="store-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as StoreSort)}
                className="min-h-10 rounded-xl bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
              >
                {SORTS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product grid — columns follow the space left between the wings */}
          {shown.length > 0 ? (
            <div className="@container mt-5">
              <ul className="grid grid-cols-2 gap-3 @3xl:grid-cols-3 @5xl:grid-cols-4 sm:gap-4">
                {shown.map((p) => (
                  <li key={p.id}>
                    <StoreCard
                      product={p}
                      onOpen={() => openCard(p)}
                      onInquiry={() => setInquiryTopic(p.title)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-white p-10 text-center ring-1 ring-slate-100">
              <p className="text-base font-bold text-slate-800">찾는 상품이 없어요</p>
              <p className="mt-1 text-sm text-slate-500">이런 검색어는 어떠세요?</p>
              <p className="mt-3 flex flex-wrap justify-center gap-1.5">
                {SUGGESTED_QUERIES.map((sq) => (
                  <button
                    key={sq}
                    type="button"
                    onClick={() => setQuery(sq)}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50"
                  >
                    {sq}
                  </button>
                ))}
              </p>
              <p className="mt-3 text-sm text-slate-500">원하는 마케팅이 없다면 문의해 주세요.</p>
              <button
                type="button"
                onClick={() => setInquiryTopic(query || "상품 문의")}
                className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
              >
                문의하기
              </button>
            </div>
          )}

          {/* Inquiry CTA (quote-based items) */}
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-slate-900 px-6 py-7 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-white">키워드 단가·견적이 궁금하신가요?</h2>
              <p className="mt-1 text-sm text-slate-300">
                카페 공식 제휴·C사 트래픽 등 견적형 상품은 문의 후 24시간 안에 회신드려요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInquiryTopic("컨설팅·견적 상담")}
              className="inline-flex min-h-12 shrink-0 items-center rounded-xl bg-emerald-500 px-6 text-sm font-bold text-white transition hover:bg-emerald-400"
            >
              견적·문의하기
            </button>
          </div>
        </div>
      </main>
      <SiteFooter />

      <ProductOptionsModal
        product={openProduct}
        onClose={() => setOpenProduct(null)}
        onOrder={(item) => {
          setOpenProduct(null);
          setOrderItem(item);
        }}
        onInquiry={(item) => {
          setOpenProduct(null);
          setInquiryTopic(item.name);
        }}
      />
      <OrderModal
        item={orderItem}
        onClose={() => setOrderItem(null)}
        onNeedCharge={() => setChargeOpen(true)}
      />
      <ChargeModal open={chargeOpen} onClose={() => setChargeOpen(false)} />
      <InquiryModal
        open={inquiryTopic !== null}
        topic={inquiryTopic ?? ""}
        onClose={() => setInquiryTopic(null)}
      />
    </>
  );
}
