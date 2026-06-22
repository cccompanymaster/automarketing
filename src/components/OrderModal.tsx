"use client";

// Order a pricing item with cash (1원 = 1캐시). Handles per-unit quantity,
// shows balance, and blocks when the balance is insufficient.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/components/WalletProvider";
import { formatCash, formatKrw, krwToCash } from "@/lib/cash";
import type { PricingItem } from "@/lib/pricing";

export function OrderModal({
  item,
  onClose,
  onNeedCharge,
}: {
  item: PricingItem | null;
  onClose: () => void;
  onNeedCharge: () => void;
}) {
  const { balance, spend, loading } = useWallet();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    // Reset quantity whenever a different item is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQty(1);
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item || item.amountKrw == null) return null;

  const hasUnit = Boolean(item.unit);
  const quantity = hasUnit ? Math.max(1, qty) : 1;
  const totalCash = krwToCash(item.amountKrw * quantity);
  const enough = balance >= totalCash;

  const handleOrder = async () => {
    const memo = hasUnit && quantity > 1 ? `${item.name} ×${quantity}` : item.name;
    try {
      await spend(totalCash, memo);
      toast.success(`주문 완료 — ${formatCash(totalCash)} 차감되었습니다.`);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "주문에 실패했습니다.";
      toast.error(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="상품 주문"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{item.name}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatKrw(item.amountKrw)}
          {item.unit ? ` / ${item.unit}` : ""}
        </p>

        {hasUnit && (
          <div className="mt-5">
            <label htmlFor="order-qty" className="block text-xs font-medium text-slate-500">
              수량 ({item.unit})
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-10 w-10 rounded-xl border border-slate-200 text-lg font-bold text-slate-500 hover:bg-slate-50"
                aria-label="수량 감소"
              >
                −
              </button>
              <input
                id="order-qty"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-center text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="h-10 w-10 rounded-xl border border-slate-200 text-lg font-bold text-slate-500 hover:bg-slate-50"
                aria-label="수량 증가"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">결제 캐시</span>
            <span className="font-extrabold text-slate-900">{formatCash(totalCash)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">보유 캐시</span>
            <span className={`font-semibold ${enough ? "text-slate-600" : "text-rose-600"}`}>
              {formatCash(balance)}
            </span>
          </div>
        </div>

        {enough ? (
          <button
            type="button"
            onClick={handleOrder}
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "처리 중…" : `${formatCash(totalCash)} 결제하기`}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              onNeedCharge();
            }}
            className="mt-5 w-full rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            캐시가 부족합니다 · 충전하러 가기
          </button>
        )}
        <p className="mt-3 text-center text-[11px] text-slate-400">
          {/* TODO(backend): 주문을 실제 작업 의뢰/대시보드와 연동. */}
          주문 시 캐시가 차감되며, 내역은 마이페이지에서 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
