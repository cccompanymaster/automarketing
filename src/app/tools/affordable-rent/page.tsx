import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { AffordableRentCalculator } from "@/components/calc/tools/AffordableRentCalculator";

export const metadata = calcMetadata("affordable-rent");

const FAQ: FaqItem[] = [
  { q: "목표 비율은 몇 %로 잡는 게 좋나요?", a: "처음이라면 10~12%로 보수적으로 잡아 보세요. 유동인구가 많아 매출이 확실한 입지라면 15% 안팎까지 보기도 하지만, 18%를 넘기면 인건비·재료비를 내고 남는 돈이 크게 줄어요." },
  { q: "'관리비 포함'과 '관리비 별도'는 무엇이 다른가요?", a: "관리비 포함은 목표 비율 안에 월세와 관리비를 함께 넣는 방식이라 월세 한도가 그만큼 줄어요. 관리비 별도는 비율을 월세에만 적용하고 관리비는 추가로 나간다고 보는 방식이에요. 보수적으로 보려면 포함 기준을 추천해요." },
  { q: "예상 매출은 어떻게 잡아야 하나요?", a: "주변 비슷한 매장의 매출이나 본사 자료를 참고하되, 오픈 초기에는 기대보다 낮게 나오는 경우가 많아요. 기대 매출의 70~80% 수준으로도 한 번 계산해 보세요." },
  { q: "계산된 월세보다 비싼 매물은 피해야 하나요?", a: "반드시 그런 건 아니지만, 그만큼 더 높은 매출이나 마진이 있어야 버틸 수 있다는 뜻이에요. 임대료 비율 계산기로 실제 매물의 비율을 확인하고, 창업 생존기간 계산기로 여유 자금도 함께 점검해 보세요." },
];

export default function Page() {
  return (
    <CalcShell slug="affordable-rent" faq={FAQ}>
      <AffordableRentCalculator />
    </CalcShell>
  );
}
