import { describe, expect, it } from "vitest";
import { bandFor, rentRatio } from "../rentRatio";

describe("rentRatio", () => {
  it("normal: 매출 3,000만 / 임대료 300만 / 관리비 30만 → 11% 보통", () => {
    const r = rentRatio({ sales: 30_000_000, rent: 3_000_000, maintenance: 300_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.occupancy).toBe(3_300_000);
    expect(r.value.ratio).toBeCloseTo(0.11);
    expect(r.value.rentOnlyRatio).toBeCloseTo(0.1);
    expect(r.value.band.key).toBe("normal");
    expect(r.value.salesForGood).toBe(33_000_000);
    expect(r.warnings).toHaveLength(0);
  });
  it("maintenance empty → treated as 0 with a warning", () => {
    const r = rentRatio({ sales: 10_000_000, rent: 1_000_000, maintenance: null });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.ratio).toBe(0.1);
    expect(r.value.band.key).toBe("good"); // exactly 10% is inclusive
    expect(r.warnings.some((w) => w.includes("관리비"))).toBe(true);
  });
  it("band boundaries are inclusive upper bounds", () => {
    expect(bandFor(0).key).toBe("good");
    expect(bandFor(0.1).key).toBe("good");
    expect(bandFor(0.1000001).key).toBe("normal");
    expect(bandFor(0.15).key).toBe("normal");
    expect(bandFor(0.2).key).toBe("caution");
    expect(bandFor(0.2001).key).toBe("danger");
    expect(bandFor(5).key).toBe("danger");
  });
  it("rent ≥ sales → danger with warning", () => {
    const r = rentRatio({ sales: 1_000_000, rent: 1_500_000, maintenance: 0 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.ratio).toBe(1.5);
    expect(r.value.band.key).toBe("danger");
    expect(r.warnings.some((w) => w.includes("매출 이상"))).toBe(true);
  });
  it("rent 0 → ratio 0, salesForGood 0", () => {
    const r = rentRatio({ sales: 1_000_000, rent: 0, maintenance: 0 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.ratio).toBe(0);
    expect(r.value.salesForGood).toBe(0);
  });
  it("huge values stay finite", () => {
    const r = rentRatio({ sales: 1e13, rent: 1e11, maintenance: 1e10 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(Number.isFinite(r.value.ratio)).toBe(true);
    expect(r.value.ratio).toBeCloseTo(0.011);
  });
  it("sales 0 → impossible", () => {
    const r = rentRatio({ sales: 0, rent: 1_000_000, maintenance: null });
    expect(r.status).toBe("impossible");
  });
  it("empty / negative", () => {
    expect(rentRatio({ sales: null, rent: 1, maintenance: null }).status).toBe("empty");
    expect(rentRatio({ sales: 1, rent: null, maintenance: null }).status).toBe("empty");
    const r = rentRatio({ sales: -1, rent: 1, maintenance: -5 });
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.issues.map((i) => i.field).sort()).toEqual(["maintenance", "sales"]);
  });
});
