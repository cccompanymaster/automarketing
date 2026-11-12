// Ad pixels (네이버 프리미엄 로그분석·Meta·카카오·당근) loaded from code, no GTM.
// Ids come from lib/trackingIds: an empty id loads nothing. lib/analytics
// `track()` calls `sendConversion()` so one funnel event reaches every pixel
// that is on, under that pixel's own event name (the table below).
// Never pass names, contacts or free-text input here.

import { KAKAO_PIXEL_ID, KARROT_PIXEL_ID, META_PIXEL_ID, NAVER_ANALYTICS_ID } from "@/lib/trackingIds";

type Params = Record<string, unknown>;
type Pixel = Record<string, (arg?: unknown) => void>;
type PixelWindow = Window & {
  wcs?: { inflow: (domain?: string) => void; trans: (conv: Record<string, string>) => void };
  wcs_add?: Record<string, string>;
  wcs_do?: () => void;
  fbq?: ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; push?: unknown; loaded?: boolean; version?: string };
  _fbq?: unknown;
  kakaoPixel?: (id: string) => Pixel;
  karrotPixel?: { init: (id: string) => void; track: (name: string, arg?: unknown) => void };
};

/** Shared funnel event → each pixel's event name. Unlisted events stay in GA4 only. */
export const PIXEL_EVENTS: Record<string, { naver?: string; meta?: string; kakao?: string; karrot?: string }> = {
  generate_lead: { naver: "lead", meta: "Lead", kakao: "participation", karrot: "Lead" },
  signup_complete: { naver: "sign_up", meta: "CompleteRegistration", kakao: "completeRegistration", karrot: "CompleteRegistration" },
  begin_checkout: { meta: "InitiateCheckout" },
  purchase: { naver: "purchase", meta: "Purchase", kakao: "purchase", karrot: "Purchase" },
};

const ids = { naver: NAVER_ANALYTICS_ID, meta: META_PIXEL_ID, kakao: KAKAO_PIXEL_ID, karrot: KARROT_PIXEL_ID };
export const hasAdProvider = Object.values(ids).some(Boolean);
export function hasAdConsent() {
  try { return typeof window !== "undefined" && localStorage.getItem("cc_ad_measure_v1") === "yes"; } catch { return false; }
}
const queues = { naver: [] as Array<() => void>, kakao: [] as Array<() => void>, karrot: [] as Array<() => void> };
const ready = { naver: false, kakao: false, karrot: false };
let started = false;

const win = () => window as PixelWindow;
function safely(run: () => void) {
  try {
    run();
  } catch {
    // A pixel failing must never break the page.
  }
}
function load(src: string, onload: () => void) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  script.onload = onload;
  document.head.appendChild(script);
}
function whenReady(key: keyof typeof queues, run: () => void) {
  if (ready[key]) safely(run);
  else queues[key].push(run);
}
function flush(key: keyof typeof queues) {
  ready[key] = true;
  while (queues[key].length) safely(queues[key].shift()!);
}

/** Load the pixels that have an id and record the first page view. Safe to call more than once. */
export function startAdPixels() {
  if (started || !hasAdConsent()) return;
  started = true;
  const w = win();
  if (ids.naver) {
    load("https://wcs.naver.net/wcslog.js", () => {
      if (!w.wcs) return;
      w.wcs_add = w.wcs_add || {};
      w.wcs_add.wa = ids.naver;
      w.wcs.inflow(window.location.hostname.replace(/^www\./, ""));
      w.wcs_do?.();
      flush("naver");
    });
  }
  if (ids.meta) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    }) as NonNullable<PixelWindow["fbq"]>;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    w.fbq = fbq;
    if (!w._fbq) w._fbq = fbq;
    fbq("init", ids.meta);
    fbq("track", "PageView");
    load("https://connect.facebook.net/en_US/fbevents.js", () => {});
  }
  if (ids.kakao) {
    load("https://t1.daumcdn.net/kas/static/kp.js", () => {
      if (!w.kakaoPixel) return;
      w.kakaoPixel(ids.kakao).pageView();
      flush("kakao");
    });
  }
  if (ids.karrot) {
    load("https://karrot-pixel.business.daangn.com/0.2/karrot-pixel.umd.js", () => {
      if (!w.karrotPixel) return;
      w.karrotPixel.init(ids.karrot);
      w.karrotPixel.track("ViewPage");
      flush("karrot");
    });
  }
}

/** Client-side navigation: each pixel counts a new page view. */
export function sendPageView() {
  if (!hasAdConsent()) return;
  const w = win();
  if (ids.naver) whenReady("naver", () => w.wcs_do?.());
  if (ids.meta) safely(() => w.fbq?.("track", "PageView"));
  if (ids.kakao) whenReady("kakao", () => w.kakaoPixel!(ids.kakao).pageView());
  if (ids.karrot) whenReady("karrot", () => w.karrotPixel!.track("ViewPage"));
}

/** Forward one funnel event to every pixel that is on. */
export function sendConversion(event: string, params: Params = {}) {
  const map = PIXEL_EVENTS[event];
  if (!map || !hasAdConsent()) return;
  const w = win();
  const value = Number(params.value) || 0;
  if (ids.naver && map.naver) {
    const conv: Record<string, string> = { type: map.naver };
    if (value) conv.value = String(value);
    whenReady("naver", () => w.wcs!.trans(conv));
  }
  if (ids.meta && map.meta) safely(() => w.fbq?.("track", map.meta, value ? { value, currency: "KRW" } : {}));
  if (ids.kakao && map.kakao) {
    whenReady("kakao", () => {
      const pixel = w.kakaoPixel!(ids.kakao);
      if (map.kakao === "purchase") pixel.purchase({ total_price: String(value), currency: "KRW" });
      else pixel[map.kakao!]();
    });
  }
  if (ids.karrot && map.karrot) {
    whenReady("karrot", () => w.karrotPixel!.track(map.karrot!, map.karrot === "Purchase" ? { total_price: String(value) } : undefined));
  }
}
