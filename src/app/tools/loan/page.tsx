import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { LoanCalculator } from "@/components/calc/tools/LoanCalculator";

export const metadata = calcMetadata("loan");

const FAQ: FaqItem[] = [
  { q: "원리금균등과 원금균등은 무엇이 다른가요?", a: "원리금균등은 매달 내는 돈이 같아 자금 계획을 세우기 쉬워요. 원금균등은 원금을 똑같이 나눠 갚아서 초반 부담이 크지만, 원금이 빨리 줄어 총 이자는 더 적어요." },
  { q: "어느 방식이 더 유리한가요?", a: "총 이자만 보면 원금균등이 유리해요. 하지만 개업 초기처럼 현금 흐름이 빠듯할 때는 매달 금액이 일정한 원리금균등이 버티기 쉬울 수 있어요. 결과의 방식별 비교표에서 첫 달 상환액과 총 이자를 함께 보세요." },
  { q: "은행 상환표와 몇 원씩 다른 이유는 무엇인가요?", a: "이 계산기는 월 이율을 연 이율 ÷ 12로 쓰고 월 이자의 원 미만을 버려요. 금융회사는 실제 일수로 이자를 계산하거나 반올림 방식이 달라 소액 차이가 날 수 있어요. 마지막 회차에서 남은 원금을 모두 갚아 원금 합계는 정확히 맞춰요." },
  { q: "거치기간이 있는 대출도 계산되나요?", a: "지금은 첫 달부터 원금을 갚는 방식만 계산해요. 거치기간 동안은 이자만 내므로, 거치기간 이자는 '원금 × 연 이율 ÷ 12 × 거치 개월 수'로 따로 더해 보세요." },
];

export default function Page() {
  return (
    <CalcShell slug="loan" faq={FAQ}>
      <LoanCalculator />
    </CalcShell>
  );
}
