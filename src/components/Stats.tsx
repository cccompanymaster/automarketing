// Trust stats band (mirrors the reference layout). Demo placeholder numbers.
// TODO(backend): replace with real aggregate metrics.

const STATS: { value: string; label: string }[] = [
  { value: "240억+", label: "누적 광고 집행비" },
  { value: "500+", label: "연동 매체" },
  { value: "11만+", label: "누적 광고 캠페인" },
  { value: "12,800+", label: "함께하는 사장님" },
];

export function Stats() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            대행사 없이, 광고를 시작하세요
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            대행사 직원 없이도 광고비 거품 없이 셀프 마케팅으로 효율적으로 운영하세요.
          </p>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm"
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block text-2xl font-extrabold text-emerald-600 sm:text-3xl">
                  {s.value}
                </span>
                <span className="mt-1 block text-xs font-medium text-slate-500 sm:text-sm">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-center text-xs text-slate-400">* 데모용 예시 수치입니다.</p>
      </div>
    </section>
  );
}
