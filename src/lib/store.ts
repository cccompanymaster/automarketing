// Store view of the price list (/pricing). Related rows are bundled into one
// product card with options (크몽-style packages) so the store shows ~20
// products instead of 60 rows; rows no bundle claims stay single cards.
// Pure data helpers so the app can reuse the same listing.

import { displayPrice, minOrderKrw, priceSortValue, type PricingGroup, type PricingItem } from "@/lib/pricing";
import { searchProducts, type SearchableProduct } from "@/lib/search/search-engine.mjs";

export interface StoreProduct {
  id: string;
  group: PricingGroup;
  title: string;
  summary?: string;
  /** Orderable rows, cheapest first. A single-row product has one option. */
  options: PricingItem[];
  /** Service detail page explaining this product. */
  detailHref?: string;
  /** Best badge among the options (인기 > 추천 > 신규). */
  badge?: PricingItem["badge"];
  /** Optional thumbnail image (basePath-relative, e.g. /store/blog-deploy.webp). */
  image?: string;
  /** Option whose price the card shows (the main product, not an add-on). Defaults to the cheapest. */
  lead?: PricingItem;
  /** Search vocabulary: other names searchers type (네이버 지도 → 플레이스), phrases, broad tags. */
  aliases: string[];
  keywords: string[];
  tags: string[];
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

interface BundleDef {
  id: string;
  group: string;
  title: string;
  summary: string;
  /** Row names in PRICING (kept in sync by the store test). */
  items: string[];
  detailHref: string;
  image?: string;
  /** Main product row, when the cheapest option is only an add-on (원고·이미지 등). */
  lead?: string;
  aliases: string[];
  keywords: string[];
  tags: string[];
}

/** Search vocabulary for single-row products (keyed like STORE_IMAGES). */
const SINGLE_TERMS: Record<string, Pick<StoreProduct, "aliases" | "keywords" | "tags">> = {
  "blog-블로그용 원고 작성": {
    aliases: ["원고", "원고 작성", "글쓰기", "대필", "블로그 원고", "AI 원고"],
    keywords: ["블로그 글 작성", "포스팅 원고"],
    tags: ["블로그", "콘텐츠"],
  },
  "cafe-카페 공식 제휴 마케팅": {
    aliases: ["카페 제휴", "카페 배너", "맘카페 제휴"],
    keywords: ["카페 공식 제휴"],
    tags: ["카페", "광고"],
  },
};

/** Product bundles, in display order within each channel. */
export const BUNDLES: BundleDef[] = [
  {
    id: "blog-guarantee",
    group: "blog",
    title: "블로그 상위노출 보장",
    summary: "통합검색 1페이지 노출을 24시간 또는 25일 보장",
    items: ["블로그 상위노출 24시간 보장", "블로그 상위노출 25일 보장"],
    detailHref: "/services/blog/",
    aliases: ["상위노출 보장", "블로그 상위노출", "1페이지 보장", "통검 노출", "블로그 1페이지"],
    keywords: ["블로그 상위 노출 보장", "통합검색 1페이지"],
    tags: ["네이버", "블로그", "상위노출", "보장"],
  },
  {
    id: "blog-deploy",
    group: "blog",
    title: "블로그 배포 (실명·준최적·최적)",
    summary: "예산과 목적에 맞는 블로그 등급을 골라 배포",
    items: [
      "블로그 실명 배포",
      "플레이스용 준최적 블로그 배포",
      "고품질 준최적 블로그 배포",
      "신로직 준최적 블로그 배포",
      "블로그 최적 배포",
      "블로그 최적 배포 (병원·법률·금융)",
    ],
    detailHref: "/services/blog/",
    aliases: ["블로그 배포", "블배", "준최", "준최블", "최블", "실명 배포", "포스팅 배포"],
    keywords: ["준최적 블로그 배포", "최적 블로그 배포", "블로그 포스팅"],
    tags: ["네이버", "블로그", "배포", "상위노출"],
  },
  {
    id: "blog-influencer",
    group: "blog",
    title: "공식 인플루언서 블로그 배포",
    summary: "네이버 공식 인플루언서 블로그로 신뢰도 높은 배포",
    items: ["공식 인플루언서 블로그 배포 (준최적)", "공식 인플루언서 블로그 배포 (최적)"],
    detailHref: "/services/blog/",
    aliases: ["인플", "인플루언서", "네이버 인플루언서", "인플 블로그", "공식인플"],
    keywords: ["네이버 인플루언서 배포", "공식 블로그 배포"],
    tags: ["네이버", "블로그", "배포", "상위노출"],
  },
  {
    id: "blog-neighbor",
    group: "blog",
    title: "블로그 이웃 늘리기",
    summary: "서로이웃 최소 50명(1명 100원)부터, 이웃 추가 200명 패키지까지",
    items: ["블로그 서로이웃 추가", "블로그 이웃 추가"],
    detailHref: "/services/blog-neighbor/",
    aliases: ["서이추", "서로이웃", "이웃추가", "블로그 이웃"],
    keywords: ["서로이웃 늘리기", "이웃 늘리기"],
    tags: ["네이버", "블로그", "SNS"],
  },
  {
    id: "place-reward",
    group: "place",
    title: "플레이스 상위노출 리워드",
    summary: "일반형·압축형 미션·고순도 리워드를 일 100타 단위로",
    items: ["일반형 리워드", "압축형 미션 리워드", "고순도 체류형 트래픽"],
    detailHref: "/services/place/",
    aliases: ["네이버 지도", "네이버지도", "네이버맵", "스마트플레이스", "플레이스", "지도 상위노출", "맛집 상위노출", "리워드", "트래픽", "슬롯"],
    keywords: ["플레이스 상위 노출", "지도 순위", "플레이스 트래픽"],
    tags: ["네이버", "플레이스", "지도", "상위노출"],
  },
  {
    id: "place-basics",
    group: "place",
    title: "플레이스 기본기 (SEO 세팅·영수증 리뷰)",
    summary: "노출의 토대가 되는 정보 세팅과 방문 리뷰",
    items: ["플레이스 메타데이터 기반 SEO 전문 세팅", "플레이스 영수증 리뷰"],
    detailHref: "/services/place/",
    aliases: ["스마트플레이스 세팅", "플레이스 세팅", "네이버 지도 세팅", "영수증 리뷰", "영수증리뷰", "SEO 세팅"],
    keywords: ["플레이스 정보 세팅", "방문자 리뷰"],
    tags: ["네이버", "플레이스", "지도", "후기", "리뷰"],
  },
  {
    id: "commerce",
    group: "commerce",
    title: "커머스 상위노출 (C사·쇼핑)",
    summary: "실구매 리워드와 트래픽으로 상품 순위 상승",
    items: ["C사 가구매", "C사 가구매 (택배대행 포함)", "C사 상위노출 트래픽", "쇼핑 리워드"],
    detailHref: "/services/shopping/",
    aliases: ["쇼핑", "쇼핑몰", "스마트스토어", "스스", "네이버쇼핑", "오픈마켓", "상품 순위", "쿠팡"],
    keywords: ["쇼핑 상위노출", "커머스 상위노출", "상품 순위 상승"],
    tags: ["쇼핑", "커머스", "상위노출", "구매평"],
  },
  {
    id: "cafe-post",
    group: "cafe",
    title: "카페 게시글 발행",
    summary: "배포형·노출용 게시글, 원고가 없으면 작성 대행까지",
    items: ["카페 배포형 게시글 발행", "카페 노출용 게시글 발행", "카페 원고 작성 대행"],
    lead: "카페 배포형 게시글 발행",
    detailHref: "/services/cafe/",
    aliases: ["맘카페", "카페 바이럴", "바이럴", "지역 카페", "커뮤니티", "까페"],
    keywords: ["맘카페 홍보", "카페 게시글", "카페 원고"],
    tags: ["카페", "바이럴", "후기"],
  },
  {
    id: "ai-aeo",
    group: "ai",
    title: "AI 검색 최적화 (AEO)",
    summary: "챗GPT·AI 검색에 인용되도록 세팅하고 측정",
    items: ["AI 검색 최적화(AEO) 기본 세팅", "AI 인용 모니터링 리포트", "전문가 칼럼·인터뷰 콘텐츠", "인플루언서 성장 패키지"],
    detailHref: "/services/ai-influencer/",
    aliases: ["AI 검색", "챗GPT", "챗지피티", "GPT", "AEO", "AI 브리핑", "생성형 AI"],
    keywords: ["AI 검색 최적화", "AI 인용"],
    tags: ["AI", "검색"],
  },
  {
    id: "instagram",
    group: "sns",
    title: "인스타그램 반응 늘리기",
    summary: "팔로워·좋아요부터 댓글·저장까지",
    items: ["인스타 게시물 좋아요", "인스타 팔로워", "인스타 댓글·저장 등"],
    detailHref: "/services/instagram/",
    aliases: ["인스타", "인스타그램", "팔로워", "좋아요", "릴스", "SNS"],
    keywords: ["인스타 팔로워 늘리기", "인스타 좋아요"],
    tags: ["SNS", "인스타그램"],
  },
  {
    id: "youtube",
    group: "sns",
    title: "유튜브 채널 키우기",
    summary: "조회수·구독자·좋아요·재생시간",
    items: ["유튜브 조회수", "유튜브 구독자", "유튜브 좋아요·재생시간 등"],
    detailHref: "/services/youtube/",
    aliases: ["유튜브", "유투브", "구독자", "조회수", "쇼츠"],
    keywords: ["유튜브 구독자 늘리기", "유튜브 조회수"],
    tags: ["SNS", "유튜브"],
  },
  {
    id: "kakaomap-trend",
    group: "kakaomap",
    title: "카카오맵 트렌드랭킹 1~6위 보장",
    summary: "일 단위 또는 월 보장 패키지",
    items: ["트렌드랭킹 1~6위 보장 (일)", "트렌드랭킹 1~6위 보장 (월)"],
    detailHref: "/services/kakaomap/",
    aliases: ["카카오 지도", "카카오지도", "카맵", "다음지도", "트렌드랭킹"],
    keywords: ["카카오맵 상위노출", "카카오맵 순위"],
    tags: ["카카오맵", "지도", "상위노출"],
  },
  {
    id: "kakaomap-review",
    group: "kakaomap",
    title: "카카오맵 리뷰·트래픽",
    summary: "별점·내용 리뷰와 지도 트래픽",
    items: ["카카오맵 트래픽", "카카오맵 별점 리뷰", "카카오맵 내용 리뷰"],
    detailHref: "/services/kakaomap/",
    aliases: ["카카오맵 리뷰", "카카오 지도 리뷰", "카맵 리뷰", "별점"],
    keywords: ["카카오맵 후기", "카카오맵 트래픽"],
    tags: ["카카오맵", "지도", "후기", "리뷰"],
  },
  {
    id: "daangn-reaction",
    group: "daangn",
    title: "당근 단골·찜·관심",
    summary: "단골·찜·관심 1건 500원, 최소 50건부터",
    items: ["비즈프로필 단골 추가", "비즈프로필 하트 찜", "소식글 관심"],
    detailHref: "/services/daangn/",
    aliases: ["당근", "당근마켓", "비즈프로필", "단골", "찜", "동네"],
    keywords: ["당근 단골 늘리기", "비즈프로필 단골"],
    tags: ["당근", "SNS"],
  },
  {
    id: "daangn-review",
    group: "daangn",
    title: "당근 후기·채팅 문의",
    summary: "일반·포토 후기와 소식글 채팅 문의",
    items: ["비즈프로필 일반 후기", "비즈프로필 포토 후기", "소식글 채팅 문의"],
    detailHref: "/services/daangn/",
    aliases: ["당근 후기", "당근 리뷰", "비즈프로필 후기"],
    keywords: ["당근 포토 후기"],
    tags: ["당근", "후기", "리뷰"],
  },
  {
    id: "daangn-content",
    group: "daangn",
    title: "당근 콘텐츠·광고 세팅",
    summary: "동네생활 게시글, 숏폼, 로고·가격표 이미지, 비즈프로필·광고계정 세팅",
    items: ["동네생활 게시글 (바이럴)", "스토리(숏폼) 영상 제작", "업체로고 이미지", "가격표 이미지", "비즈프로필·광고계정 세팅", "전문가모드 광고세팅"],
    detailHref: "/services/daangn/",
    aliases: ["당근 게시글", "동네생활", "숏폼", "당근 광고", "비즈프로필 세팅", "광고계정"],
    keywords: ["당근 콘텐츠 제작", "당근 광고 세팅"],
    tags: ["당근", "콘텐츠", "광고"],
  },
  {
    id: "daangn-project",
    group: "daangn",
    title: "당근 관리 프로젝트 (A~S)",
    summary: "30일·60일·6개월 통합 관리 패키지",
    items: [
      "프로젝트 A (30일 관리)",
      "프로젝트 B (30일 관리)",
      "프로젝트 C (30일 관리)",
      "프로젝트 D (60일 관리)",
      "프로젝트 S (6개월 관리)",
    ],
    detailHref: "/services/daangn/",
    aliases: ["당근 관리", "당근 패키지", "당근 월관리"],
    keywords: ["당근 30일 관리"],
    tags: ["당근", "패키지"],
  },
  {
    id: "press",
    group: "press",
    title: "보도자료 언론 송출",
    summary: "매체를 골라 송출, 원고·이미지 옵션까지",
    items: ["보도자료 언론 송출 (일반)", "원고 대필", "이미지 제작", "원고 대필 + 이미지 제작"],
    lead: "보도자료 언론 송출 (일반)",
    detailHref: "/services/press/",
    aliases: ["보도자료", "기사", "뉴스", "언론", "언론보도", "언론홍보", "신문", "PR"],
    keywords: ["보도자료 배포", "기사 송출"],
    tags: ["언론", "보도"],
  },
];

/**
 * Thumbnail images by product id (bundle id, or `<group>-<row name>` for a
 * single). Drop the file in public/store/ and add it here — see
 * docs/STORE_THUMBNAILS.md for the concept and image prompts.
 */
export const STORE_IMAGES: Record<string, string> = {};

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

const BADGE_RANK: Record<string, number> = { 인기: 0, 추천: 1, 신규: 2 };

function bestBadge(items: PricingItem[]): PricingItem["badge"] {
  return items
    .map((i) => i.badge)
    .filter(Boolean)
    .sort((a, b) => BADGE_RANK[a!] - BADGE_RANK[b!])[0];
}

const byPrice = (a: PricingItem, b: PricingItem) => priceSortValue(a) - priceSortValue(b);

/** Bundled products per channel (bundles first, then unclaimed rows as singles). */
export function storeProducts(groups: PricingGroup[]): StoreProduct[] {
  return groups.flatMap((group) => {
    const byName = new Map(group.items.map((i) => [i.name, i]));
    const claimed = new Set<string>();
    const bundles: StoreProduct[] = BUNDLES.filter((b) => b.group === group.key).flatMap((b) => {
      const options = b.items.map((n) => byName.get(n)).filter((i): i is PricingItem => !!i);
      options.forEach((o) => claimed.add(o.name));
      if (options.length === 0) return [];
      return [
        {
          id: b.id,
          group,
          title: b.title,
          summary: b.summary,
          options: [...options].sort(byPrice),
          detailHref: b.detailHref,
          badge: bestBadge(options),
          image: b.image ?? STORE_IMAGES[b.id],
          lead: b.lead ? byName.get(b.lead) : undefined,
          aliases: b.aliases,
          keywords: b.keywords,
          tags: b.tags,
        },
      ];
    });
    const singles: StoreProduct[] = group.items
      .filter((i) => !claimed.has(i.name))
      .map((i) => ({
        id: `${group.key}-${i.name}`,
        group,
        title: i.name,
        summary: i.note,
        options: [i],
        detailHref: GROUP_DETAIL[group.key],
        badge: i.badge,
        image: STORE_IMAGES[`${group.key}-${i.name}`],
        ...(SINGLE_TERMS[`${group.key}-${i.name}`] ?? { aliases: [], keywords: [], tags: [] }),
      }));
    return [...bundles, ...singles];
  });
}

/** Option the card prices from: the main product, else the cheapest option. */
export function productFrom(p: StoreProduct): PricingItem {
  return p.lead ?? p.options[0];
}

export function isOrderable(p: StoreProduct): boolean {
  return p.options.some((o) => displayPrice(o).kind === "order");
}

export type StoreSort = "recommended" | "price-asc" | "price-desc";

export function sortStore(list: StoreProduct[], sort: StoreSort): StoreProduct[] {
  const copy = [...list];
  // Price sorts compare what a first order actually costs (unit × minimum),
  // not the unit price: 500원 × 50건 sorts as 25,000원.
  const v = (p: StoreProduct) => minOrderKrw(productFrom(p)) ?? priceSortValue(productFrom(p));
  if (sort === "price-asc") return copy.sort((a, b) => v(a) - v(b));
  if (sort === "price-desc")
    return copy.sort((a, b) => {
      // Quote/준비 중 products (Infinity) go last in both directions.
      if (!Number.isFinite(v(a)) || !Number.isFinite(v(b))) return Number(!Number.isFinite(v(a))) - Number(!Number.isFinite(v(b)));
      return v(b) - v(a);
    });
  // Recommended: badged first, then catalog order (stable sort).
  return copy.sort((a, b) => (BADGE_RANK[a.badge ?? ""] ?? 9) - (BADGE_RANK[b.badge ?? ""] ?? 9));
}

/** The product as the search engine sees it (title > aliases/keywords > summary > category/tags > options). */
export function searchableOf(p: StoreProduct): SearchableProduct {
  return {
    title: p.title,
    aliases: p.aliases,
    keywords: p.keywords,
    tags: p.tags,
    category: p.group.title,
    summary: p.summary,
    description: [p.group.description, ...p.options.flatMap((o) => [o.name, o.note ?? ""])].join(" "),
  };
}

/**
 * Ranked search via lib/search/search-engine.mjs: partial words, spacing,
 * 초성, synonyms, short typos. Empty query keeps the input order. `fuzzy`
 * is true when some results matched only through typo tolerance.
 */
export function searchStore(list: StoreProduct[], query: string): { list: StoreProduct[]; fuzzy: boolean } {
  const docs = list.map((p) => ({ ...searchableOf(p), product: p }));
  const hits = searchProducts(docs, query);
  return {
    list: hits.map((h) => h.item.product),
    fuzzy: hits.some((h) => h.matchedBy.some((m) => m.endsWith(":유사"))),
  };
}

// --- Goal-first browsing ----------------------------------------------------

/** "무엇이 필요한가" tabs: owners who don't know product names start here. */
export const GOALS: { key: string; icon: string; label: string; ids: string[] }[] = [
  {
    key: "exposure",
    icon: "📈",
    label: "노출 올리기",
    ids: ["place-reward", "place-basics", "blog-guarantee", "blog-deploy", "kakaomap-trend", "kakaomap-review", "ai-aeo"],
  },
  {
    key: "trust",
    icon: "⭐",
    label: "후기·신뢰 쌓기",
    ids: ["place-basics", "blog-influencer", "kakaomap-review", "daangn-review", "cafe-post", "press"],
  },
  {
    key: "content",
    icon: "✍️",
    label: "콘텐츠 만들기",
    ids: ["blog-블로그용 원고 작성", "blog-deploy", "cafe-post", "daangn-content", "press"],
  },
  { key: "sns", icon: "📸", label: "SNS·이웃 키우기", ids: ["instagram", "youtube", "blog-neighbor", "daangn-reaction"] },
  { key: "sales", icon: "🛒", label: "매출 늘리기", ids: ["commerce", "place-reward", "daangn-project", "kakaomap-trend"] },
];

/** 목표별 추천 조합 — a starting set per situation (each product ordered separately). */
export const PACKAGES: { key: string; title: string; who: string; ids: string[] }[] = [
  { key: "new-store", title: "처음 시작하는 매장", who: "검색해도 잘 안 나오는 신규 매장", ids: ["place-basics", "blog-블로그용 원고 작성", "blog-deploy"] },
  { key: "local", title: "지역 매장 홍보", who: "동네 손님을 늘리고 싶은 매장", ids: ["place-reward", "kakaomap-review", "daangn-reaction"] },
  { key: "seller", title: "온라인 셀러 입문", who: "상품 순위와 후기가 필요한 셀러", ids: ["commerce", "blog-deploy", "instagram"] },
  { key: "content", title: "콘텐츠 운영형", who: "글을 꾸준히 쌓고 싶은 사장님", ids: ["blog-블로그용 원고 작성", "blog-deploy", "blog-neighbor"] },
];

/** 함께 쓰면 좋은 상품 on service detail pages (service slug → related slugs). */
export const RELATED_SERVICES: Record<string, string[]> = {
  place: ["blog", "kakaomap", "daangn"],
  blog: ["blogwrite", "blog-neighbor", "place"],
  "blog-neighbor": ["blog", "blogwrite"],
  blogwrite: ["blog", "cafe"],
  shopping: ["blog", "instagram"],
  cafe: ["blog", "daangn"],
  kakaomap: ["place", "daangn"],
  daangn: ["place", "kakaomap"],
  press: ["ai-influencer", "blog"],
  "ai-influencer": ["press", "blog"],
  instagram: ["youtube", "blog"],
  youtube: ["instagram", "blog"],
};
