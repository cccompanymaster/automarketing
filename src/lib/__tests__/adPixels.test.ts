import { describe, expect, it } from "vitest";
import { PIXEL_EVENTS } from "@/lib/adPixels";
import { buildCsp, TOOL_ORIGINS } from "@/lib/csp";

describe("ad pixel mapping", () => {
  it("maps every funnel conversion for each pixel", () => {
    expect(PIXEL_EVENTS.generate_lead).toEqual({ naver: "lead", meta: "Lead", kakao: "participation", karrot: "Lead" });
    expect(PIXEL_EVENTS.signup_complete.meta).toBe("CompleteRegistration");
    expect(PIXEL_EVENTS.purchase.naver).toBe("purchase");
  });
});

describe("CSP follows the tracking ids", () => {
  it("adds a tool's origins only when its id is set", () => {
    const off = buildCsp([{ ...TOOL_ORIGINS.meta, id: "" }]);
    expect(off).not.toContain("connect.facebook.net");
    const on = buildCsp([{ ...TOOL_ORIGINS.meta, id: "123" }]);
    expect(on).toMatch(/script-src [^;]*https:\/\/connect\.facebook\.net/);
    expect(on).toMatch(/img-src [^;]*https:\/\/www\.facebook\.com/);
  });
  it("always keeps GA4, Supabase and the Kakao share SDK", () => {
    const csp = buildCsp([]);
    expect(csp).toContain("https://*.googletagmanager.com");
    expect(csp).toContain("wss://*.supabase.co");
    expect(csp).toContain("https://t1.kakaocdn.net");
    expect(csp).not.toContain("tagmanager.google.com");
  });
});
