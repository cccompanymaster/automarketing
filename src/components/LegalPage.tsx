// Standalone page wrapper for a legal document (header + footer + content).

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalContent } from "@/components/LegalContent";
import type { LegalDocument } from "@/lib/legal";

export function LegalPage({ doc, notice }: { doc: LegalDocument; notice?: { href: string; label: string } }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-5 py-14">
          {/* pr on phones: long titles wrap under the floating menu button. */}
          <h1 className="pr-28 text-2xl font-bold text-slate-900 lg:pr-0">{doc.title}</h1>
          {notice && (
            <Link
              href={notice.href}
              className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 transition hover:bg-amber-100"
            >
              <span>📢 {notice.label}</span>
              <span aria-hidden="true">→</span>
            </Link>
          )}
          <div className="mt-6">
            <LegalContent doc={doc} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
