import { describe, expect, it } from "vitest";
import { compareDetailed, compareSimple, resolveUnit, type DetailedProductInput } from "../unitPrice";
import { VAT } from "../rates";

describe("resolveUnit", () => {
  it("custom needs a label", () => {
    expect(resolveUnit({ unit: "custom", custom: "  " })).toBeNull();
    expect(resolveUnit({ unit: "custom", custom: "캔" })?.dim).toBe("custom:캔");
    expect(resolveUnit({ unit: "kg" })?.factor).toBe(1000);
  });
});

describe("compareSimple", () => {
  it("kg vs g converts — per 100g", () => {
    const r = compareSimple({
      a: { price: 12000, qty: 1, unit: { unit: "kg" } },
      b: { price: 3000, qty: 200, unit: { unit: "g" } },
    });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.basis.displayLabel).toBe("100g");
    expect(r.value.a.perDisplay).toBeCloseTo(1200);
    expect(r.value.b.perDisplay).toBeCloseTo(1500);
    expect(r.value.cheaper).toBe("a");
    expect(r.value.diffPerDisplay).toBeCloseTo(300);
    expect(r.value.diffRate).toBeCloseTo(0.2);
  });
  it("both L → per 1L", () => {
    const r = compareSimple({ a: { price: 3000, qty: 1.5, unit: { unit: "L" } }, b: { price: 2000, qty: 1, unit: { unit: "L" } } });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.basis.displayLabel).toBe("1L");
    expect(r.value.cheaper).toBe("same");
  });
  it("incompatible units → impossible with explanation", () => {
    const r = compareSimple({ a: { price: 1000, qty: 10, unit: { unit: "ea" } }, b: { price: 1000, qty: 100, unit: { unit: "g" } } });
    expect(r.status).toBe("impossible");
    if (r.status === "impossible") expect(r.reason).toContain("무게");
  });
  it("custom labels must match", () => {
    expect(compareSimple({ a: { price: 1, qty: 1, unit: { unit: "custom", custom: "캔" } }, b: { price: 1, qty: 1, unit: { unit: "custom", custom: "병" } } }).status).toBe("impossible");
    expect(compareSimple({ a: { price: 1, qty: 1, unit: { unit: "custom", custom: "캔" } }, b: { price: 2, qty: 1, unit: { unit: "custom", custom: "캔 " } } }).status).toBe("ok");
    expect(compareSimple({ a: { price: 1, qty: 1, unit: { unit: "custom" } }, b: { price: 2, qty: 1, unit: { unit: "ea" } } }).status).toBe("empty");
  });
  it("empty / invalid", () => {
    expect(compareSimple({ a: { price: null, qty: 1, unit: { unit: "ea" } }, b: { price: 1, qty: 1, unit: { unit: "ea" } } }).status).toBe("empty");
    const r = compareSimple({ a: { price: 1, qty: 0, unit: { unit: "ea" } }, b: { price: 1, qty: 1, unit: { unit: "ea" } } });
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.issues[0].field).toBe("aQty");
  });
});

const prod = (p: Partial<DetailedProductInput>): DetailedProductInput => ({
  price: 11000,
  qty: 100,
  unit: { unit: "ea" },
  vatType: "included",
  deductible: false,
  ...p,
});

describe("compareDetailed", () => {
  const r = VAT.value.rate;
  it("VAT included, deductible → real price excludes VAT", () => {
    const res = compareDetailed({ a: prod({ deductible: true }), b: prod({ deductible: false }) });
    if (res.status !== "ok") throw new Error(res.status);
    expect(res.value.a.cash).toBe(11000);
    expect(res.value.a.vatInCash).toBeCloseTo(1000);
    expect(res.value.a.realPerDisplay).toBeCloseTo(100);
    expect(res.value.b.realPerDisplay).toBeCloseTo(110);
    expect(res.value.cheaper).toBe("a");
  });
  it("VAT excluded adds VAT to cash; exempt has none", () => {
    const res = compareDetailed({ a: prod({ price: 10000, vatType: "excluded" }), b: prod({ price: 10000, vatType: "exempt", deductible: true }) });
    if (res.status !== "ok") throw new Error(res.status);
    expect(res.value.a.cash).toBeCloseTo(10000 * (1 + r));
    expect(res.value.b.cash).toBe(10000);
    expect(res.value.b.deductibleVat).toBe(0);
    expect(res.warnings.some((w) => w.includes("면세"))).toBe(true);
  });
  it("order qty, discount, shipping, waste, usage", () => {
    const res = compareDetailed({
      a: prod({ price: 5500, qty: 1, unit: { unit: "kg" }, orderQty: 4, discount: 2000, shipping: 3300, wastePct: 10, deductible: true }),
      b: prod({ price: 1500, qty: 500, unit: { unit: "g" } }),
      usage: 2,
      usageUnit: { unit: "kg" },
    });
    if (res.status !== "ok") throw new Error(res.status);
    const a = res.value.a;
    // goods 22,000 − 2,000 = 20,000 (incl. VAT) + ship 3,300 = 23,300
    expect(a.cash).toBe(23300);
    expect(a.vatInCash).toBeCloseTo(20000 / 11 + 300);
    expect(a.totalQtyBase).toBe(4000);
    expect(a.usableQtyBase).toBeCloseTo(3600);
    expect(a.monthsLasting).toBeCloseTo(1.8);
    expect(a.realPerDisplay).toBeCloseTo(((23300 - (20000 / 11 + 300)) / 3600) * 100);
    expect(res.value.basis.displayLabel).toBe("100g");
    expect(res.value.usageBase).toBe(2000);
    expect(res.value.monthlySaving).toBeCloseTo(Math.abs(a.realPerBase - res.value.b.realPerBase) * 2000);
  });
  it("waste 100% → invalid; discount ≥ goods → invalid", () => {
    expect(compareDetailed({ a: prod({ wastePct: 100 }), b: prod({}) }).status).toBe("invalid");
    const d = compareDetailed({ a: prod({ discount: 11000 }), b: prod({}) });
    expect(d.status).toBe("invalid");
    if (d.status === "invalid") expect(d.issues[0].field).toBe("aDiscount");
  });
  it("usage unit incompatible → invalid on usageUnit", () => {
    const res = compareDetailed({ a: prod({}), b: prod({}), usage: 3, usageUnit: { unit: "g" } });
    expect(res.status).toBe("invalid");
    if (res.status === "invalid") expect(res.issues[0].field).toBe("usageUnit");
  });
  it("incompatible products → impossible", () => {
    expect(compareDetailed({ a: prod({ unit: { unit: "roll" } }), b: prod({ unit: { unit: "sheet" } }) }).status).toBe("impossible");
  });
  it("no usage → months null", () => {
    const res = compareDetailed({ a: prod({}), b: prod({ price: 12000 }) });
    if (res.status !== "ok") throw new Error(res.status);
    expect(res.value.a.monthsLasting).toBeNull();
    expect(res.value.monthlySaving).toBeNull();
  });
});
