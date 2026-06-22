"use client";

// Cash top-up modal. Amount presets + custom input, 1원 = 1캐시.
// Charging goes through the wallet (-> payments.ts). Currently a test charge.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/components/WalletProvider";
import {
  CHARGE_PRESETS_KRW,
  MAX_CHARGE_KRW,
  MIN_CHARGE_KRW,
  formatCash,
  formatKrw,
  krwToCash,
} from "@/lib/cash";

export function ChargeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { charge, loading } = useWallet();
  const [amount, setAmount] = useState<number>(CHARGE_PRESETS_KRW[0]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const valid = amount >= MIN_CHARGE_KRW && amount <= MAX_CHARGE_KRW;

  const handleCharge = async () => {
    if (!valid) {
      toast.error(`충전 금액은 ${formatKrw(MIN_CHARGE_KRW)} ~ ${formatKrw(MAX_CHARGE_KRW)} 사이여야 합니다.`);
      return;
    }
    try {
      await charge(amount);
      toast.success(`${formatCash(krwToCash(amount))} 충전되었습니다.`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "충전에 실패했습니다.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="캐시 충전"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">캐시 충전</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">1원 = 1캐시</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {CHARGE_PRESETS_KRW.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              className={`rounded-xl border py-3 text-sm font-semibold transition ${
                amount === p
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {(p / 10000).toLocaleString("ko-KR")}만
            </button>
          ))}
        </div>

        <div className="mt-3">
          <label htmlFor="charge-amount" className="block text-xs font-medium text-slate-500">
            직접 입력 (원)
          </label>
          <input
            id="charge-amount"
            type="number"
            inputMode="numeric"
            min={MIN_CHARGE_KRW}
            max={MAX_CHARGE_KRW}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-right text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">충전 후 받는 캐시</span>
          <span className="font-extrabold text-emerald-600">{formatCash(krwToCash(amount || 0))}</span>
        </div>

        <button
          type="button"
          onClick={handleCharge}
          disabled={loading || !valid}
          className="mt-5 w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "처리 중…" : `${formatKrw(amount || 0)} 충전하기`}
        </button>
        <p className="mt-3 text-center text-[11px] text-slate-400">
          {/* TODO(payment): 실제 결제(PG) 연결 전까지는 테스트 충전입니다. */}
          현재는 PG 연결 전 테스트 충전입니다. 실제 결제는 연동 후 활성화됩니다.
        </p>
      </div>
    </div>
  );
}
