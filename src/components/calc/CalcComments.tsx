"use client";

// Per-calculator comment board (implemented in a follow-up step).
export function CalcComments({ slug }: { slug: string }) {
  return <section data-slug={slug} className="mt-10" />;
}
