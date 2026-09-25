import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { PayrollCalculator } from "@/components/calc/tools/PayrollCalculator";

export const metadata = calcMetadata("payroll");

const FAQ: FaqItem[] = [
  { q: "여기 나온 금액이 실제 월급 통장에 들어오는 돈인가요?", a: "아니에요. 4대보험만 뺀 금액이고, 소득세와 지방소득세는 빠져 있어요. 세금은 부양가족 수 등에 따라 달라서 국세청 근로소득 간이세액표로 따로 확인해야 해요." },
  { q: "직원 한 명을 쓰면 월급 외에 얼마가 더 드나요?", a: "사업주도 국민연금·건강보험·장기요양·고용보험을 직원과 비슷하게 내고, 산재보험은 사업주만 내요. 업종과 규모에 따라 다르지만 보통 월급의 10% 안팎이 더 든다고 보면 돼요." },
  { q: "식대 같은 비과세 수당도 보험료가 붙나요?", a: "한도 안의 식대처럼 비과세로 인정되는 금액은 보험료 계산에서 빠져요. 비과세 금액 칸에 넣으면 보험료만 그만큼 줄어들어요." },
  { q: "주 15시간 미만 아르바이트도 4대보험에 가입해야 하나요?", a: "월 60시간(주 15시간) 미만 초단시간 근로자는 국민연금·건강보험 의무 가입 대상이 아니에요. 다만 산재보험은 근무시간과 관계없이 적용돼요. 가입 항목에서 해당 보험을 끄고 계산해 보세요." },
  { q: "공단 고지서 금액과 조금 달라요.", a: "공단은 전년도 보수총액으로 보험료를 정하고 연말에 정산해요. 또 실제 산재보험료율은 사업장의 세부 업종에 따라 달라서 몇십~몇백 원 차이가 날 수 있어요." },
];

export default function Page() {
  return (
    <CalcShell slug="payroll" faq={FAQ}>
      <PayrollCalculator />
    </CalcShell>
  );
}
