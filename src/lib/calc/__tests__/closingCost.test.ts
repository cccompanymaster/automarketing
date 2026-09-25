import { describe, expect, it } from "vitest";
import { closingCost, type ClosingCostInput } from "../closingCost";

const blank: ClosingCostInput = {
  demolition: null,
  penalty: null,
  severance: null,
  unpaid: null,
  loanBalance: null,
  otherExpense: null,
  deposit: null,
  premium: null,
  equipment: null,
  inventory: null,
};

describe("closingCost", () => {
  it("surplus", () => {
    const r = closingCost({ ...blank, demolition: 5_000_000, unpaid: 2_000_000, loanBalance: 10_000_000, deposit: 30_000_000, equipment: 3_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.expenseTotal).toBe(17_000_000);
    expect(r.value.recoveryTotal).toBe(33_000_000);
    expect(r.value.net).toBe(16_000_000);
    expect(r.value.outcome).toBe("surplus");
  });
  it("shortfall", () => {
    const r = closingCost({ ...blank, loanBalance: 50_000_000, severance: 3_000_000, deposit: 20_000_000, premium: 10_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.net).toBe(-23_000_000);
    expect(r.value.outcome).toBe("shortfall");
    expect(r.warnings.some((w) => w.includes("권리금"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("원상복구"))).toBe(true);
  });
  it("even (and all zeros)", () => {
    const r = closingCost({ ...blank, penalty: 1_000, inventory: 1_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.outcome).toBe("even");
    expect(r.value.net).toBe(0);
    const z = closingCost({ ...blank, deposit: 0 });
    if (z.status !== "ok") throw new Error(z.status);
    expect(z.value.outcome).toBe("even");
  });
  it("huge values stay exact", () => {
    const r = closingCost({ ...blank, loanBalance: 9_000_000_000_000, deposit: 1 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.net).toBe(-8_999_999_999_999);
  });
  it("empty / invalid", () => {
    expect(closingCost(blank).status).toBe("empty");
    const r = closingCost({ ...blank, penalty: -1 });
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.issues[0].field).toBe("penalty");
  });
});
