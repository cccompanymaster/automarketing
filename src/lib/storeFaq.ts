// Questions shown on a store product page. Every answer is assembled from data
// the page already shows (prices, minimums, materials, conditions), so the FAQ
// never says something the rest of the page doesn't.

import { displayPrice, minOrderKrw, type PricingItem } from "@/lib/pricing";

export interface StoreFaqItem {
  q: string;
  a: string;
}

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function minOrderText(o: PricingItem): string | null {
  const min = minOrderKrw(o);
  if (min == null) return null;
  return o.minQty && o.minQty > 1 ? `${o.minQty.toLocaleString("ko-KR")}${o.unit?.replace(/^1/, "") ?? ""} · ${won(min)}` : won(min);
}

export function storeFaq({
  options,
  materials,
  claims,
  conditions,
  isBlogWrite,
}: {
  options: PricingItem[];
  materials: string[];
  /** Summary + benefits: a "보장" line here is what the product promises. */
  claims: string[];
  conditions: string[];
  isBlogWrite: boolean;
}): StoreFaqItem[] {
  const priced = options.filter((o) => displayPrice(o).kind === "order");
  const items: StoreFaqItem[] = [
    { q: "표시된 금액에 부가세가 포함돼 있나요?", a: "아니요. 표시 금액은 부가세 별도이며, 1캐시는 1원으로 계산돼요." },
  ];

  if (isBlogWrite) {
    items.push({ q: "원고는 어떻게 받나요?", a: "주제만 입력하면 바로 원고가 나와요. 1건 500캐시." });
  } else if (priced.length === 0) {
    items.push({ q: "견적은 어떻게 받나요?", a: "상품 특성상 맞춤 견적으로 진행돼요. 문의 남겨 주시면 24시간 안에 연락드려요." });
  } else {
    items.push({ q: "캐시가 부족하면 어떻게 주문하나요?", a: "주문 창에서 바로 충전한 뒤 이어서 주문할 수 있어요." });
    const mins = priced.map((o) => [o.name, minOrderText(o)] as const).filter(([, m]) => m);
    if (mins.length) items.push({ q: "옵션별 최소 주문은 얼마인가요?", a: mins.map(([n, m]) => `${n} ${m}부터`).join(" / ") + "." });
  }

  if (materials.length) {
    const head = materials.slice(0, 3).join("·") + (materials.length > 3 ? " 등" : "");
    items.push({
      q: "주문할 때 어떤 자료가 필요한가요?",
      a: `주문 창에서 입력해요(${head}). 준비가 안 된 건 주문 후 카카오톡으로 보내도 돼요.`,
    });
  }

  const promise = claims.find((c) => c.includes("보장"));
  const caveat =
    conditions.find((c) => c.includes("보장") || c.includes("달라질")) ?? "노출·순위 같은 성과는 검색·플랫폼 환경에 따라 달라질 수 있어요.";
  items.push({ q: "성과가 보장되나요?", a: [promise ? `보장 내용: ${promise}.` : "", caveat].filter(Boolean).join(" ") });

  items.push({ q: "처음인데 가입이 필요한가요?", a: "처음이면 1분 가입 후, 고른 상품의 주문 화면으로 바로 돌아와요." });
  return items;
}
