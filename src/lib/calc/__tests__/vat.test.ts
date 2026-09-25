import { describe, expect, it } from "vitest";
import { vatFromSupply, vatFromTotal } from "../vat";

describe("vatFromTotal", () => {
  it("11,000 → 10,000 + 1,000", () => {
    const r = vatFromTotal({ total: 11_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.supply).toBe(10_000);
    expect(r.value.vat).toBe(1_000);
  });
  it("rounds supply, vat is the remainder (sum always equals total)", () => {
    const r = vatFromTotal({ total: 10_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.supply).toBe(9_091); // 9,090.909…
    expect(r.value.vat).toBe(909);
    expect(r.value.supply + r.value.vat).toBe(10_000);
  });
  it("tiny and huge totals", () => {
    const a = vatFromTotal({ total: 1 });
    if (a.status !== "ok") throw new Error(a.status);
    expect(a.value.supply).toBe(1);
    expect(a.value.vat).toBe(0);
    const b = vatFromTotal({ total: 1_100_000_000_000 });
    if (b.status !== "ok") throw new Error(b.status);
    expect(b.value.supply).toBe(1_000_000_000_000);
  });
  it("empty / invalid", () => {
    expect(vatFromTotal({ total: null }).status).toBe("empty");
    expect(vatFromTotal({ total: 0 }).status).toBe("invalid");
    expect(vatFromTotal({ total: -1 }).status).toBe("invalid");
  });
});

describe("vatFromSupply", () => {
  it("10,000 → 1,000 → 11,000", () => {
    const r = vatFromSupply({ supply: 10_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.vat).toBe(1_000);
    expect(r.value.total).toBe(11_000);
  });
  it("원 미만 절사", () => {
    const r = vatFromSupply({ supply: 12_345 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.vat).toBe(1_234);
    expect(r.value.total).toBe(13_579);
  });
  it("round trip 9,091 → 909", () => {
    const r = vatFromSupply({ supply: 9_091 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.vat).toBe(909);
  });
  it("empty / invalid", () => {
    expect(vatFromSupply({ supply: null }).status).toBe("empty");
    expect(vatFromSupply({ supply: 0 }).status).toBe("invalid");
  });
});
