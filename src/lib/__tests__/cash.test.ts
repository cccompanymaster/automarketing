import { describe, expect, it } from "vitest";
import { CHARGE_PRESETS_CASH, cashForPayment, paymentForCash } from "@/lib/cash";

describe("cash VAT split", () => {
  it("adds 10% VAT to the payment", () => {
    expect(paymentForCash(100_000)).toBe(110_000);
    expect(paymentForCash(1_000)).toBe(1_100);
  });

  it("credits the supply value, round-tripping every preset", () => {
    for (const cash of CHARGE_PRESETS_CASH) expect(cashForPayment(paymentForCash(cash))).toBe(cash);
  });

  it("floors odd deposits like the server does", () => {
    expect(cashForPayment(50_000)).toBe(45_454);
  });
});
