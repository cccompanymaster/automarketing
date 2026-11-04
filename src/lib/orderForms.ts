// Per-product order forms: what each product needs from the customer at
// order time (원고 가이드, 플레이스 URL, 키워드…). The answers are written into
// the order's request text in a fixed "[항목] 값" layout so the admin reads
// them as-is. Products without a form keep the free-text request box.

import { PRESS_CATEGORIES } from "@/lib/press";

export type FieldType = "text" | "textarea" | "url" | "radio" | "select";

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** radio / select choices. For select, "그룹|값" puts the value under an optgroup. */
  options?: string[];
}

export interface OrderForm {
  /** Shown above the fields (작업 시간대, 계정 안내…). */
  notices?: string[];
  fields: FormField[];
}

export type FormValues = Record<string, string>;

/** 콘텐츠 가이드 (공란 형식) — 원고 작성·SEO 세팅·대필 공통. */
export const CONTENT_GUIDE: FormField[] = [
  { key: "bizName", label: "업체(서비스)명", type: "text", required: true, placeholder: "예: 송도 ○○식당" },
  { key: "address", label: "주소·위치 (선택)", type: "text", placeholder: "예: 인천 연수구 송도동 / 센트럴파크역 3번 출구 도보 5분" },
  { key: "hours", label: "영업시간", type: "text", placeholder: "예: 11:00~21:00, 매주 월요일 휴무" },
  { key: "contact", label: "연락처", type: "text", placeholder: "예: 032-000-0000" },
  { key: "links", label: "홈페이지·네이버 플레이스·SNS 링크", type: "textarea", placeholder: "한 줄에 하나씩 붙여 넣어 주세요" },
  { key: "mainItems", label: "대표 상품·서비스 (2~3가지)", type: "textarea", required: true, placeholder: "예: 숙성 삼겹살 / 된장찌개 정식 / 단체 룸" },
  { key: "event", label: "진행 중인 이벤트·혜택", type: "text", placeholder: "예: 리뷰 작성 시 음료 서비스" },
  { key: "strength", label: "강점·차별점", type: "textarea", required: true, placeholder: "예: 48시간 숙성, 아이 의자·놀이공간 완비" },
  { key: "target", label: "주요 고객층", type: "text", placeholder: "예: 30~40대 가족, 인근 직장인" },
  { key: "direction", label: "포스팅 방향 요청사항", type: "textarea", placeholder: "예: 가족 외식 후기 느낌으로, 가격 언급은 빼 주세요" },
  {
    key: "photos",
    label: "사진 자료",
    type: "radio",
    required: true,
    options: ["있어요 (주문 후 카카오톡으로 보낼게요)", "없어요"],
  },
];

const PLACE_URL: FormField = {
  key: "placeUrl",
  label: "네이버 플레이스 URL",
  type: "url",
  required: true,
  placeholder: "https://naver.me/... 또는 https://map.naver.com/...",
};

const DAANGN: OrderForm = {
  fields: [
    { key: "bizProfile", label: "당근 비즈프로필 주소", type: "url", required: true, placeholder: "비즈프로필 공유 링크" },
    { key: "adAccount", label: "당근 광고계정 보유 여부", type: "radio", required: true, options: ["있어요", "없어요"] },
  ],
  notices: ["비즈프로필이나 광고계정이 아직 없다면 '비즈프로필·광고계정 세팅' 상품으로 먼저 만들어 드릴 수 있어요."],
};

const PLACE_REWARD: OrderForm = {
  fields: [
    { key: "keywords", label: "희망 유입 키워드", type: "text", required: true, placeholder: "예: 송도 맛집, 송도 삼겹살", hint: "여러 개면 쉼표로 나눠 주세요" },
    PLACE_URL,
  ],
};

const CAFE_POST: OrderForm = {
  fields: [
    { key: "cafe", label: "희망 카페 카테고리 또는 카페명", type: "text", required: true, placeholder: "예: 인천 송도 지역 맘카페 / 육아 정보 카페" },
    {
      key: "copy",
      label: "게시글 원고",
      type: "radio",
      required: true,
      options: ["직접 준비했어요 (아래 요청사항에 붙여 넣기)", "원고 작성 대행도 함께 주문할게요"],
    },
  ],
};

/** 언론사 드롭다운: 카테고리별 매체 (단가는 매체마다 달라 확정 후 차액 안내). */
const PRESS_MEDIA: string[] = [
  "추천받을게요|담당자가 업종에 맞는 매체를 추천",
  ...PRESS_CATEGORIES.flatMap((c) => c.samples.map((m) => `${c.name}|${m}`)),
];

const FORMS: Record<string, OrderForm> = {
  "블로그용 원고 작성": { fields: CONTENT_GUIDE },
  "블로그 서로이웃 추가": {
    notices: [
      "작업은 10:00~22:00 사이에 진행돼요. 이 시간에 로그인 알림이 올 수 있어요.",
      "비밀번호는 주문 기록에 남지 않도록 주문 후 카카오톡 1:1 상담으로 전달해 주세요. 작업이 끝나면 비밀번호를 꼭 바꿔 주세요.",
    ],
    fields: [{ key: "naverId", label: "네이버 아이디", type: "text", required: true, placeholder: "비밀번호는 적지 마세요" }],
  },
  "블로그 이웃 추가": {
    notices: ["작업은 10:00~22:00 사이에 일별로 나눠 진행돼요."],
    fields: [{ key: "blogUrl", label: "블로그 주소", type: "url", required: true, placeholder: "https://blog.naver.com/아이디" }],
  },
  "일반형 리워드": PLACE_REWARD,
  "압축형 미션 리워드": PLACE_REWARD,
  "고순도 체류형 트래픽": PLACE_REWARD,
  "플레이스 영수증 리뷰": {
    fields: [
      PLACE_URL,
      {
        key: "receipt",
        label: "매장에서 영수증을 직접 발행할 수 있나요?",
        type: "radio",
        required: true,
        options: ["가능해요", "불가능해요 (방법을 안내받을게요)"],
      },
    ],
  },
  "플레이스 메타데이터 기반 SEO 전문 세팅": { fields: [PLACE_URL, ...CONTENT_GUIDE] },
  "C사 가구매": {
    fields: [{ key: "productUrl", label: "제품 정보 URL", type: "url", required: true, placeholder: "판매 중인 상품 페이지 주소" }],
  },
  "C사 가구매 (택배대행 포함)": {
    fields: [{ key: "productUrl", label: "제품 정보 URL", type: "url", required: true, placeholder: "판매 중인 상품 페이지 주소" }],
  },
  "카페 원고 작성 대행": { fields: CONTENT_GUIDE },
  "카페 배포형 게시글 발행": CAFE_POST,
  "카페 노출용 게시글 발행": CAFE_POST,
  "보도자료 언론 송출 (일반)": {
    notices: ["매체마다 단가가 달라요. 일반 카테고리 최저 단가로 결제하고, 매체가 확정되면 차액을 따로 안내해요."],
    fields: [
      { key: "media", label: "송출 희망 언론사", type: "select", required: true, options: PRESS_MEDIA },
      {
        key: "copy",
        label: "보도자료 원고",
        type: "radio",
        required: true,
        options: ["직접 준비했어요 (주문 후 카카오톡으로 보낼게요)", "원고 대필도 함께 주문할게요"],
      },
    ],
  },
  "원고 대필": { fields: CONTENT_GUIDE },
  "원고 대필 + 이미지 제작": { fields: CONTENT_GUIDE },
};

const DAANGN_ITEMS = [
  "비즈프로필 단골 추가",
  "비즈프로필 하트 찜",
  "소식글 관심",
  "비즈프로필 일반 후기",
  "소식글 채팅 문의",
  "비즈프로필 포토 후기",
  "동네생활 게시글 (바이럴)",
  "스토리(숏폼) 영상 제작",
  "프로젝트 A (30일 관리)",
  "프로젝트 B (30일 관리)",
  "프로젝트 C (30일 관리)",
  "프로젝트 D (60일 관리)",
  "프로젝트 S (6개월 관리)",
];
for (const name of DAANGN_ITEMS) FORMS[name] = DAANGN;

export function orderFormFor(itemName: string): OrderForm | undefined {
  return FORMS[itemName];
}

/** Item names that have a form (for the catalog consistency test). */
export const FORM_ITEM_NAMES = Object.keys(FORMS);

/** First missing / invalid required field, as a message; null when the form is complete. */
export function validateForm(form: OrderForm, values: FormValues): string | null {
  for (const f of form.fields) {
    const v = (values[f.key] ?? "").trim();
    if (f.required && !v) return `'${f.label}'을(를) 입력해 주세요.`;
    if (v && f.type === "url" && !/^https?:\/\/\S+\.\S+/.test(v)) return `'${f.label}'은(는) https://로 시작하는 주소로 넣어 주세요.`;
  }
  return null;
}

/** Select values are stored as "그룹|값"; show "값 (그룹)". */
function display(f: FormField, raw: string): string {
  const v = raw.trim();
  if (f.type !== "select" || !v.includes("|")) return v;
  const [group, value] = v.split("|");
  return `${value} (${group})`;
}

/** Order request text: "[항목] 값" lines, then the free-text note. */
export function formatRequest(form: OrderForm | undefined, values: FormValues, note: string): string {
  const lines = (form?.fields ?? [])
    .map((f) => [f.label, display(f, values[f.key] ?? "")] as const)
    .filter(([, v]) => v)
    .map(([label, v]) => `[${label}] ${v}`);
  const extra = note.trim();
  return [...lines, ...(extra ? [lines.length ? `[추가 요청사항] ${extra}` : extra] : [])].join("\n");
}
