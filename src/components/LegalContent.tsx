// Renders a legal document's sections. Reused by /terms, /privacy pages and
// the LegalModal so the content stays in a single source of truth.

import type { LegalDocument } from "@/lib/legal";

export function LegalContent({ doc }: { doc: LegalDocument }) {
  return (
    <article className="prose-slate max-w-none">
      <p className="text-sm text-slate-500">최종 업데이트: {doc.updatedAt}</p>
      <div className="mt-6 space-y-6">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h3 className="text-base font-semibold text-slate-900">
              {section.heading}
            </h3>
            <div className="mt-2 space-y-2">
              {section.body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-slate-600">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
