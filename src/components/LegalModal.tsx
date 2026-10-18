"use client";

// Accessible modal for Terms / Privacy. Opened from the signup consent area.
// The same content is also reachable at /terms and /privacy.
// Traps focus while open, closes on Escape, and restores focus on close.

import { useRef } from "react";
import { useModal } from "@/components/useModal";
import { LEGAL_DOCS, type LegalDocKey } from "@/lib/legal";
import { LegalContent } from "@/components/LegalContent";

interface LegalModalProps {
  open: boolean;
  docKey: LegalDocKey | null;
  onClose: () => void;
}


export function LegalModal({ open, docKey, onClose }: LegalModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useModal(dialogRef, open && Boolean(docKey), onClose);

  if (!open || !docKey) return null;

  const doc = LEGAL_DOCS[docKey];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{doc.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            ✕
          </button>
        </header>
        <div className="overflow-y-auto px-6 py-5">
          <LegalContent doc={doc} />
        </div>
        <footer className="border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            확인
          </button>
        </footer>
      </div>
    </div>
  );
}
