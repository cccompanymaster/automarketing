// A member's unfinished order (product row, quantity, request, form answers),
// kept when they leave the order window to top up cash so they can pick it up
// again after the charge, a bank-transfer wait or a reload. Browser-local:
// it never places an order by itself.

import type { FormValues } from "@/lib/orderForms";

export interface SavedOrderDraft {
  itemName: string;
  qty: number;
  request: string;
  form?: FormValues;
  /** Cash the order needs, for the resume banner. */
  totalCash: number;
  savedAt: string;
}

const key = (userId: string) => `selfmarketing.orderDraft.${userId}`;
/** Drafts older than this are dropped (prices or needs may have changed). */
const MAX_AGE_MS = 14 * 24 * 3600_000;

export function loadOrderDraft(userId: string): SavedOrderDraft | null {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return null;
    const d = JSON.parse(raw) as SavedOrderDraft;
    if (Date.now() - Date.parse(d.savedAt) > MAX_AGE_MS) {
      localStorage.removeItem(key(userId));
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

export function saveOrderDraft(userId: string, d: Omit<SavedOrderDraft, "savedAt">): void {
  try {
    localStorage.setItem(key(userId), JSON.stringify({ ...d, savedAt: new Date().toISOString() }));
    window.dispatchEvent(new Event("orderdraft"));
  } catch {
    /* ignore */
  }
}

export function clearOrderDraft(userId: string): void {
  try {
    localStorage.removeItem(key(userId));
    window.dispatchEvent(new Event("orderdraft"));
  } catch {
    /* ignore */
  }
}
