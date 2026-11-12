import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, breadcrumbLd } from "@/lib/seo";
import { storeProducts } from "@/lib/store";
import { PRICING } from "@/lib/pricing";

// Public store: guests browse every product and price; ordering asks them to sign up.
export const metadata: Metadata = {
  title: "상품·요금 — 마케팅 상품 단가 공개 스토어",
  description:
    "네이버 플레이스·블로그·카페·카카오맵·당근·인스타·언론보도까지 마케팅방주 전체 상품의 단가와 최소 주문금액을 가입 없이 확인하세요. 주문할 때만 무료로 가입하면 돼요.",
  alternates: { canonical: "/pricing/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const catalog = storeProducts(PRICING);
  return <>
    <JsonLd data={[
      breadcrumbLd([{ name: "홈", path: "/" }, { name: "상품·요금", path: "/pricing/" }]),
      { "@context": "https://schema.org", "@type": "ItemList", name: "마케팅 상품·요금",
        itemListElement: catalog.map((product, index) => ({
          "@type": "ListItem", position: index + 1, url: absoluteUrl("/store/" + product.id + "/"),
        })) },
    ]} />
    {children}
  </>;
}
