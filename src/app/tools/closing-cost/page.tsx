import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { ClosingCostCalculator } from "@/components/calc/tools/ClosingCostCalculator";

export const metadata = calcMetadata("closing-cost");

const FAQ: FaqItem[] = [
  { q: "보증금은 전액 돌려받을 수 있나요?", a: "계약서에 원상복구 의무가 있으면 철거·복구 비용과 밀린 임대료를 빼고 돌려받는 경우가 많아요. 이 계산기는 보증금을 회수에, 원상복구비·미납금을 지출에 따로 넣어 실제로 남는 돈을 보여 줘요." },
  { q: "권리금은 꼭 받을 수 있나요?", a: "권리금은 다음 임차인과 계약이 성사돼야 받을 수 있어서 보장되지 않아요. 확정되지 않았다면 0원으로 한 번, 예상 금액으로 한 번 계산해서 두 경우를 모두 확인해 보세요." },
  { q: "퇴직금은 어떤 직원에게 줘야 하나요?", a: "1년 이상 계속 일했고 4주 평균 주 15시간 이상 근무한 직원에게는 퇴직금을 지급해야 해요. 폐업해도 이 의무는 사라지지 않으니 남은 급여·연차수당과 함께 지출에 넣어 두세요." },
  { q: "폐업 후에도 내야 하는 세금이 있나요?", a: "폐업한 달의 다음 달 25일까지 부가세 확정신고를 해야 하고, 다음 해 5월에는 종합소득세 신고가 남아 있어요. 예상 세액을 미납금에 넣어 두면 부족액을 더 정확히 볼 수 있어요." },
];

export default function Page() {
  return (
    <CalcShell slug="closing-cost" faq={FAQ}>
      <ClosingCostCalculator />
    </CalcShell>
  );
}
