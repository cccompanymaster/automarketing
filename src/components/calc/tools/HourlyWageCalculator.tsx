"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { FieldGrid, InputCard, NumberField, Segmented, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { calcHourlyWage, minimumWageYears } from "@/lib/calc/hourlyWage";
import { formatNumber, formatWon, parseNumber } from "@/lib/calc/num";
import { LABOR_LAW, MINIMUM_WAGE } from "@/lib/calc/rates";

const YEARS = minimumWageYears();
const DEFAULTS = { hourly: "", hours: "", days: "", year: String(MINIMUM_WAGE.value.currentYear) };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["hourly", "hours", "days", "year"];
const LAW = LABOR_LAW.value;

const SCHEDULES = [
  { label: `주 ${LAW.fullTimeWeeklyHours}시간 (${LAW.dailyStandardHours}시간 × 5일)`, hours: LAW.dailyStandardHours, days: 5 },
  { label: `주 ${LAW.weeklyHolidayMinHours}시간 (3시간 × 5일)`, hours: LAW.weeklyHolidayMinHours / 5, days: 5 },
];

const QUICK_BTN =
  "min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";

const h = (n: number) => `${formatNumber(n, 2)}시간`;

export function HourlyWageCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const year = YEARS.includes(Number(s.year)) ? Number(s.year) : MINIMUM_WAGE.value.currentYear;

  const result = useMemo(
    () =>
      calcHourlyWage({
        hourlyWage: parseNumber(s.hourly),
        hoursPerDay: parseNumber(s.hours),
        daysPerWeek: parseNumber(s.days),
        minWageYear: year,
      }),
    [s.hourly, s.hours, s.days, year],
  );

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <NumberField
            label="시급"
            value={s.hourly}
            onChange={set("hourly")}
            placeholder={MINIMUM_WAGE.value.byYear[year]?.toLocaleString("ko-KR")}
            error={issueFor(result, "hourlyWage")}
            presets={YEARS.map((y) => ({ label: `${y}년 최저임금 ${MINIMUM_WAGE.value.byYear[y].toLocaleString("ko-KR")}원`, value: MINIMUM_WAGE.value.byYear[y] }))}
          />
          <FieldGrid>
            <NumberField label="하루 근무시간" unit="시간" allowDecimal value={s.hours} onChange={set("hours")} placeholder="8" error={issueFor(result, "hoursPerDay")} help="휴게시간을 뺀 실제 근무시간" />
            <NumberField label="주 근무일수" unit="일" value={s.days} onChange={set("days")} placeholder="5" error={issueFor(result, "daysPerWeek")} />
          </FieldGrid>
          <div>
            <p className="text-sm font-semibold text-slate-700">근무 형태 빠른 입력</p>
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="근무 형태 빠른 입력">
              {SCHEDULES.map((q) => (
                <button key={q.label} type="button" className={QUICK_BTN} onClick={() => setS((p) => ({ ...p, hours: String(q.hours), days: String(q.days) }))}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
          <Segmented
            label="최저임금 비교 기준 연도"
            value={String(year)}
            onChange={set("year")}
            options={YEARS.map((y) => ({ value: String(y), label: `${y}년` }))}
          />
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="시급, 하루 근무시간, 주 근무일수를 입력하면 주휴수당과 월급이 계산돼요.">
            {(v) => (
              <>
                <Headline
                  label="월 환산 급여 (주휴수당 포함)"
                  value={formatWon(v.monthlyPay)}
                  sub={`한 주 ${formatWon(v.weeklyTotal)} × 약 ${formatNumber(LAW.weeksPerMonth, 3)}주`}
                  tone={v.belowMinimum ? "bad" : "good"}
                />
                <StatGrid
                  items={[
                    { label: "일급", value: formatWon(v.dailyPay) },
                    { label: "기본 주급", value: formatWon(v.weeklyBase) },
                    { label: "주휴수당", value: formatWon(v.holidayPay), tone: v.eligible ? "good" : "default", sub: `주휴 ${h(v.holidayHours)}` },
                    { label: "주급 합계", value: formatWon(v.weeklyTotal) },
                  ]}
                />
                <div className={`rounded-xl px-4 py-3 text-sm ring-1 ${v.eligible ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-slate-50 text-slate-700 ring-slate-200"}`}>
                  <p className="font-bold">주휴수당 요건 {v.eligible ? "충족" : "미충족"}</p>
                  <p className="mt-1 text-xs leading-relaxed">
                    주 소정근로시간 {h(v.weeklyHours)} — {LAW.weeklyHolidayMinHours}시간 {v.eligible ? "이상이라" : "미만이라"} 주휴수당{" "}
                    {v.eligible ? "지급 대상이에요. 약속한 근무일을 모두 나왔다는 가정이에요(결근한 주는 주휴수당이 없어요)." : "지급 대상이 아니에요."}
                  </p>
                </div>
                <Breakdown
                  rows={[
                    { label: "주 소정근로시간", value: h(v.weeklyHours), note: `${h(v.hoursPerDay)} × ${formatNumber(v.daysPerWeek, 2)}일` },
                    { label: "주휴시간", value: h(v.holidayHours), note: v.eligible ? `${LAW.fullTimeWeeklyHours}시간 초과분은 ${LAW.fullTimeWeeklyHours}시간으로 계산` : `${LAW.weeklyHolidayMinHours}시간 미만 → 0` },
                    { label: "기본 주급", value: formatWon(v.weeklyBase) },
                    { label: "주휴수당", value: formatWon(v.holidayPay) },
                    { label: "주급 합계", value: formatWon(v.weeklyTotal), strong: true },
                    { label: "월 환산 유급시간", value: h(v.monthlyHours), note: `(주 소정근로 + 주휴) × ${formatNumber(LAW.weeksPerMonth, 3)}주` },
                    { label: "월 환산 급여", value: formatWon(v.monthlyPay), strong: true },
                    {
                      label: `${v.minWage.year}년 최저임금`,
                      value: formatWon(v.minWage.hourly),
                      note: v.belowMinimum ? `시급이 ${formatWon(v.minWageShortfall)} 부족해요` : "최저임금 이상",
                      tone: v.belowMinimum ? "bad" : "good",
                    },
                  ]}
                />
                <Formula
                  lines={[
                    `일급 = ${formatWon(v.hourlyWage)} × ${h(v.hoursPerDay)} = ${formatWon(v.dailyPay)}`,
                    `주휴시간 = min(${formatNumber(v.weeklyHours, 2)}, ${LAW.fullTimeWeeklyHours}) ÷ ${LAW.fullTimeWeeklyHours} × ${LAW.dailyStandardHours} = ${h(v.holidayHours)}`,
                    `주휴수당 = ${formatWon(v.hourlyWage)} × ${h(v.holidayHours)} = ${formatWon(v.holidayPay)}`,
                    `월 환산 = ${formatWon(v.weeklyTotal)} × 365 ÷ 7 ÷ 12 = ${formatWon(v.monthlyPay)}`,
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            sources={[MINIMUM_WAGE, LABOR_LAW]}
            items={[
              `주휴수당은 1주 소정근로시간 ${LAW.weeklyHolidayMinHours}시간 이상이고, 그 주에 약속한 근무일을 모두 나왔을 때 받을 수 있다고 보고 계산했어요.`,
              "월 환산은 1년 365일 ÷ 7 ÷ 12 ≈ 4.345주를 곱한 값이에요. 고용노동부가 쓰는 월 209시간은 이 값을 시간 단위에서 올림한 것이라 몇 천 원 차이가 날 수 있어요.",
              "연장·야간·휴일근로 가산수당, 4대보험·세금 공제는 넣지 않은 세전 금액이에요.",
              "일급·주급·주휴수당은 각각 원 단위에서 반올림했어요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="시급·주휴수당 계산 결과"
              description={`월 환산 ${formatWon(result.value.monthlyPay)} (주휴수당 ${formatWon(result.value.holidayPay)})`}
              buildUrl={buildUrl}
              sharedFields={["시급", "하루 근무시간", "주 근무일수", "최저임금 기준 연도"]}
            />
          )}
        </>
      }
    />
  );
}
