// 무통장입금 캐시 충전 (+ 현금영수증 / 세금계산서 요청) — data layer.
// The customer files a request and transfers money to the business account;
// an admin confirms the deposit (admin_confirm_bank_charge), which credits
// cash server-side. Nothing here credits cash on the client.
// Schema: supabase/schema.sql "charge_requests".

import { getSupabase } from "@/lib/supabase";

export type ReceiptType = "none" | "cash_receipt" | "tax_invoice";
export type ChargeRequestStatus = "pending" | "confirmed" | "cancelled";

/** 현금영수증: 휴대폰번호(소득공제) 또는 사업자번호(지출증빙). */
export interface CashReceiptInfo {
  purpose: "income" | "expense";
  number: string;
}

/** 세금계산서 발행 정보. */
export interface TaxInvoiceInfo {
  bizNo: string;
  company: string;
  ceo: string;
  email: string;
  bizType?: string;
  bizItem?: string;
}

export interface ChargeRequest {
  id: string;
  amount: number;
  depositor: string;
  receiptType: ReceiptType;
  receiptInfo: Partial<CashReceiptInfo & TaxInvoiceInfo>;
  status: ChargeRequestStatus;
  receiptIssued: boolean;
  adminMemo: string | null;
  createdAt: string;
  processedAt: string | null;
}

export const RECEIPT_LABEL: Record<ReceiptType, string> = {
  none: "발행 안 함",
  cash_receipt: "현금영수증",
  tax_invoice: "세금계산서",
};

export const STATUS_LABEL: Record<ChargeRequestStatus, string> = {
  pending: "입금 확인 중",
  confirmed: "충전 완료",
  cancelled: "취소됨",
};

const digits = (s: string) => s.replace(/\D/g, "");

/** Client-side checks mirroring request_bank_charge (server re-validates). */
export function validateBankCharge(input: {
  amount: number;
  depositor: string;
  receiptType: ReceiptType;
  cash?: CashReceiptInfo;
  tax?: TaxInvoiceInfo;
}): string | null {
  if (!Number.isFinite(input.amount) || input.amount < 1000 || input.amount > 10_000_000)
    return "충전 금액은 1,000원 ~ 10,000,000원 사이로 입력해 주세요.";
  const dep = input.depositor.trim();
  if (!dep) return "입금자명을 입력해 주세요.";
  if (dep.length > 30) return "입금자명은 30자 이내로 입력해 주세요.";
  if (input.receiptType === "cash_receipt") {
    const n = digits(input.cash?.number ?? "");
    if (input.cash?.purpose === "expense" ? n.length !== 10 : n.length < 10 || n.length > 11)
      return input.cash?.purpose === "expense"
        ? "지출증빙용은 사업자등록번호 10자리를 입력해 주세요."
        : "소득공제용은 휴대폰번호를 입력해 주세요.";
  }
  if (input.receiptType === "tax_invoice") {
    const t = input.tax;
    if (!t || digits(t.bizNo).length !== 10) return "사업자등록번호 10자리를 입력해 주세요.";
    if (!t.company.trim() || !t.ceo.trim()) return "상호와 대표자명을 입력해 주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email.trim())) return "세금계산서를 받을 이메일을 확인해 주세요.";
  }
  return null;
}

const SERVER_ERRORS: Record<string, string> = {
  login_required: "로그인이 필요합니다.",
  invalid_amount: "충전 금액을 확인해 주세요.",
  invalid_depositor: "입금자명을 확인해 주세요.",
  receipt_number_required: "현금영수증 번호를 입력해 주세요.",
  tax_invoice_info_required: "세금계산서 발행 정보를 모두 입력해 주세요.",
  too_many_pending: "입금 확인 중인 신청이 3건 있어요. 입금하셨다면 확인을 기다려 주시고, 아니면 이전 신청을 취소해 주세요.",
  forbidden: "권한이 없습니다.",
  not_pending: "이미 처리된 신청이에요.",
};

function friendly(message: string | undefined): string {
  const key = Object.keys(SERVER_ERRORS).find((k) => message?.includes(k));
  return key ? SERVER_ERRORS[key] : "처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export async function requestBankCharge(input: {
  amount: number;
  depositor: string;
  receiptType: ReceiptType;
  cash?: CashReceiptInfo;
  tax?: TaxInvoiceInfo;
}): Promise<string> {
  const problem = validateBankCharge(input);
  if (problem) throw new Error(problem);
  const sb = getSupabase();
  if (!sb) throw new Error("무통장입금 충전은 실제 서비스 환경에서만 신청할 수 있어요.");
  const info =
    input.receiptType === "cash_receipt"
      ? { purpose: input.cash!.purpose, number: digits(input.cash!.number) }
      : input.receiptType === "tax_invoice"
        ? { ...input.tax!, bizNo: digits(input.tax!.bizNo) }
        : {};
  const { data, error } = await sb.rpc("request_bank_charge", {
    p_amount: Math.round(input.amount),
    p_depositor: input.depositor.trim(),
    p_receipt_type: input.receiptType,
    p_receipt_info: info,
  });
  if (error) throw new Error(friendly(error.message));
  return data as string;
}

type Row = {
  id: string;
  amount: number;
  depositor: string;
  receipt_type: ReceiptType;
  receipt_info: ChargeRequest["receiptInfo"];
  status: ChargeRequestStatus;
  receipt_issued: boolean;
  admin_memo: string | null;
  created_at: string;
  processed_at: string | null;
};

export async function listMyChargeRequests(): Promise<ChargeRequest[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("charge_requests")
    .select("id,amount,depositor,receipt_type,receipt_info,status,receipt_issued,admin_memo,created_at,processed_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error("충전 신청 내역을 불러오지 못했어요.");
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    amount: r.amount,
    depositor: r.depositor,
    receiptType: r.receipt_type,
    receiptInfo: r.receipt_info ?? {},
    status: r.status,
    receiptIssued: r.receipt_issued,
    adminMemo: r.admin_memo,
    createdAt: r.created_at,
    processedAt: r.processed_at,
  }));
}

export async function cancelBankCharge(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data, error } = await sb.rpc("cancel_bank_charge", { p_id: id });
  if (error) throw new Error(friendly(error.message));
  return data === true;
}

// ---- admin --------------------------------------------------------------

export interface AdminChargeRequest extends ChargeRequest {
  userEmail: string | null;
}

export async function adminListChargeRequests(): Promise<AdminChargeRequest[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc("admin_charge_requests");
  if (error) throw new Error(friendly(error.message));
  return (data ?? []) as AdminChargeRequest[];
}

export async function adminConfirmBankCharge(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.rpc("admin_confirm_bank_charge", { p_id: id });
  if (error) throw new Error(friendly(error.message));
}

export async function adminCancelBankCharge(id: string, memo?: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.rpc("admin_cancel_bank_charge", { p_id: id, p_memo: memo ?? null });
  if (error) throw new Error(friendly(error.message));
}

export async function adminMarkReceiptIssued(id: string, issued: boolean): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.rpc("admin_mark_receipt_issued", { p_id: id, p_issued: issued });
  if (error) throw new Error(friendly(error.message));
}
