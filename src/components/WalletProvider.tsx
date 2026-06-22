"use client";

// Cash wallet context (1원 = 1캐시). Holds the balance + transaction ledger.
// Stub mode persists per-user in localStorage; when Supabase is configured it
// reads/writes the cash tables. Charging always goes through payments.ts so the
// PG swap is a single-file change.

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
import { requestCharge } from "@/lib/payments";
import type { CashTxn } from "@/lib/cash";

interface WalletContextValue {
  balance: number;
  transactions: CashTxn[];
  loading: boolean;
  /** Top up the given KRW amount (credits 1캐시 per 1원 on success). */
  charge: (krw: number) => Promise<void>;
  /** Spend cash on a product. Throws when the balance is insufficient. */
  spend: (amountCash: number, memo: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const storageKey = (userId: string) => `selfmarketing.wallet.${userId}`;

interface StoredWallet {
  balance: number;
  transactions: CashTxn[];
}

function loadStub(userId: string): StoredWallet {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw) as StoredWallet;
  } catch {
    /* ignore */
  }
  return { balance: 0, transactions: [] };
}

function saveStub(userId: string, w: StoredWallet) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(w));
  } catch {
    /* ignore */
  }
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CashTxn[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setTransactions([]);
      return;
    }
    if (supabase) {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("cash_transactions")
          .select("id,type,amount,balance_after,memo,created_at")
          .order("created_at", { ascending: false });
        const txns: CashTxn[] = (data ?? []).map((r) => ({
          id: r.id as string,
          type: r.type as CashTxn["type"],
          amount: r.amount as number,
          balanceAfter: r.balance_after as number,
          memo: (r.memo as string) ?? "",
          createdAt: r.created_at as string,
        }));
        setTransactions(txns);
        setBalance(txns.length ? txns[0].balanceAfter : 0);
      } finally {
        setLoading(false);
      }
      return;
    }
    // Stub
    const w = loadStub(user.id);
    setBalance(w.balance);
    setTransactions(w.transactions);
  }, [supabase, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs wallet to current user
    void refresh();
  }, [refresh]);

  const charge = useCallback(
    async (krw: number) => {
      if (!user) throw new Error("로그인이 필요합니다.");
      setLoading(true);
      try {
        const result = await requestCharge(krw);
        if (!result.ok) throw new Error(result.error ?? "충전에 실패했습니다.");

        if (supabase) {
          // TODO(payment): in production, credit happens server-side after the
          // PG webhook verifies payment — not from the client.
          const { error } = await supabase.rpc("charge_cash", {
            p_amount: result.cashCredited,
            p_memo: result.method,
          });
          if (error) throw new Error(error.message);
          await refresh();
          return;
        }

        // Stub credit
        const w = loadStub(user.id);
        const nextBalance = w.balance + result.cashCredited;
        const txn: CashTxn = {
          id: newId(),
          type: "charge",
          amount: result.cashCredited,
          balanceAfter: nextBalance,
          memo: result.method,
          createdAt: new Date().toISOString(),
        };
        const next: StoredWallet = {
          balance: nextBalance,
          transactions: [txn, ...w.transactions].slice(0, 100),
        };
        saveStub(user.id, next);
        setBalance(next.balance);
        setTransactions(next.transactions);
      } finally {
        setLoading(false);
      }
    },
    [supabase, user, refresh],
  );

  const spend = useCallback(
    async (amountCash: number, memo: string) => {
      if (!user) throw new Error("로그인이 필요합니다.");
      if (amountCash <= 0) throw new Error("금액이 올바르지 않습니다.");
      setLoading(true);
      try {
        if (supabase) {
          const { error } = await supabase.rpc("use_cash", {
            p_amount: amountCash,
            p_memo: memo,
          });
          if (error) throw new Error(error.message);
          await refresh();
          return;
        }

        const w = loadStub(user.id);
        if (w.balance < amountCash) throw new Error("캐시가 부족합니다.");
        const nextBalance = w.balance - amountCash;
        const txn: CashTxn = {
          id: newId(),
          type: "use",
          amount: -amountCash,
          balanceAfter: nextBalance,
          memo,
          createdAt: new Date().toISOString(),
        };
        const next: StoredWallet = {
          balance: nextBalance,
          transactions: [txn, ...w.transactions].slice(0, 100),
        };
        saveStub(user.id, next);
        setBalance(next.balance);
        setTransactions(next.transactions);
      } finally {
        setLoading(false);
      }
    },
    [supabase, user, refresh],
  );

  const value = useMemo<WalletContextValue>(
    () => ({ balance, transactions, loading, charge, spend }),
    [balance, transactions, loading, charge, spend],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
