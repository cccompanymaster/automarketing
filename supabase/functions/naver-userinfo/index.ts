// Supabase Edge Function: Naver profile → OIDC-style userinfo.
//
// Naver isn't a built-in Supabase Auth provider, so it's registered as a
// Custom OAuth2 provider ("custom:naver"). Supabase calls the provider's
// UserInfo URL with the Naver access token and expects standard claims (sub,
// email, ...) at the top level, but Naver's /v1/nid/me nests everything under
// `response`. This function is that UserInfo URL: it forwards the bearer token
// to Naver (fixed endpoint only) and flattens the answer.
//
// It holds no secrets — the caller's own Naver token is the only credential,
// and it can only ever fetch that token's own profile.
//
// Deploy: supabase functions deploy naver-userinfo --no-verify-jwt
//   (the bearer is a Naver token, not a Supabase JWT, so JWT checks must be off)

const NAVER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me";

interface NaverProfile {
  id?: string;
  email?: string;
  name?: string;
  nickname?: string;
  profile_image?: string;
  mobile?: string; // "010-1234-5678"
  gender?: string; // "F" | "M" | "U"
  age?: string; // age range, e.g. "30-39"
  birthyear?: string; // "1990"
  birthday?: string; // "MM-DD"
}

const GENDER: Record<string, string> = { F: "female", M: "male" };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const auth = req.headers.get("authorization") ?? "";
  if (!/^bearer\s+\S+$/i.test(auth)) return json({ error: "missing bearer token" }, 401);

  let res: Response;
  try {
    res = await fetch(NAVER_PROFILE_URL, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return json({ error: "naver unreachable" }, 502);
  }

  const body = (await res.json().catch(() => null)) as
    | { resultcode?: string; response?: NaverProfile }
    | null;
  const p = body?.response;
  if (!res.ok || body?.resultcode !== "00" || !p?.id) {
    return json({ error: "invalid naver token" }, 401);
  }

  const email = p.email?.trim().toLowerCase() || undefined;
  return json({
    sub: p.id,
    email,
    // Supabase links accounts that share a *verified* email, so only vouch for
    // addresses Naver itself owns. Other contact emails get Supabase's own
    // confirmation mail first instead of being trusted outright.
    email_verified: !!email && email.endsWith("@naver.com"),
    name: p.name || p.nickname || undefined,
    nickname: p.nickname || undefined,
    picture: p.profile_image || undefined,
    // Standard OIDC claim names where they exist, so Supabase keeps them in
    // user_metadata; the rest ride along as custom claims. Shown and editable
    // on /mypage (내 정보) — the usage Naver's review asks to see.
    phone_number: p.mobile || undefined,
    gender: (p.gender && GENDER[p.gender]) || undefined,
    birthdate:
      p.birthyear && p.birthday ? `${p.birthyear}-${p.birthday}` : p.birthyear || undefined,
    birthyear: p.birthyear || undefined,
    birthday: p.birthday || undefined,
    age_range: p.age || undefined,
  });
});
