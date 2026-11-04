// Store search that understands how owners actually type: everyday names for
// the same thing (네이버 지도 = 플레이스, 쿠팡 = C사, 맘카페 = 카페 홍보),
// spacing variants, small typos (플래이스) and initial consonants (ㅍㄹㅇㅅ).
// Results are ranked; pure functions so the app can reuse them.

/** Canonical term → words searchers use for it. Canonical terms appear in product text. */
export const SYNONYMS: Record<string, string[]> = {
  플레이스: ["네이버지도", "네이버 지도", "네이버맵", "지도", "스마트플레이스", "스플", "매장노출", "가게노출", "맛집", "지역검색", "길찾기"],
  카카오맵: ["카카오 지도", "카카오지도", "카맵", "다음지도", "다음 지도", "카카오맵 리뷰"],
  블로그: ["네이버블로그", "네이버 블로그", "포스팅", "블로그마케팅", "블로그 마케팅", "블마"],
  상위노출: ["상위 노출", "1페이지", "첫페이지", "상단노출", "상단 노출", "순위", "랭킹", "노출", "검색노출", "통검"],
  리워드: ["트래픽", "유입", "방문자", "타수", "클릭", "슬롯", "미션"],
  배포: ["발행", "게시", "포스팅 배포", "블배"],
  원고: ["글쓰기", "글 작성", "원고작성", "대필", "콘텐츠", "ai원고", "ai 원고", "카피"],
  서로이웃: ["서이추", "이웃", "이웃추가", "이웃 추가", "블로그 이웃"],
  인플루언서: ["인플", "공식인플", "인플블로그"],
  준최적: ["준최", "준최블", "준최적화"],
  최적: ["최블", "최적화블로그", "최적블로그"],
  카페: ["맘카페", "지역카페", "커뮤니티", "카페바이럴", "카페 바이럴", "바이럴", "까페"],
  커머스: ["쿠팡", "쿠팡상위노출", "스마트스토어", "스스", "쇼핑", "네이버쇼핑", "오픈마켓", "상품순위", "상품 순위"],
  C사: ["쿠팡"],
  인스타: ["인스타그램", "instagram", "insta", "팔로워", "팔로우", "릴스", "피드"],
  유튜브: ["youtube", "유투브", "유툽", "구독자", "조회수", "쇼츠"],
  당근: ["당근마켓", "당근 마켓", "비즈프로필", "비즈 프로필", "동네", "동네생활", "단골", "daangn"],
  보도자료: ["기사", "뉴스", "언론", "언론보도", "언론홍보", "신문", "보도", "pr"],
  ai: ["챗gpt", "chatgpt", "gpt", "지피티", "챗지피티", "인공지능", "aeo", "ai검색", "생성형", "ai 브리핑", "검색엔진최적화"],
  후기: ["리뷰", "영수증리뷰", "영수증 리뷰", "별점", "평점", "포토리뷰", "포토후기", "구매평"],
  seo: ["검색최적화", "정보세팅", "플레이스세팅", "세팅", "메타데이터"],
  광고: ["마케팅", "홍보", "바이럴마케팅"],
  보장: ["보장형", "노출보장", "환불보장"],
};

/** Popular searches shown under the box. */
export const SUGGESTED_QUERIES = ["네이버 지도", "블로그 배포", "맘카페", "스마트스토어", "당근", "인스타 팔로워", "보도자료", "AI 검색"];

/**
 * Words the search understands but never displays (placeholder, popular
 * searches, typeahead) — the store names that platform only as "C사".
 */
const HIDDEN_WORDS = ["쿠팡"];
const isHidden = (w: string) => HIDDEN_WORDS.some((h) => w.includes(h));

// --- Normalization -------------------------------------------------------------

export const normalize = (s: string) => s.toLowerCase().replace(/[\s·\-_/(),.~!?'"]+/g, "");

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const JONG = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"];

/** 초성 string: "플레이스" → "ㅍㄹㅇㅅ". Non-Hangul characters pass through. */
export function choseong(s: string): string {
  return [...s]
    .map((ch) => {
      const c = ch.charCodeAt(0) - 0xac00;
      return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch;
    })
    .join("");
}

/** Jamo string for typo distance: "플" → "ㅍㅡㄹ". */
function jamo(s: string): string {
  return [...s]
    .map((ch) => {
      const c = ch.charCodeAt(0) - 0xac00;
      if (c < 0 || c >= 11172) return ch;
      return CHO[Math.floor(c / 588)] + JUNG[Math.floor((c % 588) / 28)] + JONG[c % 28];
    })
    .join("");
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

const isChoseongOnly = (s: string) => /^[ㄱ-ㅎ]+$/.test(s);

// alias (normalized) → canonical terms it stands for
const ALIAS = new Map<string, Set<string>>();
for (const [canon, aliases] of Object.entries(SYNONYMS)) {
  for (const a of [canon, ...aliases]) {
    const k = normalize(a);
    if (!ALIAS.has(k)) ALIAS.set(k, new Set());
    ALIAS.get(k)!.add(normalize(canon));
  }
}
const VOCAB = [...ALIAS.keys()];

/**
 * Search terms for one query word: itself, the canonical terms of any alias it
 * equals or contains (네이버지도맛집 → 플레이스), and — when nothing else
 * matches — the closest dictionary word within a small typo distance.
 */
export function expandToken(token: string, haystackHas: (t: string) => boolean): { terms: string[]; corrected?: string } {
  const t = normalize(token);
  const terms = new Set<string>([t]);
  // Aliases the word equals or contains; drop ones inside a longer match, so
  // 카카오지도 means 카카오맵 only (not also 지도 → 플레이스).
  const matched = [...ALIAS.keys()].filter((alias) => alias.length >= 2 && t.includes(alias));
  for (const alias of matched) {
    if (matched.some((other) => other !== alias && other.includes(alias))) continue;
    ALIAS.get(alias)!.forEach((c) => terms.add(c));
  }
  if ([...terms].some(haystackHas) || isChoseongOnly(t) || t.length < 2) return { terms: [...terms] };
  // Typo: nearest dictionary word by jamo distance (1 per ~5 jamo, at least 1).
  const tj = jamo(t);
  let best: { word: string; d: number } | null = null;
  for (const w of VOCAB) {
    const d = levenshtein(tj, jamo(w));
    if (d <= Math.max(1, Math.floor(tj.length / 5)) && (!best || d < best.d)) best = { word: w, d };
  }
  if (!best) return { terms: [...terms] };
  const canons = ALIAS.get(best.word)!;
  return { terms: [...terms, best.word, ...canons], corrected: best.word };
}

// --- Ranking -------------------------------------------------------------------

export interface Searchable {
  title: string;
  /** Other text: summary, option names, notes, channel. Lower weight. */
  fields: string[];
}

export interface SearchHit<T> {
  item: T;
  score: number;
}

/**
 * Rank items for a query. Every word must match somewhere (via its
 * expansions); title matches score highest, exact words above synonyms.
 */
export function rankSearch<T>(items: T[], query: string, toSearchable: (t: T) => Searchable): { hits: SearchHit<T>[]; corrections: string[] } {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { hits: items.map((item) => ({ item, score: 0 })), corrections: [] };

  const docs = items.map((item) => {
    const s = toSearchable(item);
    const title = normalize(s.title);
    const body = normalize(s.fields.join(" "));
    return { item, title, body, titleCho: choseong(title), bodyCho: choseong(body) };
  });
  const anyHas = (t: string) => docs.some((d) => d.title.includes(t) || d.body.includes(t));

  // The whole query without spaces is also tried, so "네이버 지도" works as one alias.
  const joined = words.length > 1 ? expandToken(words.join(""), anyHas) : null;
  const perWord = words.map((w) => expandToken(w, anyHas));
  const corrections = perWord.map((x) => x.corrected).filter((c): c is string => !!c);

  const scoreWord = (d: (typeof docs)[number], terms: string[], raw: string): number => {
    let best = 0;
    for (const term of terms) {
      const exact = term === raw;
      if (isChoseongOnly(term)) {
        if (d.titleCho.startsWith(term)) best = Math.max(best, 8);
        else if (d.titleCho.includes(term)) best = Math.max(best, 6);
        else if (d.bodyCho.includes(term)) best = Math.max(best, 2);
        continue;
      }
      if (d.title.includes(term)) best = Math.max(best, exact ? 10 : 7);
      else if (d.body.includes(term)) best = Math.max(best, exact ? 4 : 3);
    }
    return best;
  };

  const hits: SearchHit<T>[] = [];
  for (const d of docs) {
    let total = 0;
    let ok = true;
    for (let i = 0; i < words.length; i++) {
      const sc = scoreWord(d, perWord[i].terms, normalize(words[i]));
      if (sc === 0) {
        ok = false;
        break;
      }
      total += sc;
    }
    if (!ok && joined) {
      const sc = scoreWord(d, joined.terms, normalize(words.join("")));
      if (sc > 0) {
        ok = true;
        total = sc * words.length;
      }
    }
    if (ok) hits.push({ item: d.item, score: total });
  }
  hits.sort((a, b) => b.score - a.score);
  return { hits, corrections };
}

/** Suggestions while typing: matching titles first, then dictionary words. */
export function suggest(titles: string[], query: string, limit = 6): string[] {
  const q = normalize(query);
  if (!q) return [];
  const qc = isChoseongOnly(q);
  const fromTitles = titles.filter((t) => {
    const n = normalize(t);
    return qc ? choseong(n).includes(q) : n.includes(q);
  });
  const fromWords = Object.entries(SYNONYMS)
    .flatMap(([canon, aliases]) => [canon, ...aliases])
    .filter((w) => !isHidden(w))
    .filter((w) => {
      const n = normalize(w);
      return n !== q && (qc ? choseong(n).startsWith(q) : n.startsWith(q));
    });
  // One entry per spelling (네이버지도 / 네이버 지도 are the same search).
  const seen = new Set<string>();
  return [...fromTitles, ...fromWords]
    .filter((w) => {
      const k = normalize(w);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, limit);
}
