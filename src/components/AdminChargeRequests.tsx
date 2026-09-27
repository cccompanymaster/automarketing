"use client";

// Admin: 무통장입금 충전 신청 — match deposits in the bank app, then confirm
// (credits cash server-side) or cancel; track 현금영수증/세금계산서 issuance.

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  RECEIPT_LABEL,
  STATUS_LABEL,
  adminCancelBankCharge,
  adminConfirmBankCharge,
  adminListChargeRequests,
  adminMarkReceiptIssued,
  type AdminChargeRequest,
} from "@/lib/bankCharge";
import { formatKrw } from "@/lib/cash";

function when(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function ReceiptDetail({ r }: { r: AdminChargeRequest }) {
  const i = r.receiptInfo ?? {};
  if (r.receiptType === "cash_receipt")
    return (
      <p className="text-xs text-slate-500">
        {i.purpose === "expense" ? "지출증빙" : "소득공제"} · {i.number}
      </p>
    );
  if (r.receiptType === "tax_invoice")
    return (
      <p className="text-xs leading-relaxed text-slate-500">
        {i.company} ({i.ceo}) · {i.bizNo}
        <br />
        {i.email}
        {i.bizType || i.bizItem ? ` · ${[i.bizType, i.bizItem].filter(Boolean).join("/")}` : ""}
      </p>
    );
  return null;
}

export function AdminChargeRequests({ onChanged }: { onChanged?: () => void }) {
  const [rows, setRows] = useState<AdminChargeRequest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    adminListChargeRequests()
      .then(setRows)
      .catch((e: Error) => {
        toast.error(e.message);
        setRows([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, fn: () => Promise<void>, done: string) => {
    setBusy(id);
    try {
      await fn();
      toast.success(done);
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "처리하지 못했어요.");
    } finally {
      setBusy(null);
    }
  };

  const pending = rows?.filter((r) => r.status === "pending").length ?? 0;
  const toIssue = rows?.filter((r) => r.status === "confirmed" && r.receiptType !== "none" && !r.receiptIssued).length ?? 0;

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <h2 className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4 text-base font-bold text-slate-900">
        무통장입금 충전 신청
        {pending > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">입금 확인 대기 {pending}</span>}
        {toIssue > 0 && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">증빙 발행 필요 {toIssue}</span>}
      </h2>
      <p className="px-5 pt-3 text-xs text-slate-500">
        통장 입금 내역에서 금액·입금자명을 확인한 뒤 [입금 확인]을 누르면 캐시가 바로 적립돼요. 현금영수증·세금계산서는 홈택스에서 발행 후 [발행 완료]로 표시하세요.
      </p>
      {rows === null ? (
        <p className="px-5 py-6 text-sm text-slate-400">불러오는 중…</p>
      ) : rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400">아직 신청이 없어요.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="mt-2 w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-400">
                {["신청", "회원", "금액 · 입금자", "증빙", "상태", "처리"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={`border-t border-slate-50 align-top ${r.status === "pending" ? "bg-amber-50/40" : ""}`}>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{when(r.createdAt)}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{r.userEmail}</td>
                  <td className="px-3 py-3">
                    <p className="font-bold tabular-nums text-slate-800">{formatKrw(r.amount)}</p>
                    <p className="text-xs text-slate-500">입금자 {r.depositor}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs font-semibold text-slate-700">{RECEIPT_LABEL[r.receiptType]}</p>
                    <ReceiptDetail r={r} />
                    {r.status === "confirmed" && r.receiptType !== "none" && (
                      <label className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={r.receiptIssued}
                          disabled={busy === r.id}
                          onChange={(e) =>
                            act(r.id, () => adminMarkReceiptIssued(r.id, e.target.checked), e.target.checked ? "발행 완료로 표시했어요." : "발행 전으로 되돌렸어요.")
                          }
                        />
                        발행 완료
                      </label>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs">
                    <span className="font-semibold text-slate-700">{STATUS_LABEL[r.status]}</span>
                    {r.processedAt && <span className="block text-slate-400">{when(r.processedAt)}</span>}
                    {r.adminMemo && <span className="block text-slate-400">{r.adminMemo}</span>}
                  </td>
                  <td className="px-3 py-3">
                    {r.status === "pending" && (
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => {
                            if (window.confirm(`${r.depositor}님 ${formatKrw(r.amount)} 입금을 확인했나요? 확인하면 캐시가 바로 적립돼요.`))
                              void act(r.id, () => adminConfirmBankCharge(r.id), "입금 확인 — 캐시를 적립했어요.");
                          }}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          입금 확인
                        </button>
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => {
                            const memo = window.prompt("취소 사유 (회원에게 보여요)", "입금 기한 초과");
                            if (memo !== null) void act(r.id, () => adminCancelBankCharge(r.id, memo), "신청을 취소했어요.");
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-60"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
