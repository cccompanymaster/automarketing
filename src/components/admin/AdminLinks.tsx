"use client";

// 바로가기: the outside dashboards this site depends on, and which
// integrations this build has switched on.

import { isSupabaseConfigured } from "@/lib/supabase";
import { isPgConfigured } from "@/lib/payments";
import { isSheetPricingConfigured } from "@/lib/sheetPricing";
import { canSubmitInquiry } from "@/lib/inquiry";
import { GA4_ID } from "@/lib/trackingIds";
import { COMPANY } from "@/lib/company";

const LINKS: { group: string; items: { label: string; href: string; desc: string }[] }[] = [
  {
    group: "운영",
    items: [
      { label: "Supabase 대시보드", href: "https://supabase.com/dashboard/projects", desc: "회원·주문 DB, 인증 메일 템플릿, 함수 로그" },
      { label: "카카오톡 채널 관리자", href: "https://center-pf.kakao.com/", desc: "1:1 상담 답변" },
      { label: "Resend (알림 메일)", href: "https://resend.com/emails", desc: "입금·문의 알림 메일 발송 기록" },
      { label: "GitHub 배포 기록", href: "https://github.com/cccompanymaster/automarketing/actions", desc: "사이트 배포·매일 00:01 재배포" },
    ],
  },
  {
    group: "검색·분석",
    items: [
      { label: "Google Analytics 4", href: "https://analytics.google.com/", desc: "방문·검색·주문 이벤트" },
      { label: "Google Search Console", href: "https://search.google.com/search-console", desc: "구글 검색 노출·색인" },
      { label: "네이버 서치어드바이저", href: "https://searchadvisor.naver.com/", desc: "네이버 검색 노출·수집 요청" },
    ],
  },
  {
    group: "세금·결제",
    items: [
      { label: "홈택스", href: "https://www.hometax.go.kr/", desc: "현금영수증·세금계산서 발행" },
      { label: "PortOne 콘솔", href: "https://admin.portone.io/", desc: "카드 결제 (연동 시)" },
    ],
  },
];

const STATUS: { label: string; on: boolean; off: string }[] = [
  { label: "회원·주문 DB (Supabase)", on: isSupabaseConfigured, off: "데모 모드" },
  { label: "카드 결제 (PortOne)", on: isPgConfigured, off: "무통장입금만 사용 중" },
  { label: "사이트 문의 접수", on: canSubmitInquiry, off: "메일 앱 안내로 대체" },
  { label: "구글 시트 단가 연동", on: isSheetPricingConfigured, off: "사이트 기본 단가 사용" },
  { label: "방문 분석 (GA4)", on: Boolean(GA4_ID), off: "개발 빌드에서는 꺼짐" },
];

export function AdminLinks() {
  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
        <h2 className="text-sm font-extrabold text-slate-900">연동 상태</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STATUS.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
              <span className="text-slate-700">{s.label}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${s.on ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                {s.on ? "사용 중" : s.off}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-slate-400">
          사업자 정보: {COMPANY.companyName} · {COMPANY.businessRegistrationNumber} · 통신판매업 {COMPANY.mailOrderNumber} · 입금 계좌 {COMPANY.bankAccount.bank}{" "}
          {COMPANY.bankAccount.number}
        </p>
      </section>

      {LINKS.map((g) => (
        <section key={g.group} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
          <h2 className="text-sm font-extrabold text-slate-900">{g.group}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {g.items.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col rounded-xl px-3 py-2.5 ring-1 ring-slate-100 transition hover:bg-emerald-50/50 hover:ring-emerald-200"
                >
                  <span className="text-sm font-bold text-slate-800">{l.label} ↗</span>
                  <span className="text-xs text-slate-500">{l.desc}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
