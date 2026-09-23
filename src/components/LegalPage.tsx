// Standalone page wrapper for a legal document (header + footer + content).

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalContent } from "@/components/LegalContent";
import type { LegalDocument } from "@/lib/legal";

export function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-5 py-14">
          {/* pr on phones: long titles wrap under the floating menu button. */}
          <h1 className="pr-28 text-2xl font-bold text-slate-900 lg:pr-0">{doc.title}</h1>
          <div className="mt-6">
            <LegalContent doc={doc} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
