// Product / service catalog. Result-oriented copy aimed at small business
// owners, online sellers, and store operators. All values are placeholder/
// dummy content for the landing + funnel; real pricing comes from backend.
// TODO(backend): replace cost ranges / refund rates with live data.

export type ProductSlug =
  | "place"
  | "shopping"
  | "blog"
  | "press"
  | "experience"
  | "refund"
  | "consulting";

export interface ProductDetailStep {
  title: string;
  desc: string;
}

export interface Product {
  slug: ProductSlug;
  /** Emoji used as a lightweight icon (no asset pipeline needed yet). */
  icon: string;
  name: string;
  /** Two-line, result-oriented summary shown on the landing card. */
  summary: string[];
  /** Product-specific CTA label. */
  cta: string;
  /** Full Tailwind class strings (kept literal so the JIT picks them up). */
  accent: {
    chip: string;
    iconBg: string;
    cardRing: string;
    button: string;
    gradient: string;
  };
  detail: {
    headline: string;
    subhead: string;
    /** Minimum "from" price shown at the top of the detail page (e.g. "25원"). */
    fromPrice?: string;
    benefits: string[];
    steps: ProductDetailStep[];
    /** Expected cost range, exposed BEFORE signup to reduce drop-off. */
    costRange: string;
    costNote: string;
    /** Refund / settlement conditions (used by the refund product). */
    conditions: string[];
  };
}

export const PRODUCTS: Record<ProductSlug, Product> = {
  place: {
    slug: "place",
    icon: "📍",
    name: "플레이스 광고",
    summary: ["지역 검색에서 우리 매장을 상위에 노출하고", "매장을 방문하는 고객 수를 늘립니다."],
    cta: "플레이스 진단 받기",
    accent: {
      chip: "bg-emerald-50 text-emerald-700",
      iconBg: "bg-emerald-100",
      cardRing: "hover:ring-emerald-200",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white",
      gradient: "from-emerald-50 to-white",
    },
    detail: {
      headline: "지역 검색 상위 노출로 매장 방문 고객을 늘리세요",
      subhead: "내 업종·지역에서 어떤 키워드로 노출되는지 진단하고, 상위 노출 전략을 제안해 드립니다.",
      fromPrice: "25원",
      benefits: [
        "지역 키워드 상위 노출로 신규 방문 고객 증가",
        "리뷰·예약·문의 전환까지 이어지는 동선 설계",
        "경쟁 매장 대비 노출 위치 비교 진단 제공",
      ],
      steps: [
        { title: "1. 무료 진단 신청", desc: "매장 정보와 주요 지역 키워드를 입력하면 현재 노출 상태를 분석합니다." },
        { title: "2. 전략 리포트 수령", desc: "상위 노출을 위한 키워드·콘텐츠·운영 가이드를 받습니다." },
        { title: "3. 캠페인 진행", desc: "제안에 동의하면 광고를 집행하고 노출 변화를 추적합니다." },
      ],
      costRange: "월 15만 원 ~ 50만 원",
      costNote: "지역·업종·경쟁 강도에 따라 달라지며, 진단 후 정확한 범위를 안내합니다.",
      conditions: [
        "진단은 무료이며, 캠페인 집행 전 비용에 동의한 경우에만 과금됩니다.",
        "최소 운영 기간 및 해지 조건은 계약 시 명시됩니다.",
      ],
    },
  },
  shopping: {
    slug: "shopping",
    icon: "🛍️",
    name: "네이버 쇼핑 광고",
    summary: ["쇼핑 검색 상위에 상품을 노출해", "판매량을 빠르게 끌어올립니다."],
    cta: "쇼핑 광고 신청하기",
    accent: {
      chip: "bg-orange-50 text-orange-700",
      iconBg: "bg-orange-100",
      cardRing: "hover:ring-orange-200",
      button: "bg-orange-500 hover:bg-orange-600 text-white",
      gradient: "from-orange-50 to-white",
    },
    detail: {
      headline: "쇼핑 검색 상위 노출로 판매량을 극대화하세요",
      subhead: "전환이 잘 되는 키워드를 찾아 광고비 대비 매출(ROAS)을 끌어올립니다.",
      fromPrice: "30원",
      benefits: [
        "구매 의도가 높은 쇼핑 키워드 집중 공략",
        "광고비 대비 매출(ROAS) 기준의 운영 최적화",
        "상품별 노출·클릭·전환 리포트 제공",
      ],
      steps: [
        { title: "1. 상품·목표 입력", desc: "판매 상품과 목표 매출을 입력하면 적합한 키워드를 제안합니다." },
        { title: "2. 광고 세팅", desc: "키워드·입찰가·예산을 설정하고 캠페인을 준비합니다." },
        { title: "3. 운영·최적화", desc: "성과 데이터를 기반으로 입찰가와 키워드를 지속 조정합니다." },
      ],
      costRange: "월 30만 원 ~ 100만 원",
      costNote: "상품 수와 목표 매출에 따라 달라지며, 신청 후 맞춤 견적을 제공합니다.",
      conditions: [
        "광고비는 사용한 만큼 과금되며, 예산 상한을 직접 설정할 수 있습니다.",
        "운영 수수료 및 정산 주기는 신청 단계에서 안내됩니다.",
      ],
    },
  },
  blog: {
    slug: "blog",
    icon: "✍️",
    name: "네이버 블로그 광고",
    summary: ["블로그 콘텐츠를 상위에 노출해", "브랜드 신뢰도를 높입니다."],
    cta: "블로그 광고 시작하기",
    accent: {
      chip: "bg-sky-50 text-sky-700",
      iconBg: "bg-sky-100",
      cardRing: "hover:ring-sky-200",
      button: "bg-sky-600 hover:bg-sky-700 text-white",
      gradient: "from-sky-50 to-white",
    },
    detail: {
      headline: "블로그 상위 노출로 브랜드 신뢰도를 키우세요",
      subhead: "검색 사용자가 가장 먼저 보는 자리에 신뢰감 있는 콘텐츠를 노출합니다.",
      fromPrice: "1,000원",
      benefits: [
        "정보성 콘텐츠로 검색 신뢰도와 브랜드 인지도 강화",
        "리뷰·후기 자동화로 꾸준한 콘텐츠 발행",
        "키워드별 노출 순위 변화 모니터링",
      ],
      steps: [
        { title: "1. 키워드·톤 협의", desc: "노출하고 싶은 키워드와 브랜드 톤을 정합니다." },
        { title: "2. 콘텐츠 발행", desc: "기획·작성·발행을 진행하고 검색 노출을 준비합니다." },
        { title: "3. 순위 관리", desc: "노출 순위를 모니터링하며 콘텐츠를 보완합니다." },
      ],
      costRange: "건당 10만 원 ~ / 월 패키지 40만 원 ~",
      costNote: "콘텐츠 수량과 키워드 난이도에 따라 달라집니다.",
      conditions: [
        "콘텐츠 소유권과 발행 채널은 사전에 협의합니다.",
        "상위 노출은 검색 환경에 따라 변동될 수 있어 보장 조건을 별도 안내합니다.",
      ],
    },
  },
  press: {
    slug: "press",
    icon: "📰",
    name: "언론홍보",
    summary: ["원하는 매체를 골라 보도자료를 송출하고", "브랜드 신뢰도와 검색 노출을 높입니다."],
    cta: "언론보도 신청하기",
    accent: {
      chip: "bg-indigo-50 text-indigo-700",
      iconBg: "bg-indigo-100",
      cardRing: "hover:ring-indigo-200",
      button: "bg-indigo-600 hover:bg-indigo-700 text-white",
      gradient: "from-indigo-50 to-white",
    },
    detail: {
      headline: "원하는 매체를 골라 보도자료를 셀프 송출하세요",
      subhead: "업종별 매체를 직접 선택해 보도자료를 송출합니다. 가입비 무료, 1건부터, 평균 2~3시간 내 송출됩니다.",
      benefits: [
        "100개 이상 매체를 업종별로 직접 선택해 송출",
        "원고 대필·이미지 제작 옵션으로 자료가 없어도 진행",
        "기사 링크로 브랜드 신뢰도와 검색 노출 강화",
      ],
      steps: [
        { title: "1. 매체·업종 선택", desc: "원하는 업종 카테고리에서 송출할 매체를 직접 고릅니다." },
        { title: "2. 원고 준비·검수", desc: "원고를 등록하거나 대필을 신청하면 업종 가능 여부를 사전 검수합니다." },
        { title: "3. 송출·링크 전달", desc: "평균 2~3시간 내 선택 매체로 송출하고 기사 링크를 전달드립니다." },
      ],
      costRange: "1건 50,000원부터 (VAT 별도)",
      costNote: "업종·매체별 단가가 다르며, 옵션(원고 대필·이미지 제작)은 별도입니다.",
      conditions: [
        "접수 이후 기사 수정·변경·삭제가 불가할 수 있습니다.",
        "언론사 규정에 따라 제목·본문·이미지가 임의 편집될 수 있습니다.",
        "허위 자료 제공 시 민·형사상 책임은 의뢰 고객에게 있습니다.",
      ],
    },
  },
  experience: {
    slug: "experience",
    icon: "🎁",
    name: "체험단 모집",
    summary: ["체험단·기자단을 모집해 진짜 후기를 쌓고", "검색·SNS에서 우리 매장의 신뢰도를 높입니다."],
    cta: "체험단 신청하기",
    accent: {
      chip: "bg-rose-50 text-rose-700",
      iconBg: "bg-rose-100",
      cardRing: "hover:ring-rose-200",
      button: "bg-rose-500 hover:bg-rose-600 text-white",
      gradient: "from-rose-50 to-white",
    },
    detail: {
      headline: "진짜 후기로 신뢰도를 쌓는 체험단 모집",
      subhead: "업종·지역에 맞는 체험단·기자단을 모집해 블로그·인스타·플레이스에 자연스러운 후기를 쌓습니다.",
      fromPrice: "건별 견적",
      benefits: [
        "업종·타깃에 맞는 체험단·기자단 매칭",
        "블로그·인스타·플레이스 후기로 검색 신뢰도 강화",
        "모집·선정·발행까지 진행 상황 관리",
      ],
      steps: [
        { title: "1. 캠페인 설계", desc: "체험 상품·모집 인원·채널과 후기 가이드를 함께 정합니다." },
        { title: "2. 모집·선정", desc: "조건에 맞는 체험단을 모집하고 적합한 인원을 선정합니다." },
        { title: "3. 후기 발행", desc: "가이드에 맞춘 후기가 채널에 발행되고 결과를 정리해 드립니다." },
      ],
      costRange: "캠페인 규모·채널·인원에 따라 견적",
      costNote: "모집 채널과 인원, 후기 형태에 따라 비용이 달라집니다. 신청 후 맞춤 견적을 드립니다.",
      conditions: [
        "체험 상품(또는 서비스) 제공이 필요합니다.",
        "후기 콘텐츠의 저작권·활용 범위는 사전에 협의합니다.",
      ],
    },
  },
  refund: {
    slug: "refund",
    icon: "💸",
    name: "광고비 환급",
    summary: ["네이버·카카오에 집행한 광고비의 일부를", "매월 환급받습니다."],
    cta: "광고비 환급 확인하기",
    accent: {
      chip: "bg-violet-50 text-violet-700",
      iconBg: "bg-violet-100",
      cardRing: "hover:ring-violet-200",
      button: "bg-violet-600 hover:bg-violet-700 text-white",
      gradient: "from-violet-50 to-white",
    },
    detail: {
      headline: "이미 쓴 광고비, 일부를 매월 환급받으세요",
      subhead: "네이버·카카오 광고 계정을 연결하면 환급 가능 금액을 자동으로 계산합니다.",
      benefits: [
        "집행 중인 광고비의 일부를 매월 환급",
        "별도 광고 변경 없이 기존 계정 그대로 적용",
        "예상 환급액을 가입 전 미리 확인 가능",
      ],
      steps: [
        { title: "1. 광고 계정 연결", desc: "네이버·카카오 광고 계정을 연결해 집행 내역을 확인합니다." },
        { title: "2. 환급액 계산", desc: "집행 금액을 기준으로 매월 예상 환급액을 산출합니다." },
        { title: "3. 정기 환급", desc: "정산 주기에 맞춰 환급금을 지급합니다." },
      ],
      costRange: "가입비 0원 (환급액의 일부를 수수료로 차감)",
      costNote: "환급이 발생한 경우에만 수수료가 발생하는 구조입니다.",
      conditions: [
        "환급률은 매체·집행 금액·시기에 따라 달라집니다.",
        "환급은 광고 계정 연동 및 본인 확인이 완료된 경우에만 지급됩니다.",
        "최소 환급 기준 금액 미만은 다음 정산으로 이월될 수 있습니다.",
      ],
    },
  },
  consulting: {
    slug: "consulting",
    icon: "🆘",
    name: "광고 컨설팅",
    summary: ["무엇부터 해야 할지 막막하신가요?", "전문가가 우리 매장에 맞는 전략을 짚어드립니다."],
    cta: "도와주세요!",
    accent: {
      chip: "bg-teal-50 text-teal-700",
      iconBg: "bg-teal-100",
      cardRing: "hover:ring-teal-200",
      button: "bg-teal-600 hover:bg-teal-700 text-white",
      gradient: "from-teal-50 to-white",
    },
    detail: {
      headline: "막막할 땐, 광고 컨설팅으로 시작하세요",
      subhead: "현재 상황을 진단하고 업종·예산·목표에 맞는 마케팅 우선순위와 실행 방법을 제안해 드립니다.",
      benefits: [
        "현재 노출·광고 상태 진단 및 문제점 정리",
        "업종·예산에 맞춘 우선순위와 실행 로드맵 제안",
        "직접 운영을 위한 1:1 가이드",
      ],
      steps: [
        { title: "1. 신청·상황 공유", desc: "업종, 현재 마케팅 상황과 목표를 간단히 알려주세요." },
        { title: "2. 진단·전략 제안", desc: "현황을 진단해 우리 매장에 맞는 전략과 우선순위를 제안합니다." },
        { title: "3. 실행 지원", desc: "직접 운영할 수 있도록 단계별 실행 방법을 안내합니다." },
      ],
      costRange: "상담 신청 무료",
      costNote: "상담은 무료이며, 실제 캠페인 집행 시에만 비용이 발생합니다.",
      conditions: [
        "상담 내용은 진단 목적이며, 성과를 보장하지 않습니다.",
        "구체적인 실행 비용은 제안 단계에서 안내됩니다.",
      ],
    },
  },
};

/** Ordered list for rendering the landing service cards. */
export const PRODUCT_LIST: Product[] = [
  PRODUCTS.place,
  PRODUCTS.shopping,
  PRODUCTS.blog,
  PRODUCTS.press,
  PRODUCTS.experience,
  PRODUCTS.refund,
  PRODUCTS.consulting,
];

export const PRODUCT_SLUGS: ProductSlug[] = [
  "place",
  "shopping",
  "blog",
  "press",
  "experience",
  "refund",
  "consulting",
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS[slug as ProductSlug];
}
