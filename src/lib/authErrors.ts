// Supabase Auth returns English messages; members should see Korean ones.
// Unknown messages pass through unchanged rather than being hidden.

const MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, "이메일 또는 비밀번호가 맞지 않아요."],
  [/email not confirmed/i, "이메일 인증이 아직 안 됐어요. 메일함의 인증 링크를 눌러 주세요."],
  [/user already registered/i, "이미 가입된 이메일이에요. 로그인해 주세요."],
  // Built-in Supabase mailer refuses non-team addresses until custom SMTP is set.
  [/email address not authorized/i, "지금은 인증 메일을 보낼 수 없어요. 잠시 후 다시 시도하거나 고객센터로 문의해 주세요."],
  [/rate limit|for security purposes|too many requests/i, "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요."],
  [/password should be at least/i, "비밀번호는 8자 이상 입력해 주세요."],
  [/new password should be different/i, "기존과 다른 비밀번호를 입력해 주세요."],
  [/weak password|password is known to be weak/i, "너무 쉬운 비밀번호예요. 다른 비밀번호를 입력해 주세요."],
];

export function koreanAuthError(message: string): string {
  const hit = MESSAGES.find(([re]) => re.test(message));
  return hit ? hit[1] : message;
}
