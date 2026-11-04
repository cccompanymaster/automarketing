import { describe, expect, it } from "vitest";
import { PRICING } from "@/lib/pricing";
import { searchStore, storeProducts } from "@/lib/store";
import { choseong, suggest } from "@/lib/storeSearch";

const all = storeProducts(PRICING);
const top = (q: string) => searchStore(all, q).list.map((p) => p.id);

describe("store search understands searchers", () => {
  it.each([
    ["네이버 지도", "place-reward"],
    ["네이버지도", "place-reward"],
    ["스마트플레이스", "place-basics"],
    ["카카오 지도", "kakaomap-review"],
    ["쿠팡", "commerce"],
    ["맘카페", "cafe-post"],
    ["서이추", "blog-neighbor"],
    ["준최", "blog-deploy"],
    ["기사", "press"],
    ["챗gpt", "ai-aeo"],
    ["당근마켓", "daangn-reaction"],
    ["팔로워", "instagram"],
    ["구독자", "youtube"],
  ])("%s → finds %s", (q, id) => {
    expect(top(q).slice(0, 4)).toContain(id);
  });

  it("카카오 지도 does not drag in Naver place products first", () => {
    expect(top("카카오지도")[0]).toMatch(/^kakaomap/);
  });

  it("tolerates a typo and reports the correction", () => {
    const r = searchStore(all, "플래이스");
    expect(r.list.map((p) => p.id)).toContain("place-reward");
    expect(r.corrections).toContain("플레이스");
  });

  it("matches initial consonants", () => {
    expect(choseong("플레이스")).toBe("ㅍㄹㅇㅅ");
    expect(top("ㅍㄹㅇㅅ")[0]).toMatch(/^place/);
  });

  it("multi-word queries narrow down", () => {
    const ids = top("블로그 상위노출");
    expect(ids[0]).toBe("blog-guarantee");
  });

  it("suggests as you type", () => {
    expect(suggest(all.map((p) => p.title), "네이버").length).toBeGreaterThan(0);
  });

  it("unknown words find nothing rather than everything", () => {
    expect(top("자동차보험")).toEqual([]);
  });
});

describe("suggestions", () => {
  it("lists each spelling once", () => {
    const list = suggest(all.map((p) => p.title), "네이버");
    const keys = list.map((w) => w.replace(/\s+/g, ""));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("hidden words", () => {
  it("쿠팡 still searches but is never shown as a suggestion", async () => {
    const { SUGGESTED_QUERIES } = await import("@/lib/storeSearch");
    expect(top("쿠팡")).toContain("commerce");
    expect(SUGGESTED_QUERIES.join()).not.toContain("쿠팡");
    expect(suggest(all.map((p) => p.title), "쿠").join()).not.toContain("쿠팡");
  });
});
