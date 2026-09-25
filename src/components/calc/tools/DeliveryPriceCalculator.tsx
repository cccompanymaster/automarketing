"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions } from "@/components/calc/results";
import { CheckboxField, FieldGrid, InputCard, NumberField, Segmented, SelectField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { DELIVERY_SOURCES, REVENUE_TIERS, SALES_TIERS, parseRevenueTier, parseSalesTier, todayIso, type Channel } from "@/lib/calc/delivery";
import { deliveryPrice, ROUND_UNITS, type PriceRow } from "@/lib/calc/deliveryPrice";
import { DELIVERY_FEE_REPRESENTATIVE, DELIVERY_POLICY_NOTES } from "@/lib/calc/rates/delivery";
import { getCalc } from "@/lib/calc/registry";
import { formatNumber, formatPercent, formatWon, parseNumber } from "@/lib/calc/num";

// Keys shared with /delivery use the same names so the "확인" link can carry them.
const DEFAULTS = {
  channel: "delivery",
  cost: "",
  packaging: "",
  target: "",
  agency: "",
  tip: "",
  fee: "",
  ad: "",
  orders: "",
  tier: "mid35to50",
  rev: "t3",
  market: "",
  unit: "100",
};
type State = typeof DEFAULTS;
const SHARE_KEYS: (keyof State)[] = Object.keys(DEFAULTS) as (keyof State)[];
const DELIVERY_CARRY: (keyof State)[] = ["channel", "cost", "packaging", "agency", "tip", "fee", "ad", "orders", "tier", "rev", "market"];

export function DeliveryPriceCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const channel: Channel = s.channel === "pickup" ? "pickup" : "delivery";
  const salesTier = parseSalesTier(s.tier);
  const revenueTier = parseRevenueTier(s.rev);
  const unit = (ROUND_UNITS as readonly number[]).includes(Number(s.unit)) ? Number(s.unit) : 100;

  const result = useMemo(
    () =>
      deliveryPrice({
        channel,
        cost: parseNumber(s.cost),
        packaging: parseNumber(s.packaging),
        targetProfit: parseNumber(s.target),
        agencyFee: parseNumber(s.agency),
        customerTip: parseNumber(s.tip),
        actualDeliveryFee: parseNumber(s.fee),
        monthlyAd: parseNumber(s.ad),
        monthlyOrders: parseNumber(s.orders),
        salesTier,
        revenueTier,
        traditionalMarket: s.market === "1",
        roundUnit: unit,
        asOf: todayIso(),
      }),
    [s, channel, salesTier, revenueTier, unit],
  );

  const checkLink = (price: number) => {
    const q = new URLSearchParams();
    for (const k of DELIVERY_CARRY) if (s[k]) q.set(k, s[k]);
    q.set("price", String(price));
    return `${getCalc("delivery").path}?${q.toString()}`;
  };

  return (
    <CalcColumns
      inputs={
        <>
          <InputCard>
            <Segmented
              label="주문 방식"
              value={channel}
              onChange={set("channel")}
              options={[
                { value: "delivery", label: "배달 주문" },
                { value: "pickup", label: "포장 주문" },
              ]}
            />
            <NumberField
              label="목표 주문당 이익"
              value={s.target}
              onChange={set("target")}
              placeholder="5,000"
              error={issueFor(result, "targetProfit")}
              help="모든 비용을 빼고 한 건에 남기고 싶은 돈 (0원 = 본전)"
              presets={[2000, 3000, 5000, 7000].map((v) => ({ label: `${v.toLocaleString("ko-KR")}원`, value: v }))}
            />
            <FieldGrid>
              <NumberField label="음식 원가" value={s.cost} onChange={set("cost")} placeholder="7,000" error={issueFor(result, "cost")} />
              <NumberField label="포장비" value={s.packaging} onChange={set("packaging")} placeholder="500" optional error={issueFor(result, "packaging")} />
            </FieldGrid>
          </InputCard>

          {channel === "delivery" && (
            <InputCard title="배달비">
              <FieldGrid>
                <NumberField label="외부 배달대행료" value={s.agency} onChange={set("agency")} placeholder="4,500" optional error={issueFor(result, "agencyFee")} help="비우면 배민 가게배달은 비교에서 빠져요" />
                <NumberField label="고객 부담 배달팁" value={s.tip} onChange={set("tip")} placeholder="3,000" optional error={issueFor(result, "customerTip")} help="가게배달에서 손님이 내는 팁" />
              </FieldGrid>
              <NumberField
                label="실제 플랫폼 배달비"
                value={s.fee}
                onChange={set("fee")}
                optional
                placeholder={DELIVERY_FEE_REPRESENTATIVE.value.representative[salesTier].toLocaleString("ko-KR")}
                error={issueFor(result, "actualDeliveryFee")}
                help="정산서의 업주 부담 배달비. 비우면 매출 구간 대표값(가정값)을 써요."
              />
            </InputCard>
          )}

          <InputCard title="광고비·매출 구간">
            <FieldGrid>
              <NumberField label="월 광고비" value={s.ad} onChange={set("ad")} placeholder="300,000" optional error={issueFor(result, "monthlyAd")} />
              <NumberField label="월 주문 수" unit="건" value={s.orders} onChange={set("orders")} placeholder="600" optional error={issueFor(result, "monthlyOrders")} />
            </FieldGrid>
            <SelectField label="앱 매출 구간" value={salesTier} onChange={set("tier")} options={SALES_TIERS.map((t) => ({ value: t.key, label: t.label }))} />
            <SelectField label="연 매출 구간" value={revenueTier} onChange={set("rev")} options={REVENUE_TIERS.map((t) => ({ value: t.key, label: t.label }))} help="배민 결제정산이용료 구간에 쓰여요." />
            {channel === "pickup" && (
              <CheckboxField label="전통시장 안의 매장이에요" checked={s.market === "1"} onChange={(v) => set("market")(v ? "1" : "")} />
            )}
            <Segmented
              label="가격 올림 단위"
              value={String(unit)}
              onChange={set("unit")}
              options={ROUND_UNITS.map((u) => ({ value: String(u), label: `${u.toLocaleString("ko-KR")}원` }))}
            />
          </InputCard>
        </>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="음식 원가와 목표 주문당 이익을 입력하면 앱별 권장 판매가가 나와요.">
            {(v) => {
              const best = v.cheapest;
              const o = best.order!;
              return (
                <>
                  <Headline
                    label={`가장 낮은 권장가 · ${best.label}`}
                    value={formatWon(best.recommendedPrice)}
                    sub={`이 가격이면 주문당 ${formatWon(o.profit)} 남아요 (목표 ${formatWon(v.targetProfit)})`}
                    tone="good"
                  />
                  <PriceRows rows={v.rows} unit={v.roundUnit} checkLink={checkLink} />
                  <StatGrid
                    items={[
                      { label: "계산상 최소 판매가", value: formatWon(best.minPrice), sub: "원 단위 올림" },
                      { label: "권장가의 수익률", value: formatPercent(o.margin) },
                      { label: "권장가의 통장 입금액", value: formatWon(o.deposit) },
                    ]}
                  />
                  <Breakdown
                    title={`세부 계산 내역 — ${best.label} ${formatWon(best.recommendedPrice)}`}
                    rows={[
                      { label: "권장가", value: formatWon(o.price) },
                      { label: `중개수수료 ${formatPercent(o.commissionRate, 2)}`, value: formatWon(-o.commission) },
                      { label: `결제수수료 ${formatPercent(o.paymentRate, 2)}`, value: formatWon(-o.payment) },
                      ...(o.kind === "platformDelivery" ? [{ label: "업주 부담 배달비", value: formatWon(-o.ownerDeliveryFee) }] : []),
                      ...(o.kind === "storeDelivery" ? [{ label: "고객 배달팁 (업주 정산)", value: formatWon(o.settlementBase - o.price, { sign: true }) }] : []),
                      { label: "수수료 부가세", value: formatWon(-o.feeVat) },
                      { label: "통장 입금액", value: formatWon(o.deposit), strong: true },
                      { label: "원가 + 포장비", value: formatWon(-(o.cost + o.packaging)) },
                      { label: "광고비 (주문당)", value: formatWon(-o.adPerOrder) },
                      ...(o.kind === "storeDelivery" ? [{ label: "외부 배달대행료", value: formatWon(-o.agencyFee) }] : []),
                      { label: "예상 주문당 이익", value: formatWon(o.profit), strong: true, tone: "good" as const },
                    ]}
                  />
                  <Formula
                    lines={[
                      "주문당 이익 = a × 판매가 + b (배달 수익 계산기와 같은 계산)",
                      `a = 1 − (중개 ${formatPercent(o.commissionRate, 2)} + 결제 ${formatPercent(o.paymentRate, 2)}) × (1 + 부가세 ${formatPercent(o.vatRate)}) = ${formatNumber(best.slope, 4)}`,
                      `b = 판매가가 0원일 때의 이익 = ${formatWon(best.intercept)}`,
                      `최소 판매가 = (목표 이익 − b) ÷ a = (${formatNumber(v.targetProfit)} − (${formatNumber(best.intercept)})) ÷ ${formatNumber(best.slope, 4)} ≈ ${formatWon(best.minPrice)}`,
                      `권장가 = ${formatNumber(v.roundUnit)}원 단위 올림 → ${formatWon(best.recommendedPrice)}`,
                    ]}
                  />
                </>
              );
            }}
          </ResultPanel>
          <Assumptions
            sources={[...DELIVERY_SOURCES, DELIVERY_POLICY_NOTES]}
            items={[
              "배달 수익 계산기(단순 모드)와 똑같은 계산식으로 역산해요. 권장가를 그 계산기에 넣으면 같은 이익이 나와요.",
              "할인·쿠폰이 없는 주문 기준이에요. 할인을 자주 한다면 목표 이익을 그만큼 높게 잡으세요.",
              "수수료·배달비 기본값은 보도·공지 요약에서 옮긴 가정값이에요. 배달비는 매출 구간 대표값(구간 중간값)이라 거리에 따라 달라요.",
              "배민 가게배달은 외부 대행료를 넣지 않으면 가격을 추정하지 않고 비교에서 빼요.",
              "가격을 올리면 주문 수가 줄 수 있어요. 여기서는 주문 수 변화는 반영하지 않아요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="배달가격 역산 결과"
              description={`목표 이익 ${formatWon(result.value.targetProfit)} → ${result.value.cheapest.label} 권장가 ${formatWon(result.value.cheapest.recommendedPrice)}`}
              buildUrl={buildUrl}
              sharedFields={["주문 방식", "목표 주문당 이익", "음식 원가", "포장비", "외부 배달대행료", "고객 부담 배달팁", "실제 플랫폼 배달비", "월 광고비", "월 주문 수", "앱 매출 구간", "연 매출 구간", "전통시장 여부", "가격 올림 단위"]}
            />
          )}
        </>
      }
    />
  );
}

function PriceRows({ rows, unit, checkLink }: { rows: PriceRow[]; unit: number; checkLink: (price: number) => string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800">앱별 권장 판매가 ({unit.toLocaleString("ko-KR")}원 단위)</h3>
      <ul className="mt-2 space-y-2">
        {rows.map((r, i) => (
          <li key={r.key} className={`rounded-xl px-3.5 py-3 ring-1 ${i === 0 && r.status === "ok" ? "bg-emerald-50/70 ring-emerald-200" : "bg-white ring-slate-100"}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-900">{r.label}</p>
              {r.status === "ok" ? (
                <p className="num text-base font-extrabold text-slate-900">{formatWon(r.recommendedPrice)}</p>
              ) : (
                <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold ${r.status === "excluded" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                  {r.status === "excluded" ? "대행료 미입력" : "계산 불가"}
                </span>
              )}
            </div>
            {r.status === "ok" && r.order ? (
              <p className="num mt-1 text-xs text-slate-500">
                최소 {formatWon(r.minPrice)} · 예상 이익 {formatWon(r.order.profit)} · 수익률 {formatPercent(r.order.margin)} ·{" "}
                <Link href={checkLink(r.recommendedPrice!)} className="font-semibold text-emerald-700 underline underline-offset-2">
                  수익 계산기에서 확인
                </Link>
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">{r.reason}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
