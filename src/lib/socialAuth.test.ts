import { describe, expect, it } from "vitest";
import { safeOAuthNext } from "./socialAuth";

describe("로그인 후 복귀", () => {
  it("상품의 사이트 내부 경로를 보존한다", () => {
    expect(safeOAuthNext("/store/test/?buy=1")).toBe("/store/test/?buy=1");
  });
  it("다른 호스트, 역슬래시와 제어 문자를 거부한다", () => {
    for (const path of ["//outside.example", "/\\outside.example", "/\n/outside.example", "https://outside.example"]) {
      expect(safeOAuthNext(path)).toBeUndefined();
    }
  });
});
