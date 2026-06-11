<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 셀프마케팅 플랫폼 — 랜딩 & 가입 퍼널

소상공인·온라인 셀러·매장 운영자를 위한 셀프 마케팅 플랫폼의 **랜딩 + 가입 퍼널**.
백엔드(광고/순위/검색량/결제/인증)는 이번 범위가 아니며 모두 **stub** 입니다. UI 텍스트는 한국어, 코드/주석은 영어.

## 로드맵 (구조 설계 시 반드시 고려)

- **결제 기능 예정**: 크레딧 충전·광고비 정산·환급 지급. 결제 관련 UI 데이터는
  `src/lib/payments.ts`를 단일 진입점으로 사용 (실 API 교체 시 한 파일만 변경).
  stub 지점은 `// TODO(payment):` 주석.
- **모바일 앱 예정**: 웹과 동일한 백엔드 API를 공유하는 API-first 구조 유지.
  비즈니스 로직·데이터 fetch는 컴포넌트가 아닌 `src/lib/*`에 두어 재사용 가능하게 할 것.

## 기술 스택

- Next.js 16 (App Router) + TypeScript, `src/` 디렉터리, `@/*` alias
- Tailwind CSS v4 (CSS 기반 설정, `src/app/globals.css`)
- 폰트: Pretendard (CDN, system-ui 폴백) — `src/app/layout.tsx`
- 토스트: sonner
- 추적: 단일 GTM 컨테이너(GA4 + Meta Pixel) + `dataLayer` push

## 라우팅

| 경로 | 설명 |
|---|---|
| `/` | 랜딩 (히어로 + 서비스 카드 4종 + 성공 사례 + CTA) |
| `/start` | 신규/기존 분기 → 3단계 온보딩 → 가입/로그인 (한 화면 내 상태 전환, URL 이동 없음) |
| `/services/[slug]` | 상품 상세 (절차·예상 비용·환급 조건 가입 전 노출). slug: `place`, `shopping`, `blog`, `refund` |
| `/mypage` | 로그인 후 골격 (미인증 시 `/start` 리다이렉트) |
| `/terms`, `/privacy` | 약관/방침 (단독 페이지 + `LegalModal` 모달 공용) |

## 주요 파일

- `src/lib/analytics.ts` — `track(event, params)`. `dataLayer.push` 일원화, GTM 미설정 시 콘솔 폴백
- `src/lib/products.ts` — 4개 상품 카탈로그 (카드 + 상세 데이터)
- `src/lib/successStories.ts` — 성공 사례 더미 (수치+업종+기간)
- `src/lib/company.ts` — 푸터 사업자 정보 (더미값)
- `src/lib/legal.ts` — 약관/방침 본문 (모달·페이지 공용)
- `src/lib/payments.ts` — 결제/크레딧 stub (마이페이지 지갑 영역)
- `src/components/AuthProvider.tsx` — 클라이언트 인증 컨텍스트 (stub). `hydrated` 플래그로
  세션 복원 완료를 알림 — 인증 기반 리다이렉트는 반드시 `hydrated`를 기다릴 것
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/not-found.tsx` — SEO/404
- 컴포넌트: `Landing`, `ServiceCard`, `SuccessStory`, `AuthEntry`, `Onboarding`, `LoginForm`, `SignupForm`, `LegalModal`, `SiteHeader`, `SiteFooter`, `KakaoButton`, `TrackedCta`

## 전환 이벤트 (6종)

`cta_click`(`product_slug`), `onboarding_step_view`(`step`), `onboarding_complete`,
`signup_start`, `signup_complete`, `login_success`. 모두 `dataLayer` push, GTM 미설정 시 콘솔 확인 가능.

## 환경 변수 / Stub

`.env.example` 참고 (GTM/GA4/Pixel/카카오/API URL placeholder). `.env.local`에 실제 값 주입.
Stub 지점은 `// TODO(backend):` 주석 표시: 이메일/카카오 인증, 상품 비용·환급 조건, 마이페이지 현황.

## 명령어

```bash
npm run dev    # 개발 서버
npm run build  # 프로덕션 빌드 (검증 완료)
npm run lint   # ESLint (clean)
```
