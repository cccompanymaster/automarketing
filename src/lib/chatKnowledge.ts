// Knowledge base for the consultation chatbot ("학습 데이터"). Built from the
// same catalog, price list, FAQ and terms the pages render, so the bot can
// only quote what the site actually says. Served at /chatbot-knowledge.txt
// (static) and fetched by the `chatbot` Edge Function.

import { COMPANY } from "@/lib/company";
import { PRODUCT_LIST, isPriceAmount } from "@/lib/products";
import { PRICING, displayPrice } from "@/lib/pricing";
import { PRODUCT_STORIES } from "@/lib/productStories";
import { SITE_FAQS } from "@/lib/faq";
import { TERMS } from "@/lib/legal";
import { BLOG_WRITE_COST } from "@/lib/blogWriter";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function buildChatKnowledge(siteUrl: string): string {
  const site = siteUrl.replace(/\/$/, "");
  const L: string[] = [];
  const h = (t: string) => L.push("", `## ${t}`, "");

  L.push(
    `# ${COMPANY.serviceName} 상담 지식`,
    "",
    `${COMPANY.serviceName}는 소상공인·온라인 셀러가 대행사 없이 마케팅 상품을 공개 단가로 직접 주문하는 셀프 마케팅 플랫폼입니다. 사이트: ${site}`,
  );

  h("회사·연락처");
  L.push(
    `- 상호: ${COMPANY.companyName} / 대표: ${COMPANY.ceo} / 사업자등록번호: ${COMPANY.businessRegistrationNumber}`,
    `- 전화: ${COMPANY.phone} / 이메일: ${COMPANY.email}`,
    `- 상담원 연결(카카오톡 1:1): ${COMPANY.kakaoChatUrl}`,
  );

  h("캐시·충전·결제");
  L.push(
    "- 상품은 캐시로 주문합니다. 1캐시 = 1원(부가세 별도). 상품 단가는 부가세 별도 금액입니다.",
    "- 충전할 때는 받을 캐시에 부가세 10%를 더해 결제합니다. 예: 100,000캐시 충전 → 110,000원 결제.",
    `- 무통장입금: ${COMPANY.bankAccount.bank} ${COMPANY.bankAccount.number} (예금주 ${COMPANY.bankAccount.holder}). 충전 신청 후 입금하면 확인 뒤 캐시가 적립됩니다(영업일 보통 1~2시간, 늦어도 다음 영업일).`,
    "- 충전 시 현금영수증(소득공제·지출증빙) 또는 세금계산서 발행을 요청할 수 있습니다.",
    "- 캐시가 부족하면 주문 창에서 바로 충전 화면으로 넘어갑니다. 주문·진행 상황은 마이페이지와 회원 홈에서 봅니다.",
    `- AI 블로그 원고 작성 도구는 1건 ${BLOG_WRITE_COST.toLocaleString("ko-KR")}캐시이며 제목·목차 생성은 무료입니다.`,
  );

  h("상품 단가표 (부가세 별도)");
  for (const g of PRICING) {
    L.push(`### ${g.title} — ${g.description}`);
    for (const it of g.items) {
      const p = displayPrice(it);
      const price =
        p.kind === "order"
          ? `${p.main}${p.from ? "부터" : ""}${p.unit ? ` / ${p.unit}` : ""}`
          : p.kind === "soon"
            ? "준비 중"
            : `견적 문의${it.price && !it.price.includes("견적") && !it.price.includes("문의") ? ` (${it.price})` : ""}`;
      const extra = [
        it.minQty && it.minQty > 1 && !it.note?.includes("최소")
          ? `최소 ${it.minQty.toLocaleString("ko-KR")}${it.unit?.replace(/^1/, "") ?? ""}`
          : "",
        it.step && it.step > 1 && !it.note?.includes("단위") ? `${it.step.toLocaleString("ko-KR")} 단위` : "",
        it.note ?? "",
      ]
        .filter(Boolean)
        .join(" · ");
      L.push(`- ${it.name}: ${price}${extra ? ` (${extra})` : ""}`);
    }
    L.push("");
  }

  h("상품 설명");
  for (const p of PRODUCT_LIST) {
    const d = p.detail;
    L.push(`### ${p.name} (${site}/services/${p.slug}/)`);
    L.push(`- 요약: ${p.summary.join(" ")}`, `- 소개: ${d.subhead}`);
    if (d.fromPrice) L.push(`- 시작 가격: ${d.fromPrice}${isPriceAmount(d.fromPrice) ? "부터" : ""}`);
    L.push(`- 비용: ${d.costRange} — ${d.costNote}`);
    L.push(`- 진행: ${d.steps.map((s) => s.title.replace(/^\d+\.\s*/, "")).join(" → ")}`);
    if (d.conditions.length) L.push(`- 조건: ${d.conditions.join(" / ")}`);
    if (d.materials?.length) L.push(`- 준비 자료: ${d.materials.join(", ")}`);
    const story = PRODUCT_STORIES[p.slug];
    if (story) {
      for (const sc of story.scenarios) L.push(`- 추천: "${sc.when}" → ${sc.then}`);
      for (const letter of story.letters ?? []) {
        L.push(`- [${letter.title}] ${letter.body.map((b) => (Array.isArray(b) ? b.join(" / ") : b)).join(" ")}`);
      }
    }
    L.push("");
  }

  h("자주 묻는 질문");
  for (const f of SITE_FAQS) L.push(`- Q. ${f.q}`, `  A. ${f.a}`);

  h("환불·취소 (이용약관 요약)");
  for (const s of TERMS.sections.filter((x) => /캐시|환불|취소/.test(x.heading))) {
    L.push(`### ${s.heading}`, ...s.body.map((b) => `- ${b}`));
  }

  h("무료 도구");
  L.push(
    `- 자영업자 무료 계산기(배달앱 수수료, 주휴수당, 4대보험, 급여명세서, 근로계약서, 손익분기점 등): ${site}/tools/`,
    `- 사장님 블로그: ${site}/blog/`,
  );

  L.push("", `참고 금액 예: 일반형 리워드 3,000타 = ${won(25 * 3000)}(부가세 별도).`);
  return L.join("\n") + "\n";
}
