"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { CheckboxField, FieldGrid, InputCard, NumberField, Segmented, SelectField, TextField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import {
  compareDetailed,
  compareSimple,
  UNIT_OPTIONS,
  type Cheaper,
  type DetailedProductResult,
  type UnitKey,
  type UnitSpec,
  type VatType,
} from "@/lib/calc/unitPrice";
import { formatNumber, formatPercent, formatWon, parseNumber } from "@/lib/calc/num";
import { VAT } from "@/lib/calc/rates";

// All inputs (both modes, both products) live in one object so switching
// modes never clears them.
const PRODUCT = { Price: "", Qty: "", Unit: "ea", Custom: "", Order: "", Vat: "included", Ship: "", Disc: "", Waste: "", Ded: "" };
const DEFAULTS = {
  mode: "simple",
  ...Object.fromEntries(Object.entries(PRODUCT).map(([k, v]) => [`a${k}`, v])),
  ...Object.fromEntries(Object.entries(PRODUCT).map(([k, v]) => [`b${k}`, v])),
  usage: "",
  usageUnit: "ea",
  usageCustom: "",
} as Record<string, string>;
type State = typeof DEFAULTS;
const SHARE_KEYS = Object.keys(DEFAULTS);
const UNIT_KEYS = UNIT_OPTIONS.map((u) => u.value);
const VAT_TYPES: VatType[] = ["included", "excluded", "exempt"];
const NAME = { a: "상품 A", b: "상품 B" } as const;

const unitOf = (key: string, custom: string): UnitSpec => ({
  unit: (UNIT_KEYS.includes(key as UnitKey) ? key : "ea") as UnitKey,
  custom,
});
const vatOf = (v: string): VatType => (VAT_TYPES.includes(v as VatType) ? (v as VatType) : "included");
/** Per-unit prices are often fractional → show up to 2 decimals. */
const wonDec = (n: number | null | undefined) => (n == null ? "—" : `${formatNumber(n, 2)}원`);

function UnitPicker({
  label,
  value,
  custom,
  onUnit,
  onCustom,
}: {
  label: string;
  value: string;
  custom: string;
  onUnit: (v: string) => void;
  onCustom: (v: string) => void;
}) {
  return (
    <>
      <SelectField label={label} value={unitOf(value, "").unit} onChange={onUnit} options={UNIT_OPTIONS} />
      {value === "custom" && <TextField label={`${label} 이름`} value={custom} onChange={onCustom} placeholder="예: 캔, 봉, 병" maxLength={6} />}
    </>
  );
}

function ProductBreakdown({ name, v, basisLabel }: { name: string; v: DetailedProductResult; basisLabel: string }) {
  return (
    <Breakdown
      title={`${name} 계산 내역`}
      rows={[
        { label: "상품 금액", value: formatWon(v.goodsGross), note: v.orderQty !== 1 ? `주문 ${formatNumber(v.orderQty, 2)}묶음` : undefined },
        ...(v.discount > 0 ? [{ label: "할인", value: formatWon(-v.discount), sub: true }] : []),
        ...(v.goodsCash !== v.goodsNet ? [{ label: "부가세 별도분", value: formatWon(v.goodsCash - v.goodsNet), sub: true }] : []),
        ...(v.shipping > 0 ? [{ label: "배송비", value: formatWon(v.shipping), sub: true }] : []),
        { label: "현금 지출", value: formatWon(v.cash), strong: true },
        { label: "포함된 부가세", value: formatWon(v.vatInCash), sub: true },
        ...(v.deductibleVat > 0 ? [{ label: "매입세액 공제", value: formatWon(-v.deductibleVat), sub: true, tone: "good" as const }] : []),
        { label: "실질 비용", value: formatWon(v.effectiveCost) },
        { label: "총 수량", value: `${formatNumber(v.totalQtyBase, 2)}${baseSuffix(v.unitLabel)}` },
        ...(v.wasteRate > 0
          ? [{ label: `사용 가능 수량 (폐기 ${formatPercent(v.wasteRate)} 제외)`, value: `${formatNumber(v.usableQtyBase, 2)}${baseSuffix(v.unitLabel)}` }]
          : []),
        { label: `${basisLabel}당 현금 지출 단가`, value: wonDec(v.cashPerDisplay) },
        { label: `${basisLabel}당 실질 단가`, value: wonDec(v.realPerDisplay), strong: true },
        ...(v.monthsLasting != null ? [{ label: "재고 지속", value: `${formatNumber(v.monthsLasting, 1)}개월` }] : []),
        ...(v.monthlyCost != null ? [{ label: "월 실질 비용", value: formatWon(v.monthlyCost) }] : []),
      ]}
    />
  );
}

/** Quantities are shown in base units (g / ml) for mass & volume. */
function baseSuffix(unitLabel: string) {
  if (unitLabel === "kg" || unitLabel === "g") return "g";
  if (unitLabel === "L" || unitLabel === "ml") return "ml";
  return unitLabel;
}

function verdict(cheaper: Cheaper) {
  return cheaper === "same" ? "단가가 같아요" : `${NAME[cheaper]}가 더 저렴해요`;
}

export function UnitPriceCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: string) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const detailed = s.mode === "detail";

  const simple = useMemo(
    () =>
      compareSimple({
        a: { price: parseNumber(s.aPrice), qty: parseNumber(s.aQty), unit: unitOf(s.aUnit, s.aCustom) },
        b: { price: parseNumber(s.bPrice), qty: parseNumber(s.bQty), unit: unitOf(s.bUnit, s.bCustom) },
      }),
    [s.aPrice, s.aQty, s.aUnit, s.aCustom, s.bPrice, s.bQty, s.bUnit, s.bCustom],
  );

  const detail = useMemo(() => {
    const prod = (p: "a" | "b") => ({
      price: parseNumber(s[`${p}Price`]),
      qty: parseNumber(s[`${p}Qty`]),
      unit: unitOf(s[`${p}Unit`], s[`${p}Custom`]),
      orderQty: parseNumber(s[`${p}Order`]),
      vatType: vatOf(s[`${p}Vat`]),
      shipping: parseNumber(s[`${p}Ship`]),
      discount: parseNumber(s[`${p}Disc`]),
      wastePct: parseNumber(s[`${p}Waste`]),
      deductible: s[`${p}Ded`] === "1",
    });
    return compareDetailed({ a: prod("a"), b: prod("b"), usage: parseNumber(s.usage), usageUnit: unitOf(s.usageUnit, s.usageCustom) });
  }, [s]);

  const active = detailed ? detail : simple;

  const productCard = (p: "a" | "b") => (
    <InputCard key={p} title={NAME[p]}>
      <FieldGrid>
        <NumberField
          label={detailed ? "가격 (1묶음)" : "가격"}
          value={s[`${p}Price`]}
          onChange={set(`${p}Price`)}
          placeholder={p === "a" ? "12,000" : "3,000"}
          error={issueFor(active, `${p}Price`)}
        />
        <NumberField
          label={detailed ? "1묶음에 든 수량" : "수량"}
          unit=""
          allowDecimal
          value={s[`${p}Qty`]}
          onChange={set(`${p}Qty`)}
          placeholder={p === "a" ? "1" : "200"}
          error={issueFor(active, `${p}Qty`)}
        />
      </FieldGrid>
      <UnitPicker label="단위" value={s[`${p}Unit`]} custom={s[`${p}Custom`]} onUnit={set(`${p}Unit`)} onCustom={set(`${p}Custom`)} />
      {detailed && (
        <>
          <Segmented
            label="부가세"
            value={vatOf(s[`${p}Vat`])}
            onChange={set(`${p}Vat`)}
            options={[
              { value: "included", label: "포함" },
              { value: "excluded", label: "별도" },
              { value: "exempt", label: "면세" },
            ]}
          />
          <FieldGrid>
            <NumberField label="주문 수량" unit="묶음" optional allowDecimal value={s[`${p}Order`]} onChange={set(`${p}Order`)} placeholder="1" error={issueFor(active, `${p}OrderQty`)} />
            <NumberField label="배송비" optional value={s[`${p}Ship`]} onChange={set(`${p}Ship`)} placeholder="0" error={issueFor(active, `${p}Shipping`)} help="실제 결제한 금액" />
            <NumberField label="할인" optional value={s[`${p}Disc`]} onChange={set(`${p}Disc`)} placeholder="0" error={issueFor(active, `${p}Discount`)} help="쿠폰 등 주문 전체에서 빠지는 금액" />
            <NumberField
              label="불량·폐기율"
              unit="%"
              optional
              value={s[`${p}Waste`]}
              onChange={set(`${p}Waste`)}
              placeholder="0"
              error={issueFor(active, `${p}Waste`)}
              presets={[0, 5, 10].map((v) => ({ label: `${v}%`, value: v }))}
            />
          </FieldGrid>
          <CheckboxField
            label="매입세액 공제 받음"
            checked={s[`${p}Ded`] === "1"}
            onChange={(c) => set(`${p}Ded`)(c ? "1" : "")}
            help="일반과세자가 세금계산서·카드 영수증으로 매입세액을 돌려받는 경우"
          />
        </>
      )}
    </InputCard>
  );

  return (
    <CalcColumns
      inputs={
        <>
          <InputCard>
            <Segmented
              label="계산 방식"
              value={detailed ? "detail" : "simple"}
              onChange={set("mode")}
              options={[
                { value: "simple", label: "간단 비교" },
                { value: "detail", label: "배송비·부가세 포함" },
              ]}
            />
            {detailed && (
              <>
                <FieldGrid>
                  <NumberField label="월 사용량" unit="" optional allowDecimal value={s.usage} onChange={set("usage")} placeholder="3" error={issueFor(active, "usage")} help="재고가 몇 달 가는지, 월 비용 차이를 알려드려요" />
                  <UnitPicker label="월 사용량 단위" value={s.usageUnit} custom={s.usageCustom} onUnit={set("usageUnit")} onCustom={set("usageCustom")} />
                </FieldGrid>
                {issueFor(active, "usageUnit") && (
                  <p role="alert" className="text-xs font-medium text-rose-600">
                    {issueFor(active, "usageUnit")}
                  </p>
                )}
              </>
            )}
          </InputCard>
          {productCard("a")}
          {productCard("b")}
        </>
      }
      result={
        <>
          {detailed ? (
            <ResultPanel result={detail} emptyHint="두 상품의 가격과 수량을 입력하면 실질 단가를 비교해 드려요.">
              {(v) => (
                <>
                  <Headline
                    label={verdict(v.cheaper)}
                    value={v.cheaper === "same" ? "차이 없음" : `${v.basis.displayLabel}당 ${wonDec(v.diffPerDisplay)} 차이`}
                    sub={
                      v.cheaper === "same"
                        ? "부가세 공제·폐기율까지 반영한 실질 단가 기준"
                        : `실질 단가 기준 ${formatPercent(v.diffRate)} 저렴${v.monthlySaving != null ? ` · 월 ${formatWon(v.monthlySaving)} 절약` : ""}`
                    }
                    tone="good"
                  />
                  <StatGrid
                    items={[
                      { label: `A 실질 단가 (${v.basis.displayLabel})`, value: wonDec(v.a.realPerDisplay), tone: v.cheaper === "a" ? "good" : "default" },
                      { label: `B 실질 단가 (${v.basis.displayLabel})`, value: wonDec(v.b.realPerDisplay), tone: v.cheaper === "b" ? "good" : "default" },
                      { label: "A 현금 지출 단가", value: wonDec(v.a.cashPerDisplay) },
                      { label: "B 현금 지출 단가", value: wonDec(v.b.cashPerDisplay) },
                      ...(v.a.monthsLasting != null && v.b.monthsLasting != null
                        ? [
                            { label: "A 재고 지속", value: `${formatNumber(v.a.monthsLasting, 1)}개월` },
                            { label: "B 재고 지속", value: `${formatNumber(v.b.monthsLasting, 1)}개월` },
                          ]
                        : []),
                    ]}
                  />
                  <ProductBreakdown name={NAME.a} v={v.a} basisLabel={v.basis.displayLabel} />
                  <ProductBreakdown name={NAME.b} v={v.b} basisLabel={v.basis.displayLabel} />
                  <Formula
                    lines={[
                      "현금 지출 = 가격 × 주문 수량 − 할인 (+ 별도 부가세) + 배송비",
                      `매입세액 = 부가세 포함 금액 × ${formatPercent(v.vatRate, 0)} ÷ (1 + ${formatPercent(v.vatRate, 0)})`,
                      "사용 가능 수량 = 수량 × 주문 수량 × (1 − 폐기율)",
                      "실질 단가 = (현금 지출 − 공제 매입세액) ÷ 사용 가능 수량",
                      `A: ${formatWon(v.a.effectiveCost)} ÷ ${formatNumber(v.a.usableQtyBase, 2)}${baseSuffix(v.a.unitLabel)} × ${formatNumber(v.basis.displayQty)} = ${wonDec(v.a.realPerDisplay)}`,
                      `B: ${formatWon(v.b.effectiveCost)} ÷ ${formatNumber(v.b.usableQtyBase, 2)}${baseSuffix(v.b.unitLabel)} × ${formatNumber(v.basis.displayQty)} = ${wonDec(v.b.realPerDisplay)}`,
                      ...(v.usageBase != null ? ["재고 지속 개월 = 사용 가능 수량 ÷ 월 사용량"] : []),
                    ]}
                  />
                </>
              )}
            </ResultPanel>
          ) : (
            <ResultPanel result={simple} emptyHint="두 상품의 가격과 수량을 입력하면 단가를 비교해 드려요.">
              {(v) => (
                <>
                  <Headline
                    label={verdict(v.cheaper)}
                    value={v.cheaper === "same" ? "차이 없음" : `${v.basis.displayLabel}당 ${wonDec(v.diffPerDisplay)} 차이`}
                    sub={v.cheaper === "same" ? undefined : `비싼 쪽보다 ${formatPercent(v.diffRate)} 저렴`}
                    tone="good"
                  />
                  <StatGrid
                    items={[
                      { label: `A 단가 (${v.basis.displayLabel})`, value: wonDec(v.a.perDisplay), tone: v.cheaper === "a" ? "good" : "default" },
                      { label: `B 단가 (${v.basis.displayLabel})`, value: wonDec(v.b.perDisplay), tone: v.cheaper === "b" ? "good" : "default" },
                    ]}
                  />
                  <Breakdown
                    rows={[
                      { label: "상품 A", value: `${formatWon(v.a.price)} ÷ ${formatNumber(v.a.qty, 2)}${v.a.unitLabel}` },
                      { label: `${v.basis.displayLabel}당`, value: wonDec(v.a.perDisplay), sub: true },
                      { label: "상품 B", value: `${formatWon(v.b.price)} ÷ ${formatNumber(v.b.qty, 2)}${v.b.unitLabel}` },
                      { label: `${v.basis.displayLabel}당`, value: wonDec(v.b.perDisplay), sub: true },
                      { label: "차이", value: wonDec(v.diffPerDisplay), strong: true },
                    ]}
                  />
                  <Formula
                    lines={[
                      `단가 = 가격 ÷ 수량 (${v.basis.baseLabel} 단위로 환산) × ${formatNumber(v.basis.displayQty)}`,
                      `A: ${formatWon(v.a.price)} ÷ ${formatNumber(v.a.qtyBase, 2)}${v.basis.baseLabel} × ${formatNumber(v.basis.displayQty)} = ${wonDec(v.a.perDisplay)}`,
                      `B: ${formatWon(v.b.price)} ÷ ${formatNumber(v.b.qtyBase, 2)}${v.basis.baseLabel} × ${formatNumber(v.basis.displayQty)} = ${wonDec(v.b.perDisplay)}`,
                    ]}
                  />
                </>
              )}
            </ResultPanel>
          )}
          <Assumptions
            sources={detailed ? [VAT] : []}
            checkedAt="2026-09-25"
            items={[
              "kg↔g, L↔ml은 자동으로 환산해요. 개·장·롤·팩·박스는 서로 환산할 수 없어서 같은 단위끼리만 비교돼요.",
              ...(detailed
                ? [
                    "배송비는 실제 결제액으로 보고, 과세 상품이면 부가세가 포함돼 있다고 계산해요. 면세 상품의 배송비는 면세로 봐요.",
                    "할인은 입력한 가격과 같은 기준(부가세 포함 또는 별도)에서 뺀다고 가정해요.",
                    "매입세액 공제는 일반과세자가 적격 증빙을 받은 경우에만 해당돼요. 간이과세자는 공제 방식이 달라요.",
                    "보관비·유통기한·결제 조건 같은 비용 외 요소는 반영하지 않았어요.",
                  ]
                : ["배송비·부가세·폐기율을 반영하려면 '배송비·부가세 포함' 방식을 선택하세요."]),
            ]}
          />
          {active.status === "ok" && (
            <ShareBar
              title="단가 비교 결과"
              description={active.value.cheaper === "same" ? "두 상품의 단가가 같아요" : `${NAME[active.value.cheaper]}가 ${active.value.basis.displayLabel}당 ${wonDec(active.value.diffPerDisplay)} 저렴`}
              buildUrl={buildUrl}
              sharedFields={["계산 방식", "두 상품의 가격·수량·단위", "주문 수량·부가세·배송비·할인·폐기율·공제 여부", "월 사용량"]}
            />
          )}
        </>
      }
    />
  );
}
