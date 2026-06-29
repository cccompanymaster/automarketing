# 결제(PG) 연동 가이드 — PortOne

캐시 충전을 PortOne(포트원) V2로 연동합니다. **실제 현금 적립은 클라이언트가 아니라
서버 웹훅(`supabase/functions/payment-webhook`)에서만** 일어납니다.

## 동작 구조
1. 회원이 충전 모달에서 금액 선택 → `payments.ts`가 PortOne 결제창 호출
2. 결제 완료 → PortOne이 `payment-webhook`로 웹훅 전송
3. 웹훅이 서명 검증 + PortOne API로 결제 재조회(금액·상태) → `charge_cash`(service_role)로 적립
4. 클라이언트는 잔액을 새로고침해 반영 (웹훅이 source of truth)

> PortOne 키가 없으면 자동으로 **테스트 충전(stub)** 모드로 동작합니다(실 결제 없음).

## 당신이 해야 할 일
1. **PortOne 가입 + 채널 설정**: https://portone.io → 결제대행사(PG) 채널 연결
2. **클라이언트 키**(상점/채널)를 배포 환경변수(또는 `.env.local`)에 추가:
   ```
   NEXT_PUBLIC_PORTONE_STORE_ID=store-...
   NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-...
   ```
   GitHub Pages 배포라면 `.github/workflows/deploy.yml`의 build env / 레포 Variables에도 추가.
3. **서버 시크릿**(웹훅 함수용, 클라이언트 노출 금지):
   ```
   supabase secrets set PORTONE_API_SECRET=...
   supabase secrets set PORTONE_WEBHOOK_SECRET=...
   supabase functions deploy payment-webhook --no-verify-jwt
   ```
4. **PortOne 콘솔 → 웹훅 URL**에 배포된 함수 주소 등록
   (`https://<project>.supabase.co/functions/v1/payment-webhook`)
5. **CSP 보강**(`docs/SECURITY_HEADERS.md`): 결제 활성화 시 아래 출처를 추가
   - `script-src`에 `https://cdn.portone.io`
   - `connect-src`에 `https://api.portone.io https://*.portone.io`
   - 결제창은 PG사에 따라 팝업/리다이렉트로 열릴 수 있습니다(일부는 `frame-src` 추가 필요).

## 남은 보강(권장)
- **멱등 처리**: `paymentId`를 별도 테이블에 저장해 동일 웹훅 재수신 시 중복 적립 방지.
- **결제 시도 기록**: 충전 시작 시 pending 행을 만들고 웹훅에서 상태 갱신(감사 추적).
- **전자금융거래법**: 선불 캐시 충전은 규모에 따라 선불전자지급수단 등록 검토 필요.
