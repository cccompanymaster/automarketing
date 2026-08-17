// Stylized recreation of a Naver Place search-results screen for the place
// product. Mirrors the reference capture: the top results marked 광고 are
// dimmed, and the organic (non-ad) slots — the red-boxed area in the
// reference — are highlighted as where this product places the store.
// A recreation (not the real screenshot) avoids third-party app UI /
// storefront names. Swap in a real image by dropping
// public/details/place-serp.png and wiring story.image if preferred.

export function PlaceRankingMock() {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-slate-900">플레이스 검색, 여기에 노출돼요</h2>
      <p className="mt-2 text-sm text-slate-500">
        네이버 플레이스 검색 결과 — 위쪽 <b>‘광고’ 자리</b>는 클릭당 광고비가 나가는 자리고,
        저희가 올려드리는 건 그 아래 <b>자연 노출(오가닉) 상위 자리</b>예요. (화면은 이해를
        돕기 위한 재구성 예시입니다)
      </p>

      <div className="mx-auto mt-5 max-w-sm overflow-hidden rounded-3xl border border-slate-200 shadow-md">
        {/* App header */}
        <div className="border-b border-slate-100 bg-white px-4 py-3">
          <p className="text-sm font-extrabold text-slate-900">
            플레이스 <span className="font-medium text-slate-400">· 서울특별시 ○○구</span>
          </p>
          <div className="mt-2 flex gap-1.5" aria-hidden="true">
            {["영업중", "예약", "쿠폰", "포장주문"].map((f) => (
              <span
                key={f}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white p-3.5">
          {/* Ad slots (dimmed) */}
          {["경쟁 매장 A", "경쟁 매장 B"].map((name) => (
            <div key={name} className="mb-2 rounded-2xl border border-slate-100 p-3.5 opacity-45">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-700">{name}</span>
                <span className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                  광고 ⓘ
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">클릭할 때마다 광고비 차감</p>
            </div>
          ))}

          {/* Organic slot — where we place the store (the red-boxed area) */}
          <div className="rounded-2xl bg-emerald-50 p-4 ring-2 ring-emerald-400">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-extrabold text-white">
                자연 노출 ✨
              </span>
              <span className="truncate text-base font-extrabold text-slate-900">우리 매장 ✅</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                재방문 많은
              </span>{" "}
              <span className="font-bold text-amber-500">★ 4.9</span> · 리뷰 4,353 · 영업 중
            </p>
            <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden="true">
              {["🍗", "🍲", "🥘", "🍜"].map((e, i) => (
                <span
                  key={i}
                  className="flex h-12 items-center justify-center rounded-lg bg-white text-xl ring-1 ring-emerald-100"
                >
                  {e}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] font-bold text-emerald-800">
              클릭돼도 광고비 0원 — 순위가 자산으로 남아요
            </p>
          </div>

          {/* Following organic rows (dimmed) */}
          {["경쟁 매장 C", "경쟁 매장 D"].map((name, i) => (
            <div key={name} className="mt-2 flex items-center gap-2 border-b border-slate-50 px-1 py-3 opacity-50 last:border-b-0">
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                {i + 2}위
              </span>
              <span className="text-sm font-semibold text-slate-600">{name}</span>
            </div>
          ))}
          <p className="pt-2 text-center text-[11px] text-slate-300">⋯</p>
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-sm rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">
        자연 노출 상위 자리 공략 · 트래픽 1타 30원부터
      </div>
    </section>
  );
}
