import { describe, expect, it } from "vitest";
import { PRICING } from "@/lib/pricing";
import { searchStore, searchableOf, storeProducts } from "@/lib/store";
import { SUGGESTED_QUERIES, suggest } from "@/lib/storeSearch";
import { getHangulInitials } from "@/lib/search/search-engine.mjs";

const all = storeProducts(PRICING);
const docs = all.map(searchableOf);
const top = (q: string) => searchStore(all, q).list.map((p) => p.id);

describe("store search — required queries", () => {
  it.each([
    ["인플", "blog-influencer"],
    ["인플루언서", "blog-influencer"],
    ["네이버 인플", "blog-influencer"],
    ["ㅇㅍㄹ", "blog-influencer"],
  ])("%s → %s first", (q, id) => {
    expect(top(q)[0]).toBe(id);
  });

  it("상위 노출 = 상위노출, title matches first", () => {
    // Same leaders in the same order; a two-word query may add partial
    // matches at the end (the engine's 보조 결과), never drop any.
    const spaced = top("상위 노출");
    const compact = top("상위노출");
    expect(spaced).toEqual(expect.arrayContaining(compact));
    expect(spaced.slice(0, compact.length)).toEqual(compact);
    expect(spaced.slice(0, 3)).toEqual(expect.arrayContaining(["blog-guarantee", "place-reward", "commerce"]));
  });

  it("쇼핑 → 커머스", () => {
    expect(top("쇼핑")[0]).toBe("commerce");
  });

  it("리뷰 → 후기·리뷰 상품 (영수증 리뷰 first)", () => {
    const ids = top("리뷰");
    expect(ids[0]).toBe("place-basics");
    expect(ids).toEqual(expect.arrayContaining(["kakaomap-review", "daangn-review"]));
  });

  it("인스타 ↔ SNS", () => {
    expect(top("SNS")).toContain("instagram");
  });
});

describe("store search understands searchers", () => {
  it.each([
    ["네이버 지도", "place-reward"],
    ["네이버지도", "place-reward"],
    ["스마트플레이스", "place-basics"],
    ["카카오 지도", "kakaomap-trend"],
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

  it("카카오 지도 puts Kakao products before Naver place", () => {
    expect(top("카카오지도")[0]).toMatch(/^kakaomap/);
  });

  it("tolerates a short typo and flags it", () => {
    const r = searchStore(all, "플래이스");
    expect(r.list.map((p) => p.id)).toContain("place-reward");
    expect(r.fuzzy).toBe(true);
  });

  it("matches initial consonants (word-start beats mid-word)", () => {
    expect(getHangulInitials("플레이스")).toBe("ㅍㄹㅇㅅ");
    expect(top("ㅍㄹㅇㅅ")[0]).toMatch(/^place/);
  });

  it("multi-word queries put the best match first", () => {
    expect(top("블로그 상위노출")[0]).toBe("blog-guarantee");
  });

  it("empty query keeps catalog order", () => {
    expect(top("  ")).toEqual(all.map((p) => p.id));
  });

  it("unknown words find nothing", () => {
    expect(top("자동차보험")).toEqual([]);
  });
});

describe("suggestions", () => {
  it("suggest as you type", () => {
    expect(suggest(docs, "네이버").length).toBeGreaterThan(0);
  });

  it("list each spelling once", () => {
    const keys = suggest(docs, "네이버").map((w) => w.replace(/\s+/g, ""));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("쿠팡 still searches but is never shown", () => {
    expect(top("쿠팡")).toContain("commerce");
    expect(SUGGESTED_QUERIES.join()).not.toContain("쿠팡");
    expect(suggest(docs, "쿠").join()).not.toContain("쿠팡");
  });
});
