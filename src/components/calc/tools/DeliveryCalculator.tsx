"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalcColumns, ResultPanel, Headline, StatGrid, Breakdown, Formula, Assumptions, type BreakdownRow } from "@/components/calc/results";
import { CheckboxField, FieldGrid, InputCard, NumberField, Segmented, SelectField, issueFor } from "@/components/calc/fields";
import { ShareBar, useUrlInputs } from "@/components/calc/share";
import { DeliveryCompareTable, DeliveryRankList } from "@/components/calc/tools/DeliveryResultParts";
import {
  DELIVERY_SOURCES,
  DISCOUNT_BEARERS,
  PLATFORMS,
  REVENUE_TIERS,
  SALES_TIERS,
  delivery,
  parseRevenueTier,
  parseSalesTier,
  platformsFor,
  todayIso,
  type Channel,
  type DiscountBearer,
  type PlatformKey,
  type PlatformOrder,
  type PlatformOverride,
} from "@/lib/calc/delivery";
import { DELIVERY_FEE_REPRESENTATIVE, DELIVERY_POLICY_NOTES } from "@/lib/calc/rates/delivery";
import { VAT } from "@/lib/calc/rates";
import { getCalc } from "@/lib/calc/registry";
import { formatNumber, formatPercent, formatWon, parseNumber } from "@/lib/calc/num";

// Override inputs: ov_<platform>_<c|p|d|v> (중개%, 결제%, 배달비, 부가세%).
const OV_FIELDS = [
  { suffix: "c", key: "commissionPct", issue: "commission", label: "중개수수료율", unit: "%" },
  { suffix: "p", key: "paymentPct", issue: "payment", label: "결제수수료율", unit: "%" },
  { suffix: "d", key: "deliveryFee", issue: "deliveryFee", label: "업주 부담 배달비", unit: "원" },
  { suffix: "v", key: "vatPct", issue: "vat", label: "수수료 부가세율", unit: "%" },
] as const;
const ovKey = (p: PlatformKey, suffix: string) => `ov_${p}_${suffix}`;

// All inputs live in one object so switching mode / channel never clears them.
const DEFAULTS: Record<string, string> = {
  mode: "simple",
  channel: "delivery",
  price: "",
  cost: "",
  packaging: "",
  tier: "mid35to50",
  rev: "t3",
  market: "",
  tip: "",
  fee: "",
  agency: "",
  ad: "",
  orders: "",
  discount: "",
  bearer: "owner",
  listBasis: "1",
  ...Object.fromEntries(PLATFORMS.flatMap((p) => OV_FIELDS.map((f) => [ovKey(p.key, f.suffix), ""]))),
};
type State = typeof DEFAULTS;
const SHARE_KEYS = Object.keys(DEFAULTS);

const won = (n: number) => formatWon(n);
const rate = (r: number) => formatPercent(r, 2);

export function DeliveryCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);
  const set = (k: string) => (v: string) => setS((p) => ({ ...p, [k]: v }));
  const buildUrl = useUrlInputs(s, setS, SHARE_KEYS);
  const precise = s.mode === "precise";
  const channel: Channel = s.channel === "pickup" ? "pickup" : "delivery";
  const salesTier = parseSalesTier(s.tier);
  const revenueTier = parseRevenueTier(s.rev);
  const bearer = (DISCOUNT_BEARERS.some((b) => b.key === s.bearer) ? s.bearer : "owner") as DiscountBearer;

  const result = useMemo(() => {
    const overrides: Partial<Record<PlatformKey, PlatformOverride>> = {};
    for (const p of PLATFORMS) {
      const o: PlatformOverride = {};
      for (const f of OV_FIELDS) o[f.key] = parseNumber(s[ovKey(p.key, f.suffix)]);
      if (Object.values(o).some((v) => v != null)) overrides[p.key] = o;
    }
    return delivery({
      mode: precise ? "precise" : "simple",
      channel,
      price: parseNumber(s.price),
      cost: parseNumber(s.cost),
      packaging: parseNumber(s.packaging),
      customerTip: parseNumber(s.tip),
      actualDeliveryFee: parseNumber(s.fee),
      agencyFee: parseNumber(s.agency),
      monthlyAd: parseNumber(s.ad),
      monthlyOrders: parseNumber(s.orders),
      salesTier,
      revenueTier,
      traditionalMarket: s.market === "1",
      asOf: todayIso(),
      discount: parseNumber(s.discount),
      discountBearer: bearer,
      listPriceBasis: s.listBasis !== "0",
      overrides,
    });
  }, [s, precise, channel, salesTier, revenueTier, bearer]);

  const platforms = platformsFor(channel);
  const band = DELIVERY_FEE_REPRESENTATIVE.value.bands[salesTier];

  return (
    <CalcColumns
      inputs={
        <>
          <InputCard>
            <Segmented
              label="계산 모드"
              value={precise ? "precise" : "simple"}
              onChange={set("mode")}
              options={[
                { value: "simple", label: "단순 모드" },
                { value: "precise", label: "정밀 모드" },
              ]}
            />
            <Segmented
              label="주문 방식"
              value={channel}
              onChange={set("channel")}
              options={[
                { value: "delivery", label: "배달 주문" },
                { value: "pickup", label: "포장 주문" },
              ]}
            />
            <p className="text-xs leading-relaxed text-slate-500">
              {precise
                ? "정밀 모드: 할인과 앱별 수수료율·배달비를 정산서 값으로 바꿀 수 있어요."
                : "단순 모드: 매출 구간별 기본 수수료로 빠르게 비교해요. 입력값은 모드를 바꿔도 그대로 남아요."}
            </p>
          </InputCard>

          <InputCard title="메뉴 한 건">
            <FieldGrid>
              <NumberField label="판매가" value={s.price} onChange={set("price")} placeholder="20,000" error={issueFor(result, "price")} help="앱에 올린 메뉴 가격 (할인 전)" />
              <NumberField label="원가" value={s.cost} onChange={set("cost")} placeholder="7,000" error={issueFor(result, "cost")} help="재료비 등 한 건을 만드는 데 드는 돈" />
            </FieldGrid>
            <NumberField label="포장비" value={s.packaging} onChange={set("packaging")} placeholder="500" optional error={issueFor(result, "packaging")} help="용기·봉투·수저 등 주문 한 건당" presets={[300, 500, 800, 1000].map((v) => ({ label: `${v.toLocaleString("ko-KR")}원`, value: v }))} />
          </InputCard>

          <InputCard title="매출 구간">
            <SelectField
              label="앱 매출 구간"
              value={salesTier}
              onChange={set("tier")}
              options={SALES_TIERS.map((t) => ({ value: t.key, label: t.label }))}
              help="앱이 직전 3개월 매출로 분기마다 정하는 구간이에요. 사장님 앱에서 확인할 수 있어요."
            />
            <SelectField
              label="연 매출 구간"
              value={revenueTier}
              onChange={set("rev")}
              options={REVENUE_TIERS.map((t) => ({ value: t.key, label: t.label }))}
              help="카드 우대수수료와 같은 영세·중소 구간 — 배민 결제정산이용료가 이 구간에 따라 달라져요."
            />
            {channel === "pickup" && (
              <CheckboxField
                label="전통시장 안의 매장이에요"
                checked={s.market === "1"}
                onChange={(v) => set("market")(v ? "1" : "")}
                help="쿠팡이츠 포장 수수료 면제 대상 여부에 쓰여요."
              />
            )}
          </InputCard>

          {channel === "delivery" && (
            <InputCard title="배달비">
              <NumberField
                label="실제 플랫폼 배달비"
                value={s.fee}
                onChange={set("fee")}
                optional
                placeholder={DELIVERY_FEE_REPRESENTATIVE.value.representative[salesTier].toLocaleString("ko-KR")}
                error={issueFor(result, "actualDeliveryFee")}
                help={`정산서에 찍힌 업주 부담 배달비 (배민배달·쿠팡이츠·요기배달·땡겨요). 비워 두면 이 구간(${band.min.toLocaleString("ko-KR")}~${band.max.toLocaleString("ko-KR")}원)의 중간값을 써요.`}
              />
              <FieldGrid>
                <NumberField label="고객 부담 배달팁" value={s.tip} onChange={set("tip")} optional placeholder="3,000" error={issueFor(result, "customerTip")} help="가게배달에서 손님이 내는 배달팁 (업주에게 정산)" />
                <NumberField label="외부 배달대행료" value={s.agency} onChange={set("agency")} optional placeholder="4,500" error={issueFor(result, "agencyFee")} help="가게배달 때 대행사에 내는 건당 요금" />
              </FieldGrid>
            </InputCard>
          )}

          <InputCard title="광고비">
            <FieldGrid>
              <NumberField label="월 광고비" value={s.ad} onChange={set("ad")} optional placeholder="300,000" error={issueFor(result, "monthlyAd")} />
              <NumberField label="월 주문 수" unit="건" value={s.orders} onChange={set("orders")} optional placeholder="600" error={issueFor(result, "monthlyOrders")} help="광고비를 주문당으로 나누고 월 차이를 계산해요" />
            </FieldGrid>
          </InputCard>

          {precise && (
            <InputCard title="할인 (정밀)">
              <NumberField label="음식값 할인액" value={s.discount} onChange={set("discount")} optional placeholder="2,000" error={issueFor(result, "discount")} help="주문 한 건에 붙는 즉시할인·쿠폰 금액" />
              <Segmented
                label="할인 부담 주체"
                value={bearer}
                onChange={set("bearer")}
                options={DISCOUNT_BEARERS.map((b) => ({ value: b.key, label: b.label }))}
              />
              <CheckboxField
                label="쿠팡이츠는 할인 전 판매가로 수수료 계산"
                checked={s.listBasis !== "0"}
                onChange={(v) => set("listBasis")(v ? "1" : "0")}
                help="2025-10 공정위 시정 명령 이후 바뀌었다면 체크를 해제하세요."
              />
            </InputCard>
          )}

          {precise && (
            <InputCard title="앱별 요율 직접 수정 (정밀)">
              <p className="text-xs leading-relaxed text-slate-500">비워 둔 칸은 회색 기본값(가정값)을 써요. 정산서 숫자를 넣으면 그 값이 우선해요.</p>
              {platforms.map((p) => {
                const defaults: Record<string, string> = {
                  c: formatNumber(p.commission[salesTier] * 100, 2),
                  p: formatNumber(p.payment[revenueTier] * 100, 2),
                  d: DELIVERY_FEE_REPRESENTATIVE.value.representative[salesTier].toLocaleString("ko-KR"),
                  v: formatNumber(VAT.value.rate * 100, 1),
                };
                const touched = OV_FIELDS.some((f) => s[ovKey(p.key, f.suffix)] !== "");
                return (
                  <details key={p.key} className="group rounded-xl ring-1 ring-slate-200" open={touched || undefined}>
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 [&::-webkit-details-marker]:hidden">
                      <span>
                        {p.label}
                        {touched && <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-800">수정됨</span>}
                      </span>
                      <span aria-hidden="true" className="text-slate-400 transition group-open:rotate-180">
                        ▾
                      </span>
                    </summary>
                    <div className="grid gap-3 px-4 pb-4 pt-1 sm:grid-cols-2">
                      {OV_FIELDS.filter((f) => f.suffix !== "d" || p.kind === "platformDelivery").map((f) => (
                        <NumberField
                          key={f.suffix}
                          id={`ov-${p.key}-${f.suffix}`}
                          label={f.label}
                          unit={f.unit}
                          value={s[ovKey(p.key, f.suffix)]}
                          onChange={set(ovKey(p.key, f.suffix))}
                          placeholder={defaults[f.suffix]}
                          optional
                          error={issueFor(result, `ov-${p.key}-${f.issue}`)}
                        />
                      ))}
                    </div>
                  </details>
                );
              })}
            </InputCard>
          )}
        </>
      }
      result={
        <>
          <ResultPanel result={result} emptyHint="판매가와 원가를 입력하면 앱별로 한 건에 남는 돈을 비교해 드려요.">
            {(v) => {
              const second = v.ranked[1];
              const closeCall = second && v.best.profit - second.profit < closeThreshold(v.best, channel);
              return (
                <>
                  <Headline
                    label={`수익 1위 · ${v.best.label} 주문당 이익`}
                    value={won(v.best.profit)}
                    sub={`수익률 ${formatPercent(v.best.margin)} (이익 ÷ 판매가) · 통장 입금 ${won(v.best.deposit)}`}
                    tone={v.best.profit < 0 ? "bad" : "good"}
                  />
                  <StatGrid
                    items={[
                      { label: "1위와 최하위 차이 (주문당)", value: won(v.gapPerOrder), sub: `${v.best.label} vs ${v.worst.label}` },
                      {
                        label: "1위와 최하위 차이 (월)",
                        value: v.gapMonthly == null ? "주문 수 입력 시" : won(v.gapMonthly),
                        sub: v.monthlyOrders != null ? `월 ${formatNumber(v.monthlyOrders)}건 기준` : undefined,
                      },
                      { label: "주문당 광고비", value: won(v.adPerOrder) },
                    ]}
                  />
                  <DeliveryRankList orders={v.ranked} monthlyOrders={v.monthlyOrders} />
                  <DeliveryCompareTable orders={v.ranked} monthlyOrders={v.monthlyOrders} />
                  <Breakdown title={`세부 계산 내역 — 1위 ${v.best.label}`} rows={breakdownRows(v.best)} />
                  <Formula title={`적용 공식 — 1위 ${v.best.label}의 실제 숫자`} lines={formulaLines(v.best)} />
                  <DefaultsNotice best={v.best} closeCall={!!closeCall} second={second} precise={precise} />
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <Link href={getCalc("delivery-price").path} className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
                      목표 이익에 맞는 판매가 역산하기 →
                    </Link>
                    <Link
                      href={`${getCalc("promotion").path}?profit=${Math.round(v.best.profit)}${v.monthlyOrders != null ? `&orders=${Math.round(v.monthlyOrders)}` : ""}`}
                      className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
                    >
                      이 이익으로 쿠폰 이벤트 손익 보기 →
                    </Link>
                  </div>
                </>
              );
            }}
          </ResultPanel>
          <Assumptions
            sources={[...DELIVERY_SOURCES, DELIVERY_POLICY_NOTES]}
            items={[
              "수수료·배달비 기본값은 2026-09-25 검색한 보도·공지 요약을 옮긴 가정값이에요. 앱 사장님 사이트에서 직접 확인하지 못했으니 정산서 값으로 고쳐 쓰세요.",
              "수익률은 '주문당 이익 ÷ 판매가(할인 전 메뉴 가격)'로, 모든 앱을 같은 분모로 비교해요.",
              "중개·결제수수료와 업주 부담 배달비에는 부가세 10%를 붙였어요. 일반과세자는 이 부가세를 매입세액으로 공제받을 수 있어 실제 부담은 더 작을 수 있어요. 판매가에 들어 있는 매출 부가세는 빼지 않았어요.",
              "배민배달·쿠팡이츠 업주 부담 배달비는 거리에 따라 구간 안에서 달라져요. 기본값은 구간의 중간값이에요. 고객이 내는 배달비는 플랫폼 몫이라 가게배달에서만 팁을 수입으로 봐요.",
              "요기요는 월 주문 수에 따라 수수료 단계가 나뉘는데, 여기서는 매출 구간에 근사해 대응시켰어요. 땡겨요 배달비·포장 수수료는 확인되지 않아 가정했어요.",
              "배민 1만 원 이하 소액 주문 수수료 면제, 앱별 프로모션·광고 상품 요금, 국회 계류 중인 수수료 상한(15%) 법안은 반영하지 않았어요.",
              "금액은 원 단위 이하까지 계산하고 화면에만 원 단위로 반올림해 보여요.",
            ]}
          />
          {result.status === "ok" && (
            <ShareBar
              title="배달 수익 비교 결과"
              description={`${result.value.best.label} 주문당 ${won(result.value.best.profit)} 남아요 (1위). 최하위와 차이 ${won(result.value.gapPerOrder)}.`}
              buildUrl={buildUrl}
              sharedFields={[
                "계산 모드",
                "주문 방식",
                "판매가",
                "원가",
                "포장비",
                "앱 매출 구간",
                "연 매출 구간",
                "전통시장 여부",
                "실제 플랫폼 배달비",
                "고객 부담 배달팁",
                "외부 배달대행료",
                "월 광고비",
                "월 주문 수",
                "할인액·부담 주체",
                "쿠팡이츠 수수료 기준",
                "앱별 직접 수정한 요율·배달비",
              ]}
            />
          )}
        </>
      }
    />
  );
}

/** Rank #1 vs #2 gap below which default-value error could flip the order. */
function closeThreshold(best: PlatformOrder, channel: Channel): number {
  const vat = 1 + best.vatRate;
  if (channel === "pickup") return best.perCommissionPoint;
  const b = DELIVERY_FEE_REPRESENTATIVE.value.bands.top35;
  return best.perCommissionPoint + ((b.max - b.min) / 2) * vat;
}

function breakdownRows(o: PlatformOrder): BreakdownRow[] {
  const rows: BreakdownRow[] = [{ label: "판매가", value: won(o.price) }];
  if (o.ownerDiscount > 0) rows.push({ label: "업주 부담 할인", value: won(-o.ownerDiscount), sub: true });
  if (o.platformDiscount > 0) rows.push({ label: "플랫폼 부담 할인 (업주 수입에 영향 없음)", value: won(o.platformDiscount), sub: true });
  if (o.settlementBase !== o.price - o.ownerDiscount) rows.push({ label: "고객 배달팁 (업주 정산)", value: formatWon(o.settlementBase - (o.price - o.ownerDiscount), { sign: true }), sub: true });
  rows.push(
    { label: "정산 기준 매출", value: won(o.settlementBase), strong: true },
    { label: `중개수수료 ${rate(o.commissionRate)}`, value: won(-o.commission), note: `기준액 ${won(o.commissionBase)}` },
    { label: `결제수수료 ${rate(o.paymentRate)}`, value: won(-o.payment), note: `기준액 ${won(o.paymentBase)}` },
  );
  if (o.kind === "platformDelivery") rows.push({ label: "업주 부담 배달비", value: won(-o.ownerDeliveryFee) });
  rows.push(
    { label: `수수료 부가세 ${rate(o.vatRate)}`, value: won(-o.feeVat) },
    { label: "통장 입금액", value: won(o.deposit), strong: true },
    { label: "원가", value: won(-o.cost) },
    { label: "포장비", value: won(-o.packaging) },
    { label: "광고비 (주문당)", value: won(-o.adPerOrder) },
  );
  if (o.kind === "storeDelivery") rows.push({ label: "외부 배달대행료", value: won(-o.agencyFee), note: o.agencyMissing ? "미입력 — 0원으로 계산" : undefined, tone: o.agencyMissing ? "warn" : "default" });
  rows.push({ label: "주문당 이익", value: won(o.profit), strong: true, tone: o.profit < 0 ? "bad" : "good" });
  if (o.applied.length) rows.push({ label: "적용된 앱 규칙", value: "", note: o.applied.join(" · ") });
  return rows;
}

function formulaLines(o: PlatformOrder): string[] {
  const n = (x: number) => formatNumber(x);
  const fee = o.kind === "platformDelivery" ? ` + ${n(o.ownerDeliveryFee)}` : "";
  return [
    "통장 입금액 = 정산 기준 매출 − 중개수수료 − 결제수수료 − 업주 배달비 − 수수료 부가세",
    `중개 ${n(o.commissionBase)} × ${rate(o.commissionRate)} = ${won(o.commission)} · 결제 ${n(o.paymentBase)} × ${rate(o.paymentRate)} = ${won(o.payment)}`,
    `부가세 (${n(o.commission)} + ${n(o.payment)}${fee}) × ${rate(o.vatRate)} = ${won(o.feeVat)}`,
    `입금액 = ${n(o.settlementBase)} − ${n(o.commission)} − ${n(o.payment)}${o.kind === "platformDelivery" ? ` − ${n(o.ownerDeliveryFee)}` : ""} − ${n(o.feeVat)} = ${won(o.deposit)}`,
    "주문당 이익 = 입금액 − 원가 − 포장비 − 주문당 광고비 − 대행료",
    `= ${n(o.deposit)} − ${n(o.cost)} − ${n(o.packaging)} − ${n(o.adPerOrder)}${o.kind === "storeDelivery" ? ` − ${n(o.agencyFee)}` : ""} = ${won(o.profit)}`,
    `수익률 = ${won(o.profit)} ÷ ${won(o.price)} = ${formatPercent(o.margin)}`,
  ];
}

function DefaultsNotice({ best, second, closeCall, precise }: { best: PlatformOrder; second?: PlatformOrder; closeCall: boolean; precise: boolean }) {
  if (!best.defaults.length && !closeCall) return null;
  const values: Record<string, string> = {
    중개수수료율: rate(best.commissionRate),
    결제수수료율: rate(best.paymentRate),
    "업주 부담 배달비": won(best.ownerDeliveryFee),
  };
  return (
    <div className="rounded-xl bg-amber-50 px-4 py-3.5 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-100">
      <h3 className="text-sm font-bold">기본값 때문에 생길 수 있는 오차</h3>
      {best.defaults.length > 0 && (
        <p className="mt-1">
          1위 {best.label}은(는) 기본값{" "}
          {best.defaults.map((d) => `${d} ${values[d] ?? ""}`).join(", ")}을(를) 썼어요. 중개수수료율이 1%p 다르면 주문당 약{" "}
          {won(best.perCommissionPoint)}씩 달라져요
          {best.defaults.includes("업주 부담 배달비") ? ", 배달비는 거리에 따라 대표값보다 최대 500원(+부가세) 차이 날 수 있어요" : ""}.
        </p>
      )}
      {closeCall && second && (
        <p className="mt-1">
          1위와 2위({second.label})의 차이가 {won(best.profit - second.profit)}뿐이라 실제 요율에 따라 순위가 바뀔 수 있어요.
        </p>
      )}
      {!precise && <p className="mt-1 font-semibold">정밀 모드에서 정산서의 실제 요율과 배달비를 넣으면 더 정확해져요.</p>}
    </div>
  );
}
