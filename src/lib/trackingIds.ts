// Tracking container / property ids. Public values (they ship in page HTML), so
// the live ids are the defaults and env vars only override them. Tags load in
// production builds only, so local dev never pollutes the real reports.
//
// A tool with an empty id is simply off: its script isn't loaded, its domains
// aren't needed, and the privacy policy doesn't list it (see trackersInUse()).

const isProd = process.env.NODE_ENV === "production";
const prodOnly = (v: string | undefined) => (isProd ? (v ?? "").trim() : "");

/** GA4 uses the direct Google tag; no Tag Manager container is loaded. */
export const GA4_ID = prodOnly(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "G-6SKM7F1QRJ");

/** Microsoft Clarity project id (heatmaps + session replay). clarity.microsoft.com */
export const CLARITY_ID = prodOnly(process.env.NEXT_PUBLIC_CLARITY_ID || "");

/**
 * 네이버 공통키 (wcs_add["wa"]): 검색광고 프리미엄 로그분석 AccountId (광고를 하면 이쪽)
 * 또는 네이버 애널리틱스 사이트 ID — the two share the key, so use one.
 * Conversions (wcs.trans) are sent for the events mapped in lib/analytics.
 */
export const NAVER_ANALYTICS_ID = prodOnly(process.env.NEXT_PUBLIC_NAVER_ANALYTICS_ID || "");

/** Meta(Facebook·Instagram) Pixel id. Events Manager → Data sources. */
export const META_PIXEL_ID = prodOnly(process.env.NEXT_PUBLIC_META_PIXEL_ID || "");

/** 카카오 픽셀 & SDK Track ID. business.kakao.com → 픽셀 & SDK. */
export const KAKAO_PIXEL_ID = prodOnly(process.env.NEXT_PUBLIC_KAKAO_PIXEL_ID || "");

/** 당근 전환 추적 코드 ID. 당근 비즈니스 전문가모드 → 전환 추적 관리. */
export const KARROT_PIXEL_ID = prodOnly(process.env.NEXT_PUBLIC_KARROT_PIXEL_ID || "");

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
  /** Used for ad conversion measurement and personalised (behavioural) ads. */
  ad?: boolean;
}

/** Visitor-tracking tools switched on in this build — the privacy policy lists exactly these. */
export function trackersInUse(): Tracker[] {
  return [
    ...(GA4_ID
      ? [{ name: "Google 애널리틱스", company: "Google LLC", collects: "방문 페이지, 유입 경로, 기기·브라우저 정보, 클릭·가입 진행 등 이용 행태와 페이지 로딩 속도" }]
      : []),
    // Injected by Cloudflare at the edge (Web Analytics is on for the zone); cookie-free.
    ...(isProd ? [{ name: "Cloudflare Web Analytics", company: "Cloudflare, Inc.", collects: "쿠키 없이 방문 수·페이지 속도 집계" }] : []),
    ...(CLARITY_ID
      ? [{ name: "Microsoft Clarity", company: "Microsoft Corporation", collects: "화면 이동·클릭·스크롤 기록(입력한 내용은 가려서 수집하지 않음)" }]
      : []),
    ...(NAVER_ANALYTICS_ID ? [{ name: "네이버 검색광고 프리미엄 로그분석·네이버 애널리틱스", company: "네이버 주식회사", collects: "방문 페이지, 네이버 검색·광고 유입 키워드, 기기 정보, 가입·주문 전환", ad: true }] : []),
    ...(META_PIXEL_ID ? [{ name: "Meta 픽셀", company: "Meta Platforms, Inc.", collects: "방문 페이지, 기기·브라우저 정보, 가입·주문 전환(페이스북·인스타그램 광고 성과 측정과 맞춤형 광고)", ad: true }] : []),
    ...(KAKAO_PIXEL_ID ? [{ name: "카카오 픽셀", company: "주식회사 카카오", collects: "방문 페이지, 기기 정보, 가입·주문 전환(카카오 광고 성과 측정과 맞춤형 광고)", ad: true }] : []),
    ...(KARROT_PIXEL_ID ? [{ name: "당근 픽셀", company: "당근마켓 주식회사", collects: "방문 페이지, 가입·주문 전환(당근 광고 성과 측정과 맞춤형 광고)", ad: true }] : []),
  ];
}
