"use client";

// Document export for payslips / contracts, entirely in the browser:
// - "카톡용 이미지 복사": renders the preview node to PNG (html-to-image) and
//   puts it on the clipboard; falls back to downloading the PNG where image
//   clipboard isn't supported (e.g. some mobile browsers).
// - "인쇄·PDF 저장": window.print() with print CSS that shows only the element
//   marked .print-area (see globals.css) — "PDF로 저장" in the print dialog.

import { useState } from "react";
import { toast } from "sonner";

async function renderPng(node: HTMLElement): Promise<Blob | null> {
  const { toBlob } = await import("html-to-image");
  const opts = { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true };
  // Embedding the (cross-origin) webfont can fail; retry without fonts.
  return toBlob(node, opts).catch(() => toBlob(node, { ...opts, skipFonts: true }));
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CaptureActions({
  targetId,
  filename,
}: {
  /** id of the element to capture / print (should carry class "print-area"). */
  targetId: string;
  filename: string;
}) {
  const [busy, setBusy] = useState(false);

  const copyImage = async () => {
    const node = document.getElementById(targetId);
    if (!node) return;
    setBusy(true);
    try {
      const blob = await renderPng(node);
      if (!blob) throw new Error("render failed");
      const canClip = typeof ClipboardItem !== "undefined" && !!navigator.clipboard?.write;
      if (canClip) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          toast.success("이미지를 복사했어요. 카카오톡 대화창에 붙여넣기 하세요.");
          return;
        } catch {
          /* fall back to download */
        }
      }
      download(blob, `${filename}.png`);
      toast.success("이 브라우저는 이미지 복사를 지원하지 않아 PNG 파일로 저장했어요.");
    } catch {
      toast.error("이미지를 만들지 못했어요. 인쇄·PDF 저장을 이용해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const print = () => {
    const prev = document.title;
    document.title = filename; // default PDF file name
    window.print();
    document.title = prev;
  };

  const btn =
    "flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60";
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" onClick={copyImage} disabled={busy} className={`${btn} bg-[#FEE500] text-black/85 hover:brightness-95 focus-visible:ring-yellow-500`}>
        {busy ? "이미지 만드는 중…" : "🖼️ 카톡용 이미지 복사"}
      </button>
      <button type="button" onClick={print} className={`${btn} bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-500`}>
        🖨️ 인쇄·PDF 저장
      </button>
    </div>
  );
}
