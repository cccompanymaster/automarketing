// Standard-form 근로계약서 layout (fixed ≈A4 width, inside DocumentFrame).
// Section order follows the 고용노동부 표준 근로계약서 item list (근로계약기간,
// 근무장소, 업무내용, 소정근로시간, 근무일/휴일, 임금, 연차유급휴가,
// 사회보험, 계약서 교부, 성실 이행, 기타, 서명); the wording is our own.

import { formatNumber, formatWon, parseNumber } from "@/lib/calc/num";
import { LABOR_LAW } from "@/lib/calc/rates";
import { WAGE_TYPE_LABEL, WEEKDAYS, type ContractAnalysis, type WageType } from "@/lib/calc/laborContract";
import { Blank, formatKoDate, type MoneyRow } from "./PayslipDocumentFrame";

export interface ContractDocData {
  company: string;
  ceo: string;
  companyAddress: string;
  companyPhone: string;
  workerName: string;
  workerBirth: string;
  workerAddress: string;
  workerPhone: string;
  writtenDate: string;
  startDate: string;
  hasEnd: boolean;
  endDate: string;
  place: string;
  job: string;
  scheduleLines: string[];
  workDayLabels: string[];
  holidayIndex: number;
  wageType: WageType;
  wageAmount: string;
  bonus: boolean;
  bonusAmount: string;
  allowances: MoneyRow[];
  payDay: string;
  payMethod: "transfer" | "direct";
  under5: boolean;
  insurance: { employment: boolean; industrial: boolean; pension: boolean; health: boolean };
  clauses: string[];
}

const LAW = LABOR_LAW.value;
const box = (on: boolean) => (on ? "■" : "□");

function Article({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-3.5 break-inside-avoid">
      <h3 className="font-bold">
        {n}. {title}
      </h3>
      <div className="mt-1 pl-4">{children}</div>
    </section>
  );
}

export function LaborContractDocument({ d, analysis }: { d: ContractDocData; analysis: ContractAnalysis | null }) {
  const wage = parseNumber(d.wageAmount);
  const bonus = parseNumber(d.bonusAmount);
  const allowances = d.allowances.filter((r) => r.name.trim() || parseNumber(r.amount));
  const weekly = analysis ? analysis.weeklyHours : null;
  const shortWeek = analysis != null && !analysis.weeklyHoliday.eligible;
  const minor = analysis?.age != null && analysis.age < LAW.minorAge;
  const holidayLabel = WEEKDAYS[d.holidayIndex]?.label ?? "일";

  return (
    <div className="px-11 py-10">
      <h2 className="text-center text-[24px] font-extrabold tracking-[0.25em]">표준 근로계약서</h2>
      <p className="mt-1 text-center text-[12px] text-slate-500">({d.hasEnd ? "기간의 정함이 있는 경우" : "기간의 정함이 없는 경우"})</p>

      <p className="mt-6">
        <Blank value={d.company} width="9em" /> (이하 “사업주”)와(과) <Blank value={d.workerName} width="6em" /> (이하 “근로자”)은(는) 아래와 같이
        근로계약을 맺는다.
      </p>

      <Article n={1} title="근로계약기간">
        {d.startDate ? formatKoDate(d.startDate) : formatKoDate("")}부터{" "}
        {d.hasEnd ? <>{d.endDate ? formatKoDate(d.endDate) : formatKoDate("")}까지</> : "기간의 정함 없이 근로한다."}
      </Article>

      <Article n={2} title="근무 장소">
        <Blank value={d.place} width="16em" />
      </Article>

      <Article n={3} title="업무 내용">
        <Blank value={d.job} width="16em" />
      </Article>

      <Article n={4} title="소정근로시간 및 휴게시간">
        {d.scheduleLines.length ? (
          <ul className="space-y-0.5">
            {d.scheduleLines.map((l) => (
              <li key={l}>· {l}</li>
            ))}
          </ul>
        ) : (
          <p>
            <Blank width="4em" />시 <Blank width="3em" />분부터 <Blank width="4em" />시 <Blank width="3em" />분까지 (휴게시간 <Blank width="3em" />분)
          </p>
        )}
        {weekly != null && <p className="mt-1">· 1주 소정근로시간 합계: {formatNumber(weekly, 2)}시간</p>}
        <p className="mt-1 text-[12px] text-slate-600">휴게시간은 근로시간 도중에 주며, 근로자가 자유롭게 이용한다.</p>
      </Article>

      <Article n={5} title="근무일 및 휴일">
        <p>
          · 근무일: 매주 {d.workDayLabels.length ? `${d.workDayLabels.length}일 (${d.workDayLabels.join("·")})` : <Blank width="8em" />}
        </p>
        <p>
          · 주휴일: 매주 {holidayLabel}요일
          {shortWeek ? ` — 1주 소정근로시간이 ${LAW.weeklyHolidayMinHours}시간 미만이어서 유급 주휴일은 적용하지 않는다.` : " — 1주 소정근로일을 모두 출근하면 유급으로 한다."}
        </p>
      </Article>

      <Article n={6} title="임금">
        <p>
          · {WAGE_TYPE_LABEL[d.wageType]}: {wage != null ? formatWon(wage) : <Blank width="7em" />}
        </p>
        <p>
          · 상여금: {box(d.bonus)} 있음{d.bonus ? ` (${bonus != null ? formatWon(bonus) : "금액 별도 협의"})` : ""} &nbsp; {box(!d.bonus)} 없음
        </p>
        <p>
          · 기타 급여(제수당 등): {box(allowances.length > 0)} 있음 &nbsp; {box(allowances.length === 0)} 없음
        </p>
        {allowances.length > 0 && (
          <ul className="pl-4">
            {allowances.map((r, i) => (
              <li key={i}>
                - {r.name.trim() || "수당"}: {parseNumber(r.amount) != null ? formatWon(parseNumber(r.amount)) : "금액 협의"}
              </li>
            ))}
          </ul>
        )}
        <p>
          · 임금 지급일: 매월 {d.payDay.trim() ? d.payDay.trim() : <Blank width="2.5em" />}일 (휴일인 경우 그 전날 지급)
        </p>
        <p>
          · 지급 방법: {box(d.payMethod === "direct")} 근로자에게 직접 지급 &nbsp; {box(d.payMethod === "transfer")} 근로자 명의 예금통장에 입금
        </p>
        {!d.under5 && <p className="mt-1 text-[12px] text-slate-600">연장·야간·휴일근로에는 근로기준법에 따라 통상임금의 {Math.round(LAW.overtimePremium * 100)}% 이상을 가산하여 지급한다.</p>}
      </Article>

      <Article n={7} title="연차유급휴가">
        {shortWeek
          ? `1주 소정근로시간이 ${LAW.weeklyHolidayMinHours}시간 미만이므로 연차유급휴가 규정은 적용하지 않는다.`
          : d.under5
            ? "상시 근로자 5인 미만 사업장으로 법정 연차유급휴가 규정은 적용되지 않으며, 당사자가 따로 정한 경우 그에 따른다."
            : "연차유급휴가는 근로기준법에서 정하는 바에 따라 준다."}
      </Article>

      <Article n={8} title="사회보험 적용 여부">
        <p>
          {box(d.insurance.employment)} 고용보험 &nbsp; {box(d.insurance.industrial)} 산재보험 &nbsp; {box(d.insurance.pension)} 국민연금 &nbsp;{" "}
          {box(d.insurance.health)} 건강보험
        </p>
      </Article>

      <Article n={9} title="근로계약서 교부">
        사업주는 근로계약을 맺는 동시에 이 계약서 사본을 근로자에게 교부한다. 근로자가 요구하지 않아도 교부한다(근로기준법 제17조).
      </Article>

      <Article n={10} title="근로계약, 취업규칙 등의 성실한 이행 의무">
        사업주와 근로자는 각자 근로계약, 취업규칙, 단체협약을 지키고 성실하게 이행하여야 한다.
      </Article>

      <Article n={11} title="기타">
        이 계약에서 정하지 않은 사항은 근로기준법 등 노동관계 법령에 따른다.
        {minor && <p className="mt-1">※ 연소근로자: 친권자(후견인) 동의서와 가족관계증명서를 사업장에 갖춰 둔다.</p>}
      </Article>

      <Article n={12} title="특약사항">
        {d.clauses.length ? (
          <ol className="list-decimal space-y-0.5 pl-4">
            {d.clauses.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>
        ) : (
          "없음"
        )}
      </Article>

      <p className="mt-8 text-center text-[14px]">{d.writtenDate ? formatKoDate(d.writtenDate) : formatKoDate("")}</p>

      <div className="mt-6 grid grid-cols-2 gap-6 break-inside-avoid">
        <div className="border-t-2 border-slate-900 pt-3">
          <p className="font-bold">(사업주)</p>
          <dl className="mt-1.5 space-y-1.5">
          <SignRow label="사업체명" value={d.company} />
          <SignRow label="대표자" value={d.ceo} sign />
          <SignRow label="주소" value={d.companyAddress} />
          <SignRow label="연락처" value={d.companyPhone} />
          </dl>
        </div>
        <div className="border-t-2 border-slate-900 pt-3">
          <p className="font-bold">(근로자)</p>
          <dl className="mt-1.5 space-y-1.5">
          <SignRow label="성명" value={d.workerName} sign />
          <SignRow label="생년월일" value={d.workerBirth ? formatKoDate(d.workerBirth) : ""} />
          <SignRow label="주소" value={d.workerAddress} />
          <SignRow label="연락처" value={d.workerPhone} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function SignRow({ label, value, sign }: { label: string; value: string; sign?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 text-slate-600">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">
        <Blank value={value} width={sign ? "65%" : "100%"} />
        {sign && <span className="ml-2 whitespace-nowrap text-slate-500">(서명)</span>}
      </dd>
    </div>
  );
}
