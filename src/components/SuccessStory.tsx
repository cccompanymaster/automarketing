// A single success-story card: metric badges + industry + before/after period
// and quotes. Trust is built on numbers, not photos or real names.

import type { SuccessStory as Story } from "@/lib/successStories";

export function SuccessStory({ story }: { story: Story }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div
        className="flex items-center gap-0.5 text-amber-400"
        aria-label={`별점 ${story.rating}점 만점에 ${story.rating}점`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} aria-hidden="true">
            {i < story.rating ? "★" : "☆"}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {story.metrics.map((m) => (
          <span
            key={m}
            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
          >
            {m}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
        <span>{story.industry}</span>
        <span aria-hidden="true">·</span>
        <span>{story.period}</span>
      </div>

      <blockquote className="mt-4 flex-1 space-y-3 text-sm leading-relaxed">
        <p className="text-slate-500">
          <span className="mr-1 font-semibold text-slate-400">도입 전</span>
          “{story.before}”
        </p>
        <p className="text-slate-800">
          <span className="mr-1 font-semibold text-emerald-600">도입 후</span>
          “{story.after}”
        </p>
      </blockquote>

      <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-50 pt-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
          {story.reviewer.name.slice(0, 1)}
        </span>
        <span className="text-sm">
          <span className="font-semibold text-slate-800">{story.reviewer.name}</span>
          <span className="ml-1 text-slate-400">· {story.reviewer.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}
