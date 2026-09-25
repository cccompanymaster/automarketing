import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { DeliveryCalculator } from "@/components/calc/tools/DeliveryCalculator";

export const metadata = calcMetadata("delivery");

const FAQ: FaqItem[] = [
  {
    q: "앱 매출 구간은 어디서 확인하나요?",
    a: "배민·쿠팡이츠는 직전 3개월 매출로 분기마다 구간을 다시 정하고, 사장님용 앱이나 정산 안내에 현재 구간을 알려 줘요. 구간 경계 금액은 공개되지 않으니 모르면 가운데 구간으로 먼저 보고, 정산서의 수수료율을 정밀 모드에 넣어 확인하세요.",
  },
  {
    q: "통장 입금액과 주문당 이익은 어떻게 달라요?",
    a: "통장 입금액은 앱이 수수료·배달비·수수료 부가세를 떼고 보내 주는 돈이에요. 주문당 이익은 거기서 다시 재료 원가, 포장비, 광고비를 주문 수로 나눈 금액, 가게배달이라면 대행료까지 뺀 실제로 남는 돈이에요.",
  },
  {
    q: "배민 가게배달은 왜 대행료를 꼭 넣어야 하나요?",
    a: "가게배달은 손님이 낸 배달팁이 사장님에게 들어오는 대신 배달대행 요금을 사장님이 직접 내요. 대행료를 비워 두면 0원으로 계산돼 실제보다 훨씬 좋아 보이니, 건당 대행료를 꼭 입력해 주세요.",
  },
  {
    q: "쿠팡이츠는 할인해도 수수료가 그대로인가요?",
    a: "쿠팡이츠는 할인 전 판매가를 기준으로 수수료를 매겨 온 것으로 알려져 있어요. 2025년 공정위 시정 명령 이후 바뀌었을 수 있어서, 정밀 모드에서 이 규칙을 켜고 끌 수 있게 했어요. 정산서의 수수료 기준액과 비교해 보세요.",
  },
  {
    q: "결과가 제 정산서와 조금 달라요.",
    a: "기본 수수료와 배달비는 공개 보도를 바탕으로 한 가정값이고, 배달비는 거리에 따라 구간 안에서 달라져요. 정밀 모드에서 앱별 중개·결제수수료율과 배달비를 정산서 값으로 바꾸면 거의 같아져요.",
  },
];

export default function Page() {
  return (
    <CalcShell slug="delivery" faq={FAQ}>
      <DeliveryCalculator />
    </CalcShell>
  );
}
