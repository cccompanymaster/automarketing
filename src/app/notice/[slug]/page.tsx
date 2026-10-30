// 공지사항 상세. Terms-revision notices also show the current (pre-revision)
// terms in full, as 약관규제법 requires posting both together.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalContent } from "@/components/LegalContent";
import { renderMarkdown } from "@/lib/blog";
import { TERMS_PREVIOUS } from "@/lib/legal";
import { NOTICES, NOTICE_PATH, getNotice } from "@/lib/notices";

export const dynamicParams = false;

export function generateStaticParams() {
  return NOTICES.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const notice = getNotice(slug);
  if (!notice) return {};
  return { title: notice.title, alternates: { canonical: `${NOTICE_PATH}${notice.slug}/` } };
}

export default async function NoticePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const notice = getNotice(slug);
  if (!notice) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-5 py-14">
          <Link href={NOTICE_PATH} className="text-sm font-semibold text-emerald-700 hover:underline">
            ← 공지사항
          </Link>
          <div className="mt-4 flex items-center gap-1.5">
            {notice.important && (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">중요</span>
            )}
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {notice.category}
            </span>
          </div>
          <h1 className="mt-3 pr-28 text-2xl font-bold leading-snug text-slate-900 lg:pr-0">{notice.title}</h1>
          <p className="mt-2 text-sm text-slate-400">
            게시일 <time dateTime={notice.date}>{notice.date.replaceAll("-", ".")}</time>
          </p>

          <div
            className="post-body notice-body mt-8 border-t border-slate-100 pt-6"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(notice.body) }}
          />

          {notice.attachPreviousTerms && (
            <details className="mt-12 rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer text-base font-bold text-slate-900">
                현행 약관 전문 보기 (2026년 9월 26일 시행)
              </summary>
              <div className="mt-4">
                <LegalContent doc={TERMS_PREVIOUS} />
              </div>
            </details>
          )}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
