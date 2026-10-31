// Store view of the price list (/pricing). Related rows are bundled into one
// product card with options (크몽-style packages) so the store shows ~20
// products instead of 60 rows; rows no bundle claims stay single cards.
// Pure data helpers so the app can reuse the same listing.

import { displayPrice, priceSortValue, type PricingGroup, type PricingItem } from "@/lib/pricing";

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
}

/** Product bundles, in display order within each channel. */
export const BUNDLES: BundleDef[] = [
  {
    id: "blog-guarantee",
    group: "blog",
    title: "블로그 상위노출 보장",
    summary: "통합검색 1페이지 노출을 24시간 또는 25일 보장",
    items: ["블로그 상위노출 24시간 보장", "블로그 상위노출 25일 보장"],
    detailHref: "/services/blog/",
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
  },
  {
    id: "blog-influencer",
    group: "blog",
    title: "공식 인플루언서 블로그 배포",
    summary: "네이버 공식 인플루언서 블로그로 신뢰도 높은 배포",
    items: ["공식 인플루언서 블로그 배포 (준최적)", "공식 인플루언서 블로그 배포 (최적)"],
    detailHref: "/services/blog/",
  },
  {
    id: "blog-neighbor",
    group: "blog",
    title: "블로그 이웃 늘리기",
    summary: "서로이웃 1명 단위부터, 이웃 추가 200명 패키지까지",
    items: ["블로그 서로이웃 추가", "블로그 이웃 추가"],
    detailHref: "/services/blog-neighbor/",
  },
  {
    id: "place-reward",
    group: "place",
    title: "플레이스 상위노출 리워드",
    summary: "일반형·압축형 미션·고순도 리워드를 일 100타 단위로",
    items: ["일반형 리워드", "압축형 미션 리워드", "고순도 체류형 트래픽"],
    detailHref: "/services/place/",
  },
  {
    id: "place-basics",
    group: "place",
    title: "플레이스 기본기 (SEO 세팅·영수증 리뷰)",
    summary: "노출의 토대가 되는 정보 세팅과 방문 리뷰",
    items: ["플레이스 메타데이터 기반 SEO 전문 세팅", "플레이스 영수증 리뷰"],
    detailHref: "/services/place/",
  },
  {
    id: "commerce",
    group: "commerce",
    title: "커머스 상위노출 (C사·쇼핑)",
    summary: "실구매 리워드와 트래픽으로 상품 순위 상승",
    items: ["C사 가구매", "C사 가구매 (택배대행 포함)", "C사 상위노출 트래픽", "쇼핑 리워드"],
    detailHref: "/services/shopping/",
  },
  {
    id: "cafe-post",
    group: "cafe",
    title: "카페 게시글 발행",
    summary: "배포형·노출용 게시글, 원고가 없으면 작성 대행까지",
    items: ["카페 배포형 게시글 발행", "카페 노출용 게시글 발행", "카페 원고 작성 대행"],
    lead: "카페 배포형 게시글 발행",
    detailHref: "/services/cafe/",
  },
  {
    id: "ai-aeo",
    group: "ai",
    title: "AI 검색 최적화 (AEO)",
    summary: "챗GPT·AI 검색에 인용되도록 세팅하고 측정",
    items: ["AI 검색 최적화(AEO) 기본 세팅", "AI 인용 모니터링 리포트", "전문가 칼럼·인터뷰 콘텐츠", "인플루언서 성장 패키지"],
    detailHref: "/services/ai-influencer/",
  },
  {
    id: "instagram",
    group: "sns",
    title: "인스타그램 반응 늘리기",
    summary: "팔로워·좋아요부터 댓글·저장까지",
    items: ["인스타 게시물 좋아요", "인스타 팔로워", "인스타 댓글·저장 등"],
    detailHref: "/services/instagram/",
  },
  {
    id: "youtube",
    group: "sns",
    title: "유튜브 채널 키우기",
    summary: "조회수·구독자·좋아요·재생시간",
    items: ["유튜브 조회수", "유튜브 구독자", "유튜브 좋아요·재생시간 등"],
    detailHref: "/services/youtube/",
  },
  {
    id: "kakaomap-trend",
    group: "kakaomap",
    title: "카카오맵 트렌드랭킹 1~6위 보장",
    summary: "일 단위 또는 월 보장 패키지",
    items: ["트렌드랭킹 1~6위 보장 (일)", "트렌드랭킹 1~6위 보장 (월)"],
    detailHref: "/services/kakaomap/",
  },
  {
    id: "kakaomap-review",
    group: "kakaomap",
    title: "카카오맵 리뷰·트래픽",
    summary: "별점·내용 리뷰와 지도 트래픽",
    items: ["카카오맵 트래픽", "카카오맵 별점 리뷰", "카카오맵 내용 리뷰"],
    detailHref: "/services/kakaomap/",
  },
  {
    id: "daangn-reaction",
    group: "daangn",
    title: "당근 단골·찜·관심",
    summary: "비즈프로필 반응을 건당 500원부터",
    items: ["비즈프로필 단골 추가", "비즈프로필 하트 찜", "소식글 관심"],
    detailHref: "/services/daangn/",
  },
  {
    id: "daangn-review",
    group: "daangn",
    title: "당근 후기·채팅 문의",
    summary: "일반·포토 후기와 소식글 채팅 문의",
    items: ["비즈프로필 일반 후기", "비즈프로필 포토 후기", "소식글 채팅 문의"],
    detailHref: "/services/daangn/",
  },
  {
    id: "daangn-content",
    group: "daangn",
    title: "당근 콘텐츠·광고 세팅",
    summary: "동네생활 게시글, 숏폼, 로고·가격표 이미지, 광고 세팅",
    items: ["동네생활 게시글 (바이럴)", "스토리(숏폼) 영상 제작", "업체로고 이미지", "가격표 이미지", "전문가모드 광고세팅"],
    detailHref: "/services/daangn/",
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
  },
  {
    id: "press",
    group: "press",
    title: "보도자료 언론 송출",
    summary: "매체를 골라 송출, 원고·이미지 옵션까지",
    items: ["보도자료 언론 송출 (일반)", "원고 대필", "이미지 제작", "원고 대필 + 이미지 제작"],
    lead: "보도자료 언론 송출 (일반)",
    detailHref: "/services/press/",
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
  const v = (p: StoreProduct) => priceSortValue(productFrom(p));
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

export function searchStore(list: StoreProduct[], query: string): StoreProduct[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, "");
  if (!q) return list;
  return list.filter((p) =>
    [p.title, p.summary ?? "", p.group.title, p.group.description, ...p.options.flatMap((o) => [o.name, o.note ?? ""])]
      .join("")
      .toLowerCase()
      .replace(/\s+/g, "")
      .includes(q),
  );
}
