"use client";

// "내게 맞는 상품 찾기" — three taps (업종 → 목표 → 예산) and the store shows
// 2~3 products with why each fits, before asking for any contact details.
// Consultation is offered at the end, not first.

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useModal } from "@/components/useModal";
import { GOALS, productFrom, type StoreProduct } from "@/lib/store";
import { minOrderKrw } from "@/lib/pricing";

const INDUSTRIES: { key: string; label: string; fits: string[]; why: string }[] = [
  {
    key: "food",
    label: "음식점·카페",
    fits: ["place-reward", "place-basics", "kakaomap-review", "kakaomap-trend", "daangn-reaction", "daangn-review", "blog-deploy", "blog-write", "cafe-post", "instagram"],
    why: "손님이 지도와 동네 앱에서 가게를 찾는 업종이에요",
  },
  {
    key: "beauty",
    label: "뷰티·미용",
    fits: ["place-reward", "place-basics", "instagram", "blog-deploy", "blog-influencer", "daangn-reaction", "daangn-review", "kakaomap-review", "cafe-post"],
    why: "사진·후기를 보고 예약하는 손님이 많은 업종이에요",
  },
  {
    key: "pro",
    label: "병원·학원·전문직",
    fits: ["blog-deploy", "blog-guarantee", "place-basics", "press", "ai-aeo", "cafe-post", "blog-write"],
    why: "검색해서 비교한 뒤 결정하는 손님이 많은 업종이에요",
  },
  {
    key: "seller",
    label: "온라인 셀러",
    fits: ["commerce", "blog-deploy", "blog-write", "instagram", "youtube", "press"],
    why: "상품 순위와 후기 콘텐츠가 판매로 이어지는 업종이에요",
  },
  {
    key: "service",
    label: "생활 서비스·기타",
    fits: ["place-basics", "place-reward", "daangn-reaction", "daangn-content", "blog-deploy", "blog-write", "kakaomap-review"],
    why: "동네에서 찾는 손님이 많은 업종이에요",
  },
];

const BUDGETS: { key: string; label: string; max: number }[] = [
  { key: "s", label: "10만 원 이하", max: 100_000 },
  { key: "m", label: "10~50만 원", max: 500_000 },
  { key: "l", label: "50만 원 이상", max: Infinity },
  { key: "x", label: "아직 모르겠어요", max: Infinity },
];

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

function Step({
  title,
  options,
  value,
  onPick,
}: {
  title: string;
  options: { key: string; label: string }[];
  value: string | null;
  onPick: (k: string) => void;
}) {
return (
  <fieldset className="mt-5">
    <legend className="text-sm font-extrabold text-slate-900">{title}</legend>
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onPick(o.key)}
          className={`min-h-11 rounded-xl px-4 text-sm font-bold transition ${
            value === o.key ? "bg-emerald-600 text-white shadow" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  </fieldset>
);
}

export function ProductFinder({
  open,
  products,
  onClose,
  onAsk,
}: {
  open: boolean;
  products: StoreProduct[];
  onClose: () => void;
  /** Hand over to the inquiry form with a summary of the picks. */
  onAsk: (topic: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(panelRef, open, onClose);
  const [industry, setIndustry] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);

  const picks = useMemo(() => {
    const ind = INDUSTRIES.find((i) => i.key === industry);
    const g = GOALS.find((x) => x.key === goal);
    const b = BUDGETS.find((x) => x.key === budget);
    if (!ind || !g || !b) return [];
    const startCost = (p: StoreProduct) => Math.min(...p.options.map((o) => minOrderKrw(o) ?? Infinity));
    // Goal products that suit the industry first, then other goal products.
    const goalProducts = g.ids.map((id) => products.find((p) => p.id === id)).filter((p): p is StoreProduct => !!p);
    const ranked = [...goalProducts.filter((p) => ind.fits.includes(p.id)), ...goalProducts.filter((p) => !ind.fits.includes(p.id))];
    const affordable = ranked.filter((p) => startCost(p) <= b.max);
    return (affordable.length ? affordable : ranked).slice(0, 3).map((p) => {
      const cost = startCost(p);
      const reasons = [
        `‘${g.label}’에 쓰는 상품이에요`,
        ind.fits.includes(p.id) ? ind.why : null,
        Number.isFinite(cost) ? `${won(cost)}부터 시작할 수 있어요${b.max !== Infinity && cost <= b.max ? " (예산 안)" : ""}` : "견적으로 진행해요",
      ].filter(Boolean) as string[];
      return { p, reasons };
    });
  }, [industry, goal, budget, products]);

  if (!open) return null;

  const reset = () => {
    setIndustry(null);
    setGoal(null);
    setBudget(null);
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="내게 맞는 상품 찾기"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">내게 맞는 상품 찾기</h2>
            <p className="mt-0.5 text-sm text-slate-500">세 가지만 고르면 바로 추천해 드려요. 연락처는 필요 없어요.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
            ✕
          </button>
        </div>

        <Step title="1. 어떤 업종이세요?" options={INDUSTRIES} value={industry} onPick={setIndustry} />
        {industry && <Step title="2. 무엇이 가장 필요하세요?" options={GOALS} value={goal} onPick={setGoal} />}
        {industry && goal && <Step title="3. 첫 달 예산은요?" options={BUDGETS} value={budget} onPick={setBudget} />}

        {picks.length > 0 && (
          <section aria-label="추천 상품" className="mt-6 space-y-3">
            <h3 className="text-sm font-extrabold text-emerald-800">이렇게 시작해 보세요</h3>
            {picks.map(({ p, reasons }) => (
              <div key={p.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-xs font-bold text-slate-500">
                  {p.group.icon} {p.group.title}
                </p>
                <p className="mt-0.5 text-base font-extrabold text-slate-900">{p.title}</p>
                <ul className="mt-1.5 space-y-0.5 text-xs text-slate-600">
                  {reasons.map((r) => (
                    <li key={r}>✓ {r}</li>
                  ))}
                </ul>
                <Link
                  href={`/store/${p.id}/`}
                  className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  자세히 보기 · {productFrom(p).name === p.title ? "주문" : "옵션 비교"}
                </Link>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={reset} className="min-h-10 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                다시 고르기
              </button>
              <button
                type="button"
                onClick={() =>
                  onAsk(
                    `상품 추천 상담 — ${INDUSTRIES.find((i) => i.key === industry)?.label} / ${GOALS.find((x) => x.key === goal)?.label} / 예산 ${
                      BUDGETS.find((x) => x.key === budget)?.label
                    }`,
                  )
                }
                className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:border-emerald-300"
              >
                그래도 고민되면 상담 요청하기
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
