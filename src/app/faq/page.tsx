// 자주 묻는 질문 — standalone page, open to everyone (the home page's #faq
// section redirects signed-in members, so this is the link the header/footer use).

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { ORDER_FAQS, SITE_FAQS } from "@/lib/faq";
import { breadcrumbLd, faqLd } from "@/lib/seo";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: "마케팅방주 상품·가격, 주문 방법, 캐시 충전·부가세·환불, 계정 보안까지 자주 받는 질문을 모았어요.",
  alternates: { canonical: "/faq/" },
};

const SECTIONS = [
  { id: "service", title: "서비스·상품", items: SITE_FAQS },
  { id: "order", title: "주문·캐시·환불", items: ORDER_FAQS },
];

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={[
          faqLd([...SITE_FAQS, ...ORDER_FAQS]),
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "자주 묻는 질문", path: "/faq/" },
          ]),
        ]}
      />
      <SiteHeader />
      <main className="flex-1 bg-slate-50/60">
        <div className="mx-auto max-w-3xl px-5 py-14">
          <h1 className="pr-28 text-2xl font-bold text-slate-900 lg:pr-0">자주 묻는 질문</h1>
          <p className="mt-2 text-sm text-slate-500">상품·가격, 주문 방법, 캐시·부가세·환불까지 가장 많이 받는 질문이에요.</p>
          <nav aria-label="질문 분류" className="mt-5 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300"
              >
                {s.title}
              </a>
            ))}
          </nav>

          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-10 scroll-mt-24">
              <h2 id={`${s.id}-h`} className="mb-4 text-lg font-extrabold text-slate-900">
                {s.title}
              </h2>
              <FaqAccordion items={s.items} />
            </section>
          ))}

          <div className="mt-12 rounded-2xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
            <p className="font-bold text-slate-900">원하는 답이 없나요?</p>
            <p className="mt-1">
              카카오톡 채널로 물어보시면 가장 빨라요. 전체 조건은{" "}
              <Link href="/terms/" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
                이용약관
              </Link>
              에서 확인할 수 있어요.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={COMPANY.kakaoChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-10 items-center rounded-xl bg-[#FEE500] px-4 text-sm font-bold text-slate-900"
              >
                카카오톡 상담
              </a>
              <a href={`tel:${COMPANY.phone}`} className="flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                전화 {COMPANY.phone}
              </a>
              <Link href="/pricing/" className="flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                상품·요금 보기
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
