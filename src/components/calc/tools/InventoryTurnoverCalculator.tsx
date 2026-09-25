"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { FieldGrid, InputCard, NumberField, Segmented, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { calcInventoryTurnover, PERIODS, type TurnoverPeriod } from "@/lib/calc/inventoryTurnover";
import { formatNumber, formatWon, parseNumber } from "@/lib/calc/num";

const DEFAULTS = { period: "month" as string, cogs: "", begin: "", end: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["period", "cogs", "begin", "end"];
const CHECKED_AT = "2026-09-25";

const asPeriod = (v: string): TurnoverPeriod => (v === "quarter" || v === "year" ? v : "month");

export function InventoryTurnoverCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const period = asPeriod(s.period);
  const pl = PERIODS[period].label;

  const result = useMemo(
    () =>
      calcInventoryTurnover({
        period,
        cogs: parseNumber(s.cogs),
        beginInventory: parseNumber(s.begin),
        endInventory: parseNumber(s.end),
      }),
    [period, s.cogs, s.begin, s.end],
  );

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <Segmented
            label="계산 기간"
            value={period}
            onChange={set("period")}
            options={[
              { value: "month", label: "월" },
              { value: "quarter", label: "분기" },
              { value: "year", label: "연간" },
            ]}
          />
          <NumberField
            label={`${pl} 매출원가`}
            value={s.cogs}
            onChange={set("cogs")}
            placeholder="6,000,000"
            error={issueFor(result, "cogs")}
            help="그 기간에 팔린 상품·재료의 원가 합계 (판매가 아닌 원가 기준)"
          />
          <FieldGrid>
            <NumberField label="기초 재고" value={s.begin} onChange={set("begin")} placeholder="2,000,000" error={issueFor(result, "beginInventory")} help="기간 시작일 재고 (원가)" />
            <NumberField label="기말 재고" value={s.end} onChange={set("end")} placeholder="1,000,000" error={issueFor(result, "endInventory")} help="기간 마지막 날 재고 (원가)" />
          </FieldGrid>
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="매출원가와 기초·기말 재고를 입력하면 회전율이 나와요.">
            {(v) => (
              <>
                <Headline
                  label="재고 회전일수"
                  value={`${formatNumber(v.days, 1)}일`}
                  sub={`들여온 재고가 평균 ${formatNumber(v.days, 1)}일 만에 팔려 나가요 (${pl} ${v.periodDays}일 기준)`}
                  tone={v.days > v.periodDays ? "warn" : "good"}
                />
                <StatGrid
                  items={[
                    { label: `${pl} 회전율`, value: `${formatNumber(v.turnover, 2)}회` },
                    { label: "연 환산 회전율", value: `${formatNumber(v.annualTurnover, 1)}회` },
                    { label: "평균 재고", value: formatWon(v.avgInventory) },
                  ]}
                />
                <Breakdown
                  rows={[
                    { label: "기초 재고", value: formatWon(v.beginInventory) },
                    { label: "기말 재고", value: formatWon(v.endInventory) },
                    { label: "평균 재고", value: formatWon(v.avgInventory), strong: true, note: "(기초 + 기말) ÷ 2" },
                    { label: `${pl} 매출원가`, value: formatWon(v.cogs) },
                    { label: "재고 회전율", value: `${formatNumber(v.turnover, 2)}회`, strong: true },
                    { label: "재고 회전일수", value: `${formatNumber(v.days, 1)}일`, strong: true },
                  ]}
                />
                <Formula
                  lines={[
                    "평균 재고 = (기초 재고 + 기말 재고) ÷ 2",
                    `= (${formatWon(v.beginInventory)} + ${formatWon(v.endInventory)}) ÷ 2 = ${formatWon(v.avgInventory)}`,
                    `회전율 = 매출원가 ÷ 평균 재고 = ${formatWon(v.cogs)} ÷ ${formatWon(v.avgInventory)} ≈ ${formatNumber(v.turnover, 2)}회`,
                    `회전일수 = 기간 일수 ÷ 회전율 = ${v.periodDays}일 ÷ ${formatNumber(v.turnover, 2)} ≈ ${formatNumber(v.days, 1)}일`,
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            checkedAt={CHECKED_AT}
            items={[
              "기간 일수는 월 30일, 분기 91일, 연 365일로 계산해요.",
              "재고와 매출원가는 모두 원가 기준으로 입력해야 해요. 판매가 기준 매출을 넣으면 회전율이 부풀려져요.",
              "평균 재고는 기초·기말 두 시점만 평균해요. 기간 중 재고가 크게 오르내렸다면 실제와 차이가 날 수 있어요.",
              "연 환산 회전율은 같은 속도가 1년 내내 이어진다고 가정한 값이에요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="재고 회전율 계산 결과"
              description={`${pl} 회전율 ${formatNumber(result.value.turnover, 2)}회 · 회전일수 ${formatNumber(result.value.days, 1)}일`}
              buildUrl={buildUrl}
              sharedFields={["계산 기간", "매출원가", "기초 재고", "기말 재고"]}
            />
          )}
        </>
      }
    />
  );
}
