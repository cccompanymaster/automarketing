"use client";

// Cash top-up modal. Amount presets + custom input, 1원 = 1캐시.
// Methods:
// - 무통장입금: files a charge request (+ 현금영수증/세금계산서 request) and shows
//   the business account; an admin confirms the deposit and the server credits
//   cash (lib/bankCharge.ts). Always available with the real backend.
// - 카드 결제: PortOne checkout via the wallet (-> payments.ts); offered once a
//   PG channel is configured. In local stub mode it's the test charge.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/components/WalletProvider";
import { useAuth } from "@/components/AuthProvider";
import { isPgConfigured } from "@/lib/payments";
import { isSupabaseConfigured } from "@/lib/supabase";
import { COMPANY } from "@/lib/company";
import {
  requestBankCharge,
  validateBankCharge,
  type CashReceiptInfo,
  type ReceiptType,
  type TaxInvoiceInfo,
} from "@/lib/bankCharge";
import {
  CHARGE_PRESETS_KRW,
  MAX_CHARGE_KRW,
  MIN_CHARGE_KRW,
  formatCash,
  formatKrw,
  cashToKrw,
  krwToCash,
} from "@/lib/cash";

type Method = "bank" | "card";

/** Smallest preset covering the shortfall, else the shortfall rounded up to 10,000원. */
function amountFor(shortfallCash: number): number {
  const need = cashToKrw(shortfallCash);
  const preset = CHARGE_PRESETS_KRW.find((p) => p >= need);
  if (preset) return preset;
  return Math.min(MAX_CHARGE_KRW, Math.ceil(need / 10_000) * 10_000);
}

const INPUT =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label}을(를) 복사했어요.`);
  } catch {
    toast.error("복사하지 못했어요. 직접 입력해 주세요.");
  }
}

export function ChargeModal({
  open,
  onClose,
  shortfallCash,
}: {
  open: boolean;
  onClose: () => void;
  /** Cash missing for an order in progress — preselects an amount that covers it. */
  shortfallCash?: number;
}) {
  const { charge, loading } = useWallet();
  const { user } = useAuth();
  const methods: Method[] = !isSupabaseConfigured ? ["card"] : isPgConfigured ? ["card", "bank"] : ["bank"];
  const [method, setMethod] = useState<Method>(methods[0]);
  const [amount, setAmount] = useState<number>(CHARGE_PRESETS_KRW[0]);

  // 무통장입금 form
  const [depositor, setDepositor] = useState("");
  const [receiptType, setReceiptType] = useState<ReceiptType>("none");
  const [cash, setCash] = useState<CashReceiptInfo>({ purpose: "income", number: "" });
  const [tax, setTax] = useState<TaxInvoiceInfo>({ bizNo: "", company: "", ceo: "", email: "", bizType: "", bizItem: "" });
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState<{ amount: number; depositor: string } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- preset when (re)opened
    if (open && shortfallCash && shortfallCash > 0) setAmount(amountFor(shortfallCash));
  }, [open, shortfallCash]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fresh form each time it opens
    setRequested(null);
    setDepositor((d) => d || user?.name || "");
    setTax((t) => (t.email ? t : { ...t, email: user?.email ?? "" }));
  }, [open, user]);

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

  const handleCard = async () => {
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

  const handleBank = async () => {
    const input = { amount, depositor, receiptType, cash, tax };
    const problem = validateBankCharge(input);
    if (problem) {
      toast.error(problem);
      return;
    }
    setSubmitting(true);
    try {
      await requestBankCharge(input);
      setRequested({ amount, depositor: depositor.trim() });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "신청하지 못했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const acct = COMPANY.bankAccount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="캐시 충전"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
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

        {/* ===== 무통장입금: request done → transfer guide ===== */}
        {requested ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-900 ring-1 ring-emerald-100">
              <p className="font-bold">충전 신청이 접수됐어요.</p>
              <p className="mt-1 text-xs leading-relaxed">
                아래 계좌로 입금해 주시면 확인 후 캐시가 적립돼요. (영업일 기준 보통 1~2시간, 늦어도 다음 영업일)
              </p>
            </div>
            <dl className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
              {[
                { k: "은행", v: acct.bank },
                { k: "계좌번호", v: acct.number, copy: acct.number.replace(/\D/g, "") },
                { k: "예금주", v: acct.holder },
                { k: "입금액", v: formatKrw(requested.amount), copy: String(requested.amount) },
                { k: "입금자명", v: requested.depositor },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <dt className="text-slate-500">{row.k}</dt>
                  <dd className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="num">{row.v}</span>
                    {row.copy && (
                      <button
                        type="button"
                        onClick={() => copy(row.copy!, row.k)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
                      >
                        복사
                      </button>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-[11px] leading-relaxed text-slate-400">
              입금자명이 신청 내용과 다르면 확인이 늦어질 수 있어요. 신청 내역과 취소는 마이페이지에서 볼 수 있어요.{" "}
              <a href={COMPANY.kakaoChatUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-600 underline underline-offset-2">
                입금 확인 문의 (카카오톡)
              </a>
            </p>
            <button type="button" onClick={onClose} className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white hover:bg-slate-800">
              확인
            </button>
          </div>
        ) : (
          <>
            {methods.length > 1 && (
              <div className="mt-4 flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="결제 방법">
                {methods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={method === m}
                    onClick={() => setMethod(m)}
                    className={`min-h-10 flex-1 rounded-lg text-sm font-semibold transition ${
                      method === m ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {m === "card" ? "카드 결제" : "무통장입금"}
                  </button>
                ))}
              </div>
            )}

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

            {method === "bank" ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="charge-depositor" className="block text-xs font-medium text-slate-500">
                    입금자명
                  </label>
                  <input
                    id="charge-depositor"
                    value={depositor}
                    maxLength={30}
                    onChange={(e) => setDepositor(e.target.value)}
                    placeholder="통장에 찍히는 이름 (예: 홍길동)"
                    className={INPUT}
                  />
                </div>

                <fieldset>
                  <legend className="text-xs font-medium text-slate-500">증빙 서류</legend>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {(["none", "cash_receipt", "tax_invoice"] as ReceiptType[]).map((t) => (
                      <label
                        key={t}
                        className="flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 px-1 text-center text-xs font-semibold text-slate-600 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-800 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-400"
                      >
                        <input
                          type="radio"
                          name="receipt-type"
                          value={t}
                          checked={receiptType === t}
                          onChange={() => setReceiptType(t)}
                          className="sr-only"
                        />
                        {t === "none" ? "필요 없음" : t === "cash_receipt" ? "현금영수증" : "세금계산서"}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {receiptType === "cash_receipt" && (
                  <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                    <div className="flex gap-3 text-xs text-slate-600">
                      {(["income", "expense"] as const).map((p) => (
                        <label key={p} className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="cash-purpose"
                            checked={cash.purpose === p}
                            onChange={() => setCash({ purpose: p, number: "" })}
                          />
                          {p === "income" ? "소득공제용 (개인)" : "지출증빙용 (사업자)"}
                        </label>
                      ))}
                    </div>
                    <label htmlFor="cash-number" className="sr-only">
                      {cash.purpose === "income" ? "휴대폰번호" : "사업자등록번호"}
                    </label>
                    <input
                      id="cash-number"
                      inputMode="numeric"
                      value={cash.number}
                      onChange={(e) => setCash({ ...cash, number: e.target.value })}
                      placeholder={cash.purpose === "income" ? "휴대폰번호 (010-0000-0000)" : "사업자등록번호 (000-00-00000)"}
                      className={INPUT}
                    />
                  </div>
                )}

                {receiptType === "tax_invoice" && (
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                    {(
                      [
                        { k: "bizNo", label: "사업자등록번호", ph: "000-00-00000", full: true },
                        { k: "company", label: "상호", ph: "○○식당" },
                        { k: "ceo", label: "대표자", ph: "홍길동" },
                        { k: "email", label: "받을 이메일", ph: "tax@example.com", full: true },
                        { k: "bizType", label: "업태 (선택)", ph: "음식점업" },
                        { k: "bizItem", label: "종목 (선택)", ph: "한식" },
                      ] as { k: keyof TaxInvoiceInfo; label: string; ph: string; full?: boolean }[]
                    ).map((f) => (
                      <div key={f.k} className={f.full ? "col-span-2" : ""}>
                        <label htmlFor={`tax-${f.k}`} className="block text-[11px] font-medium text-slate-500">
                          {f.label}
                        </label>
                        <input
                          id={`tax-${f.k}`}
                          value={tax[f.k] ?? ""}
                          maxLength={f.k === "email" ? 100 : 40}
                          inputMode={f.k === "bizNo" ? "numeric" : f.k === "email" ? "email" : undefined}
                          onChange={(e) => setTax({ ...tax, [f.k]: e.target.value })}
                          placeholder={f.ph}
                          className={`${INPUT} mt-1 h-10`}
                        />
                      </div>
                    ))}
                    <p className="col-span-2 text-[11px] leading-relaxed text-slate-400">
                      입금액(부가세 포함) 기준으로 입금 확인 후 발행해 드려요.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBank}
                  disabled={submitting || !valid}
                  className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? "신청 중…" : `${formatKrw(amount || 0)} 무통장입금 신청`}
                </button>
                <p className="text-center text-[11px] text-slate-400">
                  입금 계좌: {acct.bank} {acct.number} ({acct.holder})
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCard}
                  disabled={loading || !valid}
                  className="mt-5 w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? "처리 중…" : `${formatKrw(amount || 0)} 충전하기`}
                </button>
                {!isSupabaseConfigured && (
                  <p className="mt-3 text-center text-[11px] text-slate-400">
                    {/* TODO(payment): local stub mode — no real money moves. */}
                    개발용 테스트 충전입니다. 실제 결제는 이루어지지 않습니다.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
