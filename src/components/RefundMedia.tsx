// 환급 가능 매체 로고 줄 (광고비 환급 상세). 정적 사이트라 외부 로고 이미지 대신
// 브랜드 컬러로 렌더한 워드마크로 표현합니다. 환급률은 매체별 상이(확인 중).

type MediaKey = "naver" | "kakao" | "daangn" | "google" | "facebook" | "tiktok" | "dv360";

const MEDIA: MediaKey[] = ["naver", "kakao", "daangn", "google", "facebook", "tiktok", "dv360"];

function BrandMark({ k }: { k: MediaKey }) {
  switch (k) {
    case "naver":
      return (
        <span className="text-lg font-extrabold tracking-tight" style={{ color: "#03C75A" }}>
          NAVER
        </span>
      );
    case "kakao":
      return (
        <span
          className="rounded-md px-2 py-0.5 text-base font-extrabold"
          style={{ background: "#FEE500", color: "#371D1E" }}
        >
          kakao
        </span>
      );
    case "daangn":
      return (
        <span className="text-base font-extrabold" style={{ color: "#FF6F0F" }}>
          🥕 당근
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
        <span className="text-lg font-bold tracking-tight">
          {letters.map(([ch, c], i) => (
            <span key={i} style={{ color: c }}>
              {ch}
            </span>
          ))}
        </span>
      );
    }
    case "facebook":
      return (
        <span className="text-lg font-extrabold lowercase" style={{ color: "#1877F2" }}>
          facebook
        </span>
      );
    case "tiktok":
      return (
        <span className="text-lg font-extrabold" style={{ color: "#010101" }}>
          TikTok
        </span>
      );
    case "dv360":
      return (
        <span className="inline-flex items-center gap-1.5">
          <span style={{ color: "#34A853" }} aria-hidden="true">
            ▶
          </span>
          <span className="text-sm font-semibold text-slate-600">Display &amp; Video 360</span>
        </span>
      );
  }
}

export function RefundMedia() {
  return (
    <section className="py-12">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">환급 가능 매체</h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          아래 매체에서 <b>직접 운영 중인 광고비</b>가 환급 대상입니다. 매체·상품별 환급율은 확인 후 안내드립니다.
        </p>
      </div>

      {/* 점선(라인) + 점 + 로고 줄 — 데스크탑은 한 줄, 모바일은 그리드 */}
      <div className="relative mx-auto mt-10 max-w-5xl">
        <div className="absolute inset-x-2 top-1.5 hidden h-px bg-slate-200 sm:block" aria-hidden="true" />
        <ul className="grid grid-cols-2 gap-y-9 sm:flex sm:items-start sm:justify-between">
          {MEDIA.map((k) => (
            <li key={k} className="flex flex-col items-center gap-5">
              <span
                className="hidden h-3 w-3 rounded-full bg-violet-500 ring-4 ring-white sm:block"
                aria-hidden="true"
              />
              <BrandMark k={k} />
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        ※ 매체별 환급율은 현재 확인 중이며, 확정되는 대로 안내드립니다. 로고·상표권은 각 사에 있습니다.
      </p>
    </section>
  );
}
