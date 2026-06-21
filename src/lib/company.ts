// Business / legal information shown in the footer.
// Sourced from the business registration certificate (사업자등록증).
// Note: serviceName is the marketing brand; companyName is the registered 상호.

export const COMPANY = {
  serviceName: "마케팅방주", // 서비스(브랜드)명
  companyName: "노아마케팅랩", // 상호 (사업자등록증)
  ceo: "채희건", // 대표
  businessRegistrationNumber: "213-06-37425", // 사업자등록번호
  businessType: "전문, 과학 및 기술 서비스업", // 업태
  businessItem: "광고대행업", // 종목
  address: "인천광역시 강화군 선원면 시리미로225번길 21-8", // 사업장 소재지
  // TODO(backend): 실제 대표 이메일로 교체 (사업자등록증에는 미포함).
  email: "help@selfmarketing.example",
} as const;
