import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { BreakevenCalculator } from "@/components/calc/tools/BreakevenCalculator";

export const metadata = calcMetadata("breakeven");

const FAQ: FaqItem[] = [
  { q: "변동비율은 어떻게 구하나요?", a: "지난달 재료비·포장비·카드 수수료·배달앱 수수료처럼 매출에 따라 늘고 주는 비용을 모두 더해 매출로 나누면 돼요. 음식점은 보통 30~40%대가 많지만 가게마다 차이가 커요." },
  { q: "손익분기점을 넘기면 이익이 나는 건가요?", a: "네, 손익분기 매출을 넘는 부분부터 공헌이익률만큼 이익이 쌓여요. 공헌이익률이 65%라면 손익분기를 넘긴 매출 100만 원당 약 65만 원이 남아요." },
  { q: "사장님 월급은 어디에 넣어야 하나요?", a: "생활비로 매달 가져가야 할 금액이 있다면 월 고정비에 더해 넣으세요. 그래야 '가게도 유지되고 생활비도 나오는' 현실적인 손익분기점이 나와요." },
  { q: "영업일수는 왜 입력하나요?", a: "하루에 몇 건을 팔아야 하는지 감을 잡기 위해서예요. 비우면 한 달 30일 영업으로 계산하고, 주 1회 쉬면 26일 정도로 바꿔 넣으면 더 현실적이에요." },
];

export default function Page() {
  return (
    <CalcShell slug="breakeven" faq={FAQ}>
      <BreakevenCalculator />
    </CalcShell>
  );
}
