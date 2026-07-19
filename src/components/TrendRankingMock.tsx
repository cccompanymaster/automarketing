// Stylized recreation of the KakaoMap "트렌드 랭킹" screen, used as the
// reference visual for the 트렌드랭킹 1~6위 보장 product. A recreation (not a
// real screenshot) keeps us clear of app-UI copyright while showing exactly
// where the guaranteed slot appears. Swap for a real image later if desired.

export function TrendRankingMock() {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-slate-900">트렌드 랭킹, 여기에 노출돼요</h2>
      <p className="mt-2 text-sm text-slate-500">
        카카오맵 첫 화면의 지역별 ‘트렌드 랭킹’ 맛집 탭 — 아래 화면의 <b>1~6위 자리</b>를
        보장하는 상품이에요. (화면은 이해를 돕기 위한 재구성 예시입니다)
      </p>

      <div className="mx-auto mt-5 max-w-sm overflow-hidden rounded-3xl border border-slate-200 shadow-md">
        {/* App header */}
        <div className="bg-gradient-to-b from-blue-900 to-blue-700 px-5 pb-8 pt-6 text-center">
          <p className="text-[11px] font-bold tracking-widest text-blue-200">🏆 트렌드 랭킹</p>
          <p className="mt-1 text-2xl font-extrabold text-white">우리 동네</p>
          <span className="mt-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/30">
            ⚙ 지역선택
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-white text-center text-sm font-bold">
          <span className="flex-1 border-b-2 border-slate-900 py-3 text-slate-900">맛집</span>
          <span className="flex-1 py-3 text-slate-400">가볼만한 곳</span>
        </div>

        {/* #1 slot — the guaranteed position */}
        <div className="bg-white p-4">
          <div className="rounded-2xl bg-emerald-50 p-4 ring-2 ring-emerald-300">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-extrabold text-white">
                🥇 1위
              </span>
              <span className="text-[11px] font-bold text-rose-500">▲ 3</span>
              <span className="truncate text-base font-extrabold text-slate-900">우리 매장 ✅</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-bold text-amber-500">★ 4.8</span> (412) · 우리 동네 · 업종
            </p>
            <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden="true">
              {["🍞", "🏪", "🥪", "☕"].map((e, i) => (
                <span
                  key={i}
                  className="flex h-12 items-center justify-center rounded-lg bg-slate-100 text-xl"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* 2~3위 rows (dimmed) */}
          {[
            { rank: "2위", name: "경쟁 매장 A" },
            { rank: "3위", name: "경쟁 매장 B" },
          ].map((r) => (
            <div key={r.rank} className="flex items-center gap-2 border-b border-slate-50 px-1 py-3 opacity-50">
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                {r.rank}
              </span>
              <span className="text-sm font-semibold text-slate-600">{r.name}</span>
            </div>
          ))}
          <p className="pt-3 text-center text-[11px] text-slate-300">⋯</p>
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-sm rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">
        1~6위 노출 보장 · 일 10,000원 <span className="font-medium text-emerald-600">(월 보장 300,000원)</span>
      </div>
    </section>
  );
}
