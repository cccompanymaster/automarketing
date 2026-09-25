"use client";

import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { FieldGrid, InputCard, NumberField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { promotion, type PromotionResult } from "@/lib/calc/promotion";
import { formatNumber, formatPercent, formatWon, parseNumber } from "@/lib/calc/num";

// `profit` / `orders` can arrive from the 배달 수익 계산기 link.
const DEFAULTS = {
  profit: "",
  orders: "",
  coupon: "",
  owner: "",
  usage: "",
  review: "",
  reviewPct: "",
  fixed: "",
};
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = Object.keys(DEFAULTS) as (keyof State)[];
const CHECKED_AT = "2026-09-25";

export function PromotionCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);

  const result = useMemo(
    () =>
      promotion({
        profitPerOrder: parseNumber(s.profit),
        monthlyOrders: parseNumber(s.orders),
        couponAmount: parseNumber(s.coupon),
        couponOwnerPct: parseNumber(s.owner),
        couponUsagePct: parseNumber(s.usage),
        reviewCost: parseNumber(s.review),
        reviewPct: parseNumber(s.reviewPct),
        monthlyFixed: parseNumber(s.fixed),
      }),
    [s],
  );

  const pctPresets = (vals: number[]) => vals.map((v) => ({ label: `${v}%`, value: v }));

  return (
    <CalcColumns
      inputs={
        <>
          <InputCard title="지금 가게 상황">
            <FieldGrid>
              <NumberField
                label="현재 주문당 이익"
                value={s.profit}
                onChange={set("profit")}
                allowNegative
                placeholder="3,000"
                error={issueFor(result, "profitPerOrder")}
                help="수수료·원가를 모두 뺀 한 건당 이익 (배달 수익 계산기 결과)"
              />
              <NumberField label="월 주문 수" unit="건" value={s.orders} onChange={set("orders")} placeholder="1,000" error={issueFor(result, "monthlyOrders")} help="이벤트 전 한 달 주문 수" />
            </FieldGrid>
          </InputCard>

          <InputCard title="쿠폰">
            <NumberField label="쿠폰액" value={s.coupon} onChange={set("coupon")} optional placeholder="3,000" error={issueFor(result, "couponAmount")} presets={[1000, 2000, 3000, 5000].map((v) => ({ label: `${v.toLocaleString("ko-KR")}원`, value: v }))} />
            <FieldGrid>
              <NumberField label="업주 부담률" unit="%" value={s.owner} onChange={set("owner")} optional placeholder="100" error={issueFor(result, "couponOwnerPct")} help="앱과 나눠 내면 업주 몫만 (비우면 100%)" presets={pctPresets([100, 50])} />
              <NumberField label="쿠폰 사용률" unit="%" value={s.usage} onChange={set("usage")} optional placeholder="30" error={issueFor(result, "couponUsagePct")} help="전체 주문 중 쿠폰이 쓰이는 비율 (비우면 100%)" presets={pctPresets([20, 30, 50])} />
            </FieldGrid>
          </InputCard>

          <InputCard title="리뷰 이벤트">
            <FieldGrid>
              <NumberField label="리뷰 서비스 원가" value={s.review} onChange={set("review")} optional placeholder="1,500" error={issueFor(result, "reviewCost")} help="음료·사이드 등 서비스 한 개의 원가" />
              <NumberField label="참여율" unit="%" value={s.reviewPct} onChange={set("reviewPct")} optional placeholder="20" error={issueFor(result, "reviewPct")} help="전체 주문 중 리뷰 이벤트를 신청하는 비율 (비우면 100%)" presets={pctPresets([10, 20, 30])} />
            </FieldGrid>
            <NumberField label="월 고정 이벤트비" value={s.fixed} onChange={set("fixed")} optional placeholder="100,000" error={issueFor(result, "monthlyFixed")} help="배너 제작·체험단 등 주문 수와 관계없이 드는 돈" />
          </InputCard>
        </>
      }
      result={
        <>
          <ResultPanel
            result={result}
            emptyHint="현재 주문당 이익과 월 주문 수를 입력하면 본전 주문 수가 나와요."
            impossibleExtra={(p) => (p ? <PartialStats p={p} /> : null)}
          >
            {(v) => (
              <>
                <Headline
                  label="본전 주문 수 (월)"
                  value={`${formatNumber(v.breakEvenOrders)}건`}
                  sub={v.extraOrders > 0 ? `지금보다 ${formatNumber(v.extraOrders)}건 (${formatPercent(v.extraRate)}) 더 팔아야 기존 이익과 같아요` : "주문이 늘지 않아도 기존 이익을 지켜요"}
                  tone={v.extraRate >= 0.5 ? "warn" : "good"}
                />
                <StatGrid
                  items={[
                    { label: "이벤트 후 주문당 이익", value: formatWon(v.afterProfitPerOrder) },
                    { label: "주문당 이벤트 부담", value: formatWon(v.avgEventCost) },
                    { label: "기존 월 이익", value: formatWon(v.baseMonthlyProfit) },
                    { label: "주문 그대로면 월 이익", value: formatWon(v.monthlyProfitIfFlat), tone: v.monthlyProfitIfFlat < v.baseMonthlyProfit ? "bad" : "default" },
                    { label: "필요한 증가 건수", value: `${formatNumber(v.extraOrders)}건` },
                    { label: "필요한 증가율", value: formatPercent(v.extraRate) },
                  ]}
                />
                <Breakdown
                  rows={[
                    { label: "현재 주문당 이익", value: formatWon(v.profitPerOrder) },
                    { label: "평균 쿠폰 부담", value: formatWon(-v.avgCoupon), note: `${formatWon(v.couponAmount)} × ${formatPercent(v.couponOwnerRate)} × ${formatPercent(v.couponUsageRate)}`, sub: true },
                    { label: "평균 리뷰 부담", value: formatWon(-v.avgReview), note: `${formatWon(v.reviewCost)} × ${formatPercent(v.reviewRate)}`, sub: true },
                    { label: "이벤트 후 주문당 이익", value: formatWon(v.afterProfitPerOrder), strong: true },
                    { label: "기존 월 이익", value: formatWon(v.baseMonthlyProfit), note: `${formatWon(v.profitPerOrder)} × ${formatNumber(v.monthlyOrders)}건` },
                    { label: "월 고정 이벤트비", value: formatWon(v.monthlyFixed) },
                    { label: "주문 그대로일 때 월 이벤트 비용", value: formatWon(v.monthlyEventCostIfFlat) },
                    { label: "본전 주문 수", value: `${formatNumber(v.breakEvenOrders)}건`, strong: true },
                  ]}
                />
                <Formula
                  lines={[
                    "본전 주문 수 = (기존 월 이익 + 월 고정 이벤트비) ÷ 이벤트 후 주문당 이익 (올림)",
                    `= (${formatNumber(v.baseMonthlyProfit)} + ${formatNumber(v.monthlyFixed)}) ÷ ${formatNumber(v.afterProfitPerOrder, 1)} → ${formatNumber(v.breakEvenOrders)}건`,
                    `필요한 증가 = ${formatNumber(v.breakEvenOrders)} − ${formatNumber(v.monthlyOrders)} = ${formatNumber(v.extraOrders)}건 (${formatPercent(v.extraRate)})`,
                  ]}
                />
              </>
            )}
          </ResultPanel>
          <Assumptions
            checkedAt={CHECKED_AT}
            items={[
              "평균 쿠폰 부담은 쿠폰액 × 업주 부담률 × 사용률, 평균 리뷰 부담은 서비스 원가 × 참여율로 주문 한 건에 고르게 나눠요.",
              "업주 부담률·사용률·참여율을 비워 두면 100%로 계산해요 (가장 불리한 경우).",
              "쿠폰으로 결제 금액이 줄면 앱 수수료도 조금 줄 수 있지만 여기서는 반영하지 않아요. 보수적인 결과예요.",
              "본전 주문 수는 이벤트 후에도 기존 월 이익과 같아지는 주문 수로, 건 단위로 올림해요.",
              "현재 주문당 이익이 0원 이하이거나 이벤트 후 이익이 0원 이하면 주문을 늘려도 본전이 될 수 없어 '본전 불가'로 표시해요.",
              "이벤트로 새로 온 손님의 재주문 효과는 포함하지 않았어요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="쿠폰·리뷰이벤트 손익 결과"
              description={`본전 주문 수 월 ${formatNumber(result.value.breakEvenOrders)}건 (지금보다 ${formatPercent(result.value.extraRate)} 증가 필요)`}
              buildUrl={buildUrl}
              sharedFields={["현재 주문당 이익", "월 주문 수", "쿠폰액", "업주 부담률", "쿠폰 사용률", "리뷰 서비스 원가", "참여율", "월 고정 이벤트비"]}
            />
          )}
        </>
      }
    />
  );
}

function PartialStats({ p }: { p: Partial<PromotionResult> }) {
  return (
    <StatGrid
      items={[
        { label: "현재 주문당 이익", value: formatWon(p.profitPerOrder), tone: (p.profitPerOrder ?? 0) <= 0 ? "bad" : "default" },
        { label: "주문당 이벤트 부담", value: formatWon(p.avgEventCost) },
        { label: "이벤트 후 주문당 이익", value: formatWon(p.afterProfitPerOrder), tone: "bad" },
        { label: "주문 그대로면 월 이익", value: formatWon(p.monthlyProfitIfFlat), tone: (p.monthlyProfitIfFlat ?? 0) < 0 ? "bad" : "default" },
      ]}
    />
  );
}
