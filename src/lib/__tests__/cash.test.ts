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

describe("VAT notice follows the same date policy", () => {
  it("before the start date it talks about the future, after it about the past", async () => {
    const { vatNotice, VAT_START } = await import("@/lib/cash");
    expect(vatNotice(VAT_START - 1)).toMatch(/11월 6일부터/);
    expect(vatNotice(VAT_START)).toMatch(/이미 함께 냈고/);
    expect(vatNotice(VAT_START)).toMatch(/다시 붙지 않아요/);
  });

  it("the KST boundary is midnight 2026-11-06 in Seoul (15:00 UTC on 11-05)", () => {
    expect(new Date(VAT_START).toISOString()).toBe("2026-11-05T15:00:00.000Z");
  });

  it("50,000 cash after the start costs 55,000원", () => {
    expect(paymentForCash(50_000, VAT_START)).toBe(55_000);
    expect(cashForPayment(55_000, VAT_START)).toBe(50_000);
  });
});
