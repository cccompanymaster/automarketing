// Result-style store thumbnails: a tiny mock of what the product produces
// (검색 결과, 지도 순위, 피드, 기사…) drawn in CSS, so cards show outcomes
// without image files. Decorative only — every mock is aria-hidden and makes
// no numeric claims.

const Bar = ({ w, tone = "bg-slate-200" }: { w: string; tone?: string }) => (
  <span className={`block h-1.5 rounded-full ${tone}`} style={{ width: w }} />
);

/** Search results with the top result highlighted (blog products). */
function SearchMock() {
  return (
    <div className="w-[78%] rounded-xl bg-white p-2.5 shadow-md ring-1 ring-sky-100">
      <div className="flex items-center gap-1.5 rounded-full bg-sky-50 px-2 py-1">
        <span className="text-[9px]">🔍</span>
        <Bar w="55%" tone="bg-sky-200" />
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center gap-1.5 rounded-lg bg-sky-500/10 p-1.5 ring-1 ring-sky-300">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-sky-500 text-[8px] font-black text-white">1</span>
          <span className="flex-1 space-y-1">
            <Bar w="90%" tone="bg-sky-400" />
            <Bar w="60%" />
          </span>
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-1.5 p-1.5">
            <span className="h-4 w-4 shrink-0 rounded bg-slate-100" />
            <span className="flex-1 space-y-1">
              <Bar w="80%" />
              <Bar w="50%" tone="bg-slate-100" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Map with a pin and a ranking list (place, kakaomap). */
function MapMock({ tone }: { tone: "emerald" | "amber" }) {
  const t = tone === "emerald" ? { pin: "bg-emerald-500", soft: "bg-emerald-100", ring: "ring-emerald-300" } : { pin: "bg-amber-400", soft: "bg-amber-100", ring: "ring-amber-300" };
  return (
    <div className="flex w-[82%] gap-2 rounded-xl bg-white p-2 shadow-md">
      <div className={`relative h-20 w-[42%] overflow-hidden rounded-lg ${t.soft}`}>
        <span className="absolute left-2 top-5 h-0.5 w-16 rotate-12 bg-white/80" />
        <span className="absolute left-0 top-12 h-0.5 w-20 -rotate-6 bg-white/80" />
        <span className={`absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full rounded-br-none rotate-45 ${t.pin} shadow`} />
      </div>
      <div className="flex-1 space-y-1">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`flex items-center gap-1 rounded-md p-1 ${n === 1 ? `ring-1 ${t.ring} ${t.soft}` : ""}`}>
            <span className={`text-[8px] font-black ${n === 1 ? "text-slate-800" : "text-slate-300"}`}>{n}</span>
            <Bar w={n === 1 ? "85%" : "70%"} tone={n === 1 ? t.pin : "bg-slate-100"} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Product listing with the item rising (commerce). */
function ShopMock() {
  return (
    <div className="grid w-[80%] grid-cols-3 gap-1.5 rounded-xl bg-white p-2 shadow-md">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`rounded-lg p-1 ${i === 0 ? "bg-orange-50 ring-1 ring-orange-300" : ""}`}>
          <div className={`aspect-square rounded-md ${i === 0 ? "bg-orange-200" : "bg-slate-100"}`} />
          <div className="mt-1 space-y-0.5">
            <Bar w="90%" tone={i === 0 ? "bg-orange-400" : "bg-slate-200"} />
            <Bar w="60%" tone="bg-slate-100" />
          </div>
        </div>
      ))}
      <span className="col-span-3 mt-0.5 flex items-center gap-1 text-[9px] font-bold text-orange-600">🛒 ↑</span>
    </div>
  );
}

/** Community post with comments (cafe). */
function PostMock() {
  return (
    <div className="w-[78%] rounded-xl bg-white p-2.5 shadow-md">
      <div className="flex items-center gap-1.5">
        <span className="h-4 w-4 rounded-full bg-amber-200" />
        <Bar w="35%" tone="bg-amber-300" />
      </div>
      <div className="mt-2 space-y-1">
        <Bar w="95%" />
        <Bar w="88%" />
        <Bar w="60%" />
      </div>
      <div className="mt-2 space-y-1 rounded-lg bg-amber-50 p-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="text-[8px]">💬</span>
            <Bar w={i ? "55%" : "70%"} tone="bg-amber-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** AI answer citing the store (ai). */
function ChatMock() {
  return (
    <div className="w-[80%] space-y-1.5">
      <div className="ml-auto w-[70%] rounded-xl rounded-br-sm bg-violet-500 p-1.5">
        <Bar w="85%" tone="bg-white/70" />
      </div>
      <div className="w-[88%] rounded-xl rounded-bl-sm bg-white p-2 shadow-md">
        <span className="text-[9px]">🤖</span>
        <div className="mt-1 space-y-1">
          <Bar w="95%" />
          <Bar w="75%" />
        </div>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[8px] font-bold text-violet-700">📍 출처</span>
      </div>
    </div>
  );
}

/** Feed grid with reactions (instagram, youtube, neighbors). */
function FeedMock({ video = false }: { video?: boolean }) {
  return (
    <div className="grid w-[76%] grid-cols-3 gap-1 rounded-xl bg-white p-1.5 shadow-md">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`relative aspect-square rounded-md ${["bg-pink-200", "bg-rose-100", "bg-fuchsia-100"][i % 3]}`}>
          {video && i === 0 && <span className="absolute inset-0 flex items-center justify-center text-[10px] text-rose-600">▶</span>}
          {i === 4 && <span className="absolute bottom-0.5 right-0.5 text-[8px]">❤️</span>}
        </div>
      ))}
    </div>
  );
}

/** Neighborhood card with follow/heart (daangn). */
function LocalMock() {
  return (
    <div className="w-[78%] rounded-xl bg-white p-2.5 shadow-md">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-xs">🏠</span>
        <span className="flex-1 space-y-1">
          <Bar w="70%" tone="bg-orange-300" />
          <Bar w="45%" />
        </span>
      </div>
      <div className="mt-2 flex gap-1">
        {["단골", "찜", "관심"].map((l) => (
          <span key={l} className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[8px] font-bold text-orange-600 ring-1 ring-orange-200">
            {l}
          </span>
        ))}
      </div>
      <div className="mt-1.5 space-y-1">
        <Bar w="90%" tone="bg-slate-100" />
      </div>
    </div>
  );
}

/** News article (press). */
function NewsMock() {
  return (
    <div className="w-[78%] rounded-xl bg-white p-2.5 shadow-md">
      <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[8px] font-black text-white">NEWS</span>
      <div className="mt-1.5 space-y-1">
        <Bar w="95%" tone="bg-slate-700" />
        <Bar w="70%" tone="bg-slate-700" />
      </div>
      <div className="mt-2 flex gap-1.5">
        <span className="h-8 w-10 shrink-0 rounded bg-indigo-100" />
        <span className="flex-1 space-y-1">
          <Bar w="100%" />
          <Bar w="90%" />
          <Bar w="60%" />
        </span>
      </div>
    </div>
  );
}

/** Document being written (blog-write). */
function DocMock() {
  return (
    <div className="relative w-[70%] rounded-xl bg-white p-2.5 shadow-md">
      <Bar w="60%" tone="bg-sky-400" />
      <div className="mt-2 space-y-1">
        <Bar w="95%" />
        <Bar w="90%" />
        <Bar w="70%" />
        <Bar w="85%" />
      </div>
      <span className="absolute -right-2 -top-2 text-base">✨</span>
    </div>
  );
}

const TINT: Record<string, string> = {
  blog: "bg-sky-50",
  place: "bg-emerald-50",
  commerce: "bg-orange-50",
  cafe: "bg-amber-50",
  ai: "bg-violet-50",
  sns: "bg-pink-50",
  kakaomap: "bg-yellow-50",
  daangn: "bg-orange-50",
  press: "bg-indigo-50",
};

/** Light tint + outcome mock for a store product. */
export function ResultMock({ groupKey, productId }: { groupKey: string; productId: string }) {
  const mock =
    productId === "blog-write" ? (
      <DocMock />
    ) : productId === "blog-neighbor" ? (
      <FeedMock />
    ) : groupKey === "blog" ? (
      <SearchMock />
    ) : groupKey === "place" ? (
      <MapMock tone="emerald" />
    ) : groupKey === "kakaomap" ? (
      <MapMock tone="amber" />
    ) : groupKey === "commerce" ? (
      <ShopMock />
    ) : groupKey === "cafe" ? (
      <PostMock />
    ) : groupKey === "ai" ? (
      <ChatMock />
    ) : groupKey === "sns" ? (
      <FeedMock video={productId === "youtube"} />
    ) : groupKey === "daangn" ? (
      <LocalMock />
    ) : groupKey === "press" ? (
      <NewsMock />
    ) : (
      <DocMock />
    );
  return (
    <div aria-hidden="true" className={`flex h-full w-full items-center justify-center ${TINT[groupKey] ?? "bg-slate-50"}`}>
      {mock}
    </div>
  );
}
