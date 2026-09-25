import { describe, expect, it } from "vitest";
import { calcLaborRatio, laborBand } from "../laborRatio";

describe("laborBand", () => {
  it("band boundaries (inclusive upper)", () => {
    expect(laborBand(0).key).toBe("good");
    expect(laborBand(0.2).key).toBe("good");
    expect(laborBand(0.2001).key).toBe("normal");
    expect(laborBand(0.3).key).toBe("normal");
    expect(laborBand(0.35).key).toBe("caution");
    expect(laborBand(0.3501).key).toBe("danger");
    expect(laborBand(5).key).toBe("danger");
  });
});

describe("calcLaborRatio", () => {
  it("without insurance: exactly 20% → 양호", () => {
    const r = calcLaborRatio({ monthlySales: 10_000_000, staffPayroll: 2_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.totalLabor).toBe(2_000_000);
    expect(r.value.ratio).toBeCloseTo(0.2);
    expect(r.value.band.key).toBe("good");
    expect(r.value.salesForBetterBand).toBeNull();
  });
  it("with employer insurance and owner pay", () => {
    const r = calcLaborRatio({ monthlySales: 10_000_000, staffPayroll: 2_000_000, ownerPay: 1_000_000, includeEmployerInsurance: true });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.employerInsurance).toBe(216_548); // 2,000,000 × 10.827383%
    expect(r.value.totalLabor).toBe(3_216_548);
    expect(r.value.ratio).toBeCloseTo(0.3216548);
    expect(r.value.band.key).toBe("caution");
    expect(r.value.staffRatio).toBeCloseTo(0.2216548);
    expect(r.value.salesForBetterBand).toEqual({ label: "보통", sales: 10_721_827 });
  });
  it("> 100% warns, danger band", () => {
    const r = calcLaborRatio({ monthlySales: 1_000_000, staffPayroll: 2_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.band.key).toBe("danger");
    expect(r.warnings.length).toBe(1);
  });
  it("sales 0 → impossible", () => {
    expect(calcLaborRatio({ monthlySales: 0, staffPayroll: 1_000_000 }).status).toBe("impossible");
  });
  it("labor 0 → ok 0% with warning", () => {
    const r = calcLaborRatio({ monthlySales: 1_000_000, staffPayroll: 0 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.ratio).toBe(0);
    expect(r.warnings.length).toBe(1);
  });
  it("empty / invalid", () => {
    expect(calcLaborRatio({ monthlySales: null, staffPayroll: 1 }).status).toBe("empty");
    expect(calcLaborRatio({ monthlySales: -1, staffPayroll: 1 }).status).toBe("invalid");
    expect(calcLaborRatio({ monthlySales: 1, staffPayroll: 1, ownerPay: -1 }).status).toBe("invalid");
  });
});
