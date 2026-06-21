// Supported advertising / exposure channels (reference: "프리미엄 매체에 광고
// 송출"). Shown as labeled chips instead of third-party logos.

const CHANNELS: string[] = [
  "네이버 플레이스",
  "네이버 쇼핑",
  "네이버 블로그",
  "카카오",
  "쿠팡",
  "인스타그램",
  "당근",
  "구글",
  "유튜브",
];

export function Channels() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          주요 광고 · 노출 매체
        </h2>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          소비자가 가장 많이 쓰는 채널에 우리 매장을 노출합니다.
        </p>
      </div>

      <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
        {CHANNELS.map((c) => (
          <li
            key={c}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
          >
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}
