import { describe, expect, it } from "vitest";
import {
  SPECIAL_CLAUSES,
  RISKY_CLAUSE_RULES,
  ageOn,
  analyzeContract,
  contractMinimumWage,
  dayHours,
  detectRiskyClauses,
  formatMinutes,
  nightMinutes,
  parseTime,
  requiredBreakMinutes,
  scheduleSummary,
  type ContractInput,
  type DayScheduleInput,
} from "../laborContract";

const off: DayScheduleInput = { work: false, start: "", end: "", breakMinutes: null };
const day = (start: string, end: string, br: number | null = 60): DayScheduleInput => ({ work: true, start, end, breakMinutes: br });
const weekdays = (d: DayScheduleInput) => [d, d, d, d, d, off, off];

const input = (over: Partial<ContractInput> = {}): ContractInput => ({
  days: weekdays(day("09:00", "18:00")),
  weeklyHolidayIndex: 6,
  wageType: "hourly",
  wageAmount: 10_320,
  writtenDate: "2026-09-25",
  startDate: "2026-10-01",
  endDate: null,
  workerBirth: "1995-04-10",
  under5: false,
  clauseTexts: [],
  ...over,
});

const okOf = (i: ContractInput) => {
  const r = analyzeContract(i);
  if (r.status !== "ok") throw new Error(`${r.status}: ${JSON.stringify(r)}`);
  return r.value;
};
const titles = (i: ContractInput) => okOf(i).alerts.map((a) => a.title);

describe("parseTime / formatMinutes", () => {
  it("parses HH:MM", () => {
    expect(parseTime("09:00")).toBe(540);
    expect(parseTime("0:05")).toBe(5);
    expect(parseTime("23:59")).toBe(1439);
  });
  it("rejects bad input", () => {
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("9시")).toBeNull();
    expect(parseTime("")).toBeNull();
    expect(parseTime("12:60")).toBeNull();
  });
  it("formats minutes", () => {
    expect(formatMinutes(510)).toBe("8시간 30분");
    expect(formatMinutes(480)).toBe("8시간");
    expect(formatMinutes(45)).toBe("45분");
    expect(formatMinutes(0)).toBe("0분");
  });
});

describe("requiredBreakMinutes (제54조)", () => {
  it("boundaries at 4h and 8h", () => {
    expect(requiredBreakMinutes(239)).toBe(0);
    expect(requiredBreakMinutes(240)).toBe(30);
    expect(requiredBreakMinutes(479)).toBe(30);
    expect(requiredBreakMinutes(480)).toBe(60);
    expect(requiredBreakMinutes(720)).toBe(60);
  });
});

describe("dayHours", () => {
  it("09:00–18:00, 휴게 60 → 8h, no shortfall", () => {
    const d = dayHours("09:00", "18:00", 60)!;
    expect(d.spanMinutes).toBe(540);
    expect(d.workMinutes).toBe(480);
    expect(d.breakShortfall).toBe(0);
    expect(d.overnight).toBe(false);
    expect(d.nightMinutes).toBe(0);
  });
  it("overnight 22:00–06:00 → next day", () => {
    const d = dayHours("22:00", "06:00", 60)!;
    expect(d.overnight).toBe(true);
    expect(d.spanMinutes).toBe(480);
    expect(d.workMinutes).toBe(420);
    expect(d.nightMinutes).toBe(480);
    expect(d.breakShortfall).toBe(0);
  });
  it("4h without break → 30분 부족", () => {
    const d = dayHours("09:00", "13:00", 0)!;
    expect(d.workMinutes).toBe(240);
    expect(d.breakShortfall).toBe(30);
  });
  it("exactly 8h work with 30분 휴게 → 60분 필요", () => {
    const d = dayHours("09:00", "17:30", 30)!;
    expect(d.workMinutes).toBe(480);
    expect(d.requiredBreak).toBe(60);
    expect(d.breakShortfall).toBe(30);
  });
  it("empty break counts as 0", () => {
    expect(dayHours("10:00", "13:00", null)!.workMinutes).toBe(180);
  });
  it("invalid shifts → null", () => {
    expect(dayHours("09:00", "09:00", 0)).toBeNull();
    expect(dayHours("09:00", "10:00", 60)).toBeNull();
    expect(dayHours("09:00", "18:00", -1)).toBeNull();
    expect(dayHours("x", "18:00", 0)).toBeNull();
  });
});

describe("nightMinutes (22~6시)", () => {
  it("overlaps", () => {
    expect(nightMinutes(20 * 60, 240)).toBe(120);
    expect(nightMinutes(4 * 60, 240)).toBe(120);
    expect(nightMinutes(9 * 60, 480)).toBe(0);
    expect(nightMinutes(18 * 60, 12 * 60)).toBe(480);
  });
});

describe("ageOn (만 나이)", () => {
  it("birthday boundary", () => {
    expect(ageOn("2010-03-15", "2026-03-14")).toBe(15);
    expect(ageOn("2010-03-15", "2026-03-15")).toBe(16);
    expect(ageOn("2008-10-02", "2026-10-01")).toBe(17);
    expect(ageOn("2008-10-01", "2026-10-01")).toBe(18);
  });
  it("unparsable → null", () => {
    expect(ageOn("", "2026-01-01")).toBeNull();
    expect(ageOn("2010/03/15", "2026-01-01")).toBeNull();
  });
});

describe("contractMinimumWage", () => {
  it("hourly", () => {
    const r = contractMinimumWage({ wageType: "hourly", amount: 10_000, weeklyHours: 40, workDays: 5, date: "2026-10-01" })!;
    expect(r.below).toBe(true);
    expect(r.minimum).toBe(10_320);
  });
  it("daily ÷ 1일 소정시간 (평균)", () => {
    const r = contractMinimumWage({ wageType: "daily", amount: 82_560, weeklyHours: 40, workDays: 5, date: "2026-10-01" })!;
    expect(r.divisorHours).toBe(8);
    expect(r.hourlyEquivalent).toBe(10_320);
    expect(r.below).toBe(false);
    expect(contractMinimumWage({ wageType: "daily", amount: 80_000, weeklyHours: 40, workDays: 5, date: "2026-10-01" })!.below).toBe(true);
  });
  it("monthly ÷ (주 + 주휴) × 4.345", () => {
    expect(contractMinimumWage({ wageType: "monthly", amount: 10_320 * 209, weeklyHours: 40, workDays: 5, date: "2026-10-01" })!.below).toBe(false);
    expect(contractMinimumWage({ wageType: "monthly", amount: 2_000_000, weeklyHours: 40, workDays: 5, date: "2026-10-01" })!.below).toBe(true);
    const pt = contractMinimumWage({ wageType: "monthly", amount: 1_100_000, weeklyHours: 20, workDays: 5, date: "2026-10-01" })!;
    expect(pt.divisorHours).toBe(104);
    expect(pt.below).toBe(false);
  });
  it("2027 start → 10,700원", () => {
    expect(contractMinimumWage({ wageType: "hourly", amount: 10_320, weeklyHours: 40, workDays: 5, date: "2027-01-01" })!.below).toBe(true);
  });
  it("0 hours → null (no division by zero)", () => {
    expect(contractMinimumWage({ wageType: "daily", amount: 80_000, weeklyHours: 0, workDays: 0, date: null })).toBeNull();
    expect(contractMinimumWage({ wageType: "monthly", amount: 80_000, weeklyHours: 0, workDays: 0, date: null })).toBeNull();
  });
});

describe("analyzeContract — hours", () => {
  it("주 5일 × 8h = 40h, 주휴 대상 8h", () => {
    const v = okOf(input());
    expect(v.weeklyHours).toBe(40);
    expect(v.workDays).toBe(5);
    expect(v.weeklyHoliday).toEqual({ eligible: true, hours: 8 });
    expect(v.alerts.filter((a) => a.level === "danger")).toEqual([]);
  });
  it("overnight shifts sum correctly", () => {
    const v = okOf(input({ days: [day("22:00", "07:00", 60), day("22:00", "07:00", 60), off, off, off, off, off] }));
    expect(v.weeklyHours).toBe(16);
    expect(v.weeklyHoliday.eligible).toBe(true);
    expect(titles(input({ days: [day("22:00", "07:00", 60), off, off, off, off, off, off] }))).toContain("야간근로 포함");
  });
  it("주 15h 미만 → 초단시간", () => {
    const v = okOf(input({ days: [day("10:00", "14:00", 30), day("10:00", "14:00", 30), day("10:00", "14:00", 30), off, off, off, off] }));
    expect(v.weeklyHours).toBe(10.5);
    expect(v.weeklyHoliday.eligible).toBe(false);
    expect(v.alerts.some((a) => a.title.startsWith("초단시간"))).toBe(true);
  });
  it("exactly 15h → 대상", () => {
    const v = okOf(input({ days: [day("09:00", "14:30", 30), day("09:00", "14:30", 30), day("09:00", "14:30", 30), off, off, off, off] }));
    expect(v.weeklyHours).toBe(15);
    expect(v.weeklyHoliday).toEqual({ eligible: true, hours: 3 });
  });
  it("휴게 부족 alert", () => {
    expect(titles(input({ days: weekdays(day("09:00", "17:30", 30)) }))).toContain("월요일 휴게시간 부족");
  });
  it("5인 이상 주 52h 초과 → danger; 5인 미만 → info only", () => {
    const six = [day("08:00", "18:00", 60), day("08:00", "18:00", 60), day("08:00", "18:00", 60), day("08:00", "18:00", 60), day("08:00", "18:00", 60), day("08:00", "18:00", 60), off];
    const t = titles(input({ days: six }));
    expect(t).toContain("주 52시간 초과");
    expect(t).toContain("법정 근로시간 초과");
    const u = titles(input({ days: six, under5: true }));
    expect(u).not.toContain("주 52시간 초과");
    expect(u).toContain("5인 미만 사업장 근로시간");
  });
  it("주휴일이 근무일과 겹침 / 7일 근무", () => {
    expect(titles(input({ weeklyHolidayIndex: 0 }))).toContain("주휴일이 근무 요일과 겹쳐요");
    const all = Array.from({ length: 7 }, () => day("10:00", "14:00", 30));
    expect(titles(input({ days: all }))).toContain("휴일이 없어요");
  });
});

describe("analyzeContract — wage, minor, period", () => {
  it("최저임금 미달 (시급/월급/일급)", () => {
    expect(titles(input({ wageAmount: 10_000 }))).toContain("최저임금 미달");
    expect(titles(input({ wageAmount: 10_320 }))).not.toContain("최저임금 미달");
    expect(titles(input({ wageType: "monthly", wageAmount: 2_000_000 }))).toContain("최저임금 미달");
    expect(titles(input({ wageType: "daily", wageAmount: 80_000 }))).toContain("최저임금 미달");
  });
  it("임금 미입력 → 점검 계속, info", () => {
    const v = okOf(input({ wageAmount: null }));
    expect(v.minWage).toBeNull();
    expect(v.alerts.some((a) => a.title === "임금 미입력")).toBe(true);
  });
  it("미성년자: 만 17세, 8h/day → 한도 초과", () => {
    const v = okOf(input({ workerBirth: "2009-05-01" }));
    expect(v.age).toBe(17);
    const t = v.alerts.map((a) => a.title);
    expect(t).toContain("연소근로자 (만 17세)");
    expect(t).toContain("연소근로자 근로시간 초과");
    expect(t).not.toContain("만 15세 미만");
  });
  it("미성년자 within limits: 7h × 5 = 35h → no 초과", () => {
    const t = titles(input({ workerBirth: "2009-05-01", days: weekdays(day("09:00", "16:30", 30)) }));
    expect(t).toContain("연소근로자 (만 17세)");
    expect(t).not.toContain("연소근로자 근로시간 초과");
  });
  it("만 18세 생일 당일 → 성인", () => {
    expect(okOf(input({ workerBirth: "2008-10-01" })).age).toBe(18);
    expect(titles(input({ workerBirth: "2008-10-01" })).some((t) => t.startsWith("연소"))).toBe(false);
  });
  it("만 15세 미만 → 취직인허증, 야간 금지", () => {
    const t = titles(input({ workerBirth: "2012-01-01", days: [day("20:00", "23:00", 0), off, off, off, off, off, off] }));
    expect(t).toContain("만 15세 미만");
    expect(t).toContain("연소근로자 야간근로");
  });
  it("기간제 2년 초과 경고", () => {
    expect(titles(input({ endDate: "2028-10-02" }))).toContain("기간제 2년 초과");
    expect(titles(input({ endDate: "2028-10-01" }))).not.toContain("기간제 2년 초과");
  });
  it("alerts sorted danger → warn → info", () => {
    const levels = okOf(input({ wageAmount: 9_000, weeklyHolidayIndex: 0 })).alerts.map((a) => a.level);
    const rank = { danger: 0, warn: 1, info: 2 };
    expect([...levels].sort((a, b) => rank[a] - rank[b])).toEqual(levels);
  });
});

describe("analyzeContract — states", () => {
  it("no work days → empty", () => {
    expect(analyzeContract(input({ days: Array(7).fill(off) })).status).toBe("empty");
  });
  it("checked day without times → empty", () => {
    expect(analyzeContract(input({ days: [day("", ""), off, off, off, off, off, off] })).status).toBe("empty");
  });
  it("invalid: equal times, long break, end before start, wage ≤ 0, birth after start", () => {
    const r = analyzeContract(
      input({
        days: [day("09:00", "09:00"), day("09:00", "10:00", 90), day("09:00", "18:00", -5), off, off, off, off],
        endDate: "2026-09-01",
        wageAmount: 0,
        workerBirth: "2027-01-01",
      }),
    );
    if (r.status !== "invalid") throw new Error(r.status);
    expect(r.issues.map((i) => i.field)).toEqual(expect.arrayContaining(["day-0", "break-1", "break-2", "endDate", "wageAmount", "workerBirth"]));
  });
});

describe("detectRiskyClauses", () => {
  const cases: [string, string][] = [
    ["penalty", "중도 퇴사 시 위약금 100만 원을 지급한다."],
    ["penalty", "무단 퇴사하면 교육비를 반환한다."],
    ["penalty", "손해배상액을 미리 정하여 300만 원으로 한다."],
    ["wage-withheld", "퇴사 30일 전 통보하지 않으면 마지막 달 급여를 지급하지 않는다."],
    ["advance-offset", "전차금은 매월 임금에서 공제한다."],
    ["advance-offset", "가불금은 월급에서 차감한다."],
    ["forced-savings", "급여의 일부를 회사가 적립하여 퇴사 시 돌려준다."],
    ["forced-savings", "입사 시 보증금 50만 원을 낸다."],
    ["severance-waiver", "퇴직금은 월급에 포함하여 지급한다."],
    ["severance-waiver", "퇴직금은 없는 것으로 한다."],
    ["below-minimum-wage", "수습 기간 3개월간 급여는 최저임금의 90%로 한다."],
    ["below-minimum-wage", "최저임금 적용 제외에 동의한다."],
    ["weekly-holiday", "시급에 주휴수당이 포함되어 있다."],
    ["weekly-holiday", "주휴수당은 없다."],
    ["overtime-pay", "연장근로수당은 지급하지 않는다."],
    ["overtime-pay", "포괄임금으로 계약한다."],
    ["annual-leave", "연차는 사용할 수 없다."],
    ["social-insurance", "4대보험은 가입하지 않는다."],
    ["social-insurance", "급여에서 3.3%를 떼고 지급한다."],
    ["dismissal", "사업주는 언제든지 해고할 수 있다."],
    ["marriage-pregnancy", "근로자가 결혼하면 퇴직한다."],
  ];
  it.each(cases)("%s ← %s", (id, text) => {
    expect(detectRiskyClauses(text).map((h) => h.id)).toContain(id);
  });

  it("every rule has at least one positive case and an article", () => {
    const covered = new Set(cases.map(([id]) => id));
    for (const r of RISKY_CLAUSE_RULES) {
      expect(covered.has(r.id)).toBe(true);
      expect(r.article).toMatch(/법|조/);
    }
  });

  it("built-in special clauses are clean", () => {
    expect(detectRiskyClauses(SPECIAL_CLAUSES.map((c) => c.text))).toEqual([]);
  });

  it("benign wording is clean", () => {
    const benign = [
      "근로자가 고의로 사업장에 손해를 끼친 경우 민법에 따라 배상 책임을 진다.",
      "퇴직금은 근로자퇴직급여 보장법에 따라 지급한다.",
      "주휴수당은 근로기준법에 따라 지급한다.",
      "임금은 매월 10일 근로자 명의 계좌로 지급한다.",
      "",
    ];
    expect(detectRiskyClauses(benign)).toEqual([]);
  });

  it("5인 미만은 연차 규칙을 건너뜀", () => {
    expect(detectRiskyClauses("연차는 없다.", { under5: true })).toEqual([]);
    expect(detectRiskyClauses("연차는 없다.", { under5: false }).map((h) => h.id)).toEqual(["annual-leave"]);
  });

  it("one hit per rule, with the matched snippet", () => {
    const hits = detectRiskyClauses(["위약금 10만 원", "벌금 5만 원"]);
    expect(hits).toHaveLength(1);
    expect(hits[0].match).toBe("위약금");
  });

  it("analyzeContract surfaces risky clauses as danger alerts", () => {
    const v = okOf(input({ clauseTexts: ["중도 퇴사 시 위약금을 낸다."] }));
    expect(v.risky.map((r) => r.id)).toEqual(["penalty"]);
    expect(v.alerts[0]).toMatchObject({ level: "danger", article: "근로기준법 제20조" });
  });
});

describe("scheduleSummary", () => {
  it("groups identical days and marks overnight", () => {
    const s = scheduleSummary([day("09:00", "18:00"), day("09:00", "18:00"), off, day("22:00", "06:00", 30), off, off, off]);
    expect(s).toEqual(["월·화 09:00 ~ 18:00 (휴게 60분)", "목 22:00 ~ 다음 날 06:00 (휴게 30분)"]);
  });
});
