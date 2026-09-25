import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { PriceIncreaseCalculator } from "@/components/calc/tools/PriceIncreaseCalculator";

export const metadata = calcMetadata("price-increase");

const FAQ: FaqItem[] = [
  { q: "'허용 가능한 판매량 감소율'이 무슨 뜻인가요?", a: "가격을 올린 뒤 판매량이 이만큼 줄어도 한 달 이익은 지금과 같다는 한계선이에요. 예를 들어 20%라면 1,000개 팔던 게 800개로 줄어도 손해가 아니에요. 실제 감소가 이보다 작으면 인상이 이득이에요." },
  { q: "가격을 올렸는데 왜 더 팔아야 한다고 나오나요?", a: "재료비가 인상폭보다 더 올랐거나, 수수료가 판매가에 비례해 함께 늘었거나, 새로 늘어난 고정비가 있으면 개당 이익이 줄거나 추가 비용을 메워야 해요. 이럴 땐 인상폭을 다시 잡아 보세요." },
  { q: "배달앱 수수료는 어디에 넣나요?", a: "'수수료·추가 비용까지 넣어서 계산'을 켜고 판매가 비례 수수료(%)에 중개·결제 수수료를 합쳐 넣으세요. 건당 정액으로 내는 배달비 부담이나 포장재는 주문당 고정 비용에 넣으면 돼요." },
  { q: "실제로 판매량이 얼마나 줄지도 알려주나요?", a: "아니요. 손님 반응은 업종·상권·경쟁 가게마다 달라서 예측하지 않아요. 대신 '이 정도까지 줄어도 괜찮다'는 기준을 알려드리니, 인상 후 몇 주간 판매량을 이 기준과 비교해 보세요." },
];

export default function Page() {
  return (
    <CalcShell slug="price-increase" faq={FAQ}>
      <PriceIncreaseCalculator />
    </CalcShell>
  );
}
