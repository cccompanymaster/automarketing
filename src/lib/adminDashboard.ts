// Admin main dashboard: KPIs, 14-day trend, this month's sales by product,
// and the per-unit cost (실비) table used for profit estimates.
//
// Costs are business-sensitive, so they live only in the database
// (public.product_costs, readable through admin RPCs) — never in this bundle.
// Demo numbers appear only when Supabase isn't configured.

import { getSupabase } from "@/lib/supabase";
import { catalogRows } from "@/lib/catalogSql";
import { PRICING } from "@/lib/pricing";

export interface DashboardKpi {
  revenueToday: number;
  ordersToday: number;
  revenueMonth: number;
  ordersMonth: number;
  revenuePrevMonth: number;
  chargesToday: number;
  chargesMonth: number;
  membersTotal: number;
  membersToday: number;
  membersMonth: number;
  /** Cash members hold and can still spend or ask back (a liability). */
  cashOutstanding: number;
  ordersReceived: number;
  ordersInProgress: number;
  depositsPending: number;
  receiptsToIssue: number;
  inquiriesNew: number;
  deliverablesWaiting: number;
  deliverablesRevision: number;
  /** Account passwords held for open orders (deleted when done/canceled). */
  secretsHeld: number;
}

export interface DashboardDay {
  date: string; // YYYY-MM-DD (KST)
  orders: number;
  revenue: number;
  charges: number;
  signups: number;
}

export interface ProductSales {
  name: string;
  orders: number;
  qty: number;
  revenue: number;
  hasCost: boolean;
  costMin: number | null;
  costMax: number | null;
}

export interface AdminDashboard {
  kpi: DashboardKpi;
  daily: DashboardDay[];
  productsMonth: ProductSales[];
}

export interface ProductCost {
  name: string;
  costMin: number;
  costMax: number;
  note?: string | null;
  updatedAt?: string;
}

/** A sellable row with its price and (when entered) its cost and profit per unit. */
export interface MarginRow {
  group: string;
  name: string;
  /** Price per unit (VAT excluded); null for 견적 rows. */
  price: number | null;
  unit?: string;
  cost?: ProductCost;
  profitMin?: number;
  profitMax?: number;
  /** Profit ÷ price at the worst cost, 0~1. */
  marginMin?: number;
  marginMax?: number;
}

const forbidden = (m: string) => (m.includes("forbidden") ? "관리자 권한이 없어요." : m);

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const sb = getSupabase();
  if (!sb) return DEMO_DASHBOARD;
  const { data, error } = await sb.rpc("admin_dashboard");
  if (error) throw new Error(forbidden(error.message));
  const d = data as AdminDashboard;
  return { kpi: d.kpi, daily: d.daily ?? [], productsMonth: d.productsMonth ?? [] };
}

export async function listProductCosts(): Promise<ProductCost[]> {
  const sb = getSupabase();
  if (!sb) return DEMO_COSTS;
  const { data, error } = await sb.rpc("admin_product_costs");
  if (error) throw new Error(forbidden(error.message));
  return (data ?? []) as ProductCost[];
}

/** Save a cost range (min = max for a fixed cost); `min = null` clears it. */
export async function setProductCost(name: string, min: number | null, max: number | null, note?: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.rpc("admin_set_product_cost", { p_name: name, p_min: min, p_max: max, p_note: note ?? null });
  if (error) throw new Error(error.message.includes("invalid_cost") ? "실비는 0 이상, 최대가 최소보다 크거나 같아야 해요." : forbidden(error.message));
}

/** Every product row (pricing groups + press categories + paid options) with its margin. */
export function marginRows(costs: ProductCost[]): MarginRow[] {
  const byName = new Map(costs.map((c) => [c.name, c]));
  const groupOf = new Map(PRICING.flatMap((g) => g.items.map((i) => [i.name, g.title] as const)));
  const unitOf = new Map(PRICING.flatMap((g) => g.items.map((i) => [i.name, i.unit] as const)));
  const orderable = catalogRows().map((r) => ({
    group: groupOf.get(r.name) ?? (r.name.includes(" + ") ? groupOf.get(r.name.split(" + ")[0]) ?? "옵션" : "언론보도 (카테고리)"),
    name: r.name,
    price: r.amountKrw as number | null,
    unit: unitOf.get(r.name) ?? unitOf.get(r.name.split(" + ")[0]),
  }));
  const quotes = PRICING.flatMap((g) => g.items.filter((i) => i.inquiry || i.amountKrw == null).map((i) => ({ group: g.title, name: i.name, price: null, unit: i.unit })));
  return [...orderable, ...quotes].map((r) => {
    const cost = byName.get(r.name);
    if (!cost || r.price == null) return { ...r, cost };
    const profitMin = r.price - cost.costMax;
    const profitMax = r.price - cost.costMin;
    return { ...r, cost, profitMin, profitMax, marginMin: profitMin / r.price, marginMax: profitMax / r.price };
  });
}

/** This month's estimated profit from orders of products with a cost on file. */
export function monthProfit(rows: ProductSales[]): { revenue: number; costedRevenue: number; profitMin: number; profitMax: number } {
  const costed = rows.filter((r) => r.hasCost);
  const costedRevenue = costed.reduce((s, r) => s + r.revenue, 0);
  return {
    revenue: rows.reduce((s, r) => s + r.revenue, 0),
    costedRevenue,
    profitMin: costedRevenue - costed.reduce((s, r) => s + (r.costMax ?? 0), 0),
    profitMax: costedRevenue - costed.reduce((s, r) => s + (r.costMin ?? 0), 0),
  };
}

// --- Demo data (stub mode only, flagged in the UI) ---------------------------------

// Made-up numbers (not the real costs — this file ships in the public bundle).
const DEMO_COSTS: ProductCost[] = [
  { name: "블로그 실명 배포", costMin: 600, costMax: 700, note: "예시" },
  { name: "블로그 최적 배포", costMin: 12_000, costMax: 14_000, note: "예시" },
];

const demoDays = (): DashboardDay[] => {
  const out: DashboardDay[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const k = (13 - i) % 5;
    out.push({ date: d.toISOString().slice(0, 10), orders: k + 1, revenue: (k + 1) * 23_000, charges: k % 2 ? 50_000 : 0, signups: k % 3 });
  }
  return out;
};

const DEMO_DASHBOARD: AdminDashboard = {
  kpi: {
    revenueToday: 69_900,
    ordersToday: 3,
    revenueMonth: 482_300,
    ordersMonth: 21,
    revenuePrevMonth: 401_000,
    chargesToday: 50_000,
    chargesMonth: 600_000,
    membersTotal: 128,
    membersToday: 2,
    membersMonth: 17,
    cashOutstanding: 240_000,
    ordersReceived: 4,
    ordersInProgress: 6,
    depositsPending: 1,
    receiptsToIssue: 1,
    inquiriesNew: 2,
    deliverablesWaiting: 1,
    deliverablesRevision: 0,
    secretsHeld: 1,
  },
  daily: demoDays(),
  productsMonth: [
    { name: "블로그 최적 배포", orders: 6, qty: 9, revenue: 179_100, hasCost: true, costMin: 108_000, costMax: 126_000 },
    { name: "블로그 실명 배포", orders: 4, qty: 60, revenue: 72_000, hasCost: true, costMin: 36_000, costMax: 42_000 },
    { name: "플레이스 영수증 리뷰", orders: 3, qty: 30, revenue: 30_000, hasCost: false, costMin: null, costMax: null },
  ],
};
