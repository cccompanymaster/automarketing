// 2026년 자영업자 기준값 — the data page (GEO's "primary source" asset).
// Every number is read from the same rate config the calculators use, with
// its source, effective period, check date and basis — so this page, the
// calculators and llms.txt can never disagree.

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import {
  AREA,
  CARD_FEES,
  CARD_FEES_GENERAL_DEFAULT,
  EMPLOYMENT_INSURANCE,
  HEALTH_INSURANCE,
  INDUSTRIAL_ACCIDENT,
  LABOR_LAW,
  LONG_TERM_CARE,
  MINIMUM_WAGE,
  NATIONAL_PENSION,
  VAT,
  WITHHOLDING,
  isAssumed,
  type Sourced,
} from "@/lib/calc/rates";
import {
  BAEMIN_FEES,
  BAEMIN_PAYMENT,
  COUPANG_EATS_FEES,
  DDANGYO_FEES,
  DELIVERY_FEE_REPRESENTATIVE,
  YOGIYO_FEES,
} from "@/lib/calc/rates/delivery";
import { LEGAL_MAX_INTEREST } from "@/lib/calc/rates/storeCosts";
import { CALC_HUB_PATH, CALC_REVIEWED_AT } from "@/lib/calc/registry";
import { OG_BASE, ORG_ID, absoluteUrl, breadcrumbLd, faqLd } from "@/lib/seo";

const PATH = "/tools/rates/";
const TITLE = "2026년 자영업자 기준값 — 최저임금·4대보험 요율·카드수수료";

const pct = (r: number) => `${Math.round(r * 100000) / 1000}%`;
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// Headline figures for the direct answer (derived, not typed in).
const wage = MINIMUM_WAGE.value.byYear;
const wageNow = wage[MINIMUM_WAGE.value.currentYear];
const monthlyWage = wageNow * LABOR_LAW.value.monthlyStandardHours;
const employeeRate =
  NATIONAL_PENSION.value.employee +
  HEALTH_INSURANCE.value.employee * (1 + LONG_TERM_CARE.value.ratioOfHealth) +
  EMPLOYMENT_INSURANCE.value.employee;
const ANSWER = `${MINIMUM_WAGE.value.currentYear}년 최저임금은 시급 ${won(wageNow)}(월 ${won(monthlyWage)})이고, 근로자 4대보험 부담은 월급의 약 ${pct(Math.round(employeeRate * 1000) / 1000)}예요.`;

const DESCRIPTION = `${ANSWER} 국민연금·건강·장기요양·고용·산재보험 요율, 카드 우대수수료, 원천징수, 배달앱 수수료까지 출처·적용 기간·확인일과 함께 정리했어요.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { ...OG_BASE, title: TITLE, description: DESCRIPTION, url: PATH },
};

interface Row {
  label: string;
  value: string;
  src: Sourced<unknown>;
}

interface Group {
  id: string;
  title: string;
  lead: string;
  rows: Row[];
}

const GROUPS: Group[] = [
  {
    id: "wage",
    title: "최저임금",
    lead: `${MINIMUM_WAGE.value.currentYear}년 최저임금은 시급 ${won(wageNow)}이고, 주 40시간 근무자의 월 환산액은 ${won(monthlyWage)}(209시간)이에요.`,
    rows: Object.keys(wage)
      .map(Number)
      .sort()
      .map((y) => ({
        label: `${y}년 최저임금 (시급)`,
        value: `${won(wage[y])} · 월 ${won(wage[y] * LABOR_LAW.value.monthlyStandardHours)}`,
        src: MINIMUM_WAGE,
      })),
  },
  {
    id: "insurance",
    title: "4대보험 요율",
    lead: `근로자 부담은 국민연금 ${pct(NATIONAL_PENSION.value.employee)}, 건강보험 ${pct(HEALTH_INSURANCE.value.employee)}, 장기요양(건강보험료의 ${pct(LONG_TERM_CARE.value.ratioOfHealth)}), 고용보험 ${pct(EMPLOYMENT_INSURANCE.value.employee)}이에요. 산재보험은 사업주가 전액 내요.`,
    rows: [
      {
        label: "국민연금",
        value: `${pct(NATIONAL_PENSION.value.total)} (근로자·사업주 각 ${pct(NATIONAL_PENSION.value.employee)}) · 기준소득월액 ${won(NATIONAL_PENSION.value.baseMin)}~${won(NATIONAL_PENSION.value.baseMax)}`,
        src: NATIONAL_PENSION,
      },
      {
        label: "건강보험",
        value: `${pct(HEALTH_INSURANCE.value.total)} (근로자·사업주 각 ${pct(HEALTH_INSURANCE.value.employee)})`,
        src: HEALTH_INSURANCE,
      },
      { label: "장기요양보험", value: `건강보험료 × ${pct(LONG_TERM_CARE.value.ratioOfHealth)} (반씩 부담)`, src: LONG_TERM_CARE },
      {
        label: "고용보험 (실업급여)",
        value: `근로자 ${pct(EMPLOYMENT_INSURANCE.value.employee)} · 사업주 ${pct(EMPLOYMENT_INSURANCE.value.employerUnemployment)}`,
        src: EMPLOYMENT_INSURANCE,
      },
      ...EMPLOYMENT_INSURANCE.value.employerStability.map((s) => ({
        label: `고용안정·직업능력개발 (${s.label})`,
        value: `사업주 ${pct(s.rate)}`,
        src: EMPLOYMENT_INSURANCE as Sourced<unknown>,
      })),
      ...INDUSTRIAL_ACCIDENT.value.byIndustry.map((i) => ({
        label: `산재보험 — ${i.label}`,
        value: `${pct(i.rate)} + 출퇴근재해 ${pct(INDUSTRIAL_ACCIDENT.value.commute)} (사업주 전액)`,
        src: INDUSTRIAL_ACCIDENT as Sourced<unknown>,
      })),
    ],
  },
  {
    id: "tax",
    title: "원천징수·부가세",
    lead: `프리랜서(사업소득) 원천징수는 ${pct(WITHHOLDING.value.businessRate * (1 + WITHHOLDING.value.localRatio))}, 일용근로자는 일당에서 ${won(WITHHOLDING.value.daily.deductionPerDay)}을 뺀 금액의 ${pct(WITHHOLDING.value.daily.rate)}에 세액공제 ${pct(WITHHOLDING.value.daily.taxCreditRatio)}를 적용해요.`,
    rows: [
      {
        label: "사업소득 (프리랜서)",
        value: `소득세 ${pct(WITHHOLDING.value.businessRate)} + 지방소득세 ${pct(WITHHOLDING.value.businessRate * WITHHOLDING.value.localRatio)}`,
        src: WITHHOLDING,
      },
      {
        label: "일용근로소득",
        value: `(일당 − ${won(WITHHOLDING.value.daily.deductionPerDay)}) × ${pct(WITHHOLDING.value.daily.rate)} × (1 − ${pct(WITHHOLDING.value.daily.taxCreditRatio)}), 1일 ${won(WITHHOLDING.value.daily.smallAmountThreshold)} 미만 소액부징수`,
        src: WITHHOLDING,
      },
      { label: "부가가치세 (일반과세자)", value: pct(VAT.value.rate), src: VAT },
      { label: "간이과세 기준", value: `직전 연도 공급대가 ${won(VAT.value.simplifiedThreshold)} 미만`, src: VAT },
    ],
  },
  {
    id: "card",
    title: "카드 우대수수료",
    lead: "연 매출 30억 원 이하 영세·중소가맹점은 우대수수료가 적용되고, 30억 원 초과 일반가맹점은 카드사와 개별 계약한 요율을 내요.",
    rows: [
      ...CARD_FEES.value.tiers.map((t) => ({
        label: t.label,
        value: `신용 ${pct(t.credit)} · 체크 ${pct(t.check)}`,
        src: CARD_FEES as Sourced<unknown>,
      })),
      {
        label: "30억 원 초과 일반가맹점 (대표값)",
        value: `신용 ${pct(CARD_FEES_GENERAL_DEFAULT.value.credit)} · 체크 ${pct(CARD_FEES_GENERAL_DEFAULT.value.check)}`,
        src: CARD_FEES_GENERAL_DEFAULT,
      },
    ],
  },
  {
    id: "delivery",
    title: "배달앱 수수료",
    lead: "배달앱 중개수수료는 매출 구간에 따라 달라요. 플랫폼 약관·보도 기준이라 가정값으로 표시하며, 실제 요율은 정산서를 기준으로 확인하세요.",
    rows: [
      {
        label: "배민배달 중개이용료",
        value: `상위 35% ${pct(BAEMIN_FEES.value.delivery.top35)} · 35~80% ${pct(BAEMIN_FEES.value.delivery.mid35to50)} · 하위 20% ${pct(BAEMIN_FEES.value.delivery.bottom20)}`,
        src: BAEMIN_FEES,
      },
      { label: "배민 가게배달 · 픽업", value: `${pct(BAEMIN_FEES.value.store.top35)} · ${pct(BAEMIN_FEES.value.pickup.top35)}`, src: BAEMIN_FEES },
      {
        label: "배민 결제정산이용료",
        value: `영세 ${pct(BAEMIN_PAYMENT.value.byRevenue.t3)} ~ 일반 ${pct(BAEMIN_PAYMENT.value.byRevenue.general)}`,
        src: BAEMIN_PAYMENT,
      },
      {
        label: "쿠팡이츠 중개수수료",
        value: `상위 35% ${pct(COUPANG_EATS_FEES.value.delivery.top35)} · 35~80% ${pct(COUPANG_EATS_FEES.value.delivery.mid35to50)} · 하위 20% ${pct(COUPANG_EATS_FEES.value.delivery.bottom20)}`,
        src: COUPANG_EATS_FEES,
      },
      {
        label: "쿠팡이츠 포장",
        value: `${pct(COUPANG_EATS_FEES.value.pickup.top35)} (하위 20%·전통시장 ${COUPANG_EATS_FEES.value.pickupFreeUntil}까지 무료)`,
        src: COUPANG_EATS_FEES,
      },
      {
        label: "요기배달 중개수수료",
        value: `${pct(YOGIYO_FEES.value.delivery.bottom20)} ~ ${pct(YOGIYO_FEES.value.delivery.top35)} (월 주문 수 기준) · 포장 ${pct(YOGIYO_FEES.value.pickup.top35)}`,
        src: YOGIYO_FEES,
      },
      { label: "땡겨요 중개수수료", value: `${pct(DDANGYO_FEES.value.delivery.top35)} · 결제 최대 ${pct(DDANGYO_FEES.value.payment.t3)}`, src: DDANGYO_FEES },
      {
        label: "업주 부담 배달비 (배민·쿠팡)",
        value: `상위 35% ${won(DELIVERY_FEE_REPRESENTATIVE.value.bands.top35.min)}~${won(DELIVERY_FEE_REPRESENTATIVE.value.bands.top35.max)} · 35~50% ${won(DELIVERY_FEE_REPRESENTATIVE.value.bands.mid35to50.min)}~${won(DELIVERY_FEE_REPRESENTATIVE.value.bands.mid35to50.max)} · 50~100% ${won(DELIVERY_FEE_REPRESENTATIVE.value.bands.mid50to80.min)}~${won(DELIVERY_FEE_REPRESENTATIVE.value.bands.mid50to80.max)}`,
        src: DELIVERY_FEE_REPRESENTATIVE,
      },
    ],
  },
  {
    id: "etc",
    title: "근로기준·기타",
    lead: `주휴수당은 1주 소정근로시간 ${LABOR_LAW.value.weeklyHolidayMinHours}시간 이상이면 생기고, 5인 이상 사업장의 연장·야간·휴일근로는 통상임금의 ${pct(LABOR_LAW.value.overtimePremium)}를 더 줘요.`,
    rows: [
      { label: "주휴수당 요건", value: `1주 소정근로시간 ${LABOR_LAW.value.weeklyHolidayMinHours}시간 이상 + 개근`, src: LABOR_LAW },
      { label: "월 소정근로시간 (주 40시간)", value: `${LABOR_LAW.value.monthlyStandardHours}시간 (주휴 포함)`, src: LABOR_LAW },
      {
        label: "가산수당 (5인 이상)",
        value: `연장·야간 ${pct(LABOR_LAW.value.overtimePremium)}, 휴일 8시간 이내 ${pct(LABOR_LAW.value.holidayPremiumUpTo8h)} · 초과 ${pct(LABOR_LAW.value.holidayPremiumOver8h)}`,
        src: LABOR_LAW,
      },
      { label: "휴게시간", value: "4시간 근무 30분 이상, 8시간 근무 1시간 이상", src: LABOR_LAW },
      { label: "법정 최고이자율", value: `연 ${pct(LEGAL_MAX_INTEREST.value.annualRate)}`, src: LEGAL_MAX_INTEREST },
      { label: "면적 환산", value: `1평 = ${AREA.value.m2PerPyeong}㎡`, src: AREA },
    ],
  },
];

const BASIS_LABEL: Record<string, string> = {
  law: "법령",
  official: "정부 발표",
  platform: "가정값 (플랫폼·보도)",
  assumed: "가정값",
};

const FAQ = [
  {
    q: `${MINIMUM_WAGE.value.currentYear}년 최저임금은 얼마인가요?`,
    a: `${MINIMUM_WAGE.value.currentYear}년 최저임금은 시급 ${won(wageNow)}이고 주 40시간 근무 시 월 ${won(monthlyWage)}이에요. ${MINIMUM_WAGE.value.currentYear + 1}년 최저임금은 시급 ${won(wage[MINIMUM_WAGE.value.currentYear + 1])}로 고시됐어요.`,
  },
  {
    q: "직원 월급에서 4대보험은 몇 % 떼나요?",
    a: `${MINIMUM_WAGE.value.currentYear}년 근로자 부담은 국민연금 ${pct(NATIONAL_PENSION.value.employee)}, 건강보험 ${pct(HEALTH_INSURANCE.value.employee)}, 장기요양(건강보험료의 ${pct(LONG_TERM_CARE.value.ratioOfHealth)}), 고용보험 ${pct(EMPLOYMENT_INSURANCE.value.employee)}로 합계 월급의 약 ${pct(Math.round(employeeRate * 1000) / 1000)}예요. 소득세는 별도예요.`,
  },
  {
    q: "이 페이지의 숫자는 언제 확인한 값인가요?",
    a: `표마다 출처·적용 기간·확인일을 적어 두었어요. 현재 값은 ${CALC_REVIEWED_AT}에 확인했고, 정부 발표로 바뀌면 이 페이지와 계산기를 함께 갱신해요.`,
  },
];

export default function RatesPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "무료 계산기", path: CALC_HUB_PATH },
            { name: "2026년 자영업자 기준값", path: PATH },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: TITLE,
            description: DESCRIPTION,
            url: absoluteUrl(PATH),
            dateModified: CALC_REVIEWED_AT,
            inLanguage: "ko-KR",
            isAccessibleForFree: true,
            creator: { "@id": ORG_ID },
            publisher: { "@id": ORG_ID },
            keywords: ["최저임금", "4대보험 요율", "국민연금", "건강보험", "고용보험", "산재보험", "카드수수료", "원천징수", "배달앱 수수료"],
          },
          faqLd(FAQ),
        ]}
      />
      <SiteHeader />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-5 sm:pt-12">
          <nav aria-label="이동 경로" className="text-sm">
            <Link href={CALC_HUB_PATH} className="-my-2 inline-flex min-h-10 items-center font-semibold text-emerald-700 hover:text-emerald-900">
              ← 계산기 홈
            </Link>
          </nav>
          <h1 className="mt-3 pr-16 text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl lg:pr-0">{TITLE}</h1>
          <p className="mt-4 rounded-2xl bg-emerald-50 px-5 py-4 text-lg font-bold leading-relaxed text-emerald-950 ring-1 ring-emerald-100">
            {ANSWER}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {COMPANY_NOTE} 기준값 확인일: <b>{CALC_REVIEWED_AT}</b>.
          </p>

          <nav aria-label="분류" className="mt-5 flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="min-h-10 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:text-emerald-800">
                {g.title}
              </a>
            ))}
          </nav>

          {GROUPS.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`h-${g.id}`} className="mt-10 scroll-mt-20">
              <h2 id={`h-${g.id}`} className="text-xl font-bold text-slate-900">
                {g.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{g.lead}</p>
              <div className="mt-3 overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-100">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <caption className="sr-only">{g.title} 기준값</caption>
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500">
                      <th scope="col" className="px-4 py-2.5 font-semibold">항목</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">값</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">적용</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">근거 · 확인일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {g.rows.map((r) => (
                      <tr key={r.label} className="align-top">
                        <th scope="row" className="px-4 py-3 font-semibold text-slate-800">{r.label}</th>
                        <td className="num px-4 py-3 text-slate-900">{r.value}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{r.src.effective ?? "현행"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          <span className={`mr-1 rounded px-1.5 py-0.5 font-bold ${isAssumed(r.src) ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {BASIS_LABEL[r.src.basis]}
                          </span>
                          {r.src.url ? (
                            <a href={r.src.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-800">
                              {r.src.source}
                            </a>
                          ) : (
                            r.src.source
                          )}
                          <span className="block text-slate-400">확인 {r.src.checkedAt}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <section aria-labelledby="rates-faq" className="mt-10">
            <h2 id="rates-faq" className="text-lg font-bold text-slate-900">자주 묻는 질문</h2>
            <dl className="mt-3 divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-100">
              {FAQ.map((f) => (
                <div key={f.q} className="px-5 py-4">
                  <dt className="font-bold text-slate-900">{f.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="mt-8 text-sm text-slate-600">
            이 값으로 바로 계산하기:{" "}
            <Link href="/tools/hourly-wage/" className="font-semibold text-emerald-700 underline underline-offset-2">시급·주휴수당</Link>
            {" · "}
            <Link href="/tools/payroll/" className="font-semibold text-emerald-700 underline underline-offset-2">4대보험 공제</Link>
            {" · "}
            <Link href="/tools/card-fee/" className="font-semibold text-emerald-700 underline underline-offset-2">카드 수수료</Link>
            {" · "}
            <Link href="/delivery/" className="font-semibold text-emerald-700 underline underline-offset-2">배달 수익</Link>
            {" · "}
            <Link href="/blog/" className="font-semibold text-emerald-700 underline underline-offset-2">사장님 블로그</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

const COMPANY_NOTE =
  "정부 고시·보도자료와 법령을 기준으로 정리했고, 무료 계산기 26종이 모두 이 값으로 계산해요. 플랫폼 요율처럼 공식 확인이 어려운 값은 가정값으로 표시했어요.";
