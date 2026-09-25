// 폐업비용 계산기 — pure functions.
//
// Calculation order:
// 1) 지출 합계 = 철거·원상복구 + 위약금 + 퇴직금 + 미납금 + 대출 잔액 + 기타.
// 2) 회수 합계 = 보증금 반환 + 권리금 + 설비·집기 매각 + 재고 처분.
// 3) 최종 = 회수 합계 − 지출 합계 (> 0 남는 돈, < 0 부족액, 0 딱 맞음).
// All inputs are whole won, optional (empty = 0) and ≥ 0; at least one must be
// entered. No rounding is applied — sums of whole-won inputs stay exact.

import { Check, empty, ok, type CalcResult } from "./types";

export const CLOSING_EXPENSES = [
  { key: "demolition", label: "철거·원상복구비" },
  { key: "penalty", label: "임대차·계약 위약금" },
  { key: "severance", label: "직원 퇴직금·미지급 임금" },
  { key: "unpaid", label: "미납금 (임대료·공과금·세금·거래처)" },
  { key: "loanBalance", label: "대출 잔액" },
  { key: "otherExpense", label: "기타 비용" },
] as const;

export const CLOSING_RECOVERIES = [
  { key: "deposit", label: "보증금 반환" },
  { key: "premium", label: "권리금 회수" },
  { key: "equipment", label: "설비·집기 매각" },
  { key: "inventory", label: "재고 처분" },
] as const;

export type ClosingExpenseKey = (typeof CLOSING_EXPENSES)[number]["key"];
export type ClosingRecoveryKey = (typeof CLOSING_RECOVERIES)[number]["key"];
export type ClosingCostInput = Record<ClosingExpenseKey | ClosingRecoveryKey, number | null>;

export interface ClosingLine {
  key: string;
  label: string;
  amount: number;
}

export interface ClosingCostResult {
  expenses: ClosingLine[];
  recoveries: ClosingLine[];
  expenseTotal: number;
  recoveryTotal: number;
  /** 회수 − 지출 */
  net: number;
  outcome: "surplus" | "shortfall" | "even";
}

export function closingCost(input: ClosingCostInput): CalcResult<ClosingCostResult> {
  const all = [...CLOSING_EXPENSES, ...CLOSING_RECOVERIES];
  if (!all.some((f) => input[f.key] != null)) return empty(["지출 또는 회수 항목 중 하나 이상"]);

  const c = new Check();
  for (const f of all) c.min(f.key, f.label, input[f.key], 0);
  const early = c.result<ClosingCostResult>();
  if (early) return early;

  const expenses = CLOSING_EXPENSES.map((f) => ({ key: f.key, label: f.label, amount: input[f.key] ?? 0 }));
  const recoveries = CLOSING_RECOVERIES.map((f) => ({ key: f.key, label: f.label, amount: input[f.key] ?? 0 }));
  const expenseTotal = expenses.reduce((s, x) => s + x.amount, 0);
  const recoveryTotal = recoveries.reduce((s, x) => s + x.amount, 0);
  const net = recoveryTotal - expenseTotal;

  const warnings: string[] = [];
  if ((input.premium ?? 0) > 0) warnings.push("권리금은 새 임차인과 계약이 성사돼야 받을 수 있어요. 받지 못하면 최종 금액이 그만큼 줄어요.");
  if ((input.deposit ?? 0) > 0 && (input.demolition ?? 0) === 0) {
    warnings.push("보증금은 원상복구비·밀린 임대료를 빼고 돌려받는 경우가 많아요. 철거·원상복구비가 0원이 맞는지 확인하세요.");
  }
  if ((input.equipment ?? 0) > 0 || (input.inventory ?? 0) > 0) {
    warnings.push("중고 설비·재고는 매입가보다 훨씬 낮게 팔리는 경우가 많으니 보수적으로 잡으세요.");
  }

  return ok(
    {
      expenses,
      recoveries,
      expenseTotal,
      recoveryTotal,
      net,
      outcome: net > 0 ? "surplus" : net < 0 ? "shortfall" : "even",
    },
    warnings,
  );
}
