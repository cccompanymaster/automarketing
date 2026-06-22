# 마케팅방주 — 셀프 마케팅 플랫폼 (랜딩 · 퍼널 · 캐시)

소상공인·온라인 셀러·매장 운영자를 위한 셀프 마케팅 플랫폼. 랜딩/가입 퍼널 + 상품·요금 + **캐시(포인트) 지갑**까지.

🌐 라이브: https://cccompanymaster.github.io/automarketing/

## 기술 스택
- Next.js 16 (App Router, 정적 export) + TypeScript, Tailwind v4, Pretendard
- 인증·DB: Supabase (env 설정 시) / 미설정 시 로컬 stub
- 추적: 단일 GTM(GA4 + Meta Pixel) `dataLayer`
- 배포: GitHub Pages (`.github/workflows/deploy.yml` 자동 배포)

## 주요 기능
- 랜딩(로딩 인트로 → 히어로) · 서비스 카드 4종 · 성공 후기 · 통계/매체
- `/start` 분기 → 3단계 온보딩 → 가입/로그인(이메일·카카오)
- `/services/[slug]` 상품 상세 (환급은 전용 리치 페이지)
- 로그인 영역: `/pricing` 상품·요금 + **캐시 주문(차감)**, `/mypage` 지갑/내역
- **캐시: 1원 = 1캐시** — 충전(ChargeModal) → 주문/사용(OrderModal) → 잔액·내역

## 구조 (lib-first / API-first)
- `src/lib/cash.ts` — 캐시 도메인(1원=1캐시), 포맷터, 충전 프리셋
- `src/lib/payments.ts` — 결제(충전) 단일 진입점. PG 교체 지점 `// TODO(payment)`
- `src/lib/pricing.ts` — 상품·단가 카탈로그(주문 금액 포함)
- `src/lib/supabase.ts` — env-gated 클라이언트 (없으면 stub)
- `src/components/AuthProvider.tsx` / `WalletProvider.tsx` — 인증/지갑 컨텍스트
- `src/lib/products.ts`, `successStories.ts`, `company.ts`, `legal.ts`, `refund.ts`

## 실제 백엔드 켜기
1. Supabase 프로젝트 생성 → `supabase/schema.sql` 실행
2. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 주입
3. 그 순간부터 실제 회원가입 + DB 캐시로 전환 (코드 변경 불필요)
- 자세한 절차: `docs/SUPABASE_SETUP.md`
- 실제 현금 충전은 PG(PortOne 등) + 서버 결제 검증 추가 필요

## 명령어
```bash
npm run dev    # 개발 서버
npm run build  # 정적 export 빌드 (out/)
npm run lint   # ESLint
```

## 현재 상태 / stub
키가 없으면 인증·지갑·충전·주문이 **로컬(localStorage) stub**로 완전 동작합니다.
실 결제(PG)는 미연동(테스트 충전). 사업자 정보는 사업자등록증 기준(노아마케팅랩).
