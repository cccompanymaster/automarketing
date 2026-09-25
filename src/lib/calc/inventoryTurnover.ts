// 재고 회전율 계산기 — pure functions.
//
// Calculation order & rounding (ratios/days are not rounded here; the page
// shows 회전율 to 2 decimals and 회전일수 to 1 decimal):
// 1) 평균 재고 = (기초 재고 + 기말 재고) ÷ 2   (금액, 원가 기준)
// 2) 재고 회전율 = 기간 매출원가 ÷ 평균 재고   (평균 재고 0 → impossible)
// 3) 재고 회전일수 = 기간 일수 ÷ 회전율
//    기간 일수: 월 30일, 분기 91일, 연 365일 (달력 평균에 가까운 단순값)
// 4) 연 환산 회전율 = 회전율 × 연간 기간 수 (월 12, 분기 4, 연 1)
//    — 계절성 없이 같은 속도가 1년 내내 이어진다고 가정.

import { Check, impossible, ok, type CalcResult } from "./types";

export type TurnoverPeriod = "month" | "quarter" | "year";

export const PERIODS: Record<TurnoverPeriod, { label: string; days: number; perYear: number }> = {
  month: { label: "월", days: 30, perYear: 12 },
  quarter: { label: "분기", days: 91, perYear: 4 },
  year: { label: "연간", days: 365, perYear: 1 },
};

export interface InventoryTurnoverInput {
  period: TurnoverPeriod;
  /** 기간 매출원가 */
  cogs: number | null;
  beginInventory: number | null;
  endInventory: number | null;
}

export interface InventoryTurnoverResult {
  period: TurnoverPeriod;
  periodDays: number;
  cogs: number;
  beginInventory: number;
  endInventory: number;
  avgInventory: number;
  turnover: number;
  days: number;
  annualTurnover: number;
}

export function calcInventoryTurnover(input: InventoryTurnoverInput): CalcResult<InventoryTurnoverResult> {
  const c = new Check();
  const cogs = c.req("cogs", "매출원가", input.cogs);
  const begin = c.req("beginInventory", "기초 재고", input.beginInventory);
  const end = c.req("endInventory", "기말 재고", input.endInventory);
  c.positive("cogs", "매출원가", input.cogs);
  c.min("beginInventory", "기초 재고", input.beginInventory, 0);
  c.min("endInventory", "기말 재고", input.endInventory, 0);
  const early = c.result<InventoryTurnoverResult>();
  if (early) return early;

  const p = PERIODS[input.period] ?? PERIODS.month;
  const avgInventory = (begin + end) / 2;
  if (avgInventory === 0) {
    return impossible<InventoryTurnoverResult>(
      "기초·기말 재고가 모두 0원이라 평균 재고가 0원이에요. 0으로 나눌 수 없어 회전율을 계산할 수 없어요. 재고를 쌓지 않고 바로 파는 구조라면 이 지표가 맞지 않아요.",
      { avgInventory: 0, cogs },
    );
  }
  const turnover = cogs / avgInventory;
  const days = p.days / turnover;

  const warnings: string[] = [];
  if (begin === 0 || end === 0) warnings.push("기초나 기말 재고 중 하나가 0원이라 평균 재고가 실제보다 작게 잡혔을 수 있어요. 가능하면 월별 재고를 평균해 보세요.");
  if (cogs > 0 && days > p.days * 3) warnings.push(`재고가 팔려 나가는 데 ${Math.round(days)}일이 걸려 계산 기간(${p.days}일)의 3배를 넘어요. 오래된 재고·과다 발주를 점검해 보세요.`);

  return ok(
    {
      period: input.period,
      periodDays: p.days,
      cogs,
      beginInventory: begin,
      endInventory: end,
      avgInventory,
      turnover,
      days,
      annualTurnover: turnover * p.perYear,
    },
    warnings,
  );
}
