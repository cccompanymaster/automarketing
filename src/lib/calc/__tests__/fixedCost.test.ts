import { describe, expect, it } from "vitest";
import { calcFixedCost } from "../fixedCost";

describe("calcFixedCost", () => {
  it("normal: principal only in cash outflow", () => {
    const r = calcFixedCost({ rent: 2_000_000, labor: 5_000_000, loanInterest: 300_000, loanPrincipal: 700_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.cashOutflow).toBe(8_000_000);
    expect(r.value.accountingFixed).toBe(7_300_000);
    expect(r.value.principal).toBe(700_000);
    expect(r.value.annualCash).toBe(96_000_000);
    expect(r.value.ranked.map((l) => l.key)).toEqual(["labor", "rent", "loanPrincipal", "loanInterest"]);
    const sum = r.value.lines.reduce((s, l) => s + l.share, 0);
    expect(sum).toBeCloseTo(1);
    expect(r.value.lines.find((l) => l.key === "labor")?.share).toBeCloseTo(0.625);
    expect(r.value.lines.find((l) => l.key === "loanPrincipal")?.cashOnly).toBe(true);
    expect(r.warnings.length).toBe(1); // labor ≥ 50%
  });
  it("single item → 100% and no dominance warning", () => {
    const r = calcFixedCost({ rent: 1_000_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.ranked[0].share).toBe(1);
    expect(r.warnings.length).toBe(0);
  });
  it("all empty → empty", () => {
    expect(calcFixedCost({}).status).toBe("empty");
    expect(calcFixedCost({ rent: null }).status).toBe("empty");
  });
  it("all zero → impossible", () => {
    const r = calcFixedCost({ rent: 0, labor: 0 });
    expect(r.status).toBe("impossible");
  });
  it("principal only → accounting fixed 0", () => {
    const r = calcFixedCost({ loanPrincipal: 500_000 });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.value.accountingFixed).toBe(0);
    expect(r.value.cashOutflow).toBe(500_000);
  });
  it("negative → invalid on that field", () => {
    const r = calcFixedCost({ rent: -1, labor: 100 });
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.issues[0].field).toBe("rent");
  });
});
