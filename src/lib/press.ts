// Rich content for the 언론홍보 (press release distribution) product/detail.
// Reference values; per-media pricing & portal exposure vary and are confirmed
// at order time. TODO(backend): replace categories / media lists with live data.

export interface PressCategory {
  key: string;
  name: string;
  /** Number of available media outlets in this category. */
  mediaCount: number;
  priceMin: number;
  priceMax: number;
  /** Representative outlets (subset shown for reference). */
  samples: string[];
}

export interface PressOption {
  name: string;
  addKrw: number;
  desc: string;
}

export interface PressStep {
  no: string;
  title: string;
  desc: string;
}

export interface PressFaq {
  q: string;
  a: string;
}

/** Base distribution starting price (일반 카테고리 기준), VAT 별도. */
export const PRESS_BASE_FROM = 40_000;

/** Headline selling points shown as chips. */
export const PRESS_FEATURES = [
  "매체 직접 선택",
  "가입비 무료",
  "1건부터 신청",
  "평균 2~3시간 내 송출",
];

export const PRESS_CATEGORIES: PressCategory[] = [
  {
    key: "general",
    name: "일반",
    mediaCount: 100,
    priceMin: 40_000,
    priceMax: 350_000,
    samples: [
      "파이낸셜뉴스",
      "이데일리",
      "전자신문",
      "헤럴드경제",
      "국민일보",
      "서울신문",
      "한국일보",
      "동아일보",
      "중앙일보",
      "경향신문",
      "조선비즈",
      "한국경제",
    ],
  },
  {
    key: "startup",
    name: "창업",
    mediaCount: 20,
    priceMin: 80_000,
    priceMax: 350_000,
    samples: ["IT비즈뉴스", "잡포스트", "서울경제TV", "한국경제TV", "데일리안", "한국일보"],
  },
  {
    key: "realestate",
    name: "부동산",
    mediaCount: 38,
    priceMin: 80_000,
    priceMax: 400_000,
    samples: ["국토일보", "파이낸셜뉴스", "이데일리", "헤럴드경제", "조선비즈", "아시아경제", "땅집고"],
  },
  {
    key: "legal",
    name: "법률",
    mediaCount: 22,
    priceMin: 80_000,
    priceMax: 300_000,
    samples: [],
  },
  {
    key: "beauty",
    name: "뷰티헬스",
    mediaCount: 24,
    priceMin: 110_000,
    priceMax: 400_000,
    samples: [],
  },
  {
    key: "medical",
    name: "메디컬",
    mediaCount: 35,
    priceMin: 110_000,
    priceMax: 400_000,
    samples: ["메디컬투데이", "라포르시안", "청년의사", "중앙일보", "디지틀조선일보"],
  },
  {
    key: "healthfood",
    name: "건강식품",
    mediaCount: 18,
    priceMin: 110_000,
    priceMax: 300_000,
    samples: [],
  },
  {
    key: "blockchain",
    name: "블록체인",
    mediaCount: 9,
    priceMin: 250_000,
    priceMax: 500_000,
    samples: [],
  },
];

export const PRESS_OPTIONS: PressOption[] = [
  { name: "원고 대필", addKrw: 20_000, desc: "전문 작성자가 보도자료 원고를 대신 작성합니다." },
  { name: "이미지 제작", addKrw: 30_000, desc: "기사에 들어갈 대표 이미지를 제작합니다." },
  { name: "원고 대필 + 이미지 제작", addKrw: 50_000, desc: "원고와 이미지를 함께 제작합니다." },
];

export const PRESS_STEPS: PressStep[] = [
  { no: "1", title: "매체·업종 선택", desc: "원하는 업종 카테고리에서 송출할 매체를 직접 고릅니다." },
  { no: "2", title: "원고 준비·검수", desc: "원고를 등록하거나 대필을 신청하면 업종 가능 여부를 사전 검수합니다." },
  { no: "3", title: "송출·링크 전달", desc: "평균 2~3시간 내 선택 매체로 송출하고 기사 링크를 전달드립니다." },
];

export const PRESS_FAQS: PressFaq[] = [
  {
    q: "송출까지 얼마나 걸리나요?",
    a: "평균 2~3시간 내 송출됩니다. 매체 사정·접수 시간대에 따라 달라질 수 있습니다.",
  },
  {
    q: "가입비가 있나요? 최소 수량은요?",
    a: "가입비는 무료이며, 1건부터 신청할 수 있습니다.",
  },
  {
    q: "원고나 이미지가 없어도 되나요?",
    a: "원고 대필(+20,000원), 이미지 제작(+30,000원), 두 옵션 묶음(+50,000원)을 제공합니다.",
  },
  {
    q: "기사 수정·삭제가 가능한가요?",
    a: "접수 후에는 수정·변경·삭제가 불가할 수 있으며, 일부 매체는 수정·삭제 시 1회 송출 비용이 발생하거나 삭제가 불가합니다.",
  },
  {
    q: "어떤 포털에 노출되나요?",
    a: "매체별로 네이버·다음·네이트 노출 여부가 다릅니다. 신청 전 매체별 노출 포털을 확인해 주세요.",
  },
];

/** Must-show caveats before ordering. */
export const PRESS_WARNINGS: string[] = [
  "접수 이후 기사 수정·변경·삭제가 불가할 수 있습니다.",
  "언론사 내부 규정에 따라 제목·본문·이미지가 임의 편집될 수 있습니다.",
  "허위 자료 제공 시 민·형사상 법적 책임은 의뢰 고객에게 있습니다.",
  "송출 이후 포털·언론사 검열로 삭제·수정·클러스터링될 수 있으며, 이에 대한 책임을 지지 않습니다.",
  "일부 매체는 수정·삭제 시 1회 송출 비용 발생, 삭제 불가, 송출 후 수정 불가, 높은 편집 강도 등 제한이 있습니다.",
];
