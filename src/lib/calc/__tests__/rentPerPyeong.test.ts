import { describe, expect, it } from "vitest";
import { m2ToPyeong, pyeongToM2, rentPerPyeong } from "../rentPerPyeong";
import { AREA } from "../rates";

const K = AREA.value.m2PerPyeong;

describe("rentPerPyeong", () => {
  it("평 입력: 20평 · 월세 200만 → 평당 10만", () => {
    const r = rentPerPyeong({ unit: "pyeong", area: 20, rent: 2_000_000, maintenance: null });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.pyeong).toBe(20);
    expect(r.value.m2).toBeCloseTo(20 * K);
    expect(r.value.rentPerPyeong).toBe(100_000);
    expect(r.value.rentPerM2).toBeCloseTo(100_000 / K);
    expect(r.value.totalPerPyeong).toBe(100_000);
  });
  it("㎡ 입력 converts to 평 with the rates constant", () => {
    const r = rentPerPyeong({ unit: "m2", area: 66.116, rent: 2_000_000, maintenance: 200_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.pyeong).toBeCloseTo(66.116 / K);
    expect(r.value.rentPerM2).toBeCloseTo(2_000_000 / 66.116);
    expect(r.value.totalPerM2).toBeCloseTo(2_200_000 / 66.116);
    expect(r.value.totalPerPyeong).toBeCloseTo(2_200_000 / (66.116 / K));
  });
  it("round trip conversion", () => {
    expect(m2ToPyeong(pyeongToM2(33))).toBeCloseTo(33, 10);
  });
  it("tiny area stays finite", () => {
    const r = rentPerPyeong({ unit: "m2", area: 0.01, rent: 1_000_000, maintenance: null });
    if (r.status !== "ok") throw new Error(r.status);
    expect(Number.isFinite(r.value.rentPerPyeong)).toBe(true);
  });
  it("rent 0 → 0 with warning", () => {
    const r = rentPerPyeong({ unit: "pyeong", area: 10, rent: 0, maintenance: null });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.rentPerPyeong).toBe(0);
    expect(r.warnings).toHaveLength(1);
  });
  it("area 0 / negative → invalid", () => {
    const r = rentPerPyeong({ unit: "pyeong", area: 0, rent: 1, maintenance: null });
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.issues[0].field).toBe("area");
    expect(rentPerPyeong({ unit: "m2", area: -3, rent: 1, maintenance: null }).status).toBe("invalid");
    expect(rentPerPyeong({ unit: "m2", area: 3, rent: -1, maintenance: null }).status).toBe("invalid");
  });
  it("empty", () => {
    expect(rentPerPyeong({ unit: "pyeong", area: null, rent: 1, maintenance: null }).status).toBe("empty");
  });
});
