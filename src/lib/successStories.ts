// Success stories shown on the landing page. Trust is built with
// numbers + industry + before/after period, not photos or real names.
// TODO(backend): replace with verified, opt-in customer results.

export interface SuccessStory {
  industry: string;
  /** Short metric badges, e.g. "노출 +320%". */
  metrics: string[];
  period: string;
  /** Pain point quoted BEFORE adoption. */
  before: string;
  /** Result quoted AFTER adoption. */
  after: string;
}

export const SUCCESS_STORIES: SuccessStory[] = [
  {
    industry: "온라인 셀러 (생활용품)",
    metrics: ["노출 +320%", "월매출 +180%"],
    period: "도입 3개월",
    before: "광고를 어디서 어떻게 시작해야 할지 몰라 대행사에 맡겼지만 비용만 빠져나갔어요.",
    after: "쇼핑 광고를 직접 운영하니 어떤 키워드가 매출로 이어지는지 보여서 매출이 빠르게 올랐습니다.",
  },
  {
    industry: "동네 카페 (요식업)",
    metrics: ["플레이스 노출 1위", "신규 방문 +140%"],
    period: "도입 2개월",
    before: "주변에 카페가 많아 검색해도 우리 매장이 한참 아래에 있어 손님이 찾기 어려웠어요.",
    after: "지역 키워드 상위에 노출되면서 '검색하고 왔다'는 신규 손님이 눈에 띄게 늘었습니다.",
  },
  {
    industry: "뷰티 스튜디오 (서비스업)",
    metrics: ["블로그 상위 노출 12건", "예약 문의 +95%"],
    period: "도입 4개월",
    before: "후기 콘텐츠를 꾸준히 올릴 시간이 없어 브랜드 신뢰도를 쌓기 어려웠어요.",
    after: "리뷰 콘텐츠가 자동으로 발행되고 상위에 노출되면서 예약 문의가 두 배 가까이 늘었습니다.",
  },
  {
    industry: "소형 쇼핑몰 (패션)",
    metrics: ["광고비 환급 누적 240만 원", "수익률 +12%p"],
    period: "도입 6개월",
    before: "매달 나가는 광고비가 부담이었는데 돌려받을 방법이 있는지도 몰랐어요.",
    after: "기존 광고를 그대로 두고 계정만 연결했는데 매월 환급금이 들어와 실질 수익률이 올랐습니다.",
  },
];
