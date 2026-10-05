import { describe, expect, it } from "vitest";
import { hasRequiredProfile, normalizeAgeRange, normalizePhone, profileFromMetadata, EMPTY_PROFILE } from "@/lib/profile";

describe("normalizePhone", () => {
  it("formats Korean mobiles", () => {
    expect(normalizePhone("01012345678")).toBe("010-1234-5678");
    expect(normalizePhone("010-1234-5678")).toBe("010-1234-5678");
    expect(normalizePhone("+82 10-1234-5678")).toBe("010-1234-5678"); // Kakao format
    expect(normalizePhone("0111234567")).toBe("011-123-4567");
  });
  it("rejects non-mobile / short input", () => {
    expect(normalizePhone("")).toBe("");
    expect(normalizePhone("02-123-4567")).toBe("");
    expect(normalizePhone("010-123")).toBe("");
  });
});

describe("normalizeAgeRange", () => {
  it("maps Kakao bands to stored bands", () => {
    expect(normalizeAgeRange("30~39")).toBe("30-39");
    expect(normalizeAgeRange("20~29")).toBe("20-29");
    expect(normalizeAgeRange("60~69")).toBe("60-");
    expect(normalizeAgeRange("80~")).toBe("60-");
    expect(normalizeAgeRange("30-39")).toBe("30-39"); // Naver format unchanged
  });
});

describe("profileFromMetadata + hasRequiredProfile", () => {
  it("uses Kakao phone/age claims and treats missing phone as incomplete", () => {
    const p = profileFromMetadata({ phone_number: "+82 10-9876-5432", age_range: "40~49", gender: "female" });
    expect(p.phone).toBe("010-9876-5432");
    expect(p.ageRange).toBe("40-49");
    expect(hasRequiredProfile(p)).toBe(true);
    expect(hasRequiredProfile(EMPTY_PROFILE)).toBe(false);
  });
  it("edited profile wins over provider claims", () => {
    const p = profileFromMetadata({ phone_number: "+82 10-1111-2222", profile: { phone: "010-3333-4444" } });
    expect(p.phone).toBe("010-3333-4444");
  });
});
