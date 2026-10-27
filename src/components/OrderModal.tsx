"use client";

// Order a pricing item with cash (1원 = 1캐시). Handles per-unit quantity,
// shows balance, and blocks when the balance is insufficient.

import { useModal } from "@/components/useModal";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/components/WalletProvider";
import { useOrders } from "@/components/OrdersProvider";
import { formatCash, formatKrw, krwToCash } from "@/lib/cash";
import type { PricingItem } from "@/lib/pricing";

export interface OrderDraft {
  qty: number;
  request: string;
}

export function OrderModal({
  item,
  draft,
  onClose,
  onNeedCharge,
}: {
  item: PricingItem | null;
  /** Restores quantity/request when reopening after a top-up. */
  draft?: OrderDraft | null;
  onClose: () => void;
  /** Called with the missing cash (and the draft) when the balance can't cover the order. */
  onNeedCharge: (shortfallCash: number, draft: OrderDraft) => void;
}) {
  const { balance, loading, loadError, refresh: refreshWallet } = useWallet();
  const { placeOrder } = useOrders();
  const [qty, setQty] = useState(1);
  const [request, setRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(panelRef, Boolean(item), onClose);

  useEffect(() => {
    // Reset per-item state whenever a different item is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQty(draft?.qty ?? item?.minQty ?? 1);
    setRequest(draft?.request ?? "");
  }, [item, draft]);

  if (!item || item.amountKrw == null) return null;

  const hasUnit = Boolean(item.unit);
  const minQty = item.minQty ?? 1;
  const step = item.step ?? 1;
  // Clamp to the minimum and round up to the item's ordering step.
  const fitQty = (n: number) => Math.max(minQty, Math.ceil(n / step) * step);
  const quantity = hasUnit ? fitQty(qty) : 1;
  const totalCash = krwToCash(item.amountKrw * quantity);
  const enough = balance >= totalCash;

  const handleOrder = async () => {
    // Guard against double taps: the RPC deducts cash, so a second call would
    // place (and charge) a second order.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      // One call: cash is deducted and the order (with the request note) is
      // recorded together, so a paid order can't go missing.
      await placeOrder({
        productName: item.name,
        amountCash: totalCash,
        qty: quantity,
        request: request.trim().slice(0, 1000),
      });
      toast.success(`주문 완료 — ${formatCash(totalCash)} 차감되었습니다.`);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "주문에 실패했습니다.";
      toast.error(msg);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
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
        ref={panelRef}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
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
              {(minQty > 1 || step > 1) && (
                <span className="ml-1 text-slate-400">
                  · 최소 {minQty.toLocaleString("ko-KR")}
                  {step > 1 && `, ${step.toLocaleString("ko-KR")} 단위`}
                </span>
              )}
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => fitQty(fitQty(q) - step))}
                className="h-10 w-10 rounded-xl border border-slate-200 text-lg font-bold text-slate-500 hover:bg-slate-50"
                aria-label="수량 감소"
              >
                −
              </button>
              <input
                id="order-qty"
                type="number"
                min={minQty}
                step={step}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value) || minQty)}
                onBlur={() => setQty(quantity)}
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-center text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => setQty((q) => fitQty(q) + step)}
                className="h-10 w-10 rounded-xl border border-slate-200 text-lg font-bold text-slate-500 hover:bg-slate-50"
                aria-label="수량 증가"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="order-request" className="block text-xs font-medium text-slate-500">
            요청사항·전달 자료 <span className="text-slate-400">(선택)</span>
          </label>
          <textarea
            id="order-request"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="블로그 주소, 매장 소개, 키워드, 참고 링크 등 작업에 필요한 자료를 적어 주세요."
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

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

        {loadError ? (
          <button
            type="button"
            onClick={() => void refreshWallet()}
            className="mt-5 w-full rounded-xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            잔액을 불러오지 못했어요 · 다시 시도
          </button>
        ) : enough ? (
          <button
            type="button"
            onClick={handleOrder}
            disabled={loading || submitting}
            className="mt-5 w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading || submitting ? "결제 중…" : `${formatCash(totalCash)} 결제하기`}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              onNeedCharge(totalCash - balance, { qty: quantity, request });
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
