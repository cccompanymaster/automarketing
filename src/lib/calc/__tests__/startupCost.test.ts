import { describe, expect, it } from "vitest";
import { startupCost, type StartupCostInput } from "../startupCost";

const blank: StartupCostInput = {
  deposit: null,
  premium: null,
  interior: null,
  equipment: null,
  initialStock: null,
  franchiseFee: null,
  permits: null,
  marketing: null,
  other: null,
  contingencyPct: null,
  monthlyOpex: null,
  months: null,
};

describe("startupCost", () => {
  it("normal: four buckets add up; 예비비 only on consumables", () => {
    const r = startupCost({
      ...blank,
      deposit: 30_000_000,
      premium: 20_000_000,
      interior: 40_000_000,
      equipment: 15_000_000,
      initialStock: 3_000_000,
      franchiseFee: 5_000_000,
      permits: 500_000,
      marketing: 1_500_000,
      other: 0,
      contingencyPct: 10,
      monthlyOpex: 8_000_000,
      months: 6,
    });
    if (r.status !== "ok") throw new Error(r.status);
    const v = r.value;
    expect(v.consumableTotal).toBe(65_000_000);
    expect(v.contingency).toBe(6_500_000); // not 11.5M: deposit/premium excluded
    expect(v.operating).toBe(48_000_000);
    expect(v.sunk).toBe(71_500_000);
    expect(v.total).toBe(30_000_000 + 20_000_000 + 65_000_000 + 6_500_000 + 48_000_000);
    expect(v.total).toBe(v.deposit + v.premium + v.sunk + v.operating);
    expect(r.warnings.some((w) => w.includes("권리금"))).toBe(true);
  });
  it("예비비 rounds up to whole won", () => {
    const r = startupCost({ ...blank, interior: 1_234_567, contingencyPct: 15 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.contingency).toBe(185_186); // 185,185.05 → 올림
  });
  it("exact percent has no float overshoot", () => {
    const r = startupCost({ ...blank, interior: 10_000_000, contingencyPct: 7 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.contingency).toBe(700_000);
  });
  it("deposit only → no contingency, warnings for missing ops", () => {
    const r = startupCost({ ...blank, deposit: 10_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.total).toBe(10_000_000);
    expect(r.value.contingency).toBe(0);
  });
  it("opex without months → operating 0 + warning", () => {
    const r = startupCost({ ...blank, monthlyOpex: 5_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.operating).toBe(0);
    expect(r.warnings.some((w) => w.includes("개월 수"))).toBe(true);
  });
  it("100% contingency allowed; >100 invalid", () => {
    const r = startupCost({ ...blank, interior: 1_000, contingencyPct: 100 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.contingency).toBe(1_000);
    expect(startupCost({ ...blank, interior: 1_000, contingencyPct: 101 }).status).toBe("invalid");
  });
  it("invalid: negative money / fractional months", () => {
    expect(startupCost({ ...blank, interior: -1 }).status).toBe("invalid");
    const r = startupCost({ ...blank, monthlyOpex: 1, months: 2.5 });
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.issues[0].field).toBe("months");
  });
  it("all empty → empty", () => {
    expect(startupCost(blank).status).toBe("empty");
    expect(startupCost({ ...blank, contingencyPct: 10 }).status).toBe("empty");
  });
  it("all zeros → ok with total 0", () => {
    const r = startupCost({ ...blank, deposit: 0 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.total).toBe(0);
  });
});
