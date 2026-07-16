// Detailed product price list shown in the logged-in area (/pricing).
// Single source of truth so the upcoming payment/checkout flow can read the
// same catalog. All prices are reference values.
// TODO(payment): wire each item to the real billing API (payments.ts).

export interface PricingItem {
  name: string;
  /** Display price, e.g. "30,000원 ~" or "별도 문의". */
  price: string;
  /** Per-unit suffix, e.g. "1타당", "1건". */
  unit?: string;
  /** Extra conditions shown under the item name. */
  note?: string;
  /** Requires a quote / inquiry rather than a fixed price. */
  inquiry?: boolean;
  /**
   * Orderable price in KRW (1원=1캐시). For unit items this is the per-unit
   * price (quantity chosen at order time). Absent => quote/inquiry only.
   */
  amountKrw?: number;
}

export interface PricingGroup {
  key: string;
  icon: string;
  title: string;
  description: string;
  items: PricingItem[];
}

/**
 * Numeric value for ascending price sort. Orderable items use their KRW amount;
 * ranges ("30,000원 ~") use the leading number; quote/준비중 items (no number)
 * sort to the end.
 */
export function priceSortValue(item: PricingItem): number {
  if (item.amountKrw != null) return item.amountKrw;
  const m = item.price.replace(/,/g, "").match(/\d+/);
  return m ? Number(m[0]) : Number.POSITIVE_INFINITY;
}

/** Items sorted by price ascending (non-priced items last, original order kept). */
export function sortedItems(group: PricingGroup): PricingItem[] {
  return [...group.items].sort((a, b) => priceSortValue(a) - priceSortValue(b));
}

export const PRICING: PricingGroup[] = [
  {
    key: "blog",
    icon: "✍️",
    title: "블로그",
    description: "상위노출 보장형부터 실명 배포·원고 작성까지.",
    items: [
      {
        name: "블로그 상위노출 보장형",
        price: "키워드별 견적",
        inquiry: true,
        note: "키워드 문의 필수 · 키워드별 단가 상이 · 24시간 내 견적 회신",
      },
      {
        name: "블로그 최적 배포",
        price: "30,000원 ~",
        note: "키워드에 따라 단가 상이",
      },
      { name: "블로그 준최적 배포", price: "20,000원", amountKrw: 20_000 },
      { name: "블로그 실명 배포", price: "1,000원", amountKrw: 1_000 },
      {
        name: "블로그용 원고 작성",
        price: "1,000원",
        unit: "1건",
        amountKrw: 1_000,
        note: "발행용 원고 제작",
      },
    ],
  },
  {
    key: "reward",
    icon: "📈",
    title: "리워드 트래픽",
    description: "플레이스·검색 노출을 끌어올리는 트래픽 상품.",
    items: [
      {
        name: "플레이스 일반 키워드 고품질 트래픽",
        price: "50원",
        unit: "1타당",
        amountKrw: 50,
      },
      { name: "일반 리워드 트래픽", price: "30원", unit: "1타당", amountKrw: 30 },
      { name: "체류형 트래픽", price: "100원", unit: "1타당", amountKrw: 100 },
      {
        name: "쇼핑 리워드",
        price: "준비 중",
        note: "단가 협의 예정",
      },
      {
        name: "쿠팡 트래픽",
        price: "별도 문의",
        inquiry: true,
      },
    ],
  },
  {
    key: "place",
    icon: "📍",
    title: "플레이스",
    description: "리뷰·메타데이터 세팅으로 지역 노출을 강화합니다.",
    items: [
      { name: "플레이스 영수증 리뷰", price: "1,000원", amountKrw: 1_000 },
      {
        name: "플레이스 메타데이터 기반 SEO 전문 세팅",
        price: "50,000원",
        amountKrw: 50_000,
        note: "1회 세팅",
      },
    ],
  },
  {
    key: "cafe",
    icon: "💬",
    title: "카페 홍보",
    description: "지역 맘카페·커뮤니티 카페 침투 홍보. 실사용 계정으로 자연스럽게 게시합니다.",
    items: [
      {
        name: "카페 침투 게시글 (후기형)",
        price: "30,000원 ~",
        unit: "1건",
        amountKrw: 30_000,
        note: "기본 등급 카페 기준 · 대형·상위 등급 카페는 견적 후 차액 안내",
      },
      { name: "카페 댓글 작성", price: "2,000원", unit: "1건", amountKrw: 2_000 },
      {
        name: "지역 맘카페 집중 홍보 패키지",
        price: "카페별 견적",
        inquiry: true,
        note: "지역·카페 회원수·게시 난이도에 따라 산정",
      },
    ],
  },
  {
    key: "press",
    icon: "📰",
    title: "언론홍보",
    description: "원하는 매체를 골라 보도자료를 송출합니다. 매체·단가는 상세 페이지 참고.",
    items: [
      {
        name: "보도자료 언론 송출 (일반)",
        price: "50,000원 ~",
        unit: "1건",
        amountKrw: 50_000,
        note: "일반 카테고리 최저 단가 기준 결제 · 매체 확정 후 차액 별도 안내 · 업종별 단가는 언론보도 페이지 참고 · VAT 별도",
      },
      {
        name: "원고 대필",
        price: "10,000원",
        amountKrw: 10_000,
        note: "보도자료 원고 대신 작성",
      },
      {
        name: "이미지 제작",
        price: "10,000원",
        amountKrw: 10_000,
        note: "기사 대표 이미지 제작",
      },
      {
        name: "원고 대필 + 이미지 제작",
        price: "15,000원",
        amountKrw: 15_000,
        note: "원고·이미지 묶음 옵션",
      },
    ],
  },
];
