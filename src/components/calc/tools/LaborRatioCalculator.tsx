"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { CheckboxField, InputCard, NumberField, SelectField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { calcLaborRatio } from "@/lib/calc/laborRatio";
import { DEFAULT_EMPLOYER_SIZE_KEY, DEFAULT_INDUSTRY_KEY } from "@/lib/calc/socialInsurance";
import { formatPercent, formatWon, parseNumber } from "@/lib/calc/num";
import { EMPLOYMENT_INSURANCE, HEALTH_INSURANCE, INDUSTRIAL_ACCIDENT, LONG_TERM_CARE, NATIONAL_PENSION } from "@/lib/calc/rates";
import { LABOR_RATIO_BANDS } from "@/lib/calc/rates/laborTax";

const DEFAULTS = { sales: "", payroll: "", owner: "", ins: "1", industry: DEFAULT_INDUSTRY_KEY, size: DEFAULT_EMPLOYER_SIZE_KEY };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["sales", "payroll", "owner", "ins", "industry", "size"];

const BAND_SUMMARY = LABOR_RATIO_BANDS.value
  .filter((b) => Number.isFinite(b.max))
  .map((b) => `${formatPercent(b.max, 0)} 이하 ${b.label}`)
  .join(" · ");

const BAND_STYLE: Record<string, string> = {
  good: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  normal: "bg-sky-100 text-sky-800 ring-sky-300",
  caution: "bg-amber-100 text-amber-800 ring-amber-300",
  danger: "bg-rose-100 text-rose-700 ring-rose-300",
};

function bandRange(i: number): string {
  const bands = LABOR_RATIO_BANDS.value;
  const b = bands[i];
  if (i === 0) return `${formatPercent(b.max, 0)} 이하`;
  if (!Number.isFinite(b.max)) return `${formatPercent(bands[i - 1].max, 0)} 초과`;
  return `~${formatPercent(b.max, 0)}`;
}

function BandScale({ active }: { active: string }) {
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label="인건비 비율 진단 구간">
      {LABOR_RATIO_BANDS.value.map((b, i) => {
        const on = b.key === active;
        return (
          <li
            key={b.key}
            aria-current={on ? "true" : undefined}
            className={`rounded-lg px-1.5 py-2 text-center text-xs ${on ? `font-bold ring-2 ${BAND_STYLE[b.key]}` : "bg-slate-50 text-slate-400"}`}
          >
            <span className="block">{b.label}</span>
            <span className="num block text-[11px]">{bandRange(i)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function LaborRatioCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const withIns = s.ins === "1";

  const result = useMemo(
    () =>
      calcLaborRatio({
        monthlySales: parseNumber(s.sales),
        staffPayroll: parseNumber(s.payroll),
        ownerPay: parseNumber(s.owner),
        includeEmployerInsurance: withIns,
        industryKey: s.industry,
        employerSizeKey: s.size,
      }),
    [s.sales, s.payroll, s.owner, withIns, s.industry, s.size],
  );

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <NumberField label="월 매출" value={s.sales} onChange={set("sales")} placeholder="30,000,000" error={issueFor(result, "monthlySales")} help="부가세 포함 여부는 평소 보시는 기준 그대로 넣으세요" />
          <NumberField label="직원 급여 합계 (월)" value={s.payroll} onChange={set("payroll")} placeholder="6,000,000" error={issueFor(result, "staffPayroll")} help="아르바이트 포함 모든 직원의 세전 급여 합계" />
          <NumberField label="사장님 인건비 (월)" optional value={s.owner} onChange={set("owner")} placeholder="0" error={issueFor(result, "ownerPay")} help="사장님이 직접 일하는 몫을 월급으로 치면 얼마인지" />
          <CheckboxField label="사업주 4대보험 부담 포함" checked={withIns} onChange={(on) => set("ins")(on ? "1" : "")} help="직원 급여 합계에 사업주 요율을 곱해 더해요 (근사치)" />
          {withIns && (
            <>
              <SelectField
                label="업종 (산재보험료율)"
                value={s.industry}
                onChange={set("industry")}
                options={INDUSTRIAL_ACCIDENT.value.byIndustry.map((i) => ({ value: i.key, label: `${i.label} · ${formatPercent(i.rate, 2)}` }))}
              />
              <SelectField
                label="상시 근로자 수"
                value={s.size}
                onChange={set("size")}
                options={EMPLOYMENT_INSURANCE.value.employerStability.map((i) => ({ value: i.key, label: i.label }))}
              />
            </>
          )}
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="월 매출과 직원 급여 합계를 입력하면 인건비 비율을 진단해 드려요.">
            {(v) => (
              <>
                <Headline
                  label="매출 대비 인건비 비율"
                  value={formatPercent(v.ratio, 1)}
                  sub={`${v.band.label} — ${v.band.message}`}
                  tone={v.band.tone}
                />
                <BandScale active={v.band.key} />
                <StatGrid
                  items={[
                    { label: "총 인건비", value: formatWon(v.totalLabor) },
                    { label: "직원 인건비만", value: formatPercent(v.staffRatio, 1), sub: "사장님 인건비 제외" },
                    ...(v.salesForBetterBand
                      ? [{ label: `'${v.salesForBetterBand.label}' 구간 매출`, value: formatWon(v.salesForBetterBand.sales), sub: "인건비가 그대로일 때" }]
                      : []),
                  ]}
                />
                <Breakdown
                  rows={[
                    { label: "직원 급여 합계", value: formatWon(v.staffPayroll) },
                    {
                      label: "사업주 4대보험 부담",
                      value: formatWon(v.employerInsurance),
                      note: withIns ? `급여 합계 × ${formatPercent(v.employerRate, 2)} (근사)` : "포함 안 함",
                    },
                    { label: "사장님 인건비", value: formatWon(v.ownerPay) },
                    { label: "총 인건비", value: formatWon(v.totalLabor), strong: true },
                    { label: "월 매출", value: formatWon(v.monthlySales) },
                    { label: "인건비 비율", value: formatPercent(v.ratio, 2), strong: true, tone: v.band.tone },
                  ]}
                />
                <Formula
                  lines={[
                    "인건비 비율 = 총 인건비 ÷ 월 매출",
                    `= ${formatWon(v.totalLabor)} ÷ ${formatWon(v.monthlySales)} = ${formatPercent(v.ratio, 2)}`,
                    ...(withIns ? [`사업주 4대보험 ≈ ${formatWon(v.staffPayroll)} × ${formatPercent(v.employerRate, 2)}`] : []),
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            sources={[LABOR_RATIO_BANDS, ...(withIns ? [NATIONAL_PENSION, HEALTH_INSURANCE, LONG_TERM_CARE, EMPLOYMENT_INSURANCE, INDUSTRIAL_ACCIDENT] : [])]}
            items={[
              `진단 구간(${BAND_SUMMARY})은 업계에서 흔히 쓰는 참고 기준일 뿐, 법이나 공식 통계가 아니에요.`,
              "사업주 4대보험은 급여 합계를 한 사람 급여처럼 보고 요율만 곱한 근사치예요. 국민연금 상·하한, 10원 절사, 가입 제외자는 반영하지 않았어요.",
              "사장님 인건비에는 4대보험을 더하지 않았어요.",
              "퇴직금 적립분(연봉의 약 1/12), 식대·복리후생비는 포함하지 않았어요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="인건비 비율 진단"
              description={`인건비 비율 ${formatPercent(result.value.ratio)} (${result.value.band.label})`}
              buildUrl={buildUrl}
              sharedFields={["월 매출", "직원 급여 합계", "사장님 인건비", "4대보험 포함 여부", "업종", "근로자 수"]}
            />
          )}
        </>
      }
    />
  );
}
