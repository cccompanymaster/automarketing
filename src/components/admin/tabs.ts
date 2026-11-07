// Admin screens, in menu order. The key is also the URL hash (/admin/#orders).

export type AdminTab = "home" | "orders" | "charges" | "inquiries" | "members" | "deliverables" | "margins" | "content" | "links";

export const ADMIN_TABS: { key: AdminTab; icon: string; label: string }[] = [
  { key: "home", icon: "📊", label: "대시보드" },
  { key: "orders", icon: "🧾", label: "주문" },
  { key: "charges", icon: "💳", label: "충전·입금" },
  { key: "inquiries", icon: "💬", label: "문의" },
  { key: "members", icon: "👥", label: "회원" },
  { key: "deliverables", icon: "📦", label: "산출물" },
  { key: "margins", icon: "💰", label: "상품·마진" },
  { key: "content", icon: "📰", label: "콘텐츠" },
  { key: "links", icon: "🔗", label: "바로가기" },
];
