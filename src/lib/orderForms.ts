// Per-product order forms: what each product needs from the customer at
// order time (원고 가이드, 플레이스 URL, 키워드, 파일…). The answers are written
// into the order's request text in a fixed "[항목] 값" layout so the admin
// reads them as-is. Products without a form keep the free-text request box.
//
// Two kinds of answers never go into the request text:
// - "files": uploaded to the order-files bucket and attached to the order.
// - "secret": an account password, stored apart from the order (admin-only,
//   deleted when the order is done or canceled) and never saved in drafts.
// A radio field can carry an add-on price (`addOn`): choosing it orders the
// "<상품명> + <suffix>" catalog row, which the server prices on its own.

import { PRESS_CATEGORIES } from "@/lib/press";

export type FieldType = "text" | "textarea" | "url" | "radio" | "select" | "checkbox" | "files" | "secret";

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** radio / select / checkbox choices. For select, "그룹|값" puts the value under an optgroup. */
  options?: string[];
  /** Only shown (and validated) while another field has this value. */
  showIf?: { key: string; value: string };
  /** radio only: picking `when` adds `amountKrw` per unit and orders the "<name> + <suffix>" row. */
  addOn?: { when: string; amountKrw: number; suffix: string };
}

export interface OrderForm {
  /** Shown above the fields (작업 시간대, 계정 안내…). */
  notices?: string[];
  fields: FormField[];
  /** The free-text box under the form. */
  note?: { label?: string; placeholder?: string; required?: boolean; maxLength?: number };
}

export type FormValues = Record<string, string>;

/** An uploaded attachment (stored in `values[filesKey]` as JSON). */
export interface OrderFile {
  path: string;
  name: string;
  size: number;
}

/** Longest request text the server keeps. */
export const REQUEST_MAX = 4000;
/** Default length of the free-text box. */
export const NOTE_MAX = 1000;
export const FILES_MAX = 20;
export const FILE_MAX_BYTES = 20 * 1024 * 1024;

// --- Building blocks ------------------------------------------------------------

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

/** AEO: the business profile part of the guide (no posting direction / photos). */
const AEO_GUIDE = CONTENT_GUIDE.filter((f) => f.key !== "direction" && f.key !== "photos");

const PLACE_URL: FormField = {
  key: "placeUrl",
  label: "네이버 플레이스 URL",
  type: "url",
  required: true,
  placeholder: "https://naver.me/... 또는 https://map.naver.com/...",
};

const KEYWORDS: FormField = {
  key: "keywords",
  label: "희망 키워드",
  type: "text",
  required: true,
  placeholder: "예: 송도 맛집, 송도 삼겹살",
  hint: "여러 개면 쉼표로 나눠 주세요",
};

const CONTACT: FormField = { key: "phone", label: "연락처", type: "text", required: true, placeholder: "010-0000-0000" };

const COPY_FILES: FormField = {
  key: "files",
  label: "원고·사진 파일",
  type: "files",
  hint: "원고(한글·워드·PDF·텍스트)와 사진을 올려 주세요. 파일당 20MB, 최대 20개. 원고가 없으면 '블로그용 원고 작성'을 함께 주문해 주세요.",
};

const IMAGE_BRIEF =
  "참고할 수 있는 브랜드 링크나, 나타내고자 하는 이미지 관련 내용을 서술해주세요. 미기재 시, 원고 맥락에 맞는 생성형 이미지로 발행됩니다. ex) 세금 관련 언론 > 돈과 저울 관련 참고 이미지 등.";

const SNS_AUDIENCE: FormField = { key: "audience", label: "계정 타입", type: "select", required: true, options: ["한국인", "외국인"] };

// --- Forms -----------------------------------------------------------------------

const BLOG_DEPLOY: OrderForm = { fields: [KEYWORDS, COPY_FILES] };

const INFLUENCER_CATEGORY = "카테고리 지정 (1건 +20,000원)";
const INFLUENCER: OrderForm = {
  fields: [
    KEYWORDS,
    COPY_FILES,
    {
      key: "category",
      label: "인플루언서 카테고리",
      type: "radio",
      required: true,
      options: ["지정 안 함 (업종에 맞게 배정)", INFLUENCER_CATEGORY],
      addOn: { when: INFLUENCER_CATEGORY, amountKrw: 20_000, suffix: "카테고리 지정" },
    },
    {
      key: "categoryName",
      label: "희망 카테고리",
      type: "text",
      required: true,
      placeholder: "예: 푸드, 뷰티, 리빙, 육아",
      showIf: { key: "category", value: INFLUENCER_CATEGORY },
    },
  ],
};

const TOP_GUARANTEE: OrderForm = {
  fields: [
    KEYWORDS,
    { key: "materials", label: "준비된 자료", type: "checkbox", options: ["원고 있어요", "사진 있어요"], hint: "없으면 체크하지 않아도 돼요. 담당자가 준비 방법을 안내해요." },
    CONTACT,
  ],
};

const PLACE_REWARD: OrderForm = { fields: [KEYWORDS, PLACE_URL] };

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
  note: { label: "요청사항·게시글 원고", placeholder: "준비한 원고가 있으면 여기에 붙여 넣어 주세요.", maxLength: 3000 },
};

const KAKAOMAP: OrderForm = {
  fields: [{ key: "kakaoUrl", label: "운영 중인 매장 카카오맵 링크", type: "url", required: true, placeholder: "https://place.map.kakao.com/..." }],
};

const DAANGN_PROFILE: FormField = { key: "bizProfile", label: "당근 비즈프로필 주소", type: "url", required: true, placeholder: "비즈프로필 공유 링크" };
const DAANGN_AD_ACCOUNT: FormField = { key: "adAccount", label: "당근 광고계정 보유 여부", type: "radio", required: true, options: ["있어요", "없어요"] };
const DAANGN_POST: FormField = { key: "newsUrl", label: "당근 소식글 주소", type: "url", required: true, placeholder: "소식글 공유 링크" };
const DAANGN_VIDEO: FormField[] = [
  { key: "videoSource", label: "영상 소스 보유 여부", type: "select", required: true, options: ["있어요 (주문 후 카카오톡으로 보낼게요)", "없어요 (촬영·제작 필요)"] },
  {
    key: "videoType",
    label: "영상 타입",
    type: "select",
    required: true,
    options: ["실사 촬영형", "캐릭터·애니메이션형", "텍스트·자막 기반", "사진 슬라이드형", "추천받을게요"],
  },
];
const DAANGN_MESSAGE = { label: "알리고 싶은 내용", placeholder: "알리고자 하는 내용을 간단하게 기재해주세요!", required: true };
const DAANGN_NOTICE = "비즈프로필이나 광고계정이 아직 없다면 '비즈프로필·광고계정 세팅' 상품으로 먼저 만들어 드릴 수 있어요.";

const DAANGN: OrderForm = { fields: [DAANGN_PROFILE, DAANGN_AD_ACCOUNT], notices: [DAANGN_NOTICE] };
const DAANGN_NEWS: OrderForm = { fields: [DAANGN_PROFILE, DAANGN_POST], notices: [DAANGN_NOTICE] };
const DAANGN_PROJECT: OrderForm = {
  notices: [DAANGN_NOTICE],
  fields: [DAANGN_PROFILE, DAANGN_AD_ACCOUNT, { ...DAANGN_POST, required: false, label: "당근 소식글 주소 (있으면)" }, ...DAANGN_VIDEO],
  note: DAANGN_MESSAGE,
};

/** 언론사 드롭다운: 카테고리별 매체 (단가는 매체마다 달라 확정 후 차액 안내). */
const PRESS_MEDIA: string[] = [
  "추천받을게요|담당자가 업종에 맞는 매체를 추천",
  ...PRESS_CATEGORIES.flatMap((c) => c.samples.map((m) => `${c.name}|${m}`)),
];

const PRODUCT_URL: FormField = { key: "productUrl", label: "제품 정보 URL", type: "url", required: true, placeholder: "판매 중인 상품 페이지 주소" };

const FORMS: Record<string, OrderForm> = {
  "블로그 실명 배포": BLOG_DEPLOY,
  "플레이스용 준최적 블로그 배포": BLOG_DEPLOY,
  "고품질 준최적 블로그 배포": BLOG_DEPLOY,
  "신로직 맞춤 블로그 배포": BLOG_DEPLOY,
  "블로그 최적 배포": BLOG_DEPLOY,
  "블로그 최적 배포 (병원·법률·금융)": BLOG_DEPLOY,
  "공식 인플루언서 블로그 배포 (준최적)": INFLUENCER,
  "공식 인플루언서 블로그 배포 (최적)": INFLUENCER,
  "블로그 상위노출 24시간 보장": TOP_GUARANTEE,
  "블로그 상위노출 25일 보장": TOP_GUARANTEE,
  "블로그용 원고 작성": { fields: CONTENT_GUIDE },
  "블로그 서로이웃 추가": {
    notices: [
      "작업은 10:00~22:00 사이에 진행돼요. 이 시간에 로그인 알림이 올 수 있어요.",
      "비밀번호는 주문 내용과 따로 보관해 관리자만 볼 수 있고, 작업이 끝나거나 취소되면 바로 지워져요. 작업이 끝나면 비밀번호를 꼭 바꿔 주세요.",
    ],
    fields: [
      { key: "naverId", label: "네이버 아이디", type: "text", required: true, placeholder: "네이버 로그인 아이디" },
      { key: "naverPw", label: "네이버 비밀번호", type: "secret", required: true },
    ],
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
  "플레이스 메타데이터 기반 SEO 전문 세팅": { fields: [PLACE_URL, KEYWORDS, ...CONTENT_GUIDE] },
  "C사 가구매": { fields: [PRODUCT_URL, CONTACT] },
  "C사 가구매 (택배대행 포함)": { fields: [PRODUCT_URL, CONTACT] },
  "카페 원고 작성 대행": { fields: CONTENT_GUIDE },
  "카페 배포형 게시글 발행": CAFE_POST,
  "카페 노출용 게시글 발행": CAFE_POST,
  "AI 검색 최적화(AEO) 기본 세팅": { fields: AEO_GUIDE },
  "AI 인용 모니터링 리포트": { fields: AEO_GUIDE },
  "인스타 게시물 좋아요": {
    fields: [{ key: "postUrl", label: "희망 게시글 주소", type: "url", required: true, placeholder: "https://www.instagram.com/p/..." }, SNS_AUDIENCE],
  },
  "인스타 팔로워": {
    fields: [{ key: "accountUrl", label: "희망 계정 주소", type: "url", required: true, placeholder: "https://www.instagram.com/아이디" }, SNS_AUDIENCE],
  },
  "유튜브 조회수": {
    fields: [{ key: "videoUrl", label: "희망 영상 링크", type: "url", required: true, placeholder: "https://youtu.be/..." }, SNS_AUDIENCE],
  },
  "유튜브 구독자": {
    fields: [{ key: "channelUrl", label: "희망 채널 링크", type: "url", required: true, placeholder: "https://www.youtube.com/@채널" }, SNS_AUDIENCE],
  },
  "트렌드랭킹 1~6위 보장 (일)": KAKAOMAP,
  "트렌드랭킹 1~6위 보장 (월)": KAKAOMAP,
  "카카오맵 트래픽": KAKAOMAP,
  "카카오맵 별점 리뷰": KAKAOMAP,
  "카카오맵 내용 리뷰": KAKAOMAP,
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
  "이미지 제작": { fields: [], note: { label: "이미지 요청사항", placeholder: IMAGE_BRIEF } },
  "원고 대필 + 이미지 제작": {
    fields: [...CONTENT_GUIDE, { key: "imageBrief", label: "이미지 요청사항 (선택)", type: "textarea", placeholder: IMAGE_BRIEF }],
  },
};

for (const name of ["비즈프로필 단골 추가", "비즈프로필 하트 찜", "비즈프로필 일반 후기", "비즈프로필 포토 후기"]) FORMS[name] = DAANGN;
FORMS["소식글 관심"] = DAANGN_NEWS;
FORMS["소식글 채팅 문의"] = DAANGN_NEWS;
FORMS["동네생활 게시글 (바이럴)"] = { fields: [DAANGN_PROFILE], notices: [DAANGN_NOTICE], note: DAANGN_MESSAGE };
FORMS["스토리(숏폼) 영상 제작"] = { fields: [DAANGN_PROFILE, ...DAANGN_VIDEO], notices: [DAANGN_NOTICE], note: DAANGN_MESSAGE };
for (const name of ["프로젝트 A (30일 관리)", "프로젝트 B (30일 관리)", "프로젝트 C (30일 관리)", "프로젝트 D (60일 관리)", "프로젝트 S (6개월 관리)"])
  FORMS[name] = DAANGN_PROJECT;

export function orderFormFor(itemName: string): OrderForm | undefined {
  if (FORMS[itemName]) return FORMS[itemName];
  // Press page: "보도자료 송출 (<카테고리>)" → that category's media list.
  const cat = PRESS_CATEGORIES.find((c) => itemName === `보도자료 송출 (${c.name})`);
  if (!cat) return undefined;
  const base = FORMS["보도자료 언론 송출 (일반)"];
  return {
    notices: base.notices,
    fields: base.fields.map((f) =>
      f.key === "media" ? { ...f, options: ["추천받을게요|담당자가 업종에 맞는 매체를 추천", ...cat.samples.map((m) => `${cat.name}|${m}`)] } : f,
    ),
  };
}

/** Item names that have a form (for the catalog consistency test). */
export const FORM_ITEM_NAMES = Object.keys(FORMS);

// --- Answers -----------------------------------------------------------------------

/** Fields currently shown (showIf satisfied). */
export function visibleFields(form: OrderForm, values: FormValues): FormField[] {
  return form.fields.filter((f) => !f.showIf || values[f.showIf.key] === f.showIf.value);
}

export function parseFiles(raw: string | undefined): OrderFile[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((f) => f && typeof f.path === "string") : [];
  } catch {
    return [];
  }
}

/** First missing / invalid required field, as a message; null when the form is complete. */
export function validateForm(form: OrderForm, values: FormValues, note = ""): string | null {
  for (const f of visibleFields(form, values)) {
    const v = f.type === "files" ? (parseFiles(values[f.key]).length ? "x" : "") : (values[f.key] ?? "").trim();
    if (f.required && !v) return f.type === "files" ? `'${f.label}'을(를) 올려 주세요.` : `'${f.label}'을(를) 입력해 주세요.`;
    if (v && f.type === "url" && !/^https?:\/\/\S+\.\S+/.test(v)) return `'${f.label}'은(는) https://로 시작하는 주소로 넣어 주세요.`;
  }
  if (form.note?.required && !note.trim()) return `'${form.note.label ?? "요청사항"}'을(를) 입력해 주세요.`;
  return null;
}

/** Select values are stored as "그룹|값"; show "값 (그룹)". */
function display(f: FormField, raw: string): string {
  const v = raw.trim();
  if (f.type === "files") {
    const files = parseFiles(raw);
    return files.length ? `${files.length}개 첨부 (${files.map((x) => x.name).join(", ")})` : "";
  }
  if (f.type !== "select" || !v.includes("|")) return v;
  const [group, value] = v.split("|");
  return `${value} (${group})`;
}

/** Order request text: "[항목] 값" lines, then the free-text note. Passwords never appear here. */
export function formatRequest(form: OrderForm | undefined, values: FormValues, note: string): string {
  const lines = (form ? visibleFields(form, values) : [])
    .filter((f) => f.type !== "secret")
    .map((f) => [f.label, display(f, values[f.key] ?? "")] as const)
    .filter(([, v]) => v)
    .map(([label, v]) => `[${label}] ${v}`);
  const extra = note.trim();
  const noteLabel = form?.note?.label ?? "추가 요청사항";
  return [...lines, ...(extra ? [lines.length ? `[${noteLabel}] ${extra}` : extra] : [])].join("\n");
}

/** Attachments chosen in the form. */
export function filesOf(form: OrderForm | undefined, values: FormValues): OrderFile[] {
  return (form ? visibleFields(form, values) : []).filter((f) => f.type === "files").flatMap((f) => parseFiles(values[f.key]));
}

/** The account password, if the form asks for one. */
export function secretOf(form: OrderForm | undefined, values: FormValues): string | null {
  const f = form?.fields.find((x) => x.type === "secret");
  const v = f ? (values[f.key] ?? "").trim() : "";
  return v || null;
}

/** Values safe to keep in a saved draft (no password). */
export function withoutSecrets(form: OrderForm | undefined, values: FormValues): FormValues {
  const secretKeys = new Set((form?.fields ?? []).filter((f) => f.type === "secret").map((f) => f.key));
  return Object.fromEntries(Object.entries(values).filter(([k]) => !secretKeys.has(k)));
}

/** Catalog row and unit price actually ordered, after add-on choices. */
export function orderVariant(itemName: string, unitKrw: number, form: OrderForm | undefined, values: FormValues): { name: string; unitKrw: number } {
  let name = itemName;
  let unit = unitKrw;
  for (const f of form ? visibleFields(form, values) : []) {
    if (f.addOn && values[f.key] === f.addOn.when) {
      name = `${name} + ${f.addOn.suffix}`;
      unit += f.addOn.amountKrw;
    }
  }
  return { name, unitKrw: unit };
}

/** Every add-on row the server must know: "<상품명> + <suffix>" at base + add-on. */
export function addOnRows(priceOf: (name: string) => number | undefined): { base: string; name: string; amountKrw: number }[] {
  return Object.entries(FORMS).flatMap(([base, form]) => {
    const price = priceOf(base);
    if (price == null) return [];
    return form.fields
      .filter((f) => f.addOn)
      .map((f) => ({ base, name: `${base} + ${f.addOn!.suffix}`, amountKrw: price + f.addOn!.amountKrw }));
  });
}
