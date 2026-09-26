// Business / legal information shown in the footer.
// Sourced from the business registration certificate (사업자등록증).
// Note: serviceName is the marketing brand; companyName is the registered 상호.

export const COMPANY = {
  serviceName: "마케팅방주", // 서비스(브랜드)명
  companyName: "씨씨컴퍼니", // 상호 (사업자등록증)
  ceo: "채희준", // 대표
  businessRegistrationNumber: "275-05-01613", // 사업자등록번호
  businessType: "전문, 과학 및 기술서비스업, 소매업", // 업태
  businessItem: "광고 대행업, 통신판매업", // 종목
  address: "인천광역시 연수구 인천타워대로 301, A동 16층 33호(송도동, 송도센텀하이브)", // 사업장 소재지
  email: "cccompanymaster@gmail.com", // 대표 문의 이메일
  // 전자상거래법 제10조 표시 항목 — 비어 있으면 푸터에서 숨김.
  phone: "", // 대표 전화번호 (예: "010-0000-0000" 또는 "1600-0000")
  mailOrderNumber: "", // 통신판매업 신고번호 (예: "제2026-인천연수구-0000호")
  hostingProvider: "GitHub, Inc. (GitHub Pages)", // 호스팅 서비스 제공자
} as const;
