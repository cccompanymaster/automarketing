import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { DiscountCalculator } from "@/components/calc/tools/DiscountCalculator";

export const metadata = calcMetadata("discount");

const FAQ: FaqItem[] = [
  { q: "20% 할인하면 20% 더 팔면 되나요?", a: "대부분 훨씬 더 팔아야 해요. 할인액은 이익에서 그대로 빠지기 때문이에요. 정가 10,000원·원가 6,000원이면 개당 이익이 4,000원인데, 20% 할인하면 2,000원으로 반토막이 나서 같은 이익을 내려면 두 배를 팔아야 해요." },
  { q: "'같은 이익을 위한 판매량'은 어떻게 계산하나요?", a: "할인 전에 팔던 수량(비워 두면 100개)으로 남기던 총이익을, 할인 후 개당 이익으로 나눈 뒤 올림한 값이에요. 예를 들어 '100개 → 150개'라면 할인 기간에 50% 더 팔아야 이전과 같은 돈이 남는다는 뜻이에요." },
  { q: "할인가가 원가보다 낮으면 어떻게 되나요?", a: "한 개 팔 때마다 손해라서 판매량을 아무리 늘려도 이전 이익을 되찾을 수 없어요. 이 경우 필요 판매량 대신 계산할 수 없다는 안내가 나와요. 미끼 상품이 아니라면 할인 폭을 줄이는 게 좋아요." },
  { q: "할인율로 계산한 할인가에 원 단위 소수가 나오면요?", a: "원 단위에서 반올림해 보여드리고, 할인액과 마진도 반올림한 할인가로 다시 계산해요. 실제 가격표에는 보통 10원이나 100원 단위로 맞추니 그에 맞게 조정해 보세요." },
];

export default function Page() {
  return (
    <CalcShell slug="discount" faq={FAQ}>
      <DiscountCalculator />
    </CalcShell>
  );
}
