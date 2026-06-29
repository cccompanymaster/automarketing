// Order domain model. An order is created when a member spends cash on a
// product (see OrderModal). Pure types/helpers only — persistence lives in
// OrdersProvider (localStorage stub) or Supabase when configured.

export type OrderStatus = "received" | "in_progress" | "done" | "canceled";

/** Display labels (Korean UI). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  received: "접수",
  in_progress: "진행중",
  done: "완료",
  canceled: "취소",
};

/** Tailwind chip styles per status. */
export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  received: "bg-sky-50 text-sky-700",
  in_progress: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
  canceled: "bg-slate-100 text-slate-500",
};

/** Statuses an admin can move an order to (canceled handled separately). */
export const ORDER_STATUSES: OrderStatus[] = ["received", "in_progress", "done", "canceled"];

export interface Order {
  id: string;
  productName: string;
  /** Cash charged for this order. */
  amountCash: number;
  qty: number;
  status: OrderStatus;
  createdAt: string; // ISO
}

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABEL[status];
}
