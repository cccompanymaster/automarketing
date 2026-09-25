import { describe, expect, it } from "vitest";
import {
  delivery,
  orderProfit,
  platformsFor,
  REVENUE_TIERS,
  type DeliveryInput,
  type OrderContext,
  type PlatformKey,
} from "../delivery";
import { SALES_TIERS } from "../rates/delivery";

const base: DeliveryInput = {
  mode: "simple",
  channel: "delivery",
  price: 20000,
  cost: 7000,
  packaging: 500,
  salesTier: "top35",
  revenueTier: "t3",
  asOf: "2026-09-25",
};

function okValue(input: DeliveryInput) {
  const r = delivery(input);
  if (r.status !== "ok") throw new Error(`${r.status}: ${JSON.stringify(r)}`);
  return r;
}
const pick = (input: DeliveryInput, key: PlatformKey) => {
  const hit = okValue(input).value.ranked.find((o) => o.key === key);
  if (!hit) throw new Error(key);
  return hit;
};

describe("delivery — platform delivery (배민배달 · 쿠팡이츠 · 요기배달 · 땡겨요)", () => {
  it("배민배달 top 35%, 영세: every line item", () => {
    const o = pick(base, "baemin");
    expect(o.commission).toBeCloseTo(1560); // 7.8%
    expect(o.payment).toBeCloseTo(280); // 1.4% (연 매출 3억 이하)
    expect(o.ownerDeliveryFee).toBe(2900); // 2,400~3,400 midpoint
    expect(o.feeVat).toBeCloseTo(474);
    expect(o.deposit).toBeCloseTo(14786);
    expect(o.profit).toBeCloseTo(7286);
    expect(o.margin).toBeCloseTo(7286 / 20000);
  });
  it("쿠팡이츠 / 요기배달 / 땡겨요 with their own rates", () => {
    expect(pick(base, "coupang").profit).toBeCloseTo(6934);
    expect(pick(base, "yogiyo").profit).toBeCloseTo(6516);
    expect(pick(base, "ddangyo").profit).toBeCloseTo(8760);
  });
  it("tier changes commission and representative delivery fee", () => {
    const o = pick({ ...base, salesTier: "bottom20" }, "baemin");
    expect(o.commissionRate).toBeCloseTo(0.02);
    expect(o.ownerDeliveryFee).toBe(2400);
    expect(pick({ ...base, salesTier: "mid35to50" }, "coupang").ownerDeliveryFee).toBe(2600);
  });
  it("revenue tier changes 배민 결제수수료 only (쿠팡 flat 3%)", () => {
    expect(pick({ ...base, revenueTier: "general" }, "baemin").paymentRate).toBeCloseTo(0.03);
    expect(pick({ ...base, revenueTier: "t10" }, "baemin").paymentRate).toBeCloseTo(0.0215);
    expect(pick({ ...base, revenueTier: "t3" }, "coupang").paymentRate).toBeCloseTo(0.03);
  });
  it("actual platform delivery fee replaces the tier value as-is (customer tip not subtracted)", () => {
    const o = pick({ ...base, actualDeliveryFee: 3300, customerTip: 3000 }, "baemin");
    expect(o.ownerDeliveryFee).toBe(3300);
    expect(o.defaults).not.toContain("업주 부담 배달비");
    expect(o.settlementBase).toBe(20000); // tip goes to the platform, not the owner
  });
  it("customer tip does not change platform-delivery profit", () => {
    expect(pick({ ...base, customerTip: 4000 }, "coupang").profit).toBeCloseTo(pick(base, "coupang").profit);
  });
});

describe("delivery — 배민 가게배달 rules", () => {
  it("tip is settled to the owner, agency is paid by the owner", () => {
    const o = pick({ ...base, customerTip: 3000, agencyFee: 4500 }, "baeminStore");
    expect(o.settlementBase).toBe(23000);
    expect(o.commission).toBeCloseTo(1360); // 6.8% on food only
    expect(o.payment).toBeCloseTo(322); // 1.4% on food + tip
    expect(o.ownerDeliveryFee).toBe(0);
    expect(o.agencyFee).toBe(4500);
    expect(o.profit).toBeCloseTo(23000 - 1360 - 322 - 168.2 - 7000 - 500 - 4500);
  });
  it("missing agency fee → computed as 0 with a warning", () => {
    const r = okValue(base);
    const o = r.value.ranked.find((x) => x.key === "baeminStore")!;
    expect(o.agencyMissing).toBe(true);
    expect(o.profit).toBeCloseTo(10696);
    expect(r.warnings.some((w) => w.includes("대행료"))).toBe(true);
  });
  it("agency fee 0 entered explicitly → no warning", () => {
    const r = okValue({ ...base, agencyFee: 0 });
    expect(r.warnings.some((w) => w.includes("대행료"))).toBe(false);
  });
});

describe("delivery — ranking and gaps", () => {
  it("ranks by profit and computes per-order / monthly gap", () => {
    const r = okValue({ ...base, agencyFee: 3000, monthlyOrders: 300 });
    const profits = r.value.ranked.map((o) => o.profit);
    expect([...profits].sort((a, b) => b - a)).toEqual(profits);
    expect(r.value.best.key).toBe("ddangyo");
    expect(r.value.worst.key).toBe("yogiyo");
    expect(r.value.gapPerOrder).toBeCloseTo(8760 - 6516);
    expect(r.value.gapMonthly).toBeCloseTo((8760 - 6516) * 300);
  });
  it("monthly gap is null without 월 주문 수", () => {
    expect(okValue(base).value.gapMonthly).toBeNull();
  });
  it("ad cost is spread per order", () => {
    const r = okValue({ ...base, monthlyAd: 300000, monthlyOrders: 600 });
    expect(r.value.adPerOrder).toBe(500);
    expect(r.value.ranked.find((o) => o.key === "baemin")!.profit).toBeCloseTo(7286 - 500);
  });
  it("all negative → warning", () => {
    const r = okValue({ ...base, cost: 19000 });
    expect(r.warnings.some((w) => w.includes("모든 앱"))).toBe(true);
  });
});

describe("delivery — pickup channel", () => {
  it("compares the 4 pickup apps with no delivery fee", () => {
    const r = okValue({ ...base, channel: "pickup" });
    expect(r.value.ranked.map((o) => o.key).sort()).toEqual(["baeminPickup", "coupangPickup", "ddangyoPickup", "yogiyoPickup"]);
    const b = r.value.ranked.find((o) => o.key === "baeminPickup")!;
    expect(b.commission).toBeCloseTo(1360); // 6.8%
    expect(b.ownerDeliveryFee).toBe(0);
  });
  it("쿠팡이츠 포장 free for 하위 20% / 전통시장 until 2027-03-31", () => {
    const p = { ...base, channel: "pickup" as const };
    expect(pick({ ...p, salesTier: "bottom20" }, "coupangPickup").commission).toBe(0);
    expect(pick({ ...p, traditionalMarket: true }, "coupangPickup").commission).toBe(0);
    expect(pick({ ...p, salesTier: "bottom20", asOf: "2027-03-31" }, "coupangPickup").commission).toBe(0);
    expect(pick({ ...p, salesTier: "bottom20", asOf: "2027-04-01" }, "coupangPickup").commission).toBeCloseTo(1360);
    expect(pick(p, "coupangPickup").commission).toBeCloseTo(1360);
    const expired = okValue({ ...p, salesTier: "bottom20", asOf: "2027-04-01" });
    expect(expired.warnings.some((w) => w.includes("면제 기간"))).toBe(true);
  });
});

describe("delivery — 정밀 모드", () => {
  const precise: DeliveryInput = { ...base, mode: "precise", discount: 2000 };
  it("owner-borne discount: 배민 fee on discounted price, 쿠팡 on list price", () => {
    const b = pick(precise, "baemin");
    expect(b.settlementBase).toBe(18000);
    expect(b.commission).toBeCloseTo(18000 * 0.078);
    expect(b.payment).toBeCloseTo(18000 * 0.014);
    const c = pick(precise, "coupang");
    expect(c.commissionBase).toBe(20000);
    expect(c.commission).toBeCloseTo(1560);
  });
  it("쿠팡 list-price rule can be turned off", () => {
    expect(pick({ ...precise, listPriceBasis: false }, "coupang").commissionBase).toBe(18000);
  });
  it("platform-borne discount: owner settles full price, customer pays less", () => {
    const b = pick({ ...precise, discountBearer: "platform" }, "baemin");
    expect(b.settlementBase).toBe(20000);
    expect(b.paymentBase).toBe(18000);
    expect(b.platformDiscount).toBe(2000);
  });
  it("split 50:50", () => {
    const b = pick({ ...precise, discountBearer: "split" }, "baemin");
    expect(b.ownerDiscount).toBe(1000);
    expect(b.settlementBase).toBe(19000);
  });
  it("simple mode ignores discount and overrides", () => {
    const s = pick({ ...precise, mode: "simple", overrides: { baemin: { commissionPct: 1 } } }, "baemin");
    expect(s.profit).toBeCloseTo(7286);
  });
  it("overrides win over defaults and rules", () => {
    const o = pick(
      { ...base, mode: "precise", overrides: { coupang: { commissionPct: 5, paymentPct: 2, deliveryFee: 3000, vatPct: 0 } } },
      "coupang",
    );
    expect(o.commission).toBeCloseTo(1000);
    expect(o.payment).toBeCloseTo(400);
    expect(o.ownerDeliveryFee).toBe(3000);
    expect(o.feeVat).toBe(0);
    expect(o.defaults).toEqual([]);
    const p = pick({ ...base, channel: "pickup", mode: "precise", salesTier: "bottom20", overrides: { coupangPickup: { commissionPct: 3 } } }, "coupangPickup");
    expect(p.commission).toBeCloseTo(600);
  });
  it("delivery-fee override ignored for 가게배달 / 포장", () => {
    const o = pick({ ...base, mode: "precise", overrides: { baeminStore: { deliveryFee: 3000 } } }, "baeminStore");
    expect(o.ownerDeliveryFee).toBe(0);
  });
  it("discount ≥ price → invalid", () => {
    const r = delivery({ ...precise, discount: 20000 });
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.issues[0].field).toBe("discount");
  });
  it("override out of range → invalid with ov- field key", () => {
    const r = delivery({ ...base, mode: "precise", overrides: { baemin: { commissionPct: 120 } } });
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.issues[0].field).toBe("ov-baemin-commission");
    expect(delivery({ ...base, mode: "precise", overrides: { baemin: { commissionPct: 100 } } }).status).toBe("ok");
  });
});

describe("delivery — validation & edge values", () => {
  it("empty required → empty", () => {
    expect(delivery({ ...base, price: null }).status).toBe("empty");
    expect(delivery({ ...base, cost: null }).status).toBe("empty");
  });
  it("price 0 / negatives → invalid", () => {
    expect(delivery({ ...base, price: 0 }).status).toBe("invalid");
    expect(delivery({ ...base, cost: -1 }).status).toBe("invalid");
    expect(delivery({ ...base, agencyFee: -1 }).status).toBe("invalid");
    expect(delivery({ ...base, monthlyOrders: 0 }).status).toBe("invalid");
  });
  it("ad without orders → invalid on monthlyOrders", () => {
    const r = delivery({ ...base, monthlyAd: 100000 });
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.issues[0].field).toBe("monthlyOrders");
  });
  it("cost 0 and tiny / huge prices stay finite", () => {
    for (const price of [1, 100_000_000]) {
      const r = okValue({ ...base, price, cost: 0 });
      for (const o of r.value.ranked) {
        expect(Number.isFinite(o.profit)).toBe(true);
        expect(Number.isFinite(o.margin)).toBe(true);
      }
    }
  });
  it("orderProfit is linear in price for every platform/tier", () => {
    for (const ch of ["delivery", "pickup"] as const) {
      for (const p of platformsFor(ch)) {
        for (const t of SALES_TIERS) {
          for (const rv of REVENUE_TIERS) {
            const ctx: OrderContext = {
              price: 0, cost: 5000, packaging: 300, adPerOrder: 200, customerTip: 2000, agencyFee: 3500,
              actualDeliveryFee: null, discount: 0, discountBearer: "owner", salesTier: t.key, revenueTier: rv.key,
              traditionalMarket: false, asOf: "2026-09-25", listPriceBasis: true,
            };
            const f = (price: number) => orderProfit(p.key, { ...ctx, price }).profit;
            const a = f(1) - f(0);
            expect(a).toBeGreaterThan(0);
            expect(f(25000)).toBeCloseTo(f(0) + a * 25000, 6);
          }
        }
      }
    }
  });
});
