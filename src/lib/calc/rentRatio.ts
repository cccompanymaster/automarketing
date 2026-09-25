// 임대료 비율 계산기 — pure functions.
//
// Calculation order & rounding:
// 1) 점유비용 = 월 임대료 + 월 관리비 (관리비 미입력 = 0).
// 2) 임대료 비율(관리비 포함) = 점유비용 ÷ 월 매출; 임대료만 비율 = 월 임대료 ÷ 월 매출.
//    Ratios are kept in full precision (display rounds to 0.1%).
// 3) 부담 구간 = first band in RENT_BURDEN_BANDS whose `max` ≥ ratio (inclusive,
//    with a 1e-12 tolerance so 10.0% lands in 양호).
// 4) 양호 구간 필요 매출 = 점유비용 ÷ 양호 상한, rounded UP to whole won so the
//    ratio at that sales level is never above the bound.
// 매출 0 → impossible (division by zero); negatives → invalid.

import { Check, impossible, ok, type CalcResult } from "./types";
import { RENT_BURDEN_BANDS } from "./rates/storeCosts";

export interface RentRatioInput {
  /** 월 매출 */
  sales: number | null;
  /** 월 임대료 */
  rent: number | null;
  /** 월 관리비 (선택) */
  maintenance: number | null;
}

export type RentBand = (typeof RENT_BURDEN_BANDS.value.bands)[number];

export interface RentRatioResult {
  sales: number;
  rent: number;
  maintenance: number;
  occupancy: number;
  /** (임대료 + 관리비) ÷ 매출 */
  ratio: number;
  /** 임대료 ÷ 매출 */
  rentOnlyRatio: number;
  band: RentBand;
  /** Sales needed for the ratio to fall into the first (양호) band. */
  salesForGood: number;
  goodMax: number;
}

const EPS = 1e-12;

export function bandFor(ratio: number): RentBand {
  const bands = RENT_BURDEN_BANDS.value.bands;
  return bands.find((b) => b.max == null || ratio <= b.max + EPS) ?? bands[bands.length - 1];
}

export function rentRatio(input: RentRatioInput): CalcResult<RentRatioResult> {
  const c = new Check();
  const sales = c.req("sales", "월 매출", input.sales);
  const rent = c.req("rent", "월 임대료", input.rent);
  c.min("sales", "월 매출", input.sales, 0);
  c.min("rent", "월 임대료", input.rent, 0);
  c.min("maintenance", "월 관리비", input.maintenance, 0);
  const early = c.result<RentRatioResult>();
  if (early) return early;

  const maintenance = input.maintenance ?? 0;
  const occupancy = rent + maintenance;
  if (sales === 0) {
    return impossible<RentRatioResult>("월 매출이 0원이면 매출 대비 비율을 계산할 수 없어요. 예상 매출이라도 입력해 주세요.", {
      rent,
      maintenance,
      occupancy,
    });
  }

  const ratio = occupancy / sales;
  const rentOnlyRatio = rent / sales;
  const goodMax = RENT_BURDEN_BANDS.value.bands[0].max ?? 0.1;
  const salesForGood = Math.ceil(occupancy / goodMax - 1e-9);

  const warnings: string[] = [];
  if (occupancy === 0) warnings.push("임대료와 관리비가 모두 0원이에요. 자가 매장이라면 비율 진단은 참고만 하세요.");
  if (ratio >= 1) warnings.push("임대료가 매출 이상이에요. 매출만으로는 임대료도 낼 수 없는 상태예요.");
  if (input.maintenance == null) warnings.push("관리비를 입력하지 않아 임대료만으로 계산했어요. 관리비가 있다면 넣어야 실제 부담이 보여요.");

  return ok(
    {
      sales,
      rent,
      maintenance,
      occupancy,
      ratio,
      rentOnlyRatio,
      band: bandFor(ratio),
      salesForGood: salesForGood === 0 ? 0 : salesForGood,
      goodMax,
    },
    warnings,
  );
}
