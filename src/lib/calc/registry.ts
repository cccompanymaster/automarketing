// Catalog of the free calculators: hub listing, page titles, sitemap.

export type CalcCategory = "delivery" | "labor" | "profit" | "store";

export interface CalcEntry {
  slug: string;
  /** Site path (trailing slash matches next.config trailingSlash). */
  path: string;
  category: CalcCategory;
  icon: string;
  title: string;
  /** One-line description for the hub card and <meta description>. */
  summary: string;
}

export const CALC_CATEGORIES: { key: CalcCategory; title: string; description: string }[] = [
  { key: "delivery", title: "배달·가격", description: "배달앱 수수료, 판매가, 할인·쿠폰 손익" },
  { key: "labor", title: "인건비·노무", description: "시급·주휴수당, 4대보험, 급여명세서, 근로계약서" },
  { key: "profit", title: "매출·손익·세금", description: "손익분기점, 목표 매출, 고정비, 카드수수료, 부가세" },
  { key: "store", title: "임대·창업·자금", description: "임대료, 창업비용, 버틸 기간, 대출 이자, 폐업비용" },
];

export const CALCULATORS: CalcEntry[] = [
  // 배달·가격
  { slug: "delivery", path: "/delivery/", category: "delivery", icon: "🛵", title: "배달 수익 계산기", summary: "배달앱별 수수료·배달비를 빼고 한 건에 실제로 남는 돈을 비교해요." },
  { slug: "delivery-price", path: "/tools/delivery-price/", category: "delivery", icon: "🎯", title: "배달가격 역산기", summary: "원하는 주문당 이익을 남기려면 앱별로 얼마에 팔아야 하는지 거꾸로 계산해요." },
  { slug: "promotion", path: "/tools/promotion/", category: "delivery", icon: "🎟️", title: "쿠폰·리뷰이벤트 계산기", summary: "쿠폰과 리뷰 이벤트 비용을 메우려면 주문이 몇 건 더 필요한지 알려드려요." },
  { slug: "margin", path: "/tools/margin/", category: "delivery", icon: "📐", title: "마진 계산기", summary: "원가와 목표 마진율로 판매가를 정하거나, 지금 가격의 마진을 확인해요." },
  { slug: "discount", path: "/tools/discount/", category: "delivery", icon: "🏷️", title: "할인 계산기", summary: "할인가·할인율과 함께 할인 후 남는 마진, 더 팔아야 할 수량까지 계산해요." },
  { slug: "price-increase", path: "/tools/price-increase/", category: "delivery", icon: "📈", title: "가격 인상 손익 계산기", summary: "가격을 올렸을 때 판매량이 얼마나 줄어도 괜찮은지 계산해요." },
  { slug: "unit-price", path: "/tools/unit-price/", category: "delivery", icon: "⚖️", title: "단가 비교 계산기", summary: "배송비·부가세·폐기율까지 넣어 두 상품 중 어디가 더 싼지 비교해요." },
  // 인건비·노무
  { slug: "hourly-wage", path: "/tools/hourly-wage/", category: "labor", icon: "⏱️", title: "시급·주휴수당 계산기", summary: "시급과 근무시간으로 일급·주급·주휴수당·월 환산 급여를 계산해요." },
  { slug: "payroll", path: "/tools/payroll/", category: "labor", icon: "🧾", title: "4대보험 공제 계산기", summary: "월급에서 빠지는 4대보험과 사장님이 내는 보험료, 총 고용비용을 계산해요." },
  { slug: "labor-ratio", path: "/tools/labor-ratio/", category: "labor", icon: "👥", title: "인건비 비율 계산기", summary: "매출 대비 인건비 비중을 계산하고 부담 수준을 진단해요." },
  { slug: "payslip", path: "/tools/payslip/", category: "labor", icon: "📄", title: "급여명세서 만들기", summary: "근무시간과 수당·공제를 넣으면 급여명세서를 바로 만들어 이미지·PDF로 저장해요." },
  { slug: "labor-contract", path: "/tools/labor-contract/", category: "labor", icon: "✍️", title: "근로계약서 만들기", summary: "요일별 근무시간과 임금을 입력하면 표준 형식 근로계약서를 만들어 드려요." },
  { slug: "withholding", path: "/tools/withholding/", category: "labor", icon: "✂️", title: "원천세 계산기", summary: "프리랜서 3.3%, 일용직 원천징수 세금과 실지급액을 계산해요." },
  // 매출·손익·세금
  { slug: "breakeven", path: "/tools/breakeven/", category: "profit", icon: "⚖️", title: "손익분기점 계산기", summary: "고정비와 변동비율로 적자를 면하는 월 매출과 주문 수를 계산해요." },
  { slug: "sales-target", path: "/tools/sales-target/", category: "profit", icon: "🏁", title: "매출 목표 계산기", summary: "목표 순이익을 남기려면 매출과 주문이 얼마나 필요한지 계산해요." },
  { slug: "fixed-cost", path: "/tools/fixed-cost/", category: "profit", icon: "🧱", title: "월 고정비 계산기", summary: "매달 나가는 고정비를 합산하고 항목별 비중을 보여드려요." },
  { slug: "inventory-turnover", path: "/tools/inventory-turnover/", category: "profit", icon: "📦", title: "재고 회전율 계산기", summary: "재고가 몇 번 팔려 나가는지, 며칠 만에 소진되는지 계산해요." },
  { slug: "card-fee", path: "/tools/card-fee/", category: "profit", icon: "💳", title: "카드 수수료 계산기", summary: "매출 구간별 우대수수료로 신용·체크카드 수수료와 입금액을 계산해요." },
  { slug: "vat", path: "/tools/vat/", category: "profit", icon: "🧮", title: "부가세 계산기", summary: "합계금액과 공급가액·부가세를 서로 바꿔 계산해요." },
  // 임대·창업·자금
  { slug: "rent-ratio", path: "/tools/rent-ratio/", category: "store", icon: "🏠", title: "임대료 비율 계산기", summary: "매출 대비 임대료 비중을 계산하고 부담 수준을 진단해요." },
  { slug: "rent-per-pyeong", path: "/tools/rent-per-pyeong/", category: "store", icon: "📏", title: "평당 임대료 계산기", summary: "평·㎡를 바꿔 가며 평당·㎡당 임대료를 계산해요." },
  { slug: "affordable-rent", path: "/tools/affordable-rent/", category: "store", icon: "🔑", title: "적정 임대료 계산기", summary: "예상 매출로 감당할 수 있는 월세 수준을 계산해요." },
  { slug: "startup-cost", path: "/tools/startup-cost/", category: "store", icon: "🏗️", title: "창업비용 계산기", summary: "보증금·인테리어·운영자금까지 창업에 필요한 현금을 정리해요." },
  { slug: "startup-runway", path: "/tools/startup-runway/", category: "store", icon: "⏳", title: "창업 생존기간 계산기", summary: "지금 가진 돈으로 적자를 몇 달 버틸 수 있는지 계산해요." },
  { slug: "loan", path: "/tools/loan/", category: "store", icon: "🏦", title: "대출 이자 계산기", summary: "원리금균등·원금균등 방식별 월 상환액과 총 이자를 비교해요." },
  { slug: "closing-cost", path: "/tools/closing-cost/", category: "store", icon: "🚪", title: "폐업비용 계산기", summary: "폐업할 때 나갈 돈과 돌려받을 돈을 따져 최종 남는 금액을 계산해요." },
];

export function getCalc(slug: string): CalcEntry {
  const hit = CALCULATORS.find((c) => c.slug === slug);
  if (!hit) throw new Error(`Unknown calculator: ${slug}`);
  return hit;
}

export const CALC_HUB_PATH = "/tools/";
