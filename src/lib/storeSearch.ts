// Store search UI helpers. Ranking itself lives in lib/search/search-engine.mjs
// (partial words, spacing, 초성, synonyms, typos) and the per-product
// vocabulary (aliases · keywords · tags) in lib/store.ts.

import { suggestSearchTerms, type SearchableProduct } from "@/lib/search/search-engine.mjs";

/** Popular searches shown under the box. */
export const SUGGESTED_QUERIES = ["네이버 지도", "블로그 배포", "맘카페", "스마트스토어", "당근", "인스타 팔로워", "보도자료", "AI 검색"];

/**
 * Words the search understands but never displays (placeholder, popular
 * searches, typeahead) — the store names that platform only as "C사".
 */
const HIDDEN_WORDS = ["쿠팡"];
const isHidden = (w: string) => HIDDEN_WORDS.some((h) => w.includes(h));

/** Typeahead: titles, aliases and keywords containing the query, hidden words removed, one per spelling. */
export function suggest(products: SearchableProduct[], query: string, limit = 6): string[] {
  // The query itself counts as seen: suggesting what was just typed is noise.
  const seen = new Set<string>([query.replace(/\s+/g, "")]);
  return suggestSearchTerms(products, query, 50)
    .filter((w) => !isHidden(w))
    .filter((w) => {
      const k = w.replace(/\s+/g, "");
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, limit);
}
