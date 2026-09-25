import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { StartupRunwayCalculator } from "@/components/calc/tools/StartupRunwayCalculator";

export const metadata = calcMetadata("startup-runway");

const FAQ: FaqItem[] = [
  { q: "보증금은 왜 가용 현금에 들어가지 않나요?", a: "보증금은 계약이 끝나야 돌려받는 돈이라, 적자를 메우는 데 당장 쓸 수 없어요. 이미 낸 보증금은 보유 현금에 넣지 말고 따로 적으세요. 아직 안 냈다면 체크 박스를 켜서 보유 현금에서 빼고 계산할 수 있어요." },
  { q: "'현금이 줄지 않음'은 무슨 뜻인가요?", a: "다른 수입이 영업 적자·생활비·원금 상환을 모두 합친 금액 이상이라 매달 현금이 줄지 않는 상태예요. 오류가 아니라, 지금 구조라면 기한 없이 버틸 수 있다는 뜻이에요." },
  { q: "대출 이자는 어디에 넣나요?", a: "이자는 영업비용이므로 월 영업 적자 안에 포함해 계산하세요. 원금 상환은 비용은 아니지만 현금이 빠져나가는 돈이라 '월 대출 원금 상환'에 따로 넣어요." },
  { q: "몇 개월 정도 버틸 수 있어야 안전한가요?", a: "업종마다 다르지만 최소 6개월은 버틸 수 있게 준비하라는 조언이 많아요. 6개월보다 짧게 나오면 적자를 줄일 방법이나 추가 자금 계획을 먼저 세워 두는 게 좋아요." },
  { q: "개월 수는 어떻게 반올림하나요?", a: "버틸 수 있는 기간은 소수 첫째 자리에서 버림해 보여 드려요. 온전히 버틸 수 있는 개월 수와 그 뒤에 남는 돈도 함께 표시해서 실제 계획을 세우기 쉽게 했어요." },
];

export default function Page() {
  return (
    <CalcShell slug="startup-runway" faq={FAQ}>
      <StartupRunwayCalculator />
    </CalcShell>
  );
}
