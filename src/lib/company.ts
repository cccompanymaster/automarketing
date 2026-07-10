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
  // TODO(backend): 실제 대표 이메일로 교체 (사업자등록증에는 미포함).
  email: "help@selfmarketing.example",
} as const;
