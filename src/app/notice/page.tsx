// 공지사항 목록.

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { NOTICE_PATH, sortedNotices } from "@/lib/notices";

export const metadata: Metadata = {
  title: "공지사항",
  description: "마케팅방주 약관 개정, 서비스 변경, 이벤트 소식을 알려 드립니다.",
  alternates: { canonical: NOTICE_PATH },
};

export default function NoticeListPage() {
  const notices = sortedNotices();
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-5 py-14">
          <h1 className="pr-28 text-2xl font-bold text-slate-900 lg:pr-0">공지사항</h1>
          <p className="mt-2 text-sm text-slate-500">약관 개정, 서비스 변경, 이벤트 소식을 알려 드려요.</p>

          <ul className="mt-8 divide-y divide-slate-100 border-y border-slate-100">
            {notices.map((n) => (
              <li key={n.slug}>
                <Link
                  href={`${NOTICE_PATH}${n.slug}/`}
                  className="flex flex-col gap-1.5 px-1 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4"
                >
                  <span className="flex shrink-0 items-center gap-1.5">
                    {n.important && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">중요</span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      {n.category}
                    </span>
                  </span>
                  <span className="flex-1 text-base font-semibold text-slate-900">{n.title}</span>
                  <time dateTime={n.date} className="shrink-0 text-sm text-slate-400">
                    {n.date.replaceAll("-", ".")}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
