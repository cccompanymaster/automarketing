import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { StartupCostCalculator } from "@/components/calc/tools/StartupCostCalculator";

export const metadata = calcMetadata("startup-cost");

const FAQ: FaqItem[] = [
  { q: "보증금과 권리금을 왜 따로 나눠 보여 주나요?", a: "보증금은 계약이 끝나면 돌려받는 돈이지만, 권리금은 다음 임차인이 내줘야 회수되는 돈이라 받을 수 있을지 확실하지 않아요. 인테리어처럼 사라지는 돈과도 성격이 달라서 세 가지를 나눠 보여 드려요." },
  { q: "예비비는 얼마나 잡아야 하나요?", a: "공사·설비 비용은 견적보다 늘어나는 일이 많아 소모 비용의 10~20% 정도를 여유로 두는 경우가 많아요. 예비비는 보증금·권리금이 아닌 소모 비용에만 붙여 계산해요." },
  { q: "운영자금은 왜 창업비용에 넣나요?", a: "오픈 직후에는 매출이 자리 잡기까지 몇 달이 걸리는 경우가 많아요. 그 사이 임대료·인건비를 낼 돈이 없으면 흑자 전에 문을 닫을 수 있어서, 최소 3~6개월치 운영비를 함께 준비하는 게 안전해요." },
  { q: "프랜차이즈 가맹비는 어디에 넣나요?", a: "가맹비·교육비처럼 돌려받지 못하는 돈은 '가맹비·교육비'에 넣으세요. 가맹 보증금처럼 계약 종료 때 돌려받는 돈이라면 보증금 쪽에 더해 두는 게 맞아요." },
];

export default function Page() {
  return (
    <CalcShell slug="startup-cost" faq={FAQ}>
      <StartupCostCalculator />
    </CalcShell>
  );
}
