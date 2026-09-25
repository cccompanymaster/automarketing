import { describe, expect, it } from "vitest";
import { startupRunway, type StartupRunwayInput } from "../startupRunway";

const base: StartupRunwayInput = {
  cash: null,
  emergency: null,
  lockedDeposit: null,
  depositInCash: false,
  pendingStartupCost: null,
  monthlyLoss: null,
  living: null,
  loanPrincipal: null,
  otherIncome: null,
};

describe("startupRunway", () => {
  it("normal runway with floors", () => {
    const r = startupRunway({
      ...base,
      cash: 50_000_000,
      emergency: 5_000_000,
      pendingStartupCost: 5_000_000,
      lockedDeposit: 30_000_000,
      monthlyLoss: 2_000_000,
      living: 2_500_000,
      loanPrincipal: 500_000,
      otherIncome: 1_000_000,
    });
    if (r.status !== "ok") throw new Error(r.status);
    const v = r.value;
    expect(v.available).toBe(40_000_000); // deposit excluded, not subtracted
    expect(v.depositDeducted).toBe(0);
    expect(v.burn).toBe(4_000_000);
    expect(v.status).toBe("runway");
    expect(v.months1).toBe(10);
    expect(v.wholeMonths).toBe(10);
    expect(v.leftover).toBe(0);
  });
  it("소수 1자리 버림 and whole months", () => {
    const r = startupRunway({ ...base, cash: 10_000_000, monthlyLoss: 3_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.months1).toBe(3.3); // 3.333… → 3.3
    expect(r.value.wholeMonths).toBe(3);
    expect(r.value.leftover).toBe(1_000_000);
    expect(r.warnings.some((w) => w.includes("개월 미만"))).toBe(true);
    const r2 = startupRunway({ ...base, cash: 10_000_000, monthlyLoss: 5_250_000 });
    if (r2.status !== "ok") throw new Error(r2.status);
    expect(r2.value.months1).toBe(1.9); // 1.904…
    expect(r2.value.wholeMonths).toBe(1);
  });
  it("no float undershoot on exact division", () => {
    const r = startupRunway({ ...base, cash: 0.3 * 10_000_000, monthlyLoss: 0.1 * 10_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.wholeMonths).toBe(3);
    expect(r.value.months1).toBe(3);
  });
  it("unpaid deposit inside cash is subtracted", () => {
    const r = startupRunway({ ...base, cash: 50_000_000, lockedDeposit: 30_000_000, depositInCash: true, monthlyLoss: 1_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.available).toBe(20_000_000);
    expect(r.value.months1).toBe(20);
  });
  it("burn ≤ 0 → stable (not an error)", () => {
    const r = startupRunway({ ...base, cash: 1_000_000, monthlyLoss: 0, living: 1_000_000, otherIncome: 1_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.status).toBe("stable");
    expect(r.value.burn).toBe(0);
    expect(r.value.months1).toBeNull();
    const r2 = startupRunway({ ...base, cash: 1_000_000, monthlyLoss: 0, otherIncome: 500_000 });
    if (r2.status !== "ok") throw new Error(r2.status);
    expect(r2.value.status).toBe("stable");
    expect(r2.value.burn).toBe(-500_000);
  });
  it("available ≤ 0 → short, even when stable", () => {
    const r = startupRunway({ ...base, cash: 5_000_000, emergency: 5_000_000, monthlyLoss: 1_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.status).toBe("short");
    expect(r.value.available).toBe(0);
    const r2 = startupRunway({ ...base, cash: 1_000_000, pendingStartupCost: 3_000_000, monthlyLoss: 0 });
    if (r2.status !== "ok") throw new Error(r2.status);
    expect(r2.value.status).toBe("short");
    expect(r2.value.available).toBe(-2_000_000);
    expect(r2.warnings).toHaveLength(1);
  });
  it("tiny burn → huge but finite months", () => {
    const r = startupRunway({ ...base, cash: 1e12, monthlyLoss: 1 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(Number.isFinite(r.value.months1!)).toBe(true);
    expect(r.value.wholeMonths).toBe(1e12);
  });
  it("empty / invalid", () => {
    expect(startupRunway({ ...base, cash: 1 }).status).toBe("empty");
    expect(startupRunway({ ...base, monthlyLoss: 1 }).status).toBe("empty");
    const r = startupRunway({ ...base, cash: -1, monthlyLoss: 1, otherIncome: -2 });
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.issues.map((i) => i.field).sort()).toEqual(["cash", "otherIncome"]);
  });
});
