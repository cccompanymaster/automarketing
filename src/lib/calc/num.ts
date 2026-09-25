// Number helpers shared by every calculator. Pure, no DOM.
//
// Rounding policy (applies unless a calculator documents otherwise):
// - Money is computed in full precision and rounded to whole won only for
//   display or where a real-world rule rounds (e.g. insurance premiums cut
//   below 10원 — those calculators say so explicitly).
// - roundWon rounds half away from zero, so -0.5 → -1 and 0.5 → 1.

/** A finite number (not NaN / ±Infinity). */
export function isNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Parse a user-typed number: strips thousands separators, spaces and unit
 * suffixes like "원" / "%". Empty or unparsable input → null (never NaN).
 */
export function parseNumber(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === "number") return isNum(input) ? input : null;
  const cleaned = input.replace(/[,\s원%]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return isNum(n) ? n : null;
}

/** Division that returns null instead of Infinity/NaN. */
export function safeDiv(a: number, b: number): number | null {
  if (!isNum(a) || !isNum(b) || b === 0) return null;
  const r = a / b;
  return isNum(r) ? r : null;
}

/** Round to whole won, half away from zero. */
export function roundWon(n: number): number {
  if (!isNum(n)) return 0;
  const r = Math.sign(n) * Math.round(Math.abs(n));
  return r === 0 ? 0 : r; // no -0
}

/** Truncate below `unit` (e.g. 10 → 원 단위 절사 to tens). */
export function floorTo(n: number, unit: number): number {
  if (!isNum(n) || unit <= 0) return 0;
  const r = Math.floor(n / unit) * unit;
  return r === 0 ? 0 : r;
}

/** Round up to a multiple of `unit` (e.g. price rounding to 100/500/1,000원). */
export function ceilTo(n: number, unit: number): number {
  if (!isNum(n) || unit <= 0) return 0;
  // Guard float noise: 1200.0000000002 should stay 1200 for unit 100.
  const q = n / unit;
  const r = Math.ceil(q - 1e-9) * unit;
  return r === 0 ? 0 : r;
}

const WON = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

/** "1,234" — whole number with separators; non-finite → "—". */
export function formatNumber(n: number | null | undefined, digits = 0): string {
  if (!isNum(n)) return "—";
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(digits === 0 ? roundWon(n) : n);
}

/** "1,234원" (rounded to whole won); non-finite → "—". */
export function formatWon(n: number | null | undefined, opts: { sign?: boolean } = {}): string {
  if (!isNum(n)) return "—";
  const v = roundWon(n);
  const s = WON.format(Math.abs(v));
  const sign = v < 0 ? "−" : opts.sign && v > 0 ? "+" : "";
  return `${sign}${s}원`;
}

/** Ratio → "12.3%" (0.123 → 12.3%). Non-finite → "—". */
export function formatPercent(ratio: number | null | undefined, digits = 1): string {
  if (!isNum(ratio)) return "—";
  const v = ratio * 100;
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: digits }).format(v === 0 ? 0 : v)}%`;
}

/** Percent input (12.5) → ratio (0.125). */
export const pct = (p: number): number => p / 100;
