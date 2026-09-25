import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { RentRatioCalculator } from "@/components/calc/tools/RentRatioCalculator";

export const metadata = calcMetadata("rent-ratio");

const FAQ: FaqItem[] = [
  { q: "임대료 비율은 몇 %면 괜찮은가요?", a: "흔히 매출의 10% 안쪽이면 여유 있고, 15%를 넘기 시작하면 이익이 빠르게 줄어든다고 봐요. 다만 객단가·마진이 높은 업종은 더 버틸 수 있고, 마진이 얇은 업종은 10%도 버거울 수 있어서 참고 기준으로만 보세요." },
  { q: "관리비도 넣어야 하나요?", a: "넣는 편이 정확해요. 매달 건물주나 관리사무소에 나가는 돈은 모두 자리값이라, 임대료만 보면 실제 부담보다 낮게 보여요. 결과에는 관리비 포함 비율과 임대료만 비율을 둘 다 보여 드려요." },
  { q: "매출은 어떤 기준으로 넣나요?", a: "카드·현금·배달앱 매출을 합친 한 달 총매출을 넣으세요. 임대료를 부가세 포함으로 넣었다면 매출도 부가세 포함으로 맞추는 게 좋아요. 계절 차이가 크다면 비수기 매출로도 확인해 보세요." },
  { q: "비율이 '위험'으로 나오면 어떻게 해야 하나요?", a: "먼저 결과의 '양호 구간에 필요한 매출'을 보고 현실적으로 도달 가능한지 따져 보세요. 어렵다면 계약 갱신 때 임대료 조정을 요청하거나, 면적을 줄이거나, 객단가를 높이는 방법을 함께 검토하는 게 좋아요." },
];

export default function Page() {
  return (
    <CalcShell slug="rent-ratio" faq={FAQ}>
      <RentRatioCalculator />
    </CalcShell>
  );
}
