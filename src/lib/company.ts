// Business / legal information shown in the footer.
// Sourced from the business registration certificate (사업자등록증, 2026-02-11 발급),
// the 통신판매업 신고증 (2026-11-06 발급) and the business bank account copy.
// Note: serviceName is the marketing brand; companyName is the registered 상호.

export const COMPANY = {
  serviceName: "마케팅방주", // 서비스(브랜드)명
  companyName: "노아데이터베이스", // 상호 (사업자등록증)
  ceo: "채희준", // 대표
  businessRegistrationNumber: "224-73-00560", // 사업자등록번호 (일반과세자)
  businessType: "정보통신업", // 업태
  businessItem: "데이터베이스 및 온라인 정보 제공업", // 종목
  // 인천 서구는 2026년 서해구로 바뀌어 최신 서류(통신판매업 신고증) 표기를 따름.
  address: "인천광역시 서해구 청라한내로100번길 10, 4층 411,412-L044호(청라동, 청라 큐브시그니처 1차 오피스텔)", // 사업장 소재지
  addressLocality: "인천광역시 서해구",
  email: "cccompanymaster@gmail.com", // 대표 문의 이메일
  // 전자상거래법 제10조 표시 항목 — 비어 있으면 푸터에서 숨김.
  phone: "0507-1933-6482", // 대표 전화번호
  mailOrderNumber: "제2026-인천서해-1228호", // 통신판매업 신고번호
  hostingProvider: "GitHub, Inc. (GitHub Pages)", // 호스팅 서비스 제공자
  /**
   * Official channels. `sameAs: true` → listed in Organization JSON-LD
   * (canonical URLs only — no URL shorteners); all are shown in the footer.
   */
  channels: [
    { label: "네이버 블로그", url: "https://blog.naver.com/cccompanyad", sameAs: true },
    { label: "네이버 플레이스", url: "https://map.naver.com/p/entry/place/1845759313", sameAs: true },
    { label: "카카오톡 채널", url: "https://pf.kakao.com/_RjRSxj", sameAs: true },
  ],
  /** 1:1 상담 (카카오톡 채널 채팅). */
  kakaoChatUrl: "https://pf.kakao.com/_RjRSxj/chat",
  // 무통장입금 충전 계좌 — 반드시 사업용(사업자 명의) 계좌만 사용.
  bankAccount: {
    bank: "케이뱅크",
    number: "100-300-567838",
    holder: "채희준(노아데이터베이스)",
  },
} as const;
