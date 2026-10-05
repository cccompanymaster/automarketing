// Member profile (내 정보): name, phone, birth year/day, age range, gender.
//
// Kakao/Naver sign-in prefill these from the provider (Naver's userinfo is
// flattened by the naver-userinfo Edge Function); any member can view and edit
// them on /mypage. Edits live in user_metadata.profile and win over the
// provider values, which Supabase refreshes on every social login.
//
// Stub mode keeps the same shape in localStorage.

import { getSupabase } from "@/lib/supabase";

export type Gender = "female" | "male" | "";

export interface MemberProfile {
  name: string;
  phone: string;
  /** "1990" */
  birthYear: string;
  /** "MM-DD" */
  birthday: string;
  /** Naver's age band, e.g. "30-39". */
  ageRange: string;
  gender: Gender;
}

export const EMPTY_PROFILE: MemberProfile = {
  name: "",
  phone: "",
  birthYear: "",
  birthday: "",
  ageRange: "",
  gender: "",
};

export const GENDER_LABEL: Record<Gender, string> = { female: "여성", male: "남성", "": "" };

export const AGE_RANGES = ["10-19", "20-29", "30-39", "40-49", "50-59", "60-"] as const;

/** "30-39" → "30대", "60-" → "60대 이상". */
export function ageRangeLabel(range: string): string {
  const m = /^(\d+)-(\d*)$/.exec(range);
  if (!m) return range;
  return m[2] ? `${m[1]}대` : `${m[1]}대 이상`;
}

const STUB_KEY = "selfmarketing.profile";

/**
 * Normalize a Korean mobile number to "010-1234-5678". Accepts provider
 * formats like "+82 10-1234-5678" (Kakao) or "01012345678". Returns "" when
 * it isn't a valid mobile number.
 */
export function normalizePhone(raw: string): string {
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+82")) d = "0" + d.slice(3);
  d = d.replace(/\D/g, "");
  if (!/^01[016789]\d{7,8}$/.test(d)) return "";
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** Kakao sends "30~39" / "60~"; we store Naver-style "30-39" / "60-". */
export function normalizeAgeRange(raw: string): string {
  const m = /^(\d+)\s*[~-]\s*(\d*)$/.exec(raw.trim());
  if (!m) return raw;
  const lo = Number(m[1]);
  if (lo >= 60) return "60-";
  const band = AGE_RANGES.find((r) => r.startsWith(`${Math.floor(lo / 10) * 10}-`));
  return band ?? raw;
}

/** A member must have a reachable mobile number (주문·작업 안내 연락). */
export function hasRequiredProfile(p: MemberProfile): boolean {
  return normalizePhone(p.phone) !== "";
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Build a profile from Supabase user_metadata (edits first, then provider claims). */
export function profileFromMetadata(meta: Record<string, unknown> | undefined): MemberProfile {
  const m = meta ?? {};
  // Supabase may keep non-standard claims under custom_claims.
  const custom = (m.custom_claims as Record<string, unknown> | undefined) ?? {};
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = str(m[k]) || str(custom[k]);
      if (v) return v;
    }
    return "";
  };

  const birthdate = pick("birthdate"); // "1990-05-17" or "1990"
  const [bdYear, bdMonth, bdDay] = birthdate.split("-");
  const gender = pick("gender");

  const fromProvider: MemberProfile = {
    name: pick("name", "full_name", "nickname"),
    phone: normalizePhone(pick("phone_number", "phone", "mobile")),
    birthYear: pick("birthyear") || (bdYear && bdYear !== "0000" ? bdYear : ""),
    birthday: pick("birthday") || (bdMonth && bdDay ? `${bdMonth}-${bdDay}` : ""),
    ageRange: normalizeAgeRange(pick("age_range", "age")),
    gender: gender === "female" || gender === "male" ? gender : "",
  };

  const edited = (m.profile as Partial<MemberProfile> | undefined) ?? {};
  const merged = { ...fromProvider };
  for (const k of Object.keys(EMPTY_PROFILE) as (keyof MemberProfile)[]) {
    const v = edited[k];
    if (typeof v === "string" && v !== "") (merged[k] as string) = v;
  }
  return merged;
}

export async function fetchProfile(): Promise<MemberProfile> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    return profileFromMetadata(data.user?.user_metadata);
  }
  try {
    const raw = localStorage.getItem(STUB_KEY);
    return raw ? { ...EMPTY_PROFILE, ...(JSON.parse(raw) as Partial<MemberProfile>) } : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

export async function saveProfile(p: MemberProfile): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.auth.updateUser({ data: { profile: p } });
    if (error) throw new Error(error.message);
    return;
  }
  try {
    localStorage.setItem(STUB_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
