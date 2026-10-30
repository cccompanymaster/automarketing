import { describe, expect, it } from "vitest";
import { EMPTY_TAX_INFO, validateBankCharge, type TaxInvoiceInfo } from "@/lib/bankCharge";

const full: TaxInvoiceInfo = {
  company: "테스트상사",
  bizNo: "123-45-67890",
  ceo: "홍길동",
  address: "인천광역시 연수구 테스트로 1",
  bizType: "서비스업",
  bizItem: "광고대행업",
  email: "tax@example.com",
  managerName: "김담당",
  managerPhone: "010-1234-5678",
};
const base = { amount: 110_000, depositor: "홍길동", receiptType: "tax_invoice" as const };

describe("tax invoice request", () => {
  it("accepts the full set of fields", () => {
    expect(validateBankCharge({ ...base, tax: full })).toBeNull();
  });

  it.each([
    ["company", /회사명/],
    ["bizNo", /사업자등록번호/],
    ["ceo", /대표자명/],
    ["address", /사업장 주소/],
    ["bizType", /업태/],
    ["bizItem", /종목/],
    ["email", /이메일/],
    ["managerName", /담당자명/],
    ["managerPhone", /연락처/],
  ] as [keyof TaxInvoiceInfo, RegExp][])("requires %s", (key, msg) => {
    expect(validateBankCharge({ ...base, tax: { ...full, [key]: "" } })).toMatch(msg);
  });

  it("empty form is rejected", () => {
    expect(validateBankCharge({ ...base, tax: EMPTY_TAX_INFO })).not.toBeNull();
  });
});
