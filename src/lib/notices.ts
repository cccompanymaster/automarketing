// 공지사항 (site notices). Markdown bodies rendered at build time; newest first.
// A notice can attach the previous terms (약관 개정 공지는 현행 약관과 함께 게시).

export type NoticeCategory = "약관" | "서비스" | "이벤트";

export interface Notice {
  slug: string;
  title: string;
  category: NoticeCategory;
  /** Posting date (YYYY-MM-DD). */
  date: string;
  /** Pinned to the top of the list. */
  important?: boolean;
  /** Markdown. */
  body: string;
  /** Show the pre-revision terms in full under the notice. */
  attachPreviousTerms?: boolean;
}

export const NOTICE_PATH = "/notice/";

export const NOTICES: Notice[] = [
  {
    slug: "terms-revision-2026-11",
    title: "이용약관 개정 안내 (2026년 11월 6일 시행)",
    category: "약관",
    date: "2026-10-30",
    important: true,
    attachPreviousTerms: true,
    body: `마케팅방주를 이용해 주시는 사장님들께 감사드립니다.
이용약관이 아래와 같이 개정되어 시행 7일 전에 미리 알려 드립니다.

## 1. 시행일

개정 약관 시행일은 **2026년 11월 6일(금)** 입니다. 그 전까지는 현행 약관(2026년 9월 26일 시행)이 적용됩니다.

## 2. 개정 사유

- 회원가입·계정 관리, 회원의 의무 등 기본 조항을 보완하고 조항 순서를 정리했습니다.
- 캐시 충전 시 부가가치세 처리 기준을 명확히 했습니다.
- 분쟁 해결 절차와 관할 법원을 이용자에게 유리하게 정했습니다.

## 3. 주요 변경 내용

| 구분 | 현행 | 개정 |
|---|---|---|
| 약관 게시·개정 (제3조) | 정식 오픈에 맞춰 개정될 수 있음 | 적용일 7일 전 공지, 불리한 개정은 30일 전 공지 및 개별 통지 |
| 회원가입·계정 (제4조) | 규정 없음 | 가입 신청 방법, 카카오·네이버 소셜 가입, 가입 거절 사유 명시 |
| 회원의 의무 (제5조) | 허위 정보 등록 금지 | 정보 최신화 의무, 계정 관리 책임, 금지 행위 구체화 |
| 서비스 제공·변경 (제6조) | 광고 진단·운영·환급 기능 제공 | 제공 서비스 범위 정리, 점검 시 사전 공지 |
| **캐시 충전 (제7조)** | 1원당 1캐시로 충전 | **1캐시 = 1원(부가세 별도). 충전 시 받을 캐시에 부가세 10%를 더해 결제** (예: 100,000캐시 충전 → 110,000원 결제) |
| 캐시 환불 (제8조, 현행 제6조) | 7일 이내 청약철회, 이후 비용 공제 후 환불 | 내용 동일 + 현금 환불 시 결제한 부가세 포함 환불, 문의 창구에 카카오톡·전화 추가 |
| 주문 취소 (제9조, 현행 제7조) | 작업 전 전액, 작업 후 남은 금액 재적립 | 내용 동일 (조항 번호만 변경) |
| 회원탈퇴 (제10조) | 규정 없음 | 고객문의로 탈퇴, 남은 유상 캐시 환불, 위반 시 이용 제한 절차 |
| 손해배상·면책 (제11조) | 특정 성과 보장하지 않음 | 불가항력·이용자 귀책 면책, 상호 손해배상 책임 명시 |
| 분쟁·관할 (제12조) | 규정 없음 | 한국소비자원 등 조정 신청 가능, 이용자 주소지 관할 법원, 대한민국 법 적용 |

## 4. 꼭 확인해 주세요

- **이미 충전한 캐시는 그대로입니다.** 보유 캐시의 가치와 상품 단가는 바뀌지 않습니다.
- 부가세는 **11월 6일 이후 새로 충전하는 금액**에만 적용되며, 결제 전 충전 화면에 결제 금액·부가세·받는 캐시가 모두 표시됩니다.
- 충전 금액(부가세 포함) 기준으로 현금영수증 또는 세금계산서를 발행해 드립니다.

## 5. 동의하지 않으시는 경우

시행일 전까지 고객문의(카카오톡 채널·전화 0507-1933-6482·이메일)로 거부 의사를 알려 주시면 이용계약을 해지(탈퇴)할 수 있으며, 남은 유상 캐시는 약관에 따라 환불해 드립니다. 시행일 이후에도 서비스를 계속 이용하시면 개정 약관에 동의하신 것으로 봅니다.

## 6. 함께 바뀐 내용

[개인정보처리방침](/privacy/)과 마케팅 정보 수신 동의서에서 동의 철회 방법을 "고객문의(카카오톡 채널·전화·이메일)"로 정리했습니다(2026년 10월 30일).

개정 약관 전문은 [이용약관](/terms/)에서, 현행 약관 전문은 이 공지 아래에서 확인하실 수 있습니다.`,
  },
];

export function getNotice(slug: string): Notice | undefined {
  return NOTICES.find((n) => n.slug === slug);
}

/** Pinned first, then newest first. */
export function sortedNotices(): Notice[] {
  return [...NOTICES].sort((a, b) => Number(Boolean(b.important)) - Number(Boolean(a.important)) || b.date.localeCompare(a.date));
}
