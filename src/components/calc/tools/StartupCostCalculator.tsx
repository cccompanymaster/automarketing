"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { FieldGrid, InputCard, NumberField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { CONSUMABLE_KEYS, CONSUMABLE_LABELS, startupCost, type ConsumableKey } from "@/lib/calc/startupCost";
import { formatPercent, formatWon, parseNumber, safeDiv } from "@/lib/calc/num";

const CHECKED_AT = "2026-09-25";

const DEFAULTS = {
  deposit: "",
  premium: "",
  interior: "",
  equipment: "",
  initialStock: "",
  franchiseFee: "",
  permits: "",
  marketing: "",
  other: "",
  reserve: "",
  opex: "",
  months: "",
};
type State = typeof DEFAULTS;
const SHARE_KEYS = Object.keys(DEFAULTS) as (keyof State)[];

const CONSUMABLE_HELP: Partial<Record<ConsumableKey, string>> = {
  interior: "철거·설계·시공·간판 포함",
  equipment: "주방기기·냉장고·POS·집기",
  initialStock: "오픈 전 첫 재료·상품 매입",
  franchiseFee: "프랜차이즈라면 가맹비·교육비·보증금 제외 금액",
  permits: "영업신고·위생교육·소방 등",
};

export function StartupCostCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);

  const result = useMemo(
    () =>
      startupCost({
        deposit: parseNumber(s.deposit),
        premium: parseNumber(s.premium),
        interior: parseNumber(s.interior),
        equipment: parseNumber(s.equipment),
        initialStock: parseNumber(s.initialStock),
        franchiseFee: parseNumber(s.franchiseFee),
        permits: parseNumber(s.permits),
        marketing: parseNumber(s.marketing),
        other: parseNumber(s.other),
        contingencyPct: parseNumber(s.reserve),
        monthlyOpex: parseNumber(s.opex),
        months: parseNumber(s.months),
      }),
    [s],
  );

  return (
    <CalcColumns
      inputs={
        <>
          <InputCard title="점포 계약">
            <FieldGrid>
              <NumberField label="보증금" value={s.deposit} onChange={set("deposit")} placeholder="30,000,000" error={issueFor(result, "deposit")} help="계약 종료 시 돌려받는 돈" />
              <NumberField label="권리금" value={s.premium} onChange={set("premium")} placeholder="20,000,000" error={issueFor(result, "premium")} help="나갈 때 다시 받을 수 있을지 불확실" />
            </FieldGrid>
          </InputCard>
          <InputCard title="소모 비용 (돌려받지 못하는 돈)">
            <FieldGrid>
              {CONSUMABLE_KEYS.map((k) => (
                <NumberField key={k} label={CONSUMABLE_LABELS[k]} value={s[k]} onChange={set(k)} placeholder="0" error={issueFor(result, k)} help={CONSUMABLE_HELP[k]} />
              ))}
            </FieldGrid>
            <NumberField
              label="예비비율"
              unit="%"
              value={s.reserve}
              onChange={set("reserve")}
              placeholder="10"
              error={issueFor(result, "contingencyPct")}
              presets={[10, 15, 20].map((v) => ({ label: `${v}%`, value: v }))}
              help="공사비 증가·추가 설비에 대비해 소모 비용에만 더하는 여유분"
            />
          </InputCard>
          <InputCard title="운영자금">
            <FieldGrid>
              <NumberField label="월 운영비" value={s.opex} onChange={set("opex")} placeholder="8,000,000" error={issueFor(result, "monthlyOpex")} help="임대료·인건비·재료비·공과금 등 한 달 고정 지출" />
              <NumberField
                label="버틸 개월 수"
                unit="개월"
                value={s.months}
                onChange={set("months")}
                placeholder="6"
                error={issueFor(result, "months")}
                presets={[3, 6, 12].map((v) => ({ label: `${v}개월`, value: v }))}
                help="매출이 자리 잡기 전까지 버틸 기간"
              />
            </FieldGrid>
          </InputCard>
        </>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="보증금·인테리어 등 아는 항목부터 입력하면 필요한 현금이 바로 합산돼요.">
            {(v) => (
              <>
                <Headline label="초기 필요 현금" value={formatWon(v.total)} sub="보증금 + 권리금 + 소모 비용 + 예비비 + 운영자금" tone="good" />
                <StatGrid
                  items={[
                    { label: "회수 가능 (보증금)", value: formatWon(v.deposit), sub: v.total ? formatPercent(safeDiv(v.deposit, v.total)) : undefined },
                    { label: "회수 불확실 (권리금)", value: formatWon(v.premium), tone: v.premium > 0 ? "warn" : "default", sub: v.total ? formatPercent(safeDiv(v.premium, v.total)) : undefined },
                    { label: "소모 비용 + 예비비", value: formatWon(v.sunk), tone: "bad", sub: v.total ? formatPercent(safeDiv(v.sunk, v.total)) : undefined },
                    { label: "운영자금", value: formatWon(v.operating), sub: v.total ? formatPercent(safeDiv(v.operating, v.total)) : undefined },
                  ]}
                />
                <Breakdown
                  rows={[
                    { label: "보증금 (회수 가능)", value: formatWon(v.deposit) },
                    { label: "권리금 (회수 불확실)", value: formatWon(v.premium) },
                    { label: "소모 비용 합계", value: formatWon(v.consumableTotal) },
                    ...v.consumables.filter((c) => c.amount > 0).map((c) => ({ label: c.label, value: formatWon(c.amount), sub: true })),
                    { label: `예비비 (소모 비용 × ${v.contingencyPct}%)`, value: formatWon(v.contingency), note: "원 단위 올림" },
                    { label: `운영자금 (${formatWon(v.monthlyOpex)} × ${v.months}개월)`, value: formatWon(v.operating) },
                    { label: "초기 필요 현금", value: formatWon(v.total), strong: true },
                  ]}
                />
                <Formula
                  lines={[
                    "예비비 = 소모 비용 × 예비비율 (보증금·권리금 제외)",
                    `= ${formatWon(v.consumableTotal)} × ${v.contingencyPct}% = ${formatWon(v.contingency)}`,
                    `운영자금 = ${formatWon(v.monthlyOpex)} × ${v.months}개월 = ${formatWon(v.operating)}`,
                    "초기 필요 현금 = 보증금 + 권리금 + 소모 비용 + 예비비 + 운영자금",
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            checkedAt={CHECKED_AT}
            items={[
              "보증금은 돌려받는 돈으로 보지만, 원상복구비·밀린 임대료를 빼고 돌려받는 경우가 많아요.",
              "권리금은 폐업·이전 때 다음 임차인에게서 받아야 회수돼서 돌려받는 돈으로도, 사라지는 돈으로도 확정하지 않고 따로 표시해요.",
              "예비비는 늘어나기 쉬운 소모 비용에만 적용하고, 보증금·권리금에는 붙이지 않아요.",
              "부가세 환급, 대출 이자, 정부 지원금은 반영하지 않았어요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="창업비용 계산 결과"
              description={`초기 필요 현금 ${formatWon(result.value.total)}`}
              buildUrl={buildUrl}
              sharedFields={["보증금", "권리금", "소모 비용 항목", "예비비율", "월 운영비", "버틸 개월 수"]}
            />
          )}
        </>
      }
    />
  );
}
