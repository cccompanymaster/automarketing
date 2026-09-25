"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { FieldGrid, InputCard, NumberField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { calcSalesTarget, DEFAULT_BUSINESS_DAYS } from "@/lib/calc/salesTarget";
import { formatNumber, formatPercent, formatWon, parseNumber } from "@/lib/calc/num";

const DEFAULTS = { profit: "", fixed: "", variable: "", ticket: "", days: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["profit", "fixed", "variable", "ticket", "days"];
const CHECKED_AT = "2026-09-25";

export function SalesTargetCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);

  const result = useMemo(
    () =>
      calcSalesTarget({
        targetProfit: parseNumber(s.profit),
        fixedCost: parseNumber(s.fixed),
        variablePct: parseNumber(s.variable),
        avgTicket: parseNumber(s.ticket),
        businessDays: parseNumber(s.days),
      }),
    [s.profit, s.fixed, s.variable, s.ticket, s.days],
  );

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <NumberField
            label="목표 월 순이익"
            value={s.profit}
            onChange={set("profit")}
            placeholder="3,000,000"
            error={issueFor(result, "targetProfit")}
            presets={[
              { label: "300만", value: 3_000_000 },
              { label: "500만", value: 5_000_000 },
              { label: "1,000만", value: 10_000_000 },
            ]}
            help="고정비·변동비를 모두 빼고 사장님 손에 남기고 싶은 돈 (세전)"
          />
          <NumberField label="월 고정비" value={s.fixed} onChange={set("fixed")} placeholder="7,000,000" error={issueFor(result, "fixedCost")} help="임대료·인건비·관리비 등 매달 같은 돈" />
          <NumberField
            label="변동비율"
            unit="%"
            value={s.variable}
            onChange={set("variable")}
            placeholder="35"
            error={issueFor(result, "variablePct")}
            presets={[30, 35, 40].map((v) => ({ label: `${v}%`, value: v }))}
            help="매출 대비 재료비·수수료 등 팔수록 늘어나는 비용의 비율"
          />
          <FieldGrid>
            <NumberField label="객단가" optional value={s.ticket} onChange={set("ticket")} placeholder="20,000" error={issueFor(result, "avgTicket")} help="넣으면 필요한 주문 수도 계산해요" />
            <NumberField
              label="월 영업일수"
              unit="일"
              optional
              value={s.days}
              onChange={set("days")}
              placeholder={String(DEFAULT_BUSINESS_DAYS)}
              error={issueFor(result, "businessDays")}
              presets={[
                { label: "30일", value: 30 },
                { label: "26일", value: 26 },
                { label: "22일", value: 22 },
              ]}
            />
          </FieldGrid>
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="목표 순이익, 고정비, 변동비율을 입력하면 필요한 매출이 나와요.">
            {(v) => (
              <>
                <Headline label="필요 월매출" value={formatWon(v.sales)} sub={`하루 ${formatWon(v.dailySales)} (${v.businessDays}일 영업 기준)`} tone="good" />
                <StatGrid
                  items={[
                    ...(v.orders != null
                      ? [
                          { label: "필요 월 주문 수", value: `${formatNumber(v.orders)}건` },
                          { label: "일평균 주문 수", value: `${formatNumber(v.dailyOrders)}건`, sub: `계산값 ${formatNumber(v.dailyOrdersExact, 1)}건` },
                        ]
                      : []),
                    { label: "손익분기 매출", value: formatWon(v.breakevenSales), sub: "여기까지는 고정비 메우기" },
                    { label: "공헌이익률", value: formatPercent(v.contributionRate) },
                  ]}
                />
                <Breakdown
                  rows={[
                    { label: "필요 월매출", value: formatWon(v.sales), strong: true },
                    { label: `변동비 (${formatPercent(v.variableRate)})`, value: formatWon(-v.variableCost), sub: true },
                    { label: "월 고정비", value: formatWon(-v.fixedCost), sub: true },
                    { label: "남는 순이익", value: formatWon(v.contribution - v.fixedCost), strong: true, tone: "good" },
                    { label: "손익분기 매출 대비 추가로 필요한 매출", value: formatWon(v.salesAboveBreakeven) },
                    ...(v.orders != null && v.avgTicket != null
                      ? [{ label: "필요 월 주문 수 (올림)", value: `${formatNumber(v.orders)}건`, note: `객단가 ${formatWon(v.avgTicket)}` }]
                      : []),
                  ]}
                />
                <Formula
                  lines={[
                    "필요 매출 = (고정비 + 목표 순이익) ÷ (1 − 변동비율)",
                    `= (${formatWon(v.fixedCost)} + ${formatWon(v.targetProfit)}) ÷ ${formatPercent(v.contributionRate, 2)} ≈ ${formatWon(v.sales)}`,
                    ...(v.orders != null ? [`필요 주문 수 = 필요 매출 ÷ 객단가 = ${formatNumber(v.orders)}건 (올림)`] : []),
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            checkedAt={CHECKED_AT}
            items={[
              "순이익은 소득세·부가세 납부 전 금액이에요. 세금을 낸 뒤 남는 돈은 이보다 적어요.",
              "변동비율은 매출 규모와 관계없이 일정하다고 가정해요.",
              `영업일수를 비우면 한 달 ${DEFAULT_BUSINESS_DAYS}일 기준으로 하루 매출·주문을 계산해요.`,
              "매출과 주문 수는 올림해서 목표 이익 이상이 보장되게 계산해요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="매출 목표 계산 결과"
              description={`월 순이익 ${formatWon(result.value.targetProfit)}을 위한 필요 매출 ${formatWon(result.value.sales)}`}
              buildUrl={buildUrl}
              sharedFields={["목표 월 순이익", "월 고정비", "변동비율", "객단가", "월 영업일수"]}
            />
          )}
        </>
      }
    />
  );
}
