"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { CheckboxField, InputCard, NumberField, SelectField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { calcPayroll, minimumMonthlyWage } from "@/lib/calc/payroll";
import { DEFAULT_EMPLOYER_SIZE_KEY, DEFAULT_INDUSTRY_KEY, INSURANCE_LABELS, type InsuranceItem, type InsuranceKey } from "@/lib/calc/socialInsurance";
import { formatPercent, formatWon, parseNumber } from "@/lib/calc/num";
import { EMPLOYMENT_INSURANCE, HEALTH_INSURANCE, INDUSTRIAL_ACCIDENT, LONG_TERM_CARE, NATIONAL_PENSION } from "@/lib/calc/rates";
import { INSURANCE_ROUNDING } from "@/lib/calc/rates/laborTax";

const MIN_MONTH = minimumMonthlyWage();
const WAGE_PRESETS = [
  { label: `${MIN_MONTH.year} 최저임금 월급`, value: MIN_MONTH.amount },
  { label: "250만 원", value: 2_500_000 },
  { label: "300만 원", value: 3_000_000 },
  { label: "400만 원", value: 4_000_000 },
];
const TOGGLES: InsuranceKey[] = ["pension", "health", "longTermCare", "employment", "industrial"];

const DEFAULTS = {
  wage: "",
  nonTaxable: "",
  industry: DEFAULT_INDUSTRY_KEY,
  size: DEFAULT_EMPLOYER_SIZE_KEY,
  pension: "1",
  health: "1",
  longTermCare: "1",
  employment: "1",
  industrial: "1",
};
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["wage", "nonTaxable", "industry", "size"];

const rateText = (r: number) => (r ? formatPercent(r, 4) : "—");

function InsuranceTable({ items, employeeTotal, employerTotal }: { items: InsuranceItem[]; employeeTotal: number; employerTotal: number }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800">항목별 보험료</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[20rem] text-sm">
          <caption className="sr-only">4대보험 항목별 근로자·사업주 부담</caption>
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th scope="col" className="py-2 pr-2 text-left font-semibold">항목</th>
              <th scope="col" className="py-2 px-2 text-right font-semibold">근로자</th>
              <th scope="col" className="py-2 pl-2 text-right font-semibold">사업주</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((i) => (
              <tr key={i.key} className={i.enabled ? "" : "text-slate-400"}>
                <th scope="row" className="py-2 pr-2 text-left font-normal text-slate-600">
                  {i.label}
                  <span className="block text-[11px] text-slate-400">
                    {i.enabled
                      ? i.key === "longTermCare"
                        ? `건강보험료의 ${formatPercent(i.employeeRate, 2)}`
                        : `${rateText(i.employeeRate)} / ${rateText(i.employerRate)}`
                      : "제외"}
                  </span>
                </th>
                <td className="num py-2 px-2 text-right">{i.key === "industrial" ? "—" : formatWon(i.employee)}</td>
                <td className="num py-2 pl-2 text-right">{formatWon(i.employer)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <th scope="row" className="py-2 pr-2 text-left text-slate-900">합계</th>
              <td className="num py-2 px-2 text-right">{formatWon(employeeTotal)}</td>
              <td className="num py-2 pl-2 text-right">{formatWon(employerTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PayrollCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);

  const result = useMemo(
    () =>
      calcPayroll({
        monthlyWage: parseNumber(s.wage),
        nonTaxable: parseNumber(s.nonTaxable),
        industryKey: s.industry,
        employerSizeKey: s.size,
        enabled: {
          pension: s.pension === "1",
          health: s.health === "1",
          longTermCare: s.longTermCare === "1",
          employment: s.employment === "1",
          industrial: s.industrial === "1",
        },
      }),
    [s],
  );

  return (
    <CalcColumns
      inputs={
        <>
          <InputCard>
            <NumberField label="세전 월급" value={s.wage} onChange={set("wage")} placeholder="2,500,000" error={issueFor(result, "monthlyWage")} presets={WAGE_PRESETS} help="기본급과 매달 받는 수당을 합친 금액" />
            <NumberField
              label="비과세 금액"
              optional
              value={s.nonTaxable}
              onChange={set("nonTaxable")}
              placeholder="0"
              error={issueFor(result, "nonTaxable")}
              help="식대 등 비과세 수당. 보험료 계산에서만 빠지고 지급액에는 그대로 포함돼요."
            />
          </InputCard>
          <InputCard title="사업장 정보">
            <SelectField
              label="업종 (산재보험료율)"
              value={s.industry}
              onChange={set("industry")}
              options={INDUSTRIAL_ACCIDENT.value.byIndustry.map((i) => ({ value: i.key, label: `${i.label} · ${formatPercent(i.rate, 2)}` }))}
              help="출퇴근재해 요율이 더해져요. 정확한 요율은 근로복지공단 고지서를 확인하세요."
            />
            <SelectField
              label="상시 근로자 수 (고용안정·직업능력개발)"
              value={s.size}
              onChange={set("size")}
              options={EMPLOYMENT_INSURANCE.value.employerStability.map((i) => ({ value: i.key, label: `${i.label} · ${formatPercent(i.rate, 2)}` }))}
            />
          </InputCard>
          <InputCard title="가입 항목">
            {TOGGLES.map((k) => (
              <CheckboxField
                key={k}
                label={INSURANCE_LABELS[k]}
                checked={s[k] === "1"}
                onChange={(on) => set(k)(on ? "1" : "")}
                help={
                  k === "pension"
                    ? "만 60세 이상이면 보통 제외돼요."
                    : k === "employment"
                      ? "만 65세 이후 새로 고용된 경우 등은 실업급여 부분이 제외될 수 있어요."
                      : undefined
                }
              />
            ))}
          </InputCard>
        </>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="세전 월급을 입력하면 4대보험 공제액과 사장님 부담이 계산돼요.">
            {(v) => (
              <>
                <Headline
                  label="4대보험 공제 후 금액"
                  value={formatWon(v.netPay)}
                  sub={
                    <>
                      근로자 부담 {formatWon(v.insurance.employeeTotal)} 공제 ·{" "}
                      <strong className="text-amber-700">소득세·지방소득세는 빠지지 않은 금액</strong>이에요
                    </>
                  }
                  tone="good"
                />
                <StatGrid
                  items={[
                    { label: "근로자 4대보험", value: formatWon(v.insurance.employeeTotal), sub: `월급의 ${formatPercent(v.employeeShareRate, 2)}` },
                    { label: "사업주 부담", value: formatWon(v.insurance.employerTotal), sub: `월급의 ${formatPercent(v.employerShareRate, 2)}` },
                    { label: "총 고용비용", value: formatWon(v.totalCost), tone: "warn", sub: "월급 + 사업주 부담" },
                  ]}
                />
                <InsuranceTable items={v.insurance.items} employeeTotal={v.insurance.employeeTotal} employerTotal={v.insurance.employerTotal} />
                <Breakdown
                  rows={[
                    { label: "세전 월급", value: formatWon(v.monthlyWage) },
                    ...(v.nonTaxable > 0 ? [{ label: "비과세 금액", value: formatWon(v.nonTaxable), note: "보험료 계산에서만 제외", sub: true }] : []),
                    { label: "보험료 기준 금액", value: formatWon(v.insuredWage) },
                    { label: "국민연금 기준소득월액", value: formatWon(v.insurance.pensionBase), note: "천원 미만 절사 · 상·하한 적용", sub: true },
                    { label: "근로자 4대보험 합계", value: formatWon(-v.insurance.employeeTotal) },
                    { label: "공제 후 금액 (세금 공제 전)", value: formatWon(v.netPay), strong: true },
                    { label: "사업주 부담 합계", value: formatWon(v.insurance.employerTotal), note: `산재 ${v.insurance.industry.label} · 고용안정 ${v.insurance.employerSize.label}` },
                    { label: "총 고용비용", value: formatWon(v.totalCost), strong: true },
                  ]}
                />
                <Formula
                  lines={[
                    `국민연금 = ${formatWon(v.insurance.pensionBase)} × ${formatPercent(NATIONAL_PENSION.value.employee, 2)} → ${formatWon(v.insurance.byKey.pension.employee)}`,
                    `건강보험 = ${formatWon(v.insuredWage)} × ${formatPercent(HEALTH_INSURANCE.value.employee, 3)} → ${formatWon(v.insurance.byKey.health.employee)}`,
                    `장기요양 = 건강보험료 × ${formatPercent(LONG_TERM_CARE.value.ratioOfHealth, 2)} → ${formatWon(v.insurance.byKey.longTermCare.employee)}`,
                    `고용보험 = ${formatWon(v.insuredWage)} × ${formatPercent(EMPLOYMENT_INSURANCE.value.employee, 2)} → ${formatWon(v.insurance.byKey.employment.employee)}`,
                    `각 보험료는 ${INSURANCE_ROUNDING.value.premiumUnit}원 미만 절사`,
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            sources={[NATIONAL_PENSION, HEALTH_INSURANCE, LONG_TERM_CARE, EMPLOYMENT_INSURANCE, INDUSTRIAL_ACCIDENT, INSURANCE_ROUNDING]}
            items={[
              "소득세·지방소득세는 부양가족 수와 간이세액표에 따라 달라져서 이 계산에 넣지 않았어요. 실제 통장에 들어오는 돈은 더 적어요.",
              "각 보험료는 사람별·부담 주체별로 10원 미만을 버렸어요. 장기요양보험료는 10원 미만을 버린 건강보험료에 비율을 곱해 다시 10원 미만을 버렸어요.",
              "건강보험 보수월액 상·하한과 연말 보수총액 정산은 반영하지 않았어요.",
              "산재보험은 사업주만 내고, 업종 요율에 출퇴근재해 요율을 더했어요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="4대보험 공제 계산 결과"
              description={`공제 후 ${formatWon(result.value.netPay)} · 총 고용비용 ${formatWon(result.value.totalCost)}`}
              buildUrl={buildUrl}
              sharedFields={["세전 월급", "비과세 금액", "업종", "상시 근로자 수"]}
            />
          )}
        </>
      }
    />
  );
}
