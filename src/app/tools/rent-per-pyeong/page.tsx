import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { RentPerPyeongCalculator } from "@/components/calc/tools/RentPerPyeongCalculator";

export const metadata = calcMetadata("rent-per-pyeong");

const FAQ: FaqItem[] = [
  { q: "1평은 몇 ㎡인가요?", a: "1평은 약 3.3058㎡예요. 반대로 1㎡는 약 0.3025평이라, ㎡ 면적에 0.3025를 곱하면 대략의 평수가 나와요. 계약서와 공문서는 ㎡를 쓰니 두 단위를 함께 확인하세요." },
  { q: "평당 임대료는 왜 따져 보나요?", a: "크기가 다른 매장을 같은 잣대로 비교하기 위해서예요. 월세 200만 원짜리 20평과 150만 원짜리 12평 중 어느 쪽이 싼지는 평당 금액으로 봐야 보여요." },
  { q: "전용면적과 계약면적 중 무엇을 넣어야 하나요?", a: "실제로 영업에 쓰는 공간을 따지려면 전용면적이 좋아요. 다만 중개 매물은 공용 부분을 포함한 계약면적으로 표시되는 경우가 많으니, 비교하는 매물끼리 같은 기준인지 먼저 확인하세요." },
  { q: "관리비를 넣으면 무엇이 달라지나요?", a: "월세만 기준으로 한 평당 금액과 함께, 관리비까지 더한 평당 총비용이 표시돼요. 관리비가 높은 건물은 월세가 싸 보여도 총비용이 비쌀 수 있어요." },
];

export default function Page() {
  return (
    <CalcShell slug="rent-per-pyeong" faq={FAQ}>
      <RentPerPyeongCalculator />
    </CalcShell>
  );
}
