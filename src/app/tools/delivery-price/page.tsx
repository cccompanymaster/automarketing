import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { DeliveryPriceCalculator } from "@/components/calc/tools/DeliveryPriceCalculator";

export const metadata = calcMetadata("delivery-price");

const FAQ: FaqItem[] = [
  {
    q: "권장가와 최소 판매가는 뭐가 달라요?",
    a: "최소 판매가는 목표 이익을 딱 맞추는 가격을 원 단위로 올린 값이고, 권장가는 그걸 고른 단위(100·500·1,000원)로 한 번 더 올린 값이에요. 메뉴판에 쓰기 좋은 가격이면서 목표 이익은 항상 넘어요.",
  },
  {
    q: "배달 수익 계산기와 결과가 같나요?",
    a: "네. 두 계산기는 같은 계산 함수를 써요. 권장가 옆의 '수익 계산기에서 확인'을 누르면 같은 조건으로 열리고 예상 이익이 똑같이 나와요.",
  },
  {
    q: "배민 가게배달이 목록에서 빠졌어요.",
    a: "가게배달은 배달을 대행사에 맡기고 대행료를 사장님이 내요. 대행료를 모르면 가격을 추정할 수 없어서 비교에서 빼 두었어요. 건당 대행료를 넣으면 함께 계산돼요.",
  },
  {
    q: "앱마다 가격을 다르게 받아도 되나요?",
    a: "앱마다 수수료와 배달비 구조가 달라서 같은 이익을 남기려면 가격이 달라질 수밖에 없어요. 다만 앱별 입점 약관이나 최저가 조건이 있을 수 있으니 각 앱의 운영 정책을 먼저 확인하세요.",
  },
];

export default function Page() {
  return (
    <CalcShell slug="delivery-price" faq={FAQ}>
      <DeliveryPriceCalculator />
    </CalcShell>
  );
}
