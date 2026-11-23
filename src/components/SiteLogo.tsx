// 마케팅방주 logo: ark + sprout symbol with the wordmark drawn as outlines
// (public/brand/*.svg), so it renders the same without the web font.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Horizontal logo (symbol + wordmark). `white` is for dark backgrounds. */
export function SiteLogo({ white = false, className = "h-8 w-auto" }: { white?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export, local SVG
    <img src={`${BASE}/brand/${white ? "logo-white" : "logo"}.svg`} alt="마케팅방주" width={246} height={64} className={className} />
  );
}

/** Symbol only (decorative next to other text, e.g. the mobile menu button). */
export function SiteSymbol({ className = "h-6 w-6" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export, local SVG
    <img src={`${BASE}/brand/symbol.svg`} alt="" aria-hidden="true" width={64} height={64} className={className} />
  );
}
