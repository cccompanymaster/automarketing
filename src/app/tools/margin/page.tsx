import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { MarginCalculator } from "@/components/calc/tools/MarginCalculator";

export const metadata = calcMetadata("margin");

const FAQ: FaqItem[] = [
  { q: "마진율과 마크업률은 뭐가 다른가요?", a: "마진율은 판매가 중 이익의 비율이고, 마크업률은 원가에 얼마를 얹었는지의 비율이에요. 원가 7,000원 상품을 10,000원에 팔면 마진율은 30%, 마크업률은 약 42.9%예요." },
  { q: "원가에 30%를 더하면 마진 30%가 되지 않나요?", a: "아니에요. 원가 × 1.3은 마크업 30%로, 마진율은 약 23%에 그쳐요. 마진 30%를 원하면 원가 ÷ 0.7로 계산해야 해요." },
  { q: "목표 마진율에 100%를 넣으면 왜 안 되나요?", a: "마진율 100%는 원가가 0원이어야 가능해요. 공식의 분모(1 − 마진율)가 0이 되어 판매가를 정할 수 없어요." },
  { q: "필요 판매가는 왜 올림하나요?", a: "원 단위 아래를 버리면 실제 마진율이 목표보다 조금 낮아질 수 있어요. 올림하면 목표 마진율 이상이 보장돼요." },
];

export default function Page() {
  return (
    <CalcShell slug="margin" faq={FAQ}>
      <MarginCalculator />
    </CalcShell>
  );
}
