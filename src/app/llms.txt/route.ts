// /llms.txt — a Markdown guide for AI assistants (GEO). Built at `next build`
// from the same catalog the pages render, so it never drifts from what the
// site actually says. Static export renders this GET into out/llms.txt.

import { COMPANY } from "@/lib/company";
import { PRODUCT_LIST } from "@/lib/products";
import { CALCULATORS, CALC_CATEGORIES, CALC_REVIEWED_AT } from "@/lib/calc/registry";
import { BLOG_PATH, getPublishedPosts } from "@/lib/blog";
import {
  CARD_FEES,
  EMPLOYMENT_INSURANCE,
  HEALTH_INSURANCE,
  LONG_TERM_CARE,
  MINIMUM_WAGE,
  NATIONAL_PENSION,
} from "@/lib/calc/rates";

export const dynamic = "force-static";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://selfmarketing.example").replace(/\/$/, "");
const url = (path: string) => `${SITE}${path}`;
const pct = (r: number) => `${Math.round(r * 100000) / 1000}%`;

function body(): string {
  const w = MINIMUM_WAGE.value.byYear;
  const years = Object.keys(w).sort();
  const lines: string[] = [
    `# ${COMPANY.serviceName} (${new URL(SITE).host})`,
    "",
    `> 소상공인·온라인 셀러·매장 운영자를 위한 셀프 마케팅 플랫폼. 네이버 플레이스·블로그·카카오맵·당근·인스타그램 등 채널별 마케팅 상품을 공개 단가로 직접 주문하고, 자영업자용 무료 계산기 ${CALCULATORS.length}종(배달앱 수수료, 주휴수당, 4대보험, 급여명세서, 근로계약서, 손익분기점 등)을 제공합니다.`,
    "",
    `운영: ${COMPANY.companyName} (대표 ${COMPANY.ceo}, 사업자등록번호 ${COMPANY.businessRegistrationNumber}) · 문의: ${COMPANY.email}`,
    "",
    "## 자영업자 무료 계산기",
    "",
    `모든 계산기는 가입 없이 무료이며, 결과마다 계산식·세부 내역·가정과 한계·기준값 확인일을 함께 보여 줍니다. 입력값은 브라우저에서만 계산되고 서버에 저장되지 않습니다. 콘텐츠 검토일: ${CALC_REVIEWED_AT}.`,
    "",
  ];
  for (const cat of CALC_CATEGORIES) {
    lines.push(`### ${cat.title}`, "");
    for (const c of CALCULATORS.filter((x) => x.category === cat.key)) {
      lines.push(`- [${c.title}](${url(c.path)}): ${c.summary}`);
    }
    lines.push("");
  }
  lines.push(
    `- [계산기 전체 목록](${url("/tools/")})`,
    "",
    "## 계산기에 쓰는 기준값 (출처·확인일)",
    "",
    `전체 표: [2026년 자영업자 기준값](${url("/tools/rates/")}) — 항목마다 출처·적용 기간·확인일·근거 수준을 표시한 데이터 페이지.`,
    "",
    `- 최저임금: ${years.map((y) => `${y}년 시급 ${w[Number(y)].toLocaleString("ko-KR")}원`).join(", ")} — ${MINIMUM_WAGE.source} (확인 ${MINIMUM_WAGE.checkedAt})`,
    `- 국민연금: ${pct(NATIONAL_PENSION.value.total)} (근로자·사업주 각 ${pct(NATIONAL_PENSION.value.employee)}), 기준소득월액 ${NATIONAL_PENSION.value.baseMin.toLocaleString("ko-KR")}~${NATIONAL_PENSION.value.baseMax.toLocaleString("ko-KR")}원 (확인 ${NATIONAL_PENSION.checkedAt})`,
    `- 건강보험: ${pct(HEALTH_INSURANCE.value.total)} (각 ${pct(HEALTH_INSURANCE.value.employee)}), 장기요양: 건강보험료의 ${pct(LONG_TERM_CARE.value.ratioOfHealth)} (확인 ${HEALTH_INSURANCE.checkedAt})`,
    `- 고용보험(실업급여): 근로자 ${pct(EMPLOYMENT_INSURANCE.value.employee)}, 사업주 ${pct(EMPLOYMENT_INSURANCE.value.employerUnemployment)} + 고용안정·직업능력개발 (확인 ${EMPLOYMENT_INSURANCE.checkedAt})`,
    `- 신용카드 우대수수료(영세·중소가맹점): ${CARD_FEES.value.tiers.map((t) => `${t.label} 신용 ${pct(t.credit)}·체크 ${pct(t.check)}`).join(" / ")} (적용 ${CARD_FEES.effective}, 확인 ${CARD_FEES.checkedAt})`,
    "- 배달앱 수수료는 플랫폼 약관·보도 기준 가정값이며 계산기 화면에서 직접 수정할 수 있습니다.",
    "",
  );
  const posts = getPublishedPosts();
  if (posts.length) {
    lines.push("## 사장님 블로그 (질문 하나 = 글 하나)", "");
    for (const p of posts) lines.push(`- [${p.title}](${url(`${BLOG_PATH}${p.slug}/`)}): ${p.answer} (데이터 기준일 ${p.data_asof})`);
    lines.push("");
  }
  lines.push(
    "## 마케팅 상품",
    "",
  );
  for (const p of PRODUCT_LIST) {
    const from = p.detail.fromPrice ? ` (최소 ${p.detail.fromPrice}부터)` : "";
    lines.push(`- [${p.name}](${url(`/services/${p.slug}/`)}): ${p.summary.join(" ")}${from}`);
  }
  lines.push(
    "",
    "## 인용 안내",
    "",
    `- 표기: ${COMPANY.serviceName} (${new URL(SITE).host})`,
    "- 계산 결과는 참고용이며 실제 정산·세금·법적 판단과 다를 수 있습니다. 기준값은 각 계산기 페이지의 확인일을 함께 인용해 주세요.",
    `- [개인정보처리방침](${url("/privacy/")}) · [이용약관](${url("/terms/")})`,
    "",
  );
  return lines.join("\n");
}

export function GET() {
  return new Response(body(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
