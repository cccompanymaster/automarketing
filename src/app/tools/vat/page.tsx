import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { VatCalculator } from "@/components/calc/tools/VatCalculator";
import { formatNumber } from "@/lib/calc/num";
import { VAT } from "@/lib/calc/rates";

export const metadata = calcMetadata("vat");

const SIMPLIFIED = `${formatNumber(VAT.value.simplifiedThreshold / 10_000)}만 원`;

const FAQ: FaqItem[] = [
  { q: "합계금액에서 10%를 빼면 공급가액 아닌가요?", a: "아니에요. 부가세는 공급가액의 10%라서 합계금액을 1.1로 나눠야 해요. 11,000원에서 10%(1,100원)를 빼면 9,900원이 되지만, 실제 공급가액은 10,000원이에요." },
  { q: "나눠떨어지지 않으면 원 단위는 어떻게 하나요?", a: "이 계산기는 공급가액을 원 단위로 반올림하고, 부가세는 합계에서 공급가액을 뺀 금액으로 정해요. 그래야 공급가액과 부가세를 더하면 합계와 정확히 맞아요." },
  { q: "간이과세자도 10%로 계산하면 되나요?", a: `간이과세자(직전 연도 매출 ${SIMPLIFIED} 미만)는 매출에 업종별 부가가치율과 10%를 곱해 훨씬 적게 내요. 이 계산기는 일반과세자가 세금계산서·영수증 금액을 나눌 때 쓰세요.` },
  { q: "가격표에는 부가세 포함 가격을 써야 하나요?", a: "소비자를 상대로 파는 가게는 부가세가 포함된 최종 가격을 표시하는 게 원칙이에요. 거래처에 견적을 낼 때는 '부가세 별도'인지 꼭 적어 두세요." },
];

export default function Page() {
  return (
    <CalcShell slug="vat" faq={FAQ}>
      <VatCalculator />
    </CalcShell>
  );
}
