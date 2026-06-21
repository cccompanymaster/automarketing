// Placeholder legal copy for Terms of Service & Privacy Policy.
// Shared by the standalone pages (/terms, /privacy) and the LegalModal.
// TODO(legal): replace with text reviewed by legal counsel.

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDocument {
  key: "terms" | "privacy";
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}

export const TERMS: LegalDocument = {
  key: "terms",
  title: "이용약관",
  updatedAt: "2026-06-01",
  sections: [
    {
      heading: "제1조 (목적)",
      body: [
        "본 약관은 마케팅방주(이하 '회사')가 제공하는 셀프 마케팅 플랫폼 및 관련 서비스(이하 '서비스')의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.",
      ],
    },
    {
      heading: "제2조 (정의)",
      body: [
        "'이용자'란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.",
        "'회원'이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 서비스를 지속적으로 이용할 수 있는 자를 말합니다.",
      ],
    },
    {
      heading: "제3조 (서비스의 제공)",
      body: [
        "회사는 플레이스 광고 진단, 쇼핑·블로그 광고 운영, 광고비 환급 등 마케팅 관련 기능을 제공합니다.",
        "서비스의 구체적인 내용·비용·진행 방식은 각 상품 상세 페이지 및 별도 안내를 따릅니다.",
      ],
    },
    {
      heading: "제4조 (이용자의 의무)",
      body: [
        "이용자는 관계 법령, 본 약관의 규정, 이용안내 등 회사가 통지하는 사항을 준수하여야 합니다.",
        "이용자는 타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.",
      ],
    },
    {
      heading: "제5조 (책임의 한계)",
      body: [
        "광고 노출 순위 및 성과는 외부 검색·광고 환경에 따라 변동될 수 있으며, 회사는 특정 성과를 보장하지 않습니다.",
        "본 문서는 예시용 초안이며, 실제 서비스 약관은 별도로 고지됩니다.",
      ],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  key: "privacy",
  title: "개인정보처리방침",
  updatedAt: "2026-06-01",
  sections: [
    {
      heading: "1. 수집하는 개인정보 항목",
      body: [
        "회원가입 및 서비스 제공을 위해 이메일, 비밀번호, 이름(선택), 사업자 정보 등을 수집할 수 있습니다.",
        "카카오 간편가입 이용 시 카카오로부터 제공받는 정보가 포함될 수 있습니다.",
      ],
    },
    {
      heading: "2. 개인정보의 이용 목적",
      body: [
        "회원 식별 및 서비스 제공, 광고 운영·환급 정산, 고객 문의 대응, 서비스 개선을 위해 이용합니다.",
      ],
    },
    {
      heading: "3. 개인정보의 보유 및 이용 기간",
      body: [
        "회원 탈퇴 시 또는 수집·이용 목적 달성 시 지체 없이 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.",
      ],
    },
    {
      heading: "4. 개인정보의 제3자 제공",
      body: [
        "회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않으며, 광고 매체 연동 등 서비스 제공에 필요한 경우 사전 동의를 받습니다.",
      ],
    },
    {
      heading: "5. 이용자의 권리",
      body: [
        "이용자는 언제든지 자신의 개인정보를 조회·수정하거나 삭제·처리정지를 요청할 수 있습니다.",
        "본 문서는 예시용 초안이며, 실제 처리방침은 별도로 고지됩니다.",
      ],
    },
  ],
};

export const LEGAL_DOCS = { terms: TERMS, privacy: PRIVACY } as const;
