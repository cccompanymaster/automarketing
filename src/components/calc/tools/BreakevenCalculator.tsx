"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { FieldGrid, InputCard, NumberField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { calcBreakeven, DEFAULT_BUSINESS_DAYS } from "@/lib/calc/breakeven";
import { formatNumber, formatPercent, formatWon, parseNumber } from "@/lib/calc/num";

const DEFAULTS = { fixed: "", variable: "", ticket: "", days: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["fixed", "variable", "ticket", "days"];
const CHECKED_AT = "2026-09-25";

export function BreakevenCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);

  const result = useMemo(
    () =>
      calcBreakeven({
        fixedCost: parseNumber(s.fixed),
        variablePct: parseNumber(s.variable),
        avgTicket: parseNumber(s.ticket),
        businessDays: parseNumber(s.days),
      }),
    [s.fixed, s.variable, s.ticket, s.days],
  );

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <NumberField
            label="월 고정비"
            value={s.fixed}
            onChange={set("fixed")}
            placeholder="7,000,000"
            error={issueFor(result, "fixedCost")}
            help="임대료·인건비·관리비·대출 이자처럼 매출과 상관없이 매달 나가는 돈"
          />
          <NumberField
            label="변동비율"
            unit="%"
            value={s.variable}
            onChange={set("variable")}
            placeholder="35"
            error={issueFor(result, "variablePct")}
            presets={[30, 35, 40].map((v) => ({ label: `${v}%`, value: v }))}
            help="매출 대비 재료비·포장비·카드/배달 수수료 등 팔수록 늘어나는 비용의 비율"
          />
          <FieldGrid>
            <NumberField label="객단가" optional value={s.ticket} onChange={set("ticket")} placeholder="20,000" error={issueFor(result, "avgTicket")} help="주문 1건 평균 결제액 — 넣으면 주문 수도 계산해요" />
            <NumberField
              label="월 영업일수"
              unit="일"
              optional
              value={s.days}
              onChange={set("days")}
              placeholder={String(DEFAULT_BUSINESS_DAYS)}
              error={issueFor(result, "businessDays")}
              presets={[
                { label: "매일 30일", value: 30 },
                { label: "주 6일 26일", value: 26 },
                { label: "주 5일 22일", value: 22 },
              ]}
            />
          </FieldGrid>
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="월 고정비와 변동비율을 입력하면 손익분기 매출이 나와요.">
            {(v) => (
              <>
                <Headline label="손익분기 월매출" value={formatWon(v.sales)} sub={`이 매출부터 적자를 벗어나요 · 하루 ${formatWon(v.dailySales)} (${v.businessDays}일 기준)`} tone="good" />
                <StatGrid
                  items={[
                    { label: "공헌이익률", value: formatPercent(v.contributionRate), sub: "매출 1원당 고정비를 메우는 몫" },
                    ...(v.orders != null
                      ? [
                          { label: "필요 월 주문 수", value: `${formatNumber(v.orders)}건` },
                          { label: "일평균 주문 수", value: `${formatNumber(v.dailyOrders)}건`, sub: `계산값 ${formatNumber(v.dailyOrdersExact, 1)}건` },
                        ]
                      : [{ label: "주문 수", value: "객단가 입력 시", sub: "객단가를 넣어 보세요" }]),
                  ]}
                />
                <Breakdown
                  rows={[
                    { label: "손익분기 월매출", value: formatWon(v.sales), strong: true },
                    { label: `변동비 (${formatPercent(v.variableRate)})`, value: formatWon(-v.variableCostAtBep), sub: true },
                    { label: "공헌이익", value: formatWon(v.fixedCost), sub: true },
                    { label: "월 고정비", value: formatWon(-v.fixedCost), sub: true },
                    { label: "영업이익", value: formatWon(0), strong: true },
                    ...(v.orders != null && v.avgTicket != null
                      ? [{ label: "필요 월 주문 수 (올림)", value: `${formatNumber(v.orders)}건`, note: `${formatWon(v.sales)} ÷ ${formatWon(v.avgTicket)}` }]
                      : []),
                  ]}
                />
                <Formula
                  lines={[
                    "공헌이익률 = 1 − 변동비율",
                    "손익분기 매출 = 월 고정비 ÷ 공헌이익률",
                    `= ${formatWon(v.fixedCost)} ÷ ${formatPercent(v.contributionRate, 2)} ≈ ${formatWon(v.sales)}`,
                    ...(v.orders != null && v.avgTicket != null
                      ? [`필요 주문 수 = 손익분기 매출 ÷ 객단가 = ${formatNumber(v.orders)}건 (올림)`, `일평균 = ${formatNumber(v.orders)}건 ÷ ${v.businessDays}일 ≈ ${formatNumber(v.dailyOrdersExact, 1)}건`]
                      : []),
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            checkedAt={CHECKED_AT}
            items={[
              "변동비율은 매출이 늘거나 줄어도 일정하다고 가정해요. 실제로는 할인·메뉴 구성에 따라 달라져요.",
              `영업일수를 비우면 한 달 ${DEFAULT_BUSINESS_DAYS}일 영업 기준으로 일평균을 계산해요.`,
              "매출과 주문 수는 올림해서, 이 숫자를 넘기면 적자가 아님을 보장해요.",
              "사장님 본인 인건비와 소득세는 고정비에 넣지 않으면 반영되지 않아요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="손익분기점 계산 결과"
              description={`손익분기 월매출 ${formatWon(result.value.sales)}${result.value.orders != null ? ` · 월 ${formatNumber(result.value.orders)}건` : ""}`}
              buildUrl={buildUrl}
              sharedFields={["월 고정비", "변동비율", "객단가", "월 영업일수"]}
            />
          )}
        </>
      }
    />
  );
}
