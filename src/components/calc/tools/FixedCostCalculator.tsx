"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { FieldGrid, InputCard, NumberField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { calcFixedCost, FIXED_COST_ITEMS, type FixedCostKey, type FixedCostLine } from "@/lib/calc/fixedCost";
import { formatPercent, formatWon, parseNumber } from "@/lib/calc/num";

type State = Record<FixedCostKey, string>;
const DEFAULTS = Object.fromEntries(FIXED_COST_ITEMS.map((it) => [it.key, ""])) as State;
const SHARE_KEYS = FIXED_COST_ITEMS.map((it) => it.key) as FixedCostKey[];
const CHECKED_AT = "2026-09-25";

const HELP: Partial<Record<FixedCostKey, string>> = {
  rent: "월세 (부가세 포함 실제 이체액)",
  labor: "직원 급여 + 사업주 부담 4대보험",
  utilities: "평균 월 사용액",
  insurance: "화재·배상책임보험 등 월 환산액",
  loanInterest: "이번 달 낸 이자",
  loanPrincipal: "이번 달 갚은 원금 — 현금 유출에만 포함",
  subscriptions: "인터넷·전화·POS·배달 프로그램 월 이용료",
  other: "세무 기장료, 정기 방역 등",
};

/** Accessible bar list: text carries the numbers, the bar is decorative. */
function ShareBars({ lines }: { lines: FixedCostLine[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800">항목별 비중</h3>
      <ul className="mt-2 space-y-2.5" aria-label="고정비 항목별 비중 (큰 순서)">
        {lines.map((l) => (
          <li key={l.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-slate-700">
                {l.label}
                {l.cashOnly && <span className="ml-1 text-[11px] text-slate-400">(현금만)</span>}
              </span>
              <span className="num shrink-0 text-slate-900">
                <strong>{formatPercent(l.share)}</strong>
                <span className="ml-1.5 text-xs text-slate-500">{formatWon(l.amount)}</span>
              </span>
            </div>
            <div aria-hidden="true" className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${l.cashOnly ? "bg-slate-400" : "bg-emerald-500"}`} style={{ width: `${Math.max(1, l.share * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FixedCostCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: FixedCostKey) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);

  const result = useMemo(() => calcFixedCost(Object.fromEntries(FIXED_COST_ITEMS.map((it) => [it.key, parseNumber(s[it.key])]))), [s]);

  return (
    <CalcColumns
      inputs={
        <InputCard title="매달 나가는 돈">
          <p className="-mt-2 text-xs text-slate-500">해당하는 항목만 입력하세요. 비워 둔 항목은 0원으로 계산해요.</p>
          <FieldGrid>
            {FIXED_COST_ITEMS.map((it) => (
              <NumberField
                key={it.key}
                label={it.label}
                optional
                value={s[it.key]}
                onChange={set(it.key)}
                placeholder="0"
                error={issueFor(result, it.key)}
                help={HELP[it.key]}
              />
            ))}
          </FieldGrid>
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="고정비 항목을 하나 이상 입력하면 합계와 비중이 나와요.">
            {(v) => (
              <>
                <Headline label="월 현금 유출" value={formatWon(v.cashOutflow)} sub={`연간 ${formatWon(v.annualCash)} · 대출 원금 포함`} />
                <StatGrid
                  items={[
                    { label: "손익 기준 고정비", value: formatWon(v.accountingFixed), sub: "원금 제외 — 손익분기 계산용" },
                    { label: "대출 원금 상환", value: formatWon(v.principal) },
                    { label: "연간 손익 기준", value: formatWon(v.annualAccounting) },
                  ]}
                />
                <ShareBars lines={v.ranked} />
                <Breakdown
                  rows={[
                    ...v.lines.filter((l) => !l.cashOnly && l.amount > 0).map((l) => ({ label: l.label, value: formatWon(l.amount), sub: true })),
                    { label: "손익 기준 고정비", value: formatWon(v.accountingFixed), strong: true },
                    ...(v.principal > 0 ? [{ label: "대출 원금 상환", value: formatWon(v.principal), sub: true }] : []),
                    { label: "월 현금 유출", value: formatWon(v.cashOutflow), strong: true },
                  ]}
                />
                <Formula
                  lines={[
                    "월 현금 유출 = 모든 항목의 합",
                    "손익 기준 고정비 = 월 현금 유출 − 대출 원금 상환",
                    `= ${formatWon(v.cashOutflow)} − ${formatWon(v.principal)} = ${formatWon(v.accountingFixed)}`,
                    "항목 비중 = 항목 금액 ÷ 월 현금 유출",
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            checkedAt={CHECKED_AT}
            items={[
              "대출 원금 상환은 비용이 아니라 빚을 갚는 돈이라 손익 기준 고정비에서 빼고, 통장에서 나가는 돈(현금 유출)에만 넣었어요.",
              "공과금처럼 달마다 다른 항목은 최근 몇 달 평균을 넣으면 더 정확해요.",
              "재료비·수수료처럼 매출에 따라 변하는 비용은 고정비가 아니니 넣지 마세요.",
              "연간 금액은 월 금액 × 12로 단순 계산했어요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="월 고정비 계산 결과"
              description={`월 고정비(현금) ${formatWon(result.value.cashOutflow)} · 손익 기준 ${formatWon(result.value.accountingFixed)}`}
              buildUrl={buildUrl}
              sharedFields={FIXED_COST_ITEMS.map((it) => it.label)}
            />
          )}
        </>
      }
    />
  );
}
