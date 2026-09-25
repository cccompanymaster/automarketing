import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { FixedCostCalculator } from "@/components/calc/tools/FixedCostCalculator";

export const metadata = calcMetadata("fixed-cost");

const FAQ: FaqItem[] = [
  { q: "대출 원금은 왜 따로 표시되나요?", a: "원금 상환은 통장에서 나가는 돈이지만 빚을 줄이는 것이라 비용은 아니에요. 그래서 '월 현금 유출'에는 넣고, 손익분기점·이익을 계산할 때 쓰는 '손익 기준 고정비'에서는 뺐어요. 이자는 비용이라 두 곳 모두 들어가요." },
  { q: "인건비는 고정비인가요, 변동비인가요?", a: "매달 정해진 월급을 주는 직원은 고정비로 보는 게 일반적이에요. 바쁜 날만 부르는 시간제 아르바이트처럼 매출에 따라 늘고 줄면 변동비에 가까워요." },
  { q: "전기·가스 요금처럼 달마다 다른 건 어떻게 넣나요?", a: "최근 3~6개월 평균을 넣으면 계절에 따른 차이를 줄일 수 있어요. 여름·겨울 냉난방비가 큰 업종이라면 가장 많이 나온 달 기준으로도 한번 계산해 보세요." },
  { q: "계산한 고정비는 어디에 활용하나요?", a: "손익 기준 고정비를 손익분기점 계산기나 매출 목표 계산기에 넣으면 한 달에 얼마를 팔아야 하는지 바로 알 수 있어요. 비중이 가장 큰 항목부터 줄이는 게 효과가 커요." },
];

export default function Page() {
  return (
    <CalcShell slug="fixed-cost" faq={FAQ}>
      <FixedCostCalculator />
    </CalcShell>
  );
}
