// Store view of the price list (/pricing): every row becomes a product card
// with its channel, theme and detail-page link. Pure data helpers so the app
// can reuse the same listing.

import { priceSortValue, type PricingGroup, type PricingItem } from "@/lib/pricing";

export interface StoreItem {
  item: PricingItem;
  group: PricingGroup;
  /** Service detail page explaining this product. */
  detailHref?: string;
}

/** Card thumbnail gradient per channel (literal classes for Tailwind). */
export const GROUP_THEME: Record<string, string> = {
  blog: "from-sky-500 to-blue-700",
  place: "from-emerald-500 to-teal-700",
  commerce: "from-orange-400 to-rose-600",
  cafe: "from-amber-400 to-orange-600",
  ai: "from-violet-500 to-fuchsia-700",
  sns: "from-pink-500 to-rose-700",
  kakaomap: "from-yellow-300 to-amber-500",
  daangn: "from-orange-500 to-amber-600",
  press: "from-indigo-500 to-slate-800",
};

const GROUP_DETAIL: Record<string, string> = {
  blog: "/services/blog/",
  place: "/services/place/",
  commerce: "/services/shopping/",
  cafe: "/services/cafe/",
  ai: "/services/ai-influencer/",
  kakaomap: "/services/kakaomap/",
  daangn: "/services/daangn/",
  press: "/services/press/",
};

function detailHref(group: PricingGroup, item: PricingItem): string | undefined {
  if (item.name.includes("이웃")) return "/services/blog-neighbor/";
  if (group.key === "sns") return item.name.startsWith("유튜브") ? "/services/youtube/" : "/services/instagram/";
  return GROUP_DETAIL[group.key];
}

export function storeItems(groups: PricingGroup[]): StoreItem[] {
  return groups.flatMap((group) => group.items.map((item) => ({ item, group, detailHref: detailHref(group, item) })));
}

export type StoreSort = "recommended" | "price-asc" | "price-desc";

const BADGE_RANK: Record<string, number> = { 인기: 0, 추천: 1, 신규: 2 };

export function sortStore(list: StoreItem[], sort: StoreSort): StoreItem[] {
  const copy = [...list];
  if (sort === "price-asc") return copy.sort((a, b) => priceSortValue(a.item) - priceSortValue(b.item));
  if (sort === "price-desc")
    return copy.sort((a, b) => {
      const va = priceSortValue(a.item);
      const vb = priceSortValue(b.item);
      // Quote/준비 중 items (Infinity) go last in both directions.
      if (!Number.isFinite(va) || !Number.isFinite(vb)) return Number(!Number.isFinite(va)) - Number(!Number.isFinite(vb));
      return vb - va;
    });
  // Recommended: badged first, then catalog order (stable sort).
  return copy.sort((a, b) => (BADGE_RANK[a.item.badge ?? ""] ?? 9) - (BADGE_RANK[b.item.badge ?? ""] ?? 9));
}

export function searchStore(list: StoreItem[], query: string): StoreItem[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, "");
  if (!q) return list;
  return list.filter(({ item, group }) =>
    `${item.name}${item.note ?? ""}${group.title}${group.description}`.toLowerCase().replace(/\s+/g, "").includes(q),
  );
}
