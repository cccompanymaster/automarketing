import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { WithholdingCalculator } from "@/components/calc/tools/WithholdingCalculator";
import { formatPercent, formatWon } from "@/lib/calc/num";
import { WITHHOLDING } from "@/lib/calc/rates";
import { dailyExemptCeiling } from "@/lib/calc/withholding";

const D = WITHHOLDING.value.daily;
const SMALL = formatWon(D.smallAmountThreshold);

export const metadata = calcMetadata("withholding");

const FAQ: FaqItem[] = [
  { q: "3.3%는 누가 떼서 언제 내나요?", a: "돈을 주는 사업자가 지급할 때 떼고, 다음 달 10일까지 홈택스로 원천세 신고·납부를 해요. 지급명세서도 따로 제출해야 하니 지급일과 금액을 꼭 기록해 두세요." },
  { q: "아르바이트생에게도 3.3%를 떼면 되나요?", a: "정해진 시간에 사장님 지시를 받아 일하는 아르바이트는 근로자라서 3.3%가 아니라 근로소득(또는 일용근로소득)으로 처리하는 게 원칙이에요. 3.3%로 처리해도 근로자 지위와 주휴수당·퇴직금 의무는 그대로예요." },
  { q: "일용직은 왜 세금이 거의 안 나오나요?", a: `일용근로소득은 하루 ${formatWon(D.deductionPerDay)}까지 공제되고, 남은 금액에 ${formatPercent(D.rate, 0)}를 곱한 뒤 그 세액의 ${formatPercent(D.taxCreditRatio, 0)}를 다시 빼줘요. 그래서 일당이 ${formatWon(dailyExemptCeiling())} 이하면 하루 세금이 ${SMALL}이 안 돼 떼지 않아요.` },
  { q: "적은 금액 프리랜서 비용도 세금을 떼야 하나요?", a: `네. 2024년 7월부터는 인적용역 사업소득에 소액부징수가 적용되지 않아서, 소득세가 ${SMALL} 미만이어도 원천징수해야 해요.` },
  { q: "일용직 근무일수는 어떻게 넣나요?", a: "같은 일당으로 일한 날수를 넣으세요. 날마다 일당이 다르면 일당별로 나눠 계산한 뒤 더하면 정확해요." },
];

export default function Page() {
  return (
    <CalcShell slug="withholding" faq={FAQ}>
      <WithholdingCalculator />
    </CalcShell>
  );
}
