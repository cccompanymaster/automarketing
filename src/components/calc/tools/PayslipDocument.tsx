// Formal 급여명세서 layout (fixed ≈A4 width, rendered inside DocumentFrame).
// Holds the items 근로기준법 제48조 제2항·시행령 제27조의2 asks for: 근로자
// 특정 정보, 지급일, 임금 총액, 항목별 금액, 계산방법(연장·야간·휴일 시간 수
// 포함), 공제 항목별 금액과 총액.

import type { PayslipLine, PayslipResult } from "@/lib/calc/payslip";
import { formatNumber, formatWon } from "@/lib/calc/num";
import { Blank, formatKoDate } from "./PayslipDocumentFrame";

export interface PayslipMeta {
  workerName: string;
  workerId: string;
  company: string;
  payDate: string;
  periodStart: string;
  periodEnd: string;
  payTypeLabel: string;
  under5: boolean;
  workDays: number | null;
  workHours: number | null;
  overtimeHours: number | null;
  nightHours: number | null;
  holidayHours: number | null;
}

const TH = "border border-slate-400 bg-slate-100 px-2.5 py-1.5 text-left font-semibold";
const TD = "border border-slate-400 px-2.5 py-1.5";

function monthTitle(m: PayslipMeta): string {
  const src = m.periodStart || m.payDate;
  const mt = /^(\d{4})-(\d{2})/.exec(src);
  return mt ? `${Number(mt[1])}년 ${Number(mt[2])}월분` : "";
}

const hours = (n: number | null) => (n == null ? "—" : `${formatNumber(n, 2)}시간`);

function LinesTable({ title, methodTitle, lines, emptyText }: { title: string; methodTitle: string; lines: PayslipLine[]; emptyText: string }) {
  return (
    <table className="mt-4 w-full border-collapse">
      <caption className="mb-1.5 text-left text-[14px] font-bold">{title}</caption>
      <thead>
        <tr>
          <th scope="col" className={`${TH} w-[24%]`}>
            항목
          </th>
          <th scope="col" className={`${TH} w-[22%] text-right`}>
            금액
          </th>
          <th scope="col" className={TH}>
            {methodTitle}
          </th>
        </tr>
      </thead>
      <tbody>
        {lines.length === 0 ? (
          <tr>
            <td colSpan={3} className={`${TD} py-3 text-center text-slate-400`}>
              {emptyText}
            </td>
          </tr>
        ) : (
          lines.map((l) => (
            <tr key={l.key}>
              <th scope="row" className={`${TD} text-left font-medium`}>
                {l.label}
              </th>
              <td className={`${TD} num text-right`}>{formatWon(l.amount)}</td>
              <td className={`${TD} text-[12px] text-slate-600`}>{l.method}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export function PayslipDocument({ meta, value }: { meta: PayslipMeta; value: PayslipResult | null }) {
  const period =
    meta.periodStart || meta.periodEnd
      ? `${formatKoDate(meta.periodStart, "—")} ~ ${formatKoDate(meta.periodEnd, "—")}`
      : "";
  return (
    <div className="px-10 py-9">
      <header className="border-b-2 border-slate-900 pb-3 text-center">
        <h2 className="text-[26px] font-extrabold tracking-[0.4em]">급여명세서</h2>
        {monthTitle(meta) && <p className="mt-1 text-[13px] text-slate-600">{monthTitle(meta)}</p>}
      </header>

      <table className="mt-5 w-full border-collapse">
        <caption className="sr-only">근로자 및 지급 정보</caption>
        <tbody>
          <tr>
            <th scope="row" className={`${TH} w-[17%]`}>
              성명
            </th>
            <td className={`${TD} w-[33%]`}>
              <Blank value={meta.workerName} />
            </td>
            <th scope="row" className={`${TH} w-[17%]`}>
              생년월일(사번)
            </th>
            <td className={TD}>
              <Blank value={meta.workerId} />
            </td>
          </tr>
          <tr>
            <th scope="row" className={TH}>
              사업장명
            </th>
            <td className={TD}>
              <Blank value={meta.company} />
            </td>
            <th scope="row" className={TH}>
              지급일
            </th>
            <td className={TD}>{meta.payDate ? formatKoDate(meta.payDate) : <Blank />}</td>
          </tr>
          <tr>
            <th scope="row" className={TH}>
              급여 기간
            </th>
            <td className={TD}>{period || <Blank width="12em" />}</td>
            <th scope="row" className={TH}>
              임금 형태
            </th>
            <td className={TD}>
              {meta.payTypeLabel}
              {meta.under5 ? " · 5인 미만 사업장" : ""}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="mt-4 w-full border-collapse text-center">
        <caption className="mb-1.5 text-left text-[14px] font-bold">근로시간</caption>
        <thead>
          <tr>
            {["근로일수", "기본 근로시간", "연장근로", "야간근로", "휴일근로"].map((t) => (
              <th key={t} scope="col" className={`${TH} text-center`}>
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="num">
            <td className={TD}>{meta.workDays == null ? "—" : `${formatNumber(meta.workDays, 1)}일`}</td>
            <td className={TD}>{hours(meta.workHours)}</td>
            <td className={TD}>{hours(meta.overtimeHours)}</td>
            <td className={TD}>{hours(meta.nightHours)}</td>
            <td className={TD}>{hours(meta.holidayHours)}</td>
          </tr>
        </tbody>
      </table>

      <LinesTable title="지급 내역" methodTitle="계산방법" lines={value?.earnings ?? []} emptyText="임금 정보를 입력하면 지급 항목이 표시돼요." />
      <LinesTable title="공제 내역" methodTitle="산출 근거" lines={value?.deductions ?? []} emptyText="공제 항목 없음" />

      <table className="mt-5 w-full border-collapse">
        <caption className="sr-only">합계</caption>
        <tbody>
          <tr>
            <th scope="row" className={`${TH} w-[24%]`}>
              지급 총액
            </th>
            <td className={`${TD} num text-right font-semibold`}>{value ? formatWon(value.grossPay) : "—"}</td>
            <th scope="row" className={`${TH} w-[24%]`}>
              공제 총액
            </th>
            <td className={`${TD} num text-right font-semibold`}>{value ? formatWon(value.totalDeductions) : "—"}</td>
          </tr>
          <tr>
            <th scope="row" className="border-2 border-slate-900 bg-slate-900 px-2.5 py-2.5 text-left text-[15px] font-bold text-white">
              실지급액
            </th>
            <td colSpan={3} className="num border-2 border-slate-900 px-3 py-2.5 text-right text-[20px] font-extrabold">
              {value ? formatWon(value.netPay) : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {value && value.notes.length > 0 && (
        <ul className="mt-3 list-disc space-y-0.5 pl-5 text-[11.5px] text-slate-600">
          {value.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      <footer className="mt-8 text-center">
        <p>위와 같이 임금을 지급합니다.</p>
        <p className="mt-2">{meta.payDate ? formatKoDate(meta.payDate) : formatKoDate("")}</p>
        <p className="mt-3 font-semibold">
          <Blank value={meta.company} width="10em" /> <span className="ml-2 text-slate-500">(인)</span>
        </p>
        <p className="mt-6 border-t border-slate-300 pt-2 text-[11px] text-slate-500">
          근로기준법 제48조 제2항에 따라 임금 총액·항목별 금액·계산방법·공제 내역을 적어 교부하는 임금명세서입니다.
        </p>
      </footer>
    </div>
  );
}
