import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { PromotionCalculator } from "@/components/calc/tools/PromotionCalculator";

export const metadata = calcMetadata("promotion");

const FAQ: FaqItem[] = [
  {
    q: "쿠폰 사용률은 어떻게 잡아야 하나요?",
    a: "지난 쿠폰 이벤트 때 전체 주문 중 쿠폰이 쓰인 비율을 넣는 게 가장 정확해요. 기록이 없다면 30% 정도로 보고, 가장 불리한 경우를 보려면 비워 두세요(100%로 계산).",
  },
  {
    q: "본전 주문 수는 무슨 뜻이에요?",
    a: "이벤트 비용을 쓰고도 한 달 이익이 이벤트 전과 같아지려면 필요한 월 주문 수예요. 이보다 주문이 적게 늘면 이벤트를 안 한 것보다 손해예요.",
  },
  {
    q: "'본전 불가'가 나오면 어떻게 하나요?",
    a: "쿠폰·리뷰 서비스 비용을 빼면 주문 한 건에서 남는 돈이 없다는 뜻이라 주문이 늘수록 손해가 커져요. 쿠폰액이나 업주 부담률을 낮추거나, 최소 주문 금액을 올리는 식으로 조건을 바꿔 다시 계산해 보세요.",
  },
  {
    q: "현재 주문당 이익은 어디서 구하나요?",
    a: "배달 수익 계산기에서 앱별로 한 건에 남는 돈을 먼저 계산해 보세요. 결과 화면의 '쿠폰 이벤트 손익 보기'를 누르면 그 금액과 월 주문 수가 이 계산기에 자동으로 들어와요.",
  },
];

export default function Page() {
  return (
    <CalcShell slug="promotion" faq={FAQ}>
      <PromotionCalculator />
    </CalcShell>
  );
}
