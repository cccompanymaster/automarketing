"use client";

// Form controls shared by all calculators. Values are kept as raw strings in
// page state (so switching modes never loses what was typed) and parsed with
// lib/calc/num.parseNumber at calculation time.
//
// Accessibility: every control has a visible <label>; units are part of the
// accessible name; help and error text are wired via aria-describedby;
// segmented choices are native radio inputs (arrow keys work).

import { useId } from "react";

const INPUT =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-rose-100";

/** Insert thousands separators while typing; keeps a trailing "." or "-". */
export function formatTyping(raw: string, allowDecimal: boolean, allowNegative: boolean): string {
  let s = raw.replace(/[^\d.-]/g, "");
  if (!allowNegative) s = s.replace(/-/g, "");
  else s = s.replace(/(?!^)-/g, "");
  if (!allowDecimal) s = s.replace(/\./g, "");
  else {
    const i = s.indexOf(".");
    if (i >= 0) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, "");
  }
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1) : s;
  const [int, dec] = body.split(".");
  const intFmt = int.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "-" : ""}${intFmt}${dec !== undefined ? `.${dec}` : ""}`;
}

export function FieldShell({
  id,
  label,
  help,
  error,
  children,
  optional,
}: {
  id: string;
  label: string;
  help?: React.ReactNode;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-slate-400">(선택)</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {help && !error && (
        <p id={`${id}-help`} className="mt-1 text-xs leading-relaxed text-slate-500">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  unit = "원",
  placeholder,
  help,
  error,
  optional,
  allowDecimal,
  allowNegative,
  presets,
  id: idProp,
}: {
  label: string;
  /** Raw string state (formatted with separators). */
  value: string;
  onChange: (v: string) => void;
  /** Visible unit suffix; also read out as part of the label. */
  unit?: string;
  placeholder?: string;
  help?: React.ReactNode;
  error?: string;
  optional?: boolean;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  /** Quick-fill buttons under the field. */
  presets?: { label: string; value: number | string }[];
  id?: string;
}) {
  const auto = useId();
  const id = idProp ?? `f${auto.replace(/:/g, "")}`;
  const describedBy = [error ? `${id}-error` : help ? `${id}-help` : null].filter(Boolean).join(" ") || undefined;
  const decimal = allowDecimal ?? unit === "%";
  return (
    <FieldShell id={id} label={unit ? `${label} (${unit})` : label} help={help} error={error} optional={optional}>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(formatTyping(e.target.value, decimal, !!allowNegative))}
          className={`${INPUT} num text-right ${unit ? "pr-12" : ""}`}
        />
        {unit && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-slate-400">
            {unit}
          </span>
        )}
      </div>
      {presets && presets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={`${label} 빠른 입력`}>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(formatTyping(String(p.value), decimal, !!allowNegative))}
              className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </FieldShell>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  help,
  error,
  optional,
  type = "text",
  maxLength,
  id: idProp,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: React.ReactNode;
  error?: string;
  optional?: boolean;
  type?: "text" | "date" | "time" | "month";
  maxLength?: number;
  id?: string;
}) {
  const auto = useId();
  const id = idProp ?? `f${auto.replace(/:/g, "")}`;
  return (
    <FieldShell id={id} label={label} help={help} error={error} optional={optional}>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  help,
  id: idProp,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  help?: React.ReactNode;
  id?: string;
}) {
  const auto = useId();
  const id = idProp ?? `f${auto.replace(/:/g, "")}`;
  return (
    <FieldShell id={id} label={label} help={help}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-describedby={help ? `${id}-help` : undefined}
        className={`${INPUT} appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='2' fill='none'/%3E%3C/svg%3E\")",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Mode / option switch built on native radios (keyboard: arrow keys). */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  hideLabel,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hideLabel?: boolean;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className={hideLabel ? "sr-only" : "mb-1.5 text-sm font-semibold text-slate-700"}>{label}</legend>
      <div className="flex rounded-xl bg-slate-100 p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className="relative flex min-h-10 flex-1 cursor-pointer items-center justify-center rounded-lg px-2 text-center text-sm font-semibold text-slate-500 transition has-[:checked]:bg-white has-[:checked]:text-emerald-800 has-[:checked]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-400"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  help,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  help?: React.ReactNode;
}) {
  const id = `c${useId().replace(/:/g, "")}`;
  return (
    <div>
      <label htmlFor={id} className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-slate-700">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={help ? `${id}-help` : undefined}
          className="h-[18px] w-[18px] shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        {label}
      </label>
      {help && (
        <p id={`${id}-help`} className="ml-7 text-xs text-slate-500">
          {help}
        </p>
      )}
    </div>
  );
}

/** Card that groups inputs. */
export function InputCard({ title, children, aside }: { title?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      {(title || aside) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold text-slate-900">{title}</h2>}
          {aside}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Two-column grid for inputs on wider screens. */
export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/** Look up the first issue message for a field from a CalcResult. */
export function issueFor(
  result: { status: string; issues?: { field: string; message: string }[] },
  field: string,
): string | undefined {
  if (result.status !== "invalid" || !result.issues) return undefined;
  return result.issues.find((i) => i.field === field)?.message;
}
