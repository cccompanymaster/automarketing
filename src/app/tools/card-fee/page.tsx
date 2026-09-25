import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { CardFeeCalculator } from "@/components/calc/tools/CardFeeCalculator";

export const metadata = calcMetadata("card-fee");

const FAQ: FaqItem[] = [
  { q: "우리 가게가 어느 구간인지 어떻게 아나요?", a: "여신금융협회가 매년 상·하반기에 전년도 카드 매출을 기준으로 영세·중소가맹점을 정해 우편·문자로 알려줘요. 여신금융협회 홈페이지의 가맹점 수수료율 조회에서도 확인할 수 있어요." },
  { q: "체크카드가 신용카드보다 수수료가 싼 이유는요?", a: "체크카드는 카드사가 결제 대금을 미리 빌려주지 않아 비용이 적게 들어요. 그래서 같은 구간이라도 체크카드 우대수수료율이 더 낮아요." },
  { q: "카드 수수료에도 부가세가 붙나요?", a: "아니요. 카드 수수료는 금융 서비스라 부가가치세가 면제돼요. 대신 부가세 신고 때 신용카드 매출세액공제를 받을 수 있는지 확인해 보세요." },
  { q: "개업한 지 얼마 안 됐는데 수수료가 높게 빠져요.", a: "신규 가맹점은 매출 자료가 없어 처음에는 일반 요율이 적용될 수 있어요. 이후 영세·중소가맹점으로 확인되면 그동안 더 낸 수수료를 돌려받을 수 있어요." },
];

export default function Page() {
  return (
    <CalcShell slug="card-fee" faq={FAQ}>
      <CardFeeCalculator />
    </CalcShell>
  );
}
