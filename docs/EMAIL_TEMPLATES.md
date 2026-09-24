# 인증/알림 이메일 템플릿 (한국어)

> 적용 위치: https://supabase.com/dashboard/project/weytdwzwviamqrtzrjmg/auth/templates
> 사이트가 실제로 쓰는 메일은 1) 가입 인증, 2) 비밀번호 재설정 두 가지입니다.
>
> - `{{ .ConfirmationURL }}`, `{{ .Email }}` 같은 변수는 **그대로** 두세요.
> - 이미지(로고·환영 애니메이션)는 사이트에 올려둔 파일을 불러옵니다:
>   `public/email/logo.png`, `public/email/welcome.gif`
> - 메일 앱은 CSS 애니메이션을 막아서 **움직이는 건 GIF만** 가능합니다(PC 아웃룩은 첫 장면만 표시).
>   일부 앱은 "이미지 보기"를 눌러야 그림이 보이므로, 버튼·안내는 모두 글자로 넣었습니다.
> - 레이아웃은 아웃룩까지 깨지지 않도록 표(table) 기반입니다.

---

## 1) 회원가입 인증 (Confirm sign up)

**제목**
```
[마케팅방주] 가입을 환영해요! 이메일 인증을 완료해 주세요
```

**본문 (HTML)**
```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;font-family:'Apple SD Gothic Neo','Malgun Gothic',Pretendard,sans-serif;color:#0f172a">
      <tr><td align="center" style="padding:0 0 18px">
        <img src="https://selfmarketing.ai.kr/email/logo.png" width="180" alt="마케팅방주" style="display:block;width:180px;max-width:60%;height:auto;border:0">
      </td></tr>
      <tr><td style="padding:0 0 14px">
        <img src="https://selfmarketing.ai.kr/email/welcome.gif" width="480" alt="반가워요! 마케팅방주에 오신 걸 환영해요" style="display:block;width:100%;max-width:480px;height:auto;border:0;border-radius:16px">
      </td></tr>
      <tr><td style="background:#f8fafc;border-radius:16px;padding:28px 24px">
        <h1 style="margin:0 0 12px;font-size:19px;line-height:1.4">가입해 주셔서 감사합니다 🙏</h1>
        <p style="margin:0 0 22px;font-size:14px;line-height:1.75;color:#475569">
          사장님, 마케팅방주를 찾아주셔서 진심으로 감사드려요.<br>
          아래 버튼을 눌러 이메일 인증만 마치면 바로 시작할 수 있어요.
          필요한 마케팅만 골라서, 원가 그대로 1건부터 주문하세요.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="border-radius:12px;background:#059669">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">이메일 인증하고 시작하기</a>
          </td>
        </tr></table>
        <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">
          버튼이 눌리지 않으면 아래 주소를 복사해 브라우저에 붙여넣어 주세요.<br>
          <span style="word-break:break-all">{{ .ConfirmationURL }}</span>
        </p>
      </td></tr>
          <tr><td style="padding:22px 8px 0;text-align:center;font-size:11px;line-height:1.7;color:#94a3b8">
            마케팅방주를 이용해 주셔서 감사합니다.<br>가입을 신청하지 않으셨다면 이 메일을 무시해 주세요.<br>본 메일은 {{ .Email }} 주소로 발송된 발신 전용 메일입니다.<br>
            마케팅방주 · 씨씨컴퍼니 · 사업자등록번호 275-05-01613<br>
            인천광역시 연수구 인천타워대로 301, A동 16층 33호 · cccompanymaster@gmail.com
          </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 2) 비밀번호 재설정 (Reset password)

**제목**
```
[마케팅방주] 비밀번호 재설정 안내
```

**본문 (HTML)**
```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;font-family:'Apple SD Gothic Neo','Malgun Gothic',Pretendard,sans-serif;color:#0f172a">
      <tr><td align="center" style="padding:0 0 18px">
        <img src="https://selfmarketing.ai.kr/email/logo.png" width="180" alt="마케팅방주" style="display:block;width:180px;max-width:60%;height:auto;border:0">
      </td></tr>
      <tr><td style="background:#f8fafc;border-radius:16px;padding:28px 24px">
        <h1 style="margin:0 0 12px;font-size:19px;line-height:1.4">비밀번호를 다시 설정해 주세요</h1>
        <p style="margin:0 0 22px;font-size:14px;line-height:1.75;color:#475569">
          비밀번호 재설정을 요청하셔서 안내드려요. 아래 버튼을 눌러 새 비밀번호를 정해 주세요.<br>
          직접 요청하지 않으셨다면 이 메일은 무시하셔도 계정은 안전합니다.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="border-radius:12px;background:#059669">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">새 비밀번호 설정하기</a>
          </td>
        </tr></table>
        <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">
          링크는 일정 시간이 지나면 만료돼요. 버튼이 눌리지 않으면 아래 주소를 복사해 브라우저에 붙여넣어 주세요.<br>
          <span style="word-break:break-all">{{ .ConfirmationURL }}</span>
        </p>
      </td></tr>
          <tr><td style="padding:22px 8px 0;text-align:center;font-size:11px;line-height:1.7;color:#94a3b8">
            항상 마케팅방주를 이용해 주셔서 감사합니다.<br>본 메일은 {{ .Email }} 주소로 발송된 발신 전용 메일입니다.<br>
            마케팅방주 · 씨씨컴퍼니 · 사업자등록번호 275-05-01613<br>
            인천광역시 연수구 인천타워대로 301, A동 16층 33호 · cccompanymaster@gmail.com
          </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 3) 보안 알림: 비밀번호 변경 (Security → Password changed) — 켜기 권장

토글 **켜기** → 화살표(>) 눌러 편집

**제목**
```
[마케팅방주] 비밀번호가 변경되었어요
```

**본문 (HTML)**
```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;font-family:'Apple SD Gothic Neo','Malgun Gothic',Pretendard,sans-serif;color:#0f172a">
      <tr><td align="center" style="padding:0 0 18px">
        <img src="https://selfmarketing.ai.kr/email/logo.png" width="180" alt="마케팅방주" style="display:block;width:180px;max-width:60%;height:auto;border:0">
      </td></tr>
      <tr><td style="background:#f8fafc;border-radius:16px;padding:28px 24px">
        <h1 style="margin:0 0 12px;font-size:19px;line-height:1.4">🔒 비밀번호가 변경되었어요</h1>
        <p style="margin:0 0 22px;font-size:14px;line-height:1.75;color:#475569">
          {{ .Email }} 계정의 비밀번호가 방금 변경되었습니다.<br>
          본인이 변경하셨다면 이 메일은 확인만 하시면 됩니다.
        </p>
        <p style="margin:0 0 18px;padding:12px 14px;border-radius:12px;background:#fff1f2;font-size:13px;line-height:1.6;color:#9f1239">
          <b>직접 변경하지 않으셨나요?</b> 누군가 계정에 접근했을 수 있어요.
          아래 버튼으로 로그인 화면에서 <b>비밀번호를 잊으셨나요?</b>를 눌러 즉시 다시 바꾸고, 고객센터로 알려주세요.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="border-radius:12px;background:#059669">
            <a href="https://selfmarketing.ai.kr/start/" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">비밀번호 다시 바꾸기</a>
          </td>
        </tr></table>
        <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">
          문의: <a href="mailto:cccompanymaster@gmail.com" style="color:#059669">cccompanymaster@gmail.com</a>
        </p>
      </td></tr>
          <tr><td style="padding:22px 8px 0;text-align:center;font-size:11px;line-height:1.7;color:#94a3b8">
            항상 마케팅방주를 이용해 주셔서 감사합니다.<br>본 메일은 {{ .Email }} 주소로 발송된 발신 전용 메일입니다.<br>
            마케팅방주 · 씨씨컴퍼니 · 사업자등록번호 275-05-01613<br>
            인천광역시 연수구 인천타워대로 301, A동 16층 33호 · cccompanymaster@gmail.com
          </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 4) 보안 알림: 로그인 수단 연결 (Security → Sign-in method linked) — 켜기 권장

카카오·네이버 로그인이 같은 이메일의 기존 계정에 자동 연결될 때 발송됩니다.
`{{ .Provider }}` 값은 `kakao` / `custom:naver` 라서 한글로 바꿔 보이도록 조건문을 넣었습니다.

**제목**
```
[마케팅방주] 간편로그인이 계정에 연결되었어요
```

**본문 (HTML)**
```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;font-family:'Apple SD Gothic Neo','Malgun Gothic',Pretendard,sans-serif;color:#0f172a">
      <tr><td align="center" style="padding:0 0 18px">
        <img src="https://selfmarketing.ai.kr/email/logo.png" width="180" alt="마케팅방주" style="display:block;width:180px;max-width:60%;height:auto;border:0">
      </td></tr>
      <tr><td style="background:#f8fafc;border-radius:16px;padding:28px 24px">
        <h1 style="margin:0 0 12px;font-size:19px;line-height:1.4">🔗 {{ if eq .Provider "kakao" }}카카오{{ else if eq .Provider "custom:naver" }}네이버{{ else }}{{ .Provider }}{{ end }} 로그인이 연결되었어요</h1>
        <p style="margin:0 0 22px;font-size:14px;line-height:1.75;color:#475569">
          {{ .Email }} 계정에 <b>{{ if eq .Provider "kakao" }}카카오{{ else if eq .Provider "custom:naver" }}네이버{{ else }}{{ .Provider }}{{ end }}</b> 간편로그인이 연결되었습니다.<br>
          이제 {{ if eq .Provider "kakao" }}카카오{{ else if eq .Provider "custom:naver" }}네이버{{ else }}{{ .Provider }}{{ end }}로도 같은 계정에 로그인할 수 있어요.
        </p>
        <p style="margin:0 0 18px;padding:12px 14px;border-radius:12px;background:#fff1f2;font-size:13px;line-height:1.6;color:#9f1239">
          <b>직접 연결하지 않으셨나요?</b> 다른 사람이 내 계정에 로그인 수단을 추가했을 수 있어요.
          비밀번호를 바꾸고 고객센터로 바로 알려주세요.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="border-radius:12px;background:#059669">
            <a href="https://selfmarketing.ai.kr/mypage/" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">내 계정 확인하기</a>
          </td>
        </tr></table>
        <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">
          문의: <a href="mailto:cccompanymaster@gmail.com" style="color:#059669">cccompanymaster@gmail.com</a>
        </p>
      </td></tr>
          <tr><td style="padding:22px 8px 0;text-align:center;font-size:11px;line-height:1.7;color:#94a3b8">
            항상 마케팅방주를 이용해 주셔서 감사합니다.<br>본 메일은 {{ .Email }} 주소로 발송된 발신 전용 메일입니다.<br>
            마케팅방주 · 씨씨컴퍼니 · 사업자등록번호 275-05-01613<br>
            인천광역시 연수구 인천타워대로 301, A동 16층 33호 · cccompanymaster@gmail.com
          </td></tr>
    </table>
  </td></tr>
</table>
```

---

### 켜지 않아도 되는 항목
- Authentication: Invite user, Magic link or OTP, Change email address, Reauthentication — 사이트에 해당 기능이 없어 발송되지 않음
- Security: Email address changed, Phone number changed, Sign-in method removed, MFA method added/removed — 사이트에 해당 기능 없음

---

### 발송 설정 (완료)
- 발송: Resend SMTP (`no-reply@selfmarketing.ai.kr`, 발신자명 `마케팅방주`)
- 시간당 발송 한도: Authentication → Rate Limits
