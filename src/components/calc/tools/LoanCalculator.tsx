"use client";

import { useId, useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Formula, Assumptions } from "@/components/calc/results";
import { InputCard, NumberField, Segmented, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { LOAN_MAX_MONTHS, LOAN_METHOD_LABELS, loan, type LoanMethod, type LoanSchedule } from "@/lib/calc/loan";
import { formatNumber, formatWon, parseNumber } from "@/lib/calc/num";
import { LEGAL_MAX_INTEREST } from "@/lib/calc/rates/storeCosts";

const DEFAULTS = { method: "annuity" as LoanMethod as string, principal: "", rate: "", months: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["method", "principal", "rate", "months"];

/** Rows shown before "전체 보기" for long schedules. */
const PREVIEW_ROWS = 12;
const COLLAPSE_OVER = 24;

function termLabel(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}개월`;
  return m === 0 ? `${y}년` : `${y}년 ${m}개월`;
}

function ScheduleTable({ schedule }: { schedule: LoanSchedule }) {
  const [expanded, setExpanded] = useState(false);
  const tableId = `t${useId().replace(/:/g, "")}`;
  const n = schedule.rows.length;
  const collapsible = n > COLLAPSE_OVER;
  const rows = collapsible && !expanded ? schedule.rows.slice(0, PREVIEW_ROWS) : schedule.rows;
  const title = `${LOAN_METHOD_LABELS[schedule.method]} 월별 상환 일정`;
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <div className="mt-2 max-h-[28rem] overflow-auto rounded-xl ring-1 ring-slate-100" tabIndex={0} role="region" aria-label={title}>
        <table id={tableId} className="w-full min-w-[30rem] text-right text-[13px]">
          <caption className="sr-only">
            {title} — 총 {n}개월{collapsible && !expanded ? `, 처음 ${PREVIEW_ROWS}개월만 표시 중` : ""}
          </caption>
          <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-semibold">회차</th>
              <th scope="col" className="px-3 py-2 font-semibold">상환액</th>
              <th scope="col" className="px-3 py-2 font-semibold">원금</th>
              <th scope="col" className="px-3 py-2 font-semibold">이자</th>
              <th scope="col" className="px-3 py-2 font-semibold">잔액</th>
            </tr>
          </thead>
          <tbody className="num divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.month}>
                <th scope="row" className="px-3 py-1.5 text-left font-normal text-slate-500">
                  {r.month}
                </th>
                <td className="px-3 py-1.5 font-semibold text-slate-900">{formatNumber(r.payment)}</td>
                <td className="px-3 py-1.5 text-slate-700">{formatNumber(r.principal)}</td>
                <td className="px-3 py-1.5 text-slate-700">{formatNumber(r.interest)}</td>
                <td className="px-3 py-1.5 text-slate-500">{formatNumber(r.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50 font-bold text-slate-900">
            <tr>
              <th scope="row" className="px-3 py-2 text-left">합계</th>
              <td className="px-3 py-2">{formatNumber(schedule.totalPayment)}</td>
              <td className="px-3 py-2">{formatNumber(schedule.totalPrincipal)}</td>
              <td className="px-3 py-2">{formatNumber(schedule.totalInterest)}</td>
              <td className="px-3 py-2">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">단위: 원 · 월 이자는 원 미만 절사, 마지막 회차에서 남은 원금을 모두 갚아요.</p>
      {collapsible && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={tableId}
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          {expanded ? `처음 ${PREVIEW_ROWS}개월만 보기` : `전체 ${n}개월 일정 펼치기`}
        </button>
      )}
    </div>
  );
}

function CompareTable({ a, b, selected }: { a: LoanSchedule; b: LoanSchedule; selected: LoanMethod }) {
  const rows: { label: string; get: (s: LoanSchedule) => number }[] = [
    { label: "첫 달 상환액", get: (s) => s.firstPayment },
    { label: "마지막 달 상환액", get: (s) => s.lastPayment },
    { label: "최대 월 상환액", get: (s) => s.maxPayment },
    { label: "총 이자", get: (s) => s.totalInterest },
    { label: "총 상환액", get: (s) => s.totalPayment },
  ];
  const col = (s: LoanSchedule) => (s.method === selected ? "bg-emerald-50/70 font-bold text-emerald-800" : "text-slate-700");
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800">방식별 비교</h3>
      <table className="mt-2 w-full text-sm">
        <caption className="sr-only">원리금균등과 원금균등 상환 비교</caption>
        <thead>
          <tr className="text-xs text-slate-500">
            <td />
            {[a, b].map((s) => (
              <th key={s.method} scope="col" className={`px-2 py-2 text-right font-semibold ${s.method === selected ? "text-emerald-800" : ""}`}>
                {LOAN_METHOD_LABELS[s.method]}
                {s.method === selected && <span className="sr-only"> (선택됨)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="py-2 pr-2 text-left font-normal text-slate-600">
                {r.label}
              </th>
              {[a, b].map((s) => (
                <td key={s.method} className={`num px-2 py-2 text-right ${col(s)}`}>
                  {formatWon(r.get(s))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoanCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const method: LoanMethod = s.method === "equalPrincipal" ? "equalPrincipal" : "annuity";

  const result = useMemo(
    () => loan({ principal: parseNumber(s.principal), annualRatePct: parseNumber(s.rate), months: parseNumber(s.months) }),
    [s.principal, s.rate, s.months],
  );

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <Segmented
            label="상환 방식"
            value={method}
            onChange={set("method")}
            options={[
              { value: "annuity", label: "원리금균등" },
              { value: "equalPrincipal", label: "원금균등" },
            ]}
          />
          <NumberField
            label="대출 원금"
            value={s.principal}
            onChange={set("principal")}
            placeholder="50,000,000"
            error={issueFor(result, "principal")}
            presets={[
              { label: "1천만", value: 10_000_000 },
              { label: "3천만", value: 30_000_000 },
              { label: "5천만", value: 50_000_000 },
              { label: "1억", value: 100_000_000 },
            ]}
          />
          <NumberField label="연 이율" unit="%" value={s.rate} onChange={set("rate")} placeholder="5.5" error={issueFor(result, "annualRatePct")} help="약정서의 연 금리. 0%(무이자)도 계산돼요." />
          <NumberField
            label="상환 기간"
            unit="개월"
            value={s.months}
            onChange={set("months")}
            placeholder="60"
            error={issueFor(result, "months")}
            presets={[1, 3, 5, 10].map((y) => ({ label: `${y}년`, value: y * 12 }))}
            help={`1~${LOAN_MAX_MONTHS}개월 (거치기간 없이 바로 상환 기준)`}
          />
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="대출 원금·연 이율·상환 기간을 입력하면 월 상환액과 총 이자가 나와요.">
            {(v) => {
              const sel = method === "annuity" ? v.annuity : v.equalPrincipal;
              const other = method === "annuity" ? v.equalPrincipal : v.annuity;
              const gap = sel.totalInterest - other.totalInterest;
              return (
                <>
                  <Headline
                    label={method === "annuity" ? "월 상환액 (원리금균등)" : "첫 달 상환액 (원금균등)"}
                    value={formatWon(sel.firstPayment)}
                    sub={
                      method === "annuity"
                        ? `매달 같은 금액 · ${termLabel(v.months)} · 마지막 달 ${formatWon(sel.lastPayment)}`
                        : `매달 줄어들어 마지막 달 ${formatWon(sel.lastPayment)} · ${termLabel(v.months)}`
                    }
                    tone="good"
                  />
                  <StatGrid
                    items={[
                      { label: "총 이자", value: formatWon(sel.totalInterest), tone: "warn" },
                      { label: "총 상환액", value: formatWon(sel.totalPayment) },
                      {
                        label: `${LOAN_METHOD_LABELS[other.method]} 대비 이자`,
                        value: gap === 0 ? "차이 없음" : formatWon(gap, { sign: true }),
                        tone: gap > 0 ? "bad" : gap < 0 ? "good" : "default",
                      },
                    ]}
                  />
                  <CompareTable a={v.annuity} b={v.equalPrincipal} selected={method} />
                  <Formula
                    lines={
                      method === "annuity"
                        ? v.annualRatePct === 0
                          ? [
                              "금리 0%: 월 상환액 = 원금 ÷ 개월 수",
                              `= ${formatWon(v.principal)} ÷ ${v.months} ≈ ${formatWon(v.annuityExactPayment)} (원 단위 반올림, 마지막 달에 나머지)`,
                            ]
                          : [
                              "월 이율 r = 연 이율 ÷ 12",
                              "월 상환액 = 원금 × r × (1+r)^n ÷ ((1+r)^n − 1)",
                              `원금 ${formatWon(v.principal)}, r = ${formatNumber(v.annualRatePct / 12, 4)}%, n = ${v.months} → ${formatWon(v.annuityExactPayment)} (원 단위 반올림)`,
                              "매월 이자 = 남은 원금 × r (원 미만 절사), 원금 = 상환액 − 이자",
                            ]
                        : [
                            "월 이율 r = 연 이율 ÷ 12",
                            `매월 원금 = 원금 ÷ 개월 수 = ${formatWon(v.principal)} ÷ ${v.months} → ${formatWon(Math.floor(v.principal / v.months))} (절사, 마지막 달에 나머지)`,
                            "매월 이자 = 남은 원금 × r (원 미만 절사)",
                            "월 상환액 = 매월 원금 + 그 달 이자",
                          ]
                    }
                  />
                  <ScheduleTable key={`${method}-${v.months}`} schedule={sel} />
                </>
              );
            }}
          </ResultPanel>
          <Assumptions
            sources={[LEGAL_MAX_INTEREST]}
            items={[
              "거치기간·중도상환·금리 변동 없이 첫 달부터 매달 갚는다고 가정해요.",
              "월 이자는 원 미만을 버리고, 원리금균등 상환액은 원 단위로 반올림해요. 마지막 회차에서 남은 원금을 모두 갚아 원금 합계가 정확히 맞아요.",
              "금융회사는 일할 계산·365일 기준 등 다른 방식을 쓸 수 있어 실제 청구액과 몇 원~몇백 원 차이가 날 수 있어요.",
              "중도상환수수료, 보증료, 인지세 같은 부대비용은 포함하지 않았어요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="대출 이자 계산 결과"
              description={`${LOAN_METHOD_LABELS[method]} · 총 이자 ${formatWon(method === "annuity" ? result.value.annuity.totalInterest : result.value.equalPrincipal.totalInterest)}`}
              buildUrl={buildUrl}
              sharedFields={["상환 방식", "대출 원금", "연 이율", "상환 기간"]}
            />
          )}
        </>
      }
    />
  );
}
