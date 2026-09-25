"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { CheckboxField, FieldGrid, InputCard, NumberField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { startupRunway } from "@/lib/calc/startupRunway";
import { formatNumber, formatWon, parseNumber } from "@/lib/calc/num";
import { RUNWAY_WARN_MONTHS } from "@/lib/calc/rates/storeCosts";

const DEFAULTS = {
  cash: "",
  emergency: "",
  deposit: "",
  depositInCash: "",
  pending: "",
  loss: "",
  living: "",
  principal: "",
  income: "",
};
type State = typeof DEFAULTS;
const SHARE_KEYS = Object.keys(DEFAULTS) as (keyof State)[];

export function StartupRunwayCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const depositInCash = s.depositInCash === "1";

  const result = useMemo(
    () =>
      startupRunway({
        cash: parseNumber(s.cash),
        emergency: parseNumber(s.emergency),
        lockedDeposit: parseNumber(s.deposit),
        depositInCash,
        pendingStartupCost: parseNumber(s.pending),
        monthlyLoss: parseNumber(s.loss),
        living: parseNumber(s.living),
        loanPrincipal: parseNumber(s.principal),
        otherIncome: parseNumber(s.income),
      }),
    [s, depositInCash],
  );

  return (
    <CalcColumns
      inputs={
        <>
          <InputCard title="지금 가진 돈">
            <NumberField label="보유 현금" value={s.cash} onChange={set("cash")} placeholder="50,000,000" error={issueFor(result, "cash")} help="지금 바로 꺼내 쓸 수 있는 통장·현금 합계" />
            <FieldGrid>
              <NumberField label="남겨 둘 비상금" optional value={s.emergency} onChange={set("emergency")} placeholder="5,000,000" error={issueFor(result, "emergency")} help="가족 생계·긴급 상황용으로 손대지 않을 돈" />
              <NumberField label="아직 안 쓴 창업비" optional value={s.pending} onChange={set("pending")} placeholder="0" error={issueFor(result, "pendingStartupCost")} help="인테리어 잔금처럼 곧 나갈 소모성 비용" />
            </FieldGrid>
            <NumberField label="잠긴 보증금" optional value={s.deposit} onChange={set("deposit")} placeholder="30,000,000" error={issueFor(result, "lockedDeposit")} help="계약이 끝나야 돌려받는 돈이라 버티는 데 쓸 수 없어요. 계산에 넣지 않고 참고로만 보여 줘요." />
            <CheckboxField
              label="이 보증금은 아직 안 내서 보유 현금 안에 들어 있어요"
              checked={depositInCash}
              onChange={(c) => set("depositInCash")(c ? "1" : "")}
              help="체크하면 곧 묶일 돈이므로 보유 현금에서 빼고 계산해요."
            />
          </InputCard>
          <InputCard title="매달 나가고 들어오는 돈">
            <FieldGrid>
              <NumberField label="월 영업 적자" value={s.loss} onChange={set("loss")} placeholder="2,000,000" error={issueFor(result, "monthlyLoss")} help="매출 − 모든 영업비용(이자 포함). 흑자라면 0을 넣고 흑자액은 다른 수입에 적으세요." />
              <NumberField label="월 생활비" optional value={s.living} onChange={set("living")} placeholder="2,500,000" error={issueFor(result, "living")} />
              <NumberField label="월 대출 원금 상환" optional value={s.principal} onChange={set("principal")} placeholder="500,000" error={issueFor(result, "loanPrincipal")} help="이자가 아닌 원금 부분만" />
              <NumberField label="월 다른 수입" optional value={s.income} onChange={set("income")} placeholder="0" error={issueFor(result, "otherIncome")} help="배우자 소득·부업·영업 흑자 등" />
            </FieldGrid>
          </InputCard>
        </>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="보유 현금과 월 영업 적자를 입력하면 버틸 수 있는 기간이 나와요.">
            {(v) => (
              <>
                {v.status === "runway" && (
                  <Headline
                    label="버틸 수 있는 기간"
                    value={`${formatNumber(v.months1, 1)}개월`}
                    sub={`온전히 ${formatNumber(v.wholeMonths)}개월 버티고 ${formatWon(v.leftover)}이 남아요 · 소수 첫째 자리 버림`}
                    tone={(v.months1 ?? 0) < RUNWAY_WARN_MONTHS.value.months ? "bad" : "good"}
                  />
                )}
                {v.status === "stable" && (
                  <Headline label="버틸 수 있는 기간" value="현금이 줄지 않음" sub={v.burn === 0 ? "매달 들어오는 돈과 나가는 돈이 같아 현금이 그대로 유지돼요" : `다른 수입이 지출보다 많아 매달 ${formatWon(-v.burn)}씩 늘어나요`} tone="good" />
                )}
                {v.status === "short" && (
                  <Headline label="가용 현금" value="이미 부족" sub={`비상금·예정 지출을 빼면 ${formatWon(-v.available)}이 모자라요`} tone="bad" />
                )}
                <StatGrid
                  items={[
                    { label: "가용 현금", value: formatWon(v.available), tone: v.available <= 0 ? "bad" : "default" },
                    { label: "월 순현금 감소", value: formatWon(v.burn), tone: v.burn > 0 ? "warn" : "good" },
                    { label: "잠긴 보증금 (제외)", value: formatWon(v.lockedDeposit) },
                  ]}
                />
                <Breakdown
                  title="가용 현금 계산"
                  rows={[
                    { label: "보유 현금", value: formatWon(v.cash) },
                    { label: "− 비상금", value: formatWon(-v.emergency) },
                    { label: "− 아직 안 쓴 창업비", value: formatWon(-v.pendingStartupCost) },
                    ...(v.depositDeducted > 0 ? [{ label: "− 곧 낼 보증금", value: formatWon(-v.depositDeducted) }] : []),
                    { label: "가용 현금", value: formatWon(v.available), strong: true, tone: v.available <= 0 ? ("bad" as const) : ("default" as const) },
                  ]}
                />
                <Breakdown
                  title="월 순현금 감소 계산"
                  rows={[
                    { label: "월 영업 적자", value: formatWon(v.monthlyLoss) },
                    { label: "+ 월 생활비", value: formatWon(v.living) },
                    { label: "+ 월 대출 원금 상환", value: formatWon(v.loanPrincipal) },
                    { label: "− 월 다른 수입", value: formatWon(-v.otherIncome) },
                    { label: "월 순현금 감소", value: formatWon(v.burn), strong: true },
                  ]}
                />
                <Formula
                  lines={[
                    "가용 현금 = 보유 현금 − 비상금 − 아직 안 쓴 창업비" + (v.depositDeducted > 0 ? " − 곧 낼 보증금" : ""),
                    "월 순현금 감소 = 영업 적자 + 생활비 + 원금 상환 − 다른 수입",
                    v.status === "runway"
                      ? `버틸 기간 = ${formatWon(v.available)} ÷ ${formatWon(v.burn)} ≈ ${formatNumber(v.months1, 1)}개월`
                      : "버틸 기간 = 가용 현금 ÷ 월 순현금 감소 (감소가 0 이하이거나 가용 현금이 없으면 계산하지 않음)",
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            sources={[RUNWAY_WARN_MONTHS]}
            items={[
              "매달 적자·생활비가 일정하다고 가정해요. 실제로는 성수기·비수기에 따라 달라져요.",
              "잠긴 보증금은 계약이 끝나야 돌려받는 돈이라 가용 현금에 넣지 않아요.",
              "대출 이자는 영업 적자 안에 포함돼 있다고 보고, 원금 상환만 따로 더해요.",
              "세금 납부(부가세·종합소득세)처럼 몰아서 나가는 돈은 비상금이나 남은 창업비에 반영해 두세요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="창업 생존기간 계산 결과"
              description={
                result.value.status === "runway"
                  ? `버틸 수 있는 기간 약 ${formatNumber(result.value.months1, 1)}개월`
                  : result.value.status === "stable"
                    ? "현금이 줄지 않는 구조예요"
                    : "가용 현금이 이미 부족해요"
              }
              buildUrl={buildUrl}
              sharedFields={["보유 현금", "비상금", "잠긴 보증금", "아직 안 쓴 창업비", "월 영업 적자", "월 생활비", "월 대출 원금 상환", "월 다른 수입"]}
            />
          )}
        </>
      }
    />
  );
}
