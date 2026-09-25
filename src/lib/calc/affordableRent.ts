// 적정 임대료 계산기 — pure functions.
//
// Calculation order & rounding:
// 1) 점유비용 예산 = 예상 월매출 × 목표 비율 (computed as sales × pct ÷ 100
//    to avoid 0.1-style float noise).
// 2) 관리비 포함 기준이면 감당 가능한 월세 = 예산 − 월 관리비,
//    아니면 감당 가능한 월세 = 예산 (관리비는 별도로 더 나간다고 안내).
// 3) 월세·예산은 원 단위 절사 (floor, with a 1e-6 guard) so the rent never
//    exceeds the target ratio.
// 4) 비교표: AFFORDABLE_RENT_PRESETS의 비율마다 같은 방식으로 계산.
// 관리비가 예산 이상 → impossible (월세로 쓸 수 있는 돈이 없음).

import { Check, impossible, ok, type CalcResult } from "./types";
import { AFFORDABLE_RENT_PRESETS, RENT_BURDEN_BANDS } from "./rates/storeCosts";

export interface AffordableRentInput {
  /** 예상 월매출 */
  sales: number | null;
  /** 목표 임대료 비율 (%) */
  targetPct: number | null;
  /** true: 목표 비율 안에 관리비까지 포함 */
  includeMaintenance: boolean;
  /** 월 관리비 (선택, includeMaintenance일 때만 차감) */
  maintenance: number | null;
}

export interface AffordableRentRow {
  pct: number;
  budget: number;
  rent: number;
}

export interface AffordableRentResult {
  sales: number;
  targetPct: number;
  includeMaintenance: boolean;
  maintenance: number;
  /** 매출 × 비율 (점유비용 예산, 절사) */
  budget: number;
  /** 감당 가능한 월세 (절사) */
  rent: number;
  /** 관리비 별도 기준일 때 실제 총 부담 = 월세 + 관리비 */
  totalOutlay: number;
  /** totalOutlay ÷ sales */
  totalRatio: number;
  table: AffordableRentRow[];
}

const floorWon = (n: number) => {
  const r = Math.floor(n + 1e-6);
  return r === 0 ? 0 : r;
};

function rowFor(sales: number, pct: number, includeMaintenance: boolean, maintenance: number): AffordableRentRow {
  const budget = floorWon((sales * pct) / 100);
  const rent = includeMaintenance ? Math.max(0, budget - maintenance) : budget;
  return { pct, budget, rent };
}

export function affordableRent(input: AffordableRentInput): CalcResult<AffordableRentResult> {
  const c = new Check();
  const sales = c.req("sales", "예상 월매출", input.sales);
  const targetPct = c.req("targetPct", "목표 임대료 비율", input.targetPct);
  c.positive("sales", "예상 월매출", input.sales);
  if (input.targetPct != null && input.targetPct <= 0) {
    c.issues.push({ field: "targetPct", message: "목표 임대료 비율은(는) 0%보다 커야 해요." });
  } else {
    c.percent("targetPct", "목표 임대료 비율", input.targetPct, { below100: true });
  }
  c.min("maintenance", "월 관리비", input.maintenance, 0);
  const early = c.result<AffordableRentResult>();
  if (early) return early;

  const maintenance = input.maintenance ?? 0;
  const inc = input.includeMaintenance;
  const main = rowFor(sales, targetPct, inc, maintenance);

  if (inc && maintenance >= main.budget) {
    return impossible<AffordableRentResult>(
      `관리비(${maintenance.toLocaleString("ko-KR")}원)가 목표 비율로 쓸 수 있는 예산(${main.budget.toLocaleString("ko-KR")}원) 이상이라 월세로 쓸 수 있는 돈이 남지 않아요. 목표 비율이나 예상 매출을 다시 확인해 주세요.`,
      { sales, targetPct, budget: main.budget, maintenance },
    );
  }

  const totalOutlay = main.rent + maintenance;
  const table = AFFORDABLE_RENT_PRESETS.value.ratiosPct.map((p) => rowFor(sales, p, inc, maintenance));

  const warnings: string[] = [];
  const cautionMax = RENT_BURDEN_BANDS.value.bands.find((b) => b.key === "caution")?.max;
  if (cautionMax != null && targetPct / 100 > cautionMax + 1e-12) {
    warnings.push(`목표 비율 ${targetPct}%는 참고 기준(${Math.round(cautionMax * 100)}%)보다 높아요. 이익이 남지 않을 수 있어요.`);
  }
  if (!inc && maintenance > 0) {
    warnings.push("관리비를 별도로 계산했기 때문에 실제 매월 나가는 돈은 월세 + 관리비예요.");
  }

  return ok(
    {
      sales,
      targetPct,
      includeMaintenance: inc,
      maintenance,
      budget: main.budget,
      rent: main.rent,
      totalOutlay,
      totalRatio: totalOutlay / sales,
      table,
    },
    warnings,
  );
}
