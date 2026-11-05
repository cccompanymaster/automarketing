"use client";

// Orders context. Stub mode persists per-user in localStorage; when Supabase is
// configured it reads the `orders` table (RLS-scoped to the user) and places
// orders through the place_order RPC, which deducts cash and records the order
// in one transaction — there is no client INSERT on orders.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import type { Order, OrderStatus } from "@/lib/orders";
import type { OrderFile } from "@/lib/orderForms";

interface PlaceOrderInput {
  productName: string;
  amountCash: number;
  qty: number;
  /** Customer's request / materials note, shown to the admin with the order. */
  request?: string;
  /** Same key for retries of one order: the server charges it once. */
  clientKey?: string;
  /** Uploaded attachments (order-files bucket). */
  files?: OrderFile[];
  /** Account password for login-based work; stored apart from the order. */
  secret?: string | null;
}

interface OrdersContextValue {
  orders: Order[];
  loading: boolean;
  /** Pay with cash and record the order (status starts at "received"). */
  placeOrder: (input: PlaceOrderInput) => Promise<void>;
  refresh: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

const storageKey = (userId: string) => `selfmarketing.orders.${userId}`;

function loadStub(userId: string): Order[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw) as Order[];
  } catch {
    /* ignore */
  }
  return [];
}

function saveStub(userId: string, orders: Order[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(orders));
  } catch {
    /* ignore */
  }
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Korean, customer-facing message for a failed place_order call. */
export function orderErrorMessage(err: { message?: string; code?: string }): string {
  const m = err.message ?? "";
  if (m.includes("캐시가 부족")) return "캐시가 부족해요. 충전 후 다시 주문해 주세요.";
  if (m.includes("price_changed")) return "그사이 가격이 바뀌었어요. 페이지를 새로고침해 바뀐 금액을 확인한 뒤 다시 주문해 주세요.";
  if (m.includes("below_min_qty")) return "최소 주문 수량보다 적어요. 수량을 늘려 주세요.";
  if (m.includes("bad_step")) return "주문 단위에 맞지 않는 수량이에요. 수량을 다시 확인해 주세요.";
  if (m.includes("bad_files")) return "첨부 파일을 확인하지 못했어요. 파일을 다시 올린 뒤 주문해 주세요.";
  if (m.includes("bad_secret")) return "비밀번호를 다시 확인해 주세요.";
  if (m.includes("unknown_product")) return "지금은 바로 주문할 수 없는 상품이에요. 견적·문의로 남겨 주세요.";
  if (/JWT|not authenticated|401/i.test(m)) return "로그인이 만료됐어요. 다시 로그인한 뒤 주문해 주세요.";
  if (err.code === "network" || /Failed to fetch|NetworkError|network/i.test(m))
    return "연결이 불안정해요. 주문이 이미 처리됐을 수 있으니 마이페이지 주문 내역을 확인한 뒤 다시 시도해 주세요.";
  return "주문을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const { user } = useAuth();
  const { spend, refresh: refreshWallet } = useWallet();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    if (supabase) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id,product_name,amount_cash,qty,status,created_at")
          .order("created_at", { ascending: false });
        // Keep the last list on a failed load rather than showing "no orders".
        if (error) return;
        const rows: Order[] = (data ?? []).map((r) => ({
          id: r.id as string,
          productName: (r.product_name as string) ?? "",
          amountCash: r.amount_cash as number,
          qty: (r.qty as number) ?? 1,
          status: r.status as OrderStatus,
          createdAt: r.created_at as string,
        }));
        setOrders(rows);
      } finally {
        setLoading(false);
      }
      return;
    }
    setOrders(loadStub(user.id));
  }, [supabase, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs to current user
    void refresh();
  }, [refresh]);

  const placeOrder = useCallback(
    async (input: PlaceOrderInput) => {
      if (!user) throw new Error("로그인이 필요합니다.");
      const request = input.request?.trim() || undefined;
      if (supabase) {
        let error: { message?: string; code?: string } | null = null;
        try {
          const args = {
            p_product_name: input.productName,
            p_amount: input.amountCash,
            p_qty: input.qty,
            p_request: request ?? null,
            p_client_key: input.clientKey ?? newId(),
          };
          // Attachments / a password go through place_order_v2 (same pricing
          // and dedup, plus the extras in the same transaction).
          ({ error } =
            input.files?.length || input.secret
              ? await supabase.rpc("place_order_v2", { ...args, p_files: input.files ?? [], p_secret: input.secret ?? null })
              : await supabase.rpc("place_order", args));
        } catch (e) {
          error = { message: e instanceof Error ? e.message : String(e), code: "network" };
        } finally {
          // Re-sync either way: on a failure the shown balance may be stale,
          // and a dropped connection may still have committed the order.
          await Promise.all([refresh(), refreshWallet()]).catch(() => {});
        }
        if (error) throw new Error(orderErrorMessage(error));
        return;
      }
      // Stub: spend locally, then keep the order alongside the session.
      const base = input.qty > 1 ? `${input.productName} ×${input.qty}` : input.productName;
      await spend(input.amountCash, request ? `${base} — ${request.slice(0, 300)}` : base);
      const order: Order = {
        id: newId(),
        productName: input.productName,
        amountCash: input.amountCash,
        qty: input.qty,
        status: "received",
        createdAt: new Date().toISOString(),
      };
      const next = [order, ...loadStub(user.id)].slice(0, 100);
      saveStub(user.id, next);
      setOrders(next);
    },
    [supabase, user, refresh, refreshWallet, spend],
  );

  const value = useMemo<OrdersContextValue>(
    () => ({ orders, loading, placeOrder, refresh }),
    [orders, loading, placeOrder, refresh],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within an OrdersProvider");
  return ctx;
}
