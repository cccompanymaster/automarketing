"use client";

// Order window + top-up as one flow. When cash runs short the draft (qty,
// request, form) is saved and the charge window opens preset to the
// shortfall; closing or finishing the charge returns to the same order
// window. A bank transfer keeps the draft for later ("이어서 주문하기").
// Charging never places the order by itself.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { OrderModal, type OrderDraft } from "@/components/OrderModal";
import { ChargeModal } from "@/components/ChargeModal";
import { clearOrderDraft, saveOrderDraft } from "@/lib/orderDraft";
import { orderFormFor, orderVariant, withoutSecrets } from "@/lib/orderForms";
import { krwToCash } from "@/lib/cash";
import type { PricingItem } from "@/lib/pricing";

export function OrderFlow({
  item,
  initialDraft,
  onClose,
}: {
  item: PricingItem | null;
  /** Restores a saved draft (resume banner). */
  initialDraft?: OrderDraft | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [charging, setCharging] = useState<{ shortfall: number; total: number } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- new item → its own draft
    setDraft(initialDraft ?? null);
  }, [item, initialDraft]);

  return (
    <>
      <OrderModal
        item={item && !charging ? item : null}
        draft={draft}
        onClose={onClose}
        onOrdered={() => user && clearOrderDraft(user.id)}
        onNeedCharge={(missing, d) => {
          if (!item) return;
          const spec = orderFormFor(item.name);
          const total = krwToCash(orderVariant(item.name, item.amountKrw ?? 0, spec, d.form ?? {}).unitKrw * d.qty);
          setDraft(d);
          // Never persist a password; the member types it again after the top-up.
          if (user) saveOrderDraft(user.id, { itemName: item.name, qty: d.qty, request: d.request, form: withoutSecrets(spec, d.form ?? {}), totalCash: total });
          setCharging({ shortfall: missing, total });
        }}
      />
      <ChargeModal
        open={charging !== null}
        shortfallCash={charging?.shortfall}
        orderCash={charging?.total}
        onClose={(outcome) => {
          setCharging(null);
          if (outcome === "bank_requested") {
            toast.info("입금이 확인되면 '이어서 주문하기'로 작성하던 주문서를 다시 열 수 있어요.", { duration: 8000 });
            onClose();
          }
          // charged / dismissed: the order window reopens with the draft.
        }}
      />
    </>
  );
}
