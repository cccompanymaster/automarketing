"use client";

// Member-side deliverables context: rows the admin uploaded for me, plus the
// review action (approve / request revision). Stub mode reads localStorage by
// my email; real mode reads the RLS-scoped `deliverables` table and reviews
// via the owner-only `review_deliverable` RPC.

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
import {
  loadStubDeliverables,
  saveStubDeliverables,
  mapRow,
  type Deliverable,
} from "@/lib/deliverables";

interface DeliverablesContextValue {
  deliverables: Deliverable[];
  pendingCount: number;
  loading: boolean;
  /** Approve (approve=true) or request a revision with feedback. */
  review: (id: string, approve: boolean, feedback?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const DeliverablesContext = createContext<DeliverablesContextValue | null>(null);

export function DeliverablesProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const { user } = useAuth();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.email) {
      setDeliverables([]);
      return;
    }
    if (supabase) {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("deliverables")
          .select("id,user_email,title,content,status,feedback,created_at,reviewed_at")
          .order("created_at", { ascending: false });
        setDeliverables((data ?? []).map(mapRow));
      } finally {
        setLoading(false);
      }
      return;
    }
    setDeliverables(loadStubDeliverables(user.email));
  }, [supabase, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs to current user
    void refresh();
  }, [refresh]);

  const review = useCallback(
    async (id: string, approve: boolean, feedback?: string) => {
      if (!user?.email) throw new Error("로그인이 필요합니다.");
      if (supabase) {
        const { error } = await supabase.rpc("review_deliverable", {
          p_id: id,
          p_approve: approve,
          p_feedback: feedback ?? null,
        });
        if (error) throw new Error(error.message);
        await refresh();
        return;
      }
      const rows = loadStubDeliverables(user.email).map((d) =>
        d.id === id && d.status === "pending_review"
          ? {
              ...d,
              status: approve ? ("approved" as const) : ("revision_requested" as const),
              feedback: approve ? d.feedback : (feedback ?? d.feedback),
              reviewedAt: new Date().toISOString(),
            }
          : d,
      );
      saveStubDeliverables(user.email, rows);
      setDeliverables(rows);
    },
    [supabase, user, refresh],
  );

  const value = useMemo<DeliverablesContextValue>(
    () => ({
      deliverables,
      pendingCount: deliverables.filter((d) => d.status === "pending_review").length,
      loading,
      review,
      refresh,
    }),
    [deliverables, loading, review, refresh],
  );

  return <DeliverablesContext.Provider value={value}>{children}</DeliverablesContext.Provider>;
}

export function useDeliverables(): DeliverablesContextValue {
  const ctx = useContext(DeliverablesContext);
  if (!ctx) throw new Error("useDeliverables must be used within a DeliverablesProvider");
  return ctx;
}
