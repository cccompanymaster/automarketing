"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { InputCard, NumberField, Segmented, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { marginOfPrice, priceForMargin } from "@/lib/calc/margin";
import { formatPercent, formatWon, parseNumber } from "@/lib/calc/num";

type Mode = "price" | "check";

// All inputs live in one object so switching modes never clears them.
const DEFAULTS = { mode: "price" as Mode as string, cost: "", target: "", price: "" };
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = ["mode", "cost", "target", "price"];
const CHECKED_AT = "2026-09-25";

export function MarginCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const mode = (s.mode === "check" ? "check" : "price") as Mode;

  const forPrice = useMemo(
    () => priceForMargin({ cost: parseNumber(s.cost), targetMarginPct: parseNumber(s.target) }),
    [s.cost, s.target],
  );
  const ofPrice = useMemo(
    () => marginOfPrice({ cost: parseNumber(s.cost), price: parseNumber(s.price) }),
    [s.cost, s.price],
  );
  const active = mode === "price" ? forPrice : ofPrice;

  return (
    <CalcColumns
      inputs={
        <InputCard>
          <Segmented
            label="계산 방식"
            value={mode}
            onChange={set("mode")}
            options={[
              { value: "price", label: "목표 마진 → 판매가" },
              { value: "check", label: "판매가 → 마진 확인" },
            ]}
          />
          <NumberField label="원가" value={s.cost} onChange={set("cost")} placeholder="7,000" error={issueFor(active, "cost")} help="재료비·포장비 등 한 개를 만드는 데 드는 돈" />
          {mode === "price" ? (
            <NumberField
              label="목표 마진율"
              unit="%"
              value={s.target}
              onChange={set("target")}
              placeholder="30"
              error={issueFor(active, "targetMarginPct")}
              presets={[20, 30, 40, 50].map((v) => ({ label: `${v}%`, value: v }))}
              help="판매가 중 이익이 차지하는 비율 (100% 미만)"
            />
          ) : (
            <NumberField label="현재 판매가" value={s.price} onChange={set("price")} placeholder="10,000" error={issueFor(active, "price")} />
          )}
        </InputCard>
      }
      result={
        <>
          {mode === "price" ? (
            <ResultPanel result={forPrice} emptyHint="원가와 목표 마진율을 입력하면 필요한 판매가가 나와요.">
              {(v) => (
                <>
                  <Headline label="필요 판매가" value={formatWon(v.price)} sub="원 단위 올림 — 목표 마진율 이상이 보장돼요" tone="good" />
                  <StatGrid
                    items={[
                      { label: "마진액", value: formatWon(v.marginAmount) },
                      { label: "실제 마진율", value: formatPercent(v.marginRate, 2) },
                      { label: "원가율", value: formatPercent(v.costRate, 2) },
                      { label: "마크업률", value: formatPercent(v.markupRate, 1) },
                    ]}
                  />
                  <Breakdown
                    rows={[
                      { label: "원가", value: formatWon(v.cost) },
                      { label: "계산상 판매가", value: `${v.exactPrice.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원`, note: "올림 전" },
                      { label: "필요 판매가 (올림)", value: formatWon(v.price), strong: true },
                      { label: "마진액 = 판매가 − 원가", value: formatWon(v.marginAmount) },
                    ]}
                  />
                  <Formula
                    lines={[
                      "필요 판매가 = 원가 ÷ (1 − 목표 마진율)",
                      `= ${formatWon(v.cost)} ÷ (1 − ${s.target}%) ≈ ${formatWon(v.price)}`,
                      "마크업률 = 마진액 ÷ 원가",
                    ]}
                  />
                </>
              )}
            </ResultPanel>
          ) : (
            <ResultPanel result={ofPrice} emptyHint="원가와 판매가를 입력하면 마진이 바로 계산돼요.">
              {(v) => (
                <>
                  <Headline label="마진율" value={formatPercent(v.marginRate, 2)} sub={`개당 마진 ${formatWon(v.marginAmount)}`} tone={v.marginAmount < 0 ? "bad" : "good"} />
                  <StatGrid
                    items={[
                      { label: "마진액", value: formatWon(v.marginAmount), tone: v.marginAmount < 0 ? "bad" : "default" },
                      { label: "원가율", value: formatPercent(v.costRate, 2) },
                      { label: "마크업률", value: v.markupRate == null ? "계산 불가" : formatPercent(v.markupRate, 1) },
                    ]}
                  />
                  <Breakdown
                    rows={[
                      { label: "판매가", value: formatWon(v.price) },
                      { label: "원가", value: formatWon(-v.cost) },
                      { label: "마진액", value: formatWon(v.marginAmount), strong: true },
                    ]}
                  />
                  <Formula lines={["마진율 = (판매가 − 원가) ÷ 판매가", "원가율 = 원가 ÷ 판매가", "마크업률 = (판매가 − 원가) ÷ 원가"]} />
                </>
              )}
            </ResultPanel>
          )}
          <Assumptions
            checkedAt={CHECKED_AT}
            items={[
              "판매가·원가는 부가세를 같은 기준(포함 또는 별도)으로 입력했다고 가정해요.",
              "카드·배달 수수료, 인건비, 임대료 같은 다른 비용은 포함하지 않은 단순 마진이에요.",
              "마진율(판매가 기준)과 마크업률(원가 기준)은 다른 개념이니 헷갈리지 마세요.",
            ]}
          />
          {active.status === "ok" && (
            <ShareBar
              title="마진 계산 결과"
              description={mode === "price" ? `필요 판매가 ${forPrice.status === "ok" ? formatWon(forPrice.value.price) : ""}` : `마진율 ${ofPrice.status === "ok" ? formatPercent(ofPrice.value.marginRate) : ""}`}
              buildUrl={buildUrl}
              sharedFields={["계산 방식", "원가", mode === "price" ? "목표 마진율" : "판매가"]}
            />
          )}
        </>
      }
    />
  );
}
