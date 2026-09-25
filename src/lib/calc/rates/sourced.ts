// Every externally-defined number (rates, wages, legal thresholds) is wrapped
// with where it came from and when it was checked, so pages can show "기준일"
// and flag values that aren't backed by an official source as 가정값.

/**
 * How a value is backed:
 * - "law": fixed by statute / arithmetic (VAT 10%, 1평 환산).
 * - "official": announced by a government body (고시·보도자료) — checked via
 *   the official site's published summary on `checkedAt`.
 * - "platform": the platform's own notice / news coverage of it; commercial
 *   terms change often → shown as 가정값 with the source.
 * - "assumed": no source confirmed; a representative default → 가정값.
 */
export type Basis = "law" | "official" | "platform" | "assumed";

export interface Sourced<T> {
  value: T;
  /** Human-readable source, e.g. "고용노동부 고시 제2025-xx호". */
  source: string;
  url?: string;
  /** YYYY-MM-DD the value was last checked against the source. */
  checkedAt: string;
  /** Period the value applies to, e.g. "2026-01-01 ~ 2026-12-31". */
  effective?: string;
  basis: Basis;
  note?: string;
}

/** True when the page should badge the value as 가정값. */
export const isAssumed = (s: { basis: Basis }) => s.basis === "platform" || s.basis === "assumed";

export const sourced = <T,>(value: T, meta: Omit<Sourced<T>, "value">): Sourced<T> => ({ value, ...meta });
