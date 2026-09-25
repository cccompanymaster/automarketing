// 월 고정비 계산기 — pure functions.
//
// Calculation order & rounding (sums of whole-won inputs, no rounding needed;
// 비중 is a ratio shown to 1 decimal by the page):
// 1) 월 현금 유출 = 모든 항목의 합 (대출 원금 상환 포함)
// 2) 손익 기준 고정비 = 월 현금 유출 − 대출 원금 상환
//    (원금 상환은 빚을 갚는 돈이지 비용이 아니므로 손익분기·이익 계산에서는
//    빼고, 통장에서 나가는 돈에만 포함)
// 3) 항목별 비중 = 항목 ÷ 월 현금 유출 (모든 항목이 같은 기준으로 합이 100%)
// 4) 연간 = 월 × 12
// Empty items are treated as 0; if every item is empty → "empty"; if the
// total is 0 → "impossible" (비중을 나눌 수 없음).

import { Check, impossible, ok, type CalcResult } from "./types";
import { safeDiv } from "./num";

export const FIXED_COST_ITEMS = [
  { key: "rent", label: "임대료" },
  { key: "maintenance", label: "관리비" },
  { key: "labor", label: "인건비" },
  { key: "utilities", label: "공과금(전기·가스·수도)" },
  { key: "insurance", label: "보험료" },
  { key: "loanInterest", label: "대출 이자" },
  { key: "loanPrincipal", label: "대출 원금 상환" },
  { key: "subscriptions", label: "구독·통신·POS" },
  { key: "other", label: "기타" },
] as const;

export type FixedCostKey = (typeof FIXED_COST_ITEMS)[number]["key"];
export type FixedCostInput = Partial<Record<FixedCostKey, number | null>>;

export interface FixedCostLine {
  key: FixedCostKey;
  label: string;
  amount: number;
  /** amount ÷ 월 현금 유출 */
  share: number;
  /** true for 대출 원금 — cash only, not an expense. */
  cashOnly: boolean;
}

export interface FixedCostResult {
  cashOutflow: number;
  accountingFixed: number;
  principal: number;
  annualCash: number;
  annualAccounting: number;
  /** All items in input order (including 0원 items). */
  lines: FixedCostLine[];
  /** Non-zero items sorted by amount, largest first. */
  ranked: FixedCostLine[];
}

export function calcFixedCost(input: FixedCostInput): CalcResult<FixedCostResult> {
  const c = new Check();
  let filled = 0;
  for (const it of FIXED_COST_ITEMS) {
    const v = input[it.key] ?? null;
    if (v != null) filled++;
    c.min(it.key, it.label, v, 0);
  }
  if (filled === 0) c.missing.push("고정비 항목 1개 이상");
  const early = c.result<FixedCostResult>();
  if (early) return early;

  const amount = (k: FixedCostKey) => input[k] ?? 0;
  const cashOutflow = FIXED_COST_ITEMS.reduce((s, it) => s + amount(it.key), 0);
  const principal = amount("loanPrincipal");
  const accountingFixed = cashOutflow - principal;

  if (cashOutflow === 0) {
    return impossible<FixedCostResult>("입력한 항목이 모두 0원이라 합계가 0원이에요. 매달 나가는 금액을 한 가지 이상 입력하면 비중을 보여드려요.", {
      cashOutflow: 0,
      accountingFixed: 0,
    });
  }

  const lines: FixedCostLine[] = FIXED_COST_ITEMS.map((it) => ({
    key: it.key,
    label: it.label,
    amount: amount(it.key),
    share: safeDiv(amount(it.key), cashOutflow) ?? 0,
    cashOnly: it.key === "loanPrincipal",
  }));
  const ranked = lines.filter((l) => l.amount > 0).sort((a, b) => b.amount - a.amount);

  const warnings: string[] = [];
  const top = ranked[0];
  if (top && top.share >= 0.5 && ranked.length > 1) {
    warnings.push(`고정비의 절반 이상(${Math.round(top.share * 100)}%)이 ${top.label} 항목에서 나가요. 이 항목을 줄이는 게 가장 효과가 커요.`);
  }

  return ok(
    {
      cashOutflow,
      accountingFixed,
      principal,
      annualCash: cashOutflow * 12,
      annualAccounting: accountingFixed * 12,
      lines,
      ranked,
    },
    warnings,
  );
}
