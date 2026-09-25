import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { InventoryTurnoverCalculator } from "@/components/calc/tools/InventoryTurnoverCalculator";

export const metadata = calcMetadata("inventory-turnover");

const FAQ: FaqItem[] = [
  { q: "매출이 아니라 매출원가를 넣어야 하나요?", a: "네. 재고는 원가로 기록하니까 비교 대상도 원가여야 해요. 판매가 기준 매출을 넣으면 마진만큼 회전율이 부풀려져요. 매출원가는 '기초 재고 + 기간 중 매입 − 기말 재고'로 구할 수 있어요." },
  { q: "회전율은 높을수록 좋은가요?", a: "대체로 높을수록 재고가 빨리 팔려 돈이 덜 묶여 있다는 뜻이에요. 다만 너무 높으면 재고가 자주 떨어져 품절이 날 수 있어요. 신선 식재료는 짧게, 공산품은 조금 길게 가져가는 식으로 업종에 맞는 기준을 잡으세요." },
  { q: "회전일수는 어떻게 계산되나요?", a: "기간 일수를 회전율로 나눈 값이에요. 월은 30일, 분기는 91일, 연간은 365일로 봐요. 회전일수가 10일이면 들여온 재고가 평균 열흘 만에 팔려 나간다는 뜻이에요." },
  { q: "기초나 기말 재고가 0원이면요?", a: "둘 중 하나만 0원이면 계산은 되지만 평균 재고가 작게 잡혀 회전율이 높게 나올 수 있어요. 둘 다 0원이면 나눌 수 없어 계산하지 않아요. 가능하면 매월 말 재고를 기록해 평균을 내 보세요." },
];

export default function Page() {
  return (
    <CalcShell slug="inventory-turnover" faq={FAQ}>
      <InventoryTurnoverCalculator />
    </CalcShell>
  );
}
