"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { InputCard, NumberField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { rentRatio } from "@/lib/calc/rentRatio";
import { formatPercent, formatWon, parseNumber } from "@/lib/calc/num";
import { RENT_BURDEN_BANDS } from "@/lib/calc/rates/storeCosts";

const DEFAULTS = { sales: "", rent: "", maint: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["sales", "rent", "maint"];

const BAND_RANGES = (() => {
  const bands = RENT_BURDEN_BANDS.value.bands;
  return bands.map((b, i) => {
    const lo = i === 0 ? null : bands[i - 1].max;
    const p = (n: number) => `${Math.round(n * 100)}%`;
    const range = lo == null ? `${p(b.max ?? 0)} 이하` : b.max == null ? `${p(lo)} 초과` : `${p(lo)} 초과 ~ ${p(b.max)}`;
    return { ...b, range };
  });
})();

export function RentRatioCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);

  const result = useMemo(
    () => rentRatio({ sales: parseNumber(s.sales), rent: parseNumber(s.rent), maintenance: parseNumber(s.maint) }),
    [s.sales, s.rent, s.maint],
  );

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <NumberField label="월 매출" value={s.sales} onChange={set("sales")} placeholder="30,000,000" error={issueFor(result, "sales")} help="카드·현금·배달 매출을 합친 한 달 매출 (부가세 포함 기준 권장)" />
          <NumberField label="월 임대료" value={s.rent} onChange={set("rent")} placeholder="3,000,000" error={issueFor(result, "rent")} help="매달 내는 월세" />
          <NumberField label="월 관리비" optional value={s.maint} onChange={set("maint")} placeholder="300,000" error={issueFor(result, "maintenance")} help="건물 관리비·공용 전기료 등. 넣으면 실제 점유비용 기준으로 진단해요." />
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="월 매출과 임대료를 입력하면 임대료 비율과 부담 구간이 나와요.">
            {(v) => (
              <>
                <Headline
                  label="임대료 비율 (관리비 포함)"
                  value={formatPercent(v.ratio, 1)}
                  sub={`부담 구간: ${v.band.label} — ${v.band.note}`}
                  tone={v.band.tone}
                />
                <StatGrid
                  items={[
                    { label: "임대료만 비율", value: formatPercent(v.rentOnlyRatio, 1) },
                    { label: "월 점유비용", value: formatWon(v.occupancy) },
                    { label: "부담 구간", value: v.band.label, tone: v.band.tone },
                  ]}
                />
                <Breakdown
                  rows={[
                    { label: "월 매출", value: formatWon(v.sales) },
                    { label: "월 임대료", value: formatWon(v.rent) },
                    { label: "월 관리비", value: formatWon(v.maintenance) },
                    { label: "점유비용 = 임대료 + 관리비", value: formatWon(v.occupancy), strong: true },
                    {
                      label: `${BAND_RANGES[0].label} 구간(${Math.round(v.goodMax * 100)}% 이하)에 필요한 매출`,
                      value: formatWon(v.salesForGood),
                      note: v.sales >= v.salesForGood ? "이미 도달했어요" : `지금보다 ${formatWon(v.salesForGood - v.sales)} 더 필요 · 원 단위 올림`,
                    },
                  ]}
                />
                <Breakdown
                  title="부담 구간 기준 (참고용)"
                  rows={BAND_RANGES.map((b) => ({
                    label: `${b.label}${b.key === v.band.key ? " ← 현재" : ""}`,
                    value: b.range,
                    strong: b.key === v.band.key,
                    tone: b.key === v.band.key ? b.tone : "default",
                  }))}
                />
                <Formula
                  lines={[
                    "임대료 비율 = (임대료 + 관리비) ÷ 월 매출",
                    `= (${formatWon(v.rent)} + ${formatWon(v.maintenance)}) ÷ ${formatWon(v.sales)} = ${formatPercent(v.ratio, 2)}`,
                    `임대료만 비율 = ${formatWon(v.rent)} ÷ ${formatWon(v.sales)} = ${formatPercent(v.rentOnlyRatio, 2)}`,
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            sources={[RENT_BURDEN_BANDS]}
            items={[
              "부담 구간(10·15·20%)은 흔히 쓰이는 참고 기준일 뿐 법이나 공식 기준이 아니에요.",
              "매출과 임대료는 부가세 기준(포함 또는 별도)을 맞춰 입력했다고 가정해요.",
              "계절에 따라 매출이 크게 달라진다면 비수기 매출로도 한 번 더 계산해 보세요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="임대료 비율 계산 결과"
              description={`매출 대비 임대료 ${formatPercent(result.value.ratio)} (${result.value.band.label})`}
              buildUrl={buildUrl}
              sharedFields={["월 매출", "월 임대료", "월 관리비"]}
            />
          )}
        </>
      }
    />
  );
}
