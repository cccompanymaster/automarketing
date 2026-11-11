import { describe, expect, it } from "vitest";
import { aiSourceOf, remember, sourceText, touchFromVisit } from "@/lib/attribution";

const T = Date.UTC(2026, 10, 11);

describe("touchFromVisit", () => {
  it("keeps utm labels and the landing path", () => {
    expect(touchFromVisit("https://selfmarketing.ai.kr/pricing/?utm_source=meta&utm_medium=paid_social&utm_campaign=11월", "", T)).toEqual({
      s: "meta", m: "paid_social", c: "11월", lp: "/pricing/", t: T,
    });
  });
  it("turns Naver search-ad parameters into naver / cpc with the keyword", () => {
    expect(touchFromVisit("https://selfmarketing.ai.kr/?n_media=27758&n_keyword=플레이스광고", "", T)).toMatchObject({ s: "naver", m: "cpc", k: "플레이스광고" });
  });
  it("records click ids by kind only", () => {
    expect(touchFromVisit("https://selfmarketing.ai.kr/?gclid=SECRET", "", T)).toEqual({ s: "google", m: "cpc", lp: "/", t: T });
  });
  it("classifies referrers and AI answers", () => {
    expect(touchFromVisit("https://selfmarketing.ai.kr/", "https://search.naver.com/x", T)).toMatchObject({ s: "search.naver.com", m: "organic" });
    expect(touchFromVisit("https://selfmarketing.ai.kr/blog/a/?utm_source=chatgpt.com", "", T)).toMatchObject({ s: "ChatGPT", m: "ai" });
    expect(touchFromVisit("https://selfmarketing.ai.kr/", "https://www.perplexity.ai/search", T)).toMatchObject({ s: "Perplexity", m: "ai" });
    expect(touchFromVisit("https://selfmarketing.ai.kr/?utm_source=naver&utm_medium=cpc", "https://chatgpt.com/", T)).toMatchObject({ s: "naver", m: "cpc" });
  });
  it("ignores direct visits and own pages", () => {
    expect(touchFromVisit("https://selfmarketing.ai.kr/", "", T)).toBeNull();
    expect(touchFromVisit("https://selfmarketing.ai.kr/a", "https://selfmarketing.ai.kr/b", T)).toBeNull();
  });
  it("knows the common AI hosts", () => {
    expect(aiSourceOf("gemini.google.com")).toBe("Gemini");
    expect(aiSourceOf("www.google.com")).toBe("");
  });
});

describe("remember / sourceText", () => {
  it("keeps the first touch for 90 days and updates the last", () => {
    const a = touchFromVisit("https://selfmarketing.ai.kr/?utm_source=naver_blog&utm_medium=referral", "", T)!;
    const b = touchFromVisit("https://selfmarketing.ai.kr/?n_keyword=광고", "", T + 864e5)!;
    const rec = remember(remember(null, a, "/", T), b, "/", T + 864e5);
    expect(rec.first.s).toBe("naver_blog");
    expect(rec.last?.s).toBe("naver");
    expect(sourceText(rec, "/start/")).toBe("처음: naver_blog / referral → / (11/11) | 최근: naver / cpc 「광고」 → / (11/12) | 신청: /start/");
    expect(remember(rec, null, "/x", T + 91 * 864e5).first.s).toBe("(direct)");
  });
});
