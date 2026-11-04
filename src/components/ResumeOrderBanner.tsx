"use client";

// "작성 중인 주문서가 있어요" — shown when a member left an order to top up
// (or is waiting on a bank transfer). Reopens the same order window with the
// saved quantity, request and form answers; nothing is ordered until they
// confirm there.

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import type { OrderDraft } from "@/components/OrderModal";
import { clearOrderDraft, loadOrderDraft, type SavedOrderDraft } from "@/lib/orderDraft";
import { formatCash } from "@/lib/cash";
import type { PricingGroup, PricingItem } from "@/lib/pricing";

export function ResumeOrderBanner({
  groups,
  onResume,
}: {
  groups: PricingGroup[];
  onResume: (item: PricingItem, draft: OrderDraft) => void;
}) {
  const { user } = useAuth();
  const { balance } = useWallet();
  const [saved, setSaved] = useState<SavedOrderDraft | null>(null);

  useEffect(() => {
    if (!user) return;
    const sync = () => setSaved(loadOrderDraft(user.id));
    sync();
    window.addEventListener("orderdraft", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("orderdraft", sync);
      window.removeEventListener("focus", sync);
    };
  }, [user]);

  const item = saved ? groups.flatMap((g) => g.items).find((i) => i.name === saved.itemName) : undefined;
  if (!user || !saved || !item) return null;
  const enough = balance >= saved.totalCash;

  return (
    <div role="status" className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
      <div className="min-w-0 flex-1 text-sm text-amber-900">
        <p className="font-bold">작성 중인 주문서가 있어요</p>
        <p className="mt-0.5 text-xs">
          {saved.itemName}
          {saved.qty > 1 ? ` ×${saved.qty.toLocaleString("ko-KR")}` : ""} · {formatCash(saved.totalCash)}
          {enough ? " · 지금 보유 캐시로 주문할 수 있어요" : ` · 보유 ${formatCash(balance)} (입금 확인 전이면 조금 기다려 주세요)`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onResume(item, { qty: saved.qty, request: saved.request, form: saved.form })}
        className="min-h-10 rounded-xl bg-amber-500 px-4 text-sm font-bold text-white transition hover:bg-amber-600"
      >
        이어서 주문하기
      </button>
      <button
        type="button"
        onClick={() => clearOrderDraft(user.id)}
        className="min-h-10 rounded-xl px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100"
      >
        지우기
      </button>
    </div>
  );
}
