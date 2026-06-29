"use client";

// Orders context. Stub mode persists per-user in localStorage; when Supabase is
// configured it reads/writes the `orders` table (RLS-scoped to the user).
// An order is recorded after a successful cash spend (OrderModal).

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
import type { Order, OrderStatus } from "@/lib/orders";

interface CreateOrderInput {
  productName: string;
  amountCash: number;
  qty: number;
}

interface OrdersContextValue {
  orders: Order[];
  loading: boolean;
  /** Record a new order (status starts at "received"). */
  createOrder: (input: CreateOrderInput) => Promise<void>;
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

  const createOrder = useCallback(
    async (input: CreateOrderInput) => {
      if (!user) throw new Error("로그인이 필요합니다.");
      if (supabase) {
        const { error } = await supabase.from("orders").insert({
          user_id: user.id,
          product_name: input.productName,
          amount_cash: input.amountCash,
          qty: input.qty,
          status: "received",
        });
        if (error) throw new Error(error.message);
        await refresh();
        return;
      }
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
    [supabase, user, refresh],
  );

  const value = useMemo<OrdersContextValue>(
    () => ({ orders, loading, createOrder, refresh }),
    [orders, loading, createOrder, refresh],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within an OrdersProvider");
  return ctx;
}
