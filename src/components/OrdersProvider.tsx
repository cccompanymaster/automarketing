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

interface PlaceOrderInput {
  productName: string;
  amountCash: number;
  qty: number;
  /** Customer's request / materials note, shown to the admin with the order. */
  request?: string;
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
        const { data } = await supabase
          .from("orders")
          .select("id,product_name,amount_cash,qty,status,created_at")
          .order("created_at", { ascending: false });
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
        const { error } = await supabase.rpc("place_order", {
          p_product_name: input.productName,
          p_amount: input.amountCash,
          p_qty: input.qty,
          p_request: request ?? null,
        });
        if (error) throw new Error(error.message);
        await Promise.all([refresh(), refreshWallet()]);
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
