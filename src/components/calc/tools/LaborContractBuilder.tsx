"use client";

import { useId, useMemo, useState } from "react";
import { ResultPanel, Headline, StatGrid, Formula, Assumptions } from "@/components/calc/results";
import { CheckboxField, FieldGrid, InputCard, NumberField, Segmented, SelectField, TextField, issueFor, formatTyping } from "@/components/calc/fields";
import { CaptureActions } from "@/components/calc/capture";
import {
  SPECIAL_CLAUSES,
  WEEKDAYS,
  analyzeContract,
  dayHours,
  formatMinutes,
  scheduleSummary,
  type ContractAlert,
  type DayScheduleInput,
  type WageType,
} from "@/lib/calc/laborContract";
import { formatNumber, formatWon, parseNumber } from "@/lib/calc/num";
import { LABOR_LAW, MINIMUM_WAGE } from "@/lib/calc/rates";
import { LABOR_DOCS } from "@/lib/calc/rates/laborDocs";
import { DocumentFrame, PrivacyNote, RowsEditor, TextAreaField, type MoneyRow } from "./PayslipDocumentFrame";
import { LaborContractDocument } from "./LaborContractDocument";

interface DayRow {
  work: boolean;
  start: string;
  end: string;
  brk: string;
}

const weekdayRows = (start: string, end: string, brk: string, on: (i: number) => boolean): DayRow[] =>
  WEEKDAYS.map((_, i) => ({ work: on(i), start, end, brk }));

// All inputs in one object so toggles never lose typed values. Nothing is
// put in the URL or sent anywhere (personal data).
const DEFAULTS = {
  company: "",
  ceo: "",
  companyAddress: "",
  companyPhone: "",
  workerName: "",
  workerBirth: "",
  workerAddress: "",
  workerPhone: "",
  writtenDate: "",
  startDate: "",
  hasEnd: "no" as string,
  endDate: "",
  place: "",
  job: "",
  days: weekdayRows("09:00", "18:00", "60", (i) => i < 5),
  holidayIndex: "6" as string,
  wageType: "hourly" as string,
  wageAmount: "",
  bonus: "no" as string,
  bonusAmount: "",
  allowances: [] as MoneyRow[],
  payDay: "10",
  payMethod: "transfer" as string,
  clauses: {} as Record<string, boolean>,
  customClauses: "",
  under5: false,
  employment: true,
  industrial: true,
  pension: true,
  health: true,
};
type State = typeof DEFAULTS;
type StringKey = { [K in keyof State]: State[K] extends string ? K : never }[keyof State];

const TARGET_ID = "labor-contract-preview";
const LAW = LABOR_LAW.value;

const SCHEDULE_PRESETS: { label: string; days: DayRow[] }[] = [
  { label: "월~금 09–18시", days: weekdayRows("09:00", "18:00", "60", (i) => i < 5) },
  { label: "월~금 10–15시", days: weekdayRows("10:00", "15:00", "30", (i) => i < 5) },
  { label: "주말 10–19시", days: weekdayRows("10:00", "19:00", "60", (i) => i >= 5) },
  { label: "야간 22–07시 (주 5일)", days: weekdayRows("22:00", "07:00", "60", (i) => i < 5) },
];

const ALERT_STYLE: Record<ContractAlert["level"], { box: string; icon: string; sr: string }> = {
  danger: { box: "bg-rose-50 text-rose-800 ring-rose-100", icon: "⛔", sr: "위험" },
  warn: { box: "bg-amber-50 text-amber-800 ring-amber-100", icon: "⚠️", sr: "주의" },
  info: { box: "bg-slate-50 text-slate-700 ring-slate-200", icon: "ℹ️", sr: "안내" },
};

const TIME_INPUT =
  "h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-1.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-300 aria-[invalid=true]:border-rose-400";

function ScheduleEditor({
  days,
  onChange,
  errorFor,
}: {
  days: DayRow[];
  onChange: (days: DayRow[]) => void;
  errorFor: (i: number) => string | undefined;
}) {
  const uid = useId().replace(/:/g, "");
  const patch = (i: number, p: Partial<DayRow>) => onChange(days.map((d, j) => (j === i ? { ...d, ...p } : d)));
  const firstWork = days.find((d) => d.work);
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-700">요일별 근무시간</legend>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="근무표 빠른 입력">
        {SCHEDULE_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.days.map((d) => ({ ...d })))}
            className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {p.label}
          </button>
        ))}
        {firstWork && (
          <button
            type="button"
            onClick={() => onChange(days.map((d) => (d.work ? { ...d, start: firstWork.start, end: firstWork.end, brk: firstWork.brk } : d)))}
            className="min-h-9 rounded-lg border border-dashed border-slate-300 px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            첫 근무일 시간을 모두 적용
          </button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,1fr)_4.25rem] items-center gap-x-1.5 gap-y-1 text-xs font-semibold text-slate-500" aria-hidden="true">
        <span>요일</span>
        <span>시업</span>
        <span>종업</span>
        <span>휴게(분)</span>
      </div>
      <ul className="mt-1 space-y-1.5">
        {days.map((d, i) => {
          const label = WEEKDAYS[i].label;
          const h = d.work ? dayHours(d.start, d.end, parseNumber(d.brk)) : null;
          const err = errorFor(i);
          return (
            <li key={label}>
              <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,1fr)_4.25rem] items-center gap-1.5">
                <label className="flex h-11 cursor-pointer items-center gap-1.5 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={d.work}
                    onChange={(e) => patch(i, { work: e.target.checked })}
                    className="h-[18px] w-[18px] rounded border-slate-300 text-emerald-600"
                  />
                  {label}
                  <span className="sr-only">요일 근무</span>
                </label>
                <label className="sr-only" htmlFor={`${uid}-s${i}`}>
                  {label}요일 시업 시각
                </label>
                <input id={`${uid}-s${i}`} type="time" value={d.start} disabled={!d.work} aria-invalid={err ? true : undefined} onChange={(e) => patch(i, { start: e.target.value })} className={TIME_INPUT} />
                <label className="sr-only" htmlFor={`${uid}-e${i}`}>
                  {label}요일 종업 시각
                </label>
                <input id={`${uid}-e${i}`} type="time" value={d.end} disabled={!d.work} aria-invalid={err ? true : undefined} onChange={(e) => patch(i, { end: e.target.value })} className={TIME_INPUT} />
                <label className="sr-only" htmlFor={`${uid}-b${i}`}>
                  {label}요일 휴게시간 (분)
                </label>
                <input
                  id={`${uid}-b${i}`}
                  type="text"
                  inputMode="numeric"
                  value={d.brk}
                  disabled={!d.work}
                  onChange={(e) => patch(i, { brk: formatTyping(e.target.value, false, false) })}
                  className={`${TIME_INPUT} num text-right`}
                />
              </div>
              {d.work && (h || err) && (
                <p className={`mt-0.5 pl-14 text-[11px] ${err ? "font-medium text-rose-600" : h && h.breakShortfall > 0 ? "text-rose-600" : "text-slate-500"}`} role={err ? "alert" : undefined}>
                  {err ??
                    (h &&
                      `근로 ${formatMinutes(h.workMinutes)}${h.overnight ? " · 다음 날 종료" : ""}${h.breakShortfall > 0 ? ` · 휴게 ${h.requiredBreak}분 이상 필요` : ""}`)}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export function LaborContractBuilder() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: StringKey) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const setBool = (k: "under5" | "employment" | "industrial" | "pension" | "health") => (v: boolean) => setS((p) => ({ ...p, [k]: v }));
  const wageType: WageType = s.wageType === "daily" ? "daily" : s.wageType === "monthly" ? "monthly" : "hourly";
  const holidayIndex = Number(s.holidayIndex) || 0;

  const dayInputs: DayScheduleInput[] = useMemo(
    () => s.days.map((d) => ({ work: d.work, start: d.start, end: d.end, breakMinutes: parseNumber(d.brk) })),
    [s.days],
  );
  const clauseTexts = useMemo(
    () => [
      ...SPECIAL_CLAUSES.filter((c) => s.clauses[c.id]).map((c) => c.text as string),
      ...s.customClauses
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    ],
    [s.clauses, s.customClauses],
  );

  const result = useMemo(
    () =>
      analyzeContract({
        days: dayInputs,
        weeklyHolidayIndex: holidayIndex,
        wageType,
        wageAmount: parseNumber(s.wageAmount),
        writtenDate: s.writtenDate || null,
        startDate: s.startDate || null,
        endDate: s.hasEnd === "yes" ? s.endDate || null : null,
        workerBirth: s.workerBirth || null,
        under5: s.under5,
        clauseTexts,
      }),
    [dayInputs, holidayIndex, wageType, s.wageAmount, s.writtenDate, s.startDate, s.hasEnd, s.endDate, s.workerBirth, s.under5, clauseTexts],
  );
  const analysis = result.status === "ok" ? result.value : null;
  const minWageNow = MINIMUM_WAGE.value.byYear[MINIMUM_WAGE.value.currentYear];
  const filename = `근로계약서_${s.workerName.trim() || "근로자"}`;

  const inputs = (
    <>
      <InputCard title="1. 사업주 정보">
        <FieldGrid>
          <TextField label="상호 (사업체명)" value={s.company} onChange={set("company")} placeholder="○○식당" maxLength={40} />
          <TextField label="대표자" value={s.ceo} onChange={set("ceo")} placeholder="김대표" maxLength={20} />
          <TextField label="사업장 주소" value={s.companyAddress} onChange={set("companyAddress")} placeholder="서울시 ○○구 ○○로 12" maxLength={80} />
          <TextField label="연락처" value={s.companyPhone} onChange={set("companyPhone")} placeholder="02-000-0000" maxLength={20} />
        </FieldGrid>
      </InputCard>

      <InputCard title="2. 근로자 정보">
        <FieldGrid>
          <TextField label="이름" value={s.workerName} onChange={set("workerName")} placeholder="홍길동" maxLength={20} />
          <TextField label="생년월일" type="date" value={s.workerBirth} onChange={set("workerBirth")} error={issueFor(result, "workerBirth")} help="만 18세 미만이면 연소근로자 안내를 보여 드려요." />
          <TextField label="주소" value={s.workerAddress} onChange={set("workerAddress")} maxLength={80} optional />
          <TextField label="연락처" value={s.workerPhone} onChange={set("workerPhone")} placeholder="010-0000-0000" maxLength={20} optional />
        </FieldGrid>
      </InputCard>

      <InputCard title="3. 계약 기간과 업무">
        <FieldGrid>
          <TextField label="작성일" type="date" value={s.writtenDate} onChange={set("writtenDate")} />
          <TextField label="근로 시작일" type="date" value={s.startDate} onChange={set("startDate")} help="최저임금 연도를 이 날짜로 판단해요." />
        </FieldGrid>
        <Segmented
          label="계약 종료일"
          value={s.hasEnd === "yes" ? "yes" : "no"}
          onChange={set("hasEnd")}
          options={[
            { value: "no", label: "정함 없음 (정규)" },
            { value: "yes", label: "있음 (기간제)" },
          ]}
        />
        {s.hasEnd === "yes" && <TextField label="근로 종료일" type="date" value={s.endDate} onChange={set("endDate")} error={issueFor(result, "endDate")} />}
        <FieldGrid>
          <TextField label="근무 장소" value={s.place} onChange={set("place")} placeholder="본점 매장" maxLength={60} />
          <TextField label="업무 내용" value={s.job} onChange={set("job")} placeholder="홀 서빙, 매장 정리" maxLength={80} />
        </FieldGrid>
      </InputCard>

      <InputCard title="4. 근무일과 근로시간">
        <ScheduleEditor
          days={s.days}
          onChange={(days) => setS((p) => ({ ...p, days }))}
          errorFor={(i) => issueFor(result, `day-${i}`) ?? issueFor(result, `break-${i}`)}
        />
        <SelectField
          label="주휴일"
          value={s.holidayIndex}
          onChange={set("holidayIndex")}
          options={WEEKDAYS.map((w, i) => ({ value: String(i), label: `매주 ${w.label}요일` }))}
        />
        <CheckboxField label="상시 근로자 5인 미만 사업장" checked={s.under5} onChange={setBool("under5")} help="연장·야간·휴일 가산, 연차휴가, 근로시간 한도 규정이 적용되지 않아요." />
      </InputCard>

      <InputCard title="5. 임금">
        <Segmented
          label="임금 형태"
          value={wageType}
          onChange={set("wageType")}
          options={[
            { value: "hourly", label: "시급" },
            { value: "daily", label: "일급" },
            { value: "monthly", label: "월급" },
          ]}
        />
        <NumberField
          label={`${wageType === "hourly" ? "시급" : wageType === "daily" ? "일급" : "월급"} 금액`}
          value={s.wageAmount}
          onChange={set("wageAmount")}
          placeholder={wageType === "hourly" ? formatNumber(minWageNow) : formatNumber(wageType === "daily" ? minWageNow * LAW.dailyStandardHours : minWageNow * LAW.monthlyStandardHours)}
          error={issueFor(result, "wageAmount")}
          presets={
            wageType === "hourly"
              ? [{ label: `${MINIMUM_WAGE.value.currentYear}년 최저임금`, value: minWageNow }]
              : wageType === "monthly"
                ? [{ label: `최저임금 월 환산 (${LAW.monthlyStandardHours}시간)`, value: minWageNow * LAW.monthlyStandardHours }]
                : undefined
          }
        />
        <Segmented
          label="상여금"
          value={s.bonus === "yes" ? "yes" : "no"}
          onChange={set("bonus")}
          options={[
            { value: "no", label: "없음" },
            { value: "yes", label: "있음" },
          ]}
        />
        {s.bonus === "yes" && <NumberField label="상여금" value={s.bonusAmount} onChange={set("bonusAmount")} placeholder="500,000" optional help="비워 두면 '금액 별도 협의'로 적어요." />}
        <RowsEditor legend="기타 급여 (제수당)" rows={s.allowances} onChange={(rows) => setS((p) => ({ ...p, allowances: rows }))} namePlaceholder="식대, 교통비…" addLabel="수당 추가" />
        <FieldGrid>
          <NumberField label="임금 지급일 (매월)" unit="일" value={s.payDay} onChange={set("payDay")} placeholder="10" presets={[10, 15, 25].map((v) => ({ label: `${v}일`, value: v }))} />
          <SelectField
            label="지급 방법"
            value={s.payMethod === "direct" ? "direct" : "transfer"}
            onChange={set("payMethod")}
            options={[
              { value: "transfer", label: "근로자 명의 계좌 이체" },
              { value: "direct", label: "근로자에게 직접 지급" },
            ]}
          />
        </FieldGrid>
      </InputCard>

      <InputCard title="6. 사회보험과 특약">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">사회보험 적용</legend>
          <div className="mt-1 grid grid-cols-2 gap-x-3">
            <CheckboxField label="고용보험" checked={s.employment} onChange={setBool("employment")} />
            <CheckboxField label="산재보험" checked={s.industrial} onChange={setBool("industrial")} />
            <CheckboxField label="국민연금" checked={s.pension} onChange={setBool("pension")} />
            <CheckboxField label="건강보험" checked={s.health} onChange={setBool("health")} />
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">
            특약 선택 <span className="text-xs font-normal text-slate-400">(선택)</span>
          </legend>
          <div className="mt-1 space-y-0.5">
            {SPECIAL_CLAUSES.map((c) => (
              <CheckboxField
                key={c.id}
                label={c.label}
                checked={!!s.clauses[c.id]}
                onChange={(v) => setS((p) => ({ ...p, clauses: { ...p.clauses, [c.id]: v } }))}
              />
            ))}
          </div>
        </fieldset>
        <TextAreaField
          label="특약 직접 입력"
          value={s.customClauses}
          onChange={set("customClauses")}
          placeholder={"한 줄에 한 항목씩 적어 주세요.\n예) 유니폼은 사업주가 제공한다."}
          help="위약금·퇴직금 포기·주휴수당 없음처럼 법에 어긋날 수 있는 문구가 있으면 바로 알려 드려요."
        />
      </InputCard>
    </>
  );

  const alertsPanel = (
    <ResultPanel result={result} title="자동 점검" emptyHint="근무 요일과 시각을 입력하면 근로시간·주휴·최저임금을 바로 점검해요.">
      {(v) => (
        <>
          <Headline
            label="1주 소정근로시간"
            value={`${formatNumber(v.weeklyHours, 2)}시간`}
            sub={v.weeklyHoliday.eligible ? `주휴수당 대상 · 유급 주휴 ${formatNumber(v.weeklyHoliday.hours, 2)}시간` : `주 ${LAW.weeklyHolidayMinHours}시간 미만 — 주휴수당 대상 아님`}
            tone={v.weeklyHoliday.eligible ? "good" : "default"}
          />
          <StatGrid
            items={[
              { label: "근무일수", value: `주 ${v.workDays}일` },
              { label: "하루 최장 근로", value: formatMinutes(v.maxDailyMinutes) },
              v.minWage
                ? {
                    label: "시간당 환산 임금",
                    value: formatWon(v.minWage.hourlyEquivalent),
                    tone: v.minWage.below ? "bad" : "good",
                    sub: `${v.minWage.year}년 최저 ${formatWon(v.minWage.minimum)}`,
                  }
                : { label: "시간당 환산 임금", value: "—", sub: "임금 입력 필요" },
            ]}
          />
          <ul className="space-y-1.5">
            {v.alerts.map((a) => (
              <li key={a.title + a.message} className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ring-1 ${ALERT_STYLE[a.level].box}`}>
                <p className="font-bold">
                  <span aria-hidden="true">{ALERT_STYLE[a.level].icon} </span>
                  <span className="sr-only">{ALERT_STYLE[a.level].sr}: </span>
                  {a.title}
                  {a.article && <span className="ml-1.5 font-normal opacity-75">({a.article})</span>}
                </p>
                <p className="mt-0.5">{a.message}</p>
              </li>
            ))}
          </ul>
          <Formula
            lines={[
              "하루 근로시간 = 종업 − 시업 − 휴게 (종업이 더 이르면 다음 날)",
              `주휴시간 = min(주 소정, ${LAW.fullTimeWeeklyHours}) ÷ ${LAW.fullTimeWeeklyHours} × ${LAW.dailyStandardHours} (주 ${LAW.weeklyHolidayMinHours}시간 이상)`,
              v.minWage ? `최저임금 비교: ${v.minWage.method} = ${formatWon(v.minWage.hourlyEquivalent)}` : "최저임금 비교: 임금 ÷ 환산 시간",
            ]}
          />
        </>
      )}
    </ResultPanel>
  );

  const preview = (
    <section aria-labelledby="contract-preview-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h2 id="contract-preview-title" className="text-base font-bold text-slate-900">
          계약서 미리보기
        </h2>
        <span className="text-xs text-slate-400">입력하면 바로 바뀌어요</span>
      </div>
      <CaptureActions targetId={TARGET_ID} filename={filename} />
      <DocumentFrame targetId={TARGET_ID} label="근로계약서 미리보기">
        <LaborContractDocument
          analysis={analysis}
          d={{
            company: s.company,
            ceo: s.ceo,
            companyAddress: s.companyAddress,
            companyPhone: s.companyPhone,
            workerName: s.workerName,
            workerBirth: s.workerBirth,
            workerAddress: s.workerAddress,
            workerPhone: s.workerPhone,
            writtenDate: s.writtenDate,
            startDate: s.startDate,
            hasEnd: s.hasEnd === "yes",
            endDate: s.endDate,
            place: s.place,
            job: s.job,
            scheduleLines: scheduleSummary(dayInputs),
            workDayLabels: s.days.map((d, i) => (d.work ? WEEKDAYS[i].label : "")).filter(Boolean),
            holidayIndex,
            wageType,
            wageAmount: s.wageAmount,
            bonus: s.bonus === "yes",
            bonusAmount: s.bonusAmount,
            allowances: s.allowances,
            payDay: s.payDay,
            payMethod: s.payMethod === "direct" ? "direct" : "transfer",
            under5: s.under5,
            insurance: { employment: s.employment, industrial: s.industrial, pension: s.pension, health: s.health },
            clauses: clauseTexts,
          }}
        />
      </DocumentFrame>
      <PrivacyNote>서명은 인쇄한 뒤 양쪽이 직접 하고, 한 부씩 나눠 가지세요.</PrivacyNote>
    </section>
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
      <div className="space-y-5 print:hidden">{inputs}</div>
      <div className="space-y-5">
        <div className="print:hidden">{alertsPanel}</div>
        {preview}
        <div className="print:hidden">
          <Assumptions
            sources={[MINIMUM_WAGE, LABOR_LAW, LABOR_DOCS]}
            items={[
              "최저임금 비교는 기본 임금만 봐요. 상여금·수당 중 최저임금에 들어가는 부분은 따로 확인하세요.",
              `일급은 주 근로시간 ÷ 근무일수(평균 1일 소정근로시간)로, 월급은 (주 소정 + 주휴) × ${formatNumber(LAW.weeksPerMonth, 3)}주로 나눠 시간당 금액을 구해요. 주 ${LAW.fullTimeWeeklyHours}시간 이상은 ${LAW.monthlyStandardHours}시간 기준이에요.`,
              `야간근로 여부는 휴게 위치를 알 수 없어 휴게를 빼지 않고 ${LABOR_DOCS.value.nightStartHour}시~${LABOR_DOCS.value.nightEndHour}시와 겹치는지로 판단해요.`,
              "위험 문구 점검은 대표적인 표현을 찾는 키워드 검사라서 모든 위법 조항을 잡아내지는 못해요. 중요한 계약은 노무사 등 전문가와 확인하세요.",
              "이 양식은 고용노동부 표준 근로계약서의 항목 구성을 참고해 새로 쓴 문안이에요.",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
