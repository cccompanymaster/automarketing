// 창업 생존기간 계산기 — pure functions.
//
// Definitions:
// - 보유 현금: money you can actually move today (통장·현금). A deposit that
//   is already paid is NOT cash — enter it as 잠긴 보증금 and leave it out of
//   보유 현금.
// - 잠긴 보증금: tied up until the lease ends, so it never counts toward
//   가용 현금. If it hasn't been paid yet (it is still inside 보유 현금), set
//   `depositInCash` and it is subtracted, because it is about to be locked.
// - 가용 현금 = 보유 현금 − 비상금 − 아직 안 쓴 소모 창업비
//              − (depositInCash ? 잠긴 보증금 : 0)
// - 월 순현금 감소 = 월 영업 적자 + 생활비 + 대출 원금 상환 − 다른 수입
//   (이자는 영업 적자에 포함돼 있다고 가정).
//
// Status order: 가용 현금 ≤ 0 → "short" (이미 부족), else 월 순현금 감소 ≤ 0 →
// "stable" (현금이 줄지 않음), else "runway".
// Rounding: 개월 수 = 가용 ÷ 감소; shown as 소수 1자리 버림 and whole months
// (버림), each with a 1e-9 guard against float noise. Money is not rounded.

import { Check, ok, type CalcResult } from "./types";
import { RUNWAY_WARN_MONTHS } from "./rates/storeCosts";

export interface StartupRunwayInput {
  cash: number | null;
  emergency: number | null;
  lockedDeposit: number | null;
  /** true: 보증금을 아직 안 내서 보유 현금 안에 들어 있음 */
  depositInCash: boolean;
  /** 아직 지출하지 않은 소모성 창업비 (인테리어 잔금 등) */
  pendingStartupCost: number | null;
  monthlyLoss: number | null;
  living: number | null;
  loanPrincipal: number | null;
  otherIncome: number | null;
}

export type RunwayStatus = "short" | "stable" | "runway";

export interface StartupRunwayResult {
  status: RunwayStatus;
  cash: number;
  emergency: number;
  lockedDeposit: number;
  depositDeducted: number;
  pendingStartupCost: number;
  available: number;
  monthlyLoss: number;
  living: number;
  loanPrincipal: number;
  otherIncome: number;
  /** 월 순현금 감소 (음수면 매달 늘어남) */
  burn: number;
  /** runway only: 가용 ÷ 감소, 소수 1자리 버림 */
  months1: number | null;
  /** runway only: 버틸 수 있는 온전한 개월 수 */
  wholeMonths: number | null;
  /** runway only: 온전한 개월이 지난 뒤 남는 돈 */
  leftover: number | null;
}

export function startupRunway(input: StartupRunwayInput): CalcResult<StartupRunwayResult> {
  const c = new Check();
  const cash = c.req("cash", "보유 현금", input.cash);
  const monthlyLoss = c.req("monthlyLoss", "월 영업 적자", input.monthlyLoss);
  c.min("cash", "보유 현금", input.cash, 0);
  c.min("emergency", "비상금", input.emergency, 0);
  c.min("lockedDeposit", "잠긴 보증금", input.lockedDeposit, 0);
  c.min("pendingStartupCost", "남은 창업비", input.pendingStartupCost, 0);
  c.min("monthlyLoss", "월 영업 적자", input.monthlyLoss, 0);
  c.min("living", "월 생활비", input.living, 0);
  c.min("loanPrincipal", "월 대출 원금 상환", input.loanPrincipal, 0);
  c.min("otherIncome", "월 다른 수입", input.otherIncome, 0);
  const early = c.result<StartupRunwayResult>();
  if (early) return early;

  const v = (n: number | null) => n ?? 0;
  const emergency = v(input.emergency);
  const lockedDeposit = v(input.lockedDeposit);
  const depositDeducted = input.depositInCash ? lockedDeposit : 0;
  const pendingStartupCost = v(input.pendingStartupCost);
  const living = v(input.living);
  const loanPrincipal = v(input.loanPrincipal);
  const otherIncome = v(input.otherIncome);

  const available = cash - emergency - pendingStartupCost - depositDeducted;
  const burn = monthlyLoss + living + loanPrincipal - otherIncome;

  const base = {
    cash,
    emergency,
    lockedDeposit,
    depositDeducted,
    pendingStartupCost,
    available,
    monthlyLoss,
    living,
    loanPrincipal,
    otherIncome,
    burn,
    months1: null,
    wholeMonths: null,
    leftover: null,
  };

  const warnings: string[] = [];
  if (available <= 0) {
    if (burn <= 0) warnings.push("매달 현금이 줄지는 않지만, 지금 가용 현금이 없어 예상치 못한 지출에 대응하기 어려워요.");
    return ok({ ...base, status: "short" }, warnings);
  }
  if (burn <= 0) {
    return ok({ ...base, status: "stable" }, warnings);
  }

  const exact = available / burn;
  const months1 = Math.floor(exact * 10 + 1e-9) / 10;
  const wholeMonths = Math.floor(exact + 1e-9);
  const leftover = available - burn * wholeMonths;
  if (months1 < RUNWAY_WARN_MONTHS.value.months) {
    warnings.push(`버틸 수 있는 기간이 ${RUNWAY_WARN_MONTHS.value.months}개월 미만이에요. 적자를 줄이거나 자금 계획을 먼저 세우세요.`);
  }
  return ok({ ...base, status: "runway", months1, wholeMonths, leftover: Math.abs(leftover) < 1e-6 ? 0 : leftover }, warnings);
}
