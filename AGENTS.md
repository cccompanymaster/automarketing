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
| `/` | 스토리텔링 랜딩 (히어로 → 공감 → 다크 브릿지 → 고객여정 챕터 3 → 수치 → 서비스 그리드(그룹 2+단독) → 후기 → 프로세스 → CTA) |
| `/start` | 신규/기존 분기 → 4단계 스토리 온보딩 → 가입/로그인. `?service=<slug>`로 상품 컨텍스트 유지(가입/로그인 후 해당 단가 앵커로 이동) |
| `/services/[slug]` | 상품 상세 (스토리: 불편→해결→이럴땐이렇게 + 절차·비용·조건·준비자료). 15개 상품 slug + 그룹 `place-map`, `blog-pack`(탭, URL 해시 딥링크) |
| `/pricing` | 공개 단가표(그룹 앵커 `#blog #reward #place #cafe #ai #sns #kakaomap #press`). 주문·충전은 로그인 시, 게스트는 /start로 유도 |
| `/mypage` | 지갑·주문·컨펌요청(산출물 승인/수정요청). 미인증 시 `/start` 리다이렉트 |
| `/admin` | 관리자 대시보드(이메일 allowlist) — 주문/충전/회원 + 산출물 업로드·컨펌 현황 |
| `/tools/blog-writer` | AI 원고 작성 도구 (1건 1,000캐시) |
| `/terms`, `/privacy` | 약관/방침 (단독 페이지 + `LegalModal` 모달 공용) |

## 주요 파일

- `src/lib/analytics.ts` — `track(event, params)`. `dataLayer.push` 일원화, GTM 미설정 시 콘솔 폴백
- `src/lib/products.ts` — 15개 상품 + 그룹 2종(place-map, blog-pack) 카탈로그, `LANDING_CARDS`
- `src/lib/pricing.ts` — 주문 가능 단가표(그룹·행·amountKrw). 상세/스토리 가격과 반드시 동기화
- `src/lib/productStories.ts` — 상품별 스토리(불편 3·해결 3·시나리오 3)
- `src/lib/deliverables.ts` — 산출물 컨펌 도메인(관리자 업로드→고객 승인/수정요청)
- `src/lib/successStories.ts` — 성공 사례 더미 (수치+업종+기간)
- `src/lib/company.ts` — 푸터 사업자 정보 (더미값)
- `src/lib/legal.ts` — 약관/방침 본문 (모달·페이지 공용)
- `src/lib/payments.ts` — 결제 단일 진입점 (PortOne 키 없으면 stub, 적립은 서버 웹훅 전용)
- `src/components/AuthProvider.tsx` — 클라이언트 인증 컨텍스트 (stub). `hydrated` 플래그로
  세션 복원 완료를 알림 — 인증 기반 리다이렉트는 반드시 `hydrated`를 기다릴 것
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/not-found.tsx` — SEO/404
- 컴포넌트: `Landing`, `ServiceCard`, `SuccessStory`, `AuthEntry`, `Onboarding`, `LoginForm`, `SignupForm`, `LegalModal`, `SiteHeader`, `SiteFooter`, `KakaoButton`, `TrackedCta`

## 전환 이벤트 (6종)

`cta_click`(`product_slug`), `onboarding_step_view`(`step`), `onboarding_complete`,
`signup_start`, `signup_complete`, `login_success`. 모두 `dataLayer` push, GTM 미설정 시 콘솔 확인 가능.

## 환경 변수 / Stub

`.env.example` 참고 (GTM/GA4/Pixel/카카오/API URL placeholder). `.env.local`에 실제 값 주입.
Stub 지점은 `// TODO(backend):` 주석 표시. Supabase 키(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) 주입 시
실제 인증·캐시·주문·산출물로 자동 전환 (`supabase/schema.sql` + Edge Functions).

## 명령어

```bash
npm run dev    # 개발 서버
npm run build  # 프로덕션 빌드 (검증 완료)
npm run lint   # ESLint (clean)
```
