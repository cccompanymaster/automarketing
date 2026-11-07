// Supabase Auth email templates (가입 인증, 비밀번호 재설정, 보안 알림 2종),
// built from the same business info the site footer uses (lib/company.ts), so
// a change of 상호·주소 never leaves an old one in members' inboxes.
// `npm run email:templates` writes docs/email-templates/*.html and
// docs/EMAIL_TEMPLATES.md; a test fails when they're out of date. The owner
// pastes them into Supabase → Authentication → Email Templates.
//
// Email-safe HTML only: table layout, inline styles, no CSS animation, no
// web fonts; everything important is text (images may be blocked).
// `{{ .X }}` are Supabase template variables and must stay as they are.

import { COMPANY } from "@/lib/company";
import { CALCULATORS } from "@/lib/calc/registry";

const SITE = "https://selfmarketing.ai.kr";
const FONT = "'Apple SD Gothic Neo','Malgun Gothic',Pretendard,'Noto Sans KR',sans-serif";
const C = {
  ink: "#0f172a",
  body: "#475569",
  muted: "#94a3b8",
  brand: "#059669",
  brandDark: "#047857",
  mint: "#ecfdf5",
  line: "#e3ebe6",
  page: "#f3f6f4",
};

const PROVIDER = `{{ if eq .Provider "kakao" }}카카오{{ else if eq .Provider "custom:naver" }}네이버{{ else }}{{ .Provider }}{{ end }}`;

export interface EmailTemplate {
  key: string;
  /** Where it lives in the Supabase dashboard. */
  where: string;
  subject: string;
  html: string;
}

function button(href: string, label: string, color = C.brand): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" style="border-radius:14px;background:${color}">
              <a href="${href}" style="display:block;padding:16px 24px;font-size:16px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:14px">${label}</a>
            </td>
          </tr></table>`;
}

function badge(text: string): string {
  return `<span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${C.mint};color:${C.brandDark};font-size:12px;font-weight:800">${text}</span>`;
}

function box(html: string, bg = "#f8fafc", color = C.body): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px"><tr>
            <td style="background:${bg};border-radius:14px;padding:16px 18px;font-size:13px;line-height:1.7;color:${color}">${html}</td>
          </tr></table>`;
}

function fallbackLink(): string {
  return `<p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:${C.muted}">
            버튼이 눌리지 않으면 아래 주소를 복사해 브라우저에 붙여 넣어 주세요.<br>
            <span style="word-break:break-all;color:${C.body}">{{ .ConfirmationURL }}</span>
          </p>`;
}

function layout({ preheader, hero, content }: { preheader: string; hero?: string; content: string }): string {
  const footerInfo = [
    `${COMPANY.serviceName} · ${COMPANY.companyName} · 대표 ${COMPANY.ceo} · 사업자등록번호 ${COMPANY.businessRegistrationNumber}`,
    `통신판매업 ${COMPANY.mailOrderNumber} · ${COMPANY.address}`,
    `${COMPANY.email}${COMPANY.phone ? ` · ${COMPANY.phone}` : ""}`,
  ].join("<br>\n            ");
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page}">
  <tr><td align="center" style="padding:28px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;font-family:${FONT};color:${C.ink}">
      <tr><td align="center" style="padding:0 0 16px">
        <a href="${SITE}" style="text-decoration:none"><img src="${SITE}/email/logo.png" width="168" alt="${COMPANY.serviceName}" style="display:block;width:168px;max-width:56%;height:auto;border:0"></a>
      </td></tr>
      <tr><td style="background:#ffffff;border:1px solid ${C.line};border-radius:20px;overflow:hidden">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="height:6px;line-height:6px;font-size:0;background:${C.brand};background-image:linear-gradient(90deg,#34d399,${C.brandDark})">&nbsp;</td></tr>${
            hero
              ? `
          <tr><td style="padding:20px 20px 0">${hero}</td></tr>`
              : ""
          }
          <tr><td style="padding:28px 28px 30px">
          ${content}
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:22px 12px 0;text-align:center;font-size:13px;line-height:1.7;color:${C.body}">
        궁금한 점은 <a href="${COMPANY.kakaoChatUrl}" style="color:${C.brandDark};font-weight:700;text-decoration:underline">카카오톡 1:1 상담</a>으로 편하게 물어보세요.
      </td></tr>
      <tr><td style="padding:12px 12px 0;text-align:center;font-size:11px;line-height:1.75;color:${C.muted}">
            본 메일은 {{ .Email }} 주소로 보내 드린 발신 전용 메일이에요.<br>
            ${footerInfo}
      </td></tr>
    </table>
  </td></tr>
</table>
`;
}

const h1 = (t: string) => `<h1 style="margin:14px 0 10px;font-size:22px;line-height:1.4;font-weight:800;color:${C.ink}">${t}</h1>`;
const p = (t: string) => `<p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:${C.body}">${t}</p>`;

const notMe = (what: string) =>
  box(
    `<b style="color:#9f1239">본인이 하지 않았다면</b><br>
            ${what} 아래 버튼으로 바로 비밀번호를 바꾸고, 카카오톡 1:1 상담으로 알려 주세요.`,
    "#fff1f2",
    "#881337",
  );

export function emailTemplates(): EmailTemplate[] {
  return [
    {
      key: "01-confirm-signup",
      where: "Authentication → Emails → Confirm sign up",
      subject: `[${COMPANY.serviceName}] 가입을 환영해요! 이메일 인증을 완료해 주세요`,
      html: layout({
        preheader: "버튼 한 번이면 인증 끝! 전체 상품 단가와 무료 계산기를 바로 써 보세요.",
        hero: `<img src="${SITE}/email/welcome.gif" width="480" alt="반가워요! 마케팅방주에 오신 걸 환영해요" style="display:block;width:100%;max-width:480px;height:auto;border:0;border-radius:14px">`,
        content: `${badge("환영해요 🌱")}
          ${h1("사장님, 마케팅방주에<br>오신 걸 환영해요")}
          ${p("아래 버튼으로 이메일 인증만 마치면 바로 시작할 수 있어요.<br>필요한 마케팅만 골라 공개된 단가로 주문하세요.")}
          ${button("{{ .ConfirmationURL }}", "이메일 인증하고 시작하기 →")}
          ${box(
            `<b style="color:${C.ink}">가입하면 바로 할 수 있어요</b><br>
            🛍️ 블로그·플레이스·카페·당근 등 전체 상품 단가 보고 주문<br>
            🧮 가입 없이도 쓰는 사장님 무료 계산기 ${CALCULATORS.length}종<br>
            📝 AI 블로그 원고 1건 500원 (제목·목차는 무료)`,
            C.mint,
          )}
          ${fallbackLink()}
          <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:${C.muted}">가입을 신청하지 않으셨다면 이 메일은 무시해 주세요.</p>`,
      }),
    },
    {
      key: "02-reset-password",
      where: "Authentication → Emails → Reset password",
      subject: `[${COMPANY.serviceName}] 비밀번호 재설정 안내`,
      html: layout({
        preheader: "버튼을 눌러 새 비밀번호를 만들어 주세요. 요청하지 않았다면 무시해도 돼요.",
        content: `${badge("🔑 비밀번호 재설정")}
          ${h1("새 비밀번호를 만들어 주세요")}
          ${p("<b style=\"color:#0f172a\">{{ .Email }}</b> 계정의 비밀번호 재설정을 요청하셨어요.<br>아래 버튼을 눌러 새 비밀번호를 정해 주세요.")}
          ${button("{{ .ConfirmationURL }}", "새 비밀번호 만들기 →")}
          ${box("요청하지 않으셨다면 이 메일은 무시해 주세요. <b>버튼을 누르지 않으면 비밀번호는 바뀌지 않아요.</b>", "#fffbeb", "#92400e")}
          ${fallbackLink()}`,
      }),
    },
    {
      key: "03-password-changed",
      where: "Authentication → Emails → Security → Password changed (켜기)",
      subject: `[${COMPANY.serviceName}] 비밀번호가 변경되었어요`,
      html: layout({
        preheader: "계정 비밀번호가 방금 변경되었어요. 본인이 아니라면 바로 알려 주세요.",
        content: `${badge("🔒 보안 알림")}
          ${h1("비밀번호가 변경되었어요")}
          ${p("<b style=\"color:#0f172a\">{{ .Email }}</b> 계정의 비밀번호가 방금 변경되었어요.<br>본인이 바꾼 거라면 따로 하실 일은 없어요.")}
          ${notMe("누군가 계정에 접근했을 수 있어요.")}
          <div style="height:18px;line-height:18px;font-size:0">&nbsp;</div>
          ${button(`${SITE}/start/`, "로그인 화면에서 비밀번호 다시 설정 →", C.ink)}`,
      }),
    },
    {
      key: "04-identity-linked",
      where: "Authentication → Emails → Security → Sign-in method linked (켜기)",
      subject: `[${COMPANY.serviceName}] 간편로그인이 계정에 연결되었어요`,
      html: layout({
        preheader: "계정에 간편로그인이 연결되었어요. 본인이 아니라면 바로 알려 주세요.",
        content: `${badge("🔗 보안 알림")}
          ${h1(`${PROVIDER} 로그인이 연결되었어요`)}
          ${p(`<b style="color:#0f172a">{{ .Email }}</b> 계정에 <b style="color:#0f172a">${PROVIDER}</b> 간편로그인이 연결되었어요.<br>이제 ${PROVIDER}로도 같은 계정에 로그인할 수 있어요.`)}
          ${notMe("다른 사람이 계정에 로그인 수단을 연결했을 수 있어요.")}
          <div style="height:18px;line-height:18px;font-size:0">&nbsp;</div>
          ${button(`${SITE}/start/`, "로그인 화면에서 비밀번호 다시 설정 →", C.ink)}`,
      }),
    },
  ];
}

/** docs/EMAIL_TEMPLATES.md — the paste guide. */
export function emailGuideMarkdown(list: EmailTemplate[] = emailTemplates()): string {
  const parts = list.map(
    (t, i) => `## ${i + 1}) ${t.where}

**제목**
\`\`\`
${t.subject}
\`\`\`

**본문 (HTML)** — \`docs/email-templates/${t.key}.html\` 내용 전체를 붙여 넣으세요.

\`\`\`html
${t.html.trimEnd()}
\`\`\`
`,
  );
  return `<!-- Generated by \`npm run email:templates\` from src/lib/emailTemplates.ts — do not edit by hand. -->
# 인증·보안 메일 템플릿 (한국어, 브랜드 디자인)

> 적용 위치: https://supabase.com/dashboard/project/weytdwzwviamqrtzrjmg/auth/templates
> 사업자 정보는 사이트 하단과 같은 \`src/lib/company.ts\`에서 자동으로 들어가요. 정보가 바뀌면
> \`npm run email:templates\`로 다시 만든 뒤 Supabase에 다시 붙여 넣어 주세요.
>
> - \`{{ .ConfirmationURL }}\`, \`{{ .Email }}\`, \`{{ .Provider }}\` 같은 변수는 **그대로** 두세요.
> - 로고·환영 이미지는 사이트의 \`public/email/\` 파일을 불러와요. 이미지를 막는 메일 앱에서도 글자만으로 내용이 다 보여요.
> - 메일 앱 호환을 위해 표(table) 레이아웃과 인라인 스타일만 썼어요.

${parts.join("\n---\n\n")}
---

### 켜지 않아도 되는 항목
- Authentication: Invite user, Magic link or OTP, Change email address, Reauthentication — 사이트에 해당 기능이 없어 발송되지 않음
- Security: Email address changed, Phone number changed, Sign-in method removed, MFA method added/removed — 사이트에 해당 기능 없음

### 발송 설정
- 발송: Resend SMTP (\`no-reply@selfmarketing.ai.kr\`, 발신자명 \`${COMPANY.serviceName}\`)
- 시간당 발송 한도: Authentication → Rate Limits
`;
}
