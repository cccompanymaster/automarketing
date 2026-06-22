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
- 현재 `src/lib/payments.ts`의 `requestCharge()`는 **테스트 충전**(실제 결제 없음)입니다.
- 실제 결제는 PG(PortOne 등) 연동 + **서버측 결제 검증(웹훅)** 후 `charge_cash`를 호출하도록 교체해야 합니다.
  클라이언트에서 직접 캐시를 적립하면 안 됩니다.
- 선불 캐시 충전은 규모에 따라 전자금융거래법(선불전자지급수단) 검토가 필요할 수 있습니다.

## 동작 요약
| 상태 | 회원가입/로그인 | 캐시 지갑 |
|---|---|---|
| 키 없음 (현재) | 로컬 stub | localStorage |
| 키 있음 | 실제 Supabase Auth | Supabase DB (RLS) |
