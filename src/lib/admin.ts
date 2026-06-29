// Admin domain — gating + data access for the admin-only dashboard (/admin).
//
// Gating: an email allowlist from NEXT_PUBLIC_ADMIN_EMAILS (comma-separated).
// IMPORTANT: this client-side check only hides the UI. It is NOT a security
// boundary — the real protection must live server-side (Supabase RLS / an
// admin role / a service-role function). Never expose the service-role key to
// the client. TODO(backend): enforce admin access in the data layer too.

import { isSupabaseConfigured } from "@/lib/supabase";
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

/**
 * Fetch the admin overview.
 * TODO(backend): when Supabase is configured, read aggregates and recent rows
 * from admin-scoped views/RPCs (server-side, service-role). For now this
 * returns demo placeholders so the screen is reviewable end to end.
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  // TODO(backend): replace with real queries when isAdminBackendConfigured.
  return DEMO_OVERVIEW;
}

/**
 * Update an order's status.
 * TODO(backend): persist via an admin-only path — an `update_order_status` RPC
 * guarded by an is_admin() policy, or a service-role server action. In demo
 * mode this is a no-op and the dashboard updates its local state optimistically.
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  void orderId;
  void status;
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
      status: "in_progress",
      createdAt: "2026-06-29T01:20:00.000Z",
    },
    {
      id: "ord_demo_02",
      userEmail: "seller2@example.com",
      productName: "블로그 준최적 배포",
      amountCash: 20_000,
      status: "received",
      createdAt: "2026-06-29T00:55:00.000Z",
    },
    {
      id: "ord_demo_03",
      userEmail: "cafe3@example.com",
      productName: "일반 리워드 트래픽 ×1,000",
      amountCash: 30_000,
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
    },
    {
      id: "usr_demo_02",
      email: "seller2@example.com",
      provider: "kakao",
      balance: 0,
      joinedAt: "2026-06-24T00:00:00.000Z",
    },
    {
      id: "usr_demo_03",
      email: "cafe3@example.com",
      provider: "email",
      balance: 20_000,
      joinedAt: "2026-06-27T00:00:00.000Z",
    },
  ],
};
