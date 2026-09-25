import { describe, expect, it } from "vitest";
import { affordableRent } from "../affordableRent";

describe("affordableRent", () => {
  it("관리비 별도: 매출 3,000만 × 12% → 월세 360만", () => {
    const r = affordableRent({ sales: 30_000_000, targetPct: 12, includeMaintenance: false, maintenance: 300_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.budget).toBe(3_600_000);
    expect(r.value.rent).toBe(3_600_000);
    expect(r.value.totalOutlay).toBe(3_900_000);
    expect(r.value.totalRatio).toBeCloseTo(0.13);
    expect(r.value.table.map((t) => t.rent)).toEqual([3_000_000, 3_600_000, 4_500_000, 5_400_000]);
    expect(r.warnings.some((w) => w.includes("월세 + 관리비"))).toBe(true);
  });
  it("관리비 포함: 예산에서 관리비를 뺀다", () => {
    const r = affordableRent({ sales: 30_000_000, targetPct: 12, includeMaintenance: true, maintenance: 300_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.rent).toBe(3_300_000);
    expect(r.value.totalOutlay).toBe(3_600_000);
    expect(r.value.totalRatio).toBeCloseTo(0.12);
    expect(r.value.table[0].rent).toBe(2_700_000);
  });
  it("floors to whole won (never exceeds target)", () => {
    const r = affordableRent({ sales: 1_234_567, targetPct: 12.5, includeMaintenance: false, maintenance: null });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.rent).toBe(154_320); // 154,320.875
    expect(r.value.rent / 1_234_567).toBeLessThanOrEqual(0.125);
  });
  it("no float noise at exact values", () => {
    const r = affordableRent({ sales: 7_000_000, targetPct: 15, includeMaintenance: false, maintenance: null });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.rent).toBe(1_050_000);
  });
  it("maintenance ≥ budget → impossible", () => {
    expect(affordableRent({ sales: 1_000_000, targetPct: 10, includeMaintenance: true, maintenance: 100_000 }).status).toBe("impossible");
    expect(affordableRent({ sales: 1_000_000, targetPct: 10, includeMaintenance: true, maintenance: 99_999 }).status).toBe("ok");
    // excluded maintenance is not subtracted, so it can't make it impossible
    expect(affordableRent({ sales: 1_000_000, targetPct: 10, includeMaintenance: false, maintenance: 500_000 }).status).toBe("ok");
  });
  it("high target → warning", () => {
    const r = affordableRent({ sales: 10_000_000, targetPct: 25, includeMaintenance: false, maintenance: null });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.warnings.some((w) => w.includes("참고 기준"))).toBe(true);
  });
  it("invalid: 0% / 100% / sales 0 / negative maintenance", () => {
    expect(affordableRent({ sales: 1_000_000, targetPct: 0, includeMaintenance: false, maintenance: null }).status).toBe("invalid");
    expect(affordableRent({ sales: 1_000_000, targetPct: 100, includeMaintenance: false, maintenance: null }).status).toBe("invalid");
    expect(affordableRent({ sales: 0, targetPct: 10, includeMaintenance: false, maintenance: null }).status).toBe("invalid");
    expect(affordableRent({ sales: 1, targetPct: 10, includeMaintenance: true, maintenance: -1 }).status).toBe("invalid");
  });
  it("empty", () => {
    expect(affordableRent({ sales: null, targetPct: 10, includeMaintenance: false, maintenance: null }).status).toBe("empty");
    expect(affordableRent({ sales: 1, targetPct: null, includeMaintenance: false, maintenance: null }).status).toBe("empty");
  });
});
