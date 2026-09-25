// Result shape shared by all calculators so pages render every state the
// same way and never show NaN/Infinity.

export interface FieldIssue {
  /** Input key the issue belongs to (matches the form field id suffix). */
  field: string;
  message: string;
}

export type CalcResult<T> =
  /** Required inputs not filled yet — show guidance, not zeros. */
  | { status: "empty"; missing: string[] }
  /** Inputs present but out of range (negative, ≥100%, …). */
  | { status: "invalid"; issues: FieldIssue[] }
  /** Math works but the goal can't be reached (e.g. no break-even). */
  | { status: "impossible"; reason: string; partial?: Partial<T> }
  | { status: "ok"; value: T; warnings: string[] };

export const ok = <T,>(value: T, warnings: string[] = []): CalcResult<T> => ({ status: "ok", value, warnings });
export const empty = <T,>(missing: string[]): CalcResult<T> => ({ status: "empty", missing });
export const invalid = <T,>(issues: FieldIssue[]): CalcResult<T> => ({ status: "invalid", issues });
export const impossible = <T,>(reason: string, partial?: Partial<T>): CalcResult<T> => ({
  status: "impossible",
  reason,
  partial,
});

/**
 * Tiny validator for numeric inputs. Collect `missing` (null values that are
 * required) and `issues` (range problems) in one pass.
 */
export class Check {
  missing: string[] = [];
  issues: FieldIssue[] = [];

  /** Required value; returns it (or 0 when missing so callers can continue). */
  req(field: string, label: string, v: number | null): number {
    if (v == null) {
      this.missing.push(label);
      return 0;
    }
    return v;
  }

  min(field: string, label: string, v: number | null, min: number, inclusive = true) {
    if (v == null) return;
    if (inclusive ? v < min : v <= min) {
      this.issues.push({
        field,
        message: min === 0 && inclusive ? `${label}은(는) 0 이상이어야 해요.` : `${label}은(는) ${min}${inclusive ? " 이상" : "보다 커야"} 해요.`,
      });
    }
  }

  positive(field: string, label: string, v: number | null) {
    if (v == null) return;
    if (v <= 0) this.issues.push({ field, message: `${label}은(는) 0보다 커야 해요.` });
  }

  /** Percent input (0–100). `below100` rejects 100 itself (e.g. margin rate). */
  percent(field: string, label: string, v: number | null, opts: { below100?: boolean; max?: number } = {}) {
    if (v == null) return;
    const max = opts.max ?? 100;
    if (v < 0) this.issues.push({ field, message: `${label}은(는) 0% 이상이어야 해요.` });
    else if (opts.below100 ? v >= max : v > max)
      this.issues.push({
        field,
        message: `${label}은(는) ${max}%${opts.below100 ? " 미만" : " 이하"}이어야 해요.`,
      });
  }

  /** Returns empty/invalid result if any, else null → go on computing. */
  result<T>(): CalcResult<T> | null {
    if (this.missing.length) return empty(this.missing);
    if (this.issues.length) return invalid(this.issues);
    return null;
  }
}
