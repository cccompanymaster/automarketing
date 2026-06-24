// Brand wordmarks rendered with each brand's color (no external logo assets —
// static-export safe). Used in the channels marquee. Trademarks belong to each
// owner; these are lightweight text marks for reference.

export type BrandKey =
  | "naver"
  | "kakao"
  | "google"
  | "youtube"
  | "instagram"
  | "meta"
  | "tiktok"
  | "coupang"
  | "daangn"
  | "toss";

/** Order shown in the landing channels marquee. */
export const CHANNEL_MARKS: BrandKey[] = [
  "naver",
  "kakao",
  "google",
  "youtube",
  "instagram",
  "meta",
  "tiktok",
  "coupang",
  "daangn",
  "toss",
];

export function BrandMark({ k }: { k: BrandKey }) {
  const base = "text-xl font-extrabold tracking-tight whitespace-nowrap";
  switch (k) {
    case "naver":
      return <span className={base} style={{ color: "#03C75A" }}>NAVER</span>;
    case "kakao":
      return (
        <span
          className="whitespace-nowrap rounded-md px-2.5 py-1 text-lg font-extrabold"
          style={{ background: "#FEE500", color: "#371D1E" }}
        >
          kakao
        </span>
      );
    case "google": {
      const letters: [string, string][] = [
        ["G", "#4285F4"],
        ["o", "#EA4335"],
        ["o", "#FBBC05"],
        ["g", "#4285F4"],
        ["l", "#34A853"],
        ["e", "#EA4335"],
      ];
      return (
        <span className={base}>
          {letters.map(([ch, c], i) => (
            <span key={i} style={{ color: c }}>
              {ch}
            </span>
          ))}
        </span>
      );
    }
    case "youtube":
      return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span
            className="flex h-5 w-7 items-center justify-center rounded-md text-[10px] text-white"
            style={{ background: "#FF0000" }}
            aria-hidden="true"
          >
            ▶
          </span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">YouTube</span>
        </span>
      );
    case "instagram":
      return (
        <span
          className={base}
          style={{
            backgroundImage: "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF,#515BD4)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Instagram
        </span>
      );
    case "meta":
      return <span className={base} style={{ color: "#0866FF" }}>Meta</span>;
    case "tiktok":
      return <span className={base} style={{ color: "#010101" }}>TikTok</span>;
    case "coupang":
      return <span className={base} style={{ color: "#E73C3E" }}>쿠팡</span>;
    case "daangn":
      return <span className={base} style={{ color: "#FF6F0F" }}>🥕 당근</span>;
    case "toss":
      return <span className="text-xl font-extrabold lowercase whitespace-nowrap" style={{ color: "#3182F6" }}>toss</span>;
  }
}
