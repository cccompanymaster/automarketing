import { describe, expect, it } from "vitest";
import { calcDiscount, DEFAULT_BASE_QTY } from "../discount";

describe("calcDiscount — rate mode", () => {
  it("normal: 20,000원 20% → 16,000원", () => {
    const r = calcDiscount({ mode: "rate", listPrice: 20000, discountPct: 20, salePrice: null });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.salePrice).toBe(16000);
    expect(r.value.discountAmount).toBe(4000);
    expect(r.value.discountRate).toBeCloseTo(0.2);
    expect(r.value.margin).toBeNull();
  });
  it("rounds 할인가 to whole won (half up)", () => {
    const r = calcDiscount({ mode: "rate", listPrice: 12345, discountPct: 15, salePrice: null });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.exactSalePrice).toBeCloseTo(10493.25);
    expect(r.value.salePrice).toBe(10493);
    expect(r.value.discountAmount).toBe(1852);
  });
  it("0% → same price, no extra volume needed", () => {
    const r = calcDiscount({ mode: "rate", listPrice: 10000, discountPct: 0, salePrice: null, cost: 6000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.salePrice).toBe(10000);
    expect(r.value.margin?.volume?.requiredQty).toBe(DEFAULT_BASE_QTY);
    expect(r.value.margin?.volume?.extraQty).toBe(0);
  });
  it("100% or more → invalid", () => {
    expect(calcDiscount({ mode: "rate", listPrice: 10000, discountPct: 100, salePrice: null }).status).toBe("invalid");
    expect(calcDiscount({ mode: "rate", listPrice: 10000, discountPct: 120, salePrice: null }).status).toBe("invalid");
    expect(calcDiscount({ mode: "rate", listPrice: 10000, discountPct: -1, salePrice: null }).status).toBe("invalid");
  });
  it("empty → empty", () => {
    const r = calcDiscount({ mode: "rate", listPrice: null, discountPct: null, salePrice: 5000 });
    expect(r.status).toBe("empty");
    if (r.status === "empty") expect(r.missing).toEqual(["정가", "할인율"]);
  });
  it("list price 0 → invalid", () => {
    expect(calcDiscount({ mode: "rate", listPrice: 0, discountPct: 10, salePrice: null }).status).toBe("invalid");
  });
});

describe("calcDiscount — price mode", () => {
  it("normal: 20,000 → 15,000 is 25%", () => {
    const r = calcDiscount({ mode: "price", listPrice: 20000, discountPct: 99, salePrice: 15000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.discountRate).toBeCloseTo(0.25);
    expect(r.value.discountAmount).toBe(5000);
  });
  it("sale price above list → invalid on salePrice", () => {
    const r = calcDiscount({ mode: "price", listPrice: 10000, discountPct: null, salePrice: 12000 });
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.issues[0].field).toBe("salePrice");
  });
  it("sale price 0 → invalid (would be 100%)", () => {
    expect(calcDiscount({ mode: "price", listPrice: 10000, discountPct: null, salePrice: 0 }).status).toBe("invalid");
  });
});

describe("calcDiscount — margin & volume", () => {
  it("10,000원, 원가 6,000, 20% off → need 2x volume", () => {
    const r = calcDiscount({ mode: "rate", listPrice: 10000, discountPct: 20, salePrice: null, cost: 6000 });
    if (r.status !== "ok") throw new Error(r.status);
    const m = r.value.margin!;
    expect(m.marginBefore).toBe(4000);
    expect(m.marginRateBefore).toBeCloseTo(0.4);
    expect(m.marginAfter).toBe(2000);
    expect(m.marginRateAfter).toBeCloseTo(0.25);
    expect(m.volume?.multiplier).toBeCloseTo(2);
    expect(m.volume?.requiredQty).toBe(200);
    expect(m.volume?.extraQty).toBe(100);
    expect(m.volume?.extraRate).toBeCloseTo(1);
  });
  it("rounds required quantity up with custom base qty", () => {
    // before 3,000, after 2,000 (10% off 10,000, cost 7,000 → 2,000) → ×1.5
    const r = calcDiscount({ mode: "rate", listPrice: 10000, discountPct: 10, salePrice: null, cost: 7000, baseQty: 33 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.margin?.volume?.requiredQty).toBe(50); // 49.5 → 50
    expect(r.value.margin?.volume?.extraQty).toBe(17);
  });
  it("after-discount margin 0 → volume impossible", () => {
    const r = calcDiscount({ mode: "price", listPrice: 10000, discountPct: null, salePrice: 6000, cost: 6000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.margin?.volume).toBeNull();
    expect(r.value.margin?.volumeIssue).toContain("0원");
  });
  it("after-discount margin negative → volume impossible", () => {
    const r = calcDiscount({ mode: "rate", listPrice: 10000, discountPct: 50, salePrice: null, cost: 6000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.margin?.marginAfter).toBe(-1000);
    expect(r.value.margin?.volume).toBeNull();
    expect(r.value.margin?.volumeIssue).toContain("손해");
  });
  it("no profit even before discount → volume skipped + warning", () => {
    const r = calcDiscount({ mode: "rate", listPrice: 5000, discountPct: 10, salePrice: null, cost: 6000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.margin?.volume).toBeNull();
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it("negative cost / base qty 0 → invalid", () => {
    expect(calcDiscount({ mode: "rate", listPrice: 10000, discountPct: 10, salePrice: null, cost: -1 }).status).toBe("invalid");
    expect(calcDiscount({ mode: "rate", listPrice: 10000, discountPct: 10, salePrice: null, cost: 1, baseQty: 0 }).status).toBe("invalid");
  });
  it("huge values stay finite", () => {
    const r = calcDiscount({ mode: "rate", listPrice: 1e12, discountPct: 99.99, salePrice: null, cost: 1 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(Number.isFinite(r.value.margin!.volume!.requiredQty)).toBe(true);
  });
  it("tiny price rounding to 0 → warning, volume impossible", () => {
    const r = calcDiscount({ mode: "rate", listPrice: 1, discountPct: 99, salePrice: null, cost: 0 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.salePrice).toBe(0);
    expect(r.value.margin?.volume).toBeNull();
    expect(r.warnings.some((w) => w.includes("0원"))).toBe(true);
  });
});
