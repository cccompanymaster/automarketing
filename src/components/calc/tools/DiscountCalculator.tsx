"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions, type BreakdownRow } from "@/components/calc/results";
import { FieldGrid, InputCard, NumberField, Segmented, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { calcDiscount, DEFAULT_BASE_QTY, type DiscountMode } from "@/lib/calc/discount";
import { formatNumber, formatPercent, formatWon, parseNumber } from "@/lib/calc/num";

// All inputs live in one object so switching modes never clears them.
const DEFAULTS = { mode: "rate" as string, list: "", rate: "", sale: "", cost: "", qty: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["mode", "list", "rate", "sale", "cost", "qty"];
const CHECKED_AT = "2026-09-25";

export function DiscountCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const mode: DiscountMode = s.mode === "price" ? "price" : "rate";

  const result = useMemo(
    () =>
      calcDiscount({
        mode,
        listPrice: parseNumber(s.list),
        discountPct: parseNumber(s.rate),
        salePrice: parseNumber(s.sale),
        cost: parseNumber(s.cost),
        baseQty: parseNumber(s.qty),
      }),
    [mode, s.list, s.rate, s.sale, s.cost, s.qty],
  );

  return (
    <CalcColumns
      inputs={
        <>
          <InputCard>
            <Segmented
              label="계산 방식"
              value={mode}
              onChange={set("mode")}
              options={[
                { value: "rate", label: "할인율 → 할인가" },
                { value: "price", label: "할인가 → 할인율" },
              ]}
            />
            <NumberField label="정가" value={s.list} onChange={set("list")} placeholder="20,000" error={issueFor(result, "listPrice")} help="할인 전 원래 판매가" />
            {mode === "rate" ? (
              <NumberField
                label="할인율"
                unit="%"
                value={s.rate}
                onChange={set("rate")}
                placeholder="20"
                error={issueFor(result, "discountPct")}
                presets={[5, 10, 15, 20, 30, 50].map((v) => ({ label: `${v}%`, value: v }))}
                help="0% 이상 100% 미만"
              />
            ) : (
              <NumberField label="할인가" value={s.sale} onChange={set("sale")} placeholder="16,000" error={issueFor(result, "salePrice")} help="할인해서 실제로 받는 가격 (정가 이하)" />
            )}
          </InputCard>
          <InputCard title="마진까지 보기 (선택)">
            <FieldGrid>
              <NumberField label="원가" optional value={s.cost} onChange={set("cost")} placeholder="10,000" error={issueFor(result, "cost")} help="한 개 파는 데 드는 재료·포장비 등" />
              <NumberField
                label="기존 판매량"
                unit="개"
                optional
                value={s.qty}
                onChange={set("qty")}
                placeholder={String(DEFAULT_BASE_QTY)}
                error={issueFor(result, "baseQty")}
                help={`비우면 ${DEFAULT_BASE_QTY}개 기준으로 보여드려요`}
              />
            </FieldGrid>
          </InputCard>
        </>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="정가와 할인율(또는 할인가)을 입력하면 바로 계산돼요.">
            {(v) => {
              const m = v.margin;
              const vol = m?.volume ?? null;
              const rows: BreakdownRow[] = [
                { label: "정가", value: formatWon(v.listPrice) },
                { label: "할인액", value: formatWon(-v.discountAmount) },
                {
                  label: "할인가",
                  value: formatWon(v.salePrice),
                  strong: true,
                  note: mode === "rate" && v.exactSalePrice !== v.salePrice ? `계산값 ${formatNumber(v.exactSalePrice, 2)}원 → 원 단위 반올림` : undefined,
                },
              ];
              if (m) {
                rows.push(
                  { label: "원가", value: formatWon(m.cost) },
                  { label: "할인 전 개당 이익", value: formatWon(m.marginBefore), note: `마진율 ${formatPercent(m.marginRateBefore)}` },
                  {
                    label: "할인 후 개당 이익",
                    value: formatWon(m.marginAfter),
                    note: `마진율 ${formatPercent(m.marginRateAfter)}`,
                    tone: m.marginAfter <= 0 ? "bad" : "default",
                  },
                );
                if (vol) {
                  rows.push(
                    { label: `할인 전 ${formatNumber(vol.baseQty)}개 총이익`, value: formatWon(vol.baseProfit) },
                    { label: "같은 이익에 필요한 판매량", value: `${formatNumber(vol.requiredQty)}개`, strong: true },
                  );
                }
              }
              return (
                <>
                  {mode === "rate" ? (
                    <Headline label="할인가" value={formatWon(v.salePrice)} sub={`${formatWon(v.discountAmount)} 할인 (${formatPercent(v.discountRate)})`} tone="good" />
                  ) : (
                    <Headline label="할인율" value={formatPercent(v.discountRate, 2)} sub={`${formatWon(v.discountAmount)} 할인`} tone="good" />
                  )}
                  {m && (
                    <StatGrid
                      items={[
                        { label: "할인 전 마진율", value: formatPercent(m.marginRateBefore) },
                        { label: "할인 후 마진율", value: formatPercent(m.marginRateAfter), tone: m.marginAfter <= 0 ? "bad" : "default" },
                        {
                          label: "같은 이익 위해",
                          value: vol ? `${formatPercent(vol.extraRate, 0)} 더` : "불가",
                          tone: vol ? "warn" : "bad",
                          sub: vol ? `${formatNumber(vol.baseQty)}개 → ${formatNumber(vol.requiredQty)}개` : undefined,
                        },
                      ]}
                    />
                  )}
                  {m && vol && (
                    <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-100">
                      할인 전 {formatNumber(vol.baseQty)}개 팔던 이익을 지키려면 할인 후 <strong>{formatNumber(vol.requiredQty)}개</strong>를 팔아야 해요 (
                      {formatNumber(vol.extraQty)}개, 약 {formatPercent(vol.extraRate, 0)} 더).
                    </p>
                  )}
                  {m && m.volumeIssue && (
                    <p role="note" className="rounded-xl bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-700 ring-1 ring-rose-100">
                      {m.volumeIssue}
                    </p>
                  )}
                  {!m && <p className="text-xs text-slate-500">원가를 넣으면 할인 후 마진과 더 팔아야 할 수량까지 계산해 드려요.</p>}
                  <Breakdown rows={rows} />
                  <Formula
                    lines={[
                      mode === "rate" ? "할인가 = 정가 × (1 − 할인율)" : "할인율 = (정가 − 할인가) ÷ 정가",
                      mode === "rate"
                        ? `= ${formatWon(v.listPrice)} × (1 − ${formatPercent(v.discountRate, 2)}) ≈ ${formatWon(v.salePrice)}`
                        : `= (${formatWon(v.listPrice)} − ${formatWon(v.salePrice)}) ÷ ${formatWon(v.listPrice)} = ${formatPercent(v.discountRate, 2)}`,
                      ...(m ? ["마진율 = (가격 − 원가) ÷ 가격"] : []),
                      ...(vol
                        ? [
                            "필요 판매량 = 기존 판매량 × 할인 전 개당 이익 ÷ 할인 후 개당 이익 (올림)",
                            `= ${formatNumber(vol.baseQty)} × ${formatWon(m!.marginBefore)} ÷ ${formatWon(m!.marginAfter)} ≈ ${formatNumber(vol.requiredQty)}개`,
                          ]
                        : []),
                    ]}
                  />
                </>
              );
            }}
          </ResultPanel>
          <Assumptions
            checkedAt={CHECKED_AT}
            items={[
              "할인율로 계산한 할인가는 원 단위에서 반올림하고, 마진은 반올림된 할인가로 계산해요.",
              "'같은 이익'은 할인 전 총이익(개당 이익 × 판매량)을 할인 후에도 똑같이 남기는 판매량이에요. 개수는 올림해요.",
              "카드·배달 수수료, 광고비처럼 판매가에 따라 달라지는 비용은 원가에 포함되지 않았어요.",
              "정가·할인가·원가는 모두 부가세 포함 또는 모두 별도로, 같은 기준으로 입력했다고 가정해요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="할인 계산 결과"
              description={`정가 ${formatWon(result.value.listPrice)} → 할인가 ${formatWon(result.value.salePrice)} (${formatPercent(result.value.discountRate)} 할인)`}
              buildUrl={buildUrl}
              sharedFields={["계산 방식", "정가", "할인율", "할인가", "원가", "기존 판매량"]}
            />
          )}
        </>
      }
    />
  );
}
