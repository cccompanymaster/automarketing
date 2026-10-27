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

/** Orders still being worked on (shown as "진행 중인 프로그램"). */
export function isActiveOrder(o: Order): boolean {
  return o.status === "received" || o.status === "in_progress";
}

/** Rough progress for the status bar: 접수 → 진행중 → 완료. */
export const ORDER_PROGRESS: Record<OrderStatus, number> = {
  received: 25,
  in_progress: 65,
  done: 100,
  canceled: 0,
};
