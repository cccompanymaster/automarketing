// Footer with business / legal registration info (dummy values from
// COMPANY constants) and links to terms / privacy.

import Link from "next/link";
import { COMPANY } from "@/lib/company";

export function SiteFooter() {
  const items: { label: string; value: string }[] = [
    { label: "상호", value: COMPANY.companyName },
    { label: "대표", value: COMPANY.ceo },
    { label: "사업자등록번호", value: COMPANY.businessRegistrationNumber },
    { label: "통신판매업신고", value: COMPANY.mailOrderSalesNumber },
    { label: "주소", value: COMPANY.address },
    { label: "이메일", value: COMPANY.email },
  ];

  return (
    <footer className="safe-bottom mt-auto border-t border-slate-100 bg-slate-50">
      <div className="safe-x mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-extrabold text-slate-900">
              <span className="text-lg">🌱</span>
              <span>{COMPANY.serviceName}</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
              대행사 없이도 손쉽게 시작하는 우리 매장 마케팅. 소상공인·온라인 셀러·매장 운영자를 위한 셀프 마케팅 플랫폼입니다.
            </p>
          </div>

          <nav className="flex gap-4 text-sm font-medium text-slate-600">
            <Link href="/terms" className="transition hover:text-slate-900">
              이용약관
            </Link>
            <Link href="/privacy" className="transition hover:text-slate-900">
              개인정보처리방침
            </Link>
          </nav>
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-x-6 gap-y-2 text-xs text-slate-500 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="flex gap-2">
              <dt className="shrink-0 font-medium text-slate-400">{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 text-xs text-slate-400">
          © {new Date().getFullYear()} {COMPANY.companyName}. All rights reserved.
          <span className="ml-2">표시된 사업자 정보는 예시용 더미 데이터입니다.</span>
        </p>
      </div>
    </footer>
  );
}
