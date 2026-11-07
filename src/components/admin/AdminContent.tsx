"use client";

// 콘텐츠: blog / column posts with their publish dates (scheduled ones go
// live on the daily 00:01 KST rebuild), plus where to manage notices.

import Link from "next/link";

export interface ContentPost {
  title: string;
  path: string;
  date: string;
  collection: string;
  scheduled: boolean;
}

export interface ContentSummary {
  /** Build date (KST) the list was made on. */
  asOf: string;
  collections: { name: string; path: string; published: number; scheduled: number }[];
  nextDate: string | null;
  nextCount: number;
  posts: ContentPost[];
}

export function AdminContent({ content }: { content: ContentSummary }) {
  const scheduled = content.posts.filter((p) => p.scheduled).reverse(); // soonest first
  const recent = content.posts.filter((p) => !p.scheduled).slice(0, 20);
  const list = (rows: ContentPost[], empty: string) =>
    rows.length === 0 ? (
      <p className="px-5 py-5 text-sm text-slate-400">{empty}</p>
    ) : (
      <ul className="divide-y divide-slate-50">
        {rows.map((p) => (
          <li key={p.path} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 text-sm">
            <span className="num w-24 shrink-0 text-xs text-slate-400">{p.date}</span>
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{p.collection}</span>
            {p.scheduled ? (
              <span className="min-w-0 flex-1 truncate text-slate-700">{p.title}</span>
            ) : (
              <Link href={p.path} className="min-w-0 flex-1 truncate text-slate-800 hover:text-emerald-700 hover:underline">
                {p.title}
              </Link>
            )}
          </li>
        ))}
      </ul>
    );

  return (
    <div className="mt-6 space-y-4">
      <section className="grid gap-3 sm:grid-cols-3">
        {content.collections.map((c) => (
          <Link key={c.name} href={c.path} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 hover:ring-emerald-300">
            <p className="text-xs font-semibold text-slate-500">{c.name}</p>
            <p className="num mt-1 text-2xl font-extrabold text-slate-900">{c.published}편</p>
            <p className="text-[11px] text-slate-400">공개 · 예약 {c.scheduled}편</p>
          </Link>
        ))}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-xs font-semibold text-slate-500">자동 발행</p>
          <p className="mt-1 text-sm font-bold text-slate-800">매일 블로그 2 + 칼럼 2 예약</p>
          <p className="mt-1 text-[11px] leading-snug text-slate-400">예약 글은 공개일 00:01(한국 시간) 배포 때 사이트·사이트맵·RSS에 올라가요.</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-extrabold text-slate-900">예약된 글 ({scheduled.length})</h2>
        {list(scheduled, "예약된 글이 없어요.")}
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-extrabold text-slate-900">최근 공개된 글</h2>
        {list(recent, "공개된 글이 없어요.")}
      </section>

      <p className="text-[11px] text-slate-400">
        {content.asOf} 배포 기준 목록이에요. 공지사항은{" "}
        <Link href="/notice/" className="underline">
          공지사항
        </Link>
        에서 확인하고, 글 추가·수정은 저장소의 content 폴더에서 해요.
      </p>
    </div>
  );
}
