// Real channel/brand logos used on the service cards and detail pages.
// Each mark is an inline SVG so the static export needs no extra image assets.
// Marks are drawn as the owners' recognizable colored tiles; the trademarks
// belong to their respective owners and are shown only to indicate which
// channel each marketing service targets.

export type BrandKey = "naver" | "instagram" | "youtube" | "kakao";

const LABEL: Record<BrandKey, string> = {
  naver: "네이버",
  instagram: "인스타그램",
  youtube: "유튜브",
  kakao: "카카오",
};

export function BrandLogo({
  brand,
  className = "",
}: {
  brand: BrandKey;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    className,
    role: "img" as const,
    "aria-label": LABEL[brand],
  };

  switch (brand) {
    case "naver":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#03C75A" />
          <path
            d="M7 6.5h3.2l3.6 5.3V6.5H17v11h-3.2l-3.6-5.3v5.3H7z"
            fill="#fff"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#FF0000" />
          <path d="M9.8 8.2l6.4 3.8-6.4 3.8z" fill="#fff" />
        </svg>
      );
    case "kakao":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#FFE812" />
          <path
            d="M12 6.1c-3.48 0-6.3 2.18-6.3 4.86 0 1.74 1.18 3.27 2.96 4.13-.13.46-.47 1.66-.54 1.92-.09.32.12.31.25.23.1-.07 1.64-1.12 2.31-1.58.43.06.87.1 1.32.1 3.48 0 6.3-2.18 6.3-4.8S15.48 6.1 12 6.1z"
            fill="#3C1E1E"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#FEDA75" />
              <stop offset="0.25" stopColor="#FA7E1E" />
              <stop offset="0.5" stopColor="#D62976" />
              <stop offset="0.75" stopColor="#962FBF" />
              <stop offset="1" stopColor="#4F5BD5" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
          <rect
            x="6.5"
            y="6.5"
            width="11"
            height="11"
            rx="3.5"
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
          />
          <circle
            cx="12"
            cy="12"
            r="3"
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
          />
          <circle cx="15.6" cy="8.4" r="1" fill="#fff" />
        </svg>
      );
  }
}
