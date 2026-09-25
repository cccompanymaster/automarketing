"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { FieldGrid, InputCard, NumberField, SelectField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { calcCardFee, cardTierOptions, GENERAL_TIER_KEY, GENERAL_TIER_LABEL } from "@/lib/calc/cardFee";
import { formatPercent, formatWon, parseNumber } from "@/lib/calc/num";
import { CARD_FEES, CARD_FEES_GENERAL_DEFAULT } from "@/lib/calc/rates";

const TIERS = cardTierOptions();
const GEN = CARD_FEES_GENERAL_DEFAULT.value;
const pctText = (r: number) => formatPercent(r, 2);

const DEFAULTS = { tier: TIERS[0].key, credit: "", check: "", gCredit: "", gCheck: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["tier", "credit", "check", "gCredit", "gCheck"];

export function CardFeeCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const general = s.tier === GENERAL_TIER_KEY;

  const result = useMemo(
    () =>
      calcCardFee({
        tierKey: s.tier,
        creditSales: parseNumber(s.credit),
        checkSales: parseNumber(s.check),
        generalCreditPct: parseNumber(s.gCredit),
        generalCheckPct: parseNumber(s.gCheck),
      }),
    [s],
  );

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <SelectField
            label="연 매출 구간 (전년도 카드 매출 기준)"
            value={s.tier}
            onChange={set("tier")}
            options={TIERS.map((t) => ({
              value: t.key,
              label: t.credit != null && t.check != null ? `${t.label} · 신용 ${pctText(t.credit)} / 체크 ${pctText(t.check)}` : `${t.label} · 요율 직접 입력`,
            }))}
            help="여신금융협회가 매년 영세·중소가맹점 여부를 정해 알려줘요."
          />
          <FieldGrid>
            <NumberField label="신용카드 월 매출" value={s.credit} onChange={set("credit")} placeholder="10,000,000" error={issueFor(result, "creditSales")} />
            <NumberField label="체크카드 월 매출" value={s.check} onChange={set("check")} placeholder="5,000,000" error={issueFor(result, "checkSales")} help="비워 두면 0원으로 계산" />
          </FieldGrid>
          {general && (
            <FieldGrid>
              <NumberField
                label="신용카드 수수료율"
                unit="%"
                value={s.gCredit}
                onChange={set("gCredit")}
                placeholder={String(GEN.credit * 100)}
                error={issueFor(result, "generalCreditPct")}
                help={`비우면 가정값 ${pctText(GEN.credit)}`}
              />
              <NumberField
                label="체크카드 수수료율"
                unit="%"
                value={s.gCheck}
                onChange={set("gCheck")}
                placeholder={String(GEN.check * 100)}
                error={issueFor(result, "generalCheckPct")}
                help={`비우면 가정값 ${pctText(GEN.check)}`}
              />
            </FieldGrid>
          )}
        </InputCard>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="신용카드나 체크카드 월 매출을 입력하면 수수료와 실입금액이 나와요.">
            {(v) => (
              <>
                <Headline
                  label="월 카드 수수료"
                  value={formatWon(v.totalFee)}
                  sub={`실입금액 ${formatWon(v.totalDeposit)} · 실효 수수료율 ${pctText(v.effectiveRate)}`}
                  tone="warn"
                />
                <StatGrid
                  items={[
                    { label: "신용카드 수수료", value: formatWon(v.credit.fee), sub: pctText(v.credit.rate) },
                    { label: "체크카드 수수료", value: formatWon(v.check.fee), sub: pctText(v.check.rate) },
                    { label: "연간 환산 수수료", value: formatWon(v.annualFee), sub: "월 수수료 × 12" },
                  ]}
                />
                <Breakdown
                  rows={[
                    { label: "신용카드 매출", value: formatWon(v.credit.sales) },
                    { label: `수수료 (${pctText(v.credit.rate)})`, value: formatWon(-v.credit.fee), sub: true },
                    { label: "신용카드 실입금액", value: formatWon(v.credit.deposit) },
                    { label: "체크카드 매출", value: formatWon(v.check.sales) },
                    { label: `수수료 (${pctText(v.check.rate)})`, value: formatWon(-v.check.fee), sub: true },
                    { label: "체크카드 실입금액", value: formatWon(v.check.deposit) },
                    { label: "카드 매출 합계", value: formatWon(v.totalSales) },
                    { label: "수수료 합계", value: formatWon(-v.totalFee) },
                    { label: "실입금액 합계", value: formatWon(v.totalDeposit), strong: true },
                  ]}
                />
                <Formula
                  lines={[
                    "카드별 수수료 = 카드 매출 × 수수료율 (원 단위 반올림)",
                    `신용: ${formatWon(v.credit.sales)} × ${pctText(v.credit.rate)} = ${formatWon(v.credit.fee)}`,
                    `체크: ${formatWon(v.check.sales)} × ${pctText(v.check.rate)} = ${formatWon(v.check.fee)}`,
                    "실입금액 = 카드 매출 − 수수료",
                  ]}
                />
                <p className="rounded-xl bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-800 ring-1 ring-sky-100">
                  카드 수수료는 금융 서비스라 부가세가 붙지 않아요(면세). 위 수수료가 그대로 빠지는 금액이에요.
                </p>
              </>
            )}
          </ResultPanel>
          <Assumptions
            sources={general ? [CARD_FEES, CARD_FEES_GENERAL_DEFAULT] : [CARD_FEES]}
            items={[
              "우대수수료율은 영세·중소가맹점으로 선정된 경우에만 적용돼요. 신규 가맹점은 처음엔 일반 요율로 결제되고 나중에 차액을 돌려받기도 해요.",
              `${GENERAL_TIER_LABEL} 요율은 카드사와의 개별 계약이라 기본값은 가정값이에요. 가맹점 계약 요율을 입력하세요.`,
              "실제 수수료는 카드사별·거래 건별로 계산돼서 몇 원~몇십 원 차이가 날 수 있어요. 카드 대금이 들어오는 시점 차이도 반영하지 않았어요.",
              "배달앱·PG(온라인 결제대행) 수수료, 간편결제 수수료는 별도예요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="카드 수수료 계산 결과"
              description={`월 수수료 ${formatWon(result.value.totalFee)} · 실입금 ${formatWon(result.value.totalDeposit)}`}
              buildUrl={buildUrl}
              sharedFields={general ? ["매출 구간", "신용·체크카드 매출", "수수료율"] : ["매출 구간", "신용·체크카드 매출"]}
            />
          )}
        </>
      }
    />
  );
}
