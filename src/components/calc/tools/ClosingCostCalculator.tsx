"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { FieldGrid, InputCard, NumberField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { CLOSING_EXPENSES, CLOSING_RECOVERIES, closingCost, type ClosingCostInput } from "@/lib/calc/closingCost";
import { formatWon, parseNumber } from "@/lib/calc/num";

const CHECKED_AT = "2026-09-25";

type Key = keyof ClosingCostInput;
const ALL_KEYS = [...CLOSING_EXPENSES, ...CLOSING_RECOVERIES].map((f) => f.key) as Key[];
const DEFAULTS = Object.fromEntries(ALL_KEYS.map((k) => [k, ""])) as Record<Key, string>;
type State = typeof DEFAULTS;

const HELP: Partial<Record<Key, string>> = {
  demolition: "간판·인테리어 철거, 원상복구 공사",
  penalty: "임대차 중도 해지, 렌탈·통신·가맹 계약 해지 위약금",
  severance: "1년 이상 일한 직원의 퇴직금, 남은 급여·연차수당",
  unpaid: "밀린 임대료·관리비, 공과금, 부가세·소득세, 거래처 미지급금",
  loanBalance: "폐업 시 한 번에 갚아야 할 수 있는 사업자 대출",
  deposit: "원상복구·미납 차감 전 계약상 보증금",
  premium: "다음 임차인에게 받을 권리금 (확정된 경우만)",
  equipment: "중고 매입 업체 견적 기준",
  inventory: "남은 재료·상품 처분 예상액",
};

export function ClosingCostCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: Key) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, ALL_KEYS);

  const result = useMemo(() => {
    const input = Object.fromEntries(ALL_KEYS.map((k) => [k, parseNumber(s[k])])) as ClosingCostInput;
    return closingCost(input);
  }, [s]);

  return (
    <CalcColumns
      inputs={
        <>
          <InputCard title="나갈 돈 (지출)">
            <FieldGrid>
              {CLOSING_EXPENSES.map((f) => (
                <NumberField key={f.key} label={f.label} value={s[f.key]} onChange={set(f.key)} placeholder="0" error={issueFor(result, f.key)} help={HELP[f.key]} />
              ))}
            </FieldGrid>
          </InputCard>
          <InputCard title="돌려받을 돈 (회수)">
            <FieldGrid>
              {CLOSING_RECOVERIES.map((f) => (
                <NumberField key={f.key} label={f.label} value={s[f.key]} onChange={set(f.key)} placeholder="0" error={issueFor(result, f.key)} help={HELP[f.key]} />
              ))}
            </FieldGrid>
          </InputCard>
        </>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="아는 항목부터 입력하면 폐업 후 남는 돈이나 부족한 돈이 바로 계산돼요.">
            {(v) => (
              <>
                {v.outcome === "shortfall" ? (
                  <Headline label="부족액 (더 마련해야 할 돈)" value={formatWon(-v.net)} sub="돌려받을 돈보다 나갈 돈이 많아요" tone="bad" />
                ) : v.outcome === "surplus" ? (
                  <Headline label="최종 남는 돈" value={formatWon(v.net)} sub="나갈 돈을 모두 치르고 손에 남는 금액" tone="good" />
                ) : (
                  <Headline label="최종 남는 돈" value="0원" sub="나갈 돈과 돌려받을 돈이 같아요" />
                )}
                <StatGrid
                  items={[
                    { label: "지출 합계", value: formatWon(v.expenseTotal), tone: "bad" },
                    { label: "회수 합계", value: formatWon(v.recoveryTotal), tone: "good" },
                    { label: v.outcome === "shortfall" ? "부족액" : "남는 돈", value: formatWon(Math.abs(v.net)), tone: v.outcome === "shortfall" ? "bad" : "default" },
                  ]}
                />
                <Breakdown
                  title="지출 내역"
                  rows={[
                    ...v.expenses.filter((x) => x.amount > 0).map((x) => ({ label: x.label, value: formatWon(x.amount), sub: true })),
                    { label: "지출 합계", value: formatWon(v.expenseTotal), strong: true },
                  ]}
                />
                <Breakdown
                  title="회수 내역"
                  rows={[
                    ...v.recoveries.filter((x) => x.amount > 0).map((x) => ({ label: x.label, value: formatWon(x.amount), sub: true })),
                    { label: "회수 합계", value: formatWon(v.recoveryTotal), strong: true },
                  ]}
                />
                <Formula
                  lines={[
                    "최종 = 회수 합계 − 지출 합계",
                    `= ${formatWon(v.recoveryTotal)} − ${formatWon(v.expenseTotal)} = ${formatWon(v.net)}`,
                    "양수면 남는 돈, 음수면 부족액",
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            checkedAt={CHECKED_AT}
            items={[
              "보증금은 입력한 금액을 전부 돌려받는다고 보고, 원상복구비·미납 임대료는 지출에 따로 넣는 방식이에요.",
              "권리금·설비·재고 회수액은 실제 거래가 성사돼야 받을 수 있는 예상 금액이에요.",
              "폐업 후 부가세 확정신고·종합소득세, 4대보험 정산은 미납금에 추정치로 넣어 주세요.",
              "사업 통장 잔액이나 외상 매출금 회수는 포함하지 않았어요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="폐업비용 계산 결과"
              description={result.value.outcome === "shortfall" ? `부족액 ${formatWon(-result.value.net)}` : `최종 남는 돈 ${formatWon(result.value.net)}`}
              buildUrl={buildUrl}
              sharedFields={["지출 항목 6개", "회수 항목 4개"]}
            />
          )}
        </>
      }
    />
  );
}
