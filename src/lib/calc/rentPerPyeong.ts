// 평당 임대료 계산기 — pure functions.
//
// Calculation order & rounding:
// 1) 면적 환산: ㎡ = 평 × AREA.m2PerPyeong, 평 = ㎡ ÷ AREA.m2PerPyeong
//    (full precision; display shows 2 decimals).
// 2) 평당 임대료 = 월세 ÷ 평, ㎡당 임대료 = 월세 ÷ ㎡.
// 3) 관리비를 넣으면 (월세 + 관리비) 기준 평당·㎡당 금액도 함께 계산.
// Money stays unrounded here; pages round to whole won only for display
// (원 단위 반올림). 면적 0 or negative → invalid.

import { Check, ok, type CalcResult } from "./types";
import { AREA } from "./rates";

export type AreaUnit = "pyeong" | "m2";

export interface RentPerPyeongInput {
  unit: AreaUnit;
  /** 면적 (unit 기준) */
  area: number | null;
  /** 월세 */
  rent: number | null;
  /** 월 관리비 (선택) */
  maintenance: number | null;
}

export interface RentPerPyeongResult {
  pyeong: number;
  m2: number;
  m2PerPyeong: number;
  rent: number;
  maintenance: number;
  rentPerPyeong: number;
  rentPerM2: number;
  /** (월세 + 관리비) 기준 */
  totalPerPyeong: number;
  totalPerM2: number;
}

export function pyeongToM2(pyeong: number): number {
  return pyeong * AREA.value.m2PerPyeong;
}

export function m2ToPyeong(m2: number): number {
  return m2 / AREA.value.m2PerPyeong;
}

export function rentPerPyeong(input: RentPerPyeongInput): CalcResult<RentPerPyeongResult> {
  const c = new Check();
  const area = c.req("area", "면적", input.area);
  const rent = c.req("rent", "월세", input.rent);
  c.positive("area", "면적", input.area);
  c.min("rent", "월세", input.rent, 0);
  c.min("maintenance", "월 관리비", input.maintenance, 0);
  const early = c.result<RentPerPyeongResult>();
  if (early) return early;

  const maintenance = input.maintenance ?? 0;
  const pyeong = input.unit === "m2" ? m2ToPyeong(area) : area;
  const m2 = input.unit === "m2" ? area : pyeongToM2(area);
  const total = rent + maintenance;

  const warnings: string[] = [];
  if (rent === 0) warnings.push("월세가 0원이라 평당 임대료도 0원이에요.");

  return ok(
    {
      pyeong,
      m2,
      m2PerPyeong: AREA.value.m2PerPyeong,
      rent,
      maintenance,
      rentPerPyeong: rent / pyeong,
      rentPerM2: rent / m2,
      totalPerPyeong: total / pyeong,
      totalPerM2: total / m2,
    },
    warnings,
  );
}
