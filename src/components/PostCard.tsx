// Card-news style post tile for the blog / column hubs: a square-ish
// thumbnail with a two-line headline (pure CSS, no image files), then the
// post title and date. The thumbnail repeats the title, so it's aria-hidden.

import Link from "next/link";
import type { Post, PostType } from "@/lib/blog";

const THEMES: Record<string, string> = {
  emerald: "from-emerald-500 to-teal-700",
  sky: "from-sky-500 to-blue-700",
  orange: "from-orange-400 to-rose-600",
  amber: "from-amber-400 to-orange-600",
  slate: "from-slate-600 to-slate-900",
  indigo: "from-indigo-500 to-violet-800",
  violet: "from-violet-500 to-fuchsia-700",
  rose: "from-rose-500 to-pink-700",
};

const KICKER: Record<PostType, string> = {
  question: "Q&A",
  data: "기준표",
  comparison: "비교",
  glossary: "용어 정리",
  buildlog: "기록",
};

const fmt = (d: string) => d.replace(/-/g, ".");

export function PostCard({ post, href }: { post: Post; href: string }) {
  const lines = (post.thumb ?? post.question).split("|");
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div
        aria-hidden="true"
        className={`relative flex aspect-[16/10] flex-col sm:aspect-[4/3] justify-between overflow-hidden bg-gradient-to-br p-5 text-white ${
          THEMES[post.theme ?? ""] ?? THEMES.emerald
        }`}
      >
        <span className="w-fit rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold backdrop-blur">
          {KICKER[post.type] ?? "칼럼"}
        </span>
        <span className="pointer-events-none absolute -right-3 -top-2 select-none text-7xl opacity-30 transition-transform duration-300 group-hover:scale-110 sm:text-8xl">
          {post.emoji ?? "📝"}
        </span>
        <span className="relative">
          {lines.map((l) => (
            <span key={l} className="block text-2xl font-extrabold leading-tight tracking-tight drop-shadow-sm sm:text-[1.7rem]">
              {l}
            </span>
          ))}
          <span className="mt-2 block text-[11px] font-semibold text-white/80">마케팅방주</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 group-hover:text-emerald-800">{post.title}</h2>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">{post.answer}</p>
        <p className="mt-auto pt-3 text-xs text-slate-400">
          <time dateTime={post.datePublished}>{fmt(post.datePublished)}</time> · 기준일 {fmt(post.data_asof)}
        </p>
      </div>
    </Link>
  );
}
