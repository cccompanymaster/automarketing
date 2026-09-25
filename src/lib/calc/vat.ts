// 부가세 계산기 (일반과세자 10%) — pure functions.
//
// A) 합계금액 → 공급가액·부가세:
//    공급가액 = 합계 ÷ (1 + 10%) → 원 단위 반올림; 부가세 = 합계 − 공급가액
//    (차감으로 구해 공급가액 + 부가세가 항상 합계와 정확히 같아요).
// B) 공급가액 → 부가세·합계:
//    부가세 = 공급가액 × 10% → 원 미만 절사 (세금계산서 작성 시 흔한 처리);
//    합계 = 공급가액 + 부가세.
// Inputs are whole won in practice; decimals are accepted and carried as typed.

import { Check, ok, type CalcResult } from "./types";
import { floorTo, roundWon } from "./num";
import { VAT } from "./rates";

export interface VatFigures {
  total: number;
  supply: number;
  vat: number;
  rate: number;
  /** Exact (unrounded) counterpart for the formula display. */
  exact: number;
}

export function vatFromTotal(input: { total: number | null }): CalcResult<VatFigures> {
  const c = new Check();
  const total = c.req("total", "합계금액", input.total);
  c.positive("total", "합계금액", input.total);
  const early = c.result<VatFigures>();
  if (early) return early;

  const rate = VAT.value.rate;
  const exact = total / (1 + rate);
  const supply = roundWon(exact);
  return ok({ total, supply, vat: total - supply, rate, exact });
}

export function vatFromSupply(input: { supply: number | null }): CalcResult<VatFigures> {
  const c = new Check();
  const supply = c.req("supply", "공급가액", input.supply);
  c.positive("supply", "공급가액", input.supply);
  const early = c.result<VatFigures>();
  if (early) return early;

  const rate = VAT.value.rate;
  const exact = supply * rate;
  // +1e-6 guards float noise (e.g. 0.1 × 3 = 0.30000000000000004 is fine, 29.999… is not).
  const vat = floorTo(exact + 1e-6, 1);
  return ok({ total: supply + vat, supply, vat, rate, exact });
}
