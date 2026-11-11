import { describe, expect, it } from "vitest";
import { buildUtmUrl, utmValue } from "@/lib/utm";

describe("UTM links", () => {
  it("fixes source/medium per channel and normalizes the campaign", () => {
    expect(buildUtmUrl("https://selfmarketing.ai.kr/pricing/", "daangn", "2026-11 신메뉴 이벤트")).toBe(
      "https://selfmarketing.ai.kr/pricing/?utm_source=daangn&utm_medium=social&utm_campaign=2026-11_%EC%8B%A0%EB%A9%94%EB%89%B4_%EC%9D%B4%EB%B2%A4%ED%8A%B8",
    );
  });
  it("keeps existing query params and adds content", () => {
    const u = new URL(buildUtmUrl("https://selfmarketing.ai.kr/pricing/?cat=blog", "naver_blog", "Nov", "Top Banner")!);
    expect(u.searchParams.get("cat")).toBe("blog");
    expect(u.searchParams.get("utm_campaign")).toBe("nov");
    expect(u.searchParams.get("utm_content")).toBe("top_banner");
  });
  it("refuses a bad base url, unknown channel or empty campaign", () => {
    expect(buildUtmUrl("not a url", "sms", "x")).toBeNull();
    expect(buildUtmUrl("https://a.kr/", "nope", "x")).toBeNull();
    expect(buildUtmUrl("https://a.kr/", "sms", "  ")).toBeNull();
    expect(utmValue("A&B C!")).toBe("ab_c");
  });
});
