# 운영 전 체크리스트 (Go-Live)

데모/테스트로는 동작하지만, **최종 도메인(URL) 적용 시점**에 함께 처리해야 하는
보류 항목들입니다. 최종 URL을 정하면 ★ 표시 항목을 먼저 처리하세요.

## 🚨 즉시 확인 (외부 점검 P0)
- [x] **Supabase 프로젝트 복구 완료** — INACTIVE(일시정지) 상태였고 2026-08-21
      복구 요청 후 도메인 정상 응답 확인. (NXDOMAIN 원인이 이것)
- [ ] 복구 후 가입→로그인→주문 E2E 재확인
- [ ] 카카오 로그인 사용 시 Supabase **Redirect URLs**에 배포 주소(`…/automarketing/**`) 등록
      (코드는 base path 포함 주소로 복귀하도록 수정됨)
- [ ] **schema.sql 재실행** — 산출물 컨펌(`deliverables`)·관리자 판별(`admin_users`)
      테이블/RPC가 추가됨. 실행 후 관리자 이메일 등록:
      `insert into public.admin_users (email) values ('cccompanymaster@gmail.com') on conflict do nothing;`

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

## 시트 연동 (단가 실시간 조정 + 문의 접수) — docs/SHEET_INTEGRATION.md
- [ ] 스프레드시트 생성 (`prices` + `inquiries` 탭)
- [ ] `prices` 웹에 게시(CSV) → 변수 `NEXT_PUBLIC_PRICE_SHEET_CSV_URL`
- [ ] Apps Script 웹 앱 배포 → 변수 `NEXT_PUBLIC_INQUIRY_WEBHOOK_URL`

## 이미지 제작 (프롬프트 문서 참조)
- [ ] 온보딩 4장 — docs/ONBOARDING_IMAGES.md
- [ ] 상세페이지 13장 — docs/DETAIL_IMAGES.md

## 제3자 제공 동의 (DB 제공·판매) — ⚠️ 오픈 전 필수
- [ ] **제공받는 자(제휴사 상호)를 실제 명단으로 확정** — `src/lib/legal.ts`의
      THIRD_PARTY 1번 항목. "제휴사 일반" 같은 미특정 표기는 동의 효력이
      부정될 수 있습니다(개인정보 보호법 제17조).
- [ ] 제공 항목·목적·보유기간이 실제 운영과 일치하는지 확인 후 문구 확정
- [ ] **법률 검토** 후 최종 문구 확정 (현재 문구는 표준 양식 기반 초안)
- [x] 동의 철회 창구 — 마이페이지 '선택 동의 관리'에서 토글 (변경 시 새 이력 적재)
- [ ] 제공 이력 관리 절차 수립(누구에게 언제 무엇을 제공했는지 기록)
- [x] 동의 기록 감사 테이블 `consent_logs` (append-only, RLS) + `current_consents` 뷰
- [ ] **schema.sql 재실행** 후 consent_logs 생성 확인

## 성능 (외부 점검 후속 — 코드로 미해결 항목)
- [ ] Pretendard **자체 호스팅 + 서브셋(woff2)** 전환 — 현재 CDN 전체 로드(~410KB)
- [ ] 해시 자산 장기 캐시(`immutable`) — GitHub Pages는 캐시 헤더 설정 불가,
      Cloudflare Cache Rules로 `/_next/static/*` 1년 캐시 적용
- [ ] `og:image` 제작·등록 (1200×630 브랜드 이미지)
- [ ] 홈 대표 서비스를 목표별(방문↑/판매↑/신뢰↑/비용↓) 재분류 — 콘텐츠 기획 필요
