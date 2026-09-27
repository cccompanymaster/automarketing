"use client";

// My-page list of 무통장입금 charge requests: status, receipt request, and a
// cancel button while the deposit hasn't been confirmed. Shows the business
// account again for pending requests.

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { COMPANY } from "@/lib/company";
import {
  RECEIPT_LABEL,
  STATUS_LABEL,
  cancelBankCharge,
  listMyChargeRequests,
  type ChargeRequest,
} from "@/lib/bankCharge";
import { formatKrw } from "@/lib/cash";

const STATUS_STYLE: Record<ChargeRequest["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
};

/** `refreshKey` changes (e.g. when the charge modal closes) trigger a reload. */
export function ChargeRequests({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<ChargeRequest[]>([]);

  const load = useCallback(() => {
    listMyChargeRequests()
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (rows.length === 0) return null;
  const hasPending = rows.some((r) => r.status === "pending");
  const acct = COMPANY.bankAccount;

  const cancel = async (id: string) => {
    if (!window.confirm("이 충전 신청을 취소할까요? 이미 입금하셨다면 취소하지 말고 확인을 기다려 주세요.")) return;
    try {
      if (await cancelBankCharge(id)) toast.success("신청을 취소했어요.");
      else toast.error("이미 처리된 신청이에요.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "취소하지 못했어요.");
    }
    load();
  };

  return (
    <div className="mt-5 border-t border-slate-50 pt-4">
      <h3 className="text-xs font-semibold text-slate-400">무통장입금 충전 신청</h3>
      {hasPending && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          입금 계좌: <b>{acct.bank} {acct.number}</b> ({acct.holder}) — 입금 확인 후 캐시가 적립돼요.
        </p>
      )}
      <ul className="mt-2 divide-y divide-slate-50">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
            <div className="min-w-0">
              <span className="font-semibold text-slate-700">{formatKrw(r.amount)}</span>
              <span className="ml-2 text-xs text-slate-400">
                입금자 {r.depositor} · {RECEIPT_LABEL[r.receiptType]}
                {r.receiptType !== "none" && r.status === "confirmed" && (r.receiptIssued ? " 발행 완료" : " 발행 예정")}
              </span>
              <span className="block text-[11px] text-slate-400">
                {new Date(r.createdAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                {r.status === "cancelled" && r.adminMemo ? ` · ${r.adminMemo}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
              {r.status === "pending" && (
                <button type="button" onClick={() => cancel(r.id)} className="min-h-8 rounded-lg px-2 text-xs text-slate-400 hover:bg-slate-100">
                  취소
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
