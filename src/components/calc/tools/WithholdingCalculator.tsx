"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { FieldGrid, InputCard, NumberField, Segmented, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { calcDaily, calcFreelancer, dailyExemptCeiling } from "@/lib/calc/withholding";
import { formatNumber, formatPercent, formatWon, parseNumber } from "@/lib/calc/num";
import { EMPLOYMENT_INSURANCE, WITHHOLDING } from "@/lib/calc/rates";
import { TAX_TRUNCATION } from "@/lib/calc/rates/laborTax";

type Mode = "freelancer" | "daily";

const DEFAULTS = { mode: "freelancer" as Mode as string, gross: "", dailyWage: "", days: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["mode", "gross", "dailyWage", "days"];
const W = WITHHOLDING.value;
const D = W.daily;
const BIZ_TOTAL = W.businessRate * (1 + W.localRatio);
const EXEMPT_CEILING = dailyExemptCeiling();
const UNIT = TAX_TRUNCATION.value.unit;
const SMALL = formatWon(D.smallAmountThreshold);

export function WithholdingCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const mode = (s.mode === "daily" ? "daily" : "freelancer") as Mode;

  const free = useMemo(() => calcFreelancer({ gross: parseNumber(s.gross) }), [s.gross]);
  const daily = useMemo(() => calcDaily({ dailyWage: parseNumber(s.dailyWage), days: parseNumber(s.days) }), [s.dailyWage, s.days]);
  const active = mode === "freelancer" ? free : daily;

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <Segmented
            label="소득 종류"
            value={mode}
            onChange={set("mode")}
            options={[
              { value: "freelancer", label: `프리랜서 ${formatPercent(BIZ_TOTAL, 1)}` },
              { value: "daily", label: "일용직" },
            ]}
          />
          {mode === "freelancer" ? (
            <NumberField
              label="세전 지급액"
              value={s.gross}
              onChange={set("gross")}
              placeholder="1,000,000"
              error={issueFor(active, "gross")}
              presets={[500_000, 1_000_000, 3_000_000].map((v) => ({ label: `${v / 10_000}만 원`, value: v }))}
              help="강사료·디자인·촬영 등 사업자등록 없는 개인에게 주는 용역비"
            />
          ) : (
            <FieldGrid>
              <NumberField
                label="일당"
                value={s.dailyWage}
                onChange={set("dailyWage")}
                placeholder="200,000"
                error={issueFor(active, "dailyWage")}
                presets={[150_000, 200_000, 250_000].map((v) => ({ label: `${v / 10_000}만`, value: v }))}
                help="하루 세전 지급액"
              />
              <NumberField
                label="근무일수"
                unit="일"
                value={s.days}
                onChange={set("days")}
                placeholder="5"
                error={issueFor(active, "days")}
                presets={[1, 5, 20].map((v) => ({ label: `${v}일`, value: v }))}
              />
            </FieldGrid>
          )}
        </InputCard>
      }
      result={
        <>
          {mode === "freelancer" ? (
            <ResultPanel result={free} emptyHint="세전 지급액을 입력하면 떼어야 할 세금과 실지급액이 나와요.">
              {(v) => (
                <>
                  <Headline label="실지급액" value={formatWon(v.net)} sub={`원천징수 합계 ${formatWon(v.totalTax)} (${formatPercent(v.effectiveRate, 2)})`} tone="good" />
                  <StatGrid
                    items={[
                      { label: "소득세", value: formatWon(v.incomeTax), sub: formatPercent(W.businessRate, 1) },
                      { label: "지방소득세", value: formatWon(v.localTax), sub: `소득세의 ${formatPercent(W.localRatio, 0)}` },
                      { label: "원천징수 합계", value: formatWon(v.totalTax) },
                    ]}
                  />
                  <Breakdown
                    rows={[
                      { label: "세전 지급액", value: formatWon(v.gross) },
                      { label: "소득세", value: formatWon(-v.incomeTax), note: `${UNIT}원 미만 절사` },
                      { label: "지방소득세", value: formatWon(-v.localTax), note: `${UNIT}원 미만 절사` },
                      { label: "실지급액", value: formatWon(v.net), strong: true },
                    ]}
                  />
                  <Formula
                    lines={[
                      `소득세 = ${formatWon(v.gross)} × ${formatPercent(W.businessRate, 1)} → ${formatWon(v.incomeTax)}`,
                      `지방소득세 = ${formatWon(v.incomeTax)} × ${formatPercent(W.localRatio, 0)} → ${formatWon(v.localTax)}`,
                      `실지급액 = ${formatWon(v.gross)} − ${formatWon(v.totalTax)} = ${formatWon(v.net)}`,
                    ]}
                  />
                  <p className="rounded-xl bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-800 ring-1 ring-sky-100">
                    {`2024년 7월 1일 지급분부터 프리랜서(인적용역) 소득은 세금이 ${SMALL} 미만이어도 떼야 해요. 예전처럼 소액부징수가 적용되지 않아요.`}
                  </p>
                </>
              )}
            </ResultPanel>
          ) : (
            <ResultPanel result={daily} emptyHint="일당과 근무일수를 입력하면 일용직 원천세가 계산돼요.">
              {(v) => (
                <>
                  <Headline
                    label={`실지급액 (${formatNumber(v.days)}일)`}
                    value={formatWon(v.net)}
                    sub={v.smallAmountExempt ? `1일 소득세가 ${SMALL} 미만이라 떼는 세금이 없어요 (소액부징수)` : `하루 세금 ${formatWon(v.incomeTaxPerDay + v.localTaxPerDay)}`}
                    tone="good"
                  />
                  <StatGrid
                    items={[
                      { label: "소득세 합계", value: formatWon(v.incomeTax), sub: `1일 ${formatWon(v.incomeTaxPerDay)}` },
                      { label: "지방소득세 합계", value: formatWon(v.localTax), sub: `1일 ${formatWon(v.localTaxPerDay)}` },
                      { label: "1일 실지급액", value: formatWon(v.netPerDay) },
                    ]}
                  />
                  <Breakdown
                    title="1일 기준 계산 내역"
                    rows={[
                      { label: "일당", value: formatWon(v.dailyWage) },
                      { label: "근로소득공제", value: formatWon(-Math.min(v.dailyWage, v.deductionPerDay)), note: `1일 ${formatWon(D.deductionPerDay)}` },
                      { label: "과세 대상", value: formatWon(v.taxablePerDay) },
                      { label: `산출세액 (${formatPercent(D.rate, 0)})`, value: formatNumber(v.computedPerDay, 2) + "원", sub: true },
                      { label: `근로소득세액공제 (${formatPercent(D.taxCreditRatio, 0)})`, value: `−${formatNumber(v.creditPerDay, 2)}원`, sub: true },
                      {
                        label: "1일 소득세",
                        value: formatWon(v.incomeTaxPerDay),
                        note: v.smallAmountExempt ? `계산값 ${formatWon(v.incomeTaxPerDayBeforeExempt)} → 소액부징수로 0원` : `${UNIT}원 미만 절사`,
                      },
                      { label: "1일 지방소득세", value: formatWon(v.localTaxPerDay) },
                      { label: "1일 실지급액", value: formatWon(v.netPerDay), strong: true },
                      { label: `총 지급액 (× ${formatNumber(v.days)}일)`, value: formatWon(v.gross) },
                      { label: "총 원천징수", value: formatWon(-v.totalTax) },
                      { label: "총 실지급액", value: formatWon(v.net), strong: true },
                    ]}
                  />
                  <Formula
                    lines={[
                      `1일 소득세 = (${formatWon(v.dailyWage)} − ${formatWon(D.deductionPerDay)}) × ${formatPercent(D.rate, 0)} × (1 − ${formatPercent(D.taxCreditRatio, 0)})`,
                      `= ${formatWon(v.taxablePerDay)} × ${formatPercent(D.rate * (1 - D.taxCreditRatio), 1)} → ${formatWon(v.incomeTaxPerDayBeforeExempt)}`,
                      `1일 지방소득세 = 1일 소득세 × ${formatPercent(W.localRatio, 0)}`,
                      `일당 ${formatWon(EXEMPT_CEILING)} 이하 → 소액부징수(세금 0원)`,
                    ]}
                  />
                </>
              )}
            </ResultPanel>
          )}
          <Assumptions
            sources={[WITHHOLDING, TAX_TRUNCATION]}
            items={[
              `소득세와 지방소득세는 각각 ${UNIT}원 미만을 버렸어요(국고금 끝수 처리). 프로그램에 따라 원 미만만 버려 몇 원 차이가 날 수 있어요.`,
              `일용직은 매일 같은 일당을 받는다고 보고 1일 세금을 먼저 구한 뒤 근무일수를 곱했어요. 소액부징수(${SMALL} 미만)도 하루 단위로 판단했어요.`,
              `일용직 고용보험(${formatPercent(EMPLOYMENT_INSURANCE.value.employee, 1)}) 등 4대보험 공제는 포함하지 않았어요.`,
              "프리랜서 3.3%는 원천징수(미리 떼는 세금)일 뿐이에요. 다음 해 5월 종합소득세 신고 때 실제 세금과 정산돼요.",
            ]}
          />
          {active.status === "ok" && (
            <ShareBar
              title="원천세 계산 결과"
              description={mode === "freelancer" ? `프리랜서 실지급액 ${free.status === "ok" ? formatWon(free.value.net) : ""}` : `일용직 실지급액 ${daily.status === "ok" ? formatWon(daily.value.net) : ""}`}
              buildUrl={buildUrl}
              sharedFields={mode === "freelancer" ? ["소득 종류", "세전 지급액"] : ["소득 종류", "일당", "근무일수"]}
            />
          )}
        </>
      }
    />
  );
}
