# 실제 회원가입 + 캐시(포인트) 연동 가이드

현재 코드는 **키가 없으면 로컬 stub 모드**, **키를 채우면 자동으로 실제 Supabase 모드**로 동작합니다.
(코드 수정 없이 환경변수만 추가하면 됩니다.)

## 1. Supabase 프로젝트 생성
1. https://supabase.com 에서 프로젝트 생성 (무료 플랜 가능)
2. Project Settings → API 에서 다음 값 확인
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. 스키마 적용
- Supabase 대시보드 → **SQL Editor** → `supabase/schema.sql` 내용을 붙여넣고 실행
- 캐시 원장 테이블 + RLS + `charge_cash` RPC가 생성됩니다. (1원 = 1캐시)

## 3. 인증 설정
- Authentication → Providers → **Email** 활성화
- 즉시 가입 테스트를 원하면 “Confirm email”을 잠시 꺼두면 됩니다(운영 시 켜기 권장)
- (선택) 카카오 로그인: Providers → Kakao 활성화 후 키 입력

## 4. 환경변수 주입
`.env.local`(로컬) 또는 배포 환경변수에 추가:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> GitHub Pages(정적 배포)에서도 클라이언트에서 Supabase로 직접 통신하므로 그대로 동작합니다.
> 단, 빌드 시 환경변수가 주입돼야 하므로 배포 워크플로(`.github/workflows/deploy.yml`)의
> build 단계 env에 두 값을 추가하세요.

## 5. 충전(결제) — 다음 단계
- 현재 `src/lib/payments.ts`의 `requestCharge()`는 **테스트 충전**(실제 결제 없음)이며,
  실제(Supabase) 모드에서는 클라이언트 충전이 **의도적으로 차단**됩니다.
- `charge_cash` RPC는 `service_role` 에서만 호출 가능하도록 권한이 제한됩니다
  (`schema.sql`의 GRANT/REVOKE). 즉 **클라이언트는 캐시를 적립할 수 없습니다.**
- 실제 결제 흐름: PG(PortOne 등) 체크아웃 → **서버(웹훅)에서 결제 검증** →
  `service_role` 로 `charge_cash(p_amount, p_memo, p_uid)` 호출해 적립.
- 선불 캐시 충전은 규모에 따라 전자금융거래법(선불전자지급수단) 검토가 필요할 수 있습니다.

## 6. 보안 경계 요약 (반드시 확인)
- **클라이언트가 보낸 금액·성공 여부·잔액을 신뢰하지 않습니다.**
  - 충전(`charge_cash`): `service_role` 전용 — PG 웹훅 검증 후 서버에서만 적립.
  - 사용(`use_cash`): 로그인 사용자 호출 가능. 서버에서 잔액 확인·차감(원자적, 사용자별 advisory lock으로 동시성 보호).
  - 조회: RLS로 **본인 행만** 조회 가능. 직접 INSERT/UPDATE/DELETE는 RLS로 차단.
- **AI 원고(blog-writer Edge Function)**: JWT 인증 필수, 원고 생성 시 서버에서 `use_cash`로 차감.
  클라이언트는 실제 모드에서 차감하지 않고 잔액만 새로고침합니다.
- **관리자(/admin)**: 이메일 허용목록(`NEXT_PUBLIC_ADMIN_EMAILS`)은 **UI 노출 제어용**입니다.
  실제 관리자 데이터 조회는 RLS상 본인 행만 보이므로, 서버(`service_role`/관리자 역할 + 정책)로 구현해야 합니다.
- **보안 헤더/CSP**: 정적 export(GitHub Pages)는 응답 헤더를 설정할 수 없습니다.
  운영 시 CDN(Cloudflare 등)이나 헤더 설정이 가능한 호스팅을 앞단에 두고
  `Content-Security-Policy`(GTM용 nonce/hash 포함), `X-Frame-Options`/`frame-ancestors`,
  `Referrer-Policy`, `X-Content-Type-Options: nosniff`를 적용하세요.

## 동작 요약
| 상태 | 회원가입/로그인 | 캐시 지갑 | 충전 |
|---|---|---|---|
| 키 없음 (현재) | 로컬 stub | localStorage | 테스트 충전(로컬) |
| 키 있음 | 실제 Supabase Auth | Supabase DB (RLS) | PG 웹훅+서버 적립 (연동 필요) |
