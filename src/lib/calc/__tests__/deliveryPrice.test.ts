import { describe, expect, it } from "vitest";
import { delivery, REVENUE_TIERS, type Channel } from "../delivery";
import { deliveryPrice, ROUND_UNITS, type DeliveryPriceInput } from "../deliveryPrice";
import { SALES_TIERS } from "../rates/delivery";

const base: DeliveryPriceInput = {
  channel: "delivery",
  cost: 7000,
  packaging: 500,
  targetProfit: 5000,
  agencyFee: 4000,
  salesTier: "top35",
  revenueTier: "t3",
  roundUnit: 100,
  asOf: "2026-09-25",
};

function okValue(input: DeliveryPriceInput) {
  const r = deliveryPrice(input);
  if (r.status !== "ok") throw new Error(`${r.status}: ${JSON.stringify(r)}`);
  return r;
}

describe("deliveryPrice — closed form", () => {
  it("배민배달: minimum price from profit = a·P + b", () => {
    const row = okValue(base).value.rows.find((r) => r.key === "baemin")!;
    // a = 1 − (0.078 + 0.014) × 1.1 = 0.8988; b = −2,900 × 1.1 − 7,500 = −10,690
    expect(row.slope).toBeCloseTo(0.8988, 9);
    expect(row.intercept).toBeCloseTo(-10690, 6);
    expect(row.minPrice).toBe(Math.ceil((5000 + 10690) / 0.8988)); // 17,457
    expect(row.recommendedPrice).toBe(17500);
    expect(row.order!.profit).toBeGreaterThanOrEqual(5000);
  });
  it("rounding unit 500 / 1,000", () => {
    expect(okValue({ ...base, roundUnit: 500 }).value.rows.find((r) => r.key === "baemin")!.recommendedPrice).toBe(17500);
    expect(okValue({ ...base, roundUnit: 1000 }).value.rows.find((r) => r.key === "baemin")!.recommendedPrice).toBe(18000);
  });
  it("one unit below 권장가 falls short of the target (it is the minimum)", () => {
    for (const unit of ROUND_UNITS) {
      const r = okValue({ ...base, roundUnit: unit });
      for (const row of r.value.rows.filter((x) => x.status === "ok")) {
        const below = delivery({
          mode: "simple", channel: "delivery", price: row.recommendedPrice! - unit, cost: 7000, packaging: 500,
          agencyFee: 4000, salesTier: "top35", revenueTier: "t3", asOf: "2026-09-25",
        });
        if (below.status !== "ok") continue; // price ≤ 0
        const o = below.value.ranked.find((x) => x.key === row.key)!;
        expect(o.profit).toBeLessThan(5000);
      }
    }
  });
  it("cheapest is the lowest 권장가, rows sorted ascending", () => {
    const r = okValue(base);
    const prices = r.value.rows.filter((x) => x.status === "ok").map((x) => x.recommendedPrice!);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    expect(r.value.cheapest.recommendedPrice).toBe(prices[0]);
  });
});

describe("deliveryPrice — results match /delivery exactly", () => {
  const channels: Channel[] = ["delivery", "pickup"];
  it("delivery(권장가).profit === deliveryPrice profit for every platform, tier and unit", () => {
    let checked = 0;
    for (const channel of channels)
      for (const t of SALES_TIERS)
        for (const rv of REVENUE_TIERS)
          for (const unit of ROUND_UNITS) {
            const input: DeliveryPriceInput = {
              ...base, channel, salesTier: t.key, revenueTier: rv.key, roundUnit: unit,
              customerTip: 2500, monthlyAd: 200000, monthlyOrders: 400, targetProfit: 4321,
            };
            const r = okValue(input);
            for (const row of r.value.rows) {
              if (row.status !== "ok") continue;
              const d = delivery({
                mode: "simple", channel, price: row.recommendedPrice!, cost: input.cost, packaging: input.packaging,
                customerTip: input.customerTip, agencyFee: input.agencyFee, monthlyAd: input.monthlyAd,
                monthlyOrders: input.monthlyOrders, salesTier: t.key, revenueTier: rv.key, asOf: input.asOf,
              });
              if (d.status !== "ok") throw new Error(d.status);
              const o = d.value.ranked.find((x) => x.key === row.key)!;
              expect(o.profit).toBe(row.order!.profit);
              expect(o.profit).toBeGreaterThanOrEqual(4321 - 1e-6);
              checked++;
            }
          }
    expect(checked).toBe(4 * 5 * 3 * 9); // tiers × revenue tiers × units × (5 delivery + 4 pickup)
  });
});

describe("deliveryPrice — exclusions, impossible, validation", () => {
  it("가게배달 without agency fee is excluded with a warning", () => {
    const r = okValue({ ...base, agencyFee: null });
    const store = r.value.rows.find((x) => x.key === "baeminStore")!;
    expect(store.status).toBe("excluded");
    expect(r.value.cheapest.key).not.toBe("baeminStore");
    expect(r.warnings.some((w) => w.includes("가게배달"))).toBe(true);
  });
  it("target 0 (break-even) works; tiny costs give at least one unit", () => {
    const r = okValue({ ...base, cost: 0, packaging: 0, targetProfit: 0, channel: "pickup" });
    for (const row of r.value.rows) expect(row.recommendedPrice).toBe(100);
  });
  it("huge target stays finite", () => {
    const r = okValue({ ...base, targetProfit: 1_000_000_000 });
    for (const row of r.value.rows) expect(Number.isFinite(row.recommendedPrice!)).toBe(true);
  });
  it("empty / invalid", () => {
    expect(deliveryPrice({ ...base, cost: null }).status).toBe("empty");
    expect(deliveryPrice({ ...base, targetProfit: null }).status).toBe("empty");
    expect(deliveryPrice({ ...base, targetProfit: -1 }).status).toBe("invalid");
    expect(deliveryPrice({ ...base, cost: -1 }).status).toBe("invalid");
    expect(deliveryPrice({ ...base, monthlyAd: 10000 }).status).toBe("invalid");
    expect(deliveryPrice({ ...base, roundUnit: 0 }).status).toBe("invalid");
  });
});
