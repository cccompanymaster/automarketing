"use client";

import { useMemo, useState } from "react";
import { ResultPanel, Headline, StatGrid, Formula, Assumptions } from "@/components/calc/results";
import { CheckboxField, FieldGrid, InputCard, NumberField, Segmented, TextField, issueFor } from "@/components/calc/fields";
import { CaptureActions } from "@/components/calc/capture";
import { calcPayslip, holidayWeeksFrom, type PayType } from "@/lib/calc/payslip";
import { formatNumber, formatWon, parseNumber } from "@/lib/calc/num";
import { LABOR_LAW, MINIMUM_WAGE, NATIONAL_PENSION, HEALTH_INSURANCE, LONG_TERM_CARE, EMPLOYMENT_INSURANCE, WITHHOLDING } from "@/lib/calc/rates";
import { INSURANCE_ROUNDING, TAX_TRUNCATION } from "@/lib/calc/rates/laborTax";
import { DocumentFrame, PrivacyNote, RowsEditor, type MoneyRow } from "./PayslipDocumentFrame";
import { PayslipDocument } from "./PayslipDocument";

// All inputs in one object (strings / rows) so switching 시급제·월급제 never
// loses values. Nothing here is ever put in a URL or sent anywhere.
const DEFAULTS = {
  workerName: "",
  workerId: "",
  company: "",
  payDate: "",
  periodStart: "",
  periodEnd: "",
  payType: "hourly" as string,
  hourlyWage: "",
  monthlySalary: "",
  workDays: "",
  workHours: "",
  weeklyHours: "",
  weeklyDays: "",
  holidayWeeks: "",
  overtime: "",
  night: "",
  holiday: "",
  holidayOver8: "",
  under5: false,
  pension: true,
  health: true,
  longTermCare: true,
  employment: true,
  incomeTax: "",
  allowances: [] as MoneyRow[],
  deductions: [] as MoneyRow[],
};
type State = typeof DEFAULTS;
type StringKey = { [K in keyof State]: State[K] extends string ? K : never }[keyof State];

const TARGET_ID = "payslip-preview";
const MIN_WAGE = MINIMUM_WAGE.value.byYear[MINIMUM_WAGE.value.currentYear];
const LAW = LABOR_LAW.value;
const LOCAL_PCT = Math.round(WITHHOLDING.value.localRatio * 100);

export function PayslipBuilder() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: StringKey) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const setBool = (k: "under5" | "pension" | "health" | "longTermCare" | "employment") => (v: boolean) => setS((p) => ({ ...p, [k]: v }));
  const payType: PayType = s.payType === "monthly" ? "monthly" : "hourly";
  const hourly = payType === "hourly";

  const result = useMemo(
    () =>
      calcPayslip({
        payType,
        hourlyWage: parseNumber(s.hourlyWage),
        monthlySalary: parseNumber(s.monthlySalary),
        workDays: parseNumber(s.workDays),
        workHours: parseNumber(s.workHours),
        weeklyScheduledHours: parseNumber(s.weeklyHours),
        weeklyWorkDays: parseNumber(s.weeklyDays),
        holidayWeeks: parseNumber(s.holidayWeeks),
        overtimeHours: parseNumber(s.overtime),
        nightHours: parseNumber(s.night),
        holidayHours: parseNumber(s.holiday),
        holidayOver8Hours: parseNumber(s.holidayOver8),
        allowances: s.allowances.map((r) => ({ name: r.name, amount: parseNumber(r.amount), nonTaxable: r.nonTaxable })),
        under5: s.under5,
        insurance: { pension: s.pension, health: s.health, longTermCare: s.longTermCare, employment: s.employment },
        incomeTax: parseNumber(s.incomeTax),
        otherDeductions: s.deductions.map((r) => ({ name: r.name, amount: parseNumber(r.amount) })),
        wageDate: s.periodStart || s.periodEnd || s.payDate || null,
      }),
    [s, payType],
  );
  const value = result.status === "ok" ? result.value : null;
  const autoWeeks = holidayWeeksFrom({ holidayWeeks: null, workDays: parseNumber(s.workDays), weeklyWorkDays: parseNumber(s.weeklyDays) });
  const holidayTotal = (parseNumber(s.holiday) ?? 0) + (parseNumber(s.holidayOver8) ?? 0);
  const filename = `급여명세서_${s.workerName.trim() || "근로자"}${s.periodStart ? `_${s.periodStart.slice(0, 7)}` : ""}`;

  const inputs = (
    <>
      <InputCard title="1. 기본 정보">
        <FieldGrid>
          <TextField label="근로자 이름" value={s.workerName} onChange={set("workerName")} placeholder="홍길동" maxLength={20} />
          <TextField label="생년월일 또는 사원번호" value={s.workerId} onChange={set("workerId")} placeholder="1995-04-10 / A-012" maxLength={20} optional />
          <TextField label="사업장명" value={s.company} onChange={set("company")} placeholder="○○카페" maxLength={30} />
          <TextField label="지급일" type="date" value={s.payDate} onChange={set("payDate")} />
          <TextField label="급여 기간 시작일" type="date" value={s.periodStart} onChange={set("periodStart")} help="최저임금 연도도 이 날짜로 판단해요." />
          <TextField label="급여 기간 종료일" type="date" value={s.periodEnd} onChange={set("periodEnd")} />
        </FieldGrid>
      </InputCard>

      <InputCard title="2. 임금과 근로시간">
        <Segmented
          label="임금 형태"
          value={payType}
          onChange={set("payType")}
          options={[
            { value: "hourly", label: "시급제" },
            { value: "monthly", label: "월급제" },
          ]}
        />
        {hourly ? (
          <NumberField
            label="시급"
            value={s.hourlyWage}
            onChange={set("hourlyWage")}
            placeholder={formatNumber(MIN_WAGE)}
            error={issueFor(result, "hourlyWage")}
            presets={[{ label: `${MINIMUM_WAGE.value.currentYear}년 최저임금`, value: MIN_WAGE }]}
          />
        ) : (
          <NumberField
            label="월급 (기본급)"
            value={s.monthlySalary}
            onChange={set("monthlySalary")}
            placeholder="2,500,000"
            error={issueFor(result, "monthlySalary")}
            help={`수당 계산용 통상시급 = 월급 ÷ ${LABOR_LAW.value.monthlyStandardHours}시간 (주 40시간 기준)`}
            presets={[{ label: `최저임금 월 환산`, value: MIN_WAGE * LABOR_LAW.value.monthlyStandardHours }]}
          />
        )}
        <FieldGrid>
          <NumberField label="근로일수" unit="일" allowDecimal value={s.workDays} onChange={set("workDays")} placeholder="20" error={issueFor(result, "workDays")} optional={!hourly} />
          <NumberField
            label="기본 근로시간"
            unit="시간"
            allowDecimal
            value={s.workHours}
            onChange={set("workHours")}
            placeholder="160"
            error={issueFor(result, "workHours")}
            optional={!hourly}
            help="연장·휴일근로를 뺀 소정근로시간 합계"
          />
          <NumberField
            label="주 소정근로시간"
            unit="시간"
            allowDecimal
            value={s.weeklyHours}
            onChange={set("weeklyHours")}
            placeholder="40"
            error={issueFor(result, "weeklyScheduledHours")}
            optional
            presets={[40, 20, 15].map((v) => ({ label: `${v}시간`, value: v }))}
            help={hourly ? `${LABOR_LAW.value.weeklyHolidayMinHours}시간 이상이면 주휴수당을 계산해요.` : "단시간 월급제면 입력 (통상시급 기준시간이 달라져요)"}
          />
          {hourly && (
            <NumberField
              label="주 근무일수"
              unit="일"
              value={s.weeklyDays}
              onChange={set("weeklyDays")}
              placeholder="5"
              error={issueFor(result, "weeklyWorkDays")}
              optional
              presets={[5, 3, 2].map((v) => ({ label: `주 ${v}일`, value: v }))}
            />
          )}
        </FieldGrid>
        {hourly && (
          <NumberField
            label="주휴 발생 주 수"
            unit="주"
            allowDecimal
            value={s.holidayWeeks}
            onChange={set("holidayWeeks")}
            placeholder={autoWeeks != null ? `자동: ${autoWeeks}` : "자동"}
            error={issueFor(result, "holidayWeeks")}
            optional
            help="비워 두면 근로일수 ÷ 주 근무일수의 몫(개근한 완전한 주)으로 계산해요. 결근한 주가 있으면 직접 입력하세요."
          />
        )}
        <CheckboxField label="상시 근로자 5인 미만 사업장" checked={s.under5} onChange={setBool("under5")} help="5인 미만은 연장·야간·휴일 가산수당(50%)이 적용되지 않아요." />
      </InputCard>

      <InputCard title="3. 연장·야간·휴일근로">
        <FieldGrid>
          <NumberField label="연장근로" unit="시간" allowDecimal value={s.overtime} onChange={set("overtime")} placeholder="0" error={issueFor(result, "overtimeHours")} optional help="1일 8시간·주 40시간을 넘긴 시간" />
          <NumberField label="야간근로" unit="시간" allowDecimal value={s.night} onChange={set("night")} placeholder="0" error={issueFor(result, "nightHours")} optional help="22시~6시에 일한 시간 (가산분만 추가)" />
          <NumberField label="휴일근로 (8시간 이내)" unit="시간" allowDecimal value={s.holiday} onChange={set("holiday")} placeholder="0" error={issueFor(result, "holidayHours")} optional />
          <NumberField label="휴일근로 (8시간 초과분)" unit="시간" allowDecimal value={s.holidayOver8} onChange={set("holidayOver8")} placeholder="0" error={issueFor(result, "holidayOver8Hours")} optional />
        </FieldGrid>
        <RowsEditor
          legend="기타 수당"
          rows={s.allowances}
          onChange={(rows) => setS((p) => ({ ...p, allowances: rows }))}
          namePlaceholder="식대, 직책수당…"
          addLabel="수당 추가"
          withNonTaxable
          errorFor={(i) => issueFor(result, `allowance-${i}`)}
        />
      </InputCard>

      <InputCard title="4. 공제">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">가입한 보험 (근로자 부담분 공제)</legend>
          <div className="mt-1 grid grid-cols-2 gap-x-3">
            <CheckboxField label="국민연금" checked={s.pension} onChange={setBool("pension")} />
            <CheckboxField label="건강보험" checked={s.health} onChange={setBool("health")} />
            <CheckboxField label="장기요양보험" checked={s.longTermCare} onChange={setBool("longTermCare")} />
            <CheckboxField label="고용보험" checked={s.employment} onChange={setBool("employment")} />
          </div>
          <p className="mt-1 text-xs text-slate-500">산재보험은 사업주가 전액 부담해서 명세서 공제에 들어가지 않아요.</p>
        </fieldset>
        <NumberField
          label="근로소득세"
          value={s.incomeTax}
          onChange={set("incomeTax")}
          placeholder="0"
          error={issueFor(result, "incomeTax")}
          optional
          help={`국세청 간이세액표에서 찾은 금액을 넣으세요. 지방소득세(${LOCAL_PCT}%)는 자동 계산돼요.`}
        />
        <RowsEditor
          legend="기타 공제"
          rows={s.deductions}
          onChange={(rows) => setS((p) => ({ ...p, deductions: rows }))}
          namePlaceholder="가불금 상환…"
          addLabel="공제 추가"
          errorFor={(i) => issueFor(result, `deduction-${i}`)}
        />
      </InputCard>
    </>
  );

  const preview = (
    <section aria-labelledby="payslip-preview-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h2 id="payslip-preview-title" className="text-base font-bold text-slate-900">
          명세서 미리보기
        </h2>
        <span className="text-xs text-slate-400">입력하면 바로 바뀌어요</span>
      </div>
      <CaptureActions targetId={TARGET_ID} filename={filename} />
      <DocumentFrame targetId={TARGET_ID} label="급여명세서 미리보기">
        <PayslipDocument
          value={value}
          meta={{
            workerName: s.workerName,
            workerId: s.workerId,
            company: s.company,
            payDate: s.payDate,
            periodStart: s.periodStart,
            periodEnd: s.periodEnd,
            payTypeLabel: hourly ? "시급제" : "월급제",
            under5: s.under5,
            workDays: parseNumber(s.workDays),
            workHours: parseNumber(s.workHours),
            overtimeHours: parseNumber(s.overtime),
            nightHours: parseNumber(s.night),
            holidayHours: s.holiday || s.holidayOver8 ? holidayTotal : null,
          }}
        />
      </DocumentFrame>
      <PrivacyNote>새로고침하면 입력 내용이 사라지니 저장이 필요하면 PDF로 남겨 두세요.</PrivacyNote>
    </section>
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
      <div className="space-y-5 print:hidden">{inputs}</div>
      <div className="space-y-5">
        <div className="print:hidden">
          <ResultPanel result={result} title="계산 요약" emptyHint={hourly ? "시급과 기본 근로시간을 입력하면 명세서가 채워져요." : "월급을 입력하면 명세서가 채워져요."}>
            {(v) => (
              <>
                <Headline
                  label="실지급액"
                  value={formatWon(v.netPay)}
                  sub={`지급 총액 ${formatWon(v.grossPay)} − 공제 총액 ${formatWon(v.totalDeductions)}`}
                  tone={v.netPay < 0 ? "bad" : "good"}
                />
                <StatGrid
                  items={[
                    { label: "통상시급", value: formatWon(v.ordinaryHourly), sub: v.monthlyStdHours ? `월 ${v.monthlyStdHours}시간 기준` : undefined },
                    { label: `${v.minimumWage.year}년 최저임금`, value: formatWon(v.minimumWage.hourly), tone: v.belowMinimumWage ? "bad" : "default" },
                    { label: "4대보험 기준 금액", value: formatWon(v.insuranceBase), sub: v.nonTaxableTotal ? `비과세 ${formatWon(v.nonTaxableTotal)} 제외` : undefined },
                  ]}
                />
                <Formula
                  lines={[
                    hourly
                      ? `주휴수당 = 시급 × (min(주 소정, ${LAW.fullTimeWeeklyHours}) ÷ ${LAW.fullTimeWeeklyHours} × ${LAW.dailyStandardHours}) × 주 수`
                      : `통상시급 = 월급 ÷ ${v.monthlyStdHours}시간 = ${formatWon(v.ordinaryHourly)}`,
                    v.multipliers.overtime > 1
                      ? `연장 × ${v.multipliers.overtime} · 야간 가산 × ${v.multipliers.night} · 휴일 8시간 이내 × ${v.multipliers.holidayUpTo8}, 초과분 × ${v.multipliers.holidayOver8}`
                      : "5인 미만: 연장·휴일 × 1 (가산 없음), 야간 가산 없음",
                    `지방소득세 = 소득세 × ${LOCAL_PCT}% (10원 미만 절사)`,
                    "실지급액 = 지급 총액 − 공제 총액",
                  ]}
                />
                {v.notes.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
                    {v.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </ResultPanel>
        </div>
        {preview}
        <div className="space-y-5 print:hidden">
          <Assumptions
            sources={[MINIMUM_WAGE, LABOR_LAW, NATIONAL_PENSION, HEALTH_INSURANCE, LONG_TERM_CARE, EMPLOYMENT_INSURANCE, WITHHOLDING, TAX_TRUNCATION, INSURANCE_ROUNDING]}
            items={[
              "지급 항목은 각각 원 단위 반올림하고, 합계는 반올림된 항목을 더해요.",
              "4대보험은 한 달치 보수 기준이에요. 주급·일급 명세서라면 실제 고지액과 다를 수 있어요.",
              "근로소득세는 부양가족 수에 따라 달라서 직접 입력해야 해요. 일용직은 원천세 계산기를 이용하세요.",
              "야간근로 시간은 기본·연장·휴일 시간 안에 포함돼 있다고 보고 가산분(50%)만 더해요.",
              "주휴수당은 소정근로일을 개근한 주에만 생겨요. 결근이 있었다면 주휴 발생 주 수를 직접 고쳐 주세요.",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
