// Tracking container / property ids. Public values (they ship in page HTML), so
// the live ids are the defaults and env vars only override them. Tags load in
// production builds only, so local dev never pollutes the real reports.
//
// A tool with an empty id is simply off: its script isn't loaded, its domains
// aren't needed, and the privacy policy doesn't list it (see trackersInUse()).

const isProd = process.env.NODE_ENV === "production";
const prodOnly = (v: string | undefined) => (isProd ? (v ?? "").trim() : "");

/** Google Tag Manager container (Meta Pixel and other tags live here). */
export const GTM_ID = prodOnly(process.env.NEXT_PUBLIC_GTM_ID || "GTM-NF44W8RR");

/**
 * GA4 property, loaded directly with gtag.js. Don't also add a GA4 tag inside
 * GTM — page views would be counted twice.
 */
export const GA4_ID = prodOnly(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "G-DFPTX589SZ");

/** Microsoft Clarity project id (heatmaps + session replay). clarity.microsoft.com */
export const CLARITY_ID = prodOnly(process.env.NEXT_PUBLIC_CLARITY_ID || "");

/** 네이버 애널리틱스 site id (wcs_add["wa"]). analytics.naver.com */
export const NAVER_ANALYTICS_ID = prodOnly(process.env.NEXT_PUBLIC_NAVER_ANALYTICS_ID || "");

/** Search-console ownership meta tags (content values only; harmless in any build). */
export const SITE_VERIFICATION = {
  naver: "5422308667fd7f1bd83c5e52ef1fe02f0186ef34",
  google: (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "").trim(),
  bing: (process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "").trim(),
};

export interface Tracker {
  name: string;
  company: string;
  /** What it records, in one phrase. */
  collects: string;
}

/** Visitor-tracking tools switched on in this build — the privacy policy lists exactly these. */
export function trackersInUse(): Tracker[] {
  return [
    ...(GA4_ID || GTM_ID
      ? [{ name: "Google 애널리틱스·Google 태그 관리자", company: "Google LLC", collects: "방문 페이지, 유입 경로, 기기·브라우저 정보, 클릭·가입 진행 등 이용 행태와 페이지 로딩 속도" }]
      : []),
    ...(CLARITY_ID
      ? [{ name: "Microsoft Clarity", company: "Microsoft Corporation", collects: "화면 이동·클릭·스크롤 기록(입력한 내용은 가려서 수집하지 않음)" }]
      : []),
    ...(NAVER_ANALYTICS_ID ? [{ name: "네이버 애널리틱스", company: "네이버 주식회사", collects: "방문 페이지, 네이버 검색 유입 키워드, 기기 정보" }] : []),
  ];
}
