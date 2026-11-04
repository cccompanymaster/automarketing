"use client";

// Members-only product store (크몽-style): search, channel chips, goals and a
// grid of product cards. Card → its own page (/store/<id>/); 빠른 주문 opens the
// options / order window right here. Search shows what the words name first
// and "함께 고려할 상품" separately. Search, category, goal, sort and the
// list position live in the URL / session so a round trip to a product page
// or a reload comes back to the same view. Guests are sent to the funnel.
// /pricing#<group> (older links) and ?cat=<group> preselect a channel.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { ChargeModal } from "@/components/ChargeModal";
import { OrderFlow } from "@/components/OrderFlow";
import type { OrderDraft } from "@/components/OrderModal";
import { ResumeOrderBanner } from "@/components/ResumeOrderBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StoreCard } from "@/components/StoreCard";
import { ProductOptionsModal } from "@/components/ProductOptionsModal";
import { ProductFinder } from "@/components/ProductFinder";
import { InquiryModal } from "@/components/InquiryModal";
import { PRICING, type PricingGroup, type PricingItem } from "@/lib/pricing";
import {
  GOALS,
  PACKAGES,
  isOrderable,
  searchStoreSplit,
  searchableOf,
  sortStore,
  storeProducts,
  type StoreProduct,
  type StoreSort,
} from "@/lib/store";
import { track } from "@/lib/analytics";
import { SUGGESTED_QUERIES, suggest } from "@/lib/storeSearch";
import { fetchLivePricing, isSheetPricingConfigured } from "@/lib/sheetPricing";
import { formatCash } from "@/lib/cash";

const SORTS: { key: StoreSort; label: string }[] = [
  { key: "recommended", label: "추천순" },
  { key: "price-asc", label: "시작 금액 낮은순" },
  { key: "price-desc", label: "시작 금액 높은순" },
];

const SCROLL_KEY = "store.scroll";

/** Search terms worth sending to analytics: no digits or @ (phone, email). */
const safeTerm = (q: string) => (/[\d@]/.test(q) ? "" : q.trim().slice(0, 30));

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();
  const { balance } = useWallet();
  const [orderItem, setOrderItem] = useState<PricingItem | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [resumeDraft, setResumeDraft] = useState<OrderDraft | null>(null);
  const [inquiryTopic, setInquiryTopic] = useState<string | null>(null);
  const [finderOpen, setFinderOpen] = useState(false);
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [restored, setRestored] = useState(false);

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

  // Restore the view from the URL (?q=&cat=&goal=&combo=&sort=&only=1, or an older #<group>).
  useEffect(() => {
    if (!hydrated || restored) return;
    const u = new URL(window.location.href);
    const cat = u.searchParams.get("cat") ?? decodeURIComponent(u.hash.slice(1));
    /* eslint-disable react-hooks/set-state-in-effect -- one-time restore from the URL */
    if (cat && groups.some((g) => g.key === cat)) setChannel(cat);
    setQuery(u.searchParams.get("q") ?? "");
    const g = u.searchParams.get("goal");
    if (g && GOALS.some((x) => x.key === g)) setGoal(g);
    const c = u.searchParams.get("combo");
    if (c && PACKAGES.some((x) => x.key === c)) setPack(c);
    const so = u.searchParams.get("sort") as StoreSort | null;
    if (so && SORTS.some((x) => x.key === so)) setSort(so);
    setOrderableOnly(u.searchParams.get("only") === "1");
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [hydrated, restored, groups]);

  // Keep the URL in step so reload / back / a shared link show the same view.
  useEffect(() => {
    if (!restored) return;
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (channel) p.set("cat", channel);
    if (goal) p.set("goal", goal);
    if (pack) p.set("combo", pack);
    if (sort !== "recommended") p.set("sort", sort);
    if (orderableOnly) p.set("only", "1");
    const qs = p.toString();
    history.replaceState(history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [restored, query, channel, goal, pack, sort, orderableOnly]);

  const all = useMemo(() => storeProducts(groups), [groups]);
  const { shown, related, fuzzy } = useMemo(() => {
    let list = channel ? all.filter((p) => p.group.key === channel) : all;
    const ids = pack ? PACKAGES.find((x) => x.key === pack)?.ids : goal ? GOALS.find((x) => x.key === goal)?.ids : null;
    if (ids) list = list.filter((p) => ids.includes(p.id)).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    if (orderableOnly) list = list.filter(isOrderable);
    const found = searchStoreSplit(list, query);
    // Search results stay in relevance order unless a price sort is chosen;
    // a combo keeps its own order.
    const order = (l: StoreProduct[]) => (pack || (query.trim() && sort === "recommended") ? l : sortStore(l, sort));
    return { shown: order(found.direct), related: order(found.related).slice(0, 4), fuzzy: found.fuzzy };
  }, [all, channel, goal, pack, orderableOnly, query, sort]);
  const suggestions = useMemo(() => suggest(all.map(searchableOf), query), [all, query]);
  const browsing = !query && !goal && !pack && !channel;
  const activePack = PACKAGES.find((x) => x.key === pack);
  const activeGoal = GOALS.find((x) => x.key === goal);

  // Back from a product page: return to the same spot in the list.
  const restoredScroll = useRef(false);
  useEffect(() => {
    if (!authed || !restored || restoredScroll.current) return;
    restoredScroll.current = true;
    try {
      const saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? "null") as { url: string; y: number } | null;
      if (saved && saved.url === window.location.pathname + window.location.search) {
        requestAnimationFrame(() => window.scrollTo(0, saved.y));
      }
      sessionStorage.removeItem(SCROLL_KEY);
    } catch {
      /* ignore */
    }
  }, [authed, restored]);
  const rememberScroll = useCallback(() => {
    try {
      sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ url: window.location.pathname + window.location.search, y: window.scrollY }));
    } catch {
      /* ignore */
    }
  }, []);

  // Analytics: the search term (without digits/@) and how many direct hits it got.
  useEffect(() => {
    const term = safeTerm(query);
    if (!term) return;
    const t = setTimeout(() => track("search", { search_term: term, results: shown.length }), 800);
    return () => clearTimeout(t);
  }, [query, shown.length]);

  const openCard = (p: StoreProduct) => {
    track("select_item", { item_id: p.id, item_name: p.title, item_category: p.group.title });
    if (p.options.length > 1) {
      track("view_item", { item_id: p.id, item_name: p.title });
      setOpenProduct(p);
    } else setOrderItem(p.options[0]);
  };

  const pickSuggestion = (sg: string) => {
    setQuery(sg);
    setSearchFocused(false);
    setActiveSuggestion(-1);
  };

  const clearFilters = () => {
    setQuery("");
    setChannel(null);
    setGoal(null);
    setPack(null);
    setOrderableOnly(false);
  };

  if (!authed) return null;

  const renderGrid = (list: StoreProduct[]) => (
    <div className="@container mt-4">
      <ul className="grid grid-cols-2 gap-3 @3xl:grid-cols-3 @5xl:grid-cols-4 sm:gap-4">
        {list.map((p) => (
          <li key={p.id}>
            <StoreCard product={p} onOpen={() => openCard(p)} onInquiry={() => setInquiryTopic(p.title)} onView={rememberScroll} />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        {/* Store header + search — short on phones so products show early */}
        <section className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-5 pb-5 pt-16 sm:pb-7 lg:pt-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl font-extrabold sm:text-2xl">
                마케팅방주 스토어
                <span className="ml-2 hidden text-sm font-semibold text-emerald-100 sm:inline">모든 단가 공개 · 작업 전 전액 환불</span>
              </h1>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setChargeOpen(true)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-bold backdrop-blur transition hover:bg-white/25 sm:text-sm"
                >
                  <span className="num">{formatCash(balance)}</span> · 충전
                </button>
                <Link
                  href="/mypage#orders"
                  className="inline-flex min-h-10 items-center rounded-xl bg-white/15 px-3 text-xs font-bold backdrop-blur transition hover:bg-white/25 sm:text-sm"
                >
                  내 주문
                </Link>
              </div>
            </div>

            <div className="relative mt-4">
              <label htmlFor="store-search" className="sr-only">
                상품 검색
              </label>
              <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-lg">
                <span aria-hidden="true" className="pl-3 text-lg">🔍</span>
                <input
                  id="store-search"
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveSuggestion(-1);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  onKeyDown={(e) => {
                    if (!suggestions.length) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveSuggestion((i) => (i + 1) % suggestions.length);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveSuggestion((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
                    } else if (e.key === "Enter" && activeSuggestion >= 0) {
                      e.preventDefault();
                      pickSuggestion(suggestions[activeSuggestion]);
                    } else if (e.key === "Escape") {
                      setSearchFocused(false);
                    }
                  }}
                  enterKeyHint="search"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={searchFocused && suggestions.length > 0}
                  aria-controls="store-suggest"
                  aria-activedescendant={activeSuggestion >= 0 ? `store-suggest-${activeSuggestion}` : undefined}
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
                  aria-label="추천 검색어"
                  className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl bg-white text-slate-800 shadow-xl ring-1 ring-slate-200"
                >
                  {suggestions.map((sg, i) => (
                    <li key={sg} id={`store-suggest-${i}`} role="option" aria-selected={i === activeSuggestion}>
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion(sg)}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm ${i === activeSuggestion ? "bg-emerald-50" : "hover:bg-emerald-50"}`}
                      >
                        <span aria-hidden="true" className="text-slate-400">🔍</span>
                        {sg}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!query && (
              <p className="mt-3 hidden flex-wrap items-center gap-1.5 text-xs sm:flex">
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
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5 pb-14">
          {/* Categories: one scrolling row on phones, wrapped on wider screens */}
          <nav aria-label="카테고리" className="-mx-5 mt-4 overflow-x-auto px-5 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
            <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              {[
                { key: null, icon: "🗂️", title: "전체", count: all.length },
                ...groups.map((g) => ({ key: g.key, icon: g.icon, title: g.title, count: all.filter((p) => p.group.key === g.key).length })),
              ].map((c) => {
                const active = channel === c.key;
                return (
                  <li key={c.key ?? "all"}>
                    <button
                      type="button"
                      onClick={() => setChannel(c.key)}
                      aria-pressed={active}
                      className={`flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-bold transition ${
                        active ? "bg-slate-900 text-white shadow" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300"
                      }`}
                    >
                      <span aria-hidden="true">{c.icon}</span>
                      {c.title}
                      <span className={`num text-xs ${active ? "text-white/70" : "text-slate-400"}`}>{c.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Goals: chips on wider screens; one button on phones */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFinderOpen(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              🎯 내게 맞는 상품 찾기
            </button>
            {GOALS.map((g) => {
              const active = goal === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => {
                    setPack(null);
                    setGoal(active ? null : g.key);
                  }}
                  aria-pressed={active}
                  className={`hidden min-h-10 items-center gap-1 rounded-full px-3.5 text-sm font-bold transition sm:inline-flex ${
                    active ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-emerald-300"
                  }`}
                >
                  <span aria-hidden="true">{g.icon}</span>
                  {g.label}
                </button>
              );
            })}
          </div>

          <ResumeOrderBanner
            groups={groups}
            onResume={(item, d) => {
              setResumeDraft(d);
              setOrderItem(item);
            }}
          />

          {(activePack || activeGoal) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-100">
              <span className="font-bold">{activePack ? `추천 조합 · ${activePack.title}` : `${activeGoal!.icon} ${activeGoal!.label}`}</span>
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              <b className="num text-slate-900">{shown.length}</b>개 상품
              {query.trim() && fuzzy && <span className="ml-2 text-xs text-slate-500">비슷한 표현으로 찾은 상품도 있어요</span>}
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
                바로 주문
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

          {shown.length > 0 ? (
            renderGrid(shown)
          ) : (
            <div className="mt-6 rounded-2xl bg-white p-8 text-center ring-1 ring-slate-100">
              <p className="text-base font-bold text-slate-800">
                {query.trim() ? `‘${query.trim()}’에 딱 맞는 상품이 없어요` : "조건에 맞는 상품이 없어요"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {related.length ? "검색어와 관련된 상품을 아래에 모았어요." : "이런 검색어는 어떠세요?"}
              </p>
              {!related.length && (
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
              )}
              <p className="mt-4 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={clearFilters} className="min-h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                  검색·필터 초기화
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryTopic(query.trim() || "상품 문의")}
                  className="min-h-10 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  원하는 마케팅 문의하기
                </button>
              </p>
            </div>
          )}

          {/* Related, not named by the search — kept apart from the results */}
          {query.trim() && related.length > 0 && (
            <section aria-label="함께 고려할 상품" className="mt-10">
              <h2 className="text-base font-extrabold text-slate-900">함께 고려할 상품</h2>
              <p className="mt-0.5 text-xs text-slate-500">검색어와 같은 채널·태그나 옵션이 있는 상품이에요.</p>
              {renderGrid(related)}
            </section>
          )}

          {/* 목표별 추천 조합 — while browsing everything, wider screens */}
          {browsing && (
            <section aria-label="목표별 추천 조합" className="mt-12 hidden sm:block">
              <h2 className="text-base font-extrabold text-slate-900">목표별 추천 조합</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {PACKAGES.map((k) => (
                  <li key={k.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setGoal(null);
                        setPack(k.key);
                        window.scrollTo({ top: 0, behavior: "smooth" });
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

          {/* Inquiry CTA (quote-based items) */}
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-slate-900 px-6 py-7 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-white">키워드 단가·견적이 궁금하신가요?</h2>
              <p className="mt-1 text-sm text-slate-300">카페 공식 제휴·C사 트래픽 등 견적형 상품은 문의 후 24시간 안에 회신드려요.</p>
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
      <OrderFlow
        item={orderItem}
        initialDraft={resumeDraft}
        onClose={() => {
          setOrderItem(null);
          setResumeDraft(null);
        }}
      />
      <ChargeModal open={chargeOpen} onClose={() => setChargeOpen(false)} />
      <ProductFinder
        open={finderOpen}
        products={all}
        onClose={() => setFinderOpen(false)}
        onAsk={(topic) => {
          setFinderOpen(false);
          setInquiryTopic(topic);
        }}
      />
      <InquiryModal open={inquiryTopic !== null} topic={inquiryTopic ?? ""} onClose={() => setInquiryTopic(null)} />
    </>
  );
}
