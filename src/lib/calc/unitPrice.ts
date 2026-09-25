// 단가 비교 계산기 — pure functions.
//
// Units: 개/g/kg/ml/L/장/롤/팩/박스 + 직접 입력. Mass (g↔kg) and volume
// (ml↔L) are converted to g / ml so A and B stay comparable; count units
// (개·장·롤·팩·박스) and custom labels only match themselves. Incompatible
// units → "impossible" with an explanation.
//
// 비교 기준 (display basis): 무게 → 100g (둘 다 kg이면 1kg), 부피 → 100ml
// (둘 다 L이면 1L), 개수류 → 1개/1장/…
//
// Simple mode: 단가 = 가격 ÷ 수량 (환산 후), no rounding.
//
// Detailed mode, per product (order of operations):
// 1) 상품 금액 = 가격 × 주문 수량 − 할인 (할인은 입력한 가격과 같은 기준 —
//    부가세 포함/별도 — 에서 한 번 빼요)
// 2) 부가세: 포함 → 금액 × r ÷ (1+r) 가 들어 있음, 별도 → 금액 × r 을 더 냄,
//    면세 → 0. r = rates VAT.
// 3) 배송비는 실제 결제액(부가세 포함)으로 입력; 과세 상품이면 같은 비율로
//    부가세가 들어 있다고 보고, 면세 상품이면 배송비도 면세로 봐요.
// 4) 현금 지출 = 상품 현금(별도면 +부가세) + 배송비
// 5) 공제 매입세액 = 매입세액 공제 체크 & 과세 상품일 때 (2)+(3)의 부가세, 아니면 0
// 6) 총 수량 = 수량 × 주문 수량, 사용 가능 수량 = 총 수량 × (1 − 폐기율)
// 7) 현금 지출 단가 = 현금 지출 ÷ 사용 가능 수량
//    실질 단가     = (현금 지출 − 공제 매입세액) ÷ 사용 가능 수량   ← 비교 기준
// 8) 월 사용량이 있으면: 재고 지속 개월 = 사용 가능 수량 ÷ 월 사용량,
//    월 실질 비용 = 월 사용량 × 실질 단가
// No intermediate rounding (VAT is not truncated); the page rounds for display.

import { Check, impossible, invalid, ok, type CalcResult } from "./types";
import { pct, safeDiv } from "./num";
import { VAT } from "./rates";

export type UnitKey = "ea" | "g" | "kg" | "ml" | "L" | "sheet" | "roll" | "pack" | "box" | "custom";

export const UNIT_OPTIONS: { value: UnitKey; label: string }[] = [
  { value: "ea", label: "개" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "L", label: "L" },
  { value: "sheet", label: "장" },
  { value: "roll", label: "롤" },
  { value: "pack", label: "팩" },
  { value: "box", label: "박스" },
  { value: "custom", label: "직접 입력" },
];

const UNIT_DEFS: Record<Exclude<UnitKey, "custom">, { dim: string; factor: number; label: string }> = {
  ea: { dim: "ea", factor: 1, label: "개" },
  g: { dim: "mass", factor: 1, label: "g" },
  kg: { dim: "mass", factor: 1000, label: "kg" },
  ml: { dim: "volume", factor: 1, label: "ml" },
  L: { dim: "volume", factor: 1000, label: "L" },
  sheet: { dim: "sheet", factor: 1, label: "장" },
  roll: { dim: "roll", factor: 1, label: "롤" },
  pack: { dim: "pack", factor: 1, label: "팩" },
  box: { dim: "box", factor: 1, label: "박스" },
};

export interface UnitSpec {
  unit: UnitKey;
  /** Label when unit is "custom" (e.g. "봉", "캔"). */
  custom?: string;
}

export interface ResolvedUnit {
  dim: string;
  /** Multiply an entered quantity by this to get base units (g / ml / 1). */
  factor: number;
  label: string;
  key: UnitKey;
}

/** null when a custom unit has no label yet. */
export function resolveUnit(spec: UnitSpec): ResolvedUnit | null {
  if (spec.unit === "custom") {
    const label = (spec.custom ?? "").trim();
    if (!label) return null;
    return { dim: `custom:${label}`, factor: 1, label, key: "custom" };
  }
  const d = UNIT_DEFS[spec.unit];
  return d ? { ...d, key: spec.unit } : null;
}

/** Human description of a unit's kind for the incompatibility message. */
export function dimName(u: ResolvedUnit): string {
  if (u.dim === "mass") return "무게(g·kg)";
  if (u.dim === "volume") return "부피(ml·L)";
  return `개수(${u.label})`;
}

export interface CompareBasis {
  dim: string;
  /** Base unit label (g / ml / 개 / …). */
  baseLabel: string;
  /** Display basis in base units (100 → "100g당"). */
  displayQty: number;
  /** e.g. "100g", "1kg", "1개". */
  displayLabel: string;
}

export function chooseBasis(a: ResolvedUnit, b: ResolvedUnit): CompareBasis {
  if (a.dim === "mass") {
    return a.key === "kg" && b.key === "kg"
      ? { dim: "mass", baseLabel: "g", displayQty: 1000, displayLabel: "1kg" }
      : { dim: "mass", baseLabel: "g", displayQty: 100, displayLabel: "100g" };
  }
  if (a.dim === "volume") {
    return a.key === "L" && b.key === "L"
      ? { dim: "volume", baseLabel: "ml", displayQty: 1000, displayLabel: "1L" }
      : { dim: "volume", baseLabel: "ml", displayQty: 100, displayLabel: "100ml" };
  }
  return { dim: a.dim, baseLabel: a.label, displayQty: 1, displayLabel: `1${a.label}` };
}

function incompatibleReason(a: ResolvedUnit, b: ResolvedUnit): string {
  return `상품 A는 ${dimName(a)}, 상품 B는 ${dimName(b)} 단위라 그대로는 비교할 수 없어요. 한 개(장·팩)의 무게나 용량을 확인해 두 상품을 같은 종류의 단위로 맞춰 입력해 주세요.`;
}

export type Cheaper = "a" | "b" | "same";

function pickCheaper(a: number, b: number): { cheaper: Cheaper; diff: number; diffRate: number } {
  const diff = Math.abs(a - b);
  const hi = Math.max(a, b);
  if (diff <= Math.max(1e-9, hi * 1e-9)) return { cheaper: "same", diff: 0, diffRate: 0 };
  return { cheaper: a < b ? "a" : "b", diff, diffRate: safeDiv(diff, hi) ?? 0 };
}

// ── Simple mode ─────────────────────────────────────────────

export interface SimpleProductInput {
  price: number | null;
  qty: number | null;
  unit: UnitSpec;
}

export interface SimpleProductResult {
  price: number;
  qty: number;
  unitLabel: string;
  qtyBase: number;
  perBase: number;
  perDisplay: number;
}

export interface SimpleComparison {
  basis: CompareBasis;
  a: SimpleProductResult;
  b: SimpleProductResult;
  cheaper: Cheaper;
  /** Difference per display basis. */
  diffPerDisplay: number;
  /** diff ÷ more expensive one's unit price. */
  diffRate: number;
}

const NAMES = { a: "상품 A", b: "상품 B" } as const;

function checkUnit(c: Check, p: "a" | "b", unit: UnitSpec): ResolvedUnit | null {
  const r = resolveUnit(unit);
  if (!r && unit.unit === "custom") c.missing.push(`${NAMES[p]} 단위 이름`);
  return r;
}

export function compareSimple(input: { a: SimpleProductInput; b: SimpleProductInput }): CalcResult<SimpleComparison> {
  const c = new Check();
  for (const p of ["a", "b"] as const) {
    const x = input[p];
    c.req(`${p}Price`, `${NAMES[p]} 가격`, x.price);
    c.req(`${p}Qty`, `${NAMES[p]} 수량`, x.qty);
    c.positive(`${p}Price`, `${NAMES[p]} 가격`, x.price);
    c.positive(`${p}Qty`, `${NAMES[p]} 수량`, x.qty);
  }
  const ua = checkUnit(c, "a", input.a.unit);
  const ub = checkUnit(c, "b", input.b.unit);
  const early = c.result<SimpleComparison>();
  if (early) return early;
  if (!ua || !ub) return impossible("단위를 선택해 주세요.");
  if (ua.dim !== ub.dim) return impossible(incompatibleReason(ua, ub));

  const basis = chooseBasis(ua, ub);
  const one = (x: SimpleProductInput, u: ResolvedUnit): SimpleProductResult => {
    const price = x.price as number;
    const qty = x.qty as number;
    const qtyBase = qty * u.factor;
    const perBase = price / qtyBase;
    return { price, qty, unitLabel: u.label, qtyBase, perBase, perDisplay: perBase * basis.displayQty };
  };
  const a = one(input.a, ua);
  const b = one(input.b, ub);
  const { cheaper, diff, diffRate } = pickCheaper(a.perBase, b.perBase);
  return ok({ basis, a, b, cheaper, diffPerDisplay: diff * basis.displayQty, diffRate });
}

// ── Detailed mode ───────────────────────────────────────────

export type VatType = "included" | "excluded" | "exempt";

export interface DetailedProductInput {
  /** 가격 (1묶음) */
  price: number | null;
  /** 1묶음에 든 수량 */
  qty: number | null;
  unit: UnitSpec;
  /** 주문 수량 (묶음 수, 비우면 1) */
  orderQty?: number | null;
  vatType: VatType;
  /** 배송비 (실제 결제액) */
  shipping?: number | null;
  /** 할인 (주문 1건 전체에서 빼는 금액) */
  discount?: number | null;
  /** 불량·폐기율 (%) */
  wastePct?: number | null;
  /** 매입세액 공제 받음 */
  deductible: boolean;
}

export interface DetailedProductResult {
  unitLabel: string;
  orderQty: number;
  goodsGross: number;
  discount: number;
  /** 가격 × 주문 수량 − 할인 (입력 기준 그대로) */
  goodsNet: number;
  /** 상품에 실제로 내는 돈 (별도면 부가세 더함) */
  goodsCash: number;
  shipping: number;
  cash: number;
  vatInCash: number;
  deductibleVat: number;
  effectiveCost: number;
  wasteRate: number;
  totalQtyBase: number;
  usableQtyBase: number;
  /** 폐기 반영 전, 현금 ÷ 총 수량 */
  nominalPerDisplay: number;
  cashPerDisplay: number;
  realPerDisplay: number;
  realPerBase: number;
  monthsLasting: number | null;
  monthlyCost: number | null;
}

export interface DetailedComparison {
  basis: CompareBasis;
  vatRate: number;
  a: DetailedProductResult;
  b: DetailedProductResult;
  cheaper: Cheaper;
  diffPerDisplay: number;
  diffRate: number;
  /** 월 사용량 (base units), null when not entered. */
  usageBase: number | null;
  /** 월 사용량 × 실질 단가 차이 */
  monthlySaving: number | null;
}

export interface DetailedInput {
  a: DetailedProductInput;
  b: DetailedProductInput;
  /** 월 사용량 (선택) */
  usage?: number | null;
  usageUnit?: UnitSpec;
}

export function compareDetailed(input: DetailedInput): CalcResult<DetailedComparison> {
  const c = new Check();
  for (const p of ["a", "b"] as const) {
    const x = input[p];
    const n = NAMES[p];
    c.req(`${p}Price`, `${n} 가격`, x.price);
    c.req(`${p}Qty`, `${n} 수량`, x.qty);
    c.positive(`${p}Price`, `${n} 가격`, x.price);
    c.positive(`${p}Qty`, `${n} 수량`, x.qty);
    c.positive(`${p}OrderQty`, `${n} 주문 수량`, x.orderQty ?? null);
    c.min(`${p}Shipping`, `${n} 배송비`, x.shipping ?? null, 0);
    c.min(`${p}Discount`, `${n} 할인`, x.discount ?? null, 0);
    c.percent(`${p}Waste`, `${n} 불량·폐기율`, x.wastePct ?? null, { below100: true });
    if (x.price != null && x.discount != null && x.discount > 0 && x.price > 0) {
      const gross = x.price * (x.orderQty != null && x.orderQty > 0 ? x.orderQty : 1);
      if (x.discount >= gross) c.issues.push({ field: `${p}Discount`, message: `${n} 할인은 상품 금액(가격 × 주문 수량)보다 작아야 해요.` });
    }
  }
  c.positive("usage", "월 사용량", input.usage ?? null);
  const ua = checkUnit(c, "a", input.a.unit);
  const ub = checkUnit(c, "b", input.b.unit);
  const usageUnit = input.usage != null ? resolveUnit(input.usageUnit ?? { unit: "ea" }) : null;
  if (input.usage != null && !usageUnit) c.missing.push("월 사용량 단위 이름");
  const early = c.result<DetailedComparison>();
  if (early) return early;
  if (!ua || !ub) return impossible("단위를 선택해 주세요.");
  if (ua.dim !== ub.dim) return impossible(incompatibleReason(ua, ub));
  if (usageUnit && usageUnit.dim !== ua.dim) {
    return invalid([
      { field: "usageUnit", message: `월 사용량 단위(${usageUnit.label})가 상품 단위(${dimName(ua)})와 달라요. 같은 종류의 단위로 입력해 주세요.` },
    ]);
  }

  const basis = chooseBasis(ua, ub);
  const r = VAT.value.rate;
  const usageBase = input.usage != null && usageUnit ? input.usage * usageUnit.factor : null;

  const one = (x: DetailedProductInput, u: ResolvedUnit): DetailedProductResult => {
    const orderQty = x.orderQty ?? 1;
    const goodsGross = (x.price as number) * orderQty;
    const discount = x.discount ?? 0;
    const goodsNet = goodsGross - discount;
    const shipping = x.shipping ?? 0;
    const taxable = x.vatType !== "exempt";
    const goodsCash = x.vatType === "excluded" ? goodsNet * (1 + r) : goodsNet;
    const goodsVat = x.vatType === "excluded" ? goodsNet * r : x.vatType === "included" ? (goodsNet * r) / (1 + r) : 0;
    const shippingVat = taxable ? (shipping * r) / (1 + r) : 0;
    const cash = goodsCash + shipping;
    const vatInCash = goodsVat + shippingVat;
    const deductibleVat = x.deductible && taxable ? vatInCash : 0;
    const effectiveCost = cash - deductibleVat;
    const wasteRate = pct(x.wastePct ?? 0);
    const totalQtyBase = (x.qty as number) * u.factor * orderQty;
    const usableQtyBase = totalQtyBase * (1 - wasteRate);
    const realPerBase = effectiveCost / usableQtyBase;
    return {
      unitLabel: u.label,
      orderQty,
      goodsGross,
      discount,
      goodsNet,
      goodsCash,
      shipping,
      cash,
      vatInCash,
      deductibleVat,
      effectiveCost,
      wasteRate,
      totalQtyBase,
      usableQtyBase,
      nominalPerDisplay: (cash / totalQtyBase) * basis.displayQty,
      cashPerDisplay: (cash / usableQtyBase) * basis.displayQty,
      realPerDisplay: realPerBase * basis.displayQty,
      realPerBase,
      monthsLasting: usageBase != null ? safeDiv(usableQtyBase, usageBase) : null,
      monthlyCost: usageBase != null ? usageBase * realPerBase : null,
    };
  };

  const a = one(input.a, ua);
  const b = one(input.b, ub);
  const { cheaper, diff, diffRate } = pickCheaper(a.realPerBase, b.realPerBase);
  const warnings: string[] = [];
  for (const p of ["a", "b"] as const) {
    const x = input[p];
    if (x.deductible && x.vatType === "exempt") warnings.push(`${NAMES[p]}는 면세라 공제받을 매입세액이 없어요.`);
  }
  if (a.monthsLasting != null && b.monthsLasting != null) {
    for (const p of ["a", "b"] as const) {
      const m = (p === "a" ? a : b).monthsLasting as number;
      if (m > 6) warnings.push(`${NAMES[p]}는 다 쓰는 데 ${m.toFixed(1)}개월이 걸려요. 유통기한·보관 공간도 함께 확인하세요.`);
    }
  }
  return ok(
    {
      basis,
      vatRate: r,
      a,
      b,
      cheaper,
      diffPerDisplay: diff * basis.displayQty,
      diffRate,
      usageBase,
      monthlySaving: usageBase != null ? diff * usageBase : null,
    },
    warnings,
  );
}
