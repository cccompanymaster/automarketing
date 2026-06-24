// Rich content for the 광고비 환급 (ad-spend refund) detail page.
// TODO(backend): replace refund rate / examples / payout schedule with live data.

export interface RefundExample {
  media: string;
  monthly: string;
  rate: string;
  refund: string;
}

export interface RefundCheck {
  no: string;
  title: string;
  items: string[];
}

export interface RefundStep {
  no: string;
  title: string;
  desc: string;
}

export interface RefundFaq {
  q: string;
  a: string;
}

export const REFUND = {
  rate: "확인 중",
  payoutDay: "매월 20일",

  examples: [
    { media: "네이버 광고", monthly: "월 광고비 2,000,000원", rate: "환급율 10%", refund: "200,000원" },
    { media: "네이버 광고", monthly: "월 광고비 500,000원", rate: "환급율 10%", refund: "50,000원" },
    { media: "네이버 광고", monthly: "월 광고비 3,000,000원", rate: "환급율 10%", refund: "300,000원" },
  ] as RefundExample[],

  checks: [
    {
      no: "01",
      title: "환급 대상 상품 및 환급율",
      items: [
        "네이버·카카오·당근·구글·메타(페이스북)·틱톡·DV360 등 직접 운영 광고가 대상입니다.",
        "매체·상품별로 환급율이 다르며, 정확한 환급율은 확인 후 안내드립니다.",
        "대행사를 통해 집행 중인 광고는 계정 이관 후 환급이 적용됩니다.",
      ],
    },
    {
      no: "02",
      title: "환급액 지급일 및 적용 시점",
      items: [
        "매월 사용한 광고비를 기준으로 익월 20일에 환급액이 지급됩니다.",
        "계정 연동 및 이관 승인이 완료된 시점 이후의 집행분부터 적용됩니다.",
        "최소 환급 기준 금액 미만은 다음 정산으로 이월될 수 있습니다.",
      ],
    },
    {
      no: "03",
      title: "환급 계정 등록 후 달라지는 점",
      items: [
        "기존 광고 세팅과 성과 데이터는 그대로 유지됩니다.",
        "별도의 광고 변경 없이 환급 혜택만 추가됩니다.",
        "환급 정산 내역은 마이페이지에서 매월 확인할 수 있습니다.",
      ],
    },
  ] as RefundCheck[],

  steps: [
    {
      no: "01",
      title: "환급 받으실 광고계정의 매체사를 선택",
      desc: "네이버·카카오 등 환급받을 광고 매체를 선택합니다.",
    },
    {
      no: "02",
      title: "환급 받으실 광고계정 ID 조회 및 신청",
      desc: "광고계정 ID로 집행 내역을 조회한 뒤 환급을 신청합니다.",
    },
    {
      no: "03",
      title: "대행사 이관 신청을 승인하면 완료!",
      desc: "매체에서 이관 신청을 승인하면 환급 신청이 완료됩니다.",
    },
  ] as RefundStep[],

  faqs: [
    {
      q: "환급금은 언제 지급되나요?",
      a: "매월 20일에 전월 사용 광고비를 기준으로 환급액이 지급됩니다.",
    },
    {
      q: "플레이스 광고도 환급되나요?",
      a: "매체·상품별로 환급 여부와 환급율이 다릅니다. 신청 단계에서 정확한 대상과 환급율을 안내해 드립니다.",
    },
    {
      q: "환급 신청 시 기존 광고에 지장이 없나요?",
      a: "기존 광고 세팅과 성과는 그대로 유지되며, 광고 운영 방식은 바뀌지 않습니다. 환급 혜택만 추가됩니다.",
    },
    {
      q: "환급율은 어떻게 책정되나요?",
      a: "매체·집행 금액·시기에 따라 달라집니다. 현재 환급율을 확인 중이며, 확정되는 대로 안내드립니다.",
    },
  ] as RefundFaq[],
} as const;
