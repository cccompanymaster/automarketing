import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { LaborRatioCalculator } from "@/components/calc/tools/LaborRatioCalculator";
import { formatPercent } from "@/lib/calc/num";
import { LABOR_RATIO_BANDS } from "@/lib/calc/rates/laborTax";
import { employerRateApprox } from "@/lib/calc/socialInsurance";

const BANDS = LABOR_RATIO_BANDS.value.filter((b) => Number.isFinite(b.max));
const GOOD = formatPercent(BANDS[0].max, 0);
const DANGER = formatPercent(BANDS[BANDS.length - 1].max, 0);
const EMPLOYER = formatPercent(employerRateApprox(), 1);

export const metadata = calcMetadata("labor-ratio");

const FAQ: FaqItem[] = [
  { q: "인건비 비율은 몇 %가 적당한가요?", a: `업종마다 달라요. 셀프 서비스 카페나 배달 전문점은 낮게, 손이 많이 가는 풀서비스 식당은 높게 나오는 편이에요. 여기서는 ${GOOD} 이하를 양호, ${DANGER} 초과를 위험으로 보는 일반적인 참고 기준을 썼어요.` },
  { q: "사장님 인건비는 왜 넣나요?", a: "사장님이 직접 일해서 아끼는 인건비도 결국 비용이에요. 넣어 두면 나중에 직원을 한 명 더 뽑거나 매장을 맡길 때의 실제 부담을 미리 볼 수 있어요." },
  { q: "사업주 4대보험 부담은 얼마나 되나요?", a: `업종과 규모에 따라 다르지만 일반 서비스업·150인 미만 기준으로 직원 급여의 약 ${EMPLOYER} 수준이에요. 급여만 보고 계산하면 실제 인건비를 적게 잡게 되니 체크해 두는 걸 권해요.` },
  { q: "비율이 너무 높게 나오면 무엇부터 봐야 하나요?", a: "손님이 적은 시간대의 근무 인원, 준비·마감 시간 배치를 먼저 점검해 보세요. 결과에 나오는 '한 단계 낮은 구간 매출'은 인건비를 그대로 두고 매출을 얼마나 올려야 하는지 알려줘요." },
];

export default function Page() {
  return (
    <CalcShell slug="labor-ratio" faq={FAQ}>
      <LaborRatioCalculator />
    </CalcShell>
  );
}
