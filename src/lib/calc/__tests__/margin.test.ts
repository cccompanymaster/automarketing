import { describe, expect, it } from "vitest";
import { marginOfPrice, priceForMargin } from "../margin";

describe("priceForMargin", () => {
  it("normal: cost 7,000 at 30% → 10,000", () => {
    const r = priceForMargin({ cost: 7000, targetMarginPct: 30 });
    expect(r.status).toBe("ok");
    if (r.status !== "ok") return;
    expect(r.value.price).toBe(10000);
    expect(r.value.marginAmount).toBe(3000);
    expect(r.value.marginRate).toBeCloseTo(0.3);
    expect(r.value.markupRate).toBeCloseTo(3000 / 7000);
  });
  it("rounds up to whole won so margin ≥ target", () => {
    const r = priceForMargin({ cost: 1000, targetMarginPct: 33 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.price).toBe(1493); // 1492.537…
    expect(r.value.marginRate).toBeGreaterThanOrEqual(0.33);
  });
  it("0% margin → price equals cost", () => {
    const r = priceForMargin({ cost: 5000, targetMarginPct: 0 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.price).toBe(5000);
  });
  it("empty inputs → empty", () => {
    expect(priceForMargin({ cost: null, targetMarginPct: 30 }).status).toBe("empty");
  });
  it("100% or more → impossible (division by zero)", () => {
    expect(priceForMargin({ cost: 5000, targetMarginPct: 100 }).status).toBe("impossible");
    expect(priceForMargin({ cost: 5000, targetMarginPct: 150 }).status).toBe("impossible");
  });
  it("negative / zero cost → invalid", () => {
    expect(priceForMargin({ cost: 0, targetMarginPct: 30 }).status).toBe("invalid");
    expect(priceForMargin({ cost: -1, targetMarginPct: 30 }).status).toBe("invalid");
    expect(priceForMargin({ cost: 100, targetMarginPct: -5 }).status).toBe("invalid");
  });
});

describe("marginOfPrice", () => {
  it("normal", () => {
    const r = marginOfPrice({ cost: 6000, price: 10000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.marginAmount).toBe(4000);
    expect(r.value.marginRate).toBeCloseTo(0.4);
    expect(r.value.costRate).toBeCloseTo(0.6);
    expect(r.value.markupRate).toBeCloseTo(4000 / 6000);
  });
  it("cost 0 → markup null with warning", () => {
    const r = marginOfPrice({ cost: 0, price: 1000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.markupRate).toBeNull();
    expect(r.warnings.length).toBe(1);
  });
  it("price below cost → negative margin warning", () => {
    const r = marginOfPrice({ cost: 1200, price: 1000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.marginAmount).toBe(-200);
    expect(r.warnings[0]).toContain("손해");
  });
  it("price 0 → invalid (no division by zero)", () => {
    expect(marginOfPrice({ cost: 100, price: 0 }).status).toBe("invalid");
  });
});
