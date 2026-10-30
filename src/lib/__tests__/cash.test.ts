import { describe, expect, it } from "vitest";
import { CHARGE_PRESETS_CASH, VAT_START, cashForPayment, paymentForCash, vatApplies } from "@/lib/cash";

const after = VAT_START;
const before = VAT_START - 1;

describe("cash VAT split", () => {
  it("starts with the revised terms (2026-11-06 KST)", () => {
    expect(vatApplies(before)).toBe(false);
    expect(vatApplies(after)).toBe(true);
  });

  it("is 1:1 before the start date", () => {
    expect(paymentForCash(100_000, before)).toBe(100_000);
    expect(cashForPayment(50_000, before)).toBe(50_000);
  });

  it("adds 10% VAT to the payment", () => {
    expect(paymentForCash(100_000, after)).toBe(110_000);
    expect(paymentForCash(1_000, after)).toBe(1_100);
  });

  it("credits the supply value, round-tripping every preset", () => {
    for (const cash of CHARGE_PRESETS_CASH) expect(cashForPayment(paymentForCash(cash, after), after)).toBe(cash);
  });

  it("floors odd deposits like the server does", () => {
    expect(cashForPayment(50_000, after)).toBe(45_454);
  });
});
