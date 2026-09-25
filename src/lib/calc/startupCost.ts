// 창업비용 계산기 — pure functions.
//
// Money is split into four buckets that add up to 초기 필요 현금:
// - 회수 가능 보증금: 보증금 (계약 종료 시 돌려받는 돈 — 원상복구·미납 차감 전).
// - 회수 불확실 권리금: 권리금. It is neither guaranteed back (a new tenant
//   must pay it when you leave) nor strictly consumed, so it is its own line
//   and is NOT part of the 예비비 base.
// - 소모 비용: 인테리어 + 기기·설비 + 초도 재료 + 가맹비 + 인허가 + 마케팅 + 기타
//   (+ 예비비 = 소모 비용 × 예비비율 — only consumable costs carry overrun risk).
// - 운영자금: 월 운영비 × 버틸 개월 수.
//
// Rounding: 예비비 is rounded UP to whole won (원 단위 올림 — conservative for a
// cash plan). Every other figure is a sum/product of whole-won inputs and is
// not rounded. All money inputs are optional (empty = 0), but at least one
// must be entered.

import { Check, empty, ok, type CalcResult } from "./types";

export interface StartupCostInput {
  deposit: number | null;
  premium: number | null;
  interior: number | null;
  equipment: number | null;
  initialStock: number | null;
  franchiseFee: number | null;
  permits: number | null;
  marketing: number | null;
  other: number | null;
  /** 공사·소모 비용 예비비율 (%) */
  contingencyPct: number | null;
  monthlyOpex: number | null;
  months: number | null;
}

export const CONSUMABLE_KEYS = ["interior", "equipment", "initialStock", "franchiseFee", "permits", "marketing", "other"] as const;
export type ConsumableKey = (typeof CONSUMABLE_KEYS)[number];

export const CONSUMABLE_LABELS: Record<ConsumableKey, string> = {
  interior: "인테리어·공사",
  equipment: "기기·설비",
  initialStock: "초도 재료·상품",
  franchiseFee: "가맹비·교육비",
  permits: "인허가·등록",
  marketing: "오픈 마케팅",
  other: "기타",
};

export interface StartupCostResult {
  deposit: number;
  premium: number;
  consumables: { key: ConsumableKey; label: string; amount: number }[];
  consumableTotal: number;
  contingencyPct: number;
  contingency: number;
  monthlyOpex: number;
  months: number;
  operating: number;
  /** 보증금 + 권리금 + 소모 비용 + 예비비 + 운영자금 */
  total: number;
  /** 소모 비용 + 예비비 (돌려받지 못하는 돈) */
  sunk: number;
}

export function startupCost(input: StartupCostInput): CalcResult<StartupCostResult> {
  const moneyFields: [keyof StartupCostInput, string][] = [
    ["deposit", "보증금"],
    ["premium", "권리금"],
    ...CONSUMABLE_KEYS.map((k) => [k, CONSUMABLE_LABELS[k]] as [keyof StartupCostInput, string]),
    ["monthlyOpex", "월 운영비"],
  ];
  const anyEntered = moneyFields.some(([k]) => input[k] != null);
  if (!anyEntered) return empty(["보증금·인테리어 등 비용 항목 중 하나 이상"]);

  const c = new Check();
  for (const [k, label] of moneyFields) c.min(k, label, input[k], 0);
  c.percent("contingencyPct", "예비비율", input.contingencyPct);
  c.min("months", "버틸 개월 수", input.months, 0);
  if (input.months != null && input.months >= 0 && !Number.isInteger(input.months)) {
    c.issues.push({ field: "months", message: "버틸 개월 수는 정수(개월)로 입력해 주세요." });
  }
  const early = c.result<StartupCostResult>();
  if (early) return early;

  const v = (n: number | null) => n ?? 0;
  const consumables = CONSUMABLE_KEYS.map((key) => ({ key, label: CONSUMABLE_LABELS[key], amount: v(input[key]) }));
  const consumableTotal = consumables.reduce((s, x) => s + x.amount, 0);
  const contingencyPct = v(input.contingencyPct);
  const rawContingency = (consumableTotal * contingencyPct) / 100;
  const contingency = rawContingency === 0 ? 0 : Math.ceil(rawContingency - 1e-9);
  const monthlyOpex = v(input.monthlyOpex);
  const months = v(input.months);
  const operating = monthlyOpex * months;
  const deposit = v(input.deposit);
  const premium = v(input.premium);
  const total = deposit + premium + consumableTotal + contingency + operating;

  const warnings: string[] = [];
  if (monthlyOpex > 0 && months === 0) warnings.push("버틸 개월 수를 넣지 않아 운영자금이 0원으로 잡혔어요. 최소 몇 달치 운영비는 따로 준비하세요.");
  if (months > 0 && monthlyOpex === 0) warnings.push("월 운영비를 넣지 않아 운영자금이 0원으로 잡혔어요.");
  if (consumableTotal > 0 && contingencyPct === 0) warnings.push("예비비가 0%예요. 공사·설비 비용은 계획보다 늘어나는 경우가 많아요.");
  if (premium > 0) warnings.push("권리금은 나중에 다음 임차인에게서 받아야 돌려받을 수 있어 회수가 확실하지 않아요.");

  return ok(
    {
      deposit,
      premium,
      consumables,
      consumableTotal,
      contingencyPct,
      contingency,
      monthlyOpex,
      months,
      operating,
      total,
      sunk: consumableTotal + contingency,
    },
    warnings,
  );
}
