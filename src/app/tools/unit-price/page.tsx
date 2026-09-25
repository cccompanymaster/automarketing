import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { UnitPriceCalculator } from "@/components/calc/tools/UnitPriceCalculator";

export const metadata = calcMetadata("unit-price");

const FAQ: FaqItem[] = [
  { q: "kg과 g, L와 ml처럼 단위가 다르면 비교할 수 있나요?", a: "네. 무게는 g, 부피는 ml로 자동 환산해 100g당(둘 다 kg이면 1kg당) 가격으로 비교해요. 다만 '개'와 'g'처럼 종류가 다른 단위는 한 개의 무게를 모르면 비교할 수 없어서 같은 종류로 맞춰 달라고 안내해요." },
  { q: "부가세 '포함·별도·면세'는 어떻게 고르나요?", a: "견적서나 상품 페이지에 'VAT 별도'라고 적혀 있으면 별도, 결제 금액 그대로가 가격이면 포함을 고르세요. 농산물·수산물 같은 가공하지 않은 식재료는 면세인 경우가 많아요." },
  { q: "매입세액 공제를 체크하면 무엇이 달라지나요?", a: "일반과세자는 사업용으로 산 물건의 부가세를 신고할 때 돌려받을 수 있어요. 체크하면 그 부가세를 뺀 '실질 단가'로 비교해요. 면세 상품은 돌려받을 부가세가 없어서 과세 상품보다 불리해질 수도 있어요." },
  { q: "불량·폐기율은 왜 넣나요?", a: "싸게 대량으로 샀는데 일부를 버리게 되면 실제로 쓰는 양의 단가는 올라가요. 폐기율 10%를 넣으면 쓸 수 있는 양을 90%로 보고 단가를 다시 계산해요." },
  { q: "월 사용량을 넣으면 무엇을 알 수 있나요?", a: "한 번 주문한 양이 몇 달 가는지와 한 달 기준 비용 차이를 보여드려요. 너무 오래 쓰는 양이면 유통기한·보관 공간 부담도 함께 살펴보세요." },
];

export default function Page() {
  return (
    <CalcShell slug="unit-price" faq={FAQ}>
      <UnitPriceCalculator />
    </CalcShell>
  );
}
