import { describe, expect, it } from "vitest";
import { PRICING } from "@/lib/pricing";
import { FORM_ITEM_NAMES, formatRequest, orderFormFor, validateForm } from "@/lib/orderForms";

describe("order forms", () => {
  it("every form belongs to a real price row (renames must update orderForms)", () => {
    const names = PRICING.flatMap((g) => g.items.map((i) => i.name));
    for (const n of FORM_ITEM_NAMES) expect(names, n).toContain(n);
  });

  it("place rewards need keywords and a place URL", () => {
    const f = orderFormFor("일반형 리워드")!;
    expect(validateForm(f, {})).toMatch(/키워드/);
    expect(validateForm(f, { keywords: "송도 맛집", placeUrl: "naver" })).toMatch(/https/);
    expect(validateForm(f, { keywords: "송도 맛집", placeUrl: "https://naver.me/abc" })).toBeNull();
  });

  it("never asks for a password", () => {
    for (const n of FORM_ITEM_NAMES) for (const field of orderFormFor(n)!.fields) expect(field.label).not.toMatch(/비밀번호|PW/i);
  });

  it("writes answers as [항목] lines, select shown as 값 (그룹)", () => {
    const f = orderFormFor("보도자료 언론 송출 (일반)")!;
    const text = formatRequest(f, { media: "일반|전자신문", copy: "원고 대필도 함께 주문할게요" }, "오전 송출 희망");
    expect(text).toBe("[송출 희망 언론사] 전자신문 (일반)\n[보도자료 원고] 원고 대필도 함께 주문할게요\n[추가 요청사항] 오전 송출 희망");
  });
});
