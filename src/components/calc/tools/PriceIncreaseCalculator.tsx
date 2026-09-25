"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { CheckboxField, FieldGrid, InputCard, NumberField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { calcPriceIncrease, type PriceIncreaseResult } from "@/lib/calc/priceIncrease";
import { formatNumber, formatPercent, formatWon, parseNumber } from "@/lib/calc/num";

// All inputs live in one object so hiding the extra options never clears them.
const DEFAULTS = { cur: "", next: "", cost: "", qty: "", adv: "", fee: "", perOrder: "", newCost: "", extraFixed: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["cur", "next", "cost", "qty", "adv", "fee", "perOrder", "newCost", "extraFixed"];
const CHECKED_AT = "2026-09-25";

function unitProfitLine(label: string, price: number, fee: number, cost: number, perOrder: number, profit: number, withFee: boolean, withPerOrder: boolean) {
  const parts = [formatWon(price)];
  if (withFee) parts.push(`${formatWon(fee)}(수수료)`);
  parts.push(`${formatWon(cost)}(원가)`);
  if (withPerOrder) parts.push(`${formatWon(perOrder)}(주문당 비용)`);
  return `${label} = ${parts.join(" − ")} = ${formatWon(profit)}`;
}

export function PriceIncreaseCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const adv = s.adv === "1";

  const result = useMemo(
    () =>
      calcPriceIncrease({
        currentPrice: parseNumber(s.cur),
        newPrice: parseNumber(s.next),
        cost: parseNumber(s.cost),
        monthlyQty: parseNumber(s.qty),
        feePct: adv ? parseNumber(s.fee) : null,
        perOrderCost: adv ? parseNumber(s.perOrder) : null,
        newCost: adv ? parseNumber(s.newCost) : null,
        extraFixed: adv ? parseNumber(s.extraFixed) : null,
      }),
    [adv, s.cur, s.next, s.cost, s.qty, s.fee, s.perOrder, s.newCost, s.extraFixed],
  );

  const details = (v: Partial<PriceIncreaseResult>) => {
    if (v.currentPrice == null || v.newPrice == null || v.cost == null || v.newCost == null) return null;
    const withFee = (v.feeRate ?? 0) > 0;
    const withPer = (v.perOrderCost ?? 0) > 0;
    return (
      <Formula
        lines={[
          "개당 이익 = 판매가 − 판매가 비례 수수료 − 원가 − 주문당 비용",
          unitProfitLine("인상 전", v.currentPrice, v.feeBefore ?? 0, v.cost, v.perOrderCost ?? 0, v.unitProfitBefore ?? 0, withFee, withPer),
          unitProfitLine("인상 후", v.newPrice, v.feeAfter ?? 0, v.newCost, v.perOrderCost ?? 0, v.unitProfitAfter ?? 0, withFee, withPer),
          ...(v.requiredQty != null
            ? [
                "동일 이익 판매량 = (현재 월 이익 + 추가 고정비) ÷ 인상 후 개당 이익 (올림)",
                `= (${formatWon(v.monthlyProfitBefore)} + ${formatWon(v.extraFixed)}) ÷ ${formatWon(v.unitProfitAfter)} ≈ ${formatNumber(v.requiredQty)}개`,
              ]
            : []),
        ]}
      />
    );
  };

  return (
    <CalcColumns
      inputs={
        <>
          <InputCard>
            <FieldGrid>
              <NumberField label="현재 가격" value={s.cur} onChange={set("cur")} placeholder="10,000" error={issueFor(result, "currentPrice")} />
              <NumberField label="인상 가격" value={s.next} onChange={set("next")} placeholder="11,000" error={issueFor(result, "newPrice")} />
              <NumberField label="원가" value={s.cost} onChange={set("cost")} placeholder="6,000" error={issueFor(result, "cost")} help="한 개 파는 데 드는 재료·포장비" />
              <NumberField label="월 판매량" unit="개" value={s.qty} onChange={set("qty")} placeholder="1,000" error={issueFor(result, "monthlyQty")} />
            </FieldGrid>
            <CheckboxField
              label="수수료·추가 비용까지 넣어서 계산"
              checked={adv}
              onChange={(c) => set("adv")(c ? "1" : "")}
              help="배달앱·카드 수수료, 원가 인상, 늘어나는 고정비를 반영해요"
            />
          </InputCard>
          {adv && (
            <InputCard title="확장 옵션">
              <FieldGrid>
                <NumberField
                  label="판매가 비례 수수료"
                  unit="%"
                  optional
                  value={s.fee}
                  onChange={set("fee")}
                  placeholder="0"
                  error={issueFor(result, "feePct")}
                  presets={[3, 5, 10, 15].map((v) => ({ label: `${v}%`, value: v }))}
                  help="카드·배달앱·오픈마켓 수수료처럼 가격에 비례하는 비용"
                />
                <NumberField label="주문당 고정 비용" optional value={s.perOrder} onChange={set("perOrder")} placeholder="0" error={issueFor(result, "perOrderCost")} help="포장재·배달비 부담 등 1건마다 같은 금액 (1건 = 1개)" />
                <NumberField label="인상 후 원가" optional value={s.newCost} onChange={set("newCost")} placeholder="현재 원가와 같음" error={issueFor(result, "newCost")} help="재료비가 같이 올랐다면 입력" />
                <NumberField label="함께 늘어나는 월 고정비" optional value={s.extraFixed} onChange={set("extraFixed")} placeholder="0" error={issueFor(result, "extraFixed")} help="메뉴판 교체·인건비 증가 등 매달 추가되는 돈" />
              </FieldGrid>
            </InputCard>
          )}
        </>
      }
      result={
        <>
          <ResultPanel
            result={result}
            emptyHint="현재·인상 가격, 원가, 월 판매량을 입력하면 버틸 수 있는 판매량 감소폭이 나와요."
            impossibleExtra={(p) => (p ? details(p) : null)}
          >
            {(v) => (
              <>
                {v.mustSellMore ? (
                  <Headline
                    label="같은 이익을 내려면 오히려 더 팔아야 해요"
                    value={`+${formatNumber(v.extraQtyNeeded)}개`}
                    sub={`월 ${formatNumber(v.monthlyQty)}개 → ${formatNumber(v.requiredQty)}개 (${formatPercent(-v.allowedDropRate)} 증가)`}
                    tone="bad"
                  />
                ) : (
                  <Headline
                    label="허용 가능한 판매량 감소율"
                    value={formatPercent(v.allowedDropRate)}
                    sub={`월 ${formatNumber(v.monthlyQty)}개 중 ${formatNumber(v.allowedDropQty)}개 덜 팔려도 지금과 같은 이익`}
                    tone="good"
                  />
                )}
                <StatGrid
                  items={[
                    { label: "인상 전 개당 이익", value: formatWon(v.unitProfitBefore), tone: v.unitProfitBefore < 0 ? "bad" : "default" },
                    { label: "인상 후 개당 이익", value: formatWon(v.unitProfitAfter), tone: v.unitProfitAfter < v.unitProfitBefore ? "warn" : "good" },
                    { label: "동일 이익 판매량", value: `${formatNumber(v.requiredQty)}개` },
                    { label: "현재 월 이익", value: formatWon(v.monthlyProfitBefore), tone: v.monthlyProfitBefore < 0 ? "bad" : "default" },
                    { label: "판매량 그대로면", value: formatWon(v.monthlyProfitAfterSameQty), sub: "인상 후 월 이익" },
                    { label: "가격 변동", value: formatPercent(v.priceChangeRate), sub: formatWon(v.newPrice - v.currentPrice, { sign: true }) },
                  ]}
                />
                <Breakdown
                  rows={[
                    { label: "현재 가격 → 인상 가격", value: `${formatWon(v.currentPrice)} → ${formatWon(v.newPrice)}` },
                    ...(v.feeRate > 0
                      ? [{ label: `수수료 (${formatPercent(v.feeRate, 2)})`, value: `${formatWon(v.feeBefore)} → ${formatWon(v.feeAfter)}`, sub: true }]
                      : []),
                    { label: "원가", value: v.newCost === v.cost ? formatWon(v.cost) : `${formatWon(v.cost)} → ${formatWon(v.newCost)}`, sub: true },
                    ...(v.perOrderCost > 0 ? [{ label: "주문당 고정 비용", value: formatWon(v.perOrderCost), sub: true }] : []),
                    { label: "개당 이익", value: `${formatWon(v.unitProfitBefore)} → ${formatWon(v.unitProfitAfter)}`, strong: true },
                    { label: "현재 월 이익", value: formatWon(v.monthlyProfitBefore), note: `${formatWon(v.unitProfitBefore)} × ${formatNumber(v.monthlyQty)}개` },
                    ...(v.extraFixed > 0 ? [{ label: "추가 월 고정비", value: formatWon(-v.extraFixed) }] : []),
                    { label: "동일 이익 판매량 (올림)", value: `${formatNumber(v.requiredQty)}개`, note: `계산값 ${formatNumber(v.requiredQtyExact, 2)}개`, strong: true },
                    v.mustSellMore
                      ? { label: "추가로 팔아야 할 수량", value: `${formatNumber(v.extraQtyNeeded)}개`, tone: "bad" as const }
                      : { label: "덜 팔려도 되는 수량", value: `${formatNumber(v.allowedDropQty)}개`, tone: "good" as const },
                  ]}
                />
                {details(v)}
              </>
            )}
          </ResultPanel>
          <Assumptions
            checkedAt={CHECKED_AT}
            items={[
              "주문 1건에 1개가 팔린다고 보고 주문당 고정 비용을 개당 비용으로 계산해요.",
              "판매량은 올림해서 계산해요. 감소율은 올림된 판매량 기준이라 실제보다 조금 보수적이에요.",
              "가격을 올렸을 때 실제로 판매량이 얼마나 줄지는 예측하지 않아요 — 버틸 수 있는 한도만 보여드려요.",
              "인건비·임대료 같은 기존 고정비는 인상 전후가 같다고 보고 비교에서 뺐어요. 새로 늘어나는 고정비만 반영해요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="가격 인상 손익 계산 결과"
              description={
                result.value.mustSellMore
                  ? `인상 후에도 월 ${formatNumber(result.value.extraQtyNeeded)}개 더 팔아야 같은 이익`
                  : `판매량이 ${formatPercent(result.value.allowedDropRate)}까지 줄어도 같은 이익`
              }
              buildUrl={buildUrl}
              sharedFields={["현재·인상 가격", "원가", "월 판매량", "확장 옵션(수수료·주문당 비용·인상 후 원가·추가 고정비)"]}
            />
          )}
        </>
      }
    />
  );
}
