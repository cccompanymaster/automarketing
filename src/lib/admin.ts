// Admin domain — gating + data access for the admin-only dashboard (/admin).
//
// Gating: an email allowlist from NEXT_PUBLIC_ADMIN_EMAILS (comma-separated).
// That client-side check only hides the UI. The real boundary is server-side:
// admin_overview / admin_update_order_status are security-definer RPCs that
// refuse anyone not in public.admin_users (is_admin()).

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { socialProviderFromSupabase } from "@/lib/socialAuth";
import type { User } from "@/components/AuthProvider";
import type { CashTxnType } from "@/lib/cash";
import type { OrderStatus } from "@/lib/orders";

/** Parsed admin email allowlist (lowercased). */
export function adminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** True when the given user is in the admin allowlist. */
export function isAdminUser(user: User | null): boolean {
  if (!user?.email) return false;
  const list = adminEmails();
  // When no allowlist is configured, no one is treated as admin.
  return list.length > 0 && list.includes(user.email.toLowerCase());
}

/** True when admin numbers come from a real backend (vs. demo placeholders). */
export const isAdminBackendConfigured = isSupabaseConfigured;

export interface AdminOrder {
  id: string;
  userEmail: string;
  productName: string;
  amountCash: number;
  qty: number;
  /** Customer's request / materials note from the order form. */
  request: string | null;
  status: OrderStatus;
  createdAt: string; // ISO
}

export interface AdminCharge {
  id: string;
  userEmail: string;
  amountCash: number;
  method: string;
  createdAt: string; // ISO
}

export interface AdminMember {
  id: string;
  email: string;
  provider: User["provider"];
  balance: number;
  joinedAt: string; // ISO
  name: string | null;
  phone: string | null;
  /** Latest recorded consents (null = no record yet). */
  thirdParty: boolean | null;
  marketing: boolean | null;
}

export interface AdminMetrics {
  members: number;
  ordersToday: number;
  chargeCashToday: number;
  pendingOrders: number;
}

export interface AdminOverview {
  metrics: AdminMetrics;
  recentOrders: AdminOrder[];
  recentCharges: AdminCharge[];
  members: AdminMember[];
}

export const TXN_TYPE_LABEL: Record<CashTxnType, string> = {
  charge: "충전",
  use: "사용",
  refund: "환불",
  bonus: "보너스",
};

/** Fetch the admin overview (real data via admin_overview RPC; demo in stub mode). */
export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = getSupabase();
  if (!supabase) return DEMO_OVERVIEW;

  const { data, error } = await supabase.rpc("admin_overview");
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  return {
    metrics: {
      members: Number(d.metrics.members),
      ordersToday: Number(d.metrics.ordersToday),
      chargeCashToday: Number(d.metrics.chargeCashToday),
      pendingOrders: Number(d.metrics.pendingOrders),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentOrders: (d.recentOrders ?? []).map((o: any) => ({
      id: o.id,
      userEmail: o.userEmail ?? "(탈퇴 회원)",
      productName: o.productName,
      amountCash: Number(o.amountCash),
      qty: Number(o.qty ?? 1),
      request: o.request ?? null,
      status: o.status as OrderStatus,
      createdAt: o.createdAt,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentCharges: (d.recentCharges ?? []).map((c: any) => ({
      id: c.id,
      userEmail: c.userEmail ?? "(탈퇴 회원)",
      amountCash: Number(c.amountCash),
      method: c.method || "충전",
      createdAt: c.createdAt,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members: (d.members ?? []).map((m: any) => ({
      id: m.id,
      email: m.email ?? "",
      provider: socialProviderFromSupabase(m.provider) ?? "email",
      balance: Number(m.balance ?? 0),
      joinedAt: m.joinedAt,
      name: m.name || null,
      phone: m.phone || null,
      thirdParty: m.thirdParty ?? null,
      marketing: m.marketing ?? null,
    })),
  };
}

/**
 * Change an order's status. Moving to "canceled" refunds the order's cash to
 * the member's ledger (server-side, in the same transaction); a canceled order
 * can't be reopened, so refunds can't be issued twice.
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return; // Demo mode: the dashboard only updates locally.
  const { error } = await supabase.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
}

// --- Demo (placeholder) data — clearly flagged in the UI --------------------

const DEMO_OVERVIEW: AdminOverview = {
  metrics: {
    members: 128,
    ordersToday: 14,
    chargeCashToday: 1_240_000,
    pendingOrders: 6,
  },
  recentOrders: [
    {
      id: "ord_demo_01",
      userEmail: "owner1@example.com",
      productName: "플레이스 영수증 리뷰 ×30",
      amountCash: 30_000,
      qty: 1,
      request: "가게 사진 5장 첨부했어요",
      status: "in_progress",
      createdAt: "2026-06-29T01:20:00.000Z",
    },
    {
      id: "ord_demo_02",
      userEmail: "seller2@example.com",
      productName: "블로그 준최적 배포",
      amountCash: 20_000,
      qty: 1,
      request: null,
      status: "received",
      createdAt: "2026-06-29T00:55:00.000Z",
    },
    {
      id: "ord_demo_03",
      userEmail: "cafe3@example.com",
      productName: "일반 리워드 트래픽 ×1,000",
      amountCash: 30_000,
      qty: 1,
      request: null,
      status: "done",
      createdAt: "2026-06-28T09:10:00.000Z",
    },
  ],
  recentCharges: [
    {
      id: "chg_demo_01",
      userEmail: "owner1@example.com",
      amountCash: 100_000,
      method: "테스트 충전",
      createdAt: "2026-06-29T01:18:00.000Z",
    },
    {
      id: "chg_demo_02",
      userEmail: "cafe3@example.com",
      amountCash: 50_000,
      method: "테스트 충전",
      createdAt: "2026-06-28T08:40:00.000Z",
    },
  ],
  members: [
    {
      id: "usr_demo_01",
      email: "owner1@example.com",
      provider: "email",
      balance: 70_000,
      joinedAt: "2026-06-20T00:00:00.000Z",
      name: "김사장",
      phone: "010-0000-0001",
      thirdParty: true,
      marketing: true,
    },
    {
      id: "usr_demo_02",
      email: "seller2@example.com",
      provider: "kakao",
      balance: 0,
      joinedAt: "2026-06-24T00:00:00.000Z",
      name: null,
      phone: null,
      thirdParty: false,
      marketing: false,
    },
    {
      id: "usr_demo_03",
      email: "cafe3@example.com",
      provider: "email",
      balance: 20_000,
      joinedAt: "2026-06-27T00:00:00.000Z",
      name: "박대표",
      phone: null,
      thirdParty: true,
      marketing: false,
    },
  ],
};
