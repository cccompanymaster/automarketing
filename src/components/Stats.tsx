// Trust band: facts a visitor can check on the site itself (product count,
// calculators, terms). No usage/revenue numbers until there are measured ones
// with a stated period and basis.

import Link from "next/link";
import { CALCULATORS } from "@/lib/calc/registry";
import { PRICING } from "@/lib/pricing";
import { storeProducts } from "@/lib/store";

const FACTS: { value: string; label: string; href: string }[] = [
  { value: `${storeProducts(PRICING).length}종`, label: "상품 단가·최소 주문금액 공개", href: "/pricing/" },
  { value: "0원", label: "가입비·약정 없이 필요한 만큼 주문", href: "/faq/#order" },
  { value: "전액", label: "작업 시작 전 취소하면 캐시 재적립", href: "/terms/" },
  { value: `${CALCULATORS.length}종`, label: "가입 없이 쓰는 무료 계산기", href: "/tools/" },
];

export function Stats() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">대행사 없이, 광고를 시작하세요</h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            가격과 조건을 먼저 보고, 필요한 것만 골라 직접 주문하세요.
          </p>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.label} className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
              <dt className="sr-only">{f.label}</dt>
              <dd>
                <Link href={f.href} className="group block">
                  <span className="num block text-2xl font-extrabold text-emerald-700 sm:text-3xl">{f.value}</span>
                  <span className="mt-1 block text-xs font-medium text-slate-500 group-hover:text-emerald-700 sm:text-sm">{f.label}</span>
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
