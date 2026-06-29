# 인증/알림 이메일 템플릿 (한국어 초안)

> ⚠️ 적용 시점: Supabase 기본 메일로는 템플릿 편집이 잠겨 있습니다.
> **커스텀 SMTP 연결 후**(Authentication → Emails → SMTP Settings) →
> Templates 잠금 해제 → 아래 내용을 붙여넣어 사용하세요.
>
> Supabase 템플릿 변수: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`,
> `{{ .Email }}`, `{{ .Token }}`(OTP 코드) 등. 변수 표기는 그대로 두세요.

---

## 1) 회원가입 인증 (Confirm sign up)

**제목**
```
[마케팅방주] 이메일 인증을 완료해 주세요
```

**본문 (HTML)**
```html
<div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo',Pretendard,sans-serif;color:#0f172a">
  <div style="padding:28px 24px;text-align:center">
    <div style="font-size:22px;font-weight:800">🌱 마케팅방주</div>
  </div>
  <div style="background:#f8fafc;border-radius:16px;padding:28px 24px">
    <h1 style="font-size:18px;margin:0 0 12px">이메일 인증을 완료해 주세요</h1>
    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 20px">
      마케팅방주 가입을 환영합니다. 아래 버튼을 눌러 이메일 인증을 완료하면
      바로 내 운영 화면에서 진단·주문·원고 작성을 시작할 수 있어요.
    </p>
    <a href="{{ .ConfirmationURL }}"
       style="display:inline-block;background:#059669;color:#fff;text-decoration:none;
              font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px">
      이메일 인증하기
    </a>
    <p style="font-size:12px;color:#94a3b8;margin:20px 0 0">
      버튼이 동작하지 않으면 아래 주소를 복사해 브라우저에 붙여넣으세요.<br>
      <span style="word-break:break-all">{{ .ConfirmationURL }}</span>
    </p>
  </div>
  <p style="font-size:11px;color:#94a3b8;text-align:center;line-height:1.6;margin:20px 0">
    본 메일은 {{ .Email }} 주소로 발송되었습니다.<br>
    가입을 신청하지 않으셨다면 이 메일을 무시해 주세요.<br>
    마케팅방주 · 노아마케팅랩
  </p>
</div>
```

---

## 2) 비밀번호 재설정 (Reset password)

**제목**
```
[마케팅방주] 비밀번호 재설정 안내
```

**본문 (HTML)**
```html
<div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo',Pretendard,sans-serif;color:#0f172a">
  <div style="padding:28px 24px;text-align:center">
    <div style="font-size:22px;font-weight:800">🌱 마케팅방주</div>
  </div>
  <div style="background:#f8fafc;border-radius:16px;padding:28px 24px">
    <h1 style="font-size:18px;margin:0 0 12px">비밀번호를 재설정하세요</h1>
    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 20px">
      아래 버튼을 눌러 새 비밀번호를 설정해 주세요. 본인이 요청하지 않았다면
      이 메일을 무시하셔도 계정은 안전합니다.
    </p>
    <a href="{{ .ConfirmationURL }}"
       style="display:inline-block;background:#059669;color:#fff;text-decoration:none;
              font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px">
      비밀번호 재설정
    </a>
    <p style="font-size:12px;color:#94a3b8;margin:20px 0 0">
      링크는 일정 시간 후 만료됩니다.
    </p>
  </div>
  <p style="font-size:11px;color:#94a3b8;text-align:center;line-height:1.6;margin:20px 0">
    본 메일은 {{ .Email }} 주소로 발송되었습니다.<br>
    마케팅방주 · 노아마케팅랩
  </p>
</div>
```

---

## 3) 매직링크/OTP (선택)

**제목**
```
[마케팅방주] 로그인 링크를 보내드려요
```
> 본문은 위 1)을 참고하되 안내 문구만 "아래 버튼으로 로그인하세요"로 교체.

---

### 발송 도메인 팁
- 발신자명: `마케팅방주`, 발신 주소: `no-reply@<도메인>` 권장
- SPF/DKIM 인증을 마쳐야 스팸함行을 줄일 수 있습니다.
