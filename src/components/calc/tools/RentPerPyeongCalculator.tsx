"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { InputCard, NumberField, Segmented, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { rentPerPyeong, type AreaUnit } from "@/lib/calc/rentPerPyeong";
import { formatNumber, formatWon, parseNumber } from "@/lib/calc/num";
import { AREA } from "@/lib/calc/rates";

const DEFAULTS = { unit: "pyeong" as AreaUnit as string, area: "", rent: "", maint: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["unit", "area", "rent", "maint"];

export function RentPerPyeongCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const unit: AreaUnit = s.unit === "m2" ? "m2" : "pyeong";
  const unitLabel = unit === "m2" ? "㎡" : "평";

  const result = useMemo(
    () => rentPerPyeong({ unit, area: parseNumber(s.area), rent: parseNumber(s.rent), maintenance: parseNumber(s.maint) }),
    [unit, s.area, s.rent, s.maint],
  );
  const hasMaint = result.status === "ok" && result.value.maintenance > 0;

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <Segmented
            label="면적 단위"
            value={unit}
            onChange={set("unit")}
            options={[
              { value: "pyeong", label: "평" },
              { value: "m2", label: "㎡ (제곱미터)" },
            ]}
          />
          <NumberField
            label="전용 면적"
            unit={unitLabel}
            allowDecimal
            value={s.area}
            onChange={set("area")}
            placeholder={unit === "m2" ? "66.12" : "20"}
            error={issueFor(result, "area")}
            presets={(unit === "m2" ? [33, 50, 66, 100] : [10, 15, 20, 30]).map((v) => ({ label: `${v}${unitLabel}`, value: v }))}
            help="계약서·건축물대장의 면적. 전용과 공용 포함(계약) 면적 중 무엇인지 확인하세요."
          />
          <NumberField label="월세" value={s.rent} onChange={set("rent")} placeholder="2,000,000" error={issueFor(result, "rent")} />
          <NumberField label="월 관리비" optional value={s.maint} onChange={set("maint")} placeholder="200,000" error={issueFor(result, "maintenance")} help="넣으면 관리비 포함 평당 금액도 함께 보여 줘요." />
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="면적과 월세를 입력하면 평당·㎡당 임대료가 나와요.">
            {(v) => (
              <>
                <Headline label="평당 월 임대료" value={formatWon(v.rentPerPyeong)} sub={`㎡당 ${formatWon(v.rentPerM2)} · 원 단위 반올림 표시`} tone="good" />
                <StatGrid
                  items={[
                    { label: "면적 (평)", value: `${formatNumber(v.pyeong, 2)}평` },
                    { label: "면적 (㎡)", value: `${formatNumber(v.m2, 2)}㎡` },
                    { label: "㎡당 월 임대료", value: formatWon(v.rentPerM2) },
                    ...(hasMaint
                      ? [
                          { label: "평당 (관리비 포함)", value: formatWon(v.totalPerPyeong) },
                          { label: "㎡당 (관리비 포함)", value: formatWon(v.totalPerM2) },
                        ]
                      : []),
                  ]}
                />
                <Breakdown
                  rows={[
                    { label: "입력 면적", value: unit === "m2" ? `${formatNumber(v.m2, 2)}㎡` : `${formatNumber(v.pyeong, 2)}평` },
                    {
                      label: unit === "m2" ? "평 환산 = ㎡ ÷ 환산값" : "㎡ 환산 = 평 × 환산값",
                      value: unit === "m2" ? `${formatNumber(v.pyeong, 2)}평` : `${formatNumber(v.m2, 2)}㎡`,
                      note: `1평 = ${v.m2PerPyeong}㎡`,
                    },
                    { label: "월세", value: formatWon(v.rent) },
                    { label: "평당 월세", value: formatWon(v.rentPerPyeong), strong: true },
                    { label: "㎡당 월세", value: formatWon(v.rentPerM2) },
                    ...(hasMaint
                      ? [
                          { label: "월세 + 관리비", value: formatWon(v.rent + v.maintenance) },
                          { label: "평당 (관리비 포함)", value: formatWon(v.totalPerPyeong), strong: true },
                        ]
                      : []),
                  ]}
                />
                <Formula
                  lines={[
                    `1평 = ${v.m2PerPyeong}㎡`,
                    `평당 임대료 = 월세 ÷ 평 = ${formatWon(v.rent)} ÷ ${formatNumber(v.pyeong, 2)}평 ≈ ${formatWon(v.rentPerPyeong)}`,
                    `㎡당 임대료 = 월세 ÷ ㎡ = ${formatWon(v.rent)} ÷ ${formatNumber(v.m2, 2)}㎡ ≈ ${formatWon(v.rentPerM2)}`,
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            sources={[AREA]}
            items={[
              "상가 면적은 전용면적과 계약(공용 포함)면적이 다를 수 있어요. 비교할 때는 같은 기준끼리 비교하세요.",
              "보증금은 반영하지 않았어요. 보증금이 크면 실제 부담은 더 클 수 있어요.",
              "평은 관례 단위이고 법정 단위는 ㎡예요. 환산값은 소수점 넷째 자리까지 사용해요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="평당 임대료 계산 결과"
              description={`평당 ${formatWon(result.value.rentPerPyeong)} · ㎡당 ${formatWon(result.value.rentPerM2)}`}
              buildUrl={buildUrl}
              sharedFields={["면적 단위", "면적", "월세", "월 관리비"]}
            />
          )}
        </>
      }
    />
  );
}
