"use client";

// Shared bits for the two document builders (급여명세서·근로계약서):
// - DocumentFrame: renders a fixed-width (≈A4) document and scales it down with
//   a CSS transform to fit narrow screens, so the layout never reflows on
//   mobile and matches the printed / captured page. The inner element carries
//   id + class "print-area" for CaptureActions (html-to-image captures it at
//   its untransformed size; print CSS resets the transform).
// - RowsEditor: name + amount rows (수당·공제).
// - TextAreaField, PrivacyNote, formatKoDate.

import { useEffect, useId, useRef, useState } from "react";
import { formatTyping } from "@/components/calc/fields";

export const DOC_WIDTH = 720;

export function DocumentFrame({
  targetId,
  label,
  children,
  width = DOC_WIDTH,
}: {
  targetId: string;
  /** Accessible name for the preview region. */
  label: string;
  children: React.ReactNode;
  width?: number;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; height: number } | null>(null);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i || typeof ResizeObserver === "undefined") return;
    // ResizeObserver fires once on observe, so the first measurement happens
    // in its callback (no synchronous setState inside the effect).
    const ro = new ResizeObserver(() => {
      const scale = Math.min(1, o.clientWidth / width);
      setFit({ scale, height: Math.ceil(i.offsetHeight * scale) });
    });
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div
      ref={outer}
      role="region"
      aria-label={label}
      className="doc-frame overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
      style={fit ? { height: fit.height } : undefined}
    >
      <style>{`@media print{.doc-frame{height:auto!important;overflow:visible!important;box-shadow:none!important}.doc-scale{transform:none!important}}`}</style>
      <div className="doc-scale origin-top-left" style={{ width, transform: fit ? `scale(${fit.scale})` : undefined }}>
        <div ref={inner} id={targetId} className="print-area bg-white text-[13px] leading-relaxed text-slate-900">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PrivacyNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-900 ring-1 ring-emerald-100 print:hidden">
      🔒 이름·생년월일·임금 같은 입력 내용은 서버로 전송되거나 저장되지 않아요. 이 브라우저 안에서만 문서를 만들고, 공유
      링크도 만들지 않아요. {children}
    </p>
  );
}

const INPUT =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 aria-[invalid=true]:border-rose-400";

export interface MoneyRow {
  name: string;
  amount: string;
  nonTaxable?: boolean;
}

/** Editable list of name + amount rows. */
export function RowsEditor({
  legend,
  rows,
  onChange,
  namePlaceholder,
  addLabel,
  withNonTaxable,
  errorFor,
  max = 8,
}: {
  legend: string;
  rows: MoneyRow[];
  onChange: (rows: MoneyRow[]) => void;
  namePlaceholder: string;
  addLabel: string;
  withNonTaxable?: boolean;
  errorFor?: (index: number) => string | undefined;
  max?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const patch = (i: number, p: Partial<MoneyRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-700">
        {legend} <span className="text-xs font-normal text-slate-400">(선택)</span>
      </legend>
      <ul className="mt-1.5 space-y-2">
        {rows.map((r, i) => {
          const err = errorFor?.(i);
          return (
            <li key={i} className="rounded-xl bg-slate-50 p-2.5">
              <div className="flex gap-2">
                <label className="sr-only" htmlFor={`${uid}-n${i}`}>
                  {legend} {i + 1} 항목명
                </label>
                <input
                  id={`${uid}-n${i}`}
                  type="text"
                  value={r.name}
                  maxLength={30}
                  placeholder={namePlaceholder}
                  onChange={(e) => patch(i, { name: e.target.value })}
                  className={`${INPUT} min-w-0 flex-[1.2]`}
                />
                <label className="sr-only" htmlFor={`${uid}-a${i}`}>
                  {legend} {i + 1} 금액 (원)
                </label>
                <div className="relative min-w-0 flex-1">
                  <input
                    id={`${uid}-a${i}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={r.amount}
                    placeholder="0"
                    aria-invalid={err ? true : undefined}
                    onChange={(e) => patch(i, { amount: formatTyping(e.target.value, false, false) })}
                    className={`${INPUT} num pr-8 text-right`}
                  />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
                    원
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((_, j) => j !== i))}
                  aria-label={`${legend} ${i + 1} 삭제`}
                  className="h-11 w-10 shrink-0 rounded-xl text-slate-400 transition hover:bg-white hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  ✕
                </button>
              </div>
              {withNonTaxable && (
                <label className="mt-1.5 flex min-h-8 cursor-pointer items-center gap-2 pl-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!r.nonTaxable}
                    onChange={(e) => patch(i, { nonTaxable: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  비과세 (식대 월 20만 원 이하 등 — 4대보험 기준에서 제외)
                </label>
              )}
              {err && (
                <p role="alert" className="mt-1 pl-1 text-xs font-medium text-rose-600">
                  {err}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {rows.length < max && (
        <button
          type="button"
          onClick={() => onChange([...rows, { name: "", amount: "" }])}
          className="mt-2 min-h-10 rounded-xl border border-dashed border-slate-300 px-4 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          + {addLabel}
        </button>
      )}
    </fieldset>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  help,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: React.ReactNode;
  rows?: number;
}) {
  const id = `t${useId().replace(/:/g, "")}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label} <span className="text-xs font-normal text-slate-400">(선택)</span>
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={2000}
        placeholder={placeholder}
        aria-describedby={help ? `${id}-help` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
      {help && (
        <p id={`${id}-help`} className="mt-1 text-xs leading-relaxed text-slate-500">
          {help}
        </p>
      )}
    </div>
  );
}

/** "2026-10-10" → "2026년 10월 10일"; empty/invalid → fallback. */
export function formatKoDate(s: string, fallback = "        년    월    일"): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return fallback;
  return `${Number(m[1])}년 ${Number(m[2])}월 ${Number(m[3])}일`;
}

/** Blank line placeholder for unfilled document fields. */
export function Blank({ value, width = "8em" }: { value?: string; width?: string }) {
  if (value && value.trim()) return <>{value}</>;
  return <span aria-label="미입력" className="inline-block border-b border-slate-400 align-baseline" style={{ width }}>&nbsp;</span>;
}
