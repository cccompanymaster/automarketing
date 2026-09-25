import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { SalesTargetCalculator } from "@/components/calc/tools/SalesTargetCalculator";

export const metadata = calcMetadata("sales-target");

const FAQ: FaqItem[] = [
  { q: "목표 순이익은 세금을 뺀 금액인가요?", a: "아니요, 소득세를 내기 전 금액이에요. 세금을 내고 손에 쥐고 싶은 금액이 있다면 목표를 그보다 조금 넉넉하게 잡는 걸 추천해요." },
  { q: "손익분기점 계산기와 무엇이 다른가요?", a: "손익분기점은 '이익 0원'이 되는 매출이고, 이 계산기는 원하는 이익까지 더해서 필요한 매출을 구해요. 목표 이익을 0원으로 넣으면 손익분기 매출과 같아져요." },
  { q: "매출을 늘리는 것 말고 목표에 가까워지는 방법은요?", a: "변동비율을 낮추면 필요 매출이 크게 줄어요. 예를 들어 변동비율을 40%에서 35%로 낮추면 같은 목표에 필요한 매출이 약 8% 줄어요. 재료 발주처나 수수료 구조를 먼저 점검해 보세요." },
  { q: "객단가를 넣지 않아도 되나요?", a: "필요 매출은 객단가 없이도 계산돼요. 객단가를 넣으면 한 달·하루에 몇 건의 주문이 필요한지까지 알려드려요." },
];

export default function Page() {
  return (
    <CalcShell slug="sales-target" faq={FAQ}>
      <SalesTargetCalculator />
    </CalcShell>
  );
}
