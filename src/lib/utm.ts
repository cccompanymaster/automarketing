// UTM links: one naming rule for every link we hand out (블로그, 카톡, 당근,
// 문자…) so GA4 → 획득 → 트래픽 획득 groups them cleanly. Values are
// lowercase, spaces become "_", and each channel has a fixed source/medium.

export interface UtmChannel {
  key: string;
  label: string;
  source: string;
  medium: string;
}

/** Fixed source/medium per channel — never type these by hand. */
export const UTM_CHANNELS: UtmChannel[] = [
  { key: "naver_blog", label: "네이버 블로그 글", source: "naver_blog", medium: "referral" },
  { key: "naver_place", label: "네이버 플레이스 소식", source: "naver_place", medium: "referral" },
  { key: "kakao_channel", label: "카카오톡 채널 메시지", source: "kakao_channel", medium: "message" },
  { key: "kakao_chat", label: "카카오톡 1:1 상담 답변", source: "kakao_chat", medium: "message" },
  { key: "daangn", label: "당근 비즈프로필·소식", source: "daangn", medium: "social" },
  { key: "instagram", label: "인스타그램 프로필·게시물", source: "instagram", medium: "social" },
  { key: "cafe", label: "카페 게시글", source: "cafe", medium: "referral" },
  { key: "press", label: "보도자료 기사", source: "press", medium: "referral" },
  { key: "sms", label: "문자", source: "sms", medium: "message" },
  { key: "email", label: "이메일", source: "email", medium: "email" },
  { key: "naver_ads", label: "네이버 검색광고", source: "naver", medium: "cpc" },
  { key: "google_ads", label: "구글 광고", source: "google", medium: "cpc" },
  { key: "meta_ads", label: "인스타·페이스북 광고", source: "meta", medium: "paid_social" },
  { key: "kakao_ads", label: "카카오 광고", source: "kakao", medium: "display" },
];

/** lowercase, trimmed, spaces → "_", only letters/numbers/Korean/_/- kept. */
export function utmValue(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^0-9a-z가-힣_\-.]/g, "")
    .slice(0, 80);
}

export function buildUtmUrl(base: string, channelKey: string, campaign: string, content = ""): string | null {
  const ch = UTM_CHANNELS.find((c) => c.key === channelKey);
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return null;
  }
  if (!ch || !utmValue(campaign)) return null;
  url.searchParams.set("utm_source", ch.source);
  url.searchParams.set("utm_medium", ch.medium);
  url.searchParams.set("utm_campaign", utmValue(campaign));
  if (utmValue(content)) url.searchParams.set("utm_content", utmValue(content));
  return url.toString();
}
