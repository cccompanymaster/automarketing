import { describe, expect, it } from "vitest";
import { safeNext } from "../socialAuth";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/store/place/?buy=1")).toBe("/store/place/?buy=1");
    expect(safeNext("/mypage#orders")).toBe("/mypage#orders");
  });

  it("refuses anything that resolves off-site", () => {
    for (const v of ["//evil.example", "/\t/evil.example", "/\n/evil.example", "/\r/evil.example", "/\\evil.example", "https://evil.example", "javascript:alert(1)", "evil", "", null, undefined]) {
      expect(safeNext(v)).toBeUndefined();
    }
  });
});
