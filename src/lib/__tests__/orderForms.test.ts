import { describe, expect, it } from "vitest";
import { PRICING } from "@/lib/pricing";
import {
  FORM_ITEM_NAMES,
  filesOf,
  formatRequest,
  orderFormFor,
  orderVariant,
  secretOf,
  validateForm,
  withoutSecrets,
} from "@/lib/orderForms";
import { catalogRows } from "@/lib/catalogSql";

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

  it("asks for a password only as a secret field, kept out of the request text and drafts", () => {
    for (const n of FORM_ITEM_NAMES)
      for (const field of orderFormFor(n)!.fields) if (/비밀번호|PW/i.test(field.label)) expect(field.type, n).toBe("secret");
    const f = orderFormFor("블로그 서로이웃 추가")!;
    const values = { naverId: "myid", naverPw: "s3cret!" };
    expect(validateForm(f, { naverId: "myid" })).toMatch(/비밀번호/);
    expect(formatRequest(f, values, "")).toBe("[네이버 아이디] myid");
    expect(secretOf(f, values)).toBe("s3cret!");
    expect(withoutSecrets(f, values)).toEqual({ naverId: "myid" });
  });

  it("influencer category add-on orders its own catalog row at +20,000원 per post", () => {
    const f = orderFormFor("공식 인플루언서 블로그 배포 (준최적)")!;
    const base = { keywords: "송도 맛집", category: "지정 안 함 (업종에 맞게 배정)" };
    expect(orderVariant("공식 인플루언서 블로그 배포 (준최적)", 49_900, f, base)).toEqual({ name: "공식 인플루언서 블로그 배포 (준최적)", unitKrw: 49_900 });
    const pick = { ...base, category: "카테고리 지정 (1건 +20,000원)" };
    expect(validateForm(f, pick)).toMatch(/희망 카테고리/);
    const v = orderVariant("공식 인플루언서 블로그 배포 (준최적)", 49_900, f, pick);
    expect(v).toEqual({ name: "공식 인플루언서 블로그 배포 (준최적) + 카테고리 지정", unitKrw: 69_900 });
    // The server must know the row at the same price.
    expect(catalogRows().find((r) => r.name === v.name)?.amountKrw).toBe(69_900);
  });

  it("attachments are listed by name in the request and passed separately", () => {
    const f = orderFormFor("블로그 최적 배포")!;
    const files = [{ path: "u/1.docx", name: "원고.docx", size: 1000 }];
    const values = { keywords: "송도 맛집", files: JSON.stringify(files) };
    expect(formatRequest(f, values, "")).toBe("[희망 키워드] 송도 맛집\n[원고·사진 파일] 1개 첨부 (원고.docx)");
    expect(filesOf(f, values)).toEqual(files);
  });

  it("daangn viral posts require the message box", () => {
    const f = orderFormFor("동네생활 게시글 (바이럴)")!;
    const values = { bizProfile: "https://daangn.com/kr/biz/abc" };
    expect(validateForm(f, values, "")).toMatch(/알리고 싶은 내용/);
    expect(validateForm(f, values, "신메뉴 출시")).toBeNull();
    expect(formatRequest(f, values, "신메뉴 출시")).toContain("[알리고 싶은 내용] 신메뉴 출시");
  });

  it("writes answers as [항목] lines, select shown as 값 (그룹)", () => {
    const f = orderFormFor("보도자료 언론 송출 (일반)")!;
    const text = formatRequest(f, { media: "일반|전자신문", copy: "원고 대필도 함께 주문할게요" }, "오전 송출 희망");
    expect(text).toBe("[송출 희망 언론사] 전자신문 (일반)\n[보도자료 원고] 원고 대필도 함께 주문할게요\n[추가 요청사항] 오전 송출 희망");
  });
});
