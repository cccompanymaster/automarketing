// Where a visitor came from (ads, search, social, AI answers), kept in this
// browser for 90 days and attached to signups and webhook inquiries, so we can
// see which channel actually brings members and orders — not just visits.
// Same rules as the other NOAH sites (attrib.js). Stored: campaign labels, the
// Naver search-ad keyword, whether a click id was present (never its value),
// the referrer host and the landing path. Nothing that identifies a person.

export interface Touch {
  /** source, e.g. naver · google · meta · ChatGPT · (direct) */
  s: string;
  /** medium, e.g. cpc · organic · social · referral · ai · (none) */
  m: string;
  /** campaign */
  c?: string;
  /** keyword / content */
  k?: string;
  /** landing path */
  lp: string;
  /** epoch ms */
  t: number;
}
export interface SourceRecord {
  first: Touch;
  last?: Touch;
}

const KEY = "selfmarketing.source";
const TTL = 90 * 864e5;

const AI: Array<[RegExp, string]> = [
  [/(^|\.)(chatgpt\.com|openai\.com)$/, "ChatGPT"], [/(^|\.)perplexity\.ai$/, "Perplexity"], [/(^|\.)claude\.ai$/, "Claude"],
  [/^(gemini|bard)\.google\.com$/, "Gemini"], [/(^|\.)copilot\.microsoft\.com$|(^|\.)copilot\.cloud\.microsoft$/, "Copilot"],
  [/(^|\.)wrtn\.ai$/, "뤼튼"], [/^clova-x\.naver\.com$/, "CLOVA X"], [/(^|\.)liner\.com$/, "Liner"], [/(^|\.)you\.com$/, "You.com"],
  [/(^|\.)phind\.com$/, "Phind"], [/(^|\.)deepseek\.com$/, "DeepSeek"], [/(^|\.)grok\.com$/, "Grok"],
];
const SEARCH = /(^|\.)(google\.[a-z.]+|naver\.com|daum\.net|bing\.com|search\.yahoo\.com|zum\.com|duckduckgo\.com|ecosia\.org)$/;
const SOCIAL = /(^|\.)(instagram\.com|facebook\.com|threads\.net|t\.co|x\.com|youtube\.com|blog\.naver\.com|cafe\.naver\.com|kakao\.com|band\.us|tiktok\.com|daangn\.com)$/;

export function aiSourceOf(host: string): string {
  const clean = host.toLowerCase().replace(/^www\./, "");
  return AI.find(([re]) => re.test(clean))?.[1] ?? "";
}

/** This visit's source, or null for a direct visit / an internal page change. */
export function touchFromVisit(href: string, referrer: string, now = Date.now()): Touch | null {
  const url = new URL(href);
  const q = url.searchParams;
  const val = (k: string) => (q.get(k) ?? "").trim().slice(0, 80);
  let ref = "";
  try {
    const host = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "";
    if (host && host !== url.hostname.replace(/^www\./, "")) ref = host;
  } catch {
    ref = "";
  }
  let t: Omit<Touch, "lp" | "t"> | null = null;
  if (val("utm_source")) {
    t = { s: val("utm_source"), m: val("utm_medium") || "(none)", c: val("utm_campaign"), k: val("utm_term") || val("utm_content") };
  } else if (q.has("n_media") || q.has("n_query") || q.has("n_keyword")) {
    t = { s: "naver", m: "cpc", k: val("n_keyword") || val("n_query") };
  } else if (q.has("gclid") || q.has("gbraid") || q.has("wbraid")) {
    t = { s: "google", m: "cpc" };
  } else if (q.has("fbclid")) {
    t = { s: "meta", m: ref && /facebook|instagram/.test(ref) ? "social" : "paid" };
  } else if (ref) {
    t = { s: ref, m: SEARCH.test(ref) ? "organic" : SOCIAL.test(ref) ? "social" : "referral" };
  }
  if (!t) return null;
  // ChatGPT tags its links utm_source=chatgpt.com; other AIs leave only a referrer.
  const ai = aiSourceOf(t.s) || (t.s === ref ? aiSourceOf(ref) : "");
  if (ai) t = { ...t, s: ai, m: "ai" };
  const clean = Object.fromEntries(Object.entries(t).filter(([, v]) => v)) as Omit<Touch, "lp" | "t">;
  return { ...clean, lp: url.pathname.slice(0, 60), t: now };
}

/** Merge a visit into the stored record: first touch is kept, last touch updated. */
export function remember(prev: SourceRecord | null, visit: Touch | null, path: string, now = Date.now()): SourceRecord {
  const alive = prev && now - prev.first.t <= TTL ? prev : null;
  if (visit) return { first: alive?.first ?? visit, last: visit };
  return alive ?? { first: { s: "(direct)", m: "(none)", lp: path.slice(0, 60), t: now } };
}

const day = (t: number) => {
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
const fmt = (x: Touch) =>
  `${x.s === "(direct)" ? "직접 방문" : `${x.s} / ${x.m}`}${x.c ? ` · ${x.c}` : ""}${x.k ? ` 「${x.k}」` : ""} → ${x.lp} (${day(x.t)})`;

/** One line for the admin: first touch, last touch if different, the page the form was sent from. */
export function sourceText(rec: SourceRecord | null, path: string): string {
  if (!rec) return "";
  const last = rec.last && rec.last.t !== rec.first.t ? ` | 최근: ${fmt(rec.last)}` : "";
  return `처음: ${fmt(rec.first)}${last} | 신청: ${path}`.slice(0, 480);
}

// Browser helpers (storage may be blocked: then nothing is kept).
export function readSource(): SourceRecord | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

/** Run once per page load. Returns this visit's AI source name, if any. */
export function captureVisit(): string {
  if (typeof window === "undefined") return "";
  const visit = touchFromVisit(window.location.href, document.referrer);
  const rec = remember(readSource(), visit, window.location.pathname);
  try {
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {
    // Private mode: forms just go without a source.
  }
  return visit?.m === "ai" ? visit.s : "";
}

export function currentSourceText(): string {
  if (typeof window === "undefined") return "";
  return sourceText(readSource(), window.location.pathname);
}
