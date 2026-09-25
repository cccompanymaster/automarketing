import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { HourlyWageCalculator } from "@/components/calc/tools/HourlyWageCalculator";
import { minimumMonthlyWage } from "@/lib/calc/payroll";

const MIN_MONTH = minimumMonthlyWage();

export const metadata = calcMetadata("hourly-wage");

const FAQ: FaqItem[] = [
  { q: "아르바이트생도 주휴수당을 줘야 하나요?", a: "네. 고용 형태와 상관없이 한 주에 일하기로 정한 시간이 15시간 이상이고 그 주의 근무일을 모두 나왔다면 주휴수당이 생겨요. 5인 미만 사업장도 똑같이 적용돼요." },
  { q: "주휴시간은 어떻게 정해지나요?", a: "주 40시간 근무자는 하루치인 8시간이에요. 그보다 짧게 일하면 비례해서 줄어요. 예를 들어 주 20시간이면 20 ÷ 40 × 8 = 4시간분을 받아요. 40시간을 넘게 일해도 주휴시간은 8시간이 최대예요." },
  { q: "한 주에 하루 결근하면 어떻게 되나요?", a: "그 주는 주휴수당이 생기지 않아요. 다만 이미 일한 시간의 임금은 그대로 줘야 하고, 다음 주에 개근하면 다시 주휴수당이 생겨요." },
  { q: `최저임금 월급 ${MIN_MONTH.amount.toLocaleString("ko-KR")}원과 결과가 조금 다른 이유는요?`, a: "정부 발표 금액은 월 209시간(주휴 포함)을 기준으로 해요. 이 계산기는 주급에 365 ÷ 7 ÷ 12 ≈ 4.345주를 곱해서 몇 천 원 차이가 날 수 있어요. 둘 다 흔히 쓰는 방식이에요." },
  { q: "하루 8시간을 넘게 일하면 어떻게 계산하나요?", a: "하루 8시간, 주 40시간을 넘는 부분은 연장근로예요. 상시 5인 이상 사업장이면 통상임금의 50%를 더 줘야 하는데, 이 계산기는 가산수당 없이 기본 시급으로만 계산해요." },
];

export default function Page() {
  return (
    <CalcShell slug="hourly-wage" faq={FAQ}>
      <HourlyWageCalculator />
    </CalcShell>
  );
}
