// Store product visuals: which text-free hero illustration a product uses and
// the short copy the page lays over it (search query, highlighted result,
// metric names). Copy lives here, not in the images, so it can change without
// redrawing anything. Also the channel icon and the plain-text platform chips
// shown instead of third-party logos (see docs/STORE_THUMBNAILS.md: no
// platform logos in our own artwork).

export type VisualKind = "rank" | "stats" | "doc";

export interface ProductVisualSpec {
  kind: VisualKind;
  /** rank: text in the search bar. */
  query?: string;
  /** rank: the highlighted first result. doc: the document title. */
  highlight?: string;
  /** stats: up to three metric names, one per tile. */
  stats?: string[];
}

/** Illustration files under public/illustrations/. */
export const VISUAL_SRC: Record<VisualKind, string> = {
  rank: "/illustrations/hero-rank.svg",
  stats: "/illustrations/hero-stats.svg",
  doc: "/illustrations/hero-doc.svg",
};

const BY_ID: Record<string, ProductVisualSpec> = {
  "blog-guarantee": { kind: "rank", query: "통합검색 · 우리 키워드", highlight: "우리 블로그 글 · 1페이지" },
  "blog-deploy": { kind: "rank", query: "우리 동네 맛집 추천", highlight: "우리 매장 블로그 글" },
  "blog-influencer": { kind: "rank", query: "우리 동네 맛집 추천", highlight: "인플루언서 블로그 글" },
  "blog-neighbor": { kind: "stats", stats: ["서로이웃", "이웃 추가"] },
  "blog-write": { kind: "doc", highlight: "업종별 맞춤 원고" },
  "place-reward": { kind: "rank", query: "○○동 맛집", highlight: "우리 매장 플레이스" },
  "place-basics": { kind: "rank", query: "○○동 미용실", highlight: "우리 매장 플레이스" },
  commerce: { kind: "rank", query: "쇼핑 검색 · 상품 키워드", highlight: "우리 상품" },
  "cafe-post": { kind: "rank", query: "동네 카페 · 추천 글", highlight: "우리 매장 소개 게시글" },
  "cafe-partnership": { kind: "doc", highlight: "카페 공식 배너" },
  "ai-aeo": { kind: "rank", query: "근처 맛집 추천해줘", highlight: "AI 답변 출처 · 우리 매장" },
  instagram: { kind: "stats", stats: ["좋아요", "팔로워", "댓글·저장"] },
  youtube: { kind: "stats", stats: ["조회수", "구독자", "좋아요"] },
  "kakaomap-trend": { kind: "rank", query: "카카오맵 트렌드랭킹", highlight: "우리 매장" },
  "kakaomap-review": { kind: "stats", stats: ["트래픽", "별점 리뷰", "내용 리뷰"] },
  "daangn-reaction": { kind: "stats", stats: ["단골", "찜", "관심"] },
  "daangn-review": { kind: "stats", stats: ["후기", "포토 후기", "채팅 문의"] },
  "daangn-content": { kind: "doc", highlight: "동네생활 게시글" },
  "daangn-project": { kind: "doc", highlight: "당근 관리 프로젝트" },
  press: { kind: "doc", highlight: "우리 매장 보도자료" },
};

/** Fallback for products added later without their own entry. */
const BY_GROUP: Record<string, ProductVisualSpec> = {
  blog: { kind: "rank", query: "우리 동네 맛집 추천", highlight: "우리 매장 블로그 글" },
  place: { kind: "rank", query: "○○동 맛집", highlight: "우리 매장 플레이스" },
  commerce: { kind: "rank", query: "쇼핑 검색 · 상품 키워드", highlight: "우리 상품" },
  cafe: { kind: "rank", query: "동네 카페 · 추천 글", highlight: "우리 매장 소개 게시글" },
  ai: { kind: "rank", query: "근처 맛집 추천해줘", highlight: "AI 답변 출처 · 우리 매장" },
  sns: { kind: "stats", stats: ["좋아요", "팔로워", "조회수"] },
  kakaomap: { kind: "rank", query: "카카오맵 검색", highlight: "우리 매장" },
  daangn: { kind: "stats", stats: ["단골", "찜", "후기"] },
  press: { kind: "doc", highlight: "우리 매장 보도자료" },
};

export function productVisual(id: string, groupKey: string): ProductVisualSpec {
  return BY_ID[id] ?? BY_GROUP[groupKey] ?? { kind: "doc", highlight: "" };
}

/** 24px stroke icon path per channel (stroke-width 2, round caps). */
export const GROUP_ICON_PATH: Record<string, string> = {
  blog: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M9 13h6 M9 17h4",
  place: "M12 21.5s-7-6.1-7-11.5a7 7 0 0 1 14 0c0 5.4-7 11.5-7 11.5z M12 12.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5z",
  commerce: "M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z M9 8V6.5a3 3 0 0 1 6 0V8",
  cafe: "M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v5a2.5 2.5 0 0 1-2.5 2.5H10l-3.5 3v-3A2.5 2.5 0 0 1 4 11.5z M20 10v5.5a2.5 2.5 0 0 1-2 2.45V20l-2.7-2H13",
  ai: "M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9z M18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z",
  sns: "M12 20s-7.5-4.6-8.9-9.4A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.9 4C19.5 15.4 12 20 12 20z",
  kakaomap: "M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z M9 4.5v13 M15 6.5v13",
  daangn: "M3.5 11L12 4l8.5 7 M6 9.2V20h12V9.2 M10 20v-5.5h4V20",
  press: "M5 4h11a1 1 0 0 1 1 1v14a2 2 0 0 0 2 2H7a2 2 0 0 1-2-2z M17 9h2a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2 M8.5 8.5h5 M8.5 12h5 M8.5 15.5h3",
};

/** Platform names as plain text chips (never the platforms' logos). */
const PLATFORMS_BY_GROUP: Record<string, string[]> = {
  blog: ["네이버 블로그"],
  place: ["네이버 플레이스"],
  commerce: ["네이버 쇼핑", "C사"],
  cafe: ["네이버 카페"],
  ai: ["AI 검색"],
  kakaomap: ["카카오맵"],
  daangn: ["당근 비즈프로필"],
  press: ["언론사"],
};
const PLATFORMS_BY_ID: Record<string, string[]> = {
  instagram: ["인스타그램"],
  youtube: ["유튜브"],
};

export function platformChips(id: string, groupKey: string, groupTitle: string): string[] {
  return (PLATFORMS_BY_ID[id] ?? PLATFORMS_BY_GROUP[groupKey] ?? []).filter((c) => c !== groupTitle);
}

/** Share image per product (public/og/<id>.jpg), generated for the 20 store products. */
const OG_IDS = new Set(Object.keys(BY_ID));
export function productOgImage(id: string): string | undefined {
  return OG_IDS.has(id) ? `/og/${id}.jpg` : undefined;
}
