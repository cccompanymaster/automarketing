"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { InputCard, NumberField, Segmented, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { vatFromSupply, vatFromTotal } from "@/lib/calc/vat";
import { formatNumber, formatPercent, formatWon, parseNumber } from "@/lib/calc/num";
import { VAT } from "@/lib/calc/rates";

type Mode = "total" | "supply";

const DEFAULTS = { mode: "total" as Mode as string, total: "", supply: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["mode", "total", "supply"];
const RATE = VAT.value.rate;
const RATE_TEXT = formatPercent(RATE, 0);
const SIMPLIFIED = `${formatNumber(VAT.value.simplifiedThreshold / 10_000)}만 원`;

export function VatCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const mode = (s.mode === "supply" ? "supply" : "total") as Mode;

  const fromTotal = useMemo(() => vatFromTotal({ total: parseNumber(s.total) }), [s.total]);
  const fromSupply = useMemo(() => vatFromSupply({ supply: parseNumber(s.supply) }), [s.supply]);
  const active = mode === "total" ? fromTotal : fromSupply;

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <Segmented
            label="계산 방향"
            value={mode}
            onChange={set("mode")}
            options={[
              { value: "total", label: "합계금액 → 공급가액" },
              { value: "supply", label: "공급가액 → 합계금액" },
            ]}
          />
          {mode === "total" ? (
            <NumberField
              label="합계금액 (부가세 포함)"
              value={s.total}
              onChange={set("total")}
              placeholder="11,000"
              error={issueFor(active, "total")}
              presets={[11_000, 110_000, 1_100_000].map((v) => ({ label: formatWon(v), value: v }))}
              help="손님이 실제로 낸 금액, 영수증의 합계"
            />
          ) : (
            <NumberField
              label="공급가액 (부가세 별도)"
              value={s.supply}
              onChange={set("supply")}
              placeholder="10,000"
              error={issueFor(active, "supply")}
              presets={[10_000, 100_000, 1_000_000].map((v) => ({ label: formatWon(v), value: v }))}
              help="부가세를 붙이기 전 금액"
            />
          )}
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={active} emptyHint={mode === "total" ? "부가세가 포함된 합계금액을 입력하세요." : "부가세를 붙이기 전 공급가액을 입력하세요."}>
            {(v) => (
              <>
                {mode === "total" ? (
                  <Headline label="공급가액" value={formatWon(v.supply)} sub={`부가세 ${formatWon(v.vat)}`} tone="good" />
                ) : (
                  <Headline label="합계금액 (부가세 포함)" value={formatWon(v.total)} sub={`부가세 ${formatWon(v.vat)}`} tone="good" />
                )}
                <StatGrid
                  items={[
                    { label: "공급가액", value: formatWon(v.supply) },
                    { label: `부가세 (${RATE_TEXT})`, value: formatWon(v.vat) },
                    { label: "합계금액", value: formatWon(v.total) },
                  ]}
                />
                <Breakdown
                  rows={
                    mode === "total"
                      ? [
                          { label: "합계금액", value: formatWon(v.total) },
                          { label: `÷ ${formatNumber(1 + RATE, 2)}`, value: `${formatNumber(v.exact, 2)}원`, note: "반올림 전", sub: true },
                          { label: "공급가액 (원 단위 반올림)", value: formatWon(v.supply), strong: true },
                          { label: "부가세 = 합계 − 공급가액", value: formatWon(v.vat), strong: true },
                        ]
                      : [
                          { label: "공급가액", value: formatWon(v.supply) },
                          { label: `× ${RATE_TEXT}`, value: `${formatNumber(v.exact, 2)}원`, note: "절사 전", sub: true },
                          { label: "부가세 (원 미만 절사)", value: formatWon(v.vat), strong: true },
                          { label: "합계금액", value: formatWon(v.total), strong: true },
                        ]
                  }
                />
                <Formula
                  lines={
                    mode === "total"
                      ? [
                          `공급가액 = 합계 ÷ (1 + ${RATE_TEXT})`,
                          `= ${formatWon(v.total)} ÷ ${formatNumber(1 + RATE, 2)} ≈ ${formatWon(v.supply)}`,
                          `부가세 = ${formatWon(v.total)} − ${formatWon(v.supply)} = ${formatWon(v.vat)}`,
                        ]
                      : [
                          `부가세 = 공급가액 × ${RATE_TEXT} = ${formatWon(v.vat)}`,
                          `합계 = ${formatWon(v.supply)} + ${formatWon(v.vat)} = ${formatWon(v.total)}`,
                        ]
                  }
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            sources={[VAT]}
            items={[
              `일반과세자의 ${RATE_TEXT} 세율 기준이에요. 합계 → 공급가액은 공급가액을 원 단위로 반올림한 뒤 부가세를 차액으로 구해 두 금액의 합이 항상 합계와 같아요.`,
              "공급가액 → 합계는 부가세의 원 미만을 버렸어요. 세금계산서 발행 프로그램에 따라 반올림하기도 해요.",
              `직전 연도 매출(공급대가)이 ${SIMPLIFIED} 미만인 간이과세자는 업종별 부가가치율을 곱해 세금을 내서 이 계산과 달라요.`,
              "쌀·채소·생선 같은 미가공 식료품, 의료·교육 서비스 등 면세 품목에는 부가세가 없어요. 매입세액 공제는 반영하지 않았어요.",
            ]}
          />
          {active.status === "ok" && (
            <ShareBar
              title="부가세 계산 결과"
              description={`공급가액 ${formatWon(active.value.supply)} + 부가세 ${formatWon(active.value.vat)} = ${formatWon(active.value.total)}`}
              buildUrl={buildUrl}
              sharedFields={["계산 방향", mode === "total" ? "합계금액" : "공급가액"]}
            />
          )}
        </>
      }
    />
  );
}
