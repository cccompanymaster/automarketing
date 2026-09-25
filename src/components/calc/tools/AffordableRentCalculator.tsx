"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { InputCard, NumberField, Segmented, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { affordableRent } from "@/lib/calc/affordableRent";
import { formatPercent, formatWon, parseNumber } from "@/lib/calc/num";
import { AFFORDABLE_RENT_PRESETS, RENT_BURDEN_BANDS } from "@/lib/calc/rates/storeCosts";

const DEFAULTS = { sales: "", target: "", basis: "separate", maint: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["sales", "target", "basis", "maint"];

export function AffordableRentCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const includeMaintenance = s.basis === "included";

  const result = useMemo(
    () =>
      affordableRent({
        sales: parseNumber(s.sales),
        targetPct: parseNumber(s.target),
        includeMaintenance,
        maintenance: parseNumber(s.maint),
      }),
    [s.sales, s.target, includeMaintenance, s.maint],
  );

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <NumberField label="예상 월매출" value={s.sales} onChange={set("sales")} placeholder="30,000,000" error={issueFor(result, "sales")} help="보수적으로 잡은 한 달 매출. 비수기 기준이면 더 안전해요." />
          <NumberField
            label="목표 임대료 비율"
            unit="%"
            value={s.target}
            onChange={set("target")}
            placeholder="12"
            error={issueFor(result, "targetPct")}
            presets={AFFORDABLE_RENT_PRESETS.value.ratiosPct.map((v) => ({ label: `${v}%`, value: v }))}
            help="매출 중 임대료로 쓸 수 있는 비율 (0% 초과 100% 미만)"
          />
          <Segmented
            label="관리비 처리"
            value={includeMaintenance ? "included" : "separate"}
            onChange={set("basis")}
            options={[
              { value: "separate", label: "관리비 별도" },
              { value: "included", label: "비율 안에 관리비 포함" },
            ]}
          />
          <NumberField
            label="월 관리비"
            optional
            value={s.maint}
            onChange={set("maint")}
            placeholder="300,000"
            error={issueFor(result, "maintenance")}
            help={includeMaintenance ? "목표 비율 예산에서 관리비를 빼고 남는 금액이 월세가 돼요." : "관리비 별도 기준에서는 차감하지 않고, 실제 총 부담만 함께 보여 줘요."}
          />
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="예상 월매출과 목표 비율을 입력하면 감당 가능한 월세가 나와요.">
            {(v) => (
              <>
                <Headline
                  label="감당 가능한 월세"
                  value={formatWon(v.rent)}
                  sub={v.includeMaintenance ? `관리비 ${formatWon(v.maintenance)} 포함 매출의 ${v.targetPct}% 이내 · 원 단위 절사` : `관리비 별도 · 매출의 ${v.targetPct}% · 원 단위 절사`}
                  tone="good"
                />
                <StatGrid
                  items={[
                    { label: "점유비용 예산", value: formatWon(v.budget) },
                    { label: "매달 총 부담", value: formatWon(v.totalOutlay), sub: "월세 + 관리비" },
                    { label: "총 부담 비율", value: formatPercent(v.totalRatio, 1) },
                  ]}
                />
                <Breakdown
                  rows={[
                    { label: "예상 월매출", value: formatWon(v.sales) },
                    { label: `× 목표 비율 ${v.targetPct}%`, value: formatWon(v.budget), note: "점유비용 예산" },
                    ...(v.includeMaintenance ? [{ label: "− 월 관리비", value: formatWon(-v.maintenance) }] : []),
                    { label: "감당 가능한 월세", value: formatWon(v.rent), strong: true },
                    ...(!v.includeMaintenance && v.maintenance > 0 ? [{ label: "+ 별도 관리비", value: formatWon(v.maintenance), note: "실제로는 이만큼 더 나가요" }] : []),
                  ]}
                />
                <Breakdown
                  title="비율별 감당 가능한 월세"
                  rows={v.table.map((t) => ({
                    label: `매출의 ${t.pct}%`,
                    value: formatWon(t.rent),
                    strong: t.pct === v.targetPct,
                  }))}
                />
                <Formula
                  lines={[
                    v.includeMaintenance ? "감당 가능한 월세 = 월매출 × 목표 비율 − 관리비" : "감당 가능한 월세 = 월매출 × 목표 비율",
                    v.includeMaintenance
                      ? `= ${formatWon(v.sales)} × ${v.targetPct}% − ${formatWon(v.maintenance)} = ${formatWon(v.rent)}`
                      : `= ${formatWon(v.sales)} × ${v.targetPct}% = ${formatWon(v.rent)}`,
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            sources={[AFFORDABLE_RENT_PRESETS, RENT_BURDEN_BANDS]}
            items={[
              "목표 비율은 업종·마진 구조에 따라 달라요. 마진이 낮은 업종은 더 낮게 잡는 편이 안전해요.",
              "보증금에 대한 기회비용·대출 이자는 포함하지 않았어요.",
              "예상 매출이 빗나가면 임대료 비율이 바로 올라가요. 매출은 보수적으로 넣으세요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="적정 임대료 계산 결과"
              description={`감당 가능한 월세 ${formatWon(result.value.rent)} (매출의 ${result.value.targetPct}%)`}
              buildUrl={buildUrl}
              sharedFields={["예상 월매출", "목표 임대료 비율", "관리비 처리", "월 관리비"]}
            />
          )}
        </>
      }
    />
  );
}
