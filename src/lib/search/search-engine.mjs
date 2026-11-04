const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const INITIALS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ',
  'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const COMPATIBILITY_JAMO = {
  '\u1100': 'ㄱ', '\u1101': 'ㄲ', '\u1102': 'ㄴ', '\u1103': 'ㄷ', '\u1104': 'ㄸ',
  '\u1105': 'ㄹ', '\u1106': 'ㅁ', '\u1107': 'ㅂ', '\u1108': 'ㅃ', '\u1109': 'ㅅ',
  '\u110a': 'ㅆ', '\u110b': 'ㅇ', '\u110c': 'ㅈ', '\u110d': 'ㅉ', '\u110e': 'ㅊ',
  '\u110f': 'ㅋ', '\u1110': 'ㅌ', '\u1111': 'ㅍ', '\u1112': 'ㅎ',
};

// Product data can override or extend these through `aliases`, `tags`, and `keywords`.
const SYNONYM_GROUPS = [
  ['인플', '인플루언서', '공식 인플루언서', '네이버 인플루언서'],
  ['쇼핑', '쇼핑몰', '커머스', '상품 판매', '상품 순위'],
  ['상위노출', '상위 노출', '검색 노출', '검색 상위', '순위 상승'],
  ['블로그', '블로그 글', '블로그 원고'],
  ['후기', '리뷰', '영수증 리뷰'],
  ['인스타', '인스타그램', 'SNS'],
  ['당근', '당근마켓', '비즈프로필'],
  ['보도', '언론', '기사', '언론보도'],
  ['AI', '에이아이', '챗GPT', '챗지피티'],
];

const SEARCH_FIELDS = [
  ['title', 1.35],
  ['name', 1.35],
  ['aliases', 0.75],
  ['keywords', 0.72],
  ['tags', 0.48],
  ['category', 0.50],
  ['summary', 0.55],
  ['searchText', 0.45],
  ['description', 0.35],
];

function asText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(' ');
  return value == null ? '' : String(value);
}

/**
 * Normalizes Korean/English queries while retaining a tokenized and compact form.
 * Compact form makes "상위노출", "상위 노출", and "상위-노출" equivalent.
 */
export function normalizeSearchText(value) {
  const valueText = asText(value)
    .normalize('NFKC')
    .toLocaleLowerCase('ko-KR')
    .replace(/[\u1100-\u1112]/g, (character) => COMPATIBILITY_JAMO[character] ?? character)
    .replace(/[\u200b\u200c\u200d\ufeff]/g, ' ');
  const spaced = valueText
    .replace(/[^\p{L}\p{N}\u3131-\u314e]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  return {
    spaced,
    compact: spaced.replace(/\s/g, ''),
    tokens: spaced ? spaced.split(' ') : [],
    initials: getHangulInitials(spaced.replace(/\s/g, '')),
  };
}

export function getHangulInitials(value) {
  return Array.from(asText(value)).map((character) => {
    const codePoint = character.codePointAt(0);
    if (codePoint >= HANGUL_START && codePoint <= HANGUL_END) {
      return INITIALS[Math.floor((codePoint - HANGUL_START) / 588)];
    }
    return character;
  }).join('');
}

function isInitialQuery(query) {
  return /^[ㄱ-ㅎ]+$/.test(query);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function synonymVariants(token) {
  const normalizedToken = normalizeSearchText(token).compact;
  const variants = [normalizedToken];

  for (const group of SYNONYM_GROUPS) {
    const normalizedGroup = group.map((value) => normalizeSearchText(value).compact);
    if (normalizedGroup.includes(normalizedToken)) variants.push(...normalizedGroup);
  }

  return unique(variants);
}

function fieldValues(item) {
  return SEARCH_FIELDS.flatMap(([field, weight]) => {
    const value = asText(item[field]);
    if (!value) return [];
    return [{ field, weight, text: normalizeSearchText(value) }];
  });
}

function levenshtein(left, right) {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      const insertion = current[column - 1] + 1;
      const deletion = previous[column] + 1;
      const substitution = previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1);
      current[column] = Math.min(insertion, deletion, substitution);
    }
    previous = current;
  }
  return previous[right.length];
}

function fuzzyMatch(queryToken, fieldText) {
  // Fuzzy matching is intentionally conservative so unrelated products do not flood results.
  if (queryToken.length < 3) return false;
  const threshold = queryToken.length >= 7 ? 2 : 1;
  return fieldText.tokens.some((candidate) => {
    if (Math.abs(candidate.length - queryToken.length) > threshold) return false;
    return levenshtein(queryToken, candidate) <= threshold;
  });
}

function scoreItem(item, query) {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = normalizedQuery.tokens.flatMap((token) => synonymVariants(token));
  const originalTokens = normalizedQuery.tokens;
  const fields = fieldValues(item);
  let score = 0;
  const matchedBy = new Set();
  const coveredTokens = new Set();

  if (isInitialQuery(normalizedQuery.compact)) {
    const title = fields.find((field) => field.field === 'title' || field.field === 'name');
    if (title?.text.initials.includes(normalizedQuery.compact)) {
      score += 620;
      // A title word that starts with the initials (ㅍㄹㅇㅅ → 플레이스) beats a
      // match that only spans inside another word (공식 인플루언서 → ㅇㅍㄹㅇㅅ).
      if (title.text.tokens.some((token) => getHangulInitials(token).startsWith(normalizedQuery.compact))) score += 80;
      matchedBy.add('초성');
    }
  }

  for (const field of fields) {
    const isTitle = field.field === 'title' || field.field === 'name';
    const isAlias = field.field === 'aliases' || field.field === 'keywords';
    const fieldScore = field.weight;
    let contribution = 0;
    let directMatch = false;

    if (normalizedQuery.compact && field.text.compact === normalizedQuery.compact) {
      contribution = 2000 * fieldScore;
      directMatch = true;
      matchedBy.add(field.field);
    } else if (normalizedQuery.compact && field.text.compact.startsWith(normalizedQuery.compact)) {
      contribution = 1400 * fieldScore;
      directMatch = true;
      matchedBy.add(field.field);
    } else if (normalizedQuery.compact && field.text.compact.includes(normalizedQuery.compact)) {
      contribution = 1050 * fieldScore;
      directMatch = true;
      matchedBy.add(field.field);
    }

    let matchedTokenCount = 0;
    for (const originalToken of originalTokens) {
      const variants = synonymVariants(originalToken);
      const tokenMatched = variants.some((variant) =>
        field.text.compact.includes(variant) ||
        field.text.tokens.some((fieldToken) => fieldToken.startsWith(variant)),
      );

      if (tokenMatched) {
        matchedTokenCount += 1;
        coveredTokens.add(originalToken);
        matchedBy.add(field.field);
      } else if (fuzzyMatch(originalToken, field.text)) {
        contribution = Math.max(contribution, 185 * fieldScore);
        coveredTokens.add(originalToken);
        matchedBy.add(`${field.field}:유사`);
      }
    }

    // A title/phrase hit dominates repeated matches in tags and aliases.
    // Token hits help multi-word searches, but do not stack indefinitely per field.
    if (!directMatch && matchedTokenCount > 0) {
      contribution = Math.max(contribution, Math.min(900, matchedTokenCount * 420) * fieldScore);
    }
    score += contribution;
  }

  const uniqueCoveredTokens = Math.min(originalTokens.length, coveredTokens.size);
  if (originalTokens.length > 0 && uniqueCoveredTokens === originalTokens.length) score += 260;
  if (originalTokens.length > 1 && uniqueCoveredTokens > 0) {
    score += 120 * (uniqueCoveredTokens / originalTokens.length);
  }

  return {
    score: Math.round(score),
    matchedBy: [...matchedBy],
  };
}

/**
 * Searches a product list and returns ranked result objects.
 *
 * Each product can use title/name, summary, category, description, aliases,
 * keywords, tags, and searchText. The original item is returned untouched.
 */
export function searchProducts(products, query, options = {}) {
  const items = Array.isArray(products) ? products : [];
  const normalizedQuery = normalizeSearchText(query);
  const limit = Number.isFinite(options.limit) ? options.limit : Infinity;

  if (!normalizedQuery.compact) {
    return items.slice(0, limit).map((item, index) => ({ item, score: 0, matchedBy: [], index }));
  }

  return items
    .map((item, index) => ({ item, index, ...scoreItem(item, query) }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit);
}

/**
 * Returns short query suggestions from product titles and aliases.
 */
export function suggestSearchTerms(products, query, limit = 6) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery.compact) return [];

  const candidates = (Array.isArray(products) ? products : []).flatMap((item) => [
    item.title,
    item.name,
    ...(Array.isArray(item.aliases) ? item.aliases : []),
    ...(Array.isArray(item.keywords) ? item.keywords : []),
  ]);

  return unique(candidates)
    .filter((candidate) => normalizeSearchText(candidate).compact.includes(normalizedQuery.compact))
    .sort((left, right) => normalizeSearchText(left).compact.length - normalizeSearchText(right).compact.length)
    .slice(0, limit);
}
