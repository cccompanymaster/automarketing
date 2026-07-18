// Product / service catalog. Result-oriented copy aimed at small business
// owners, online sellers, and store operators. All values are placeholder/
// dummy content for the landing + funnel; real pricing comes from backend.
// TODO(backend): replace cost ranges / refund rates with live data.

export type ProductSlug =
  | "place"
  | "shopping"
  | "blog"
  | "blogwrite"
  | "blog-neighbor"
  | "press"
  | "experience"
  | "instagram"
  | "youtube"
  | "kakaomap"
  | "cafe"
  | "ai-influencer"
  | "place-traffic"
  | "refund"
  | "consulting";

export interface ProductDetailStep {
  title: string;
  desc: string;
}

import type { BrandKey } from "@/components/BrandLogo";

export interface Product {
  slug: ProductSlug;
  /** Emoji used as a lightweight icon (fallback when no brand logo is set). */
  icon: string;
  /** Real channel logo to show instead of the emoji icon, when applicable. */
  brand?: BrandKey;
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
    /** Minimum "from" price shown at the top of the detail page (e.g. "30원"). */
    fromPrice?: string;
    benefits: string[];
    steps: ProductDetailStep[];
    /** Expected cost range, exposed BEFORE signup to reduce drop-off. */
    costRange: string;
    costNote: string;
    /** Refund / settlement conditions (used by the refund product). */
    conditions: string[];
    /** Materials the customer should prepare when ordering (자료 요청). */
    materials?: string[];
  };
}

export const PRODUCTS: Record<ProductSlug, Product> = {
  place: {
    slug: "place",
    icon: "📍",
    brand: "naver",
    name: "플레이스 1등 먹기",
    summary: ["지역 검색에서 우리 매장을 상위에 노출하고", "매장을 방문하는 고객 수를 늘립니다."],
    cta: "플레이스 진단 받기",
    accent: {
      chip: "bg-emerald-50 text-emerald-700",
      iconBg: "bg-emerald-100",
      cardRing: "hover:ring-emerald-200",
      button: "bg-emerald-700 hover:bg-emerald-800 text-white",
      gradient: "from-emerald-50 to-white",
    },
    detail: {
      headline: "지역 검색 상위 노출로 매장 방문 고객을 늘리세요",
      subhead: "내 업종·지역에서 어떤 키워드로 노출되는지 진단하고, 상위 노출 전략을 제안해 드립니다.",
      fromPrice: "30원",
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
    brand: "naver",
    name: "쇼핑 1등 먹기",
    summary: ["쇼핑 검색 상위에 상품을 노출해", "판매량을 빠르게 끌어올립니다."],
    cta: "쇼핑 광고 신청하기",
    accent: {
      chip: "bg-orange-50 text-orange-700",
      iconBg: "bg-orange-100",
      cardRing: "hover:ring-orange-200",
      button: "bg-orange-700 hover:bg-orange-800 text-white",
      gradient: "from-orange-50 to-white",
    },
    detail: {
      headline: "쇼핑 검색 상위 노출로 판매량을 극대화하세요",
      subhead: "전환이 잘 되는 키워드를 찾아 광고비 대비 매출(ROAS)을 끌어올립니다.",
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
    brand: "naver",
    name: "블로그 1페이지 점령",
    summary: ["블로그 콘텐츠를 상위에 노출해", "브랜드 신뢰도를 높입니다."],
    cta: "블로그 광고 시작하기",
    accent: {
      chip: "bg-sky-50 text-sky-700",
      iconBg: "bg-sky-100",
      cardRing: "hover:ring-sky-200",
      button: "bg-sky-700 hover:bg-sky-800 text-white",
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
  blogwrite: {
    slug: "blogwrite",
    icon: "🤖",
    name: "AI 원고 뚝딱 쓰기",
    summary: ["주제만 입력하면 제목·목차·원고까지", "AI가 자동으로 작성해 드립니다."],
    cta: "지금 작성하기",
    accent: {
      chip: "bg-cyan-50 text-cyan-700",
      iconBg: "bg-cyan-100",
      cardRing: "hover:ring-cyan-200",
      button: "bg-cyan-700 hover:bg-cyan-800 text-white",
      gradient: "from-cyan-50 to-white",
    },
    detail: {
      headline: "주제만 입력하면, AI가 블로그 원고를 완성해요",
      subhead: "제목·목차·본문까지 3단계로 자동 생성. 말투와 키워드만 정하면 발행용 원고가 뚝딱 나옵니다.",
      fromPrice: "1,000원",
      benefits: [
        "주제·키워드만 입력하면 제목·목차·본문 자동 생성",
        "말투(해요/합니다 등) 선택으로 톤 맞춤",
        "마크다운으로 바로 복사·수정·발행",
      ],
      steps: [
        { title: "1. 주제 설정", desc: "작성자·주제·키워드·말투를 입력합니다." },
        { title: "2. 아웃라인 구성", desc: "AI가 만든 목차를 확인하고 자유롭게 수정합니다." },
        { title: "3. 글쓰기 완료", desc: "완성된 원고를 복사하거나 다운로드합니다." },
      ],
      costRange: "1건 1,000원 (캐시 차감)",
      costNote: "원고 1건당 1,000캐시가 차감됩니다. 제목·목차 생성은 무료입니다.",
      conditions: [
        "생성 결과는 발행 전 검수·수정을 권장합니다.",
        "현재는 데모 모드이며, 실제 AI 연결 시 더 풍부한 원고가 생성됩니다.",
      ],
    },
  },
  "blog-neighbor": {
    slug: "blog-neighbor",
    icon: "👥",
    brand: "naver",
    name: "블로그 이웃 늘리기",
    summary: ["국내 실사용자 서로이웃·이웃을 늘려", "블로그 방문자와 콘텐츠 도달을 키웁니다."],
    cta: "이웃 관리 신청하기",
    accent: {
      chip: "bg-green-50 text-green-700",
      iconBg: "bg-green-100",
      cardRing: "hover:ring-green-200",
      button: "bg-green-700 hover:bg-green-800 text-white",
      gradient: "from-green-50 to-white",
    },
    detail: {
      headline: "서로이웃·이웃을 늘려 블로그 방문자를 키우세요",
      subhead: "국내 실사용자 기반으로 서로이웃 신청·이웃 추가를 진행해 블로그 노출과 방문자 수를 끌어올립니다. 계정 비밀번호 없이 블로그 주소만으로 시작합니다.",
      fromPrice: "20,000원",
      benefits: [
        "국내 실사용자 기반 서로이웃·이웃으로 자연스러운 방문자 유입",
        "계정 로그인 정보 없이 블로그 주소만으로 진행",
        "서로이웃 신청·이웃 추가 등 항목별 수량 선택",
      ],
      steps: [
        { title: "1. 항목·수량 선택", desc: "서로이웃 신청·이웃 추가 등 필요한 항목과 수량을 고릅니다." },
        { title: "2. 블로그 주소 전달", desc: "비밀번호 없이 블로그 주소와 주제·키워드 가이드를 전달합니다." },
        { title: "3. 분산 진행·확인", desc: "일별로 자연스럽게 분산 진행하고 이웃·방문자 변화를 확인합니다." },
      ],
      costRange: "서로이웃 추가 100명 2만 원~ / 이웃 추가 200명 3만 원~ (항목·수량별 책정)",
      costNote: "항목·수량·진행 속도에 따라 달라지며, 신청 후 정확한 견적을 안내합니다.",
      conditions: [
        "계정 비밀번호 등 로그인 정보는 요구하지 않습니다.",
        "작업 시작 전에는 전액 환불이 가능합니다.",
        "이웃 수락·방문 성과는 콘텐츠와 네이버 블로그 정책에 따라 달라질 수 있습니다.",
      ],
    },
  },
  press: {
    slug: "press",
    icon: "📰",
    name: "뉴스에 우리 가게 띄우기",
    summary: ["원하는 매체를 골라 보도자료를 송출하고", "브랜드 신뢰도와 검색 노출을 높입니다."],
    cta: "언론보도 신청하기",
    accent: {
      chip: "bg-indigo-50 text-indigo-700",
      iconBg: "bg-indigo-100",
      cardRing: "hover:ring-indigo-200",
      button: "bg-indigo-700 hover:bg-indigo-800 text-white",
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
    name: "후기 부자 만들기",
    summary: ["체험단·기자단을 모집해 진짜 후기를 쌓고", "검색·SNS에서 우리 매장의 신뢰도를 높입니다."],
    cta: "체험단 신청하기",
    accent: {
      chip: "bg-rose-50 text-rose-700",
      iconBg: "bg-rose-100",
      cardRing: "hover:ring-rose-200",
      button: "bg-rose-700 hover:bg-rose-800 text-white",
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
  instagram: {
    slug: "instagram",
    icon: "📸",
    brand: "instagram",
    name: "인스타 인기몰이",
    summary: ["국내 실사용자 기반 팔로워·좋아요·댓글로", "계정의 신뢰도와 첫인상을 끌어올립니다."],
    cta: "인스타 마케팅 신청하기",
    accent: {
      chip: "bg-pink-50 text-pink-700",
      iconBg: "bg-pink-100",
      cardRing: "hover:ring-pink-200",
      button: "bg-pink-700 hover:bg-pink-800 text-white",
      gradient: "from-pink-50 to-white",
    },
    detail: {
      headline: "국내 실사용자 반응으로 인스타 계정을 키우세요",
      subhead: "팔로워·좋아요·댓글·저장 등 필요한 항목만 골라 진행합니다. 계정 비밀번호 없이 안전하게 시작할 수 있습니다.",
      fromPrice: "5,000원",
      benefits: [
        "국내 실사용자 기반 팔로워·좋아요·댓글로 자연스러운 반응 형성",
        "계정 로그인 정보 없이 아이디·게시물 링크만으로 진행",
        "팔로워·게시물 반응·저장 등 항목별 수량 선택",
      ],
      steps: [
        { title: "1. 항목·수량 선택", desc: "팔로워·좋아요·댓글 등 필요한 항목과 수량을 고릅니다." },
        { title: "2. 계정·링크 전달", desc: "비밀번호 없이 아이디와 대상 게시물 링크만 전달합니다." },
        { title: "3. 작업 진행·확인", desc: "자연스러운 속도로 작업을 진행하고 결과를 확인합니다." },
      ],
      costRange: "팔로워 100명 1.5만 원~ / 게시물 좋아요 50건 5천 원~ (항목·수량별 책정)",
      costNote: "항목·수량·진행 속도에 따라 달라지며, 신청 후 정확한 견적을 안내합니다.",
      conditions: [
        "계정 비밀번호 등 로그인 정보는 요구하지 않습니다.",
        "작업 시작 전에는 전액 환불이 가능합니다.",
        "노출·반응 성과는 콘텐츠와 플랫폼 환경에 따라 달라질 수 있습니다.",
      ],
    },
  },
  youtube: {
    slug: "youtube",
    icon: "▶️",
    brand: "youtube",
    name: "유튜브 채널 키우기",
    summary: ["구독자·조회수·좋아요·재생시간을 채워", "채널 성장과 알고리즘 노출을 돕습니다."],
    cta: "유튜브 마케팅 신청하기",
    accent: {
      chip: "bg-red-50 text-red-700",
      iconBg: "bg-red-100",
      cardRing: "hover:ring-red-200",
      button: "bg-red-700 hover:bg-red-800 text-white",
      gradient: "from-red-50 to-white",
    },
    detail: {
      headline: "조회수·구독자·재생시간으로 채널 성장을 앞당기세요",
      subhead: "조회수·구독자·좋아요·재생시간 등 필요한 항목만 골라 진행합니다. 채널 권한 없이 영상 링크만으로 시작합니다.",
      fromPrice: "10,000원",
      benefits: [
        "국내 실사용자 기반 조회수·구독자·좋아요로 채널 활성화",
        "채널 로그인 권한 없이 채널·영상 링크만으로 진행",
        "조회수·구독자·재생시간 등 항목별 수량 선택",
      ],
      steps: [
        { title: "1. 항목·수량 선택", desc: "조회수·구독자·좋아요 등 필요한 항목과 수량을 고릅니다." },
        { title: "2. 채널·링크 전달", desc: "로그인 권한 없이 채널 주소와 대상 영상 링크만 전달합니다." },
        { title: "3. 작업 진행·확인", desc: "자연스러운 속도로 작업을 진행하고 결과를 확인합니다." },
      ],
      costRange: "조회수 1,000회 1만 원~ / 구독자 200명 6만 원~ (항목·수량별 책정)",
      costNote: "항목·수량·진행 속도에 따라 달라지며, 신청 후 정확한 견적을 안내합니다.",
      conditions: [
        "채널 로그인 권한 등 계정 정보는 요구하지 않습니다.",
        "작업 시작 전에는 전액 환불이 가능합니다.",
        "노출·반응 성과는 콘텐츠와 플랫폼 환경에 따라 달라질 수 있습니다.",
      ],
    },
  },
  kakaomap: {
    slug: "kakaomap",
    icon: "🗺️",
    brand: "kakao",
    name: "카카오맵 평판 굳히기",
    summary: ["카카오맵 리뷰·후기·트래픽을 채워", "검색 노출과 매장 신뢰도를 높입니다."],
    cta: "카카오맵 마케팅 신청하기",
    accent: {
      chip: "bg-yellow-50 text-yellow-700",
      iconBg: "bg-yellow-100",
      cardRing: "hover:ring-yellow-200",
      button: "bg-yellow-400 hover:bg-yellow-300 text-slate-900",
      gradient: "from-yellow-50 to-white",
    },
    detail: {
      headline: "카카오맵 리뷰·트래픽으로 매장 신뢰도를 높이세요",
      subhead: "별점 리뷰·내용 리뷰·리뷰 추천·트래픽·저장하기 등 필요한 항목만 골라 진행합니다. 국내 실사용자 기반으로 자연스럽게 쌓습니다.",
      fromPrice: "10,000원",
      benefits: [
        "별점·내용 리뷰와 리뷰 추천으로 매장 평판 강화",
        "트래픽·저장하기로 카카오맵 검색 노출 보조",
        "리뷰·트래픽·저장 등 항목별 수량 선택",
      ],
      steps: [
        { title: "1. 항목·수량 선택", desc: "리뷰·리뷰 추천·트래픽·저장하기 등 필요한 항목과 수량을 고릅니다." },
        { title: "2. 매장·키워드 전달", desc: "매장 정보와 리뷰 내용·검색 키워드 가이드를 전달합니다." },
        { title: "3. 작업 진행·확인", desc: "자연스러운 속도로 작업을 진행하고 결과를 확인합니다." },
      ],
      costRange: "별점 리뷰 10건 1.8만 원~ / 내용 리뷰 30건 9만 원~ / 트래픽 1,000건 1만 원~ (항목·수량별 책정)",
      costNote: "리뷰 형태(별점·내용 지정), 트래픽 종류(일반·경유·검색), 수량에 따라 달라집니다. 신청 후 정확한 견적을 안내합니다.",
      conditions: [
        "리뷰 내용은 사전에 협의하며, 허위·과장 표현은 진행하지 않습니다.",
        "작업 시작 전에는 전액 환불이 가능합니다.",
        "노출·순위 성과는 카카오맵 정책과 검색 환경에 따라 달라질 수 있습니다.",
      ],
    },
  },
  cafe: {
    slug: "cafe",
    icon: "💬",
    brand: "naver",
    name: "카페 입소문 내기",
    summary: ["지역 맘카페·커뮤니티 카페에", "자연스러운 후기 글로 입소문을 만듭니다."],
    cta: "카페 홍보 신청하기",
    accent: {
      chip: "bg-amber-50 text-amber-700",
      iconBg: "bg-amber-100",
      cardRing: "hover:ring-amber-200",
      button: "bg-amber-700 hover:bg-amber-800 text-white",
      gradient: "from-amber-50 to-white",
    },
    detail: {
      headline: "지역 카페·맘카페에서 입소문을 만들어 드려요",
      subhead: "실제 활동 중인 계정으로 지역 맘카페·커뮤니티 카페에 후기·질문형 게시글을 자연스럽게 올려 우리 매장을 알립니다. 계정 정보 없이 매장 정보만으로 시작해요.",
      fromPrice: "2,000원",
      benefits: [
        "지역 맘카페·대형 커뮤니티 카페 침투 홍보로 동네 입소문 형성",
        "실사용 계정 기반 후기·질문형 게시글이라 광고 티가 나지 않음",
        "게시글·댓글·조회수 등 항목별 수량 선택, 게시 URL 보고",
      ],
      steps: [
        { title: "1. 카페·항목 선택", desc: "홍보할 지역·카페 성격과 게시글·댓글 수량을 고릅니다." },
        { title: "2. 매장 정보 전달", desc: "매장 소개와 강조 포인트, 금지 표현 가이드를 전달합니다." },
        { title: "3. 게시·보고 확인", desc: "자연스러운 말투로 게시하고 게시글 URL로 결과를 보고합니다." },
      ],
      costRange: "게시글 1건 3만 원~ / 댓글 1건 2천 원 (카페 등급·항목별 책정)",
      costNote: "카페 회원수·등급 조건과 게시 난이도에 따라 달라지며, 신청 후 정확한 견적을 안내합니다.",
      conditions: [
        "계정 로그인 정보는 요구하지 않으며, 매장 정보만으로 진행합니다.",
        "카페 운영 규정에 따라 게시글이 이동·삭제될 수 있으며, 조기 삭제 시 재게시 또는 환불 처리합니다.",
        "의료·법률 등 일부 업종은 표현 제한이 있어 사전 협의가 필요합니다.",
      ],
    },
  },
  "ai-influencer": {
    slug: "ai-influencer",
    icon: "✨",
    name: "AI 인용 늘리고 인플루언서 되기",
    summary: ["ChatGPT·네이버 AI가 답할 때 우리 가게가", "인용되게 만들고, 사장님을 전문가로 키웁니다."],
    cta: "AI 인용 진단 받기",
    accent: {
      chip: "bg-fuchsia-50 text-fuchsia-700",
      iconBg: "bg-fuchsia-100",
      cardRing: "hover:ring-fuchsia-200",
      button: "bg-fuchsia-700 hover:bg-fuchsia-800 text-white",
      gradient: "from-fuchsia-50 to-white",
    },
    detail: {
      headline: "이제 손님은 AI한테 물어봐요 — 그 답에 우리 가게가 나오게 하세요",
      subhead: "‘동네 맛집 추천해줘’, ‘이 동네 네일샵 어디가 좋아?’ — ChatGPT·클로드·네이버 AI의 답변에 인용되도록 콘텐츠와 프로필을 최적화하고, 사장님을 그 분야의 인플루언서로 키워드립니다.",
      fromPrice: "30,000원",
      benefits: [
        "AI 검색(생성형 답변)에 인용되기 좋은 콘텐츠·프로필·FAQ 구조 세팅",
        "전문가 칼럼·인터뷰 콘텐츠로 ‘이 분야 = 우리 가게’ 포지셔닝",
        "주요 질문별 AI 인용 현황을 월 리포트로 확인",
      ],
      steps: [
        { title: "1. AI 인용 진단", desc: "우리 업종의 주요 질문에 지금 AI가 누구를 인용하는지 확인합니다." },
        { title: "2. 콘텐츠·프로필 세팅", desc: "인용되기 좋은 구조로 FAQ·칼럼·프로필을 정비하고 발행합니다." },
        { title: "3. 모니터링·확장", desc: "월 리포트로 인용 변화를 확인하고 인플루언서 콘텐츠로 확장합니다." },
      ],
      costRange: "AEO 기본 세팅 15만 원 / 월 인용 리포트 3만 원 / 전문가 칼럼 1건 5만 원",
      costNote: "업종·경쟁 강도·콘텐츠 수량에 따라 달라지며, 진단 후 정확한 견적을 안내합니다.",
      conditions: [
        "AI 모델의 답변 채택은 각 서비스의 알고리즘에 따라 달라 특정 노출을 보장하지 않습니다.",
        "인용 가능성을 높이는 구조·콘텐츠 정비와 측정 리포트를 제공하는 상품입니다.",
        "허위 정보·과장 표현 콘텐츠는 제작하지 않습니다.",
      ],
      materials: [
        "운영 중인 네이버 블로그 주소 (있는 경우)",
        "매장/브랜드 소개와 대표 강점 3줄",
        "사장님 프로필 사진·경력·전문 분야",
        "손님들이 자주 묻는 질문 목록 (아는 만큼)",
        "홈페이지·SNS 등 기존 채널 링크",
      ],
    },
  },
  "place-traffic": {
    slug: "place-traffic",
    icon: "🚦",
    name: "플레이스 리워드 트래픽",
    summary: ["리워드 기반 저장·트래픽으로", "플레이스·지도 상위 노출을 최적화합니다."],
    cta: "리워드 트래픽 신청하기",
    accent: {
      chip: "bg-lime-50 text-lime-700",
      iconBg: "bg-lime-100",
      cardRing: "hover:ring-lime-200",
      button: "bg-lime-700 hover:bg-lime-800 text-white",
      gradient: "from-lime-50 to-white",
    },
    detail: {
      headline: "리워드 트래픽으로 플레이스 상위 노출을 최적화하세요",
      subhead: "실사용자에게 리워드를 제공해 저장하기·플레이스 트래픽을 자연스럽게 발생시킵니다. 네이버·카카오맵·구글맵까지 채널을 골라 진행합니다.",
      fromPrice: "30원",
      benefits: [
        "리워드 기반 실사용자 저장하기·트래픽으로 노출 신호 강화",
        "네이버 플레이스·카카오맵·구글맵 채널별 선택 진행",
        "저장하기+트래픽 묶음 또는 단일 트래픽으로 수량 설계",
      ],
      steps: [
        { title: "1. 채널·수량 선택", desc: "노출할 지도 채널과 저장하기·트래픽 수량을 고릅니다." },
        { title: "2. 매장·키워드 전달", desc: "매장 정보와 검색 키워드를 전달해 작업 대상을 설정합니다." },
        { title: "3. 분산 진행·확인", desc: "일별로 자연스럽게 분산 진행하고 노출 변화를 확인합니다." },
      ],
      costRange: "일반 30원 / 고품질 50원 / 체류형 100원 (1타당, 수량 자유)",
      costNote: "채널(네이버·카카오맵·구글맵)과 수량, 분산 기간에 따라 달라집니다. 신청 후 정확한 견적을 안내합니다.",
      conditions: [
        "작업은 일별 수량으로 분산해 자연스럽게 진행됩니다.",
        "작업 시작 전에는 전액 환불이 가능합니다.",
        "노출·순위 성과는 각 지도 플랫폼 정책과 검색 환경에 따라 달라질 수 있습니다.",
      ],
    },
  },
  refund: {
    slug: "refund",
    icon: "💸",
    name: "광고비 줍줍 환급",
    summary: ["네이버·카카오에 집행한 광고비의 일부를", "매월 환급받습니다."],
    cta: "광고비 환급 확인하기",
    accent: {
      chip: "bg-violet-50 text-violet-700",
      iconBg: "bg-violet-100",
      cardRing: "hover:ring-violet-200",
      button: "bg-violet-700 hover:bg-violet-800 text-white",
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
    name: "막막할 때 도와줘요",
    summary: ["무엇부터 해야 할지 막막하신가요?", "전문가가 우리 매장에 맞는 전략을 짚어드립니다."],
    cta: "도와주세요!",
    accent: {
      chip: "bg-teal-50 text-teal-700",
      iconBg: "bg-teal-100",
      cardRing: "hover:ring-teal-200",
      button: "bg-teal-700 hover:bg-teal-800 text-white",
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
  PRODUCTS.blogwrite,
  PRODUCTS["blog-neighbor"],
  PRODUCTS.press,
  PRODUCTS.experience,
  PRODUCTS.instagram,
  PRODUCTS.youtube,
  PRODUCTS.kakaomap,
  PRODUCTS.cafe,
  PRODUCTS["ai-influencer"],
  PRODUCTS["place-traffic"],
  PRODUCTS.refund,
  PRODUCTS.consulting,
];

export const PRODUCT_SLUGS: ProductSlug[] = [
  "place",
  "shopping",
  "blog",
  "blogwrite",
  "blog-neighbor",
  "press",
  "experience",
  "instagram",
  "youtube",
  "kakaomap",
  "cafe",
  "ai-influencer",
  "place-traffic",
  "refund",
  "consulting",
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS[slug as ProductSlug];
}

// --- Product groups (category cards) ---------------------------------------
// Similar products are grouped under one landing card. Clicking the card opens
// a category page where the members are split into tabs. Individual product
// pages still exist for deep links / SEO.

export interface ProductGroup {
  /** URL key for the category page (must not collide with a ProductSlug). */
  key: string;
  icon: string;
  name: string;
  summary: string[];
  cta: string;
  accent: Product["accent"];
  /** Member products shown as tabs, in order. */
  memberSlugs: ProductSlug[];
}

const GROUP_PLACE: ProductGroup = {
  key: "place-map",
  icon: "📍",
  name: "플레이스·지도 상위노출",
  summary: ["네이버 플레이스·카카오맵에서 우리 매장을", "상위에 노출하고 방문 고객을 늘립니다."],
  cta: "플레이스 진단 받기",
  accent: PRODUCTS.place.accent,
  memberSlugs: ["place", "place-traffic", "kakaomap"],
};

const GROUP_BLOG: ProductGroup = {
  key: "blog-pack",
  icon: "✍️",
  name: "블로그 마케팅",
  summary: ["상위 노출부터 이웃 관리, AI 인용까지", "블로그 신뢰도를 한 번에 키웁니다."],
  cta: "블로그 마케팅 보기",
  accent: PRODUCTS.blog.accent,
  memberSlugs: ["blog", "blog-neighbor", "ai-influencer"],
};

export const PRODUCT_GROUPS: ProductGroup[] = [GROUP_PLACE, GROUP_BLOG];

export const GROUP_KEYS: string[] = PRODUCT_GROUPS.map((g) => g.key);

export function getGroup(key: string): ProductGroup | undefined {
  return PRODUCT_GROUPS.find((g) => g.key === key);
}

export function groupMembers(group: ProductGroup): Product[] {
  return group.memberSlugs.map((s) => PRODUCTS[s]);
}

// --- Landing cards (groups + standalone products, in display order) ---------

export interface ServiceCardData {
  href: string;
  icon: string;
  brand?: BrandKey;
  name: string;
  summary: string[];
  cta: string;
  accent: Product["accent"];
  /** Value sent as product_slug with the cta_click event. */
  trackId: string;
}

function productCard(p: Product): ServiceCardData {
  return {
    href: `/services/${p.slug}`,
    icon: p.icon,
    brand: p.brand,
    name: p.name,
    summary: p.summary,
    cta: p.cta,
    accent: p.accent,
    trackId: p.slug,
  };
}

function groupCard(g: ProductGroup): ServiceCardData {
  return {
    href: `/services/${g.key}`,
    icon: g.icon,
    name: g.name,
    summary: g.summary,
    cta: g.cta,
    accent: g.accent,
    trackId: g.key,
  };
}

/** Ordered cards for the landing grid: 2 category groups + standalone products. */
export const LANDING_CARDS: ServiceCardData[] = [
  groupCard(GROUP_PLACE),
  groupCard(GROUP_BLOG),
  productCard(PRODUCTS.shopping),
  productCard(PRODUCTS.instagram),
  productCard(PRODUCTS.youtube),
  productCard(PRODUCTS.cafe),
  productCard(PRODUCTS.blogwrite),
  productCard(PRODUCTS.experience),
  productCard(PRODUCTS.press),
  productCard(PRODUCTS.refund),
  productCard(PRODUCTS.consulting),
];
