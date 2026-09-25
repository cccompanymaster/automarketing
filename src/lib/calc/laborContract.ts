// 근로계약서 만들기 — pure checks behind the contract preview (no React/DOM).
//
// Calculation order & rounding:
// 1) Per day: 시업·종업 "HH:MM" → minutes. 종업 ≤ 시업 means the shift ends the
//    next day (+24h). 체류시간 − 휴게시간 = 근로시간 (minutes, no rounding).
//    시업 = 종업 is rejected (0h or 24h is ambiguous).
// 2) 휴게 기준 (LABOR_LAW.breakRules, 제54조): 근로시간 ≥ 4h → 30분, ≥ 8h →
//    60분. 근로시간 is measured *excluding* the break.
// 3) 주 근로시간 = sum of 근무 요일 근로시간. 주휴 = 주 ≥ 15h이면
//    min(주, 40) ÷ 40 × 8시간 (hourlyWage.weeklyHolidayHours).
// 4) 최저임금 비교 (minimumWageFor(시작일), 시작일 없으면 작성일 → 올해):
//    - 시급: 그대로.
//    - 일급: ÷ 1일 소정근로시간 = 주 근로시간 ÷ 근무일수 (요일별로 다르면 평균).
//    - 월급: ÷ 월 환산시간 = (주 소정 + 주휴) × 4.345주, 시간 단위 반올림,
//      주 40h 이상은 209h (payslip.monthlyStandardHours). 비교는 반올림 없이.
//    임금 미입력 → 비교 생략 (나머지 점검은 계속).
// 5) 연소근로자: 만 나이 = 기준일(시작일 → 작성일)에 생일이 지났는지로 계산.
//    < 18 (LABOR_LAW.minorAge) 1일 7h·주 35h 한도, < 15 취직인허증.
// 6) 위험 특약: RISKY_CLAUSE_RULES (data) — regex keyword rules with the law
//    article; rules that don't apply to 5인 미만 사업장 carry `skipUnder5`.
// 야간시간 = 22~6시 구간과 겹치는 체류시간 (휴게 위치를 몰라 휴게 미차감).

import { Check, ok, type CalcResult, type FieldIssue } from "./types";
import { formatNumber, formatWon, safeDiv } from "./num";
import { LABOR_LAW, minimumWageFor } from "./rates";
import { LABOR_DOCS } from "./rates/laborDocs";
import { weeklyHolidayHours } from "./hourlyWage";
import { monthlyStandardHours } from "./payslip";

const DAY_MIN = 24 * 60;

export const WEEKDAYS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
] as const;

/** "HH:MM" (00:00–23:59) → minutes since midnight; anything else → null. */
export function parseTime(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) return null;
  return hh * 60 + mm;
}

/** "8시간 30분" / "45분" / "0분". */
export function formatMinutes(min: number): string {
  const total = Math.max(0, Math.round(min));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** Minimum 휴게 minutes for a day's 근로시간 (제54조). */
export function requiredBreakMinutes(workMinutes: number): number {
  let need = 0;
  for (const r of LABOR_LAW.value.breakRules) if (workMinutes >= r.minWorkMinutes) need = Math.max(need, r.minBreakMinutes);
  return need;
}

/** Minutes of [start, start+span) that fall within 22:00–06:00. */
export function nightMinutes(startMin: number, spanMinutes: number): number {
  const { nightStartHour, nightEndHour } = LABOR_DOCS.value;
  const s = startMin;
  const e = startMin + spanMinutes;
  let total = 0;
  for (let k = -1; k <= 1; k++) {
    const ws = k * DAY_MIN + nightStartHour * 60;
    const we = (k + 1) * DAY_MIN + nightEndHour * 60;
    total += Math.max(0, Math.min(e, we) - Math.max(s, ws));
  }
  return total;
}

export interface DayHours {
  startMin: number;
  endMin: number;
  /** 종업이 다음 날 */
  overnight: boolean;
  spanMinutes: number;
  breakMinutes: number;
  workMinutes: number;
  requiredBreak: number;
  breakShortfall: number;
  nightMinutes: number;
}

/** One day's hours; null when the times can't form a shift (bad format, equal, break too long). */
export function dayHours(start: string, end: string, breakMinutes: number | null): DayHours | null {
  const s = parseTime(start);
  const e = parseTime(end);
  if (s == null || e == null || s === e) return null;
  const overnight = e < s;
  const span = overnight ? e + DAY_MIN - s : e - s;
  const br = breakMinutes ?? 0;
  if (br < 0 || br >= span) return null;
  const work = span - br;
  const need = requiredBreakMinutes(work);
  return {
    startMin: s,
    endMin: e,
    overnight,
    spanMinutes: span,
    breakMinutes: br,
    workMinutes: work,
    requiredBreak: need,
    breakShortfall: Math.max(0, need - br),
    nightMinutes: nightMinutes(s, span),
  };
}

/** 만 나이 on `ref` from YYYY-MM-DD strings (no timezone math). null if unparsable. */
export function ageOn(birth: string | null | undefined, ref: string | null | undefined): number | null {
  const b = parseYmd(birth);
  const r = parseYmd(ref);
  if (!b || !r) return null;
  let age = r.y - b.y;
  if (r.m < b.m || (r.m === b.m && r.d < b.d)) age -= 1;
  return age;
}

export function parseYmd(s: string | null | undefined): { y: number; m: number; d: number } | null {
  if (!s) return null;
  const mt = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim());
  if (!mt) return null;
  const y = Number(mt[1]);
  const m = Number(mt[2]);
  const d = Number(mt[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

const ymdKey = (s: string) => {
  const p = parseYmd(s);
  return p ? p.y * 10_000 + p.m * 100 + p.d : null;
};

// ───────────────────────── Risky clause rules ─────────────────────────

export interface RiskyClauseRule {
  id: string;
  title: string;
  /** 관련 법 조항 */
  article: string;
  patterns: RegExp[];
  message: string;
  /** Rule is moot for 상시 5인 미만 사업장 (article not applied there). */
  skipUnder5?: boolean;
}

export const RISKY_CLAUSE_RULES: RiskyClauseRule[] = [
  {
    id: "penalty",
    title: "위약금·손해배상액 예정",
    article: "근로기준법 제20조",
    patterns: [
      /위약금|위약벌|벌금|벌칙금|배상금/,
      /손해\s*배상\s*(액|금)?\s*(을|를)?\s*(미리|사전에?)?\s*(예정|정하|정한)/,
      /(무단|중도|조기)\s*(퇴사|퇴직|이직).{0,20}(배상|물어|변상)/,
      /교육비.{0,15}(반환|배상|변상|청구)/,
    ],
    message: "근로계약 불이행에 대한 위약금이나 손해배상 금액을 미리 정하는 계약은 금지돼요. 실제 손해는 별도로 입증해 청구해야 해요.",
  },
  {
    id: "wage-withheld",
    title: "퇴사 시 임금 미지급",
    article: "근로기준법 제36·43조",
    patterns: [/(퇴사|퇴직|그만\s*두).{0,30}(급여|임금|월급|수당).{0,10}(지급하지|미지급|주지\s*않|안\s*줌|몰수)/],
    message: "퇴사 사유와 관계없이 일한 기간의 임금은 전액 지급해야 하고, 퇴직 후 14일 이내에 정산해야 해요.",
  },
  {
    id: "advance-offset",
    title: "전차금 상계",
    article: "근로기준법 제21조",
    patterns: [/전차금/, /(선불금|선급금|가불금?).{0,15}(상계|공제|차감|제하)/, /(임금|급여|월급|수당).{0,15}상계|상계.{0,15}(임금|급여|월급)/],
    message: "일하는 조건으로 미리 빌려준 돈을 임금에서 일방적으로 빼는 약정은 금지돼요.",
  },
  {
    id: "forced-savings",
    title: "강제 저축·보증금",
    article: "근로기준법 제22조",
    patterns: [
      /강제\s*(저축|저금|적립)|저축\s*을?\s*강제/,
      /(임금|급여|월급).{0,15}(일부|일정|%).{0,10}(적립|예치|저축|저금|보관|유보)/,
      /보증금|적립금/,
    ],
    message: "근로계약에 덧붙여 저축이나 저축금 관리를 강제하는 약정은 금지돼요. 임금 일부를 맡아 두는 보증금도 여기에 해당할 수 있어요.",
  },
  {
    id: "severance-waiver",
    title: "퇴직금 없음·포기·포함",
    article: "근로자퇴직급여 보장법 제4·8조",
    patterns: [/퇴직금.{0,15}(없|미지급|지급하지|포기|포함|청구하지|않|대신)/, /퇴직금\s*(을|를)?\s*(월급|급여|임금)에/],
    message: "1년 이상·주 15시간 이상 일하면 퇴직금이 생기고, 미리 포기하거나 월급에 나눠 주기로 한 약정은 원칙적으로 효력이 없어요.",
  },
  {
    id: "below-minimum-wage",
    title: "최저임금 미만·감액",
    article: "최저임금법 제5·6조",
    patterns: [
      /최저\s*(임금|시급).{0,15}(미만|이하|적용\s*(하지|안|제외)|배제|예외|제외)/,
      /수습.{0,25}(90\s*%|구십|감액|삭감|깎)/,
    ],
    message: "최저임금보다 적게 주기로 한 부분은 무효예요. 수습 감액(최저임금의 90%)은 1년 이상 계약, 수습 3개월 이내, 단순노무직이 아닐 때만 가능해요.",
  },
  {
    id: "weekly-holiday",
    title: "주휴수당 없음·포함",
    article: "근로기준법 제55조, 시행령 제30조",
    patterns: [/주휴\s*(수당)?.{0,12}(없|미지급|지급하지|포함|제외|안\s*줌|주지\s*않)/],
    message: "주 15시간 이상이면 주휴수당을 줘야 해요. '시급에 주휴 포함'으로 하려면 기본 시급과 주휴수당 금액을 각각 적어야 인정될 여지가 있어요.",
  },
  {
    id: "overtime-pay",
    title: "연장·야간·휴일수당 없음·포괄임금",
    article: "근로기준법 제56조",
    patterns: [/(연장|야간|휴일)\s*(근로)?\s*(수당)?.{0,12}(없|미지급|지급하지|주지\s*않)/, /포괄\s*(임금|산정)/],
    message: "5인 이상 사업장은 연장·야간·휴일근로에 50% 이상 가산해야 해요. 5인 미만도 추가로 일한 시간만큼의 임금은 줘야 하고, 포괄임금 약정은 실제 수당보다 적으면 차액을 줘야 해요.",
  },
  {
    id: "annual-leave",
    title: "연차휴가 없음",
    article: "근로기준법 제60조",
    patterns: [/연차.{0,12}(없|미부여|부여하지|사용\s*(불가|할\s*수\s*없)|포기|주지\s*않)/],
    message: "상시 5인 이상 사업장은 연차유급휴가를 줘야 하고, 계약으로 미리 없앨 수 없어요.",
    skipUnder5: true,
  },
  {
    id: "social-insurance",
    title: "4대보험 미가입·3.3% 처리",
    article: "고용보험법·국민연금법·국민건강보험법·산재보험법",
    patterns: [/(4대|사대)\s*보험.{0,12}(미가입|가입\s*하지|가입\s*안|제외|없|하지\s*않)/, /3[.,]3\s*%/, /프리랜서|사업소득/],
    message: "근로자라면 합의로 4대보험 가입을 뺄 수 없어요. 계약서 이름을 프리랜서(3.3%)로 해도 실제로 지휘·감독을 받으며 일하면 근로자로 인정돼요.",
  },
  {
    id: "dismissal",
    title: "예고 없는 즉시 해고",
    article: "근로기준법 제23·26조",
    patterns: [/(즉시|언제든지?|통보\s*없이|예고\s*없이).{0,10}(해고|해지|계약\s*종료)/],
    message: "해고하려면 30일 전에 예고하거나 30일분 통상임금을 줘야 해요(5인 미만도 적용). 5인 이상은 정당한 이유도 있어야 해요.",
  },
  {
    id: "marriage-pregnancy",
    title: "결혼·임신 퇴직",
    article: "남녀고용평등법 제11조",
    patterns: [/(결혼|혼인|임신|출산).{0,15}(퇴직|퇴사|해고|사직|계약\s*(종료|해지))/],
    message: "결혼·임신·출산을 퇴직 사유로 정하는 근로계약은 금지돼요.",
  },
];

export interface RiskyClauseHit {
  id: string;
  title: string;
  article: string;
  message: string;
  /** The matched snippet. */
  match: string;
}

/** Scan contract clause texts for risky wording. One hit per rule. */
export function detectRiskyClauses(texts: string | string[], opts: { under5?: boolean } = {}): RiskyClauseHit[] {
  const list = (Array.isArray(texts) ? texts : [texts]).filter((t) => t && t.trim());
  const hits: RiskyClauseHit[] = [];
  for (const rule of RISKY_CLAUSE_RULES) {
    if (opts.under5 && rule.skipUnder5) continue;
    let match: string | null = null;
    outer: for (const t of list) {
      for (const p of rule.patterns) {
        const m = p.exec(t);
        if (m) {
          match = m[0];
          break outer;
        }
      }
    }
    if (match != null) hits.push({ id: rule.id, title: rule.title, article: rule.article, message: rule.message, match });
  }
  return hits;
}

/** Common, lawful optional clauses offered as a checklist. */
export const SPECIAL_CLAUSES = [
  { id: "probation", label: "수습기간 (임금 전액)", text: "수습기간은 근로 시작일부터 3개월로 하며, 수습기간에도 이 계약에서 정한 임금을 전액 지급한다." },
  { id: "secret", label: "영업비밀 유지", text: "근로자는 재직 중과 퇴직 후에도 업무상 알게 된 사업장의 영업비밀과 고객 정보를 외부에 누설하지 않는다." },
  { id: "privacy", label: "개인정보 수집·이용 동의", text: "근로자는 사업주가 근로계약 이행, 임금 지급, 사회보험 신고를 위해 필요한 범위에서 근로자의 개인정보를 수집·이용하는 데 동의한다." },
  { id: "schedule-change", label: "근무일정 변경 협의", text: "근무일과 근무시간을 바꿀 때에는 근로자와 협의하여 서면으로 정한다." },
  { id: "extra-work", label: "연장근로 합의", text: "연장·야간·휴일근로는 당사자가 합의한 경우에 하며, 상시 5인 이상 사업장은 법에서 정한 가산임금을 지급한다." },
  { id: "hygiene", label: "위생·안전 수칙 준수", text: "근로자는 업무에 필요한 위생·안전 교육을 받고 관련 수칙을 지킨다." },
  { id: "handover", label: "퇴직 시 인수인계", text: "근로자가 퇴직하려는 경우 원활한 인수인계를 위해 가능하면 30일 전에 사업주에게 알린다." },
  { id: "side-job", label: "겸업 사전 협의", text: "근로자는 근무시간 외에 다른 일을 겸할 때 업무에 지장이 없도록 사업주와 미리 협의한다." },
] as const;

// ───────────────────────── Contract analysis ─────────────────────────

export type WageType = "hourly" | "daily" | "monthly";

export const WAGE_TYPE_LABEL: Record<WageType, string> = { hourly: "시급", daily: "일급", monthly: "월급" };

export interface DayScheduleInput {
  work: boolean;
  start: string;
  end: string;
  breakMinutes: number | null;
}

export interface ContractInput {
  /** Mon..Sun, 7 entries */
  days: DayScheduleInput[];
  /** 주휴일 index (0 = 월 … 6 = 일) */
  weeklyHolidayIndex: number;
  wageType: WageType;
  wageAmount: number | null;
  writtenDate: string | null;
  startDate: string | null;
  /** null / "" = 기간의 정함이 없음 */
  endDate: string | null;
  workerBirth: string | null;
  under5: boolean;
  clauseTexts: string[];
}

export interface ContractAlert {
  level: "danger" | "warn" | "info";
  title: string;
  message: string;
  article?: string;
}

export interface MinWageCheck {
  year: number;
  minimum: number;
  hourlyEquivalent: number;
  /** Hours the wage was divided by (시급 1). */
  divisorHours: number;
  method: string;
  below: boolean;
}

export interface ContractAnalysis {
  days: (DayHours | null)[];
  workDays: number;
  weeklyMinutes: number;
  weeklyHours: number;
  maxDailyMinutes: number;
  weeklyHoliday: { eligible: boolean; hours: number };
  minWage: MinWageCheck | null;
  age: number | null;
  risky: RiskyClauseHit[];
  alerts: ContractAlert[];
}

/** 최저임금 환산 (see header 4). null when not computable. */
export function contractMinimumWage(opts: {
  wageType: WageType;
  amount: number;
  weeklyHours: number;
  workDays: number;
  date: string | null;
}): MinWageCheck | null {
  const { year, hourly: minimum } = minimumWageFor(opts.date || null);
  let divisor: number;
  let method: string;
  if (opts.wageType === "hourly") {
    divisor = 1;
    method = `시급 ${formatWon(opts.amount)}`;
  } else if (opts.wageType === "daily") {
    const d = safeDiv(opts.weeklyHours, opts.workDays);
    if (d == null || d <= 0) return null;
    divisor = d;
    method = `일급 ${formatWon(opts.amount)} ÷ 1일 소정 ${formatNumber(d, 2)}시간`;
  } else {
    if (!(opts.weeklyHours > 0)) return null;
    divisor = monthlyStandardHours(opts.weeklyHours);
    const hh = weeklyHolidayHours(Math.min(opts.weeklyHours, LABOR_LAW.value.fullTimeWeeklyHours));
    method = `월급 ${formatWon(opts.amount)} ÷ ${formatNumber(divisor)}시간 ((주 ${formatNumber(Math.min(opts.weeklyHours, LABOR_LAW.value.fullTimeWeeklyHours), 2)} + 주휴 ${formatNumber(hh, 2)}) × ${formatNumber(LABOR_LAW.value.weeksPerMonth, 3)}주)`;
  }
  const eq = opts.amount / divisor;
  return { year, minimum, hourlyEquivalent: eq, divisorHours: divisor, method, below: eq + 1e-9 < minimum };
}

export function analyzeContract(input: ContractInput): CalcResult<ContractAnalysis> {
  const c = new Check();
  const law = LABOR_LAW.value;
  const docs = LABOR_DOCS.value;
  const issues: FieldIssue[] = [];
  const days: (DayHours | null)[] = [];

  let anyWork = false;
  input.days.forEach((d, i) => {
    if (!d.work) {
      days.push(null);
      return;
    }
    anyWork = true;
    const label = WEEKDAYS[i]?.label ?? `${i + 1}`;
    if (!d.start || !d.end) {
      c.missing.push(`${label}요일 시업·종업 시각`);
      days.push(null);
      return;
    }
    if (d.breakMinutes != null && d.breakMinutes < 0) {
      issues.push({ field: `break-${i}`, message: `${label}요일 휴게시간은 0분 이상이어야 해요.` });
      days.push(null);
      return;
    }
    const s = parseTime(d.start);
    const e = parseTime(d.end);
    if (s == null || e == null) {
      issues.push({ field: `day-${i}`, message: `${label}요일 시각을 HH:MM 형식으로 입력해 주세요.` });
      days.push(null);
      return;
    }
    if (s === e) {
      issues.push({ field: `day-${i}`, message: `${label}요일 시업과 종업 시각이 같아요.` });
      days.push(null);
      return;
    }
    const r = dayHours(d.start, d.end, d.breakMinutes);
    if (!r) {
      issues.push({ field: `break-${i}`, message: `${label}요일 휴게시간이 근무시간보다 길어요.` });
      days.push(null);
      return;
    }
    days.push(r);
  });
  if (!anyWork) c.missing.push("근무 요일");
  c.positive("wageAmount", "임금", input.wageAmount);
  const sk = input.startDate ? ymdKey(input.startDate) : null;
  const ek = input.endDate ? ymdKey(input.endDate) : null;
  if (sk != null && ek != null && ek < sk) issues.push({ field: "endDate", message: "계약 종료일이 시작일보다 빨라요." });
  const refDate = input.startDate || input.writtenDate;
  const age = ageOn(input.workerBirth, refDate);
  if (age != null && age < 0) issues.push({ field: "workerBirth", message: "생년월일이 계약 시작일보다 늦어요." });
  c.issues.push(...issues);
  const early = c.result<ContractAnalysis>();
  if (early) return early;

  const alerts: ContractAlert[] = [];
  const worked = days.filter((d): d is DayHours => d != null);
  const workDays = worked.length;
  const weeklyMinutes = worked.reduce((s, d) => s + d.workMinutes, 0);
  const weeklyHours = weeklyMinutes / 60;
  const maxDailyMinutes = worked.reduce((m, d) => Math.max(m, d.workMinutes), 0);
  const eligible = weeklyHours >= law.weeklyHolidayMinHours;
  const whHours = weeklyHolidayHours(weeklyHours);

  // 휴게시간
  days.forEach((d, i) => {
    if (d && d.breakShortfall > 0)
      alerts.push({
        level: "danger",
        title: `${WEEKDAYS[i].label}요일 휴게시간 부족`,
        message: `근로 ${formatMinutes(d.workMinutes)}이면 휴게 ${d.requiredBreak}분 이상이 필요한데 ${d.breakMinutes}분으로 정했어요. 휴게는 근무 도중에 줘야 해요.`,
        article: "근로기준법 제54조",
      });
  });

  // 주휴
  if (eligible) {
    alerts.push({
      level: "info",
      title: "주휴수당 대상",
      message: `주 ${formatNumber(weeklyHours, 2)}시간으로 ${law.weeklyHolidayMinHours}시간 이상이라 소정근로일을 개근한 주마다 유급 주휴 ${formatNumber(whHours, 2)}시간이 생겨요.`,
      article: "근로기준법 제55조",
    });
  } else {
    alerts.push({
      level: "info",
      title: "초단시간 근로 (주휴 대상 아님)",
      message: `주 ${formatNumber(weeklyHours, 2)}시간으로 ${law.weeklyHolidayMinHours}시간 미만이라 주휴일·연차휴가·퇴직금 규정이 적용되지 않아요.`,
      article: "근로기준법 제18조 제3항",
    });
  }
  const hi = input.weeklyHolidayIndex;
  if (input.days[hi]?.work)
    alerts.push({
      level: "warn",
      title: "주휴일이 근무 요일과 겹쳐요",
      message: `${WEEKDAYS[hi]?.label ?? ""}요일을 주휴일로 골랐는데 근무 요일로도 체크돼 있어요.`,
    });
  if (workDays === 7)
    alerts.push({
      level: "warn",
      title: "휴일이 없어요",
      message: "7일 모두 근무일이에요. 1주 평균 1회 이상 유급휴일을 줘야 해요.",
      article: "근로기준법 제55조",
    });

  // 근로시간 한도
  const dailyStdMin = law.dailyStandardHours * 60;
  if (!input.under5) {
    if (maxDailyMinutes > dailyStdMin || weeklyHours > law.fullTimeWeeklyHours)
      alerts.push({
        level: "warn",
        title: "법정 근로시간 초과",
        message: `1일 ${law.dailyStandardHours}시간·1주 ${law.fullTimeWeeklyHours}시간을 넘는 시간은 연장근로라 통상임금의 50%를 더 줘야 해요.`,
        article: "근로기준법 제50·56조",
      });
    if (weeklyHours > law.fullTimeWeeklyHours + docs.weeklyOvertimeMax)
      alerts.push({
        level: "danger",
        title: `주 ${law.fullTimeWeeklyHours + docs.weeklyOvertimeMax}시간 초과`,
        message: `연장근로는 1주 ${docs.weeklyOvertimeMax}시간까지만 가능해요. 근무표를 줄여 주세요.`,
        article: "근로기준법 제53조",
      });
    if (worked.some((d) => d.nightMinutes > 0))
      alerts.push({
        level: "info",
        title: "야간근로 포함",
        message: `${docs.nightStartHour}시~${docs.nightEndHour}시 사이 근무는 통상임금의 50%를 더 줘야 해요.`,
        article: "근로기준법 제56조 제3항",
      });
  } else if (weeklyHours > law.fullTimeWeeklyHours || maxDailyMinutes > dailyStdMin) {
    alerts.push({
      level: "info",
      title: "5인 미만 사업장 근로시간",
      message: "상시 5인 미만은 법정 근로시간 한도와 가산수당 규정이 적용되지 않지만, 일한 시간만큼의 임금은 모두 줘야 해요.",
    });
  }

  // 계약기간
  const sp = parseYmd(input.startDate);
  const ep = parseYmd(input.endDate);
  if (sp && ep) {
    const limit = (sp.y + docs.fixedTermMaxYears) * 10_000 + sp.m * 100 + sp.d;
    if (ep.y * 10_000 + ep.m * 100 + ep.d > limit)
      alerts.push({
        level: "warn",
        title: `기간제 ${docs.fixedTermMaxYears}년 초과`,
        message: `기간제 근로자를 ${docs.fixedTermMaxYears}년 넘게 쓰면 기간의 정함이 없는 근로자로 봐요.`,
        article: "기간제법 제4조",
      });
  }

  // 최저임금
  let minWage: MinWageCheck | null = null;
  if (input.wageAmount != null) {
    minWage = contractMinimumWage({
      wageType: input.wageType,
      amount: input.wageAmount,
      weeklyHours,
      workDays,
      date: input.startDate || input.writtenDate,
    });
    if (minWage?.below)
      alerts.push({
        level: "danger",
        title: "최저임금 미달",
        message: `${minWage.method} = 시간당 약 ${formatWon(minWage.hourlyEquivalent)}으로 ${minWage.year}년 최저임금 ${formatWon(minWage.minimum)}보다 낮아요.`,
        article: "최저임금법 제6조",
      });
    if (input.wageType === "monthly" && weeklyHours > law.fullTimeWeeklyHours)
      alerts.push({
        level: "info",
        title: "월급 환산 기준",
        message: `주 ${law.fullTimeWeeklyHours}시간을 넘는 부분은 연장근로라 월 ${formatNumber(law.monthlyStandardHours)}시간 기준으로 최저임금을 비교했어요. 연장수당은 별도로 줘야 해요.`,
      });
  } else {
    alerts.push({ level: "info", title: "임금 미입력", message: "임금을 입력하면 최저임금 미달 여부를 확인해 드려요." });
  }

  // 연소근로자
  if (age != null && age < law.minorAge) {
    if (age < law.workPermitAge)
      alerts.push({
        level: "danger",
        title: `만 ${law.workPermitAge}세 미만`,
        message: `만 ${age}세예요. 고용노동부장관이 발급한 취직인허증이 있어야 고용할 수 있어요.`,
        article: "근로기준법 제64조",
      });
    alerts.push({
      level: "warn",
      title: `연소근로자 (만 ${age}세)`,
      message: `친권자(후견인) 동의서와 가족관계증명서를 사업장에 갖춰 두세요. 1일 ${law.minorDailyMax}시간·1주 ${law.minorWeeklyMax}시간을 넘길 수 없고, 임금은 본인에게 직접 지급해요.`,
      article: "근로기준법 제66·67·69조",
    });
    if (maxDailyMinutes > law.minorDailyMax * 60 || weeklyHours > law.minorWeeklyMax)
      alerts.push({
        level: "danger",
        title: "연소근로자 근로시간 초과",
        message: `하루 최대 ${formatMinutes(maxDailyMinutes)}, 주 ${formatNumber(weeklyHours, 2)}시간으로 한도(1일 ${law.minorDailyMax}시간·1주 ${law.minorWeeklyMax}시간)를 넘어요.`,
        article: "근로기준법 제69조",
      });
    if (worked.some((d) => d.nightMinutes > 0))
      alerts.push({
        level: "danger",
        title: "연소근로자 야간근로",
        message: `${docs.nightStartHour}시~${docs.nightEndHour}시 근무는 본인 동의와 고용노동부장관 인가가 있어야 해요.`,
        article: "근로기준법 제70조",
      });
  }

  // 특약
  const risky = detectRiskyClauses(input.clauseTexts, { under5: input.under5 });
  for (const r of risky)
    alerts.push({ level: "danger", title: `위험 문구: ${r.title}`, message: `"${r.match}" — ${r.message}`, article: r.article });

  const order = { danger: 0, warn: 1, info: 2 } as const;
  alerts.sort((a, b) => order[a.level] - order[b.level]);

  return ok({
    days,
    workDays,
    weeklyMinutes,
    weeklyHours,
    maxDailyMinutes,
    weeklyHoliday: { eligible, hours: whHours },
    minWage,
    age,
    risky,
    alerts,
  });
}

/** Group identical day schedules: "월·화·수 09:00 ~ 18:00 (휴게 60분)". */
export function scheduleSummary(days: DayScheduleInput[]): string[] {
  const groups: { key: string; labels: string[]; text: string }[] = [];
  days.forEach((d, i) => {
    if (!d.work || !d.start || !d.end) return;
    const s = parseTime(d.start);
    const e = parseTime(d.end);
    if (s == null || e == null) return;
    const text = `${d.start} ~ ${e <= s ? "다음 날 " : ""}${d.end} (휴게 ${d.breakMinutes ?? 0}분)`;
    const g = groups.find((x) => x.key === text);
    if (g) g.labels.push(WEEKDAYS[i].label);
    else groups.push({ key: text, labels: [WEEKDAYS[i].label], text });
  });
  return groups.map((g) => `${g.labels.join("·")} ${g.text}`);
}
