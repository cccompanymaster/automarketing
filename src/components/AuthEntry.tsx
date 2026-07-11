"use client";

// First branch of the /start funnel: "처음이에요" (new) vs "로그인하기"
// (returning). Selection drives the parent state machine — no URL change.

export function AuthEntry({
  onNew,
  onReturning,
}: {
  onNew: () => void;
  onReturning: () => void;
}) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-900">반갑습니다 👋</h1>
      <p className="mt-2 text-sm text-slate-500">
        마케팅방주를 처음 이용하시나요?
      </p>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full rounded-xl bg-emerald-700 px-5 py-4 text-left transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <span className="block text-sm font-bold text-white">처음이에요</span>
          <span className="mt-0.5 block text-xs text-emerald-50">
            간단한 안내를 보고 가입을 시작합니다
          </span>
        </button>

        <button
          type="button"
          onClick={onReturning}
          className="w-full rounded-xl bg-white px-5 py-4 text-left ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <span className="block text-sm font-bold text-slate-900">로그인하기</span>
          <span className="mt-0.5 block text-xs text-slate-500">
            이미 계정이 있어요
          </span>
        </button>
      </div>
    </div>
  );
}
