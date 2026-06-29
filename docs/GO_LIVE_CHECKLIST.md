# 운영 전 체크리스트 (Go-Live)

데모/테스트로는 동작하지만, **최종 도메인(URL) 적용 시점**에 함께 처리해야 하는
보류 항목들입니다. 최종 URL을 정하면 ★ 표시 항목을 먼저 처리하세요.

## ★ 최종 URL 적용 시 (도메인 확정 시점)
- [ ] **Supabase Auth → URL Configuration → Site URL** 을 최종 도메인으로 변경
      (현재 테스트값: `https://cccompanymaster.github.io/automarketing`)
- [ ] **Redirect URLs** 에 최종 도메인 `https://<도메인>/**` 추가
- [ ] 카카오 OAuth 사용 시: Kakao/Supabase Redirect 허용목록도 최종 도메인으로 갱신
- [ ] 배포 변수 `NEXT_PUBLIC_SITE_URL` 이 최종 도메인인지 확인 (sitemap/robots/OG)

## 이메일 (인증/알림)
- [ ] **커스텀 SMTP 연결** (Resend/SendGrid/SES) — 기본 메일은 발송량·속도 제한
- [ ] SMTP 연결 후 **이메일 템플릿 한국어화** (제목·본문·발신자명 "마케팅방주")
- [ ] 발신 도메인 SPF/DKIM 인증 (스팸함 방지)
- [ ] **Confirm email 다시 ON** (테스트 동안 OFF로 둔 경우)

## 보안
- [ ] 채팅에 노출됐던 **Supabase secret 키 재발급** (Settings → API Keys → Rotate)
- [ ] **Cloudflare 보안 헤더/CSP 적용** (`docs/SECURITY_HEADERS.md`)
- [ ] CSP에 실제 사용하는 외부 출처 모두 포함됐는지 콘솔로 확인

## 결제 (PortOne)
- [ ] PortOne 채널 + 키 등록, `payment-webhook` 배포 (`docs/PAYMENT_SETUP.md`)
- [ ] CSP에 PortOne 출처 추가 (`https://cdn.portone.io`, `https://api.portone.io`)
- [ ] 웹훅 멱등 처리(중복 적립 방지) 추가
- [ ] 선불 캐시 충전 — 전자금융거래법(선불전자지급수단) 검토

## AI 원고
- [ ] `blog-writer` Edge Function 배포 + `ANTHROPIC_API_KEY` 시크릿
- [ ] 변수 `NEXT_PUBLIC_BLOG_API_URL` 등록
